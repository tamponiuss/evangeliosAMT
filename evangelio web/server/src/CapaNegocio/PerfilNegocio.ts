import { PerfilModel, type IPerfil } from '../capaConexion/Modelos.js';
import type { PerfilCrearDTO, PerfilRespuestaDTO } from '../CapaDTO/PerfilDTO.js';

function aDTO(doc: IPerfil): PerfilRespuestaDTO {
  return { idPerfil: doc.idPerfil, nomPerfil: doc.nomPerfil };
}

export const PerfilNegocio = {
  async listar(): Promise<PerfilRespuestaDTO[]> {
    const list = await PerfilModel.find().lean();
    return list.map((d) => aDTO(d as IPerfil));
  },
  async obtener(idPerfil: string): Promise<PerfilRespuestaDTO | null> {
    const d = await PerfilModel.findOne({ idPerfil }).lean();
    return d ? aDTO(d as IPerfil) : null;
  },
  async crear(dto: PerfilCrearDTO): Promise<PerfilRespuestaDTO> {
    const doc = await PerfilModel.create({
      idPerfil: dto.idPerfil,
      nomPerfil: dto.nomPerfil,
    });
    return aDTO(doc.toObject() as IPerfil);
  },
  async actualizar(
    idPerfil: string,
    dto: Partial<Pick<PerfilCrearDTO, 'nomPerfil'>>
  ): Promise<PerfilRespuestaDTO | null> {
    const d = await PerfilModel.findOneAndUpdate(
      { idPerfil },
      { $set: { ...dto } },
      { new: true, runValidators: true }
    ).lean();
    return d ? aDTO(d as IPerfil) : null;
  },
  async eliminar(idPerfil: string): Promise<boolean> {
    const r = await PerfilModel.deleteOne({ idPerfil });
    return r.deletedCount > 0;
  },
};
