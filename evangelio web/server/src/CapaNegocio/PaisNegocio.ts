import { PaisModel, type IPais } from '../capaConexion/Modelos.js';
import type { PaisCrearDTO, PaisRespuestaDTO } from '../CapaDTO/PaisDTO.js';

function aDTO(d: IPais): PaisRespuestaDTO {
  return { idPais: d.idPais, nomPais: d.nomPais, codigoPais: d.codigoPais };
}

export const PaisNegocio = {
  async listar(): Promise<PaisRespuestaDTO[]> {
    const list = await PaisModel.find().lean();
    return list.map((d) => aDTO(d as IPais));
  },
  async obtener(idPais: string): Promise<PaisRespuestaDTO | null> {
    const d = await PaisModel.findOne({ idPais }).lean();
    return d ? aDTO(d as IPais) : null;
  },
  async crear(dto: PaisCrearDTO): Promise<PaisRespuestaDTO> {
    const doc = await PaisModel.create({
      idPais: dto.idPais,
      nomPais: dto.nomPais,
      codigoPais: dto.codigoPais,
    });
    return aDTO(doc.toObject() as IPais);
  },
  async actualizar(
    idPais: string,
    partial: Partial<Pick<PaisCrearDTO, 'nomPais' | 'codigoPais'>>
  ): Promise<PaisRespuestaDTO | null> {
    const d = await PaisModel.findOneAndUpdate(
      { idPais },
      { $set: { ...partial } },
      { new: true, runValidators: true }
    ).lean();
    return d ? aDTO(d as IPais) : null;
  },
  async eliminar(idPais: string): Promise<boolean> {
    const r = await PaisModel.deleteOne({ idPais });
    return r.deletedCount > 0;
  },
};
