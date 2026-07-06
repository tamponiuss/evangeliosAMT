import { useCallback, useEffect, useState } from 'react';
import { paisService, type Pais } from '../../CapaServicios/paisService';

export function PaisesPage() {
  const [list, setList] = useState<Pais[]>([]);
  const [e, setE] = useState<Pais | null>(null);
  const [form, setForm] = useState<Pais>({ idPais: '', nomPais: '', codigoPais: '' });
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    paisService
      .listar()
      .then(setList)
      .catch((x) => setErr(String(x)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function abrirCrear() {
    setE(null);
    setForm({ idPais: '', nomPais: '', codigoPais: '' });
  }

  function abrirEd(x: Pais) {
    setE(x);
    setForm(x);
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    setErr('');
    try {
      if (e) {
        await paisService.actualizar(e.idPais, { nomPais: form.nomPais, codigoPais: form.codigoPais });
      } else {
        await paisService.crear(form);
      }
      abrirCrear();
      load();
    } catch (x) {
      setErr(
        (x as { response?: { data?: { error?: string } } })?.response?.data?.error || String(x)
      );
    }
  }

  async function borrar(p: Pais) {
    if (!confirm(`Eliminar país ${p.idPais}?`)) return;
    setErr('');
    try {
      await paisService.eliminar(p.idPais);
      load();
    } catch (x) {
      setErr(String(x));
    }
  }

  return (
    <div>
      <div className="topbar">
        <h2>Países</h2>
      </div>
      <div className="card mb">
        <form onSubmit={guardar} className="mb">
          <div className="form-row">
            <label>
              idPais {e ? <span className="muted">(no editable)</span> : null}
              <input
                value={form.idPais}
                onChange={(x) => setForm((f) => ({ ...f, idPais: x.target.value }))}
                required
                readOnly={!!e}
                disabled={!!e}
              />
            </label>
            <label>
              nomPais
              <input
                value={form.nomPais}
                onChange={(x) => setForm((f) => ({ ...f, nomPais: x.target.value }))}
                required
              />
            </label>
            <label>
              codigoPais
              <input
                value={form.codigoPais}
                onChange={(x) => setForm((f) => ({ ...f, codigoPais: x.target.value }))}
                required
              />
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
        </form>
        {err ? <p className="error">{err}</p> : null}
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>idPais</th>
                <th>nomPais</th>
                <th>codigoPais</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.idPais}>
                  <td>{p.idPais}</td>
                  <td>{p.nomPais}</td>
                  <td>{p.codigoPais}</td>
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
