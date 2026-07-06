import { Router } from 'express';
import { AuthNegocio } from '../../CapaNegocio/AuthNegocio.js';
import { FiltrosEspiritualesNegocio } from '../../CapaNegocio/FiltrosEspiritualesNegocio.js';
import { ParametroNegocio } from '../../CapaNegocio/ParametroNegocio.js';
import { PlusNegocio } from '../../CapaNegocio/PlusNegocio.js';
import { autenticarJWTFiel, type FielRequest } from '../middleware/autenticarJWT.js';
import { FielNegocio } from '../../CapaNegocio/FielNegocio.js';

export const authRutas = Router();

authRutas.post('/login', async (req, res) => {
  try {
    const { idusuario, clave } = req.body;
    if (!idusuario || !clave) {
      res.status(400).json({ error: 'idusuario y clave son requeridos' });
      return;
    }
    const r = await AuthNegocio.login({ idusuario: String(idusuario), clave: String(clave) });
    res.json(r);
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status || 500).json({ error: err.message || 'Error al iniciar sesión' });
  }
});

authRutas.post('/movil/registro', async (req, res) => {
  try {
    const { email, clave } = req.body;
    if (!email || !clave) {
      res.status(400).json({ error: 'email y clave son requeridos' });
      return;
    }
    const r = await AuthNegocio.registroMovil(String(email), String(clave));
    res.status(201).json(r);
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status || 500).json({ error: err.message || 'Error al registrar' });
  }
});

/** Paso 1: comprueba que el email no exista y envía código de 4 dígitos por correo. */
authRutas.post('/movil/registro/solicitar-codigo', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'email es requerido' });
      return;
    }
    const r = await AuthNegocio.solicitarCodigoRegistroMovil(String(email));
    res.json(r);
  } catch (e) {
    const err = e as Error & { status?: number };
    const status = err.status ?? 500;
    res.status(status).json({ error: err.message || 'Error al enviar código' });
  }
});

/** Paso 2: valida código y crea la cuenta. */
authRutas.post('/movil/registro/completar', async (req, res) => {
  try {
    const { email, clave, codigo } = req.body;
    if (!email || !clave || codigo === undefined || codigo === null) {
      res.status(400).json({ error: 'email, clave y codigo son requeridos' });
      return;
    }
    const r = await AuthNegocio.completarRegistroMovil(String(email), String(clave), String(codigo));
    res.status(201).json(r);
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status || 500).json({ error: err.message || 'Error al registrar' });
  }
});

authRutas.post('/movil/login', async (req, res) => {
  try {
    const { email, clave } = req.body;
    if (!email || !clave) {
      res.status(400).json({ error: 'email y clave son requeridos' });
      return;
    }
    const r = await AuthNegocio.loginMovil(String(email), String(clave));
    res.json(r);
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status || 500).json({ error: err.message || 'Error al iniciar sesión móvil' });
  }
});

authRutas.get('/movil/perfil', autenticarJWTFiel, async (req, res) => {
  const fielReq = req as FielRequest;
  const email = fielReq.fiel?.email;
  if (!email) {
    res.status(401).json({ error: 'Token inválido' });
    return;
  }
  const f = await FielNegocio.obtener(email);
  if (!f) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(f);
});

authRutas.put('/movil/cambiar-clave', autenticarJWTFiel, async (req, res) => {
  try {
    const fielReq = req as FielRequest;
    const email = fielReq.fiel?.email;
    if (!email) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }
    const { claveActual, claveNueva } = req.body;
    if (!claveActual || !claveNueva) {
      res.status(400).json({ error: 'claveActual y claveNueva son requeridas' });
      return;
    }
    const fiel = await FielNegocio.obtenerConClave(email);
    if (!fiel) {
      res.status(404).json({ error: 'No encontrado' });
      return;
    }
    const ok = await FielNegocio.verificarClave(String(claveActual), fiel.clave);
    if (!ok) {
      res.status(401).json({ error: 'Clave actual inválida' });
      return;
    }
    await FielNegocio.actualizar(email, { clave: String(claveNueva) });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

/** Obtiene un parámetro de app por id (tabla parametro). */
authRutas.get('/movil/parametros/:idParametro', autenticarJWTFiel, async (req, res) => {
  try {
    const p = await ParametroNegocio.obtener(req.params.idParametro);
    if (!p || !p.activo) {
      res.status(404).json({ error: 'Parámetro no disponible' });
      return;
    }
    res.json(p);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** Procesa pago y activa suscripción Plus. */
authRutas.post('/movil/plus/pagar', autenticarJWTFiel, async (req, res) => {
  try {
    const fielReq = req as FielRequest;
    const email = fielReq.fiel?.email;
    if (!email) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }
    const { referenciaExterna } = req.body ?? {};
    const r = await PlusNegocio.procesarPagoPlus(email, referenciaExterna);
    res.status(201).json({ ok: true, referencia: r.referencia, usuario: r.usuario });
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status || 400).json({ error: err.message });
  }
});

/** Catálogos para filtros espirituales (papas, congregaciones, miradas). */
authRutas.get('/movil/catalogos-espirituales', autenticarJWTFiel, async (_req, res) => {
  try {
    res.json(await FiltrosEspiritualesNegocio.catalogos());
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** Obtiene filtros espirituales del usuario plus. */
authRutas.get('/movil/filtros-espirituales', autenticarJWTFiel, async (req, res) => {
  try {
    const fielReq = req as FielRequest;
    const email = fielReq.fiel?.email;
    if (!email) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }
    res.json(await FiltrosEspiritualesNegocio.obtener(email));
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status || 500).json({ error: err.message });
  }
});

/** Guarda filtros espirituales (solo perfil plus). */
authRutas.put('/movil/filtros-espirituales', autenticarJWTFiel, async (req, res) => {
  try {
    const fielReq = req as FielRequest;
    const email = fielReq.fiel?.email;
    if (!email) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }
    const { idPapa, congregaciones, idMirada } = req.body;
    const f = await FiltrosEspiritualesNegocio.guardar(email, { idPapa, congregaciones, idMirada });
    res.json(f);
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status || 400).json({ error: err.message });
  }
});
