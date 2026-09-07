import 'dart:async';

import 'package:flutter/material.dart';

import '../CapaDTO/types.dart';
import '../CapaNegocio/auth_negocio.dart';
import '../CapaServicios/api_service.dart';
import '../CapaServicios/oauth_servicio.dart';
import '../CapaServicios/evangelio_api_config.dart';
import '../capaConexion/storage.dart';

class AuthController extends ChangeNotifier {
  final Storage _storage = Storage();
  final AuthNegocio _negocio = AuthNegocio(ApiService());

  String? token;
  UsuarioMovil? usuario;
  bool cargando = true;
  /// Aviso breve al volver al inicio (inactividad), no es un error de red.
  String? avisoSesion;

  static const inactividadMaxima = Duration(minutes: 10);

  DateTime _ultimaActividad = DateTime.now();
  Timer? _timerInactividad;

  Future<void> init() async {
    if (EvangelioApiConfig.startOverride == 'register' ||
        EvangelioApiConfig.startOverride == 'welcome') {
      token = null;
      usuario = null;
      cargando = false;
      notifyListeners();
      return;
    }
    token = await _storage.getToken();
    usuario = await _storage.getUsuario();
    if (token != null && token!.isNotEmpty) {
      try {
        usuario = await _negocio.perfil(token!);
        await _storage.setUsuario(usuario!);
        cargando = false;
        _armarTimerInactividad();
        notifyListeners();
        return;
      } catch (_) {
        token = null;
        usuario = null;
        await _storage.clear();
      }
    }
    final cred = await _storage.getCredencialesRecordadas();
    if (cred != null) {
      try {
        await login(cred.$1, cred.$2);
      } catch (_) {
        // Credenciales guardadas inválidas: se muestra la pantalla de entrada.
      }
    }
    cargando = false;
    notifyListeners();
  }

  bool get autenticado => token != null && token!.isNotEmpty;
  bool get esUsuarioPlus => esPerfilPlus(usuario?.idPerfil ?? '');
  bool get requiereFiltrosEspirituales =>
      autenticado && esUsuarioPlus && !(usuario?.filtrosConfigurados ?? false);

  Future<bool> solicitarCodigoRegistro(String email) async {
    return _negocio.solicitarCodigoRegistro(email);
  }

  Future<void> registroConCodigo(String email, String clave, String codigo) async {
    final (t, u) = await _negocio.registroConCodigo(email, clave, codigo);
    await _establecerSesion(t, u);
  }

  Future<void> login(String email, String clave) async {
    final (t, u) = await _negocio.login(email, clave);
    await _establecerSesion(t, u);
  }

  Future<void> entrarConProveedor(String proveedor, OauthServicio oauth) async {
    final (t, u) = await oauth.entrarCon(proveedor);
    await _establecerSesion(t, u);
  }

  Future<bool> solicitarRecuperacionClave(String email) async {
    return _negocio.solicitarRecuperacionClave(email);
  }

  Future<void> completarRecuperacionClave(String email, String codigo, String claveNueva) async {
    final (t, u) = await _negocio.completarRecuperacionClave(email, codigo, claveNueva);
    await _establecerSesion(t, u);
  }

  Future<void> _establecerSesion(String t, UsuarioMovil u) async {
    token = t;
    usuario = u;
    avisoSesion = null;
    await _storage.setToken(t);
    await _storage.setUsuario(u);
    _armarTimerInactividad();
    notifyListeners();
  }

  void _armarTimerInactividad() {
    _timerInactividad?.cancel();
    if (!autenticado) return;
    _ultimaActividad = DateTime.now();
    _timerInactividad = Timer(inactividadMaxima, () {
      unawaited(cerrarPorInactividad());
    });
  }

  /// Reinicia el tiempo de inactividad. Si la app estuvo quieta demasiado, cierra sesión.
  void registrarActividad() {
    if (!autenticado) {
      _timerInactividad?.cancel();
      return;
    }
    if (DateTime.now().difference(_ultimaActividad) >= inactividadMaxima) {
      unawaited(cerrarPorInactividad());
      return;
    }
    _armarTimerInactividad();
  }

  /// Al volver de segundo plano: si pasó demasiado tiempo, cierra sin mostrar timeout.
  void alReanudarApp() {
    if (!autenticado) return;
    if (DateTime.now().difference(_ultimaActividad) >= inactividadMaxima) {
      unawaited(cerrarPorInactividad());
      return;
    }
    _armarTimerInactividad();
  }

  Future<void> cerrarPorInactividad() async {
    if (!autenticado) return;
    await logout(
      aviso: 'Cerramos la sesión porque la app estuvo un rato inactiva. Vuelve a entrar.',
    );
  }

  /// Si el fallo es timeout o desconexión, cierra sesión en silencio (evita el error en pantalla).
  bool cerrarSiErrorDeRed(Object e) {
    if (!autenticado) return false;
    final s = e.toString().toLowerCase();
    final red = s.contains('timeout') ||
        s.contains('timed out') ||
        s.contains('tardó demasiado') ||
        s.contains('failed to fetch') ||
        s.contains('sin conexión') ||
        s.contains('connection refused') ||
        s.contains('connection reset') ||
        s.contains('network');
    if (!red) return false;
    unawaited(
      logout(aviso: 'Se perdió la conexión. Vuelve a entrar para continuar.'),
    );
    return true;
  }

  Future<void> refrescarPerfil() async {
    if (token == null) return;
    usuario = await _negocio.perfil(token!);
    await _storage.setUsuario(usuario!);
    notifyListeners();
  }

  Future<void> cambiarClave(String actual, String nueva) async {
    if (token == null) throw Exception('No autenticado');
    await _negocio.cambiarClave(token!, actual, nueva);
  }

  Future<void> guardarPreferenciasEntrega(PreferenciasEntrega prefs) async {
    if (token == null) throw Exception('No autenticado');
    usuario = await _negocio.guardarPreferenciasEntrega(token!, prefs);
    await _storage.setUsuario(usuario!);
    notifyListeners();
  }

  Future<CatalogosEspirituales> catalogosEspirituales() async {
    if (token == null) throw Exception('No autenticado');
    return _negocio.catalogosEspirituales(token!);
  }

  Future<FiltrosEspirituales> obtenerFiltrosEspirituales() async {
    if (token == null) throw Exception('No autenticado');
    return _negocio.obtenerFiltrosEspirituales(token!);
  }

  Future<void> guardarFiltrosEspirituales(FiltrosEspirituales filtros) async {
    if (token == null) throw Exception('No autenticado');
    usuario = await _negocio.guardarFiltrosEspirituales(token!, filtros);
    await _storage.setUsuario(usuario!);
    notifyListeners();
  }

  Future<ParametroApp> obtenerTarifaPlus() async {
    if (token == null) throw Exception('No autenticado');
    return _negocio.obtenerParametroApp(token!, 'tarifa-plus');
  }

  Future<void> pagarSuscripcionPlus() async {
    if (token == null) throw Exception('No autenticado');
    usuario = await _negocio.pagarSuscripcionPlus(token!);
    await _storage.setUsuario(usuario!);
    notifyListeners();
  }

  Future<void> logout({String? aviso}) async {
    _timerInactividad?.cancel();
    _timerInactividad = null;
    token = null;
    usuario = null;
    avisoSesion = aviso;
    await _storage.clear();
    notifyListeners();
  }
}

