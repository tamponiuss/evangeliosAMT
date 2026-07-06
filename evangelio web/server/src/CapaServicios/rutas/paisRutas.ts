import { Router } from 'express';
import { PaisNegocio } from '../../CapaNegocio/PaisNegocio.js';
import { autenticarJWT } from '../middleware/autenticarJWT.js';

export const paisRutas = Router();
paisRutas.use(autenticarJWT);

paisRutas.get('/', async (_req, res) => {
  res.json(await PaisNegocio.listar());
});

paisRutas.get('/:idPais', async (req, res) => {
  const p = await PaisNegocio.obtener(req.params.idPais);
  if (!p) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(p);
});

paisRutas.post('/', async (req, res) => {
  try {
    const p = await PaisNegocio.crear(req.body);
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

paisRutas.put('/:idPais', async (req, res) => {
  const p = await PaisNegocio.actualizar(req.params.idPais, req.body);
  if (!p) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(p);
});

paisRutas.delete('/:idPais', async (req, res) => {
  const ok = await PaisNegocio.eliminar(req.params.idPais);
  if (!ok) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.status(204).end();
});
