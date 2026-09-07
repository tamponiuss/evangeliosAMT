import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { config } from '../config.js';
import { PerfilModel, RegistroCodigoModel } from '../capaConexion/Modelos.js';
import { UsuarioNegocio } from './UsuarioNegocio.js';
import { FielNegocio } from './FielNegocio.js';
import type { LoginRequestDTO, LoginResponseDTO } from '../CapaDTO/UsuarioDTO.js';
import { enviarCodigoRegistro, enviarCodigoRecuperacion } from '../CapaServicios/emailRegistro.js';
import {
  esProveedorOauth,
  identidadDesdeCodigo,
  identidadDesdeIdTokenGoogle,
  nombreProveedor,
  oauthPublico,
} from '../CapaServicios/oauthProveedores.js';

const payloadAdmin = (p: { idusuario: string; idperfil: string; nomPerfil: string }) => ({
  sub: p.idusuario,
  idperfil: p.idperfil,
  nomPerfil: p.nomPerfil,
  tipo: 'admin' as const,
});

const payloadFiel = (p: { email: string }) => ({
  sub: p.email,
  tipo: 'fiel' as const,
});

export const AuthNegocio = {
  async login(dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    const u = await UsuarioNegocio.obtenerConClave(dto.idusuario);
    if (!u) {
      const err: Error & { status?: number } = new Error('Usuario o clave inválidos');
      err.status = 401;
      throw err;
    }
    const ok = await UsuarioNegocio.verificarClave(dto.clave, u.clave);
    if (!ok) {
      const err: Error & { status?: number } = new Error('Usuario o clave inválidos');
      err.status = 401;
      throw err;
    }
    const p = await PerfilModel.findOne({ idPerfil: u.idperfil }).lean();
    const nomPerfil = p ? (p as { nomPerfil: string }).nomPerfil : '—';
    const token = jwt.sign(payloadAdmin({ idusuario: u.idusuario, idperfil: u.idperfil, nomPerfil }), config.jwtSecret, {
      expiresIn: config.jwtExpire as jwt.SignOptions['expiresIn'],
    });
    return {
      token,
      usuario: { idusuario: u.idusuario, idperfil: u.idperfil, nomPerfil },
    };
  },
  /**
   * Registro directo deshabilitado: el cliente debe usar solicitarCodigoRegistro + completarRegistroMovil.
   */
  async registroMovil(_email: string, _clave: string) {
    const err: Error & { status?: number } = new Error(
      'El registro requiere verificación por correo. Solicita un código y completa el registro desde la app.'
    );
    err.status = 400;
    throw err;
  },

  generarCodigoRegistro4(): string {
    return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  },

  /** Valida formato simple de email. */
  _emailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  },

  async solicitarCodigoRegistroMovil(email: string) {
    const emailNorm = email.toLowerCase().trim();
    if (!this._emailValido(emailNorm)) {
      const err: Error & { status?: number } = new Error('Email no válido');
      err.status = 400;
      throw err;
    }
    const existe = await FielNegocio.obtenerConClave(emailNorm);
    if (existe) {
      const err: Error & { status?: number } = new Error(
        'Este correo ya está registrado. Inicia sesión o usa otro email.'
      );
      err.status = 409;
      throw err;
    }
    const codigo = this.generarCodigoRegistro4();
    const codigoHash = await bcrypt.hash(codigo, 10);
    const expira = new Date(Date.now() + config.registroCodigoMinutos * 60 * 1000);
    await RegistroCodigoModel.findOneAndUpdate(
      { email: emailNorm },
      { $set: { codigoHash, expira, tipo: 'registro' } },
      { upsert: true, new: true }
    );
    try {
      const correoEnviado = await enviarCodigoRegistro(emailNorm, codigo);
      if (!correoEnviado) {
        await RegistroCodigoModel.deleteOne({ email: emailNorm });
        const err: Error & { status?: number } = new Error(
          'El servidor no tiene configurado el envío de correo. El administrador debe añadir GMAIL_APP_PASSWORD en Render.'
        );
        err.status = 503;
        throw err;
      }
      return { ok: true as const, correoEnviado: true };
    } catch (e) {
      await RegistroCodigoModel.deleteOne({ email: emailNorm });
      throw e;
    }
  },

  async completarRegistroMovil(email: string, clave: string, codigo: string) {
    const emailNorm = email.toLowerCase().trim();
    const codigoTrim = String(codigo).replace(/\s/g, '');
    if (!this._emailValido(emailNorm)) {
      const err: Error & { status?: number } = new Error('Email no válido');
      err.status = 400;
      throw err;
    }
    if (!clave || String(clave).length < 4) {
      const err: Error & { status?: number } = new Error('La clave debe tener al menos 4 caracteres');
      err.status = 400;
      throw err;
    }
    if (!/^\d{4}$/.test(codigoTrim)) {
      const err: Error & { status?: number } = new Error('El código debe tener 4 dígitos');
      err.status = 400;
      throw err;
    }
    const pendiente = await RegistroCodigoModel.findOne({ email: emailNorm }).lean();
    if (!pendiente) {
      const err: Error & { status?: number } = new Error(
        'No hay código pendiente para este correo. Solicita un código nuevo.'
      );
      err.status = 400;
      throw err;
    }
    if ((pendiente.tipo || 'registro') !== 'registro') {
      const err: Error & { status?: number } = new Error(
        'Ese código es para recuperar la clave. Pide un código de registro nuevo.'
      );
      err.status = 400;
      throw err;
    }
    if (pendiente.expira.getTime() < Date.now()) {
      await RegistroCodigoModel.deleteOne({ email: emailNorm });
      const err: Error & { status?: number } = new Error('El código expiró. Solicita uno nuevo.');
      err.status = 400;
      throw err;
    }
    const codigoOk = await bcrypt.compare(codigoTrim, pendiente.codigoHash);
    if (!codigoOk) {
      const err: Error & { status?: number } = new Error('Código incorrecto.');
      err.status = 400;
      throw err;
    }
    const ya = await FielNegocio.obtenerConClave(emailNorm);
    if (ya) {
      await RegistroCodigoModel.deleteOne({ email: emailNorm });
      const err: Error & { status?: number } = new Error('Este correo ya está registrado.');
      err.status = 409;
      throw err;
    }
    const fiel = await FielNegocio.crear({
      email: emailNorm,
      clave,
      idPerfil: 'perfil-fiel',
    });
    await RegistroCodigoModel.deleteOne({ email: emailNorm });
    const token = jwt.sign(payloadFiel({ email: fiel.email }), config.jwtSecret, {
      expiresIn: config.jwtExpireMovil as jwt.SignOptions['expiresIn'],
    });
    return { token, usuario: fiel };
  },

  async solicitarRecuperacionClaveMovil(email: string) {
    const emailNorm = email.toLowerCase().trim();
    if (!this._emailValido(emailNorm)) {
      const err: Error & { status?: number } = new Error('Email no válido');
      err.status = 400;
      throw err;
    }
    const existe = await FielNegocio.obtenerConClave(emailNorm);
    if (!existe) {
      const err: Error & { status?: number } = new Error(
        'No hay cuenta con este correo. Revisa el email o regístrate.'
      );
      err.status = 404;
      throw err;
    }
    const codigo = this.generarCodigoRegistro4();
    const codigoHash = await bcrypt.hash(codigo, 10);
    const expira = new Date(Date.now() + config.registroCodigoMinutos * 60 * 1000);
    await RegistroCodigoModel.findOneAndUpdate(
      { email: emailNorm },
      { $set: { codigoHash, expira, tipo: 'recuperacion' } },
      { upsert: true, new: true }
    );
    try {
      const correoEnviado = await enviarCodigoRecuperacion(emailNorm, codigo);
      if (!correoEnviado) {
        await RegistroCodigoModel.deleteOne({ email: emailNorm });
        const err: Error & { status?: number } = new Error(
          'No se pudo enviar el correo. Inténtalo más tarde.'
        );
        err.status = 503;
        throw err;
      }
      return { ok: true as const, correoEnviado: true };
    } catch (e) {
      await RegistroCodigoModel.deleteOne({ email: emailNorm });
      throw e;
    }
  },

  async completarRecuperacionClaveMovil(email: string, codigo: string, claveNueva: string) {
    const emailNorm = email.toLowerCase().trim();
    const codigoTrim = String(codigo).replace(/\s/g, '');
    if (!this._emailValido(emailNorm)) {
      const err: Error & { status?: number } = new Error('Email no válido');
      err.status = 400;
      throw err;
    }
    if (!claveNueva || String(claveNueva).length < 4) {
      const err: Error & { status?: number } = new Error('La clave nueva debe tener al menos 4 caracteres');
      err.status = 400;
      throw err;
    }
    if (!/^\d{4}$/.test(codigoTrim)) {
      const err: Error & { status?: number } = new Error('El código debe tener 4 dígitos');
      err.status = 400;
      throw err;
    }
    const pendiente = await RegistroCodigoModel.findOne({ email: emailNorm }).lean();
    if (!pendiente || (pendiente.tipo || 'registro') !== 'recuperacion') {
      const err: Error & { status?: number } = new Error(
        'No hay código de recuperación para este correo. Solicita uno nuevo.'
      );
      err.status = 400;
      throw err;
    }
    if (pendiente.expira.getTime() < Date.now()) {
      await RegistroCodigoModel.deleteOne({ email: emailNorm });
      const err: Error & { status?: number } = new Error('El código expiró. Solicita uno nuevo.');
      err.status = 400;
      throw err;
    }
    const codigoOk = await bcrypt.compare(codigoTrim, pendiente.codigoHash);
    if (!codigoOk) {
      const err: Error & { status?: number } = new Error('Código incorrecto.');
      err.status = 400;
      throw err;
    }
    const fiel = await FielNegocio.obtenerConClave(emailNorm);
    if (!fiel) {
      await RegistroCodigoModel.deleteOne({ email: emailNorm });
      const err: Error & { status?: number } = new Error('No hay cuenta con este correo.');
      err.status = 404;
      throw err;
    }
    await FielNegocio.actualizar(emailNorm, { clave: String(claveNueva) });
    await RegistroCodigoModel.deleteOne({ email: emailNorm });
    const actualizado = await FielNegocio.obtenerConClave(emailNorm);
    const token = jwt.sign(payloadFiel({ email: emailNorm }), config.jwtSecret, {
      expiresIn: config.jwtExpireMovil as jwt.SignOptions['expiresIn'],
    });
    return { token, usuario: FielNegocio.toPublicDTO(actualizado ?? fiel) };
  },
  async loginMovil(email: string, clave: string) {
    const fiel = await FielNegocio.obtenerConClave(email);
    if (!fiel) {
      const err: Error & { status?: number } = new Error(
        'No hay cuenta con este correo. Revisa que el email esté bien escrito o regístrate si aún no tienes cuenta.'
      );
      err.status = 401;
      throw err;
    }
    const ok = await FielNegocio.verificarClave(clave, fiel.clave);
    if (!ok) {
      const via = (fiel.oauthProveedor || '').trim();
      const hint = via
        ? ` Esta cuenta entra con ${nombreProveedor(via)}. Pulsa «Continuar con ${nombreProveedor(via)}».`
        : ' Comprueba mayúsculas, números y que no haya espacios de más.';
      const err: Error & { status?: number } = new Error(`La clave no es correcta para este correo.${hint}`);
      err.status = 401;
      throw err;
    }
    const token = jwt.sign(payloadFiel({ email: fiel.email }), config.jwtSecret, {
      expiresIn: config.jwtExpireMovil as jwt.SignOptions['expiresIn'],
    });
    return { token, usuario: FielNegocio.toPublicDTO(fiel) };
  },

  oauthConfigPublico() {
    return oauthPublico();
  },

  async oauthMovil(params: {
    proveedor: string;
    code?: string;
    redirectUri?: string;
    codeVerifier?: string;
    idToken?: string;
  }) {
    if (!esProveedorOauth(params.proveedor)) {
      const err: Error & { status?: number } = new Error('Proveedor no válido.');
      err.status = 400;
      throw err;
    }
    const idToken = String(params.idToken ?? '').trim();
    const id =
      params.proveedor === 'google' && idToken
        ? await identidadDesdeIdTokenGoogle(idToken)
        : await identidadDesdeCodigo({
            proveedor: params.proveedor,
            code: String(params.code ?? ''),
            redirectUri: String(params.redirectUri ?? ''),
            codeVerifier: String(params.codeVerifier ?? ''),
          });
    let fiel = await FielNegocio.obtenerConClave(id.email);
    if (!fiel) {
      const claveAleatoria = randomBytes(24).toString('hex');
      await FielNegocio.crear({
        email: id.email,
        clave: claveAleatoria,
        idPerfil: 'perfil-fiel',
        oauthProveedor: id.proveedor,
        oauthSub: id.sub,
      });
      fiel = await FielNegocio.obtenerConClave(id.email);
    } else if (!fiel.oauthProveedor) {
      await FielNegocio.actualizar(id.email, {
        oauthProveedor: id.proveedor,
        oauthSub: id.sub,
      });
      fiel = await FielNegocio.obtenerConClave(id.email);
    }
    if (!fiel) {
      const err: Error & { status?: number } = new Error('No se pudo crear la cuenta.');
      err.status = 500;
      throw err;
    }
    const token = jwt.sign(payloadFiel({ email: fiel.email }), config.jwtSecret, {
      expiresIn: config.jwtExpireMovil as jwt.SignOptions['expiresIn'],
    });
    return { token, usuario: FielNegocio.toPublicDTO(fiel) };
  },
};

export type TokenPayload = {
  sub: string;
  idperfil?: string;
  nomPerfil?: string;
  tipo: 'admin' | 'fiel';
};

export function verificarToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
