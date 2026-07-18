import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import { config } from '../config.js';

export type MailPayload = {
  fromName?: string;
  fromEmail?: string;
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

async function enviarConBrevo(payload: MailPayload, fromName: string, fromEmail: string): Promise<void> {
  const apiKey = config.brevoApiKey;
  if (!apiKey) throw new Error('Sin BREVO_API_KEY');

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
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
}

async function enviarConResend(payload: MailPayload, fromName: string, fromEmail: string): Promise<void> {
  const apiKey = config.resendApiKey;
  if (!apiKey) throw new Error('Sin RESEND_API_KEY');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
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
}

async function enviarConGmailSmtp(payload: MailPayload, fromName: string, fromEmail: string): Promise<void> {
  const opciones = smtpOptionsList();
  if (opciones.length === 0) throw new Error('Sin GMAIL_APP_PASSWORD');

  const errores: string[] = [];
  for (const opt of opciones) {
    const transporter = nodemailer.createTransport(opt);
    try {
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errores.push(msg);
      console.warn('[email] SMTP fallido:', msg);
    }
  }
  throw new Error(`Gmail SMTP: ${errores.join(' | ')}`);
}

export function hayProveedorCorreo(): boolean {
  return Boolean(config.brevoApiKey || config.resendApiKey || config.smtpPass);
}

/**
 * Envía un correo. Orden: Brevo → Resend → Gmail SMTP.
 * @returns true si salió; false si no hay proveedor configurado.
 */
export async function enviarCorreo(payload: MailPayload): Promise<boolean> {
  const fromName = (payload.fromName || 'TuMirada').trim();
  const fromEmail = (payload.fromEmail || config.mailFrom || config.smtpUser).trim();

  if (!hayProveedorCorreo()) {
    console.warn(`[email] Sin proveedor. Destino ${payload.to}: ${payload.subject}`);
    return false;
  }

  const errores: string[] = [];

  if (config.brevoApiKey) {
    try {
      await enviarConBrevo(payload, fromName, fromEmail);
      console.log(`[email] Brevo → ${payload.to} (${payload.subject})`);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[email] Brevo falló:', msg);
      errores.push(msg);
    }
  }

  if (config.resendApiKey) {
    try {
      await enviarConResend(payload, fromName, fromEmail);
      console.log(`[email] Resend → ${payload.to} (${payload.subject})`);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[email] Resend falló:', msg);
      errores.push(msg);
    }
  }

  if (config.smtpPass) {
    try {
      await enviarConGmailSmtp(payload, fromName, fromEmail);
      console.log(`[email] Gmail SMTP → ${payload.to} (${payload.subject})`);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[email] Gmail SMTP falló:', msg);
      errores.push(msg);
    }
  }

  const e = new Error(
    `No se pudo enviar el correo (${errores.join(' | ')}). ` +
      'En Render free conviene BREVO_API_KEY porque SMTP de Gmail suele ir bloqueado.'
  ) as Error & { status?: number };
  e.status = 502;
  throw e;
}
