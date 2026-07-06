import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../auth_controller.dart';
import '../theme.dart';
import '../widgets/premium_ui.dart';

class RegisterScreen extends StatefulWidget {
  final AuthController auth;
  const RegisterScreen({super.key, required this.auth});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final emailCtrl = TextEditingController();
  final claveCtrl = TextEditingController();
  final codigoCtrl = TextEditingController();
  bool acepta = false;
  bool loading = false;
  bool loadingConfirmar = false;
  bool esperandoCodigo = false;
  /// `true` si el último intento no pudo enviar correo (sin SMTP en el servidor).
  bool sinEnvioCorreo = false;
  bool verClave = false;

  String _msg(Object e) => e.toString().replaceFirst('Exception: ', '');

  IconData _iconoProveedor(String proveedor) {
    switch (proveedor) {
      case 'Google':
        return Icons.g_mobiledata;
      case 'Outlook':
        return Icons.mail_outline;
      case 'Apple':
        return Icons.apple;
      default:
        return Icons.login;
    }
  }

  void _reiniciarFlujoCodigo() {
    setState(() {
      esperandoCodigo = false;
      sinEnvioCorreo = false;
      codigoCtrl.clear();
    });
  }

  @override
  void dispose() {
    emailCtrl.dispose();
    claveCtrl.dispose();
    codigoCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Registro rápido')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          PremiumSectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const PremiumSectionTitle(
                  text: 'Registro rápido',
                  icon: Icons.person_add_alt_1_outlined,
                ),
                const SizedBox(height: 8),
                const Text('Regístrate para recibir el evangelio diario.'),
                const SizedBox(height: 14),
                TextField(
                  controller: emailCtrl,
                  decoration: const InputDecoration(labelText: 'Email'),
                  keyboardType: TextInputType.emailAddress,
                  enabled: !esperandoCodigo,
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: claveCtrl,
                  obscureText: !verClave,
                  enabled: !esperandoCodigo,
                  decoration: InputDecoration(
                    labelText: 'Clave',
                    suffixIcon: IconButton(
                      tooltip: verClave ? 'Ocultar clave' : 'Mostrar clave',
                      onPressed: () => setState(() => verClave = !verClave),
                      icon: Icon(verClave ? Icons.visibility_off : Icons.visibility),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                CheckboxListTile(
                  value: acepta,
                  onChanged: esperandoCodigo ? null : (v) => setState(() => acepta = v ?? false),
                  title: const Text('Acepto términos y condiciones'),
                  contentPadding: EdgeInsets.zero,
                ),
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton(
                    onPressed: esperandoCodigo ? null : () => Navigator.pushNamed(context, '/terms'),
                    child: const Text('Leer términos (simulados)'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          if (!esperandoCodigo && !acepta)
            Padding(
              padding: const EdgeInsets.only(bottom: 8, top: 4),
              child: Text(
                'Marca «Acepto términos y condiciones» para activar el botón Registrarme.',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade700, height: 1.3),
              ),
            ),
          if (esperandoCodigo) ...[
            const SizedBox(height: 8),
            Text(
              sinEnvioCorreo
                  ? 'El servidor no tiene configurado el envío de correo (GMAIL_APP_PASSWORD). '
                      'Mira la ventana de consola donde corre la API: allí aparece el código de 4 dígitos. '
                      'Luego escríbelo aquí.'
                  : 'Te enviamos un código de 4 dígitos al correo indicado. Revísalo y escribe el código aquí.',
              style: TextStyle(fontSize: 14, height: 1.35, color: Colors.grey.shade800),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: codigoCtrl,
              keyboardType: TextInputType.number,
              maxLength: 4,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 28, letterSpacing: 12, fontWeight: FontWeight.w600),
              decoration: const InputDecoration(
                labelText: 'Código de verificación',
                hintText: '0000',
                counterText: '',
              ),
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton(
                onPressed: loading ? null : _reiniciarFlujoCodigo,
                child: const Text('Usar otro correo'),
              ),
            ),
          ],
          const SizedBox(height: 8),
          if (!esperandoCodigo)
            FilledButton(
              onPressed: (loading || !acepta)
                  ? null
                  : () async {
                      if (emailCtrl.text.trim().isEmpty || claveCtrl.text.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Email y clave son requeridos.')));
                        return;
                      }
                      setState(() => loading = true);
                      try {
                        final enviado = await widget.auth.solicitarCodigoRegistro(emailCtrl.text.trim().toLowerCase());
                        if (context.mounted) {
                          setState(() {
                            esperandoCodigo = true;
                            sinEnvioCorreo = !enviado;
                          });
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                enviado
                                    ? 'Revisa tu correo: te enviamos un código de 4 dígitos.'
                                    : 'No se envió correo: el código está en la consola del servidor (configura GMAIL_APP_PASSWORD en .env).',
                              ),
                            ),
                          );
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_msg(e))));
                        }
                      } finally {
                        if (mounted) setState(() => loading = false);
                      }
                    },
              child: Text(loading ? 'Enviando...' : 'Registrarme'),
            )
          else
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                FilledButton(
                  onPressed: loadingConfirmar
                      ? null
                      : () async {
                          final cod = codigoCtrl.text.trim();
                          if (cod.length != 4) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Ingresa el código de 4 dígitos que recibiste por correo.')),
                            );
                            return;
                          }
                          setState(() => loadingConfirmar = true);
                          try {
                            await widget.auth.registroConCodigo(
                              emailCtrl.text.trim().toLowerCase(),
                              claveCtrl.text,
                              cod,
                            );
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_msg(e))));
                            }
                          } finally {
                            if (mounted) setState(() => loadingConfirmar = false);
                          }
                        },
                  child: Text(loadingConfirmar ? 'Verificando...' : 'Confirmar registro'),
                ),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: loading
                      ? null
                      : () async {
                          setState(() => loading = true);
                          try {
                            final enviado = await widget.auth.solicitarCodigoRegistro(emailCtrl.text.trim().toLowerCase());
                            if (context.mounted) {
                              setState(() => sinEnvioCorreo = !enviado);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    enviado ? 'Se reenvió el código a tu correo.' : 'Sin correo SMTP: revisa la consola del servidor para el código.',
                                  ),
                                ),
                              );
                            }
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_msg(e))));
                            }
                          } finally {
                            if (mounted) setState(() => loading = false);
                          }
                        },
                  child: Text(loading ? 'Enviando...' : 'Reenviar código'),
                ),
              ],
            ),
          const SizedBox(height: 18),
          const PremiumSectionTitle(text: 'o continuar con', icon: Icons.hub_outlined),
          const SizedBox(height: 8),
          for (final s in const ['Google', 'Outlook', 'Apple'])
            OutlinedButton(
              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Ingreso con $s (simulado en esta versión)')),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(_iconoProveedor(s), size: 20),
                  const SizedBox(width: 8),
                  Text(s),
                ],
              ),
            ),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: () => Navigator.pushNamed(context, '/login'),
            icon: const Icon(Icons.login),
            label: const Text('Ya tengo cuenta'),
            style: TextButton.styleFrom(
              foregroundColor: ReligiousTheme.texto,
              textStyle: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
