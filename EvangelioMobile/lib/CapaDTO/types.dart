const String perfilFielBasico = 'perfil-fiel';
const String perfilFielPlus = 'perfil-fiel-plus';

bool esPerfilPlus(String idPerfil) => idPerfil == perfilFielPlus;

class UsuarioMovil {
  final String email;
  final String idPerfil;
  final String idPapa;
  final List<String> congregaciones;
  final String idMirada;
  final bool filtrosConfigurados;
  final String plusPagadoEn;
  final String plusReferenciaPago;
  final bool porEmail;
  final bool porAPP;
  final bool porWSP;
  final bool porInstagram;
  final String numCelular;
  final String cuentaInstagram;
  final String horaEnvio;

  const UsuarioMovil({
    required this.email,
    required this.idPerfil,
    this.idPapa = '',
    this.congregaciones = const [],
    this.idMirada = '',
    this.filtrosConfigurados = false,
    this.plusPagadoEn = '',
    this.plusReferenciaPago = '',
    this.porEmail = false,
    this.porAPP = true,
    this.porWSP = false,
    this.porInstagram = false,
    this.numCelular = '',
    this.cuentaInstagram = '',
    this.horaEnvio = '',
  });

  factory UsuarioMovil.fromJson(Map<String, dynamic> json) => UsuarioMovil(
        email: (json['email'] ?? '').toString(),
        idPerfil: (json['idPerfil'] ?? '').toString(),
        idPapa: (json['idPapa'] ?? '').toString(),
        congregaciones: json['congregaciones'] is List
            ? (json['congregaciones'] as List).map((e) => e.toString()).toList()
            : const [],
        idMirada: (json['idMirada'] ?? '').toString(),
        filtrosConfigurados: json['filtrosConfigurados'] == true,
        porEmail: json['porEmail'] == true,
        porAPP: json['porAPP'] != false,
        porWSP: json['porWSP'] == true,
        porInstagram: json['porInstagram'] == true,
        numCelular: (json['numCelular'] ?? '').toString(),
        cuentaInstagram: (json['cuentaInstagram'] ?? '').toString(),
        horaEnvio: (json['horaEnvio'] ?? '').toString(),
      );

  Map<String, dynamic> toJson() => {
        'email': email,
        'idPerfil': idPerfil,
        'idPapa': idPapa,
        'congregaciones': congregaciones,
        'idMirada': idMirada,
        'filtrosConfigurados': filtrosConfigurados,
        'plusPagadoEn': plusPagadoEn,
        'plusReferenciaPago': plusReferenciaPago,
        'porEmail': porEmail,
        'porAPP': porAPP,
        'porWSP': porWSP,
        'porInstagram': porInstagram,
        'numCelular': numCelular,
        'cuentaInstagram': cuentaInstagram,
        'horaEnvio': horaEnvio,
      };
}

/// Preferencias de entrega del evangelio diario.
class PreferenciasEntrega {
  final bool porEmail;
  final bool porAPP;
  final bool porWSP;
  final bool porInstagram;
  final String numCelular;
  final String cuentaInstagram;
  final String horaEnvio;

  const PreferenciasEntrega({
    required this.porEmail,
    required this.porAPP,
    required this.porWSP,
    required this.porInstagram,
    this.numCelular = '',
    this.cuentaInstagram = '',
    this.horaEnvio = '',
  });

  Map<String, dynamic> toJson() => {
        'porEmail': porEmail,
        'porAPP': porAPP,
        'porWSP': porWSP,
        'porInstagram': porInstagram,
        'numCelular': numCelular,
        'cuentaInstagram': cuentaInstagram,
        'horaEnvio': horaEnvio,
      };
}

class PapaCatalogo {
  final String idPapa;
  final String nomPapa;
  final String pontificado;
  final String queRepresenta;
  final String cuandoElegirlo;

  const PapaCatalogo({
    required this.idPapa,
    required this.nomPapa,
    required this.pontificado,
    required this.queRepresenta,
    required this.cuandoElegirlo,
  });

  factory PapaCatalogo.fromJson(Map<String, dynamic> json) => PapaCatalogo(
        idPapa: (json['idPapa'] ?? '').toString(),
        nomPapa: (json['nomPapa'] ?? '').toString(),
        pontificado: (json['pontificado'] ?? '').toString(),
        queRepresenta: (json['queRepresenta'] ?? '').toString(),
        cuandoElegirlo: (json['cuandoElegirlo'] ?? '').toString(),
      );
}

class CongregacionCatalogo {
  final String idCongregacion;
  final String nomCongregacion;
  final String enfoqueEditorial;

  const CongregacionCatalogo({
    required this.idCongregacion,
    required this.nomCongregacion,
    required this.enfoqueEditorial,
  });

  factory CongregacionCatalogo.fromJson(Map<String, dynamic> json) => CongregacionCatalogo(
        idCongregacion: (json['idCongregacion'] ?? '').toString(),
        nomCongregacion: (json['nomCongregacion'] ?? '').toString(),
        enfoqueEditorial: (json['enfoqueEditorial'] ?? '').toString(),
      );
}

class MiradaCatalogo {
  final String idMirada;
  final String nomMirada;
  final String descripcion;

  const MiradaCatalogo({
    required this.idMirada,
    required this.nomMirada,
    required this.descripcion,
  });

  factory MiradaCatalogo.fromJson(Map<String, dynamic> json) => MiradaCatalogo(
        idMirada: (json['idMirada'] ?? '').toString(),
        nomMirada: (json['nomMirada'] ?? '').toString(),
        descripcion: (json['descripcion'] ?? '').toString(),
      );
}

class CatalogosEspirituales {
  final List<PapaCatalogo> papas;
  final List<CongregacionCatalogo> congregaciones;
  final List<MiradaCatalogo> miradas;

  const CatalogosEspirituales({
    required this.papas,
    required this.congregaciones,
    required this.miradas,
  });

  factory CatalogosEspirituales.fromJson(Map<String, dynamic> json) {
    List<T> mapList<T>(dynamic raw, T Function(Map<String, dynamic>) fn) {
      if (raw is! List) return [];
      return raw
          .whereType<Map>()
          .map((e) => fn(Map<String, dynamic>.from(e)))
          .toList();
    }

    return CatalogosEspirituales(
      papas: mapList(json['papas'], PapaCatalogo.fromJson),
      congregaciones: mapList(json['congregaciones'], CongregacionCatalogo.fromJson),
      miradas: mapList(json['miradas'], MiradaCatalogo.fromJson),
    );
  }
}

class FiltrosEspirituales {
  final String idPapa;
  final List<String> congregaciones;
  final String idMirada;
  final bool filtrosConfigurados;

  const FiltrosEspirituales({
    required this.idPapa,
    required this.congregaciones,
    required this.idMirada,
    required this.filtrosConfigurados,
  });

  factory FiltrosEspirituales.fromJson(Map<String, dynamic> json) => FiltrosEspirituales(
        idPapa: (json['idPapa'] ?? '').toString(),
        congregaciones: json['congregaciones'] is List
            ? (json['congregaciones'] as List).map((e) => e.toString()).toList()
            : const [],
        idMirada: (json['idMirada'] ?? '').toString(),
        filtrosConfigurados: json['filtrosConfigurados'] == true,
      );

  Map<String, dynamic> toJson() => {
        'idPapa': idPapa,
        'congregaciones': congregaciones,
        'idMirada': idMirada,
      };
}

class ParametroApp {
  final String idParametro;
  final double monto;
  final String moneda;
  final String descripcion;
  final String periodo;
  final bool activo;

  const ParametroApp({
    required this.idParametro,
    required this.monto,
    required this.moneda,
    required this.descripcion,
    required this.periodo,
    required this.activo,
  });

  factory ParametroApp.fromJson(Map<String, dynamic> json) => ParametroApp(
        idParametro: (json['idParametro'] ?? '').toString(),
        monto: (json['monto'] is num) ? (json['monto'] as num).toDouble() : 0,
        moneda: (json['moneda'] ?? 'USD').toString(),
        descripcion: (json['descripcion'] ?? '').toString(),
        periodo: (json['periodo'] ?? 'mensual').toString(),
        activo: json['activo'] != false,
      );

  String get etiquetaPrecio {
    final m = monto == monto.roundToDouble() ? monto.toStringAsFixed(0) : monto.toStringAsFixed(2);
    return '$moneda $m / $periodo';
  }
}

class EvangelioDTO {
  final String fecha;
  final String titulo;
  final String contenido;
  final String fuente;
  /// Dos reflexiones (p. ej. generadas en el servidor con IA).
  final List<String> reflexiones;
  /// Dos preguntas de reflexión espiritual (IA).
  final List<String> preguntasReflexion;

  const EvangelioDTO({
    required this.fecha,
    required this.titulo,
    required this.contenido,
    required this.fuente,
    this.reflexiones = const [],
    this.preguntasReflexion = const [],
  });

  factory EvangelioDTO.fromJson(Map<String, dynamic> json) {
    final ref = json['reflexiones'];
    final list = ref is List
        ? ref.map((e) => e.toString()).where((s) => s.trim().isNotEmpty).toList()
        : <String>[];
    final preg = json['preguntasReflexion'];
    final listPreg = preg is List
        ? preg.map((e) => e.toString()).where((s) => s.trim().isNotEmpty).toList()
        : <String>[];
    return EvangelioDTO(
      fecha: (json['fecha'] ?? '').toString(),
      titulo: (json['titulo'] ?? '').toString(),
      contenido: (json['contenido'] ?? '').toString(),
      fuente: (json['fuente'] ?? '').toString(),
      reflexiones: list,
      preguntasReflexion: listPreg,
    );
  }
}

