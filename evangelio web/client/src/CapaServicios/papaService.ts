import { api } from './apiClient';

export type Papa = {
  idPapa: string;
  nomPapa: string;
  pontificado: string;
  queRepresenta: string;
  cuandoElegirlo: string;
  activo: boolean;
};

export const papaService = {
  listar: () => api.get<Papa[]>('/api/papas').then((r) => r.data),
  crear: (b: Papa) => api.post<Papa>('/api/papas', b).then((r) => r.data),
  actualizar: (id: string, p: Partial<Omit<Papa, 'idPapa'>>) =>
    api.put<Papa>(`/api/papas/${encodeURIComponent(id)}`, p).then((r) => r.data),
  eliminar: (id: string) => api.delete(`/api/papas/${encodeURIComponent(id)}`),
};
