import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../auth_controller.dart';

/// Recuperar clave: correo → código de 4 dígitos → clave nueva. Entra automático.
class RecoverPasswordScreen extends StatefulWidget {
  final AuthController auth;
  const RecoverPasswordScreen({super.key, required this.auth});

  @override
  State<RecoverPasswordScreen> createState() => _RecoverPasswordScreenState();
}

class _RecoverPasswordScreenState extends State<RecoverPasswordScreen> {
  final emailCtrl = TextEditingController();
  final codigoCtrl = TextEditingController();
  final claveCtrl = TextEditingController();
  bool enviando = false;
  bool guardando = false;
  bool esperandoCodigo = false;
  bool verClave = false;
  String? errorTexto;
  String? infoTexto;

  bool get ocupado => enviando || guardando;

  String _msg(Object e) => e.toString().replaceFirst('Exception: ', '');

  @override
  void initState() {
    super.initState();
    widget.auth.addListener(_siYaEntroCerrar);
  }

  void _siYaEntroCerrar() {
    if (!mounted || !widget.auth.autenticado) return;
    Navigator.of(context).popUntil((r) => r.isFirst);
  }

  @override
  void dispose() {
    widget.auth.removeListener(_siYaEntroCerrar);
    emailCtrl.dispose();
    codigoCtrl.dispose();
    claveCtrl.dispose();
    super.dispose();
  }

  Future<void> _enviarCodigo() async {
    final email = emailCtrl.text.trim().toLowerCase();
    if (email.isEmpty) {
      setState(() => errorTexto = 'Escribe tu correo.');
      return;
    }
    setState(() {
      enviando = true;
      errorTexto = null;
      infoTexto = null;
    });
    try {
      await widget.auth.solicitarRecuperacionClave(email);
      if (mounted) {
        setState(() {
          esperandoCodigo = true;
          infoTexto = 'Revisa tu correo (y Spam). Te enviamos un código de 4 dígitos.';
        });
      }
    } catch (e) {
      if (mounted) setState(() => errorTexto = _msg(e));
    } finally {
      if (mounted) setState(() => enviando = false);
    }
  }

  Future<void> _guardarClave() async {
    FocusScope.of(context).unfocus();
    final email = emailCtrl.text.trim().toLowerCase();
    final codigo = codigoCtrl.text.trim();
    final clave = claveCtrl.text;
    if (codigo.length != 4) {
      setState(() => errorTexto = 'El código tiene 4 números.');
      return;
    }
    if (clave.length < 4) {
      setState(() => errorTexto = 'La clave nueva debe tener al menos 4 caracteres.');
      return;
    }
    setState(() {
      guardando = true;
      errorTexto = null;
    });
    try {
      await widget.auth.completarRecuperacionClave(email, codigo, clave);
      if (mounted) {
        Navigator.of(context).popUntil((r) => r.isFirst);
      }
    } catch (e) {
      if (mounted) {
        setState(() => errorTexto = _msg(e));
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_msg(e))));
      }
    } finally {
      if (mounted) setState(() => guardando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Recuperar clave')),
      body: ListView(
        padding: const EdgeInsets.all(22),
        children: [
          const Text(
            'Te enviamos un código al correo y eliges una clave nueva. Es rápido.',
            style: TextStyle(height: 1.4, fontSize: 16),
          ),
          const SizedBox(height: 18),
          TextField(
            controller: emailCtrl,
            enabled: !esperandoCodigo,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Tu correo'),
          ),
          if (!esperandoCodigo) ...[
            const SizedBox(height: 20),
            FilledButton(
              onPressed: ocupado ? null : _enviarCodigo,
              child: Text(enviando ? 'Enviando…' : 'Enviar código'),
            ),
          ] else ...[
            const SizedBox(height: 16),
            TextField(
              controller: codigoCtrl,
              keyboardType: TextInputType.number,
              maxLength: 4,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 28, letterSpacing: 12, fontWeight: FontWeight.w600),
              decoration: const InputDecoration(
                labelText: 'Código',
                hintText: '0000',
                counterText: '',
              ),
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            ),
            const SizedBox(height: 10),
            TextField(
              controller: claveCtrl,
              obscureText: !verClave,
              decoration: InputDecoration(
                labelText: 'Clave nueva',
                suffixIcon: IconButton(
                  onPressed: () => setState(() => verClave = !verClave),
                  icon: Icon(verClave ? Icons.visibility_off : Icons.visibility),
                ),
              ),
            ),
            const SizedBox(height: 10),
            if (errorTexto != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text(errorTexto!, style: TextStyle(color: Colors.red.shade800, height: 1.35, fontSize: 16)),
              ),
            FilledButton(
              onPressed: ocupado ? null : _guardarClave,
              child: Text(guardando ? 'Guardando…' : 'Guardar y entrar'),
            ),
            TextButton(
              onPressed: ocupado
                  ? null
                  : () {
                      setState(() {
                        esperandoCodigo = false;
                        codigoCtrl.clear();
                        claveCtrl.clear();
                        errorTexto = null;
                        infoTexto = null;
                      });
                    },
              child: const Text('Usar otro correo'),
            ),
            TextButton(
              onPressed: ocupado ? null : _enviarCodigo,
              child: Text(enviando ? 'Enviando…' : 'Reenviar código'),
            ),
          ],
          if (infoTexto != null) ...[
            const SizedBox(height: 12),
            Text(infoTexto!, style: TextStyle(color: Colors.green.shade800, height: 1.35)),
          ],
        ],
      ),
    );
  }
}
