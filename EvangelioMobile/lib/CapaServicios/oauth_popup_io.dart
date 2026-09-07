import 'dart:async';

import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

const _oauthLinks = EventChannel('tumirada/oauth_links');

Future<Map<String, String>?> abrirOauthPopup(String url) async {
  final completer = Completer<Map<String, String>?>();
  final sub = _oauthLinks.receiveBroadcastStream().listen((event) {
    final raw = event?.toString() ?? '';
    final uri = Uri.tryParse(raw);
    if (uri == null || uri.scheme != 'com.tamponi.evangelio' || uri.host != 'oauth') {
      return;
    }
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
