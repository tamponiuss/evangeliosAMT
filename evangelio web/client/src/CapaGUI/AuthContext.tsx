import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { login as apiLogin, type UsuarioLogin } from '../CapaServicios/authService';

type Ctx = {
  usuario: UsuarioLogin | null;
  token: string | null;
  login: (u: string, c: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<Ctx | null>(null);

const KEY_T = 'ev_token';
const KEY_U = 'ev_user';

function loadPersisted(): { token: string | null; usuario: UsuarioLogin | null } {
  const token = localStorage.getItem(KEY_T);
  const raw = localStorage.getItem(KEY_U);
  if (!token || !raw) return { token: null, usuario: null };
  try {
    return { token, usuario: JSON.parse(raw) as UsuarioLogin };
  } catch {
    return { token: null, usuario: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadPersisted);

  const login = useCallback(async (idusuario: string, clave: string) => {
    const { token, usuario } = await apiLogin(idusuario, clave);
    localStorage.setItem(KEY_T, token);
    localStorage.setItem(KEY_U, JSON.stringify(usuario));
    setState({ token, usuario });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(KEY_T);
    localStorage.removeItem(KEY_U);
    setState({ token: null, usuario: null });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      usuario: state.usuario,
      token: state.token,
      login,
      logout,
    }),
    [state, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth fuera de AuthProvider');
  return c;
}
