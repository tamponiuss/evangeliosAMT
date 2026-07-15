import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, '..');
const workspaceRoot = path.join(serverRoot, '..');
dotenv.config({ path: path.join(workspaceRoot, '.env') });
// Las claves repetidas aquí tienen prioridad (GMAIL_*, JWT, Mongo, etc. suelen vivir aquí).
dotenv.config({ path: path.join(serverRoot, '.env'), override: true });

export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/',
  mongoDatabase: process.env.MONGODB_DB || 'evangelios',
  jwtSecret: process.env.JWT_SECRET || 'evangelioweb-dev-cambiar-en-produccion',
  jwtExpire: process.env.JWT_EXPIRE || '8h',
  /** Correo de salida (remitente) para códigos de registro. */
  mailFrom: process.env.MAIL_FROM || 'tamponievangelio@gmail.com',
  /** Usuario SMTP (Gmail): suele ser el mismo correo. */
  smtpUser: process.env.GMAIL_USER || 'tamponievangelio@gmail.com',
  /** Contraseña de aplicación de Google (16 caracteres; se eliminan espacios al cargar). En Render free SMTP suele fallar. */
  smtpPass: (process.env.GMAIL_APP_PASSWORD ?? '').replace(/\s+/g, ''),
  /** Brevo (Sendinblue) API key — recomendado en Render (HTTPS, no SMTP). */
  brevoApiKey: (process.env.BREVO_API_KEY ?? '').trim(),
  /** Resend API key (alternativa HTTPS). */
  resendApiKey: (process.env.RESEND_API_KEY ?? '').trim(),
  registroCodigoMinutos: Number(process.env.REGISTRO_CODIGO_MINUTOS) || 15,
  /** Opcional: dos reflexiones por IA (OpenAI). Sin clave se usan textos de respaldo. */
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  /** Días hacia adelante (desde hoy) para precargar texto del evangelio en MongoDB. */
  evangelioPrecargaDias: Math.min(62, Math.max(1, Number(process.env.EVANGELIO_PRECACHE_DIAS) || 30)),
  /** Precarga en segundo plano al arrancar el servidor. */
  evangelioPrecargaAlInicio: process.env.EVANGELIO_PRECACHE_AL_INICIO !== '0',
  /** Pausa entre peticiones a dominicos.org (ms). */
  evangelioPrecargaDelayMs: Math.max(200, Number(process.env.EVANGELIO_PRECACHE_DELAY_MS) || 800),
  /** Tras el texto, precargar reflexiones/preguntas genéricas (OpenAI o respaldo). */
  evangelioPrecargaReflexiones: process.env.EVANGELIO_PRECACHE_REFLEXIONES !== '0',
  /** Pausa entre llamadas OpenAI durante la precarga (ms). */
  evangelioPrecargaDelayOpenAIMs: Math.max(500, Number(process.env.EVANGELIO_PRECACHE_DELAY_OPENAI_MS) || 2500),
};
