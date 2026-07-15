import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import { config } from '../config.js';

type MailPayload = {
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

function smtpOptionsList(): SMTPTransport.Options[] {
  const user = config.smtpUser.trim();
  const pass = config.smtpPass.trim();
  if (!pass) return [];
  const auth = { user, pass };
  return [
    {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
    },
    {
      service: 'gmail',
      auth,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
    },
  ];
}

/** Brevo (ex Sendinblue): API HTTPS — funciona en Render free (SMTP suele estar bloqueado). */
async function enviarConBrevo(payload: MailPayload): Promise<boolean> {
  const apiKey = config.brevoApiKey;
  if (!apiKey) return false;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name: payload.fromName, email: payload.fromEmail },
      to: [{ email: payload.to }],
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Brevo HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  return true;
}

/** Resend: API HTTPS. Sin dominio verificado solo envía al correo de la cuenta Resend. */
async function enviarConResend(payload: MailPayload): Promise<boolean> {
  const apiKey = config.resendApiKey;
  if (!apiKey) return false;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${payload.fromName} <${payload.fromEmail}>`,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  return true;
}

async function enviarConGmailSmtp(payload: MailPayload): Promise<boolean> {
  const opciones = smtpOptionsList();
  if (opciones.length === 0) return false;

  const errores: string[] = [];
  for (const opt of opciones) {
    const transporter = nodemailer.createTransport(opt);
    try {
      await transporter.sendMail({
        from: `"${payload.fromName}" <${payload.fromEmail}>`,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errores.push(msg);
      console.warn('[email registro] SMTP fallido:', msg);
    }
  }
  throw new Error(`Gmail SMTP: ${errores.join(' | ')}`);
}

/**
 * Intenta enviar el código por correo.
 * Orden: Brevo API → Resend API → Gmail SMTP (local; en Render free SMTP suele estar bloqueado).
 * @returns `true` si el correo salió; `false` si no hay ningún proveedor configurado.
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

  const payload: MailPayload = {
    fromName: 'TuMirada',
    fromEmail: config.mailFrom.trim() || config.smtpUser.trim(),
    to: destinatario,
    subject: asunto,
    text: texto,
    html,
  };

  const hayProveedor = Boolean(config.brevoApiKey || config.resendApiKey || config.smtpPass);
  if (!hayProveedor) {
    console.warn(
      `[email registro] Sin BREVO_API_KEY / RESEND_API_KEY / GMAIL_APP_PASSWORD. Código para ${destinatario}: ${codigo}`
    );
    return false;
  }

  const errores: string[] = [];

  if (config.brevoApiKey) {
    try {
      await enviarConBrevo(payload);
      console.log(`[email registro] Enviado con Brevo a ${destinatario}`);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[email registro] Brevo falló:', msg);
      errores.push(msg);
    }
  }

  if (config.resendApiKey) {
    try {
      await enviarConResend(payload);
      console.log(`[email registro] Enviado con Resend a ${destinatario}`);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[email registro] Resend falló:', msg);
      errores.push(msg);
    }
  }

  if (config.smtpPass) {
    try {
      await enviarConGmailSmtp(payload);
      console.log(`[email registro] Enviado con Gmail SMTP a ${destinatario}`);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[email registro] Gmail SMTP falló:', msg);
      errores.push(msg);
    }
  }

  const e = new Error(
    `No se pudo enviar el correo (${errores.join(' | ')}). ` +
      'En Render free conviene BREVO_API_KEY (https://app.brevo.com) porque SMTP de Gmail suele ir bloqueado.'
  ) as Error & { status?: number };
  e.status = 502;
  throw e;
}
