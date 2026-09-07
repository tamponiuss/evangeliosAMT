import 'package:flutter/material.dart';

import '../auth_controller.dart';
import '../theme.dart';
import '../../CapaServicios/api_service.dart';
import '../../CapaServicios/oauth_servicio.dart';

class BotonesRegistroSocial extends StatefulWidget {
  final AuthController auth;
  final bool habilitado;
  final String motivoBloqueo;
  final String titulo;

  const BotonesRegistroSocial({
    super.key,
    required this.auth,
    required this.habilitado,
    this.motivoBloqueo = 'Marca «Acepto términos y condiciones» para continuar.',
    this.titulo = 'Regístrate directo con tu cuenta',
  });

  @override
  State<BotonesRegistroSocial> createState() => _BotonesRegistroSocialState();
}

class _BotonesRegistroSocialState extends State<BotonesRegistroSocial> {
  final _oauth = OauthServicio(ApiService());
  OauthConfigPublico? _cfg;
  String? _cargando;

  @override
  void initState() {
    super.initState();
    _precargar();
  }

  Future<void> _precargar() async {
    try {
      final c = await _oauth.config();
      if (mounted) setState(() => _cfg = c);
    } catch (_) {
      if (mounted) {
        setState(
          () => _cfg = const OauthConfigPublico(
            google: false,
            microsoft: false,
            yahoo: false,
            googleClientId: '',
            microsoftClientId: '',
            yahooClientId: '',
          ),
        );
      }
    }
  }

  String _msg(Object e) {
    var s = e.toString();
    if (s.startsWith('Exception: ')) s = s.substring('Exception: '.length);
    return s.trim();
  }

  Future<void> _tocar(String proveedor, String etiqueta) async {
    if (!widget.habilitado) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(widget.motivoBloqueo)));
      return;
    }
    if (_cargando != null) return;
    setState(() => _cargando = proveedor);
    try {
      await widget.auth.entrarConProveedor(proveedor, _oauth);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_msg(e))));
      }
    } finally {
      if (mounted) setState(() => _cargando = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          widget.titulo,
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey.shade800, fontWeight: FontWeight.w600, fontSize: 15),
        ),
        const SizedBox(height: 10),
        _boton(
          proveedor: 'google',
          etiqueta: 'Continuar con Gmail',
          color: const Color(0xFFEA4335),
          icono: Icons.mail_outline,
        ),
        const SizedBox(height: 8),
        _boton(
          proveedor: 'microsoft',
          etiqueta: 'Continuar con Outlook',
          color: const Color(0xFF0078D4),
          icono: Icons.inbox_outlined,
        ),
        const SizedBox(height: 8),
        _boton(
          proveedor: 'yahoo',
          etiqueta: 'Continuar con Yahoo',
          color: const Color(0xFF6001D2),
          icono: Icons.alternate_email,
        ),
        if (_cfg != null && !_cfg!.google && !_cfg!.microsoft && !_cfg!.yahoo) ...[
          const SizedBox(height: 8),
          Text(
            'El administrador debe configurar Gmail, Outlook y Yahoo en el servidor para el registro directo.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12.5, height: 1.3, color: Colors.grey.shade700),
          ),
        ],
      ],
    );
  }

  Widget _boton({
    required String proveedor,
    required String etiqueta,
    required Color color,
    required IconData icono,
  }) {
    final ocupado = _cargando != null;
    final este = _cargando == proveedor;
    return OutlinedButton.icon(
      onPressed: ocupado ? null : () => _tocar(proveedor, etiqueta),
      icon: este
          ? const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Icon(icono, color: color, size: 22),
      label: Text(este ? 'Conectando…' : etiqueta),
      style: OutlinedButton.styleFrom(
        foregroundColor: ReligiousTheme.texto,
        side: BorderSide(color: color.withValues(alpha: 0.55)),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    );
  }
}
