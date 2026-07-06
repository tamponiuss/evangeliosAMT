import 'dart:convert';

import 'package:http/http.dart' as http;

import 'evangelio_api_config.dart';

class ApiService {
  static String get _base => EvangelioApiConfig.resolvedBaseUrl;

  Future<Map<String, dynamic>> get(String path, {String? token}) =>
      _request(() => http.get(Uri.parse('$_base$path'), headers: _headers(token)));

  Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body, {
    String? token,
  }) =>
      _request(
        () => http.post(
          Uri.parse('$_base$path'),
          headers: _headers(token),
          body: jsonEncode(body),
        ),
      );

  Future<Map<String, dynamic>> put(
    String path,
    Map<String, dynamic> body, {
    String? token,
  }) =>
      _request(
        () => http.put(
          Uri.parse('$_base$path'),
          headers: _headers(token),
          body: jsonEncode(body),
        ),
      );

  Future<Map<String, dynamic>> _request(
      Future<http.Response> Function() invoke) async {
    try {
      final res = await invoke();
      return _parse(res);
    } catch (e) {
      final msg = _mensajeFalloRed(e);
      if (msg != null) {
        throw Exception(msg);
      }
      rethrow;
    }
  }

  Map<String, String> _headers(String? token) {
    final h = <String, String>{'Content-Type': 'application/json'};
    if (token != null && token.isNotEmpty) h['Authorization'] = 'Bearer $token';
    return h;
  }

  Map<String, dynamic> _parse(http.Response res) {
    dynamic decoded;
    try {
      decoded = jsonDecode(res.body.isEmpty ? '{}' : res.body);
    } on FormatException {
      throw Exception(
        'Respuesta del servidor inválida (JSON). ¿La API está en el puerto 4000?');
    }
    if (decoded is! Map) {
      throw Exception('Respuesta inválida: se esperaba un objeto JSON');
    }
    final data = Map<String, dynamic>.from(decoded);

    if (res.statusCode >= 400) {
      throw Exception((data['error'] ?? 'Error HTTP ${res.statusCode}').toString());
    }
    return data;
  }

  /// Mensaje en español para fallos típicos (web o red).
  String? _mensajeFalloRed(Object error) {
    final s = error.toString().toLowerCase();
    if (s.contains('failed host lookup') ||
        s.contains('name or service not known')) {
      return 'No hay resolución DNS hacia la API. Para otro PC o dominio usa '
          '--dart-define=EVANGELIO_API_BASE=https://tu-servidor/api o '
          'EVANGELIO_DEV_HOST=IP_en_LAN.';
    }
    if (s.contains('failed to fetch')) {
      return 'No se puede conectar a la API en el puerto 4000. Inicia el servidor '
          '(npm run dev en la carpeta evangelio web/server, con MongoDB en ejecución). '
          'Para que arranque solo al encender el PC, ejecuta una vez el script '
          'scripts/Register-EvangelioApi-AutoStart.ps1 en la raíz del proyecto.';
    }
    if (s.contains('connection refused') ||
        s.contains('connection reset') ||
        s.contains('socketexception') ||
        s.contains('network is unreachable') ||
        s.contains('network unreachable') ||
        s.contains('clientexception')) {
      return 'Sin conexión al servidor (puerto 4000). Comprueba que la API esté en marcha '
          'y que la URL sea la correcta (release: --dart-define=EVANGELIO_API_BASE=…). '
          'En un teléfono físico con el PC en la misma red: '
          '--dart-define=EVANGELIO_DEV_HOST=IP_del_PC. '
          'Arranque automático: scripts/Register-EvangelioApi-AutoStart.ps1.';
    }
    return null;
  }
}

