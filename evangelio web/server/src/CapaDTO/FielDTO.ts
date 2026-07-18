export interface FielCrearDTO {
  email: string;
  clave: string;
  idPerfil: string;
}

export interface FielRespuestaDTO {
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
}

/** Preferencias de entrega del evangelio diario (editables por el propio fiel desde la app). */
export interface PreferenciasEntregaDTO {
  porEmail?: boolean;
  porAPP?: boolean;
  porWSP?: boolean;
  porInstagram?: boolean;
  numCelular?: string;
  cuentaInstagram?: string;
  horaEnvio?: string;
}
