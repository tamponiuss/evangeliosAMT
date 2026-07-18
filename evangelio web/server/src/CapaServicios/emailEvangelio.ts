import { config } from '../config.js';
import { enviarCorreo } from './emailServicio.js';

function escaparHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function textoAHtmlParrafos(texto: string): string {
  return escaparHtml(texto)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;line-height:1.55;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

export async function enviarEvangelioPorEmail(params: {
  destinatario: string;
  fecha: string;
  titulo: string;
  contenido: string;
  reflexion?: string;
}): Promise<boolean> {
  const { destinatario, fecha, titulo, contenido, reflexion } = params;
  const asunto = `Evangelio del día (${fecha}) — TuMirada`;
  const reflexionBloque = reflexion?.trim()
    ? `\n\nReflexión\n${reflexion.trim()}\n`
    : '';

  const texto = [
    'Hola,',
    '',
    `Evangelio del día — ${fecha}`,
    titulo,
    '',
    contenido,
    reflexionBloque.trim(),
    '',
    'Que tengas un día bendecido.',
    '— TuMirada',
  ]
    .filter((l) => l !== undefined)
    .join('\n');

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#1f3650;max-width:640px;margin:0 auto;">
      <p>Hola,</p>
      <h1 style="font-size:20px;margin:0 0 8px;">Evangelio del día — ${escaparHtml(fecha)}</h1>
      <h2 style="font-size:17px;margin:0 0 16px;color:#338dcf;">${escaparHtml(titulo)}</h2>
      ${textoAHtmlParrafos(contenido)}
      ${
        reflexion?.trim()
          ? `<div style="margin-top:20px;padding:14px 16px;background:#f2f8ff;border-radius:10px;border:1px solid #d8e7f7;">
              <p style="margin:0 0 8px;font-weight:600;color:#214b6d;">Reflexión</p>
              ${textoAHtmlParrafos(reflexion.trim())}
            </div>`
          : ''
      }
      <p style="margin-top:24px;color:#6e8aa6;font-size:13px;">Que tengas un día bendecido.<br/>— TuMirada</p>
    </div>
  `;

  return enviarCorreo({
    fromName: 'TuMirada',
    fromEmail: config.mailFrom.trim() || config.smtpUser.trim(),
    to: destinatario,
    subject: asunto,
    text: texto,
    html,
  });
}
