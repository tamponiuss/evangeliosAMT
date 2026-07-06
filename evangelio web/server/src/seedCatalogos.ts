/** Datos iniciales de catálogos espirituales (Papa, congregaciones, miradas). */
export const SEED_PAPAS = [
  {
    idPapa: 'leon_xiv',
    nomPapa: 'León XIV',
    pontificado: '2025–actualidad',
    queRepresenta:
      'Papa actual, magisterio vivo, unidad y lectura presente de los desafíos de la Iglesia.',
    cuandoElegirlo:
      'Conectar el Evangelio con la voz actual del Papa y los temas presentes de la Iglesia.',
  },
  {
    idPapa: 'francisco',
    nomPapa: 'Francisco',
    pontificado: '2013–2025',
    queRepresenta:
      'Misericordia, fraternidad, periferias, pobres, creación y Evangelio vivido en lo concreto.',
    cuandoElegirlo:
      'Recomenzar, mirar al otro con compasión, vivir una fe cercana, social y práctica.',
  },
  {
    idPapa: 'benedicto_xvi',
    nomPapa: 'Benedicto XVI',
    pontificado: '2005–2013',
    queRepresenta: 'Fe razonada, verdad, belleza, esperanza, liturgia y Cristo como centro.',
    cuandoElegirlo:
      'Profundizar en la fe con claridad, unir corazón e inteligencia, y rezar con más densidad.',
  },
  {
    idPapa: 'juan_pablo_ii',
    nomPapa: 'San Juan Pablo II',
    pontificado: '1978–2005',
    queRepresenta: 'Dignidad humana, familia, juventud, vocación, amor, trabajo y misericordia.',
    cuandoElegirlo:
      'Entender su vida como una vocación, ordenar familia/trabajo/decisiones y vivir con propósito.',
  },
  {
    idPapa: 'pablo_vi',
    nomPapa: 'San Pablo VI',
    pontificado: '1963–1978',
    queRepresenta:
      'Evangelización, conciencia, diálogo con el mundo moderno y conducción del Vaticano II.',
    cuandoElegirlo: 'Vivir una fe creíble en el mundo actual, sin imponer ni diluir la verdad.',
  },
  {
    idPapa: 'juan_xxiii',
    nomPapa: 'San Juan XXIII',
    pontificado: '1958–1963',
    queRepresenta: 'Paz, esperanza, apertura pastoral, diálogo e inicio del Vaticano II.',
    cuandoElegirlo: 'Dialogar, reconciliar, mirar el futuro con confianza y vivir la verdad sin dureza.',
  },
  {
    idPapa: 'pio_xii',
    nomPapa: 'Pío XII',
    pontificado: '1939–1958',
    queRepresenta: 'Biblia, liturgia, doctrina, orden espiritual y lectura seria del Evangelio.',
    cuandoElegirlo:
      'Leer el Evangelio con más contexto, reverencia, profundidad bíblica y sentido litúrgico.',
  },
  {
    idPapa: 'pio_x',
    nomPapa: 'San Pío X',
    pontificado: '1903–1914',
    queRepresenta: 'Catequesis clara, Eucaristía, vida sacramental y formación básica.',
    cuandoElegirlo:
      'Volver a lo esencial de la fe, comprender mejor los sacramentos y formar una práctica sencilla.',
  },
  {
    idPapa: 'leon_xiii',
    nomPapa: 'León XIII',
    pontificado: '1878–1903',
    queRepresenta: 'Doctrina social, trabajo, justicia, dignidad del trabajador y bien común.',
    cuandoElegirlo:
      'Iluminar trabajo, empresa, liderazgo, salario, justicia social y responsabilidad pública.',
  },
  {
    idPapa: 'gregorio_magno',
    nomPapa: 'San Gregorio Magno',
    pontificado: '590–604',
    queRepresenta: 'Liderazgo, humildad, gobierno interior y cuidado pastoral.',
    cuandoElegirlo: 'Liderar, educar o acompañar a otros partiendo por ordenar el propio corazón.',
  },
] as const;

export const SEED_CONGREGACIONES = [
  {
    idCongregacion: 'benedictina',
    nomCongregacion: 'Benedictina',
    enfoqueEditorial: 'Hábito, lectio divina, silencio, constancia.',
  },
  {
    idCongregacion: 'ignaciana_jesuita',
    nomCongregacion: 'Ignaciana / Jesuita',
    enfoqueEditorial: 'Discernimiento, examen, decisiones, libertad interior.',
  },
  {
    idCongregacion: 'salesiana',
    nomCongregacion: 'Salesiana',
    enfoqueEditorial: 'Jóvenes, alegría, carácter, servicio.',
  },
  {
    idCongregacion: 'franciscana',
    nomCongregacion: 'Franciscana',
    enfoqueEditorial: 'Sencillez, gratitud, humildad, fraternidad.',
  },
  {
    idCongregacion: 'dominicana',
    nomCongregacion: 'Dominicana',
    enfoqueEditorial: 'Verdad, contexto bíblico, claridad doctrinal.',
  },
  {
    idCongregacion: 'carmelita',
    nomCongregacion: 'Carmelita',
    enfoqueEditorial: 'Silencio, oración interior, contemplación.',
  },
  {
    idCongregacion: 'agustiniana',
    nomCongregacion: 'Agustiniana',
    enfoqueEditorial: 'Interioridad, deseo, búsqueda de verdad personal.',
  },
  {
    idCongregacion: 'redentorista',
    nomCongregacion: 'Redentorista',
    enfoqueEditorial: 'Misericordia, perdón, reparación, recomenzar.',
  },
  {
    idCongregacion: 'marista',
    nomCongregacion: 'Marista',
    enfoqueEditorial: 'Familia, comunidad, cuidado, pertenencia.',
  },
  {
    idCongregacion: 'lasalliana',
    nomCongregacion: 'Lasalliana',
    enfoqueEditorial: 'Responsabilidad, estudio, disciplina, formación.',
  },
  {
    idCongregacion: 'mariana_schoenstatt_montfortiana',
    nomCongregacion: 'Mariana / Schoenstatt-Montfortiana',
    enfoqueEditorial: 'Confianza, disponibilidad, familia, escucha.',
  },
  {
    idCongregacion: 'focolare_comunion',
    nomCongregacion: 'Focolare / Comunión',
    enfoqueEditorial: 'Unidad, reconciliación, vínculos, comunidad.',
  },
] as const;

export const SEED_MIRADAS = [
  {
    idMirada: 'orden_interior',
    nomMirada: 'Orden Interior',
    descripcion: 'Crear hábito, silencio y constancia espiritual.',
  },
  {
    idMirada: 'discernimiento',
    nomMirada: 'Discernimiento',
    descripcion: 'Tomar decisiones con más conciencia y libertad interior.',
  },
  {
    idMirada: 'sencillez_gratitud',
    nomMirada: 'Sencillez y Gratitud',
    descripcion: 'Vivir con humildad, desapego y servicio.',
  },
  {
    idMirada: 'interioridad_verdad_personal',
    nomMirada: 'Interioridad y Verdad Personal',
    descripcion: 'Mirar el mundo interior, deseos, silencios y autoengaños.',
  },
  {
    idMirada: 'misericordia_nuevo_comienzo',
    nomMirada: 'Misericordia y Nuevo Comienzo',
    descripcion: 'Trabajar perdón, reparación y recomenzar.',
  },
  {
    idMirada: 'comunidad_familia_vinculos',
    nomMirada: 'Comunidad, Familia y Vínculos',
    descripcion: 'Cuidar hogar, amistad, reconciliación y relaciones.',
  },
  {
    idMirada: 'caracter_proposito_servicio',
    nomMirada: 'Carácter, Propósito y Servicio',
    descripcion: 'Formar responsabilidad, estudio/trabajo, acción y servicio.',
  },
  {
    idMirada: 'confianza_disponibilidad',
    nomMirada: 'Confianza y Disponibilidad',
    descripcion: 'Vivir escucha, presencia, familia y apertura a Dios.',
  },
  {
    idMirada: 'ninguna_holistica',
    nomMirada: 'Ninguna mirada espiritual',
    descripcion: 'Sin una mirada concreta: el contenido se centra en el evangelio y las congregaciones elegidas.',
  },
] as const;
