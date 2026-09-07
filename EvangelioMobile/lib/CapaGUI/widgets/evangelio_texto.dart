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
  /// Modo lectura del cuerpo del evangelio (más aire, sin cortar palabras).
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

  /// Normaliza saltos y separa bloques solo en punto aparte (fin de oración).
  static String prepararParaLectura(String s) {
    var t = s.replaceAll('\r\n', '\n').trim();
    if (t.isEmpty) return t;

    t = t.replaceAll(RegExp(r'[ \t]+\n'), '\n');
    t = t.replaceAll(RegExp(r'\n[ \t]+'), '\n');
    t = t.replaceAll(RegExp(r'(\p{L})-\n(\p{L})', unicode: true), r'$1$2');
    // Un salto simple en medio de frase no es párrafo: pasa a espacio.
    // No capturar '\n' (si no, un punto aparte '\n\n' se vuelve un solo salto).
    t = t.replaceAllMapped(RegExp(r'([^.!?…»"”\n])\n(?!\n)'), (m) => '${m[1]} ');

    final marcas = <(RegExp, String)>[
      (RegExp(r'\n(Evangelio según)', caseSensitive: false), '\n\nEvangelio según'),
      (RegExp(r'\n(En aquel tiempo)', caseSensitive: false), '\n\nEn aquel tiempo'),
      (RegExp(r'\n(Hermanos)', caseSensitive: false), '\n\nHermanos'),
    ];
    for (final par in marcas) {
      t = t.replaceAll(par.$1, par.$2);
    }

    t = t.replaceAll(RegExp(r'\n{3,}'), '\n\n').trim();
    return capitalizarLiturgia(t);
  }

  /// «Evangelio» con E mayúscula; «San Lucas» / «Santa María» con S mayúscula.
  static String capitalizarLiturgia(String s) {
    var t = s.replaceAllMapped(
      RegExp(r'(^|[^\p{L}])evangelio\b', caseSensitive: false, unicode: true),
      (m) => '${m[1]}Evangelio',
    );
    t = t.replaceAllMapped(
      RegExp(r'(^|[^\p{L}])san(ta)?\s+(\p{L})', caseSensitive: false, unicode: true),
      (m) {
        final prefijo = m[1] ?? '';
        final santa = (m[2] ?? '').isNotEmpty;
        final letra = (m[3] ?? '').toUpperCase();
        return '$prefijo${santa ? 'Santa' : 'San'} $letra';
      },
    );
    return t;
  }

  static bool _sigueFrase(String s) {
    return RegExp(r'^[«""]?\s*[a-záéíóúüñ]').hasMatch(s.trim());
  }

  static bool _citaSinCerrar(String s) {
    return RegExp(r'«[^»]*$').hasMatch(s.trim());
  }

  List<String> _bloques(String s) {
    final preparado = modoLecturaEvangelio ? prepararParaLectura(s) : capitalizarLiturgia(s.trim());
    final crudos = preparado
        .split(RegExp(r'\n\s*\n+'))
        .map((e) => e.trim().replaceAll(RegExp(r'\n+'), ' '))
        .where((e) => e.isNotEmpty)
        .toList();

    final unidos = <String>[];
    for (final b in crudos) {
      if (unidos.isEmpty) {
        unidos.add(b);
        continue;
      }
      final prev = unidos.last;
      // Hueco solo en punto aparte. «Levántate» / «y ponte en medio» va junto.
      if (_sigueFrase(b) || _citaSinCerrar(prev)) {
        unidos[unidos.length - 1] = '${prev.trim()} ${b.trim()}';
      } else {
        unidos.add(b);
      }
    }
    return unidos;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final estilo = _estilo(theme.textTheme, theme);
    // start (no justify): en móvil el justificado recorta letras al borde derecho.
    const alinear = TextAlign.start;

    Widget linea(String valor) {
      return Text(
        valor,
        style: estilo,
        textAlign: alinear,
        softWrap: true,
        overflow: TextOverflow.visible,
      );
    }

    if (!separarParrafos || texto.trim().isEmpty) {
      return linea(
        modoLecturaEvangelio ? prepararParaLectura(texto) : capitalizarLiturgia(texto),
      );
    }

    final partes = _bloques(texto);
    if (partes.isEmpty) {
      return const SizedBox.shrink();
    }
    if (partes.length == 1) {
      return linea(partes.first);
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
          linea(partes[i]),
          if (i < partes.length - 1) SizedBox(height: sep),
        ],
      ],
    );
  }
}
