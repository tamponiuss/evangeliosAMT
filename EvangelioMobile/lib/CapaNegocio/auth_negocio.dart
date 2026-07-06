import '../CapaDTO/types.dart';
import '../CapaServicios/api_service.dart';

class AuthNegocio {
  final ApiService _api;
  AuthNegocio(this._api);

  static UsuarioMovil _usuarioDesdeRespuesta(dynamic raw) {
    if (raw == null || raw is! Map) {
      throw Exception('Respuesta inválida del servidor (faltan datos de usuario).');
    }
    return UsuarioMovil.fromJson(Map<String, dynamic>.from(raw));
  }

  /// Devuelve `true` si el servidor envió el correo; `false` si solo está en modo desarrollo (sin SMTP).
  Future<bool> solicitarCodigoRegistro(String email) async {
    final r = await _api.post('/auth/movil/registro/solicitar-codigo', {'email': email});
    if (r['correoEnviado'] == false) return false;
    return true;
  }

  Future<(String, UsuarioMovil)> registroConCodigo(String email, String clave, String codigo) async {
    final r = await _api.post('/auth/movil/registro/completar', {
      'email': email,
      'clave': clave,
      'codigo': codigo,
    });
    return ((r['token'] ?? '').toString(), _usuarioDesdeRespuesta(r['usuario']));
  }

  Future<(String, UsuarioMovil)> login(String email, String clave) async {
    final r = await _api.post('/auth/movil/login', {'email': email, 'clave': clave});
    return ((r['token'] ?? '').toString(), _usuarioDesdeRespuesta(r['usuario']));
  }

  Future<UsuarioMovil> perfil(String token) async {
    final r = await _api.get('/auth/movil/perfil', token: token);
    return _usuarioDesdeRespuesta(r);
  }

  Future<void> cambiarClave(String token, String actual, String nueva) async {
    await _api.put('/auth/movil/cambiar-clave', {'claveActual': actual, 'claveNueva': nueva}, token: token);
  }

  Future<CatalogosEspirituales> catalogosEspirituales(String token) async {
    final r = await _api.get('/auth/movil/catalogos-espirituales', token: token);
    return CatalogosEspirituales.fromJson(r);
  }

  Future<FiltrosEspirituales> obtenerFiltrosEspirituales(String token) async {
    final r = await _api.get('/auth/movil/filtros-espirituales', token: token);
    return FiltrosEspirituales.fromJson(r);
  }

  Future<UsuarioMovil> guardarFiltrosEspirituales(String token, FiltrosEspirituales filtros) async {
    final r = await _api.put('/auth/movil/filtros-espirituales', filtros.toJson(), token: token);
    return _usuarioDesdeRespuesta(r);
  }

  Future<ParametroApp> obtenerParametroApp(String token, String idParametro) async {
    final r = await _api.get('/auth/movil/parametros/$idParametro', token: token);
    return ParametroApp.fromJson(r);
  }

  Future<UsuarioMovil> pagarSuscripcionPlus(String token) async {
    final r = await _api.post('/auth/movil/plus/pagar', {}, token: token);
    return _usuarioDesdeRespuesta(r['usuario']);
  }

}

