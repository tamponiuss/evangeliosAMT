import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:url_launcher/url_launcher.dart';

Future<Map<String, String>?> abrirOauthPopup(String url) async {
  final completer = Completer<Map<String, String>?>();
  final sub = AppLinks().uriLinkStream.listen((uri) {
    if (uri.scheme != 'com.tamponi.evangelio' || uri.host != 'oauth') return;
    if (completer.isCompleted) return;
    completer.complete({
      'code': uri.queryParameters['code'] ?? '',
      'error': uri.queryParameters['error'] ?? '',
      'state': uri.queryParameters['state'] ?? '',
    });
  });
  try {
    final ok = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    if (!ok) return null;
    return await completer.future.timeout(
      const Duration(minutes: 5),
      onTimeout: () => null,
    );
  } catch (_) {
    return null;
  } finally {
    await sub.cancel();
  }
}
