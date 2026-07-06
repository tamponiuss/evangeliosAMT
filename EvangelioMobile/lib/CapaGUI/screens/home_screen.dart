import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../CapaDTO/types.dart';
import '../../CapaNegocio/evangelio_negocio.dart';
import '../../CapaServicios/api_service.dart';
import '../auth_controller.dart';
import '../theme.dart';
import '../widgets/evangelio_texto.dart';
import '../widgets/premium_ui.dart';

class HomeScreen extends StatefulWidget {
  final AuthController auth;
  const HomeScreen({super.key, required this.auth});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _negocio = EvangelioNegocio(ApiService());
  DateTime fecha = DateTime.now();
  EvangelioDTO? data;
  bool loading = false;

  @override
  void initState() {
    super.initState();
    _buscar();
  }

  String get fechaIso => DateFormat('yyyy-MM-dd').format(fecha);
  String get fechaVista => DateFormat('dd/MM/yyyy').format(fecha);

  /// Recorta cola «Primera lectura» si el API aún la envía (respaldo del formateo servidor).
  String _contenidoSinColaPrimeraLectura(String raw) {
    final t = raw.trimRight();
    final lower = t.toLowerCase();
    const needle = 'primera lectura';
    var last = -1;
    var from = 0;
    while (true) {
      final j = lower.indexOf(needle, from);
      if (j < 0) break;
      last = j;
      from = j + 1;
    }
    if (last < 0 || last < 200) return t;
    return t
        .substring(0, last)
        .replaceAll(RegExp(r'[\s*_#]+$'), '')
        .trimRight();
  }

  /// Si el servidor antiguo dejó «Primera lectura» como título, usa «Evangelio según …» del cuerpo.
  String _tituloEvangelioParaMostrar(String tituloApi, String contenidoTexto) {
    var t = tituloApi.replaceAll(RegExp(r'\*+'), '').replaceAll(RegExp(r'\s+'), ' ').trim();
    if (t.isEmpty) return 'Evangelio del día';
    final norm = t.replaceAll(RegExp(r'[#_]+'), '').trim();
    final ajeno = RegExp(r'^((primera|segunda)\s+lectura)$',
            caseSensitive: false)
            .hasMatch(norm) ||
        RegExp(r'^salmo(\s|$)', caseSensitive: false).hasMatch(norm);
    if (!ajeno) return tituloApi.trim();

    final lower = contenidoTexto.toLowerCase();
    const mar = 'evangelio según';
    final i = lower.indexOf(mar);
    if (i < 0) return 'Evangelio del día';

    final end = (i + 650 <= contenidoTexto.length) ? i + 650 : contenidoTexto.length;
    final resto = contenidoTexto.substring(i, end);

    String? mejor;
    for (final ln0 in resto.split(RegExp(r'\r?\n'))) {
      final ln = ln0.replaceAll(RegExp(r'\s+'), ' ').trim();
      if (ln.toLowerCase().contains('evangelio según')) {
        mejor = ln;
        break;
      }
    }
    if (mejor != null && mejor.length >= 16 && mejor.length < 620) return mejor;

    final colapsado = resto.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (colapsado.length >= 16 && colapsado.length < 620) return colapsado;
    return 'Evangelio del día';
  }

  Future<void> _buscar() async {
    final token = widget.auth.token;
    if (token == null) return;
    setState(() => loading = true);
    try {
      final r = await _negocio.obtener(token, fechaIso);
      setState(() => data = r);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    final d = data;
    final contenidoTarjeta =
        d == null ? '' : _contenidoSinColaPrimeraLectura(d.contenido);
    final tituloTarjeta =
        d == null ? '' : _tituloEvangelioParaMostrar(d.titulo, contenidoTarjeta);

    return Scaffold(
      appBar: AppBar(title: const Text('Evangelio diario')),
      drawer: Drawer(
        child: ListView(
          children: [
            DrawerHeader(
              child: Text('Menú', style: tt.titleMedium?.copyWith(color: ReligiousTheme.texto)),
            ),
            ListTile(
              title: const Text('Evangelio diario'),
              onTap: () => Navigator.pop(context),
            ),
            if (!esPerfilPlus(widget.auth.usuario?.idPerfil ?? ''))
              ListTile(
                leading: Icon(Icons.workspace_premium_outlined, color: cs.primary),
                title: const Text('Hazte usuario Plus'),
                subtitle: const Text('Reflexiones personalizadas'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/plus-upgrade');
                },
              ),
            if (esPerfilPlus(widget.auth.usuario?.idPerfil ?? ''))
              ListTile(
                title: const Text('Tu mirada espiritual'),
                subtitle: widget.auth.usuario?.filtrosConfigurados == true
                    ? const Text('Configurado — toca para modificar')
                    : const Text('Pendiente de configurar'),
                onTap: () async {
                  Navigator.pop(context);
                  await Navigator.pushNamed(context, '/spiritual-filters');
                  if (mounted) _buscar();
                },
              ),
            ListTile(
              title: const Text('Cambiar clave'),
              onTap: () => Navigator.pushNamed(context, '/change-password'),
            ),
            ListTile(
              title: const Text('Cerrar sesión'),
              onTap: () async {
                await widget.auth.logout();
              },
            ),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          PremiumSectionCard(
            child: Column(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(
                      child: Text(
                        'Fecha: $fechaVista',
                        style: tt.bodyLarge,
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: () async {
                        final d = await showDatePicker(
                          context: context,
                          initialDate: fecha,
                          firstDate: DateTime(2020),
                          lastDate: DateTime(2100),
                        );
                        if (d != null) {
                          setState(() => fecha = d);
                          _buscar();
                        }
                      },
                      icon: const Icon(Icons.calendar_month_outlined, size: 18),
                      label: const Text('Seleccionar fecha'),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    icon: const Icon(Icons.search),
                    onPressed: loading ? null : _buscar,
                    label: Text(loading ? 'Consultando...' : 'Buscar evangelio'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (data != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 26),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
                      decoration: BoxDecoration(
                        color: cs.surfaceContainerLowest.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: EvangelioTexto(
                        contenidoTarjeta,
                        modoLecturaEvangelio: true,
                        fontSize: ReligiousTheme.tamanoFuenteContenidoEvangelio,
                      ),
                    ),
                    SizedBox(height: ReligiousTheme.espacioEntreSeccionesEvangelio),
                    Divider(height: 1, thickness: 1, color: cs.outlineVariant.withValues(alpha: 0.6)),
                    const SizedBox(height: 20),
                    EvangelioTexto(
                      tituloTarjeta,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: cs.onSurface,
                      alturaLinea: 1.45,
                      separarParrafos: false,
                    ),
                    if (data!.reflexiones.length >= 2) ...[
                      SizedBox(height: ReligiousTheme.espacioEntreSeccionesEvangelio),
                      EvangelioTexto(
                        'Reflexión 1',
                        fontSize: 19,
                        fontWeight: FontWeight.w600,
                        color: cs.onSurface,
                        separarParrafos: false,
                      ),
                      const SizedBox(height: 14),
                      EvangelioTexto(
                        data!.reflexiones[0],
                        alturaLinea: ReligiousTheme.alturaLineaLectura,
                        espacioEntreParrafos: ReligiousTheme.espacioEntreParrafosLectura,
                      ),
                      const SizedBox(height: 24),
                      EvangelioTexto(
                        'Reflexión 2',
                        fontSize: 19,
                        fontWeight: FontWeight.w600,
                        color: cs.onSurface,
                        separarParrafos: false,
                      ),
                      const SizedBox(height: 14),
                      EvangelioTexto(
                        data!.reflexiones[1],
                        alturaLinea: ReligiousTheme.alturaLineaLectura,
                        espacioEntreParrafos: ReligiousTheme.espacioEntreParrafosLectura,
                      ),
                    ],
                    if (data!.preguntasReflexion.length >= 2) ...[
                      SizedBox(height: ReligiousTheme.espacioEntreSeccionesEvangelio + 4),
                      Divider(height: 1, thickness: 1, color: cs.outlineVariant.withValues(alpha: 0.6)),
                      const SizedBox(height: 20),
                      EvangelioTexto(
                        'Invitamos a reflexionar',
                        fontSize: 21,
                        fontWeight: FontWeight.w700,
                        color: cs.primary,
                        separarParrafos: false,
                      ),
                      const SizedBox(height: 18),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: EvangelioTexto(
                              '1.',
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: cs.onSurface,
                              separarParrafos: false,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: EvangelioTexto(
                              data!.preguntasReflexion[0],
                              alturaLinea: ReligiousTheme.alturaLineaLectura,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: EvangelioTexto(
                              '2.',
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: cs.onSurface,
                              separarParrafos: false,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: EvangelioTexto(
                              data!.preguntasReflexion[1],
                              alturaLinea: ReligiousTheme.alturaLineaLectura,
                            ),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

