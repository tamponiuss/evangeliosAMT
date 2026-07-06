import { useCallback, useEffect, useState } from 'react';
import { congregacionService, type Congregacion } from '../../CapaServicios/congregacionService';

function empty(): Congregacion {
  return { idCongregacion: '', nomCongregacion: '', enfoqueEditorial: '', activo: true };
}

export function CongregacionesPage() {
  const [list, setList] = useState<Congregacion[]>([]);
  const [e, setE] = useState<Congregacion | null>(null);
  const [form, setForm] = useState<Congregacion>(empty());
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    congregacionService
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

  function abrirEd(x: Congregacion) {
    setE(x);
    setForm(x);
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    setErr('');
    try {
      if (e) {
        const { idCongregacion: _id, ...rest } = form;
        await congregacionService.actualizar(e.idCongregacion, rest);
      } else {
        await congregacionService.crear(form);
      }
      abrirCrear();
      load();
    } catch (x) {
      setErr(
        (x as { response?: { data?: { error?: string } } })?.response?.data?.error || String(x)
      );
    }
  }

  async function borrar(c: Congregacion) {
    if (!confirm(`Eliminar congregación ${c.nomCongregacion}?`)) return;
    setErr('');
    try {
      await congregacionService.eliminar(c.idCongregacion);
      load();
    } catch (x) {
      setErr(String(x));
    }
  }

  return (
    <div>
      <div className="topbar">
        <h2>Congregaciones</h2>
      </div>
      <div className="card mb">
        <form onSubmit={guardar} className="mb">
          <div className="form-row">
            <label>
              idCongregacion {e ? <span className="muted">(no editable)</span> : null}
              <input
                value={form.idCongregacion}
                onChange={(x) => setForm((f) => ({ ...f, idCongregacion: x.target.value }))}
                required
                readOnly={!!e}
                disabled={!!e}
              />
            </label>
            <label>
              nomCongregacion
              <input
                value={form.nomCongregacion}
                onChange={(x) => setForm((f) => ({ ...f, nomCongregacion: x.target.value }))}
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
            enfoqueEditorial
            <textarea
              value={form.enfoqueEditorial}
              onChange={(x) => setForm((f) => ({ ...f, enfoqueEditorial: x.target.value }))}
              required
              rows={2}
            />
          </label>
        </form>
        {err ? <p className="error">{err}</p> : null}
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>idCongregacion</th>
                <th>nomCongregacion</th>
                <th>enfoqueEditorial</th>
                <th>activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.idCongregacion}>
                  <td>{c.idCongregacion}</td>
                  <td>{c.nomCongregacion}</td>
                  <td>{c.enfoqueEditorial}</td>
                  <td>{c.activo ? 'Sí' : '—'}</td>
                  <td className="actions">
                    <button type="button" className="btn" onClick={() => abrirEd(c)}>
                      Editar
                    </button>
                    <button type="button" className="btn danger" onClick={() => borrar(c)}>
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
