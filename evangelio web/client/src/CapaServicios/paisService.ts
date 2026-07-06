import { api } from './apiClient';

export type Pais = { idPais: string; nomPais: string; codigoPais: string };

export const paisService = {
  listar: () => api.get<Pais[]>('/api/paises').then((r) => r.data),
  crear: (b: Pais) => api.post<Pais>('/api/paises', b).then((r) => r.data),
  actualizar: (id: string, p: Partial<Pick<Pais, 'nomPais' | 'codigoPais'>>) =>
    api.put<Pais>(`/api/paises/${encodeURIComponent(id)}`, p).then((r) => r.data),
  eliminar: (id: string) => api.delete(`/api/paises/${encodeURIComponent(id)}`),
};
