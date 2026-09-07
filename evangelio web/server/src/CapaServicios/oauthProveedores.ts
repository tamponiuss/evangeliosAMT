import { config } from '../config.js';

export type OauthProveedor = 'google' | 'microsoft' | 'yahoo';

export type IdentidadOauth = {
  proveedor: OauthProveedor;
  email: string;
  sub: string;
};

const NOMBRES: Record<OauthProveedor, string> = {
  google: 'Gmail',
  microsoft: 'Outlook',
  yahoo: 'Yahoo',
};

export function nombreProveedor(p: string): string {
  return NOMBRES[p as OauthProveedor] || p;
}

export function oauthPublico() {
  const google = Boolean(config.googleOAuthClientId && config.googleOAuthClientSecret);
  const microsoft = Boolean(config.microsoftOAuthClientId && config.microsoftOAuthClientSecret);
  const yahoo = Boolean(config.yahooOAuthClientId && config.yahooOAuthClientSecret);
  return {
    google,
    microsoft,
    yahoo,
    googleClientId: google ? config.googleOAuthClientId : '',
    microsoftClientId: microsoft ? config.microsoftOAuthClientId : '',
    yahooClientId: yahoo ? config.yahooOAuthClientId : '',
  };
}

function err(mensaje: string, status = 400): Error & { status?: number } {
  const e: Error & { status?: number } = new Error(mensaje);
  e.status = status;
  return e;
}

export function esProveedorOauth(v: string): v is OauthProveedor {
  return v === 'google' || v === 'microsoft' || v === 'yahoo';
}

/** Evita redirigir el código OAuth a un origen no controlado. */
export function redirectUriPermitida(uri: string): boolean {
  const limpio = uri.trim().replace(/\/$/, '');
  if (limpio === 'com.tamponi.evangelio://oauth') return true;
  let u: URL;
  try {
    u = new URL(uri);
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  if (u.pathname !== '/oauth_redirect.html') return false;
  if (u.username || u.password || u.hash) return false;
  return true;
}

async function leerJson(res: Response): Promise<Record<string, unknown>> {
  const txt = await res.text();
  try {
    const j = JSON.parse(txt) as unknown;
    return j && typeof j === 'object' ? (j as Record<string, unknown>) : {};
  } catch {
    return { raw: txt };
  }
}

function str(v: unknown): string {
  return String(v ?? '').trim();
}

async function intercambiarCodigoGoogle(code: string, redirectUri: string, codeVerifier: string) {
  const body = new URLSearchParams({
    code,
    client_id: config.googleOAuthClientId,
    client_secret: config.googleOAuthClientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await leerJson(res);
  if (!res.ok) {
    throw err(`Gmail no autorizó el acceso (${str(data.error) || res.status}).`);
  }
  const idToken = str(data.id_token);
  if (idToken) {
    const id = await identidadDesdeIdTokenGoogle(idToken);
    return { email: id.email, sub: id.sub };
  }
  const access = str(data.access_token);
  if (!access) throw err('Gmail no devolvió un token.');
  const uiRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { authorization: `Bearer ${access}` },
  });
  const ui = await leerJson(uiRes);
  if (!uiRes.ok) throw err('No se pudo leer el perfil de Gmail.');
  const email = str(ui.email).toLowerCase();
  const verified = ui.email_verified === true || str(ui.email_verified) === 'true';
  if (!email || !verified) throw err('Gmail no entregó un correo verificado.');
  return { email, sub: str(ui.sub) || email };
}

export async function identidadDesdeIdTokenGoogle(idToken: string): Promise<IdentidadOauth> {
  if (!config.googleOAuthClientId) {
    throw err('El registro con Gmail aún no está configurado en el servidor.', 503);
  }
  const token = idToken.trim();
  if (!token) throw err('Faltó el token de Gmail.');
  const tiRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
  const ti = await leerJson(tiRes);
  if (!tiRes.ok) throw err('No se pudo verificar la cuenta de Gmail.');
  if (str(ti.aud) !== config.googleOAuthClientId) throw err('La cuenta de Gmail no corresponde a TuMirada.');
  const email = str(ti.email).toLowerCase();
  const verified = ti.email_verified === true || str(ti.email_verified) === 'true';
  if (!email || !verified) throw err('Gmail no entregó un correo verificado.');
  return { proveedor: 'google', email, sub: str(ti.sub) || email };
}

async function intercambiarCodigoMicrosoft(code: string, redirectUri: string, codeVerifier: string) {
  const body = new URLSearchParams({
    code,
    client_id: config.microsoftOAuthClientId,
    client_secret: config.microsoftOAuthClientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
    scope: 'openid email profile User.Read',
  });
  const res = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await leerJson(res);
  if (!res.ok) {
    throw err(`Outlook no autorizó el acceso (${str(data.error) || res.status}).`);
  }
  const access = str(data.access_token);
  if (!access) throw err('Outlook no devolvió un token.');
  const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { authorization: `Bearer ${access}` },
  });
  const me = await leerJson(meRes);
  if (!meRes.ok) throw err('No se pudo leer el perfil de Outlook.');
  const email = str(me.mail || me.userPrincipalName).toLowerCase();
  if (!email || !email.includes('@')) throw err('Outlook no entregó un correo.');
  return { email, sub: str(me.id) || email };
}

async function intercambiarCodigoYahoo(code: string, redirectUri: string, codeVerifier: string) {
  const basic = Buffer.from(`${config.yahooOAuthClientId}:${config.yahooOAuthClientSecret}`).toString('base64');
  const body = new URLSearchParams({
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });
  const res = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${basic}`,
    },
    body,
  });
  const data = await leerJson(res);
  if (!res.ok) {
    throw err(`Yahoo no autorizó el acceso (${str(data.error) || res.status}).`);
  }
  const access = str(data.access_token);
  if (!access) throw err('Yahoo no devolvió un token.');
  const uiRes = await fetch('https://api.login.yahoo.com/openid/v1/userinfo', {
    headers: { authorization: `Bearer ${access}` },
  });
  const ui = await leerJson(uiRes);
  if (!uiRes.ok) throw err('No se pudo leer el perfil de Yahoo.');
  let email = str(ui.email).toLowerCase();
  if (!email && Array.isArray(ui.emails) && ui.emails[0]) {
    const first = ui.emails[0] as Record<string, unknown>;
    email = str(first.handle || first.email).toLowerCase();
  }
  if (!email || !email.includes('@')) throw err('Yahoo no entregó un correo.');
  return { email, sub: str(ui.sub) || email };
}

export async function identidadDesdeCodigo(params: {
  proveedor: OauthProveedor;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<IdentidadOauth> {
  const { proveedor, code, redirectUri, codeVerifier } = params;
  const pub = oauthPublico();
  if (!pub[proveedor]) {
    throw err(`El registro con ${NOMBRES[proveedor]} aún no está configurado en el servidor.`, 503);
  }
  if (!code.trim() || !codeVerifier.trim()) {
    throw err('Faltó el código de autorización.');
  }
  if (!redirectUriPermitida(redirectUri)) {
    throw err('Origen de retorno no permitido.');
  }

  let id: { email: string; sub: string };
  if (proveedor === 'google') id = await intercambiarCodigoGoogle(code, redirectUri, codeVerifier);
  else if (proveedor === 'microsoft') id = await intercambiarCodigoMicrosoft(code, redirectUri, codeVerifier);
  else id = await intercambiarCodigoYahoo(code, redirectUri, codeVerifier);

  return { proveedor, email: id.email, sub: id.sub };
}
