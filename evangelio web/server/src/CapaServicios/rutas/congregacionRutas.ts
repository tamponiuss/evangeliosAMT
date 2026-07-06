import { Router } from 'express';
import { CongregacionNegocio } from '../../CapaNegocio/CongregacionNegocio.js';
import { autenticarJWT } from '../middleware/autenticarJWT.js';

export const congregacionRutas = Router();
congregacionRutas.use(autenticarJWT);

congregacionRutas.get('/', async (_req, res) => {
  res.json(await CongregacionNegocio.listar());
});

congregacionRutas.get('/:idCongregacion', async (req, res) => {
  const c = await CongregacionNegocio.obtener(req.params.idCongregacion);
  if (!c) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(c);
});

congregacionRutas.post('/', async (req, res) => {
  try {
    const c = await CongregacionNegocio.crear(req.body);
    res.status(201).json(c);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

congregacionRutas.put('/:idCongregacion', async (req, res) => {
  const c = await CongregacionNegocio.actualizar(req.params.idCongregacion, req.body);
  if (!c) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(c);
});

congregacionRutas.delete('/:idCongregacion', async (req, res) => {
  const ok = await CongregacionNegocio.eliminar(req.params.idCongregacion);
  if (!ok) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.status(204).end();
});
