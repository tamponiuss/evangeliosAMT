import { api } from './apiClient';

export type Congregacion = {
  idCongregacion: string;
  nomCongregacion: string;
  enfoqueEditorial: string;
  activo: boolean;
};

export const congregacionService = {
  listar: () => api.get<Congregacion[]>('/api/congregaciones').then((r) => r.data),
  crear: (b: Congregacion) => api.post<Congregacion>('/api/congregaciones', b).then((r) => r.data),
  actualizar: (id: string, p: Partial<Omit<Congregacion, 'idCongregacion'>>) =>
    api.put<Congregacion>(`/api/congregaciones/${encodeURIComponent(id)}`, p).then((r) => r.data),
  eliminar: (id: string) => api.delete(`/api/congregaciones/${encodeURIComponent(id)}`),
};
