import 'package:flutter/material.dart';

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  static Widget _volverButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: FilledButton.icon(
        onPressed: () => Navigator.of(context).pop(),
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
        title: const Text('Términos y condiciones'),
        automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _volverButton(context),
            const SizedBox(height: 16),
            const Expanded(
              child: SingleChildScrollView(
                child: Text(
                  'Versión simulada:\n\n'
                  'Al usar esta app aceptas consultar contenidos religiosos diarios en la aplicación. '
                  'Puedes modificar tu mirada espiritual (usuarios Plus) y tu clave en cualquier momento.\n\n'
                  'Estos términos serán reemplazados por los definitivos en una siguiente versión.',
                  style: TextStyle(height: 1.5),
                ),
              ),
            ),
            const SizedBox(height: 16),
            _volverButton(context),
          ],
        ),
      ),
    );
  }
}
