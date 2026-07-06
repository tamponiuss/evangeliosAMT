import type { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../../CapaNegocio/AuthNegocio.js';

export type UsuarioRequest = Request & {
  user?: { idusuario: string; idperfil: string; nomPerfil: string };
};
export type FielRequest = Request & {
  fiel?: { email: string };
};

export function autenticarJWT(req: UsuarioRequest, res: Response, next: NextFunction): void {
  const h = req.headers.authorization;
  const m = h?.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }
  try {
    const p = verificarToken(m[1]);
    if (p.tipo !== 'admin') {
      res.status(403).json({ error: 'Token de administrador requerido' });
      return;
    }
    req.user = {
      idusuario: p.sub,
      idperfil: p.idperfil || '',
      nomPerfil: p.nomPerfil || '',
    };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function autenticarJWTFiel(req: FielRequest, res: Response, next: NextFunction): void {
  const h = req.headers.authorization;
  const m = h?.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }
  try {
    const p = verificarToken(m[1]);
    if (p.tipo !== 'fiel') {
      res.status(403).json({ error: 'Token de fiel requerido' });
      return;
    }
    req.fiel = { email: p.sub };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
