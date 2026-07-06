import 'package:flutter/material.dart';

/// Tema con lectura cómoda para personas adultas mayores:
/// fuente del sistema (SF / Roboto), cuerpos algo mayores, interlineado ~1,5–1,55,
/// buen contraste y controles un poco más grandes.
class ReligiousTheme {
  static const celeste = Color(0xFFCFEFFF);
  static const celesteFuerte = Color(0xFF7EC5EE);
  static const blanco = Colors.white;
  static const texto = Color(0xFF114A78);
  static const borde = Color(0xFFA8D9F5);

  /// Interlineado para reflexiones y preguntas.
  static const double alturaLineaLectura = 1.62;

  /// Espacio entre párrafos en reflexiones / bloques secundarios.
  static const double espacioEntreParrafosLectura = 18;

  /// Espacio vertical entre párrafos del cuerpo del evangelio.
  static const double espacioEntreParrafosEvangelio = 30;

  /// Cuerpo principal del evangelio: lectura cómoda (adultos mayores).
  static const double tamanoFuenteContenidoEvangelio = 21;
  static const double alturaLineaContenidoEvangelio = 1.88;
  static const double espaciadoLetrasLectura = 0.35;

  /// Separación entre secciones de la tarjeta (evangelio / título / reflexiones).
  static const double espacioEntreSeccionesEvangelio = 28;

  static ThemeData get theme {
    final scheme = ColorScheme.fromSeed(
      seedColor: celesteFuerte,
      brightness: Brightness.light,
    );

    final onSurf = scheme.onSurface;
    final onSurfVar = scheme.onSurfaceVariant;

    final textTheme = TextTheme(
      bodyLarge: TextStyle(
        color: onSurf,
        fontSize: 18,
        height: alturaLineaLectura,
        fontWeight: FontWeight.w400,
      ),
      bodyMedium: TextStyle(
        color: onSurf,
        fontSize: 16,
        height: 1.5,
        fontWeight: FontWeight.w400,
      ),
      bodySmall: TextStyle(
        color: onSurfVar,
        fontSize: 15,
        height: 1.45,
      ),
      titleLarge: TextStyle(
        color: onSurf,
        fontSize: 24,
        height: 1.3,
        fontWeight: FontWeight.w700,
      ),
      titleMedium: TextStyle(
        color: onSurf,
        fontSize: 19,
        height: 1.35,
        fontWeight: FontWeight.w600,
      ),
      titleSmall: TextStyle(
        color: onSurf,
        fontSize: 17,
        height: 1.35,
        fontWeight: FontWeight.w600,
      ),
      labelLarge: TextStyle(
        color: onSurf,
        fontSize: 17,
        height: 1.25,
        fontWeight: FontWeight.w600,
      ),
    );

    final botonMin = const Size(48, 52);

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: blanco,
      colorScheme: scheme,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: celeste,
        foregroundColor: texto,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: textTheme.titleMedium?.copyWith(
          color: texto,
          fontWeight: FontWeight.w700,
          fontSize: 20,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 1,
        margin: const EdgeInsets.symmetric(vertical: 4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: botonMin,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          textStyle: textTheme.labelLarge,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: botonMin,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          textStyle: textTheme.labelLarge,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: botonMin,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          textStyle: textTheme.labelLarge,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          minimumSize: botonMin,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          textStyle: textTheme.labelLarge,
        ),
      ),
      listTileTheme: ListTileThemeData(
        minVerticalPadding: 14,
        titleTextStyle: textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
        subtitleTextStyle: textTheme.bodyMedium,
      ),
      inputDecorationTheme: InputDecorationTheme(
        isDense: false,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        labelStyle: textTheme.bodyMedium,
        floatingLabelStyle: textTheme.titleSmall,
        border: const OutlineInputBorder(),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        contentTextStyle: textTheme.bodyLarge?.copyWith(color: scheme.onInverseSurface),
      ),
    );
  }
}
