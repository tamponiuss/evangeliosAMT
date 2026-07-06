/** Perfil básico: evangelio y reflexiones genéricas. */
export const ID_PERFIL_FIEL = 'perfil-fiel';
/** Perfil plus/full: puede configurar Papa, congregaciones y mirada espiritual. */
export const ID_PERFIL_FIEL_PLUS = 'perfil-fiel-plus';

export function esPerfilPlus(idPerfil: string): boolean {
  return idPerfil === ID_PERFIL_FIEL_PLUS;
}
