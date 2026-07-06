import 'package:flutter/material.dart';

import '../theme.dart';

/// Texto largo con criterio de legibilidad para lectura en pantalla:
/// interlineado amplio, párrafos separados y saltos lógicos (evangelio, versículos).
class EvangelioTexto extends StatelessWidget {
  final String texto;
  final double fontSize;
  final FontWeight? fontWeight;
  final Color? color;
  final bool separarParrafos;
  /// Modo lectura del cuerpo del evangelio (más aire y justificado).
  final bool modoLecturaEvangelio;
  final double? alturaLinea;
  final double? letterSpacing;
  final double? espacioEntreParrafos;

  const EvangelioTexto(
    this.texto, {
    super.key,
    this.fontSize = 18,
    this.fontWeight,
    this.color,
    this.separarParrafos = true,
    this.modoLecturaEvangelio = false,
    this.alturaLinea,
    this.letterSpacing,
    this.espacioEntreParrafos,
  });

  TextStyle _estilo(TextTheme tt, ThemeData theme) {
    final base = tt.bodyLarge ?? tt.bodyMedium ?? const TextStyle();
    final altura = alturaLinea ??
        (modoLecturaEvangelio
            ? ReligiousTheme.alturaLineaContenidoEvangelio
            : ReligiousTheme.alturaLineaLectura);
    final espacio = letterSpacing ??
        (modoLecturaEvangelio ? ReligiousTheme.espaciadoLetrasLectura : 0.0);

    return base.copyWith(
      fontSize: fontSize,
      height: altura,
      fontWeight: fontWeight,
      letterSpacing: espacio,
      color: color ?? theme.colorScheme.onSurface.withValues(alpha: 0.94),
    );
  }

  /// Normaliza saltos y separa bloques antes de encabezados litúrgicos o versículos.
  static String prepararParaLectura(String s) {
    var t = s.replaceAll('\r\n', '\n').trim();
    if (t.isEmpty) return t;

    t = t.replaceAll(RegExp(r'[ \t]+\n'), '\n');
    t = t.replaceAll(RegExp(r'\n[ \t]+'), '\n');

    final marcas = <(RegExp, String)>[
      (RegExp(r'\n(Evangelio según)', caseSensitive: false), '\n\nEvangelio según'),
      (RegExp(r'\n(En aquel tiempo)', caseSensitive: false), '\n\nEn aquel tiempo'),
      (RegExp(r'\n(Hermanos)', caseSensitive: false), '\n\nHermanos'),
    ];
    for (final par in marcas) {
      t = t.replaceAll(par.$1, par.$2);
    }

    return t.replaceAll(RegExp(r'\n{3,}'), '\n\n').trim();
  }

  List<String> _bloques(String s) {
    final preparado = modoLecturaEvangelio ? prepararParaLectura(s) : s.trim();
    return preparado
        .split(RegExp(r'\n\s*\n+'))
        .map((e) => e.trim().replaceAll(RegExp(r'\n+'), ' '))
        .where((e) => e.isNotEmpty)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final estilo = _estilo(theme.textTheme, theme);
    final alinear = modoLecturaEvangelio ? TextAlign.justify : TextAlign.start;

    if (!separarParrafos || texto.trim().isEmpty) {
      return Text(
        modoLecturaEvangelio ? prepararParaLectura(texto) : texto,
        style: estilo,
        textAlign: alinear,
      );
    }

    final partes = _bloques(texto);
    if (partes.isEmpty) {
      return const SizedBox.shrink();
    }
    if (partes.length == 1) {
      return Text(partes.first, style: estilo, textAlign: alinear);
    }

    final sep = espacioEntreParrafos ??
        (modoLecturaEvangelio
            ? ReligiousTheme.espacioEntreParrafosEvangelio
            : ReligiousTheme.espacioEntreParrafosLectura);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < partes.length; i++) ...[
          Text(partes[i], style: estilo, textAlign: alinear),
          if (i < partes.length - 1) SizedBox(height: sep),
        ],
      ],
    );
  }
}
