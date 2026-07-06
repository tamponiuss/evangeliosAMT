import { Router } from 'express';
import { MiradaEspiritualNegocio } from '../../CapaNegocio/MiradaEspiritualNegocio.js';
import { autenticarJWT } from '../middleware/autenticarJWT.js';

export const miradaEspiritualRutas = Router();
miradaEspiritualRutas.use(autenticarJWT);

miradaEspiritualRutas.get('/', async (_req, res) => {
  res.json(await MiradaEspiritualNegocio.listar());
});

miradaEspiritualRutas.get('/:idMirada', async (req, res) => {
  const m = await MiradaEspiritualNegocio.obtener(req.params.idMirada);
  if (!m) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(m);
});

miradaEspiritualRutas.post('/', async (req, res) => {
  try {
    const m = await MiradaEspiritualNegocio.crear(req.body);
    res.status(201).json(m);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

miradaEspiritualRutas.put('/:idMirada', async (req, res) => {
  const m = await MiradaEspiritualNegocio.actualizar(req.params.idMirada, req.body);
  if (!m) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(m);
});

miradaEspiritualRutas.delete('/:idMirada', async (req, res) => {
  const ok = await MiradaEspiritualNegocio.eliminar(req.params.idMirada);
  if (!ok) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.status(204).end();
});
