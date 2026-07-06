import { Router } from 'express';
import { PapaNegocio } from '../../CapaNegocio/PapaNegocio.js';
import { autenticarJWT } from '../middleware/autenticarJWT.js';

export const papaRutas = Router();
papaRutas.use(autenticarJWT);

papaRutas.get('/', async (_req, res) => {
  res.json(await PapaNegocio.listar());
});

papaRutas.get('/:idPapa', async (req, res) => {
  const p = await PapaNegocio.obtener(req.params.idPapa);
  if (!p) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(p);
});

papaRutas.post('/', async (req, res) => {
  try {
    const p = await PapaNegocio.crear(req.body);
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

papaRutas.put('/:idPapa', async (req, res) => {
  const p = await PapaNegocio.actualizar(req.params.idPapa, req.body);
  if (!p) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(p);
});

papaRutas.delete('/:idPapa', async (req, res) => {
  const ok = await PapaNegocio.eliminar(req.params.idPapa);
  if (!ok) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.status(204).end();
});
