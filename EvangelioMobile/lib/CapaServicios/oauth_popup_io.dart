import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';

Future<Map<String, String>?> abrirOauthPopup(String url) async {
  try {
    final result = await FlutterWebAuth2.authenticate(
      url: url,
      callbackUrlScheme: 'com.tamponi.evangelio',
    );
    final u = Uri.parse(result);
    return {
      'code': u.queryParameters['code'] ?? '',
      'error': u.queryParameters['error'] ?? '',
      'state': u.queryParameters['state'] ?? '',
    };
  } catch (_) {
    return null;
  }
}
