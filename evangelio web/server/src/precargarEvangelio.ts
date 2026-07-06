/**
 * Precarga en MongoDB el texto del evangelio (hoy + N días).
 * Uso: npm run precargar-evangelio
 */
import { conectarMongoDB } from './capaConexion/ConexionMongo.js';
import { config } from './config.js';
import { EvangelioNegocio } from './CapaNegocio/EvangelioNegocio.js';

async function main() {
  await conectarMongoDB();
  const dias = config.evangelioPrecargaDias;
  console.log(`[precargar-evangelio] Iniciando: ${dias} días (delay ${config.evangelioPrecargaDelayMs} ms)`);
  const r = await EvangelioNegocio.precargarTextosCalendario(dias, config.evangelioPrecargaDelayMs);
  console.log('[precargar-evangelio] Resultado:', r);
  const fallo = r.textosFallidos > 0 || r.reflexionesFallidas > 0;
  process.exit(fallo ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
