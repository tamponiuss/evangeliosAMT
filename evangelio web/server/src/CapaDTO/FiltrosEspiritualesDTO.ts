export interface FiltrosEspiritualesDTO {
  idPapa: string;
  congregaciones: string[];
  idMirada: string;
  filtrosConfigurados: boolean;
}

export interface CatalogosEspiritualesDTO {
  papas: import('./PapaDTO.js').PapaRespuestaDTO[];
  congregaciones: import('./CongregacionDTO.js').CongregacionRespuestaDTO[];
  miradas: import('./MiradaEspiritualDTO.js').MiradaEspiritualRespuestaDTO[];
}

/** Opción del catálogo: el usuario no quiere una mirada concreta en el contenido. */
export const ID_MIRADA_NINGUNA = 'ninguna_holistica';

export interface ContextoPersonalizacionDTO {
  papa: import('./PapaDTO.js').PapaRespuestaDTO | null;
  congregaciones: import('./CongregacionDTO.js').CongregacionRespuestaDTO[];
  mirada: import('./MiradaEspiritualDTO.js').MiradaEspiritualRespuestaDTO | null;
  /** Valores guardados en el perfil (para firma de caché aunque no entren al texto). */
  idPapaElegido: string;
  idMiradaElegida: string;
}
