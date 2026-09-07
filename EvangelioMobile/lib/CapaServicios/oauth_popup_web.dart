// ignore_for_file: deprecated_member_use, avoid_web_libraries_in_flutter

import 'dart:async';
import 'dart:convert';
import 'dart:html' as html;

Future<Map<String, String>?> abrirOauthPopup(String url) async {
  final popup = html.window.open(url, 'tumirada_oauth', 'width=520,height=720,scrollbars=yes');
  final done = Completer<Map<String, String>?>();
  late final StreamSubscription sub;
  Timer? poll;

  void cerrar() {
    sub.cancel();
    poll?.cancel();
    try {
      popup.close();
    } catch (_) {}
  }

  sub = html.window.onMessage.listen((event) {
    if (event.origin != html.window.location.origin) return;
    final raw = event.data;
    Map<String, dynamic>? data;
    if (raw is String) {
      try {
        final decoded = jsonDecode(raw);
        if (decoded is Map) data = Map<String, dynamic>.from(decoded);
      } catch (_) {}
    } else if (raw is Map) {
      data = Map<String, dynamic>.from(raw);
    }
    if (data == null || data['type'] != 'tumirada-oauth') return;
    if (done.isCompleted) return;
    cerrar();
    done.complete({
      'code': '${data['code'] ?? ''}',
      'error': '${data['error'] ?? ''}',
      'state': '${data['state'] ?? ''}',
    });
  });

  poll = Timer.periodic(const Duration(milliseconds: 400), (_) {
    var closed = false;
    try {
      closed = popup.closed == true;
    } catch (_) {
      closed = true;
    }
    if (closed && !done.isCompleted) {
      cerrar();
      done.complete(null);
    }
  });

  return done.future.timeout(
    const Duration(minutes: 3),
    onTimeout: () {
      cerrar();
      return null;
    },
  );
}
