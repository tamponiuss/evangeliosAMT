import {
  CongregacionModel,
  FielModel,
  MiradaEspiritualModel,
  PaisModel,
  PapaModel,
  ParametroModel,
  PerfilModel,
  UsuarioModel,
} from '../capaConexion/Modelos.js';

export const DashboardNegocio = {
  async resumen() {
    const [perfiles, usuarios, paises, fieles, papas, congregaciones, miradas, parametros] = await Promise.all([
      PerfilModel.countDocuments(),
      UsuarioModel.countDocuments(),
      PaisModel.countDocuments(),
      FielModel.countDocuments(),
      PapaModel.countDocuments(),
      CongregacionModel.countDocuments(),
      MiradaEspiritualModel.countDocuments(),
      ParametroModel.countDocuments(),
    ]);
    return { perfiles, usuarios, paises, fieles, papas, congregaciones, miradas, parametros };
  },
};
