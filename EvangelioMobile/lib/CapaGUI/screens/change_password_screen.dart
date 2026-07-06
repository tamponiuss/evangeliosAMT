import 'package:flutter/material.dart';

import '../auth_controller.dart';
import '../widgets/premium_ui.dart';

class ChangePasswordScreen extends StatefulWidget {
  final AuthController auth;
  const ChangePasswordScreen({super.key, required this.auth});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final actualCtrl = TextEditingController();
  final nuevaCtrl = TextEditingController();
  final repetirCtrl = TextEditingController();
  bool loading = false;
  bool verActual = false;
  bool verNueva = false;
  bool verRepetir = false;

  static Widget _botonVolver(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: FilledButton.icon(
        onPressed: () => Navigator.of(context).maybePop(),
        icon: const Icon(Icons.arrow_back, size: 28),
        label: const Text(
          'Volver',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
        ),
        style: FilledButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 24),
          minimumSize: const Size(double.infinity, 56),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cambiar clave'),
        automaticallyImplyLeading: false,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _botonVolver(context),
          const SizedBox(height: 16),
          PremiumSectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const PremiumSectionTitle(
                  text: 'Seguridad de la cuenta',
                  icon: Icons.security_outlined,
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: actualCtrl,
                  obscureText: !verActual,
                  decoration: InputDecoration(
                    labelText: 'Clave actual',
                    suffixIcon: IconButton(
                      tooltip: verActual ? 'Ocultar clave' : 'Mostrar clave',
                      onPressed: () => setState(() => verActual = !verActual),
                      icon: Icon(verActual ? Icons.visibility_off : Icons.visibility),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: nuevaCtrl,
                  obscureText: !verNueva,
                  decoration: InputDecoration(
                    labelText: 'Clave nueva',
                    suffixIcon: IconButton(
                      tooltip: verNueva ? 'Ocultar clave' : 'Mostrar clave',
                      onPressed: () => setState(() => verNueva = !verNueva),
                      icon: Icon(verNueva ? Icons.visibility_off : Icons.visibility),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: repetirCtrl,
                  obscureText: !verRepetir,
                  decoration: InputDecoration(
                    labelText: 'Repetir clave nueva',
                    suffixIcon: IconButton(
                      tooltip: verRepetir ? 'Ocultar clave' : 'Mostrar clave',
                      onPressed: () => setState(() => verRepetir = !verRepetir),
                      icon: Icon(verRepetir ? Icons.visibility_off : Icons.visibility),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            icon: const Icon(Icons.save_outlined),
            onPressed: loading
                ? null
                : () async {
                    if (actualCtrl.text.isEmpty || nuevaCtrl.text.isEmpty || repetirCtrl.text.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Completa todos los campos de clave.')),
                      );
                      return;
                    }
                    if (nuevaCtrl.text != repetirCtrl.text) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('La nueva clave y su repetición deben ser iguales.')),
                      );
                      return;
                    }
                    setState(() => loading = true);
                    try {
                      await widget.auth.cambiarClave(actualCtrl.text, nuevaCtrl.text);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Clave actualizada.')));
                        actualCtrl.clear();
                        nuevaCtrl.clear();
                        repetirCtrl.clear();
                      }
                    } catch (e) {
                      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                    } finally {
                      if (mounted) setState(() => loading = false);
                    }
                  },
            label: Text(loading ? 'Guardando...' : 'Guardar'),
          ),
          const SizedBox(height: 16),
          _botonVolver(context),
        ],
      ),
    );
  }
}

