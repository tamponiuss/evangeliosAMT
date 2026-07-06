import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export function LoginPage() {
  const { login, token } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: { pathname: string } } };
  const [idusuario, setId] = useState('');
  const [clave, setClave] = useState('');
  const [err, setErr] = useState('');

  if (token) {
    return <Navigate to={loc.state?.from?.pathname || '/'} replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      await login(idusuario, clave);
      nav(loc.state?.from?.pathname || '/', { replace: true });
    } catch (ex) {
      const m = (ex as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setErr(m || 'No se pudo iniciar sesión');
    }
  }

  return (
    <div className="login-page">
      <div className="card login-box">
        <h1>Evangelioweb</h1>
        <p className="sub">Administración y monitoreo (SOA / n-capas)</p>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label>
              Usuario (idusuario)
              <input
                value={idusuario}
                onChange={(e) => setId(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label>
              Clave
              <input
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
          </div>
          {err ? <p className="error">{err}</p> : null}
          <button type="submit" className="btn primary" style={{ width: '100%', marginTop: '0.75rem' }}>
            Entrar
          </button>
        </form>
        <p className="muted" style={{ marginTop: '1.25rem' }}>
          Tras el seed: usuario <strong>admin</strong> / <strong>evangelio</strong>
        </p>
      </div>
    </div>
  );
}
