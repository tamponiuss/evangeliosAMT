import { api } from './apiClient';

export type Perfil = { idPerfil: string; nomPerfil: string };

export const perfilService = {
  listar: () => api.get<Perfil[]>('/api/perfiles').then((r) => r.data),
  crear: (b: Perfil) => api.post<Perfil>('/api/perfiles', b).then((r) => r.data),
  actualizar: (id: string, p: Partial<Perfil>) =>
    api.put<Perfil>(`/api/perfiles/${encodeURIComponent(id)}`, p).then((r) => r.data),
  eliminar: (id: string) => api.delete(`/api/perfiles/${encodeURIComponent(id)}`),
};
