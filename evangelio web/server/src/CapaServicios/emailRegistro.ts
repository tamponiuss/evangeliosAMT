import nodemailer from 'nodemailer';
import { config } from '../config.js';

function crearTransport() {
  const user = config.smtpUser.trim();
  const pass = config.smtpPass.trim();
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 25_000,
  });
}

/**
 * Intenta enviar el código por Gmail.
 * @returns `true` si el correo salió del servidor; `false` si no hay contraseña SMTP (solo desarrollo).
 * @throws Error si está configurado SMTP pero el envío falla (credenciales, red, etc.).
 */
export async function enviarCodigoRegistro(destinatario: string, codigo: string): Promise<boolean> {
  const asunto = 'Tu código de verificación — Evangelio';
  const texto = [
    'Hola,',
    '',
    `Tu código de verificación es: ${codigo}`,
    '',
    'Ingresa este código de 4 dígitos en la aplicación para completar tu registro.',
    '',
    'Si no solicitaste este registro, puedes ignorar este mensaje.',
  ].join('\n');

  const html = `
    <p>Hola,</p>
    <p>Tu código de verificación es:</p>
    <p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${codigo}</p>
    <p>Ingresa este código de 4 dígitos en la aplicación para completar tu registro.</p>
    <p style="color:#666;font-size:12px;">Si no solicitaste este registro, ignora este correo.</p>
  `;

  if (!config.smtpPass) {
    console.warn(
      `[email registro] GMAIL_APP_PASSWORD vacía en evangelio web/server/.env (o evangelio web/.env). No se envía correo. Código para ${destinatario}: ${codigo}`
    );
    return false;
  }

  const transporter = crearTransport();
  try {
    await transporter.sendMail({
      from: `"Evangelio" <${config.mailFrom.trim()}>`,
      to: destinatario,
      subject: asunto,
      text: texto,
      html,
    });
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[email registro] Fallo al enviar con Gmail:', msg);
    const e = new Error(
      `No se pudo enviar el correo: ${msg}. ` +
        'Usa una contraseña de aplicación de Google (cuenta con verificación en 2 pasos): ' +
        'Google → Seguridad → Contraseñas de aplicaciones. Copia GMAIL_APP_PASSWORD en .env sin espacios.'
    ) as Error & { status?: number };
    e.status = 502;
    throw e;
  }
}
