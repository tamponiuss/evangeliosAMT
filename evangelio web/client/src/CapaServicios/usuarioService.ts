import { api } from './apiClient';

export type Usuario = {
  idusuario: string;
  fechaCreacion: string;
  idperfil: string;
  nomPerfil?: string;
};

export const usuarioService = {
  listar: () => api.get<Usuario[]>('/api/usuarios').then((r) => r.data),
  crear: (b: { idusuario: string; clave: string; idperfil: string }) =>
    api.post<Usuario>('/api/usuarios', b).then((r) => r.data),
  actualizar: (id: string, p: { clave?: string; idperfil: string }) =>
    api.put<Usuario>(`/api/usuarios/${encodeURIComponent(id)}`, p).then((r) => r.data),
  eliminar: (id: string) => api.delete(`/api/usuarios/${encodeURIComponent(id)}`),
};
