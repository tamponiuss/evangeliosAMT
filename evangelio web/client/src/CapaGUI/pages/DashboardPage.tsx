import { useEffect, useState } from 'react';
import { obtenerResumen, type Resumen } from '../../CapaServicios/dashboardService';

export function DashboardPage() {
  const [r, setR] = useState<Resumen | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    obtenerResumen()
      .then(setR)
      .catch((e) => setErr((e as Error).message));
  }, []);

  return (
    <div>
      <div className="topbar">
        <h2>Panel e indicadores</h2>
      </div>
      <p className="muted mb">Resumen de registros en MongoDB (monitoreo básico).</p>
      {err ? <p className="error">{err}</p> : null}
      {r ? (
        <div className="grid-stats">
          {(
            [
              ['perfiles', r.perfiles],
              ['usuarios', r.usuarios],
              ['paises', r.paises],
              ['fieles', r.fieles],
              ['papas', r.papas],
              ['congregaciones', r.congregaciones],
              ['miradas', r.miradas],
              ['parametros', r.parametros],
            ] as const
          ).map(([k, n]) => (
            <div key={k} className="stat">
              <div className="n">{n}</div>
              <div className="l">{k}</div>
            </div>
          ))}
        </div>
      ) : !err ? (
        <p className="muted">Cargando…</p>
      ) : null}
    </div>
  );
}
