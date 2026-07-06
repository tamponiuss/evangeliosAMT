import { useCallback, useEffect, useState } from 'react';
import { fielService, type Fiel, type FielCrear } from '../../CapaServicios/fielService';
import { perfilService, type Perfil } from '../../CapaServicios/perfilService';

function emptyF(): FielCrear {
  return {
    email: '',
    clave: '',
    idPerfil: '',
  };
}

export function FielesPage() {
  const [list, setList] = useState<Fiel[]>([]);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [e, setE] = useState<Fiel | null>(null);
  const [form, setForm] = useState<FielCrear & { nuevoEmail?: string }>(emptyF());
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    Promise.all([fielService.listar(), perfilService.listar()])
      .then(([f, p]) => {
        setList(f);
        setPerfiles(p);
      })
      .catch((x) => setErr(String(x)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!e && perfiles.length && !form.idPerfil) {
      setForm((f) => ({ ...f, idPerfil: perfiles[0]!.idPerfil }));
    }
  }, [e, perfiles, form.idPerfil]);

  function abrirCrear() {
    setE(null);
    setForm({ ...emptyF(), idPerfil: perfiles[0]?.idPerfil || '' });
  }

  function abrirEd(x: Fiel) {
    setE(x);
    setForm({
      email: x.email,
      clave: '',
      idPerfil: x.idPerfil,
    });
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    setErr('');
    if (!e && !form.clave) {
      setErr('La clave es obligatoria al crear');
      return;
    }
    try {
      if (e) {
        const payload: Parameters<typeof fielService.actualizar>[1] = {
          idPerfil: form.idPerfil,
        };
        if (form.clave) payload.clave = form.clave;
        if (form.nuevoEmail && form.nuevoEmail !== e.email) {
          payload.nuevoEmail = form.nuevoEmail;
        }
        await fielService.actualizar(e.email, payload);
      } else {
        await fielService.crear(form);
      }
      abrirCrear();
      load();
    } catch (x) {
      setErr(
        (x as { response?: { data?: { error?: string } } })?.response?.data?.error || String(x)
      );
    }
  }

  async function borrar(f: Fiel) {
    if (!confirm(`Eliminar fiel ${f.email}?`)) return;
    setErr('');
    try {
      await fielService.eliminar(f.email);
      load();
    } catch (x) {
      setErr(String(x));
    }
  }

  return (
    <div>
      <div className="topbar">
        <h2>Fieles</h2>
      </div>
      <div className="card mb">
        <form onSubmit={guardar} className="mb">
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            {e ? (
              <label>
                Email (llave) — no editar aquí; use &quot;Nuevo email&quot;
                <input value={form.email} readOnly disabled />
              </label>
            ) : (
              <label>
                email (llave)
                <input
                  type="email"
                  value={form.email}
                  onChange={(x) => setForm((f) => ({ ...f, email: x.target.value }))}
                  required
                />
              </label>
            )}
            {e ? (
              <label>
                Nuevo email (opcional)
                <input
                  value={form.nuevoEmail || ''}
                  onChange={(x) => setForm((f) => ({ ...f, nuevoEmail: x.target.value }))}
                  placeholder={e.email}
                />
              </label>
            ) : null}
            <label>
              {e ? 'Nueva clave (opcional)' : 'Clave'}
              <input
                type="password"
                value={form.clave}
                onChange={(x) => setForm((f) => ({ ...f, clave: x.target.value }))}
                required={!e}
              />
            </label>
            <label>
              idPerfil
              <select
                value={form.idPerfil}
                onChange={(x) => setForm((f) => ({ ...f, idPerfil: x.target.value }))}
                required
              >
                {perfiles.map((p) => (
                  <option key={p.idPerfil} value={p.idPerfil}>
                    {p.nomPerfil}
                  </option>
                ))}
              </select>
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
                <th>email</th>
                <th>idPerfil</th>
                <th>filtros</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.email}>
                  <td>{f.email}</td>
                  <td>{f.idPerfil}</td>
                  <td>
                    {f.filtrosConfigurados
                      ? `${f.idPapa || '—'} / ${(f.congregaciones || []).join(', ') || '—'} / ${f.idMirada || '—'}`
                      : '—'}
                  </td>
                  <td className="actions">
                    <button type="button" className="btn" onClick={() => abrirEd(f)}>
                      Editar
                    </button>
                    <button type="button" className="btn danger" onClick={() => borrar(f)}>
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
