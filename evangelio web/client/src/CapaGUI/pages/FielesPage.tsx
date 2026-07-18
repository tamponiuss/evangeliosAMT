import { useCallback, useEffect, useMemo, useState } from 'react';
import { fielService, type Fiel, type FielCrear } from '../../CapaServicios/fielService';
import { perfilService, type Perfil } from '../../CapaServicios/perfilService';

type FormState = FielCrear & {
  nuevoEmail?: string;
  numCelular?: string;
  porEmail?: boolean;
  porAPP?: boolean;
  porWSP?: boolean;
  porInstagram?: boolean;
  cuentaInstagram?: string;
  horaEnvio?: string;
};

function emptyF(): FormState {
  return {
    email: '',
    clave: '',
    idPerfil: '',
    numCelular: '',
    porEmail: false,
    porAPP: true,
    porWSP: false,
    porInstagram: false,
    cuentaInstagram: '',
    horaEnvio: '07:00',
  };
}

export function FielesPage() {
  const [list, setList] = useState<Fiel[]>([]);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [e, setE] = useState<Fiel | null>(null);
  const [form, setForm] = useState<FormState>(emptyF());
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [soloEmail, setSoloEmail] = useState(false);

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

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    return list.filter((f) => {
      if (soloEmail && !f.porEmail) return false;
      if (!term) return true;
      return (
        f.email.toLowerCase().includes(term) ||
        f.idPerfil.toLowerCase().includes(term) ||
        (f.horaEnvio || '').includes(term)
      );
    });
  }, [list, q, soloEmail]);

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
      numCelular: x.numCelular || '',
      porEmail: Boolean(x.porEmail),
      porAPP: x.porAPP !== false,
      porWSP: Boolean(x.porWSP),
      porInstagram: Boolean(x.porInstagram),
      cuentaInstagram: x.cuentaInstagram || '',
      horaEnvio: x.horaEnvio || '07:00',
    });
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    setErr('');
    if (!e && !form.clave) {
      setErr('La clave es obligatoria al crear');
      return;
    }
    if (form.porEmail && form.horaEnvio && !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.horaEnvio)) {
      setErr('horaEnvio debe ser HH:mm (24 horas)');
      return;
    }
    try {
      if (e) {
        const payload = {
          idPerfil: form.idPerfil,
          numCelular: form.numCelular || '',
          porEmail: Boolean(form.porEmail),
          porAPP: Boolean(form.porAPP),
          porWSP: Boolean(form.porWSP),
          porInstagram: Boolean(form.porInstagram),
          cuentaInstagram: form.cuentaInstagram || '',
          horaEnvio: form.horaEnvio || '',
          ...(form.clave ? { clave: form.clave } : {}),
          ...(form.nuevoEmail && form.nuevoEmail !== e.email ? { nuevoEmail: form.nuevoEmail } : {}),
        };
        await fielService.actualizar(e.email, payload);
      } else {
        await fielService.crear({
          email: form.email,
          clave: form.clave,
          idPerfil: form.idPerfil,
        });
        if (
          form.porEmail ||
          form.horaEnvio ||
          form.numCelular ||
          form.porWSP ||
          form.porInstagram
        ) {
          await fielService.actualizar(form.email.trim().toLowerCase(), {
            numCelular: form.numCelular || '',
            porEmail: Boolean(form.porEmail),
            porAPP: Boolean(form.porAPP),
            porWSP: Boolean(form.porWSP),
            porInstagram: Boolean(form.porInstagram),
            cuentaInstagram: form.cuentaInstagram || '',
            horaEnvio: form.horaEnvio || '',
          });
        }
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
        <h2>Fieles (app móvil)</h2>
      </div>
      <p className="muted mb">
        Administra cuentas de la app conectadas a Atlas. El envío automático activo por ahora es solo{' '}
        <strong>email</strong>. WhatsApp e Instagram quedan guardados pero no se envían aún.
      </p>
      <div className="card mb">
        <form onSubmit={guardar} className="mb">
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            {e ? (
              <label>
                Email (llave) — use &quot;Nuevo email&quot; para cambiarlo
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
              Perfil
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
          </div>

          <div className="form-row">
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="checkbox"
                checked={Boolean(form.porEmail)}
                onChange={(x) => setForm((f) => ({ ...f, porEmail: x.target.checked }))}
              />
              Recibir por email
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="checkbox"
                checked={form.porAPP !== false}
                onChange={(x) => setForm((f) => ({ ...f, porAPP: x.target.checked }))}
              />
              Usar en la app
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="checkbox"
                checked={Boolean(form.porWSP)}
                onChange={(x) => setForm((f) => ({ ...f, porWSP: x.target.checked }))}
              />
              WhatsApp (próximamente)
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="checkbox"
                checked={Boolean(form.porInstagram)}
                onChange={(x) => setForm((f) => ({ ...f, porInstagram: x.target.checked }))}
              />
              Instagram (próximamente)
            </label>
          </div>

          <div className="form-row">
            <label>
              Hora de envío (HH:mm)
              <input
                type="time"
                value={form.horaEnvio || ''}
                onChange={(x) => setForm((f) => ({ ...f, horaEnvio: x.target.value }))}
              />
            </label>
            <label>
              Celular (WhatsApp)
              <input
                value={form.numCelular || ''}
                onChange={(x) => setForm((f) => ({ ...f, numCelular: x.target.value }))}
                placeholder="+56..."
              />
            </label>
            <label>
              Cuenta Instagram
              <input
                value={form.cuentaInstagram || ''}
                onChange={(x) => setForm((f) => ({ ...f, cuentaInstagram: x.target.value }))}
                placeholder="@usuario"
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

        <div className="form-row mb">
          <label>
            Buscar
            <input
              value={q}
              onChange={(x) => setQ(x.target.value)}
              placeholder="email, perfil u hora"
            />
          </label>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.4rem' }}>
            <input
              type="checkbox"
              checked={soloEmail}
              onChange={(x) => setSoloEmail(x.target.checked)}
            />
            Solo con email activo
          </label>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>email</th>
                <th>perfil</th>
                <th>email diario</th>
                <th>hora</th>
                <th>app</th>
                <th>otros</th>
                <th>filtros</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((f) => (
                <tr key={f.email}>
                  <td>{f.email}</td>
                  <td>{f.idPerfil}</td>
                  <td>{f.porEmail ? 'Sí' : 'No'}</td>
                  <td>{f.horaEnvio || '—'}</td>
                  <td>{f.porAPP === false ? 'No' : 'Sí'}</td>
                  <td>
                    {[
                      f.porWSP ? 'WSP' : null,
                      f.porInstagram ? 'IG' : null,
                      f.numCelular || null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </td>
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
