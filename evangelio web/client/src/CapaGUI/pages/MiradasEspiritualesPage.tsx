import { useCallback, useEffect, useState } from 'react';
import { miradaEspiritualService, type MiradaEspiritual } from '../../CapaServicios/miradaEspiritualService';

function empty(): MiradaEspiritual {
  return { idMirada: '', nomMirada: '', descripcion: '', activo: true };
}

export function MiradasEspiritualesPage() {
  const [list, setList] = useState<MiradaEspiritual[]>([]);
  const [e, setE] = useState<MiradaEspiritual | null>(null);
  const [form, setForm] = useState<MiradaEspiritual>(empty());
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    miradaEspiritualService
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

  function abrirEd(x: MiradaEspiritual) {
    setE(x);
    setForm(x);
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    setErr('');
    try {
      if (e) {
        const { idMirada: _id, ...rest } = form;
        await miradaEspiritualService.actualizar(e.idMirada, rest);
      } else {
        await miradaEspiritualService.crear(form);
      }
      abrirCrear();
      load();
    } catch (x) {
      setErr(
        (x as { response?: { data?: { error?: string } } })?.response?.data?.error || String(x)
      );
    }
  }

  async function borrar(m: MiradaEspiritual) {
    if (!confirm(`Eliminar mirada ${m.nomMirada}?`)) return;
    setErr('');
    try {
      await miradaEspiritualService.eliminar(m.idMirada);
      load();
    } catch (x) {
      setErr(String(x));
    }
  }

  return (
    <div>
      <div className="topbar">
        <h2>Miradas espirituales</h2>
      </div>
      <div className="card mb">
        <form onSubmit={guardar} className="mb">
          <div className="form-row">
            <label>
              idMirada {e ? <span className="muted">(no editable)</span> : null}
              <input
                value={form.idMirada}
                onChange={(x) => setForm((f) => ({ ...f, idMirada: x.target.value }))}
                required
                readOnly={!!e}
                disabled={!!e}
              />
            </label>
            <label>
              nomMirada
              <input
                value={form.nomMirada}
                onChange={(x) => setForm((f) => ({ ...f, nomMirada: x.target.value }))}
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
                <th>idMirada</th>
                <th>nomMirada</th>
                <th>descripcion</th>
                <th>activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.idMirada}>
                  <td>{m.idMirada}</td>
                  <td>{m.nomMirada}</td>
                  <td>{m.descripcion}</td>
                  <td>{m.activo ? 'Sí' : '—'}</td>
                  <td className="actions">
                    <button type="button" className="btn" onClick={() => abrirEd(m)}>
                      Editar
                    </button>
                    <button type="button" className="btn danger" onClick={() => borrar(m)}>
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
