import { Router } from 'express';
import { ParametroNegocio } from '../../CapaNegocio/ParametroNegocio.js';
import { autenticarJWT } from '../middleware/autenticarJWT.js';

export const parametroRutas = Router();
parametroRutas.use(autenticarJWT);

parametroRutas.get('/', async (_req, res) => {
  res.json(await ParametroNegocio.listar());
});

parametroRutas.get('/:idParametro', async (req, res) => {
  const p = await ParametroNegocio.obtener(req.params.idParametro);
  if (!p) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(p);
});

parametroRutas.post('/', async (req, res) => {
  try {
    const p = await ParametroNegocio.crear(req.body);
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

parametroRutas.put('/:idParametro', async (req, res) => {
  const p = await ParametroNegocio.actualizar(req.params.idParametro, req.body);
  if (!p) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(p);
});

parametroRutas.delete('/:idParametro', async (req, res) => {
  const ok = await ParametroNegocio.eliminar(req.params.idParametro);
  if (!ok) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.status(204).end();
});
