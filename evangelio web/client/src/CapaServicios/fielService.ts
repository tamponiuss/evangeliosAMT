import { api } from './apiClient';

export type Fiel = {
  email: string;
  idPerfil: string;
  numCelular?: string;
  porEmail?: boolean;
  porAPP?: boolean;
  porWSP?: boolean;
  porInstagram?: boolean;
  cuentaInstagram?: string;
  horaEnvio?: string;
  idPapa?: string;
  congregaciones?: string[];
  idMirada?: string;
  filtrosConfigurados?: boolean;
  plusPagadoEn?: string;
  plusReferenciaPago?: string;
};

export type FielCrear = {
  email: string;
  clave: string;
  idPerfil: string;
};

export type FielActualizar = Partial<{
  clave: string;
  idPerfil: string;
  nuevoEmail: string;
  numCelular: string;
  porEmail: boolean;
  porAPP: boolean;
  porWSP: boolean;
  porInstagram: boolean;
  cuentaInstagram: string;
  horaEnvio: string;
}>;

export const fielService = {
  listar: () => api.get<Fiel[]>('/api/fieles').then((r) => r.data),
  crear: (b: FielCrear) => api.post<Fiel>('/api/fieles', b).then((r) => r.data),
  actualizar: (email: string, b: FielActualizar) =>
    api.put<Fiel>(`/api/fieles/${encodeURIComponent(email)}`, b).then((r) => r.data),
  eliminar: (email: string) => api.delete(`/api/fieles/${encodeURIComponent(email)}`),
};
