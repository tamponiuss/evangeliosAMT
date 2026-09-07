import 'package:flutter/material.dart';

import '../theme.dart';

/// Pantalla de marca al abrir la app: solo «TuMirada», unos 4 segundos.
class SplashMarcaScreen extends StatefulWidget {
  const SplashMarcaScreen({super.key});

  @override
  State<SplashMarcaScreen> createState() => _SplashMarcaScreenState();
}

class _SplashMarcaScreenState extends State<SplashMarcaScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _fade;
  late final Animation<double> _scale;
  late final Animation<double> _glow;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400));
    _fade = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _scale = Tween<double>(begin: 0.88, end: 1).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic),
    );
    _glow = Tween<double>(begin: 0.18, end: 0.42).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBuilder(
        animation: _ctrl,
        builder: (context, _) {
          return Container(
            width: double.infinity,
            height: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF06243F),
                  Color(0xFF0D4A78),
                  Color(0xFF3D9FD6),
                ],
                stops: [0.0, 0.45, 1.0],
              ),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Positioned.fill(
                  child: CustomPaint(
                    painter: _HaloPainter(opacidad: _glow.value),
                  ),
                ),
                FadeTransition(
                  opacity: _fade,
                  child: ScaleTransition(
                    scale: _scale,
                    child: Text(
                      'TuMirada',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: ReligiousTheme.blanco,
                        fontSize: 52,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 3.2,
                        height: 1.1,
                        shadows: [
                          Shadow(
                            color: Colors.white.withValues(alpha: 0.45),
                            blurRadius: 28,
                          ),
                          Shadow(
                            color: ReligiousTheme.texto.withValues(alpha: 0.35),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _HaloPainter extends CustomPainter {
  final double opacidad;
  const _HaloPainter({required this.opacidad});

  @override
  void paint(Canvas canvas, Size size) {
    final centro = Offset(size.width / 2, size.height * 0.46);
    final radio = size.shortestSide * 0.42;
    final paint = Paint()
      ..shader = RadialGradient(
        colors: [
          Colors.white.withValues(alpha: opacidad),
          const Color(0xFF7EC5EE).withValues(alpha: opacidad * 0.35),
          Colors.transparent,
        ],
        stops: const [0.0, 0.4, 1.0],
      ).createShader(Rect.fromCircle(center: centro, radius: radio));
    canvas.drawCircle(centro, radio, paint);
  }

  @override
  bool shouldRepaint(covariant _HaloPainter oldDelegate) => oldDelegate.opacidad != opacidad;
}
