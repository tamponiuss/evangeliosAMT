import 'package:flutter/material.dart';

import '../auth_controller.dart';
import '../theme.dart';
import '../../capaConexion/storage.dart';
import '../widgets/botones_registro_social.dart';
import '../widgets/premium_ui.dart';

/// Pantalla de arranque: entrar si ya hay cuenta; si no, registrarse o recuperar clave.
class WelcomeScreen extends StatefulWidget {
  final AuthController auth;
  const WelcomeScreen({super.key, required this.auth});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  final emailCtrl = TextEditingController();
  final claveCtrl = TextEditingController();
  final _storage = Storage();
  bool loading = false;
  bool verClave = false;
  bool recordar = false;
  String? errorTexto;

  String _msg(Object e) {
    var s = e.toString();
    if (s.startsWith('Exception: ')) s = s.substring('Exception: '.length);
    return s.trim();
  }

  @override
  void initState() {
    super.initState();
    _precargarRecordados();
  }

  Future<void> _precargarRecordados() async {
    final recordarPrev = await _storage.getRecordarCredenciales();
    final cred = await _storage.getCredencialesRecordadas();
    if (!mounted) return;
    setState(() {
      recordar = recordarPrev;
      if (cred != null) {
        emailCtrl.text = cred.$1;
        claveCtrl.text = cred.$2;
      }
    });
  }

  @override
  void dispose() {
    emailCtrl.dispose();
    claveCtrl.dispose();
    super.dispose();
  }

  Future<void> _entrar() async {
    final email = emailCtrl.text.trim().toLowerCase();
    final clave = claveCtrl.text;
    if (email.isEmpty || clave.isEmpty) {
      setState(() => errorTexto = 'Escribe tu correo y tu clave.');
      return;
    }
    setState(() {
      loading = true;
      errorTexto = null;
    });
    try {
      await widget.auth.login(email, clave);
      await _storage.setCredencialesRecordadas(recordar: recordar, email: email, clave: clave);
    } catch (e) {
      if (mounted) setState(() => errorTexto = _msg(e));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(22, 36, 22, 24),
          children: [
            Text(
              'TuMirada',
              textAlign: TextAlign.center,
              style: tt.titleLarge?.copyWith(
                color: ReligiousTheme.texto,
                fontSize: 32,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Evangelio y reflexión de cada día',
              textAlign: TextAlign.center,
              style: tt.bodyLarge?.copyWith(color: Colors.grey.shade700),
            ),
            const SizedBox(height: 28),
            PremiumSectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    onChanged: (_) => setState(() => errorTexto = null),
                    decoration: const InputDecoration(labelText: 'Tu correo'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: claveCtrl,
                    obscureText: !verClave,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => loading ? null : _entrar(),
                    onChanged: (_) => setState(() => errorTexto = null),
                    decoration: InputDecoration(
                      labelText: 'Tu clave',
                      suffixIcon: IconButton(
                        tooltip: verClave ? 'Ocultar' : 'Mostrar',
                        onPressed: () => setState(() => verClave = !verClave),
                        icon: Icon(verClave ? Icons.visibility_off : Icons.visibility),
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  CheckboxListTile(
                    value: recordar,
                    contentPadding: EdgeInsets.zero,
                    controlAffinity: ListTileControlAffinity.leading,
                    onChanged: loading
                        ? null
                        : (v) => setState(() => recordar = v ?? false),
                    title: const Text('Recordarme'),
                    subtitle: const Text('No volver a escribir correo y clave en este dispositivo'),
                  ),
                  if (widget.auth.avisoSesion != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      widget.auth.avisoSesion!,
                      style: TextStyle(color: Colors.grey.shade800, height: 1.35),
                    ),
                  ],
                  if (errorTexto != null) ...[
                    const SizedBox(height: 12),
                    Text(errorTexto!, style: TextStyle(color: Colors.red.shade800, height: 1.35)),
                  ],
                  const SizedBox(height: 18),
                  FilledButton(
                    onPressed: loading ? null : _entrar,
                    child: Text(loading ? 'Entrando…' : 'Entrar'),
                  ),
                  const SizedBox(height: 16),
                  BotonesRegistroSocial(
                    auth: widget.auth,
                    habilitado: !loading,
                    titulo: 'O entra / crea cuenta con',
                    motivoBloqueo: 'Espera a que termine el inicio de sesión.',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: loading ? null : () => Navigator.pushNamed(context, '/recover-password'),
              child: const Text('Olvidé mi clave'),
            ),
            const SizedBox(height: 4),
            OutlinedButton(
              onPressed: loading ? null : () => Navigator.pushNamed(context, '/register'),
              child: const Text('Soy nuevo: crear cuenta'),
            ),
          ],
        ),
      ),
    );
  }
}
