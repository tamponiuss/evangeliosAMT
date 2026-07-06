import { Router } from 'express';
import { UsuarioNegocio } from '../../CapaNegocio/UsuarioNegocio.js';
import { autenticarJWT } from '../middleware/autenticarJWT.js';

export const usuarioRutas = Router();
usuarioRutas.use(autenticarJWT);

usuarioRutas.get('/', async (_req, res) => {
  res.json(await UsuarioNegocio.listar());
});

usuarioRutas.get('/:idusuario', async (req, res) => {
  const u = await UsuarioNegocio.obtener(req.params.idusuario);
  if (!u) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(u);
});

usuarioRutas.post('/', async (req, res) => {
  try {
    const u = await UsuarioNegocio.crear(req.body);
    res.status(201).json(u);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

usuarioRutas.put('/:idusuario', async (req, res) => {
  try {
    const u = await UsuarioNegocio.actualizar(req.params.idusuario, {
      clave: req.body.clave,
      idperfil: req.body.idperfil,
    });
    if (!u) {
      res.status(404).json({ error: 'No encontrado' });
      return;
    }
    res.json(u);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

usuarioRutas.delete('/:idusuario', async (req, res) => {
  const ok = await UsuarioNegocio.eliminar(req.params.idusuario);
  if (!ok) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.status(204).end();
});
