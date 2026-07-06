export interface FielCrearDTO {
  email: string;
  clave: string;
  idPerfil: string;
}

export interface FielRespuestaDTO {
  email: string;
  idPerfil: string;
  idPapa?: string;
  congregaciones?: string[];
  idMirada?: string;
  filtrosConfigurados?: boolean;
  plusPagadoEn?: string;
  plusReferenciaPago?: string;
}
