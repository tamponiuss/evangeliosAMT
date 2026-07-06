import { Router } from 'express';
import { PerfilNegocio } from '../../CapaNegocio/PerfilNegocio.js';
import { autenticarJWT } from '../middleware/autenticarJWT.js';

export const perfilRutas = Router();
perfilRutas.use(autenticarJWT);

perfilRutas.get('/', async (_req, res) => {
  res.json(await PerfilNegocio.listar());
});

perfilRutas.get('/:idPerfil', async (req, res) => {
  const p = await PerfilNegocio.obtener(req.params.idPerfil);
  if (!p) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(p);
});

perfilRutas.post('/', async (req, res) => {
  try {
    const p = await PerfilNegocio.crear(req.body);
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

perfilRutas.put('/:idPerfil', async (req, res) => {
  const p = await PerfilNegocio.actualizar(req.params.idPerfil, req.body);
  if (!p) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(p);
});

perfilRutas.delete('/:idPerfil', async (req, res) => {
  const ok = await PerfilNegocio.eliminar(req.params.idPerfil);
  if (!ok) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.status(204).end();
});
