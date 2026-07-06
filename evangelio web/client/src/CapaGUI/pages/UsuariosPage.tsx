import { useCallback, useEffect, useState } from 'react';
import { usuarioService, type Usuario } from '../../CapaServicios/usuarioService';
import { perfilService, type Perfil } from '../../CapaServicios/perfilService';

export function UsuariosPage() {
  const [list, setList] = useState<Usuario[]>([]);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [e, setE] = useState<Usuario | null>(null);
  const [form, setForm] = useState({
    idusuario: '',
    clave: '',
    idperfil: '',
  });
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    Promise.all([usuarioService.listar(), perfilService.listar()])
      .then(([u, p]) => {
        setList(u);
        setPerfiles(p);
      })
      .catch((x) => setErr(String(x)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!e && perfiles.length > 0 && !form.idperfil) {
      setForm((f) => ({ ...f, idperfil: perfiles[0]!.idPerfil }));
    }
  }, [e, perfiles, form.idperfil]);

  function abrirCrear() {
    setE(null);
    setForm({ idusuario: '', clave: '', idperfil: perfiles[0]?.idPerfil || '' });
  }

  function abrirEd(x: Usuario) {
    setE(x);
    setForm({ idusuario: x.idusuario, clave: '', idperfil: x.idperfil });
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    setErr('');
    if (!form.idperfil) {
      setErr('Elija un perfil');
      return;
    }
    try {
      if (e) {
        await usuarioService.actualizar(e.idusuario, {
          idperfil: form.idperfil,
          clave: form.clave || undefined,
        });
      } else {
        if (!form.clave) {
          setErr('La clave es obligatoria al crear');
          return;
        }
        await usuarioService.crear({
          idusuario: form.idusuario,
          clave: form.clave,
          idperfil: form.idperfil,
        });
      }
      abrirCrear();
      load();
    } catch (x) {
      setErr(
        (x as { response?: { data?: { error?: string } } })?.response?.data?.error || String(x)
      );
    }
  }

  async function borrar(u: Usuario) {
    if (!confirm(`Eliminar usuario ${u.idusuario}?`)) return;
    setErr('');
    try {
      await usuarioService.eliminar(u.idusuario);
      load();
    } catch (x) {
      setErr(String(x));
    }
  }

  return (
    <div>
      <div className="topbar">
        <h2>Usuarios</h2>
      </div>
      <div className="card mb">
        <form onSubmit={guardar} className="mb">
          <div className="form-row">
            <label>
              idusuario {e ? <span className="muted">(no editable)</span> : null}
              <input
                value={form.idusuario}
                onChange={(x) => setForm((f) => ({ ...f, idusuario: x.target.value }))}
                required
                readOnly={!!e}
                disabled={!!e}
              />
            </label>
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
              idperfil
              <select
                value={form.idperfil}
                onChange={(x) => setForm((f) => ({ ...f, idperfil: x.target.value }))}
                required
              >
                {perfiles.map((p) => (
                  <option key={p.idPerfil} value={p.idPerfil}>
                    {p.nomPerfil} ({p.idPerfil})
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
                <th>idusuario</th>
                <th>idperfil</th>
                <th>nomPerfil</th>
                <th>fechaCreacion</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.idusuario}>
                  <td>{u.idusuario}</td>
                  <td>{u.idperfil}</td>
                  <td>{u.nomPerfil ?? '—'}</td>
                  <td>{u.fechaCreacion?.slice(0, 10)}</td>
                  <td className="actions">
                    <button type="button" className="btn" onClick={() => abrirEd(u)}>
                      Editar
                    </button>
                    <button type="button" className="btn danger" onClick={() => borrar(u)}>
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
