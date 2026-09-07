import 'package:flutter/material.dart';

import 'CapaGUI/auth_controller.dart';
import 'CapaGUI/screens/change_password_screen.dart';
import 'CapaGUI/screens/delivery_preferences_screen.dart';
import 'CapaGUI/screens/home_screen.dart';
import 'CapaGUI/screens/welcome_screen.dart';
import 'CapaGUI/screens/recover_password_screen.dart';
import 'CapaGUI/screens/register_screen.dart';
import 'CapaGUI/screens/plus_upgrade_screen.dart';
import 'CapaGUI/screens/splash_marca_screen.dart';
import 'CapaGUI/screens/spiritual_filters_screen.dart';
import 'CapaGUI/screens/terms_screen.dart';
import 'CapaServicios/evangelio_api_config.dart';

void main() {
  runApp(const EvangelioMobileApp());
}

class EvangelioMobileApp extends StatefulWidget {
  const EvangelioMobileApp({super.key});

  @override
  State<EvangelioMobileApp> createState() => _EvangelioMobileAppState();
}

class _EvangelioMobileAppState extends State<EvangelioMobileApp> with WidgetsBindingObserver {
  final auth = AuthController();
  final _navKey = GlobalKey<NavigatorState>();
  bool _splash = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    auth.init();
    auth.addListener(() {
      setState(() {});
      if (auth.autenticado && !_splash) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _navKey.currentState?.popUntil((r) => r.isFirst);
        });
      }
    });
    Future<void>.delayed(const Duration(seconds: 4), () {
      if (!mounted) return;
      setState(() => _splash = false);
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      auth.alReanudarApp();
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget home;
    if (_splash) {
      home = const SplashMarcaScreen();
    } else if (auth.cargando) {
      home = const Scaffold(body: Center(child: CircularProgressIndicator()));
    } else if (!auth.autenticado) {
      home = EvangelioApiConfig.startOverride == 'register'
          ? RegisterScreen(auth: auth)
          : WelcomeScreen(auth: auth);
    } else if (auth.requiereFiltrosEspirituales) {
      home = SpiritualFiltersScreen(auth: auth, bloquearAtras: true);
    } else {
      home = HomeScreen(auth: auth);
    }

    return Listener(
      behavior: HitTestBehavior.translucent,
      onPointerDown: (_) => auth.registrarActividad(),
      onPointerSignal: (_) => auth.registrarActividad(),
      child: MaterialApp(
        title: 'TuMirada',
        debugShowCheckedModeBanner: false,
        navigatorKey: _navKey,
        home: home,
        routes: {
          '/register': (_) => RegisterScreen(auth: auth),
          '/login': (_) => WelcomeScreen(auth: auth),
          '/recover-password': (_) => RecoverPasswordScreen(auth: auth),
          '/terms': (_) => const TermsScreen(),
          '/home': (_) => HomeScreen(auth: auth),
          '/spiritual-filters': (_) => SpiritualFiltersScreen(auth: auth),
          '/plus-upgrade': (_) => PlusUpgradeScreen(auth: auth),
          '/change-password': (_) => ChangePasswordScreen(auth: auth),
          '/delivery-preferences': (_) => DeliveryPreferencesScreen(auth: auth),
        },
      ),
    );
  }
}
