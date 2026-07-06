// ignore_for_file: deprecated_member_use
import 'package:flutter/material.dart';

import '../../CapaDTO/types.dart';
import '../auth_controller.dart';
import '../widgets/premium_ui.dart';

class SpiritualFiltersScreen extends StatefulWidget {
  final AuthController auth;
  final bool bloquearAtras;
  const SpiritualFiltersScreen({super.key, required this.auth, this.bloquearAtras = false});

  @override
  State<SpiritualFiltersScreen> createState() => _SpiritualFiltersScreenState();
}

class _SpiritualFiltersScreenState extends State<SpiritualFiltersScreen> {
  CatalogosEspirituales? catalogos;
  String idPapa = '';
  final Set<String> congregaciones = {};
  String idMirada = '';
  bool loading = true;
  bool saving = false;
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
      final cat = await widget.auth.catalogosEspirituales();
      final filtros = await widget.auth.obtenerFiltrosEspirituales();
      if (!mounted) return;
      setState(() {
        catalogos = cat;
        idPapa = filtros.idPapa;
        congregaciones
          ..clear()
          ..addAll(filtros.congregaciones);
        idMirada = filtros.idMirada;
        loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        err = e.toString().replaceFirst('Exception: ', '');
        loading = false;
      });
    }
  }

  void _toggleCongregacion(String id) {
    setState(() {
      if (congregaciones.contains(id)) {
        congregaciones.remove(id);
      } else if (congregaciones.length < 3) {
        congregaciones.add(id);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Puedes elegir máximo 3 congregaciones.')),
        );
      }
    });
  }

  Future<void> _guardar() async {
    if (congregaciones.isEmpty) {
      setState(() => err = 'Elige al menos 1 congregación.');
      return;
    }
    if (idMirada.isEmpty) {
      setState(() => err = 'Elige una mirada espiritual.');
      return;
    }
    setState(() {
      saving = true;
      err = null;
    });
    try {
      await widget.auth.guardarFiltrosEspirituales(FiltrosEspirituales(
        idPapa: idPapa,
        congregaciones: congregaciones.toList(),
        idMirada: idMirada,
        filtrosConfigurados: true,
      ));
      if (!mounted) return;
      if (widget.bloquearAtras) {
        Navigator.of(context).pushReplacementNamed('/home');
      } else {
        Navigator.pop(context);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        err = e.toString().replaceFirst('Exception: ', '');
        saving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cat = catalogos;

    return PopScope(
      canPop: !widget.bloquearAtras,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Tu mirada espiritual'),
          automaticallyImplyLeading: !widget.bloquearAtras,
        ),
        body: loading
            ? const Center(child: CircularProgressIndicator())
            : cat == null
                ? Center(child: Text(err ?? 'No se pudo cargar', style: tt.bodyLarge))
                : ListView(
                    padding: const EdgeInsets.all(18),
                    children: [
                      Text(
                        'Personaliza reflexiones y preguntas según tu camino espiritual (perfil Plus).',
                        style: tt.bodyMedium?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                      ),
                      const SizedBox(height: 16),
                      PremiumSectionCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('1. Papa (opcional)', style: tt.titleMedium),
                            const SizedBox(height: 8),
                            RadioListTile<String>(
                              title: const Text('Ninguno'),
                              value: '',
                              groupValue: idPapa,
                              onChanged: saving ? null : (v) => setState(() => idPapa = v ?? ''),
                            ),
                            ...cat.papas.map(
                              (p) => RadioListTile<String>(
                                title: Text(p.nomPapa),
                                subtitle: Text(
                                  '${p.pontificado}\n${p.cuandoElegirlo}',
                                  style: tt.bodySmall,
                                ),
                                value: p.idPapa,
                                groupValue: idPapa,
                                onChanged: saving ? null : (v) => setState(() => idPapa = v ?? ''),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      PremiumSectionCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('2. Congregaciones (1 a 3)', style: tt.titleMedium),
                            Text(
                              'Seleccionadas: ${congregaciones.length}/3',
                              style: tt.bodySmall,
                            ),
                            const SizedBox(height: 8),
                            ...cat.congregaciones.map(
                              (c) => CheckboxListTile(
                                title: Text(c.nomCongregacion),
                                subtitle: Text(c.enfoqueEditorial, style: tt.bodySmall),
                                value: congregaciones.contains(c.idCongregacion),
                                onChanged: saving
                                    ? null
                                    : (_) => _toggleCongregacion(c.idCongregacion),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      PremiumSectionCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('3. Mirada espiritual', style: tt.titleMedium),
                            const SizedBox(height: 8),
                            ...[
                              ...cat.miradas.where((m) => m.idMirada == 'ninguna_holistica'),
                              ...cat.miradas.where((m) => m.idMirada != 'ninguna_holistica'),
                            ].map(
                              (m) => RadioListTile<String>(
                                title: Text(
                                  m.idMirada == 'ninguna_holistica'
                                      ? 'Ninguna mirada espiritual'
                                      : m.nomMirada,
                                ),
                                subtitle: Text(m.descripcion, style: tt.bodySmall),
                                value: m.idMirada,
                                groupValue: idMirada,
                                onChanged: saving ? null : (v) => setState(() => idMirada = v ?? ''),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (err != null) ...[
                        const SizedBox(height: 12),
                        Text(err!, style: tt.bodyMedium?.copyWith(color: Colors.red.shade700)),
                      ],
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: saving ? null : _guardar,
                          child: Text(saving ? 'Guardando…' : 'Guardar configuración'),
                        ),
                      ),
                    ],
                  ),
      ),
    );
  }
}
