import 'package:flutter/material.dart';

import 'CapaGUI/auth_controller.dart';
import 'CapaGUI/screens/change_password_screen.dart';
import 'CapaGUI/screens/home_screen.dart';
import 'CapaGUI/screens/login_screen.dart';
import 'CapaGUI/screens/plus_upgrade_screen.dart';
import 'CapaGUI/screens/spiritual_filters_screen.dart';
import 'CapaGUI/screens/register_screen.dart';
import 'CapaGUI/screens/terms_screen.dart';
import 'CapaGUI/theme.dart';

void main() {
  runApp(const EvangelioMobileApp());
}

class EvangelioMobileApp extends StatefulWidget {
  const EvangelioMobileApp({super.key});

  @override
  State<EvangelioMobileApp> createState() => _EvangelioMobileAppState();
}

class _EvangelioMobileAppState extends State<EvangelioMobileApp> {
  final auth = AuthController();

  @override
  void initState() {
    super.initState();
    auth.init();
    auth.addListener(() => setState(() {}));
  }

  @override
  Widget build(BuildContext context) {
    Widget home;
    if (auth.cargando) {
      home = const Scaffold(body: Center(child: CircularProgressIndicator()));
    } else if (!auth.autenticado) {
      home = RegisterScreen(auth: auth);
    } else if (auth.requiereFiltrosEspirituales) {
      home = SpiritualFiltersScreen(auth: auth, bloquearAtras: true);
    } else {
      home = HomeScreen(auth: auth);
    }

    return MaterialApp(
      title: 'Evangelio Mobile',
      debugShowCheckedModeBanner: false,
      theme: ReligiousTheme.theme,
      home: home,
      routes: {
        '/register': (_) => RegisterScreen(auth: auth),
        '/login': (_) => LoginScreen(auth: auth),
        '/terms': (_) => const TermsScreen(),
        '/home': (_) => HomeScreen(auth: auth),
        '/spiritual-filters': (_) => SpiritualFiltersScreen(auth: auth),
        '/plus-upgrade': (_) => PlusUpgradeScreen(auth: auth),
        '/change-password': (_) => ChangePasswordScreen(auth: auth),
      },
    );
  }
}
