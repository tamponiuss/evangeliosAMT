import cors from 'cors';
import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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
import { envioRutas } from './CapaServicios/rutas/envioRutas.js';
import { EvangelioNegocio } from './CapaNegocio/EvangelioNegocio.js';
import { iniciarProgramadorEnvioEvangelio } from './CapaNegocio/EnvioEvangelioNegocio.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    servicio: 'evangelioweb-api',
    envioEmailActivo: config.envioEmailActivo,
    zonaEnvio: config.envioZonaHoraria,
  });
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
app.use('/api/envios', envioRutas);

/** Panel admin compilado (Vite) servido desde server/public en producción. */
function montarPanelAdminEstatico(): void {
  const publicDir = path.join(__dirname, '../public');
  if (!existsSync(publicDir)) {
    console.log('[startup] Sin panel estático en server/public (solo API).');
    return;
  }
  app.use(express.static(publicDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(path.join(publicDir, 'index.html'), (err) => {
      if (err) next();
    });
  });
  console.log('[startup] Panel admin estático montado desde server/public');
}

montarPanelAdminEstatico();

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

/** Precarga hoy + N días de texto evangelio en MongoDB sin bloquear el arranque. */
function iniciarPrecargaEvangelioEnSegundoPlano() {
  setTimeout(() => {
    EvangelioNegocio.precargarTextosCalendario(
      config.evangelioPrecargaDias,
      config.evangelioPrecargaDelayMs
    )
      .then((r) => {
        console.log(
          `[evangelio precarga] Textos: ${r.textosPrecargados} nuevos, ${r.textosYaEnCache} en cache, ${r.textosFallidos} fallidos. ` +
            `Reflexiones: ${r.reflexionesGeneradas} nuevas, ${r.reflexionesYaEnCache} en cache, ${r.reflexionesFallidas} fallidas (${r.diasSolicitados} días).`
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

async function main() {
  await conectarMongoDB();

  if (config.brevoApiKey) {
    console.log('[startup] Correo: Brevo API listo.');
  } else if (config.resendApiKey) {
    console.log('[startup] Correo: Resend API listo.');
  } else if (config.smtpPass) {
    console.log('[startup] Correo: Gmail SMTP configurado (en Render free puede fallar; preferible BREVO_API_KEY).');
  } else {
    console.warn(
      '[startup] Sin BREVO_API_KEY / RESEND_API_KEY / GMAIL_APP_PASSWORD: no se enviarán correos.'
    );
  }

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`API SOA n-capas escuchando en puerto ${config.port} (/api)`);
  });

  iniciarProgramadorEnvioEvangelio();

  if (config.evangelioPrecargaAlInicio) {
    iniciarPrecargaEvangelioEnSegundoPlano();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
