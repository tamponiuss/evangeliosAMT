import { useCallback, useEffect, useState } from 'react';
import { papaService, type Papa } from '../../CapaServicios/papaService';

function empty(): Papa {
  return {
    idPapa: '',
    nomPapa: '',
    pontificado: '',
    queRepresenta: '',
    cuandoElegirlo: '',
    activo: true,
  };
}

export function PapasPage() {
  const [list, setList] = useState<Papa[]>([]);
  const [e, setE] = useState<Papa | null>(null);
  const [form, setForm] = useState<Papa>(empty());
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    papaService
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

  function abrirEd(x: Papa) {
    setE(x);
    setForm(x);
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    setErr('');
    try {
      if (e) {
        const { idPapa: _id, ...rest } = form;
        await papaService.actualizar(e.idPapa, rest);
      } else {
        await papaService.crear(form);
      }
      abrirCrear();
      load();
    } catch (x) {
      setErr(
        (x as { response?: { data?: { error?: string } } })?.response?.data?.error || String(x)
      );
    }
  }

  async function borrar(p: Papa) {
    if (!confirm(`Eliminar papa ${p.nomPapa}?`)) return;
    setErr('');
    try {
      await papaService.eliminar(p.idPapa);
      load();
    } catch (x) {
      setErr(String(x));
    }
  }

  return (
    <div>
      <div className="topbar">
        <h2>Papas</h2>
      </div>
      <div className="card mb">
        <form onSubmit={guardar} className="mb">
          <div className="form-row">
            <label>
              idPapa {e ? <span className="muted">(no editable)</span> : null}
              <input
                value={form.idPapa}
                onChange={(x) => setForm((f) => ({ ...f, idPapa: x.target.value }))}
                required
                readOnly={!!e}
                disabled={!!e}
              />
            </label>
            <label>
              nomPapa
              <input
                value={form.nomPapa}
                onChange={(x) => setForm((f) => ({ ...f, nomPapa: x.target.value }))}
                required
              />
            </label>
            <label>
              pontificado
              <input
                value={form.pontificado}
                onChange={(x) => setForm((f) => ({ ...f, pontificado: x.target.value }))}
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
          </div>
          <div className="form-row">
            <label style={{ flex: 1 }}>
              queRepresenta
              <textarea
                value={form.queRepresenta}
                onChange={(x) => setForm((f) => ({ ...f, queRepresenta: x.target.value }))}
                required
                rows={2}
              />
            </label>
            <label style={{ flex: 1 }}>
              cuandoElegirlo
              <textarea
                value={form.cuandoElegirlo}
                onChange={(x) => setForm((f) => ({ ...f, cuandoElegirlo: x.target.value }))}
                required
                rows={2}
              />
            </label>
          </div>
          <div className="form-row">
            <button type="submit" className="btn primary">
              {e ? 'Guardar' : 'Crear'}
            </button>
            {e ? (
              <button type="button" className="btn" onClick={abrirCrear}>
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
        {err ? <p className="error">{err}</p> : null}
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>idPapa</th>
                <th>nomPapa</th>
                <th>pontificado</th>
                <th>activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.idPapa}>
                  <td>{p.idPapa}</td>
                  <td>{p.nomPapa}</td>
                  <td>{p.pontificado}</td>
                  <td>{p.activo ? 'Sí' : '—'}</td>
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
