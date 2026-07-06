export const ID_PARAMETRO_TARIFA_PLUS = 'tarifa-plus';

export interface ParametroRespuestaDTO {
  idParametro: string;
  monto: number;
  moneda: string;
  descripcion: string;
  periodo: string;
  activo: boolean;
  actualizadoEn: string;
}

export interface ParametroActualizarDTO {
  monto?: number;
  moneda?: string;
  descripcion?: string;
  periodo?: string;
  activo?: boolean;
}

export interface ParametroCrearDTO {
  idParametro: string;
  monto: number;
  moneda: string;
  descripcion: string;
  periodo: string;
  activo?: boolean;
}

export interface TarifaPlusPublicaDTO {
  monto: number;
  moneda: string;
  descripcion: string;
  periodo: string;
  activo: boolean;
}

export interface PagoPlusRespuestaDTO {
  ok: true;
  referencia: string;
  usuario: import('./FielDTO.js').FielRespuestaDTO;
}

export interface PagoPlusHistorialDTO {
  idPago: string;
  email: string;
  monto: number;
  moneda: string;
  referencia: string;
  estado: string;
  fechaPago: string;
}
