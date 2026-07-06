import { Router } from 'express';
import { autenticarJWTFiel, type FielRequest } from '../middleware/autenticarJWT.js';
import { EvangelioNegocio, firmaContexto } from '../../CapaNegocio/EvangelioNegocio.js';
import { FiltrosEspiritualesNegocio } from '../../CapaNegocio/FiltrosEspiritualesNegocio.js';

export const evangelioRutas = Router();
evangelioRutas.use(autenticarJWTFiel);

evangelioRutas.get('/', async (req, res) => {
  try {
    const fecha = (req.query.fecha as string | undefined) || undefined;
    const fielReq = req as FielRequest;
    const email = fielReq.fiel?.email;
    const contexto = email ? await FiltrosEspiritualesNegocio.contextoParaFiel(email) : null;
    const identidad =
      email && contexto ? { email, firmaConfig: firmaContexto(contexto) } : null;
    const data = await EvangelioNegocio.obtenerPorFecha(fecha, contexto, identidad);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

