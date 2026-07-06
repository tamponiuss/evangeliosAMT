import { Router } from 'express';
import { DashboardNegocio } from '../../CapaNegocio/DashboardNegocio.js';
import { autenticarJWT } from '../middleware/autenticarJWT.js';

export const dashboardRutas = Router();
dashboardRutas.use(autenticarJWT);

dashboardRutas.get('/resumen', async (_req, res) => {
  const r = await DashboardNegocio.resumen();
  res.json(r);
});
