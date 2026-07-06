import 'package:flutter/material.dart';

import '../auth_controller.dart';
import '../theme.dart';
import '../../capaConexion/storage.dart';
import '../widgets/premium_ui.dart';

class LoginScreen extends StatefulWidget {
  final AuthController auth;
  const LoginScreen({super.key, required this.auth});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final emailCtrl = TextEditingController();
  final claveCtrl = TextEditingController();
  final _storage = Storage();
  bool loading = false;
  bool verClave = false;
  bool recordarCredenciales = false;
  String? errorTexto;

  String _mensajeError(Object e) {
    var s = e.toString();
    if (s.startsWith('Exception: ')) s = s.substring('Exception: '.length);
    return s.trim();
  }

  @override
  void initState() {
    super.initState();
    _cargarCredencialesGuardadas();
  }

  Future<void> _cargarCredencialesGuardadas() async {
    final recordar = await _storage.getRecordarCredenciales();
    final cred = await _storage.getCredencialesRecordadas();
    if (!mounted) return;
    setState(() {
      recordarCredenciales = recordar;
      if (cred != null) {
        emailCtrl.text = cred.$1;
        claveCtrl.text = cred.$2;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Iniciar sesión')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          PremiumSectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const PremiumSectionTitle(
                  text: 'Acceso a tu cuenta',
                  icon: Icons.lock_open_outlined,
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: emailCtrl,
                  decoration: const InputDecoration(labelText: 'Email'),
                  keyboardType: TextInputType.emailAddress,
                  onChanged: (_) => setState(() => errorTexto = null),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: claveCtrl,
                  obscureText: !verClave,
                  onChanged: (_) => setState(() => errorTexto = null),
                  decoration: InputDecoration(
                    labelText: 'Clave',
                    suffixIcon: IconButton(
                      tooltip: verClave ? 'Ocultar clave' : 'Mostrar clave',
                      onPressed: () => setState(() => verClave = !verClave),
                      icon: Icon(verClave ? Icons.visibility_off : Icons.visibility),
                    ),
                  ),
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: recordarCredenciales,
                  onChanged: (v) => setState(() => recordarCredenciales = v ?? false),
                  title: const Text('Recordar credenciales'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (errorTexto != null) ...[
            PremiumSectionCard(
              color: Colors.red.shade50,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.error_outline, color: Colors.red.shade800, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      errorTexto!,
                      style: TextStyle(color: Colors.red.shade900, height: 1.35),
                    ),
                  ),
                ],
              ),
            ),
          ],
          FilledButton.icon(
            icon: const Icon(Icons.login),
            onPressed: loading
                ? null
                : () async {
                    final email = emailCtrl.text.trim().toLowerCase();
                    final clave = claveCtrl.text;
                    if (email.isEmpty || clave.isEmpty) {
                      setState(() {
                        errorTexto = 'Escribe tu correo y tu clave para continuar.';
                      });
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Faltan el correo o la clave.')),
                        );
                      }
                      return;
                    }
                    setState(() {
                      loading = true;
                      errorTexto = null;
                    });
                    try {
                      await widget.auth.login(email, clave);
                      await _storage.setCredencialesRecordadas(
                        recordar: recordarCredenciales,
                        email: email,
                        clave: clave,
                      );
                      if (context.mounted) {
                        Navigator.pushNamedAndRemoveUntil(context, '/home', (_) => false);
                      }
                    } catch (e) {
                      final msg = _mensajeError(e);
                      if (mounted) setState(() => errorTexto = msg);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(msg),
                            backgroundColor: ReligiousTheme.texto,
                            duration: const Duration(seconds: 5),
                          ),
                        );
                      }
                    } finally {
                      if (mounted) setState(() => loading = false);
                    }
                  },
            label: Text(loading ? 'Ingresando...' : 'Entrar'),
          ),
        ],
      ),
    );
  }
}

