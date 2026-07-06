import { Router } from 'express';
import { FielNegocio } from '../../CapaNegocio/FielNegocio.js';
import { autenticarJWT } from '../middleware/autenticarJWT.js';

export const fielRutas = Router();
fielRutas.use(autenticarJWT);

fielRutas.get('/', async (_req, res) => {
  res.json(await FielNegocio.listar());
});

fielRutas.get('/:email', async (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const f = await FielNegocio.obtener(email);
  if (!f) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(f);
});

fielRutas.post('/', async (req, res) => {
  try {
    const f = await FielNegocio.crear(req.body);
    res.status(201).json(f);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

fielRutas.put('/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const f = await FielNegocio.actualizar(email, {
      clave: req.body.clave,
      idPerfil: req.body.idPerfil,
      nuevoEmail: req.body.nuevoEmail,
    });
    if (!f) {
      res.status(404).json({ error: 'No encontrado' });
      return;
    }
    res.json(f);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

fielRutas.delete('/:email', async (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const ok = await FielNegocio.eliminar(email);
  if (!ok) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.status(204).end();
});
