import { api } from './apiClient';

export type EnvioEvangelio = {
  email: string;
  fecha: string;
  canal: 'email' | 'wsp' | 'instagram';
  horaProgramada: string;
  estado: 'enviado' | 'error' | 'omitido';
  error?: string;
  titulo?: string;
  enviadoEn?: string;
};

export type ResultadoTick = {
  zona: string;
  fecha: string;
  hora: string;
  candidatos: number;
  enviados: number;
  errores: number;
  omitidos: number;
};

export const envioService = {
  recientes: (limite = 100) =>
    api.get<EnvioEvangelio[]>(`/api/envios/recientes?limite=${limite}`).then((r) => r.data),
  procesarAhora: () => api.post<ResultadoTick>('/api/envios/procesar-ahora').then((r) => r.data),
};
