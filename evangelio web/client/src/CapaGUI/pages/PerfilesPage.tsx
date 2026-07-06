import { useCallback, useEffect, useState } from 'react';
import { perfilService, type Perfil } from '../../CapaServicios/perfilService';

export function PerfilesPage() {
  const [list, setList] = useState<Perfil[]>([]);
  const [e, setE] = useState<Perfil | null>(null);
  const [form, setForm] = useState<Perfil>({ idPerfil: '', nomPerfil: '' });
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    perfilService
      .listar()
      .then(setList)
      .catch((x) => setErr(String(x)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function abrirCrear() {
    setE(null);
    setForm({ idPerfil: '', nomPerfil: '' });
  }

  function abrirEd(x: Perfil) {
    setE(x);
    setForm(x);
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    setErr('');
    try {
      if (e) {
        await perfilService.actualizar(e.idPerfil, { nomPerfil: form.nomPerfil });
      } else {
        await perfilService.crear(form);
      }
      abrirCrear();
      load();
    } catch (x) {
      setErr(
        (x as { response?: { data?: { error?: string } } })?.response?.data?.error || String(x)
      );
    }
  }

  async function borrar(p: Perfil) {
    if (!confirm(`Eliminar perfil ${p.idPerfil}?`)) return;
    setErr('');
    try {
      await perfilService.eliminar(p.idPerfil);
      load();
    } catch (x) {
      setErr(String(x));
    }
  }

  return (
    <div>
      <div className="topbar">
        <h2>Perfiles</h2>
      </div>
      <div className="card mb">
        <form onSubmit={guardar} className="mb">
          <div className="form-row">
            <label>
              idPerfil {e ? <span className="muted">(no editable)</span> : null}
              <input
                value={form.idPerfil}
                onChange={(x) => setForm((f) => ({ ...f, idPerfil: x.target.value }))}
                required
                readOnly={!!e}
                disabled={!!e}
              />
            </label>
            <label>
              nomPerfil
              <input
                value={form.nomPerfil}
                onChange={(x) => setForm((f) => ({ ...f, nomPerfil: x.target.value }))}
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
                <th>idPerfil</th>
                <th>nomPerfil</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.idPerfil}>
                  <td>{p.idPerfil}</td>
                  <td>{p.nomPerfil}</td>
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
