import { api } from './apiClient';

export type MiradaEspiritual = {
  idMirada: string;
  nomMirada: string;
  descripcion: string;
  activo: boolean;
};

export const miradaEspiritualService = {
  listar: () => api.get<MiradaEspiritual[]>('/api/miradas-espirituales').then((r) => r.data),
  crear: (b: MiradaEspiritual) =>
    api.post<MiradaEspiritual>('/api/miradas-espirituales', b).then((r) => r.data),
  actualizar: (id: string, p: Partial<Omit<MiradaEspiritual, 'idMirada'>>) =>
    api
      .put<MiradaEspiritual>(`/api/miradas-espirituales/${encodeURIComponent(id)}`, p)
      .then((r) => r.data),
  eliminar: (id: string) => api.delete(`/api/miradas-espirituales/${encodeURIComponent(id)}`),
};
