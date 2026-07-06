import { config } from '../config.js';

/**
 * Quita primera lectura, salmo introductorio u otros bloques que a veces comparten artículo
 * antes de la línea «Evangelio según …» / «En aquel tiempo …» / referencia típica (Lc, Mc…).
 */
export function contenidoSoloEvangelio(texto: string): string {
  const t = texto.trim();
  if (!t) return '';

  let i = t.search(/\bEvangelio según\b/i);
  if (i >= 0) return t.slice(i).trim();

  i = t.search(/\bEn aquel tiempo\b/i);
  const hayMarcadorLiturgiaPrevio = /\bprimera\s+lectura\b/i.test(t.slice(0, Math.min(600, t.length)));
  if (i >= 0 && (hayMarcadorLiturgiaPrevio || i > 100)) return t.slice(i).trim();

  if (hayMarcadorLiturgiaPrevio) {
    const refEv = t.search(/\b(?:Lc|Mc|Mt|Jn|Mr)\s+[0-9]{1,2}\s*,/i);
    if (refEv >= 150) return t.slice(refEv).trim();
  }

  return t;
}

/** Título válido cuando la DB o el scraping guardaron otro subtítulo litúrgico por error. */
export function sanitizarTituloEvangelioParaApp(tituloRaw: string, contenido: string): string {
  let t = String(tituloRaw ?? '')
    .replace(/\*{1,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) t = 'Evangelio del día';

  const norm = t.replace(/[#_]+/g, '').trim();
  const esTituloLecturaAjena =
    /^((primera|segunda)\s+lectura)$/i.test(norm) || /^salmo(\s|$)/i.test(norm);

  if (!esTituloLecturaAjena) return t;

  const mi = contenido.search(/\bEvangelio según\b/i);
  if (mi >= 0) {
    const resto = contenido.slice(mi, mi + 650);
    const lineas = resto.split(/\r?\n/).map((x) => x.replace(/\s+/g, ' ').trim());
    const conSegun = lineas.find((ln) => /\bEvangelio según\b/i.test(ln));
    const linea =
      (conSegun && conSegun.length >= 16 ? conSegun : null) ??
      resto.replace(/\s+/g, ' ').trim().slice(0, 520);
    const fin = linea.length;
    if (fin >= 16 && fin < 620) return linea;
  }

  return 'Evangelio del día';
}

/**
 * Tras la proclamación a veces el HTML arrastra otro subtítulo «Primera lectura» (+ texto siguiente).
 * Quita desde esa marca hasta el final.
 */
export function quitarColaDesdeMarcadorPrimeraLectura(texto: string): string {
  let t = texto.trimEnd();
  if (!t) return t;

  const patrones: RegExp[] = [
    /\n\s*\n\s*\*{0,2}\s*primera\s+lectura\*{0,2}[\s\S]*$/i,
    /\n\s+\*{0,2}\s*primera\s+lectura\*{0,2}[\s\S]*$/i,
    /\.\s+\*{0,2}\s*primera\s+lectura\*{0,2}[\s\S]*$/i,
  ];
  for (const rx of patrones) {
    t = t.replace(rx, (m) => (m.startsWith('.') ? '.' : '')).trimEnd();
  }

  const lc = t.toLowerCase();
  const needle = 'primera lectura';
  let last = -1;
  for (let from = 0; ; ) {
    const j = lc.indexOf(needle, from);
    if (j < 0) break;
    last = j;
    from = j + 1;
  }
  if (last >= 200) {
    t = t
      .slice(0, last)
      .replace(/[\s*_#]+$/u, '')
      .trimEnd();
  }

  return t.trimEnd();
}

/** Compara ignorando espacios: valida que la IA no haya cambiado palabras. */
function soloCambioEspacios(original: string, propuesto: string): boolean {
  const a = original.replace(/\s+/g, ' ').trim();
  const b = propuesto.replace(/\s+/g, ' ').trim();
  return a === b;
}

function normalizarNuevasLineas(texto: string): string {
  return texto
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Inserta saltos dobles antes de hitos litúrgicos habituales (idempotente). */
function insertarSaltosLiturgicos(t: string): string {
  const patrones: [RegExp, string][] = [
    [/\n*(En aquel tiempo)\b/gi, '\n\n$1'],
    [/\n*(En esos días)\b/gi, '\n\n$1'],
    [/\n*(Evangelio según)\b/gi, '\n\n$1'],
    [/\n*(Gloria a ti, señor Jesús)\b/gi, '\n\n$1'],
    [/\n*(Palabra del Señor)\b/gi, '\n\n$1'],
    [/\n*(Palabra de Dios)\b/gi, '\n\n$1'],
  ];
  let s = t;
  for (const [rx, rep] of patrones) {
    s = s.replace(rx, rep);
  }
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

/** Tras punto o punto y coma, si empieza referencia evangélica típica, nuevo párrafo. */
function saltosTrasReferencias(t: string): string {
  return t
    .replace(
      /([.;])\s+((?:Mc|Mr|Mt|Lc|Jn|Hch|Rom|Rm|Gál|Gal|Fil|Col|Ef|Hb|1\s*Jn|2\s*Jn|3\s*Jn)\s+[0-9])/gi,
      '$1\n\n$2',
    )
    .replace(/\n{3,}/g, '\n\n');
}

function partirParrafoLargo(parrafo: string, maxLen: number): string[] {
  const p = parrafo.trim();
  if (p.length <= maxLen) return [p];
  const out: string[] = [];
  let rest = p;
  const minCorte = Math.floor(maxLen * 0.42);
  while (rest.length > maxLen) {
    let corte = -1;
    const limBusqueda = Math.min(rest.length, maxLen + 60);
    const busca = rest.slice(0, limBusqueda);
    for (const sep of ['. ', '; ', ': '] as const) {
      let from = limBusqueda;
      while (from > minCorte) {
        const i = busca.lastIndexOf(sep, from - 1);
        if (i < minCorte) break;
        const candidato = i + sep.length;
        if (candidato <= limBusqueda && i >= minCorte) {
          corte = candidato;
          break;
        }
        from = i;
      }
      if (corte > 0) break;
    }
    if (corte < minCorte) corte = maxLen;
    const trozo = rest.slice(0, corte).trim();
    if (trozo) out.push(trozo);
    rest = rest.slice(corte).trim();
  }
  if (rest) out.push(rest);
  return out;
}

function partirParrafosMuyLargos(t: string, maxLen = 340): string {
  const bloques = t.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const unidos = bloques.flatMap((b) => partirParrafoLargo(b, maxLen));
  return unidos.join('\n\n');
}

/**
 * Da más aire entre bloques igual que suele verse en leccionarios / web.
 * Idempotente si se ejecuta más de una vez.
 */
export function formatearContenidoParaLectura(texto: string): string {
  if (!texto?.trim()) return '';
  let t = contenidoSoloEvangelio(texto);
  t = normalizarNuevasLineas(t);
  t = insertarSaltosLiturgicos(t);
  t = saltosTrasReferencias(t);
  t = partirParrafosMuyLargos(t, 340);
  t = quitarColaDesdeMarcadorPrimeraLectura(t);
  return normalizarNuevasLineas(t).replace(/\n{3,}/g, '\n\n');
}

/**
 * Opcional: pide solo reorganizar saltos; se acepta si el texto sin espacios coincide.
 * Solo si OPENAI_API_KEY y EVANGELIO_FORMATO_IA=1.
 */
export async function formatearContenidoSaltosIA(texto: string): Promise<string> {
  const key = config.openaiApiKey?.trim();
  if (!key || String(process.env.EVANGELIO_FORMATO_IA ?? '').trim() !== '1') {
    return texto;
  }

  const prompt = [
    'Tienes este texto litúrgico en español. Tu única tarea es insertar saltos de línea y líneas en blanco ENTRE párrafos para lectura cómoda en móvil.',
    'NO puedes cambiar, añadir ni quitar ninguna palabra, letra, número ni signo. Solo reorganiza espacios en blanco y saltos de línea.',
    'Devuelve ÚNICAMENTE el texto formateado, sin comillas ni explicación.',
    '',
    texto.slice(0, 12000),
  ].join('\n');

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: config.openaiModel,
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente de maquetación. Solo insertas espacios y saltos de línea. Respondes únicamente con el mismo texto que recibes, mejor espaciado, sin cambiar palabras.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: Math.min(4096, Math.ceil(texto.length / 2) + 400),
      }),
    });

    if (!res.ok) {
      console.warn('[formateoLectura] OpenAI HTTP', res.status);
      return texto;
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? '';
    if (raw && soloCambioEspacios(texto, raw)) {
      return raw.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    }
    console.warn('[formateoLectura] IA descartada: el texto sin espacios no coincide con el original.');
  } catch (e) {
    console.warn('[formateoLectura]', (e as Error).message);
  }
  return texto;
}
