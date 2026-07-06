import 'package:flutter/foundation.dart';

/// URL base de la API REST (debe terminar en `/api` sin barra final duplicada).
///
/// **Producción (Android/iOS release):** define la URL pública HTTPS del backend, por ejemplo:
/// `flutter build apk --dart-define=EVANGELIO_API_BASE=https://api.tudominio.com/api`
///
/// **Teléfono físico en la misma Wi‑Fi que el PC (HTTP puerto 4000):**
/// `flutter run --dart-define=EVANGELIO_DEV_HOST=192.168.1.10`
/// (sustituye por la IP de tu máquina; en Android debug ya se permite HTTP en LAN).
///
/// **Emulador Android:** por defecto `http://10.0.2.2:4000/api`.
/// **Simulador iOS / escritorio:** por defecto `http://127.0.0.1:4000/api`.
class EvangelioApiConfig {
  EvangelioApiConfig._();

  /// Tiene prioridad sobre todo lo demás (incluye `/api` al final).
  static const String apiBaseOverride =
      String.fromEnvironment('EVANGELIO_API_BASE', defaultValue: '');

  /// Solo si [apiBaseOverride] está vacío: host del backend en LAN, sin `http://` ni puerto.
  /// Ejemplo: `192.168.1.15`
  static const String devHost =
      String.fromEnvironment('EVANGELIO_DEV_HOST', defaultValue: '');

  static String get resolvedBaseUrl {
    final trimOverride = apiBaseOverride.trim();
    if (trimOverride.isNotEmpty) {
      return trimOverride.endsWith('/')
          ? trimOverride.substring(0, trimOverride.length - 1)
          : trimOverride;
    }
    if (kIsWeb) {
      final u = Uri.base;
      final scheme = u.scheme.isNotEmpty ? u.scheme : 'http';
      final loopbackHosts = ['', 'localhost', '127.0.0.1', '0.0.0.0'];
      final isLoopbackHttp =
          scheme == 'http' && loopbackHosts.contains(u.host);
      if (isLoopbackHttp) {
        return 'http://127.0.0.1:4000/api';
      }
      final host = u.host.isEmpty ? 'localhost' : u.host;
      return '$scheme://$host:4000/api';
    }
    final hostLan = devHost.trim();
    if (hostLan.isNotEmpty) {
      return 'http://$hostLan:4000/api';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:4000/api';
    }
    return 'http://127.0.0.1:4000/api';
  }
}
