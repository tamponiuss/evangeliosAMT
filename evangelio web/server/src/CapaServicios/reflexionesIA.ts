import { config } from '../config.js';
import type { ContextoPersonalizacionDTO } from '../CapaDTO/FiltrosEspiritualesDTO.js';

const MAX_PARRAFOS_POR_REFLEXION = 3;

export type PaqueteReflexionesIA = {
  reflexiones: [string, string];
  preguntasReflexion: [string, string];
};

function limitarParrafos(texto: string, max: number): string {
  const partes = texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return partes.slice(0, max).join('\n\n');
}

function cortarTitulo(titulo: string): string {
  return titulo.length > 90 ? `${titulo.slice(0, 87)}…` : titulo;
}

function normalizarPregunta(s: string): string {
  let t = String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!t.startsWith('¿')) t = `¿${t.replace(/^\?+/, '')}`;
  if (!t.endsWith('?')) t = `${t}?`;
  return t;
}

function normalizarPlano(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function contarPalabras(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

function matizBreve(texto: string, maxPalabras = 10): string {
  const palabras = String(texto ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return palabras.slice(0, maxPalabras).join(' ');
}

function primerTokenNombre(nombre: string): string {
  const t = nombre.replace(/\s+/g, ' ').trim();
  const parte = t.split('/')[0]?.trim() || t;
  return parte.split(/\s+/)[0] || parte;
}

/** Copia literal de textos del catálogo (fichas), no una mención integradora. */
function textoCopiaLiteralCatalogo(texto: string, ctx: ContextoPersonalizacionDTO): boolean {
  const plano = normalizarPlano(texto);
  const fragmentos: string[] = [];
  if (ctx.papa?.queRepresenta) fragmentos.push(ctx.papa.queRepresenta);
  if (ctx.papa?.cuandoElegirlo) fragmentos.push(ctx.papa.cuandoElegirlo);
  for (const c of ctx.congregaciones) {
    if (c.enfoqueEditorial) fragmentos.push(c.enfoqueEditorial);
  }
  if (ctx.mirada?.descripcion) fragmentos.push(ctx.mirada.descripcion);

  for (const frag of fragmentos) {
    const trozo = normalizarPlano(frag).slice(0, 42);
    if (trozo.length >= 28 && plano.includes(trozo)) return true;
  }
  return false;
}

function nombresCriteriosPlus(ctx: ContextoPersonalizacionDTO): string[] {
  const nombres: string[] = [];
  if (ctx.papa?.nomPapa) nombres.push(ctx.papa.nomPapa);
  for (const c of ctx.congregaciones) {
    if (c.nomCongregacion) nombres.push(c.nomCongregacion);
  }
  if (ctx.mirada?.nomMirada) nombres.push(ctx.mirada.nomMirada);
  return nombres;
}

function textoMencionaNombre(nombre: string, textoPlano: string): boolean {
  const plano = normalizarPlano(textoPlano);
  const completo = normalizarPlano(nombre);
  if (completo.length >= 4 && plano.includes(completo)) return true;
  const token = normalizarPlano(primerTokenNombre(nombre));
  return token.length >= 4 && new RegExp(`\\b${token}\\b`).test(plano);
}

/** Las reflexiones Plus deben mencionar e integrar cada criterio elegido. */
function reflexionesIntegranCriteriosPlus(
  reflexiones: [string, string],
  ctx: ContextoPersonalizacionDTO,
): boolean {
  const texto = reflexiones.join(' ');
  const plano = normalizarPlano(texto);

  for (const nombre of nombresCriteriosPlus(ctx)) {
    if (!textoMencionaNombre(nombre, plano)) return false;
  }

  if (textoCopiaLiteralCatalogo(texto, ctx)) return false;
  if (pareceReflexionReforzadaLazy(texto)) return false;
  return true;
}

const FRASES_NO_PERMITIDAS = [
  /como\s+inteligencia\s+artificial/i,
  /como\s+ia\b/i,
  /openai/i,
  /chatgpt/i,
  /no\s+soy\s+te[oó]logo/i,
  /esta palabra se discierne segun la mirada/i,
  /integra esta ensenanza/i,
  /para tu vida concreta, integra/i,
  /ninguna\s+mirada\s+espiritual/i,
  /ninguna\s+de\s+las\s+anteriores/i,
  /vision\s+holistica/i,
  /papa:\s*ninguno/i,
  /\bpapa\s+ninguno\b/i,
  /enfoque del magisterio vivo de la iglesia en general/i,
];

const PREGUNTAS_DEBILES = [
  /^¿qué te (dice|invita|enseña|sugiere)/i,
  /^¿cómo (puedes|podrías|quieres) aplicar/i,
  /^¿de qué manera/i,
  /^¿qué aprendes/i,
  /^¿qué mensaje/i,
  /tu vida (cotidiana|diaria|espiritual)/i,
  /acercarte a dios/i,
  /gesto (concreto|sencillo)/i,
  /en tu camino/i,
  /reflexionar sobre/i,
  /meditar (sobre|en)/i,
];

const ANCLAJE_CONCRETO =
  /hoy|mañana|esta semana|próximas?\s+24|en casa|familia|trabajo|oficina|silencio|perdón|perdonar|conversación|reconcili|vecino|hijo|hija|esposo|esposa|madre|padre|hermano|comunidad|oración|eucarist|confesar|llamar|hablar|dejar|renunciar|pedir|servir|visitar|acompañar/i;

function pareceReflexionReforzadaLazy(texto: string): boolean {
  return /esta palabra se discierne|integra esta enseñanza|segun la mirada\s*"/i.test(texto);
}

function mencionaOpcionesVacias(texto: string): boolean {
  const plano = normalizarPlano(texto);
  if (/\bninguno\b/.test(plano) && /papa|magisterio|referencia/.test(plano)) return true;
  if (plano.includes('ninguna mirada')) return true;
  return false;
}

function preguntasDemasiadoParecidas(p1: string, p2: string): boolean {
  const a = normalizarPlano(p1);
  const b = normalizarPlano(p2);
  if (a.slice(0, 45) === b.slice(0, 45)) return true;
  const palabrasA = a.split(/\s+/).filter((w) => w.length > 4);
  const setB = new Set(b.split(/\s+/).filter((w) => w.length > 4));
  const overlap = palabrasA.filter((w) => setB.has(w)).length;
  return overlap >= 5;
}

function preguntasSonFuertes(
  p1: string,
  p2: string,
  ctx: ContextoPersonalizacionDTO | null,
): boolean {
  for (const p of [p1, p2]) {
    if (!p || p.length < 90 || p.length > 320) return false;
    const palabras = contarPalabras(p);
    if (palabras < 18 || palabras > 52) return false;
    if (!p.startsWith('¿') || !p.endsWith('?')) return false;
    if (PREGUNTAS_DEBILES.some((rx) => rx.test(p))) return false;
    if (!ANCLAJE_CONCRETO.test(p)) return false;
    if (ctx && textoCopiaLiteralCatalogo(p, ctx)) return false;
  }
  if (preguntasDemasiadoParecidas(p1, p2)) return false;
  return true;
}

function paquetePasaValidacionBasica(paq: PaqueteReflexionesIA, ctx: ContextoPersonalizacionDTO | null): boolean {
  const todo = [...paq.reflexiones, ...paq.preguntasReflexion].join(' ');
  if (FRASES_NO_PERMITIDAS.some((rx) => rx.test(todo))) return false;
  if (mencionaOpcionesVacias(todo)) return false;
  if (paq.reflexiones.some((r) => pareceReflexionReforzadaLazy(r))) return false;
  const [r1, r2] = paq.reflexiones;
  const [p1, p2] = paq.preguntasReflexion;
  if (!r1 || r1.length < 120 || !r2 || r2.length < 120) return false;
  if (!preguntasSonFuertes(p1, p2, ctx)) return false;
  return true;
}

function paqueteReflexionesIntegranPlus(
  paq: PaqueteReflexionesIA,
  ctx: ContextoPersonalizacionDTO | null,
): boolean {
  if (!ctx) return true;
  return reflexionesIntegranCriteriosPlus(paq.reflexiones, ctx);
}

function bloqueInstruccionesPreguntas(ctx: ContextoPersonalizacionDTO | null): string[] {
  const lineas = [
    'PREGUNTAS DE REFLEXIÓN (parte más importante del JSON — máxima calidad y extensión):',
    '- Exactamente DOS preguntas; cada una es UNA sola oración larga (18–45 palabras), que empiece con ¿ y termine en ?.',
    '- Desarrolla cada pregunta con dos o tres matices enlazados (pasaje + escena concreta + consecuencia interior), sin frases telegráficas.',
    '- Pregunta 1 — EXAMEN PROFUNDO: nombra una resistencia, omisión, miedo o dureza que ESTE evangelio desnuda; sitúala en un ámbito real (hogar, trabajo, relación, silencio, comunidad) y añade por qué duele evitarla.',
    '- Pregunta 2 — COMPROMISO EXIGENTE: pide un acto nombrable en las próximas 24–48 h (hablar, perdonar, callar, servir, confesar, visitar, reparar) ligado a una imagen o verbo del pasaje; indica con quién, cuándo o en qué lugar.',
    '- Prohibido: preguntas genéricas o cortas (“¿qué te dice el evangelio?”, “¿cómo aplicarlo?”, “gesto concreto”, “¿qué aprendes?”).',
    '- Prohibido: nombrar o describir Papa, congregaciones ni mirada espiritual; la personalización es solo de tono, no de catálogo.',
    '- Las dos preguntas deben ser claramente distintas (examen ≠ compromiso) y de similar densidad.',
  ];
  if (ctx) {
    lineas.push(
      '- El matiz de los lentes interiores (abajo) debe notarse en el tono y en el tipo de exigencia, sin citar esas opciones ni sus características.',
    );
  }
  return lineas;
}

function bloqueInstruccionesReflexiones(ctx: ContextoPersonalizacionDTO): string[] {
  const menciones: string[] = [];
  if (ctx.papa) menciones.push(`el Papa ${ctx.papa.nomPapa}`);
  for (const c of ctx.congregaciones) menciones.push(`la congregación ${c.nomCongregacion}`);
  if (ctx.mirada) menciones.push(`la mirada espiritual «${ctx.mirada.nomMirada}»`);

  return [
    'REFLEXIONES PLUS (integradoras — obligatorio):',
    `- En las DOS reflexiones debes MENCIONAR por su nombre: ${menciones.join('; ')}.`,
    '- Integra cada criterio con imágenes y actitudes de ESTE evangelio: no listes fichas ni copies textos del catálogo.',
    '- Reflexión 1: une el pasaje con el Papa y al menos una congregación; muestra cómo iluminan la escena.',
    '- Reflexión 2: profundiza el evangelio con la mirada espiritual y el carisma de las congregaciones elegidas.',
    '- Prohibido: párrafos que solo describan quién es el Papa o qué es cada congregación; siempre evangelio + criterio en el mismo párrafo.',
    '- Prohibido: citar escritos de santos; prohibido "ninguno", "ninguna mirada espiritual", opciones no elegidas.',
  ];
}

function bloquePersonalizacion(ctx: ContextoPersonalizacionDTO): string {
  const lineas: string[] = [
    'CRITERIOS ESPIRITUALES DEL FIEL PLUS (integrar en las reflexiones; mencionar por nombre):',
  ];
  if (ctx.papa) {
    lineas.push(
      `- Papa: ${ctx.papa.nomPapa} (${ctx.papa.pontificado}).`,
      `  Matiz para integrar (no copiar literal): ${matizBreve(ctx.papa.queRepresenta, 14)}.`,
    );
  }
  if (ctx.congregaciones.length) {
    lineas.push('- Congregaciones elegidas:');
    for (const c of ctx.congregaciones) {
      lineas.push(`  · ${c.nomCongregacion} — matiz: ${matizBreve(c.enfoqueEditorial, 14)}.`);
    }
  }
  if (ctx.mirada) {
    lineas.push(
      `- Mirada espiritual: «${ctx.mirada.nomMirada}».`,
      `  Matiz para integrar (no copiar literal): ${matizBreve(ctx.mirada.descripcion, 14)}.`,
    );
  }
  lineas.push('', ...bloqueInstruccionesReflexiones(ctx));
  return lineas.join('\n');
}

function reflexionFallback(index: 1 | 2, titulo: string): string {
  const corto = cortarTitulo(titulo);
  if (index === 1) {
    return [
      `«${corto}» no es un aviso lejano: hoy puede cambiar cómo hablamos en casa, cómo perdonamos o cómo trabajamos.`,
      'Antes de seguir con la rutina, detengámonos en una escena del texto que nos incomode o nos consuele.',
      'Pidamos al Espíritu Santo la gracia de una obediencia concreta — no un propósito vago para “algún día”.',
    ].join('\n\n');
  }
  return [
    'La Palabra busca frutos visibles: paciencia donde explotamos, verdad donde callamos, servicio donde nos cerramos.',
    'Si el evangelio nos revela un orgullo callado o un miedo disfrazado de prudencia, es señal de misericordia, no de reproche estéril.',
    'Cerremos el día nombrando en voz baja un gesto posible mañana y agradeciendo un signo pequeño del amor de Dios.',
  ].join('\n\n');
}

function preguntasFallback(titulo: string): [string, string] {
  const c = cortarTitulo(titulo);
  return [
    normalizarPregunta(
      `¿Qué omisión, orgullo o miedo te revela «${c}» en una relación cercana, y por qué te cuesta admitirlo en oración antes de que termine el día?`,
    ),
    normalizarPregunta(
      `¿Qué palabra de perdón, de silencio o de servicio concreto ofrecerías en las próximas 24 horas —con quién y en qué lugar— si creyeras que Cristo te interpela desde este pasaje?`,
    ),
  ];
}

function reflexionFallbackPersonalizada(index: 1 | 2, titulo: string, ctx: ContextoPersonalizacionDTO): string {
  const corto = cortarTitulo(titulo);
  const congs = ctx.congregaciones.map((c) => c.nomCongregacion).join(' y ');
  const papa = ctx.papa?.nomPapa;
  const mirada = ctx.mirada?.nomMirada;

  if (index === 1) {
    const abre = papa
      ? `Con el magisterio de ${papa}, «${corto}» nos interpela donde más duele: en decisiones aplazadas y vínculos evitados.`
      : `«${corto}» nos interpela donde más duele: en decisiones aplazadas y vínculos evitados.`;
    const medio = congs
      ? `La espiritualidad de ${congs} nos ayuda a leer este pasaje con ojos de misión y servicio, no solo de comodidad.`
      : '';
    return [abre, medio, 'Pidamos al Señor una respuesta concreta antes de que termine el día.']
      .filter(Boolean)
      .join('\n\n');
  }

  const miradaTxt = mirada
    ? `Desde la mirada «${mirada}», el evangelio confronta si nuestra fe baja a la mesa, al trabajo y al perdón pedido.`
    : 'Este evangelio confronta si nuestra fe baja a la mesa, al trabajo y al perdón pedido.';
  const congTxt = congs
    ? `${miradaTxt} ${congs} nos invita a una actitud de caridad y reconciliación en casa y comunidad.`
    : miradaTxt;
  return [
    congTxt,
    papa
      ? `${papa} nos recuerda que la Palabra busca frutos visibles, no ideas sueltas.`
      : 'La Palabra busca frutos visibles, no ideas sueltas.',
    'Terminemos en silencio breve, pidiendo perseverancia para lo que ya sabemos que debemos hacer.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function preguntasFallbackPersonalizadas(titulo: string, _ctx: ContextoPersonalizacionDTO): [string, string] {
  const corto = cortarTitulo(titulo);
  return [
    normalizarPregunta(
      `¿Qué verdad incómoda de «${corto}» sigues postergando en una conversación de casa o de trabajo, y qué miedo te impide nombrarla en voz alta hoy?`,
    ),
    normalizarPregunta(
      `¿A quién servirías, perdonarías o visitarías en las próximas 24 horas si tomaras en serio una imagen concreta de «${corto}», aunque te cueste silencio, humillación o tiempo?`,
    ),
  ];
}

function paqueteFallback(ctx?: ContextoPersonalizacionDTO | null, titulo?: string): PaqueteReflexionesIA {
  const t = titulo ?? 'Evangelio del día';
  if (ctx) {
    return {
      reflexiones: [reflexionFallbackPersonalizada(1, t, ctx), reflexionFallbackPersonalizada(2, t, ctx)],
      preguntasReflexion: preguntasFallbackPersonalizadas(t, ctx),
    };
  }
  return {
    reflexiones: [reflexionFallback(1, t), reflexionFallback(2, t)],
    preguntasReflexion: preguntasFallback(t),
  };
}

function construirPrompt(
  titulo: string,
  contenido: string,
  ctx: ContextoPersonalizacionDTO | null,
  intentoEstricto: boolean,
): { system: string; user: string } {
  const base = contenido.slice(0, 4200);
  const esPlus = Boolean(ctx);

  const system = esPlus
    ? 'Eres un sacerdote católico con experiencia de acompañamiento espiritual y examen de conciencia. ' +
      'Redactas en español claro y pastoral para un fiel Plus. ' +
      'Las reflexiones integran el evangelio del día con el Papa, las congregaciones y la mirada espiritual que el fiel eligió: debes MENCIONARLOS por nombre y tejerlos con el pasaje (sin citar escritos de santos). ' +
      'Las DOS PREGUNTAS son oraciones largas (18–45 palabras): examen profundo y compromiso exigente en 24–48 h (sin repetir fichas del catálogo). ' +
      'Nunca menciones “ninguno”, “ninguna mirada espiritual” ni opciones no elegidas. ' +
      'Respondes únicamente con el JSON solicitado.'
    : 'Eres un sacerdote católico. Escribes en español claro y pastoral. ' +
      'Las preguntas deben ser oraciones largas, incisivas y concretas: examen de conciencia y compromiso en 24–48 h. ' +
      'Respondes solo con el JSON pedido.';

  const lineas = [`Lectura litúrgica: ${titulo}`, '', base, ''];
  if (ctx) lineas.push(bloquePersonalizacion(ctx), '---');
  lineas.push(...bloqueInstruccionesPreguntas(ctx), '---');

  if (intentoEstricto && ctx) {
    lineas.push(
      'REINTENTO: Las reflexiones no mencionaron todos los criterios Plus o las preguntas fueron débiles.',
      `En reflexion1 y reflexion2 MENCIONA e integra: ${nombresCriteriosPlus(ctx).join(', ')} con el evangelio (sin citas de santos).`,
      'Reescribe pregunta1 como EXAMEN PROFUNDO (18–45 palabras) y pregunta2 como COMPROMISO EXIGENTE (18–45 palabras).',
      'Prohibido copiar textos del catálogo; prohibido repetir la misma idea en ambas preguntas.',
      '',
    );
  } else if (intentoEstricto) {
    lineas.push(
      'REINTENTO: Las preguntas fueron genéricas o demasiado cortas. Hazlas más largas (18–45 palabras cada una), concretas (hogar, trabajo, perdón, conversación, hoy/mañana) y ligadas al pasaje.',
      '',
    );
  }

  lineas.push(
    'Genera en español:',
    `1) Dos reflexiones pastorales católicas. Cada una: 2 a ${MAX_PARRAFOS_POR_REFLEXION} párrafos separados por línea en blanco.`,
    esPlus
      ? '   Integradoras Plus: evangelio + Papa + congregaciones + mirada espiritual, todos mencionados por nombre en las dos reflexiones.'
      : '   Tono cercano, concreto y fiel al pasaje; evita generalidades.',
    '2) Las dos preguntas según las instrucciones PREGUNTAS DE REFLEXIÓN de arriba.',
    '3) Marco doctrinal católico romano. Sin citas inventadas. Sin mencionar IA.',
    '',
    'JSON exacto (sin markdown):',
    '{"reflexion1":"...","reflexion2":"...","pregunta1":"...","pregunta2":"..."}',
  );

  return { system, user: lineas.filter(Boolean).join('\n') };
}

async function llamarOpenAI(
  system: string,
  user: string,
  esPlus: boolean,
): Promise<PaqueteReflexionesIA | null> {
  const key = config.openaiApiKey?.trim();
  if (!key) return null;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: config.openaiModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: esPlus ? 0.65 : 0.55,
      max_tokens: esPlus ? 2600 : 1800,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn('[reflexionesIA] OpenAI HTTP', res.status, err.slice(0, 200));
    return null;
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  let raw = data.choices?.[0]?.message?.content?.trim() ?? '';
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const js = JSON.parse(raw) as {
    reflexion1?: string;
    reflexion2?: string;
    pregunta1?: string;
    pregunta2?: string;
  };
  const r1 = limitarParrafos(String(js.reflexion1 ?? '').trim(), MAX_PARRAFOS_POR_REFLEXION);
  const r2 = limitarParrafos(String(js.reflexion2 ?? '').trim(), MAX_PARRAFOS_POR_REFLEXION);
  const p1 = normalizarPregunta(String(js.pregunta1 ?? '').trim());
  const p2 = normalizarPregunta(String(js.pregunta2 ?? '').trim());

  return { reflexiones: [r1, r2], preguntasReflexion: [p1, p2] };
}

function paqueteAceptable(paq: PaqueteReflexionesIA, ctx: ContextoPersonalizacionDTO | null): boolean {
  if (!paquetePasaValidacionBasica(paq, ctx)) return false;
  if (!paqueteReflexionesIntegranPlus(paq, ctx)) return false;
  return true;
}

/** Valida un paquete ya guardado (p. ej. caché en Mongo) con las mismas reglas que la generación IA. */
export function esPaqueteReflexionesAceptable(
  reflexiones: string[] | null | undefined,
  preguntasReflexion: string[] | null | undefined,
  contexto?: ContextoPersonalizacionDTO | null,
): boolean {
  if (
    !Array.isArray(reflexiones) ||
    reflexiones.length < 2 ||
    !reflexiones[0]?.trim() ||
    !reflexiones[1]?.trim() ||
    !Array.isArray(preguntasReflexion) ||
    preguntasReflexion.length < 2 ||
    !preguntasReflexion[0]?.trim() ||
    !preguntasReflexion[1]?.trim()
  ) {
    return false;
  }
  const paq: PaqueteReflexionesIA = {
    reflexiones: [reflexiones[0].trim(), reflexiones[1].trim()],
    preguntasReflexion: [
      normalizarPregunta(preguntasReflexion[0]),
      normalizarPregunta(preguntasReflexion[1]),
    ],
  };
  return paqueteAceptable(paq, contexto ?? null);
}

/** Dos reflexiones pastorales + dos preguntas (genéricas o 100 % personalizadas Plus). */
export async function generarReflexionesIA(
  titulo: string,
  contenido: string,
  contexto?: ContextoPersonalizacionDTO | null,
): Promise<PaqueteReflexionesIA> {
  const key = config.openaiApiKey?.trim();
  if (!key) {
    return paqueteFallback(contexto, titulo);
  }

  for (let intento = 0; intento < 3; intento++) {
    try {
      const { system, user } = construirPrompt(titulo, contenido, contexto ?? null, intento > 0);
      const paq = await llamarOpenAI(system, user, Boolean(contexto));
      if (paq && paqueteAceptable(paq, contexto ?? null)) return paq;
    } catch (e) {
      console.warn('[reflexionesIA]', (e as Error).message);
    }
  }

  return paqueteFallback(contexto, titulo);
}
