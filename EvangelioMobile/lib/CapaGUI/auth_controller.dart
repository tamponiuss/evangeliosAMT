import 'package:flutter/material.dart';

import '../CapaDTO/types.dart';
import '../CapaNegocio/auth_negocio.dart';
import '../CapaServicios/api_service.dart';
import '../capaConexion/storage.dart';

class AuthController extends ChangeNotifier {
  final Storage _storage = Storage();
  final AuthNegocio _negocio = AuthNegocio(ApiService());

  String? token;
  UsuarioMovil? usuario;
  bool cargando = true;

  Future<void> init() async {
    token = await _storage.getToken();
    usuario = await _storage.getUsuario();
    if ((token == null || token!.isEmpty) && usuario == null) {
      final cred = await _storage.getCredencialesRecordadas();
      if (cred != null) {
        try {
          await login(cred.$1, cred.$2);
        } catch (_) {
          // Si las credenciales guardadas ya no son válidas, mantenemos flujo normal.
        }
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
    token = t;
    usuario = u;
    await _storage.setToken(t);
    await _storage.setUsuario(u);
    notifyListeners();
  }

  Future<void> login(String email, String clave) async {
    final (t, u) = await _negocio.login(email, clave);
    token = t;
    usuario = u;
    await _storage.setToken(t);
    await _storage.setUsuario(u);
    notifyListeners();
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

  Future<void> logout() async {
    token = null;
    usuario = null;
    await _storage.clear();
    notifyListeners();
  }
}

