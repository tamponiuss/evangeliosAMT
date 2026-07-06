import 'package:flutter/material.dart';

import '../../CapaDTO/types.dart';
import '../auth_controller.dart';
import '../widgets/premium_ui.dart';

class PlusUpgradeScreen extends StatefulWidget {
  final AuthController auth;
  const PlusUpgradeScreen({super.key, required this.auth});

  @override
  State<PlusUpgradeScreen> createState() => _PlusUpgradeScreenState();
}

class _PlusUpgradeScreenState extends State<PlusUpgradeScreen> {
  ParametroApp? tarifa;
  bool loading = true;
  bool paying = false;
  String? err;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() {
      loading = true;
      err = null;
    });
    try {
      final t = await widget.auth.obtenerTarifaPlus();
      setState(() {
        tarifa = t;
        loading = false;
      });
    } catch (e) {
      setState(() {
        err = e.toString().replaceFirst('Exception: ', '');
        loading = false;
      });
    }
  }

  Future<void> _pagar() async {
    final t = tarifa;
    if (t == null || !t.activo || t.monto <= 0) return;

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirmar pago'),
        content: Text(
          'Se activará tu suscripción Plus por ${t.etiquetaPrecio}.\n\n'
          'Podrás configurar Papa, congregaciones y mirada espiritual para reflexiones personalizadas.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Pagar')),
        ],
      ),
    );
    if (ok != true || !mounted) return;

    setState(() {
      paying = true;
      err = null;
    });
    try {
      await widget.auth.pagarSuscripcionPlus();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('¡Suscripción Plus activada!')),
      );
      Navigator.pushReplacementNamed(context, '/spiritual-filters');
    } catch (e) {
      setState(() {
        err = e.toString().replaceFirst('Exception: ', '');
        paying = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final t = tarifa;

    return Scaffold(
      appBar: AppBar(title: const Text('Suscripción Plus')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(18),
              children: [
                Text(
                  'Personaliza tus reflexiones y preguntas según tu camino espiritual.',
                  style: tt.bodyLarge,
                ),
                const SizedBox(height: 16),
                PremiumSectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Beneficios Plus', style: tt.titleMedium),
                      const SizedBox(height: 12),
                      const _Beneficio(text: 'Elegir un Papa de referencia (opcional)'),
                      const _Beneficio(text: 'Elegir 1 a 3 congregaciones'),
                      const _Beneficio(text: 'Elegir tu mirada espiritual'),
                      const _Beneficio(text: 'Reflexiones y preguntas adaptadas a ti'),
                      const _Beneficio(text: 'Modificar tu configuración cuando quieras'),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                if (t != null && t.activo && t.monto > 0) ...[
                  PremiumSectionCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Tarifa', style: tt.titleMedium),
                        const SizedBox(height: 8),
                        Text(t.etiquetaPrecio, style: tt.headlineSmall),
                        const SizedBox(height: 8),
                        Text(t.descripcion, style: tt.bodyMedium),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: paying ? null : _pagar,
                      child: Text(paying ? 'Procesando pago…' : 'Pagar y activar Plus'),
                    ),
                  ),
                ] else ...[
                  Text(
                    t == null
                        ? 'No se pudo cargar la tarifa.'
                        : 'La suscripción Plus no está disponible en este momento.',
                    style: tt.bodyMedium?.copyWith(color: Theme.of(context).colorScheme.error),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(onPressed: _cargar, child: const Text('Reintentar')),
                ],
                if (err != null) ...[
                  const SizedBox(height: 12),
                  Text(err!, style: tt.bodyMedium?.copyWith(color: Colors.red.shade700)),
                ],
              ],
            ),
    );
  }
}

class _Beneficio extends StatelessWidget {
  final String text;
  const _Beneficio({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.check_circle_outline, size: 20, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 8),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
