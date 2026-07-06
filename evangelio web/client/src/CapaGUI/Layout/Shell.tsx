import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const items = [
  { to: '/', label: 'Inicio' },
  { to: '/perfiles', label: 'Perfiles' },
  { to: '/usuarios', label: 'Usuarios' },
  { to: '/paises', label: 'Países' },
  { to: '/fieles', label: 'Fieles' },
  { to: '/papas', label: 'Papas' },
  { to: '/congregaciones', label: 'Congregaciones' },
  { to: '/miradas-espirituales', label: 'Miradas espirituales' },
  { to: '/parametros', label: 'Parámetros' },
];

export function Shell() {
  const { usuario, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="app-shell">
      <aside className="side">
        <h1>Evangelioweb</h1>
        <nav className="nav">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.to === '/'}>
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: '1.5rem', padding: '0 1.25rem' }}>
          <p className="muted" style={{ margin: '0 0 0.5rem' }}>
            {usuario?.idusuario} · {usuario?.nomPerfil}
          </p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              logout();
              nav('/login', { replace: true });
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
