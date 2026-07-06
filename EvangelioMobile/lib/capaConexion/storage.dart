import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../CapaDTO/types.dart';

class Storage {
  static const _kToken = 'ev_mobile_token';
  static const _kUsuario = 'ev_mobile_usuario';
  static const _kRememberCreds = 'ev_mobile_remember_creds';
  static const _kRememberEmail = 'ev_mobile_remember_email';
  static const _kRememberClave = 'ev_mobile_remember_clave';

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kToken);
  }

  Future<void> setToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kToken, token);
  }

  Future<UsuarioMovil?> getUsuario() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_kUsuario);
    if (raw == null || raw.isEmpty) return null;
    return UsuarioMovil.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  Future<void> setUsuario(UsuarioMovil usuario) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kUsuario, jsonEncode(usuario.toJson()));
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kToken);
    await prefs.remove(_kUsuario);
  }

  Future<void> setCredencialesRecordadas({
    required bool recordar,
    required String email,
    required String clave,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kRememberCreds, recordar);
    if (recordar) {
      await prefs.setString(_kRememberEmail, email);
      await prefs.setString(_kRememberClave, clave);
      return;
    }
    await prefs.remove(_kRememberEmail);
    await prefs.remove(_kRememberClave);
  }

  Future<bool> getRecordarCredenciales() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_kRememberCreds) ?? false;
  }

  Future<(String, String)?> getCredencialesRecordadas() async {
    final prefs = await SharedPreferences.getInstance();
    final recordar = prefs.getBool(_kRememberCreds) ?? false;
    if (!recordar) return null;
    final email = prefs.getString(_kRememberEmail) ?? '';
    final clave = prefs.getString(_kRememberClave) ?? '';
    if (email.isEmpty || clave.isEmpty) return null;
    return (email, clave);
  }
}

