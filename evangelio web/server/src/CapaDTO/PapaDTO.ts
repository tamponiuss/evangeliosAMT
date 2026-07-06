export interface PapaCrearDTO {
  idPapa: string;
  nomPapa: string;
  pontificado: string;
  queRepresenta: string;
  cuandoElegirlo: string;
  activo?: boolean;
}

export interface PapaRespuestaDTO {
  idPapa: string;
  nomPapa: string;
  pontificado: string;
  queRepresenta: string;
  cuandoElegirlo: string;
  activo: boolean;
}
