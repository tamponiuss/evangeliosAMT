import cors from 'cors';

import express, { type Request, type Response, type NextFunction } from 'express';

import { conectarMongoDB } from './capaConexion/ConexionMongo.js';

import { config } from './config.js';

import { authRutas } from './CapaServicios/rutas/authRutas.js';

import { dashboardRutas } from './CapaServicios/rutas/dashboardRutas.js';

import { evangelioRutas } from './CapaServicios/rutas/evangelioRutas.js';

import { fielRutas } from './CapaServicios/rutas/fielRutas.js';

import { paisRutas } from './CapaServicios/rutas/paisRutas.js';

import { perfilRutas } from './CapaServicios/rutas/perfilRutas.js';

import { usuarioRutas } from './CapaServicios/rutas/usuarioRutas.js';

import { papaRutas } from './CapaServicios/rutas/papaRutas.js';

import { congregacionRutas } from './CapaServicios/rutas/congregacionRutas.js';

import { miradaEspiritualRutas } from './CapaServicios/rutas/miradaEspiritualRutas.js';

import { parametroRutas } from './CapaServicios/rutas/parametroRutas.js';
import { EvangelioNegocio } from './CapaNegocio/EvangelioNegocio.js';



const app = express();

app.use(cors({ origin: true, credentials: true }));

app.use(express.json({ limit: '1mb' }));



app.get('/api/health', (_req, res) => {

  res.json({ ok: true, servicio: 'evangelioweb-api' });

});



app.use('/api/auth', authRutas);

app.use('/api/dashboard', dashboardRutas);

app.use('/api/perfiles', perfilRutas);

app.use('/api/usuarios', usuarioRutas);

app.use('/api/paises', paisRutas);

app.use('/api/fieles', fielRutas);

app.use('/api/evangelio', evangelioRutas);

app.use('/api/papas', papaRutas);

app.use('/api/congregaciones', congregacionRutas);

app.use('/api/miradas-espirituales', miradaEspiritualRutas);

app.use('/api/parametros', parametroRutas);



app.use(

  (err: Error, _req: Request, res: Response, _next: NextFunction) => {

    console.error(err);

    res.status(500).json({ error: 'Error interno' });

  }

);



async function main() {

  await conectarMongoDB();

  if (!config.smtpPass) {

    console.warn(

      '[startup] Sin GMAIL_APP_PASSWORD: el registro no enviará correo (revisa server/.env y reinicia tras editar).'

    );

  } else {

    console.log('[startup] SMTP Gmail listo para enviar códigos de registro.');

  }

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`API SOA n-capas escuchando en puerto ${config.port} (/api)`);
  });

  if (config.evangelioPrecargaAlInicio) {
    iniciarPrecargaEvangelioEnSegundoPlano();
  }

}

/** Precarga hoy + N días de texto evangelio en MongoDB sin bloquear el arranque. */
function iniciarPrecargaEvangelioEnSegundoPlano() {
  setTimeout(() => {
    EvangelioNegocio.precargarTextosCalendario(
      config.evangelioPrecargaDias,
      config.evangelioPrecargaDelayMs,
    )
      .then((r) => {
        console.log(
          `[evangelio precarga] Textos: ${r.textosPrecargados} nuevos, ${r.textosYaEnCache} en cache, ${r.textosFallidos} fallidos. ` +
            `Reflexiones: ${r.reflexionesGeneradas} nuevas, ${r.reflexionesYaEnCache} en cache, ${r.reflexionesFallidas} fallidas (${r.diasSolicitados} días).`,
        );
        if (r.fechasTextoFallidas.length) {
          console.warn('[evangelio precarga] Fechas sin texto:', r.fechasTextoFallidas.join(', '));
        }
        if (r.fechasReflexionFallidas.length) {
          console.warn('[evangelio precarga] Fechas sin reflexiones:', r.fechasReflexionFallidas.join(', '));
        }
      })
      .catch((e) => console.error('[evangelio precarga] Error:', (e as Error).message));
  }, 3000);
}



main().catch((e) => {

  console.error(e);

  process.exit(1);

});


