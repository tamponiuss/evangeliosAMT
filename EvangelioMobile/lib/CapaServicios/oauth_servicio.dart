import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../CapaDTO/types.dart';
import 'api_service.dart';
import 'oauth_popup.dart';

class OauthConfigPublico {
  final bool google;
  final bool microsoft;
  final bool yahoo;
  final String googleClientId;
  final String microsoftClientId;
  final String yahooClientId;

  const OauthConfigPublico({
    required this.google,
    required this.microsoft,
    required this.yahoo,
    required this.googleClientId,
    required this.microsoftClientId,
    required this.yahooClientId,
  });

  factory OauthConfigPublico.fromJson(Map<String, dynamic> j) => OauthConfigPublico(
        google: j['google'] == true,
        microsoft: j['microsoft'] == true,
        yahoo: j['yahoo'] == true,
        googleClientId: '${j['googleClientId'] ?? ''}',
        microsoftClientId: '${j['microsoftClientId'] ?? ''}',
        yahooClientId: '${j['yahooClientId'] ?? ''}',
      );

  bool habilitado(String proveedor) {
    switch (proveedor) {
      case 'google':
        return google && googleClientId.isNotEmpty;
      case 'microsoft':
        return microsoft && microsoftClientId.isNotEmpty;
      case 'yahoo':
        return yahoo && yahooClientId.isNotEmpty;
      default:
        return false;
    }
  }
}

class OauthServicio {
  OauthServicio(this._api);
  final ApiService _api;
  OauthConfigPublico? _cache;

  static const redirectUriMovil = 'com.tamponi.evangelio://oauth';

  String get redirectUri => kIsWeb ? '${Uri.base.origin}/oauth_redirect.html' : redirectUriMovil;

  Future<OauthConfigPublico> config() async {
    if (_cache != null) return _cache!;
    try {
      final r = await _api.get('/auth/movil/oauth/config');
      _cache = OauthConfigPublico.fromJson(r);
    } catch (_) {
      _cache = const OauthConfigPublico(
        google: false,
        microsoft: false,
        yahoo: false,
        googleClientId: '',
        microsoftClientId: '',
        yahooClientId: '',
      );
    }
    return _cache!;
  }

  Future<(String, UsuarioMovil)> entrarCon(String proveedor) async {
    final cfg = await config();
    if (!cfg.habilitado(proveedor)) {
      throw Exception(
        'El registro directo con ${_etiqueta(proveedor)} aún no está habilitado en el servidor. '
        'Usa el registro con correo y código, o pide al administrador las claves OAuth.',
      );
    }

    if (!kIsWeb && proveedor == 'google') {
      return _entrarGmailNativo(cfg);
    }

    final verifier = _pkceVerifier();
    final challenge = _pkceChallenge(verifier);
    final state = _pkceVerifier().substring(0, 24);
    final url = _authorizeUrl(proveedor, cfg, challenge, state);

    final result = await abrirOauthPopup(url);
    if (result == null) {
      throw Exception('Cancelaste el registro con ${_etiqueta(proveedor)}.');
    }
    if ((result['error'] ?? '').isNotEmpty) {
      throw Exception('No se autorizó ${_etiqueta(proveedor)}. Inténtalo de nuevo.');
    }
    if ((result['state'] ?? '') != state) {
      throw Exception('La autorización se interrumpió. Inténtalo de nuevo.');
    }
    final code = result['code'] ?? '';
    if (code.isEmpty) {
      throw Exception('No llegó el código de ${_etiqueta(proveedor)}.');
    }

    final r = await _api.post('/auth/movil/oauth', {
      'proveedor': proveedor,
      'code': code,
      'redirectUri': redirectUri,
      'codeVerifier': verifier,
    });
    return _sesionDesdeRespuesta(r, proveedor);
  }

  Future<(String, UsuarioMovil)> _entrarGmailNativo(OauthConfigPublico cfg) async {
    final google = GoogleSignIn(
      scopes: const ['email', 'profile'],
      serverClientId: cfg.googleClientId.isEmpty ? null : cfg.googleClientId,
    );
    try {
      await google.signOut();
    } catch (_) {}
    final cuenta = await google.signIn();
    if (cuenta == null) {
      throw Exception('Cancelaste el registro con Gmail.');
    }
    final auth = await cuenta.authentication;
    final idToken = auth.idToken ?? '';
    if (idToken.isEmpty) {
      throw Exception('Gmail no entregó el token. Revisa la configuración de Google Sign-In.');
    }
    final r = await _api.post('/auth/movil/oauth', {
      'proveedor': 'google',
      'idToken': idToken,
    });
    return _sesionDesdeRespuesta(r, 'google');
  }

  (String, UsuarioMovil) _sesionDesdeRespuesta(Map<String, dynamic> r, String proveedor) {
    final token = (r['token'] ?? '').toString();
    final raw = r['usuario'];
    if (token.isEmpty || raw is! Map) {
      throw Exception('Respuesta inválida al registrar con ${_etiqueta(proveedor)}.');
    }
    return (token, UsuarioMovil.fromJson(Map<String, dynamic>.from(raw)));
  }

  String _etiqueta(String p) {
    switch (p) {
      case 'google':
        return 'Gmail';
      case 'microsoft':
        return 'Outlook';
      case 'yahoo':
        return 'Yahoo';
      default:
        return p;
    }
  }

  String _authorizeUrl(String proveedor, OauthConfigPublico cfg, String challenge, String state) {
    final redirect = redirectUri;
    if (proveedor == 'google') {
      return Uri.https('accounts.google.com', '/o/oauth2/v2/auth', {
        'client_id': cfg.googleClientId,
        'redirect_uri': redirect,
        'response_type': 'code',
        'scope': 'openid email profile',
        'prompt': 'select_account',
        'code_challenge': challenge,
        'code_challenge_method': 'S256',
        'state': state,
      }).toString();
    }
    if (proveedor == 'microsoft') {
      return Uri.https('login.microsoftonline.com', '/consumers/oauth2/v2.0/authorize', {
        'client_id': cfg.microsoftClientId,
        'redirect_uri': redirect,
        'response_type': 'code',
        'response_mode': 'query',
        'scope': 'openid email profile User.Read',
        'prompt': 'select_account',
        'code_challenge': challenge,
        'code_challenge_method': 'S256',
        'state': state,
      }).toString();
    }
    return Uri.https('api.login.yahoo.com', '/oauth2/request_auth', {
      'client_id': cfg.yahooClientId,
      'redirect_uri': redirect,
      'response_type': 'code',
      'scope': 'openid email profile',
      'code_challenge': challenge,
      'code_challenge_method': 'S256',
      'state': state,
    }).toString();
  }

  String _pkceVerifier() {
    final rnd = Random.secure();
    final bytes = List<int>.generate(32, (_) => rnd.nextInt(256));
    return base64UrlEncode(bytes).replaceAll('=', '');
  }

  String _pkceChallenge(String verifier) {
    final digest = sha256.convert(utf8.encode(verifier));
    return base64UrlEncode(digest.bytes).replaceAll('=', '');
  }
}
