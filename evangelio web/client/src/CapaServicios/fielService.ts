import { api } from './apiClient';

export type Fiel = {
  email: string;
  idPerfil: string;
  idPapa?: string;
  congregaciones?: string[];
  idMirada?: string;
  filtrosConfigurados?: boolean;
};

export type FielCrear = Fiel & { clave: string };

export const fielService = {
  listar: () => api.get<Fiel[]>('/api/fieles').then((r) => r.data),
  crear: (b: FielCrear) => api.post<Fiel>('/api/fieles', b).then((r) => r.data),
  actualizar: (email: string, b: Partial<FielCrear> & { nuevoEmail?: string }) =>
    api
      .put<Fiel>(`/api/fieles/${encodeURIComponent(email)}`, b)
      .then((r) => r.data),
  eliminar: (email: string) => api.delete(`/api/fieles/${encodeURIComponent(email)}`),
};
