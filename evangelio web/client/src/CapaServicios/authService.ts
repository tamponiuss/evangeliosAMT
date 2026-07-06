import { api } from './apiClient';

export type UsuarioLogin = { idusuario: string; idperfil: string; nomPerfil: string };

export async function login(
  idusuario: string,
  clave: string
): Promise<{ token: string; usuario: UsuarioLogin }> {
  const { data } = await api.post('/api/auth/login', { idusuario, clave });
  return data;
}
