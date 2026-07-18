import { config } from '../config.js';
import { enviarCorreo } from './emailServicio.js';

/**
 * Intenta enviar el código por correo.
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

  return enviarCorreo({
    fromName: 'TuMirada',
    fromEmail: config.mailFrom.trim() || config.smtpUser.trim(),
    to: destinatario,
    subject: asunto,
    text: texto,
    html,
  });
}
