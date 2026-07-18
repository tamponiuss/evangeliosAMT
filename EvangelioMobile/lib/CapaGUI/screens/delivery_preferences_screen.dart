import 'package:flutter/material.dart';

import '../../CapaDTO/types.dart';
import '../auth_controller.dart';
import '../widgets/premium_ui.dart';

/// Configuración de cómo y cuándo recibir el evangelio diario.
class DeliveryPreferencesScreen extends StatefulWidget {
  final AuthController auth;
  const DeliveryPreferencesScreen({super.key, required this.auth});

  @override
  State<DeliveryPreferencesScreen> createState() => _DeliveryPreferencesScreenState();
}

class _DeliveryPreferencesScreenState extends State<DeliveryPreferencesScreen> {
  late bool porEmail;
  late bool porAPP;
  late bool porWSP;
  late bool porInstagram;
  late TextEditingController celularCtrl;
  late TextEditingController instagramCtrl;
  TimeOfDay? horaEnvio;
  bool guardando = false;

  @override
  void initState() {
    super.initState();
    final u = widget.auth.usuario;
    porEmail = u?.porEmail ?? false;
    porAPP = u?.porAPP ?? true;
    porWSP = u?.porWSP ?? false;
    porInstagram = u?.porInstagram ?? false;
    celularCtrl = TextEditingController(text: u?.numCelular ?? '');
    instagramCtrl = TextEditingController(text: u?.cuentaInstagram ?? '');
    horaEnvio = _parseHora(u?.horaEnvio ?? '');
  }

  @override
  void dispose() {
    celularCtrl.dispose();
    instagramCtrl.dispose();
    super.dispose();
  }

  TimeOfDay? _parseHora(String s) {
    final m = RegExp(r'^(\d{1,2}):(\d{2})$').firstMatch(s.trim());
    if (m == null) return null;
    final h = int.tryParse(m.group(1)!);
    final min = int.tryParse(m.group(2)!);
    if (h == null || min == null || h > 23 || min > 59) return null;
    return TimeOfDay(hour: h, minute: min);
  }

  String _horaTexto() {
    if (horaEnvio == null) return 'No definida';
    final h = horaEnvio!.hour.toString().padLeft(2, '0');
    final m = horaEnvio!.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  String _horaParaApi() {
    if (horaEnvio == null) return '';
    final h = horaEnvio!.hour.toString().padLeft(2, '0');
    final m = horaEnvio!.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  Future<void> _elegirHora() async {
    final t = await showTimePicker(
      context: context,
      initialTime: horaEnvio ?? const TimeOfDay(hour: 7, minute: 0),
      helpText: 'Hora para recibir el evangelio',
    );
    if (t != null) setState(() => horaEnvio = t);
  }

  Future<void> _guardar() async {
    if (porWSP && celularCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Para WhatsApp escribe tu número de celular.')),
      );
      return;
    }
    if (porInstagram && instagramCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Para Instagram escribe tu cuenta.')),
      );
      return;
    }
    setState(() => guardando = true);
    try {
      await widget.auth.guardarPreferenciasEntrega(
        PreferenciasEntrega(
          porEmail: porEmail,
          porAPP: porAPP,
          porWSP: porWSP,
          porInstagram: porInstagram,
          numCelular: celularCtrl.text.trim(),
          cuentaInstagram: instagramCtrl.text.trim(),
          horaEnvio: _horaParaApi(),
        ),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Preferencias guardadas.')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      final msg = e.toString().replaceFirst('Exception: ', '');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    } finally {
      if (mounted) setState(() => guardando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final email = widget.auth.usuario?.email ?? '';
    return Scaffold(
      appBar: AppBar(title: const Text('Recibir el evangelio')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          PremiumSectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const PremiumSectionTitle(
                  text: 'Canales de entrega',
                  icon: Icons.send_outlined,
                ),
                const SizedBox(height: 6),
                Text(
                  'Elige cómo quieres recibir el evangelio de cada día.',
                  style: TextStyle(color: Colors.grey.shade700, height: 1.3),
                ),
                const SizedBox(height: 8),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: porAPP,
                  onChanged: (v) => setState(() => porAPP = v),
                  title: const Text('En la aplicación'),
                  subtitle: const Text('Consultar el evangelio al abrir TuMirada'),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: porEmail,
                  onChanged: (v) => setState(() => porEmail = v),
                  title: const Text('Por email'),
                  subtitle: Text(email.isEmpty ? 'Tu correo registrado' : email),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: porWSP,
                  onChanged: (v) => setState(() => porWSP = v),
                  title: const Text('Por WhatsApp'),
                  subtitle: const Text('Próximamente — deja tu número listo'),
                ),
                if (porWSP)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: TextField(
                      controller: celularCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Celular (con código de país)',
                        hintText: '+56 9 1234 5678',
                      ),
                    ),
                  ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: porInstagram,
                  onChanged: (v) => setState(() => porInstagram = v),
                  title: const Text('Por Instagram'),
                  subtitle: const Text('Próximamente — deja tu cuenta lista'),
                ),
                if (porInstagram)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: TextField(
                      controller: instagramCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Cuenta de Instagram',
                        hintText: '@tucuenta',
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          PremiumSectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const PremiumSectionTitle(
                  text: 'Horario de envío',
                  icon: Icons.schedule_outlined,
                ),
                const SizedBox(height: 6),
                Text(
                  'Hora a la que prefieres recibir el evangelio cada día.',
                  style: TextStyle(color: Colors.grey.shade700, height: 1.3),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Hora: ${_horaTexto()}',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: _elegirHora,
                      icon: const Icon(Icons.access_time, size: 18),
                      label: const Text('Elegir hora'),
                    ),
                  ],
                ),
                if (horaEnvio != null)
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton(
                      onPressed: () => setState(() => horaEnvio = null),
                      child: const Text('Quitar hora'),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          FilledButton.icon(
            onPressed: guardando ? null : _guardar,
            icon: const Icon(Icons.save_outlined),
            label: Text(guardando ? 'Guardando...' : 'Guardar preferencias'),
          ),
        ],
      ),
    );
  }
}
