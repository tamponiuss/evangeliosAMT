import { api } from './apiClient';

export type Resumen = {
  perfiles: number;
  usuarios: number;
  paises: number;
  fieles: number;
  papas: number;
  congregaciones: number;
  miradas: number;
  parametros: number;
};

export async function obtenerResumen(): Promise<Resumen> {
  const { data } = await api.get<Resumen>('/api/dashboard/resumen');
  return data;
}
