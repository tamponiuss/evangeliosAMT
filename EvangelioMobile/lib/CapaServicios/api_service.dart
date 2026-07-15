import 'dart:convert';

import 'package:http/http.dart' as http;

import 'evangelio_api_config.dart';

class ApiService {
  static String get _base => EvangelioApiConfig.resolvedBaseUrl;

  /// Render free puede “despertar” lento; registro/correo también tarda.
  static const Duration _timeout = Duration(seconds: 90);

  Future<Map<String, dynamic>> get(String path, {String? token}) =>
      _request(
        () => http
            .get(Uri.parse('$_base$path'), headers: _headers(token))
            .timeout(_timeout),
      );

  Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body, {
    String? token,
  }) =>
      _request(
        () => http
            .post(
              Uri.parse('$_base$path'),
              headers: _headers(token),
              body: jsonEncode(body),
            )
            .timeout(_timeout),
      );

  Future<Map<String, dynamic>> put(
    String path,
    Map<String, dynamic> body, {
    String? token,
  }) =>
      _request(
        () => http
            .put(
              Uri.parse('$_base$path'),
              headers: _headers(token),
              body: jsonEncode(body),
            )
            .timeout(_timeout),
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
    if (s.contains('timeout') || s.contains('timed out')) {
      return 'El servidor tardó demasiado en responder. Espera unos segundos e inténtalo de nuevo '
          '(la primera petición puede despertar la API en la nube).';
    }
    if (s.contains('failed host lookup') ||
        s.contains('name or service not known')) {
      return 'No hay resolución DNS hacia la API. Comprueba tu conexión a Internet.';
    }
    if (s.contains('failed to fetch')) {
      return 'No se puede conectar a la API. Comprueba Internet y que el servidor esté activo.';
    }
    if (s.contains('connection refused') ||
        s.contains('connection reset') ||
        s.contains('socketexception') ||
        s.contains('network is unreachable') ||
        s.contains('network unreachable') ||
        s.contains('clientexception') ||
        s.contains('connection closed')) {
      return 'Sin conexión al servidor. Comprueba Internet. API: ${EvangelioApiConfig.resolvedBaseUrl}';
    }
    return null;
  }
}

