import { Router } from 'express';
import { EnvioEvangelioNegocio } from '../../CapaNegocio/EnvioEvangelioNegocio.js';
import { autenticarJWT } from '../middleware/autenticarJWT.js';

export const envioRutas = Router();
envioRutas.use(autenticarJWT);

envioRutas.get('/recientes', async (req, res) => {
  try {
    const limite = Number(req.query.limite) || 100;
    const list = await EnvioEvangelioNegocio.listarRecientes(limite);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** Dispara un ciclo de envío ahora (útil para pruebas desde el panel). */
envioRutas.post('/procesar-ahora', async (_req, res) => {
  try {
    const r = await EnvioEvangelioNegocio.procesarTick();
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});
