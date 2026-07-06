import { api } from './apiClient';

export type Parametro = {
  idParametro: string;
  monto: number;
  moneda: string;
  descripcion: string;
  periodo: string;
  activo: boolean;
  actualizadoEn: string;
};

export const parametroService = {
  listar: () => api.get<Parametro[]>('/api/parametros').then((r) => r.data),
  crear: (b: Omit<Parametro, 'actualizadoEn'>) =>
    api.post<Parametro>('/api/parametros', b).then((r) => r.data),
  actualizar: (
    idParametro: string,
    b: Partial<Omit<Parametro, 'idParametro' | 'actualizadoEn'>>
  ) => api.put<Parametro>(`/api/parametros/${encodeURIComponent(idParametro)}`, b).then((r) => r.data),
  eliminar: (idParametro: string) => api.delete(`/api/parametros/${encodeURIComponent(idParametro)}`),
};
