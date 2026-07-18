import { useCallback, useEffect, useState } from 'react';
import { envioService, type EnvioEvangelio, type ResultadoTick } from '../../CapaServicios/envioService';

export function EnviosPage() {
  const [list, setList] = useState<EnvioEvangelio[]>([]);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    envioService
      .recientes(150)
      .then(setList)
      .catch((x) => setErr(String(x)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function procesarAhora() {
    setBusy(true);
    setErr('');
    setInfo('');
    try {
      const r: ResultadoTick = await envioService.procesarAhora();
      setInfo(
        `Tick ${r.fecha} ${r.hora} (${r.zona}): candidatos=${r.candidatos}, enviados=${r.enviados}, errores=${r.errores}, omitidos=${r.omitidos}`
      );
      load();
    } catch (x) {
      setErr(
        (x as { response?: { data?: { error?: string } } })?.response?.data?.error || String(x)
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="topbar">
        <h2>Envíos del evangelio</h2>
        <button type="button" className="btn primary" disabled={busy} onClick={procesarAhora}>
          {busy ? 'Procesando…' : 'Procesar ahora'}
        </button>
      </div>
      <p className="muted mb">
        Historial de envíos por email según la hora configurada de cada fiel. WhatsApp e Instagram
        aún no están activos.
      </p>
      {info ? <p className="mb" style={{ color: 'var(--ok)' }}>{info}</p> : null}
      {err ? <p className="error mb">{err}</p> : null}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora prog.</th>
                <th>Email</th>
                <th>Canal</th>
                <th>Estado</th>
                <th>Título</th>
                <th>Detalle</th>
                <th>Enviado</th>
              </tr>
            </thead>
            <tbody>
              {list.map((x, i) => (
                <tr key={`${x.email}-${x.fecha}-${x.canal}-${i}`}>
                  <td>{x.fecha}</td>
                  <td>{x.horaProgramada || '—'}</td>
                  <td>{x.email}</td>
                  <td>{x.canal}</td>
                  <td>{x.estado}</td>
                  <td>{x.titulo || '—'}</td>
                  <td style={{ maxWidth: 280 }}>{x.error || '—'}</td>
                  <td>{x.enviadoEn ? new Date(x.enviadoEn).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="muted">
                    Aún no hay envíos registrados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
