import { EnvioEvangelioModel, FielModel, type IFiel } from '../capaConexion/Modelos.js';
import { config } from '../config.js';
import { enviarEvangelioPorEmail } from '../CapaServicios/emailEvangelio.js';
import { hayProveedorCorreo } from '../CapaServicios/emailServicio.js';
import { EvangelioNegocio } from './EvangelioNegocio.js';

export type ResultadoTickEnvio = {
  zona: string;
  fecha: string;
  hora: string;
  candidatos: number;
  enviados: number;
  errores: number;
  omitidos: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Fecha (YYYY-MM-DD) y hora (HH:mm) en la zona configurada. */
export function fechaHoraEnZona(zona: string, cuando = new Date()): { fecha: string; hora: string } {
  const fecha = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(cuando);

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: zona,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(cuando);

  let hh = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const mm = parts.find((p) => p.type === 'minute')?.value ?? '00';
  if (hh === '24') hh = '00';
  return { fecha, hora: `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}` };
}

function horaEfectiva(fiel: Pick<IFiel, 'horaEnvio'>): string {
  const h = (fiel.horaEnvio || '').trim();
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(h)) return h;
  return config.envioHoraDefault;
}

let ejecutando = false;

export const EnvioEvangelioNegocio = {
  async listarRecientes(limite = 100) {
    const n = Math.min(500, Math.max(1, limite));
    return EnvioEvangelioModel.find().sort({ enviadoEn: -1 }).limit(n).lean();
  },

  /**
   * Procesa fieles con porEmail=true cuya horaEnvio coincide con el minuto actual
   * en la zona horaria del servidor de envío. Solo canal email (WSP/Instagram pendientes).
   */
  async procesarTick(ahora = new Date()): Promise<ResultadoTickEnvio> {
    const zona = config.envioZonaHoraria;
    const { fecha, hora } = fechaHoraEnZona(zona, ahora);
    const resultado: ResultadoTickEnvio = {
      zona,
      fecha,
      hora,
      candidatos: 0,
      enviados: 0,
      errores: 0,
      omitidos: 0,
    };

    if (!config.envioEmailActivo) {
      return resultado;
    }
    if (!hayProveedorCorreo()) {
      console.warn('[envio evangelio] Sin proveedor de correo; tick omitido.');
      return resultado;
    }
    if (ejecutando) {
      resultado.omitidos++;
      return resultado;
    }

    ejecutando = true;
    try {
      const fieles = await FielModel.find({ porEmail: true }).lean();
      const pendientes = (fieles as IFiel[]).filter((f) => horaEfectiva(f) === hora);
      resultado.candidatos = pendientes.length;
      if (pendientes.length === 0) return resultado;

      let evangelio: { titulo: string; contenido: string; reflexiones?: string[] } | null = null;
      try {
        evangelio = await EvangelioNegocio.obtenerPorFecha(fecha);
      } catch (e) {
        console.error('[envio evangelio] No se pudo obtener evangelio:', (e as Error).message);
        return resultado;
      }

      for (const fiel of pendientes) {
        const email = String(fiel.email).toLowerCase();
        const prev = await EnvioEvangelioModel.findOne({ email, fecha, canal: 'email' }).lean();
        if (prev?.estado === 'enviado') {
          resultado.omitidos++;
          continue;
        }

        try {
          const ok = await enviarEvangelioPorEmail({
            destinatario: email,
            fecha,
            titulo: evangelio.titulo,
            contenido: evangelio.contenido,
            reflexion: evangelio.reflexiones?.[0],
          });
          if (!ok) {
            throw new Error('Proveedor de correo no configurado');
          }
          await EnvioEvangelioModel.findOneAndUpdate(
            { email, fecha, canal: 'email' },
            {
              $set: {
                horaProgramada: horaEfectiva(fiel),
                estado: 'enviado',
                error: '',
                titulo: evangelio.titulo,
                enviadoEn: new Date(),
              },
            },
            { upsert: true, new: true }
          );
          resultado.enviados++;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await EnvioEvangelioModel.findOneAndUpdate(
            { email, fecha, canal: 'email' },
            {
              $set: {
                horaProgramada: horaEfectiva(fiel),
                estado: 'error',
                error: msg.slice(0, 500),
                titulo: evangelio.titulo,
                enviadoEn: new Date(),
              },
            },
            { upsert: true, new: true }
          );
          resultado.errores++;
          console.error(`[envio evangelio] Error a ${email}:`, msg);
        }

        if (config.envioPausaMs > 0) await sleep(config.envioPausaMs);
      }

      if (resultado.enviados || resultado.errores) {
        console.log(
          `[envio evangelio] ${fecha} ${hora} (${zona}): candidatos=${resultado.candidatos} enviados=${resultado.enviados} errores=${resultado.errores} omitidos=${resultado.omitidos}`
        );
      }
      return resultado;
    } finally {
      ejecutando = false;
    }
  },
};

let timer: ReturnType<typeof setInterval> | null = null;

export function iniciarProgramadorEnvioEvangelio(): void {
  if (!config.envioEmailActivo) {
    console.log('[startup] Envío diario por email desactivado (ENVIO_EMAIL_ACTIVO=0).');
    return;
  }
  if (timer) return;

  const intervalo = config.envioIntervaloMs;
  console.log(
    `[startup] Envío diario por email activo. Zona=${config.envioZonaHoraria}, intervalo=${intervalo}ms, hora por defecto=${config.envioHoraDefault}.`
  );

  // Primer tick un poco después del arranque (da tiempo a Mongo / cold start).
  setTimeout(() => {
    EnvioEvangelioNegocio.procesarTick().catch((e) =>
      console.error('[envio evangelio] tick inicial:', (e as Error).message)
    );
  }, 8_000);

  timer = setInterval(() => {
    EnvioEvangelioNegocio.procesarTick().catch((e) =>
      console.error('[envio evangelio] tick:', (e as Error).message)
    );
  }, intervalo);
}
