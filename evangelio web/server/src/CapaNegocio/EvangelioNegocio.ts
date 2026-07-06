import { load, type CheerioAPI } from 'cheerio';
import https from 'node:https';

import { EvangelioDiaModel, ReflexionPersonalizadaModel } from '../capaConexion/Modelos.js';
import {
  formatearContenidoParaLectura,
  formatearContenidoSaltosIA,
  sanitizarTituloEvangelioParaApp,
} from '../CapaServicios/formateoLecturaEvangelio.js';
import { config } from '../config.js';
import {
  esPaqueteReflexionesAceptable,
  generarReflexionesIA,
  type PaqueteReflexionesIA,
} from '../CapaServicios/reflexionesIA.js';
import type { ContextoPersonalizacionDTO } from '../CapaDTO/FiltrosEspiritualesDTO.js';

const BASE = 'https://www.dominicos.org/predicacion/evangelio-del-dia/';

function limpiarTexto(s: string): string {
  return s.replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function recortarSeccionEvangelio(texto: string): string {
  const inicioRx = /Evangelio del d[ií]a/i;
  const finMarcadores = [
    /Reciba el Evangelio/i,
    /Suscripci[oó]n gratuita/i,
    /Evangelio de hoy en v[ií]deo/i,
    /Imprimir\s+Descargar PDF/i,
    /Hoy es\.\.\./i,
  ];

  const inicio = texto.search(inicioRx);
  if (inicio >= 0) {
    texto = texto.slice(inicio);
  }

  let fin = texto.length;
  for (const rx of finMarcadores) {
    const idx = texto.search(rx);
    if (idx >= 0) fin = Math.min(fin, idx);
  }
  texto = texto.slice(0, fin);

  return limpiarTexto(texto);
}

/** Quita la frase tipo encabezado “Evangelio del día” del cuerpo ya recortado. */
function quitarEncabezadoEvangelioDelDia(texto: string): string {
  let t = texto.trim();
  t = t.replace(/^(?:Evangelio\s+del\s+d[ií]a|El\s+Evangelio\s+del\s+d[ií]a)\s*:?\s*(?:\n\n|\n)*/i, '');
  const partes = t.split(/\n\s*\n/);
  if (partes[0]?.trim() && /^(?:\s*)evangelio\s+del\s+d[ií]a\s*$/i.test(partes[0].trim())) {
    t = partes.slice(1).join('\n\n').trim();
  }
  return t.trim();
}

/** Replica la estructura del artículo: títulos y párrafos con saltos como en la web. */
function extraerTextoEstructurado($: CheerioAPI): string {
  const selectores = ['main article', '.entry-content', '.post-content', '.predicacion', 'main'];
  for (const sel of selectores) {
    const root = $(sel).first();
    if (!root.length) continue;
    const clone = root.clone();
    clone.find('script, style, noscript, iframe, svg').remove();
    const bloques: string[] = [];
    // Misma lectura visual que la web: encabezados, párrafos, citas y versículos en listas.
    clone.find('h2, h3, h4, h5, h6, blockquote, li, p').each((_, el) => {
      const nodo = $(el).clone();
      nodo.find('br').replaceWith('\n');
      const texto = nodo
        .text()
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t\u200b]+/g, ' ')
        .trim();
      if (texto) bloques.push(texto);
    });
    if (bloques.length > 0) {
      const joined = bloques.join('\n\n').replace(/\n{3,}/g, '\n\n');
      if (joined.length > 120) return limpiarTexto(joined);
    }
    clone.find('br').replaceWith('\n');
    const fallback = limpiarTexto(clone.text());
    if (fallback.length > 200) return fallback;
  }
  return '';
}

function hoyLocalISO(): string {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatearFechaISO(fecha?: string): string {
  if (!fecha) return hoyLocalISO();

  const valor = fecha.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(valor)) {
    const [d, m, y] = valor.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(valor)) {
    const [d, m, y] = valor.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(valor)) {
    const [y, m, d] = valor.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}t/i.test(valor)) {
    return valor.slice(0, 10);
  }
  throw new Error('La fecha debe venir en formato YYYY-MM-DD');
}

function isoAFormatoDominicos(fechaIso: string): string {
  const [y, m, d] = fechaIso.split('-').map((n) => Number(n));
  return `${d}-${m}-${y}`;
}

/** El primer `<h2>` suele ser «Primera lectura»; el título debe ser «Evangelio según …». */
function tituloEvangelioDesdeHtml($: CheerioAPI): string {
  let preferido = '';
  $('main article h2, article h2').each((_, el) => {
    const tex = $(el).text().replace(/\s+/g, ' ').trim();
    if (!tex) return;
    if (/primera\s+lectura|^segunda\s+lectura|^salmo\b/i.test(tex)) return;
    if (/\bEvangelio según\b/i.test(tex)) {
      preferido = tex;
      return false;
    }
  });
  if (preferido) return preferido;
  let fallback = '';
  $('main article h2').each((_, el) => {
    const tex = $(el).text().replace(/\s+/g, ' ').trim();
    if (
      tex &&
      !/^primera\s+lectura$/i.test(tex) &&
      !/^segunda\s+lectura$/i.test(tex) &&
      !/^salmo\b/i.test(tex)
    ) {
      fallback = tex;
      return false;
    }
  });
  return fallback;
}

async function fetchHtml(url: string): Promise<string> {
  try {
    const r = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; EvangelioApp/1.0)',
        accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!r.ok) throw new Error(`Error HTTP ${r.status} al leer dominicos`);
    return r.text();
  } catch (_) {
    return new Promise((resolve, reject) => {
      const req = https.get(
        url,
        {
          rejectUnauthorized: false,
          headers: {
            'user-agent': 'Mozilla/5.0 (compatible; EvangelioApp/1.0)',
            accept: 'text/html,application/xhtml+xml',
          },
        },
        (res) => {
          if ((res.statusCode ?? 0) >= 400) {
            reject(new Error(`Error HTTP ${res.statusCode} al leer dominicos`));
            return;
          }
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
          res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        },
      );
      req.on('error', reject);
    });
  }
}

function extraerEvangelioDesdeHtml(html: string) {
  const $ = load(html);
  $('script, style, noscript, iframe, header, footer, nav, form, .cookie-banner, .cookies, .social, .menu, .navbar').remove();

  let titulo =
    $('main h1').first().text().trim() ||
    $('.entry-title, .post-title, h1').first().text().trim() ||
    'Evangelio del día';

  const h2tituloEv = tituloEvangelioDesdeHtml($);
  if (/^evangelio\s+del\s+d[ií]a$/i.test(titulo) || titulo.length < 4) {
    titulo = h2tituloEv || titulo;
  }
  if ((/^primera\s+lectura$/i.test(titulo) || /^salmo\b/i.test(titulo)) && h2tituloEv) {
    titulo = h2tituloEv;
  }

  let contenido = extraerTextoEstructurado($);

  if (!contenido) {
    const posibles = ['main article', '.entry-content', '.post-content', '.predicacion', 'main'];
    for (const sel of posibles) {
      const t = $(sel).first().text();
      if (t && t.trim().length > 250) {
        contenido = t;
        break;
      }
    }
    if (!contenido) contenido = $('body').text();
  }

  let cuerpo = recortarSeccionEvangelio(contenido);
  const sinFrase = quitarEncabezadoEvangelioDelDia(cuerpo);
  cuerpo = sinFrase.trim() ? sinFrase : cuerpo;

  return {
    titulo: titulo || 'Evangelio del día',
    contenido: cuerpo.trim() ? cuerpo : limpiarTexto(contenido),
  };
}

function paqueteCacheValido(
  r?: string[] | null,
  p?: string[] | null,
  contexto?: ContextoPersonalizacionDTO | null,
): boolean {
  return esPaqueteReflexionesAceptable(r, p, contexto);
}

/** Genera/lee del cache las reflexiones genéricas (sin personalización) de una fecha. */
async function asegurarContenidoIA(
  fecha: string,
  titulo: string,
  contenido: string,
  reflexionesExistentes?: string[] | null,
  preguntasExistentes?: string[] | null,
): Promise<PaqueteReflexionesIA> {
  if (paqueteCacheValido(reflexionesExistentes, preguntasExistentes)) {
    const r = reflexionesExistentes!;
    const p = preguntasExistentes!;
    return {
      reflexiones: [r[0], r[1]],
      preguntasReflexion: [p[0], p[1]],
    };
  }
  const paq = await generarReflexionesIA(titulo, contenido);
  await EvangelioDiaModel.updateOne(
    { fecha },
    {
      $set: {
        reflexiones: [...paq.reflexiones],
        preguntasReflexion: [...paq.preguntasReflexion],
      },
    },
  );
  return paq;
}

/** Identidad del usuario plus para cachear sus reflexiones personalizadas por fecha. */
export interface IdentidadPersonalizacion {
  email: string;
  firmaConfig: string;
}

/** Huella estable de la configuración espiritual; cambia ⇒ se regeneran las reflexiones. */
export function firmaContexto(contexto?: ContextoPersonalizacionDTO | null): string {
  if (!contexto) return '';
  const papa = contexto.idPapaElegido || contexto.papa?.idPapa || '';
  const congregaciones = contexto.congregaciones
    .map((c) => c.idCongregacion)
    .filter(Boolean)
    .sort()
    .join(',');
  const mirada = contexto.idMiradaElegida || contexto.mirada?.idMirada || '';
  /** v8: reflexiones integradoras sin citas de santos. */
  return `${papa}|${congregaciones}|${mirada}|v8`;
}

/** Texto base del evangelio del día (scraping + cache compartido), sin personalizar. */
async function asegurarEvangelioBase(fecha: string): Promise<{
  titulo: string;
  contenido: string;
  fuente: string;
  reflexiones?: string[] | null;
  preguntasReflexion?: string[] | null;
}> {
  const enCache = await EvangelioDiaModel.findOne({ fecha }).lean();
  if (enCache?.titulo && enCache.contenido) {
    const contenidoLectura = formatearContenidoParaLectura(enCache.contenido);
    const tituloOk = sanitizarTituloEvangelioParaApp(enCache.titulo, contenidoLectura);
    return {
      titulo: tituloOk,
      contenido: contenidoLectura,
      fuente: enCache.fuente,
      reflexiones: enCache.reflexiones as string[] | undefined,
      preguntasReflexion: enCache.preguntasReflexion as string[] | undefined,
    };
  }

  const fechaDominicos = isoAFormatoDominicos(fecha);
  const urls = [
    `${BASE}${fechaDominicos}/`,
    `${BASE}?fecha=${fecha}`,
    `${BASE}${fecha}/`,
    `${BASE}`,
  ];

  let ultimoError = '';
  for (const url of urls) {
    try {
      const html = await fetchHtml(url);
      const data = extraerEvangelioDesdeHtml(html);
      let contenidoLectura = formatearContenidoParaLectura(data.contenido);
      contenidoLectura = await formatearContenidoSaltosIA(contenidoLectura);
      const tituloOk = sanitizarTituloEvangelioParaApp(data.titulo, contenidoLectura);
      await EvangelioDiaModel.findOneAndUpdate(
        { fecha },
        {
          titulo: tituloOk,
          contenido: contenidoLectura,
          fuente: url,
          actualizadoEn: new Date(),
        },
        { upsert: true, new: true },
      );
      return { titulo: tituloOk, contenido: contenidoLectura, fuente: url };
    } catch (e) {
      ultimoError = (e as Error).message;
    }
  }
  throw new Error(`No fue posible obtener el evangelio (${ultimoError || 'sin detalle'})`);
}

/**
 * Reflexiones personalizadas del usuario para una fecha.
 * Reutiliza lo guardado mientras la firma de configuración no cambie; si `forzarRegenerar`
 * es true (al guardar configuración) genera contenido nuevo y lo persiste.
 */
async function asegurarReflexionPersonalizada(
  email: string,
  fecha: string,
  titulo: string,
  contenido: string,
  contexto: ContextoPersonalizacionDTO,
  firmaConfig: string,
  forzarRegenerar: boolean,
): Promise<PaqueteReflexionesIA> {
  const emailNorm = email.toLowerCase();
  if (!forzarRegenerar) {
    const prev = await ReflexionPersonalizadaModel.findOne({ email: emailNorm, fecha }).lean();
    if (
      prev &&
      prev.firmaConfig === firmaConfig &&
      paqueteCacheValido(
        prev.reflexiones as string[],
        prev.preguntasReflexion as string[],
        contexto,
      )
    ) {
      const r = prev.reflexiones as string[];
      const p = prev.preguntasReflexion as string[];
      return {
        reflexiones: [r[0]!, r[1]!],
        preguntasReflexion: [p[0]!, p[1]!],
      };
    }
  }

  const paq = await generarReflexionesIA(titulo, contenido, contexto);
  await ReflexionPersonalizadaModel.findOneAndUpdate(
    { email: emailNorm, fecha },
    {
      $set: {
        firmaConfig,
        reflexiones: [...paq.reflexiones],
        preguntasReflexion: [...paq.preguntasReflexion],
        actualizadoEn: new Date(),
      },
    },
    { upsert: true, new: true },
  );
  return paq;
}

/** Lista fechas ISO consecutivas desde hoy (inclusive) durante `dias` días. */
export function fechasDesdeHoy(dias: number): string[] {
  const out: string[] = [];
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  for (let i = 0; i < dias; i++) {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    out.push(`${y}-${m}-${dia}`);
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function evangelioTextoEnCache(fecha: string): Promise<boolean> {
  const doc = await EvangelioDiaModel.findOne({ fecha }).lean();
  return Boolean(doc?.titulo && doc.contenido && String(doc.contenido).trim().length > 80);
}

async function reflexionesGenericasEnCache(fecha: string): Promise<boolean> {
  const doc = await EvangelioDiaModel.findOne({ fecha }).lean();
  return paqueteCacheValido(
    doc?.reflexiones as string[] | undefined,
    doc?.preguntasReflexion as string[] | undefined,
  );
}

export type ResultadoPrecargaEvangelio = {
  diasSolicitados: number;
  textosYaEnCache: number;
  textosPrecargados: number;
  textosFallidos: number;
  reflexionesGeneradas: number;
  reflexionesYaEnCache: number;
  reflexionesFallidas: number;
  fechasTextoFallidas: string[];
  fechasReflexionFallidas: string[];
};

export const EvangelioNegocio = {
  /**
   * Descarga y guarda en MongoDB el texto del evangelio (título + contenido) para hoy
   * y los próximos `diasAnticipados` días. Opcionalmente genera reflexiones/preguntas genéricas.
   */
  async precargarTextosCalendario(
    diasAnticipados?: number,
    delayMs?: number,
    opciones?: { incluirReflexionesGenericas?: boolean },
  ): Promise<ResultadoPrecargaEvangelio> {
    const dias = diasAnticipados ?? config.evangelioPrecargaDias;
    const pausaDominicos = delayMs ?? config.evangelioPrecargaDelayMs;
    const pausaOpenAI = config.evangelioPrecargaDelayOpenAIMs;
    const incluirReflexiones =
      opciones?.incluirReflexionesGenericas ?? config.evangelioPrecargaReflexiones;
    const fechas = fechasDesdeHoy(dias);

    let textosYaEnCache = 0;
    let textosPrecargados = 0;
    let reflexionesGeneradas = 0;
    let reflexionesYaEnCache = 0;
    const fechasTextoFallidas: string[] = [];
    const fechasReflexionFallidas: string[] = [];

    for (const fecha of fechas) {
      let textoListo = await evangelioTextoEnCache(fecha);

      if (!textoListo) {
        try {
          await asegurarEvangelioBase(fecha);
          textosPrecargados++;
          textoListo = true;
          console.log(`[evangelio precarga] Texto OK ${fecha}`);
        } catch (e) {
          fechasTextoFallidas.push(fecha);
          console.warn(`[evangelio precarga] Texto falló ${fecha}:`, (e as Error).message);
        }
        if (pausaDominicos > 0) await sleep(pausaDominicos);
      } else {
        textosYaEnCache++;
      }

      if (!textoListo || !incluirReflexiones) continue;

      if (await reflexionesGenericasEnCache(fecha)) {
        reflexionesYaEnCache++;
        continue;
      }

      try {
        const base = await asegurarEvangelioBase(fecha);
        await asegurarContenidoIA(
          fecha,
          base.titulo,
          base.contenido,
          base.reflexiones,
          base.preguntasReflexion,
        );
        reflexionesGeneradas++;
        console.log(`[evangelio precarga] Reflexiones OK ${fecha}`);
      } catch (e) {
        fechasReflexionFallidas.push(fecha);
        console.warn(`[evangelio precarga] Reflexiones falló ${fecha}:`, (e as Error).message);
      }
      if (pausaOpenAI > 0) await sleep(pausaOpenAI);
    }

    return {
      diasSolicitados: dias,
      textosYaEnCache,
      textosPrecargados,
      textosFallidos: fechasTextoFallidas.length,
      reflexionesGeneradas,
      reflexionesYaEnCache,
      reflexionesFallidas: fechasReflexionFallidas.length,
      fechasTextoFallidas,
      fechasReflexionFallidas,
    };
  },

  async obtenerPorFecha(
    fechaEntrada?: string,
    contexto?: ContextoPersonalizacionDTO | null,
    identidad?: IdentidadPersonalizacion | null,
    opciones?: { forzarRegenerar?: boolean },
  ) {
    const fecha = formatearFechaISO(fechaEntrada);
    const base = await asegurarEvangelioBase(fecha);

    if (contexto && identidad?.email) {
      const firma = identidad.firmaConfig || firmaContexto(contexto);
      const paq = await asegurarReflexionPersonalizada(
        identidad.email,
        fecha,
        base.titulo,
        base.contenido,
        contexto,
        firma,
        opciones?.forzarRegenerar === true,
      );
      return {
        titulo: base.titulo,
        contenido: base.contenido,
        fecha,
        fuente: base.fuente,
        reflexiones: [...paq.reflexiones],
        preguntasReflexion: [...paq.preguntasReflexion],
      };
    }

    const paq = await asegurarContenidoIA(
      fecha,
      base.titulo,
      base.contenido,
      base.reflexiones,
      base.preguntasReflexion,
    );
    return {
      titulo: base.titulo,
      contenido: base.contenido,
      fecha,
      fuente: base.fuente,
      reflexiones: [...paq.reflexiones],
      preguntasReflexion: [...paq.preguntasReflexion],
    };
  },
};
