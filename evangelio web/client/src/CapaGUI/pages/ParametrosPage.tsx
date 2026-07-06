import { useCallback, useEffect, useState } from 'react';
import { parametroService, type Parametro } from '../../CapaServicios/parametroService';

function empty(): Omit<Parametro, 'actualizadoEn'> {
  return {
    idParametro: '',
    monto: 0,
    moneda: 'USD',
    descripcion: '',
    periodo: 'mensual',
    activo: true,
  };
}

export function ParametrosPage() {
  const [list, setList] = useState<Parametro[]>([]);
  const [e, setE] = useState<Parametro | null>(null);
  const [form, setForm] = useState<Omit<Parametro, 'actualizadoEn'>>(empty());
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    parametroService
      .listar()
      .then(setList)
      .catch((x) => setErr(String(x)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function abrirCrear() {
    setE(null);
    setForm(empty());
  }

  function abrirEd(x: Parametro) {
    setE(x);
    setForm({
      idParametro: x.idParametro,
      monto: x.monto,
      moneda: x.moneda,
      descripcion: x.descripcion,
      periodo: x.periodo,
      activo: x.activo,
    });
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    setErr('');
    try {
      if (e) {
        const { idParametro: _id, ...partial } = form;
        await parametroService.actualizar(e.idParametro, partial);
      } else {
        await parametroService.crear(form);
      }
      abrirCrear();
      load();
    } catch (x) {
      setErr(
        (x as { response?: { data?: { error?: string } } })?.response?.data?.error || String(x)
      );
    }
  }

  async function borrar(p: Parametro) {
    if (!confirm(`Eliminar parámetro ${p.idParametro}?`)) return;
    setErr('');
    try {
      await parametroService.eliminar(p.idParametro);
      load();
    } catch (x) {
      setErr(String(x));
    }
  }

  return (
    <div>
      <div className="topbar">
        <h2>Parámetros</h2>
      </div>
      <p className="muted mb">
        CRUD de parámetros de app. Ejemplo: <code>tarifa-plus</code>.
      </p>
      <div className="card mb">
        <form onSubmit={guardar} className="mb">
          <div className="form-row">
            <label>
              idParametro {e ? <span className="muted">(no editable)</span> : null}
              <input
                value={form.idParametro}
                onChange={(x) => setForm((f) => ({ ...f, idParametro: x.target.value }))}
                required
                readOnly={!!e}
                disabled={!!e}
              />
            </label>
            <label>
              monto
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.monto}
                onChange={(x) => setForm((f) => ({ ...f, monto: Number(x.target.value) }))}
                required
              />
            </label>
            <label>
              moneda
              <input
                value={form.moneda}
                onChange={(x) => setForm((f) => ({ ...f, moneda: x.target.value }))}
                required
              />
            </label>
            <label>
              periodo
              <input
                value={form.periodo}
                onChange={(x) => setForm((f) => ({ ...f, periodo: x.target.value }))}
                required
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(x) => setForm((f) => ({ ...f, activo: x.target.checked }))}
              />{' '}
              activo
            </label>
            <button type="submit" className="btn primary">
              {e ? 'Guardar' : 'Crear'}
            </button>
            {e ? (
              <button type="button" className="btn" onClick={abrirCrear}>
                Cancelar
              </button>
            ) : null}
          </div>
          <label>
            descripcion
            <textarea
              value={form.descripcion}
              onChange={(x) => setForm((f) => ({ ...f, descripcion: x.target.value }))}
              rows={2}
              required
            />
          </label>
        </form>
        {err ? <p className="error">{err}</p> : null}
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>idParametro</th>
                <th>monto</th>
                <th>moneda</th>
                <th>periodo</th>
                <th>activo</th>
                <th>actualizadoEn</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.idParametro}>
                  <td>{p.idParametro}</td>
                  <td>{p.monto}</td>
                  <td>{p.moneda}</td>
                  <td>{p.periodo}</td>
                  <td>{p.activo ? 'Sí' : '—'}</td>
                  <td>{new Date(p.actualizadoEn).toLocaleString()}</td>
                  <td className="actions">
                    <button type="button" className="btn" onClick={() => abrirEd(p)}>
                      Editar
                    </button>
                    <button type="button" className="btn danger" onClick={() => borrar(p)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
