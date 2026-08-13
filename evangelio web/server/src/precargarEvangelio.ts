/**
 * Precarga en MongoDB el texto del evangelio y reflexiones genéricas.
 * Uso:
 *   npm run precargar-evangelio
 *   npm run precargar-evangelio -- 2026-08-12 2026-09-12
 *   npm run precargar-evangelio -- 12-08-2026 12-09-2026
 */
import { conectarMongoDB } from './capaConexion/ConexionMongo.js';
import { config } from './config.js';
import { EvangelioNegocio } from './CapaNegocio/EvangelioNegocio.js';
import mongoose from 'mongoose';

async function main() {
  await conectarMongoDB();
  const [desde, hasta] = process.argv.slice(2);
  const opciones =
    desde && hasta
      ? { incluirReflexionesGenericas: true, desde, hasta }
      : { incluirReflexionesGenericas: true };

  if (desde && hasta) {
    console.log(
      `[precargar-evangelio] Rango ${desde} → ${hasta} (delay texto ${config.evangelioPrecargaDelayMs} ms, OpenAI ${config.evangelioPrecargaDelayOpenAIMs} ms)`
    );
  } else {
    console.log(
      `[precargar-evangelio] Iniciando: ${config.evangelioPrecargaDias} días desde hoy (delay ${config.evangelioPrecargaDelayMs} ms)`
    );
  }

  const r = await EvangelioNegocio.precargarTextosCalendario(
    config.evangelioPrecargaDias,
    config.evangelioPrecargaDelayMs,
    opciones
  );
  console.log('[precargar-evangelio] Resultado:', r);
  await mongoose.disconnect();
  const fallo = r.textosFallidos > 0 || r.reflexionesFallidas > 0;
  process.exit(fallo ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
