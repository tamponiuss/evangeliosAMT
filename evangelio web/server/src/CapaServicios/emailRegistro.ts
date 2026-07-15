import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import { config } from '../config.js';

type MailPayload = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

function opcionesSmtp(): SMTPTransport.Options[] {
  const user = config.smtpUser.trim();
  const pass = config.smtpPass.trim();
  const auth = { user, pass };

  return [
    // Render y otros PaaS suelen funcionar mejor con STARTTLS (587) que con 465.
    {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth,
      connectionTimeout: 25_000,
      greetingTimeout: 25_000,
      socketTimeout: 30_000,
    },
    {
      service: 'gmail',
      auth,
      connectionTimeout: 25_000,
      greetingTimeout: 25_000,
      socketTimeout: 30_000,
    },
    {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth,
      connectionTimeout: 25_000,
      greetingTimeout: 25_000,
      socketTimeout: 30_000,
    },
  ];
}

async function enviarConGmail(payload: MailPayload): Promise<void> {
  const errores: string[] = [];

  for (const opciones of opcionesSmtp()) {
    const transporter = nodemailer.createTransport(opciones);
    try {
      await transporter.sendMail(payload);
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const puerto = 'port' in opciones ? String(opciones.port ?? 'service') : 'gmail';
      errores.push(`${puerto}: ${msg}`);
      console.warn(`[email registro] Intento SMTP fallido (${puerto}):`, msg);
    }
  }

  const e = new Error(
    `No se pudo enviar el correo (${errores.join(' | ')}). ` +
      'Revisa GMAIL_APP_PASSWORD en Render (contraseña de aplicación de Google, no la clave normal de Gmail).'
  ) as Error & { status?: number };
  e.status = 502;
  throw e;
}

/**
 * Intenta enviar el código por Gmail.
 * @returns `true` si el correo salió del servidor; `false` si no hay contraseña SMTP (solo desarrollo local).
 * @throws Error si está configurado SMTP pero el envío falla (credenciales, red, etc.).
 */
export async function enviarCodigoRegistro(destinatario: string, codigo: string): Promise<boolean> {
  const asunto = 'Tu código de verificación — TuMirada';
  const texto = [
    'Hola,',
    '',
    `Tu código de verificación es: ${codigo}`,
    '',
    'Ingresa este código de 4 dígitos en la aplicación TuMirada para completar tu registro.',
    '',
    'Si no solicitaste este registro, puedes ignorar este mensaje.',
  ].join('\n');

  const html = `
    <p>Hola,</p>
    <p>Tu código de verificación para <strong>TuMirada</strong> es:</p>
    <p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${codigo}</p>
    <p>Ingresa este código de 4 dígitos en la aplicación para completar tu registro.</p>
    <p style="color:#666;font-size:12px;">Si no solicitaste este registro, ignora este correo.</p>
  `;

  if (!config.smtpPass) {
    console.warn(
      `[email registro] GMAIL_APP_PASSWORD vacía. No se envía correo. Código para ${destinatario}: ${codigo}`
    );
    return false;
  }

  const payload: MailPayload = {
    from: `"TuMirada" <${config.mailFrom.trim()}>`,
    to: destinatario,
    subject: asunto,
    text: texto,
    html,
  };

  try {
    await enviarConGmail(payload);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[email registro] Fallo al enviar con Gmail:', msg);
    if (err instanceof Error && 'status' in err) throw err;
    const e = new Error(msg) as Error & { status?: number };
    e.status = 502;
    throw e;
  }
}
