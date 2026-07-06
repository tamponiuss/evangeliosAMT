import { MiradaEspiritualModel, type IMiradaEspiritual } from '../capaConexion/Modelos.js';
import type { MiradaEspiritualCrearDTO, MiradaEspiritualRespuestaDTO } from '../CapaDTO/MiradaEspiritualDTO.js';

function aDTO(d: IMiradaEspiritual): MiradaEspiritualRespuestaDTO {
  return {
    idMirada: d.idMirada,
    nomMirada: d.nomMirada,
    descripcion: d.descripcion,
    activo: d.activo !== false,
  };
}

export const MiradaEspiritualNegocio = {
  async listar(soloActivos = false): Promise<MiradaEspiritualRespuestaDTO[]> {
    const filtro = soloActivos ? { activo: { $ne: false } } : {};
    const list = await MiradaEspiritualModel.find(filtro).sort({ nomMirada: 1 }).lean();
    return list.map((d) => aDTO(d as IMiradaEspiritual));
  },
  async obtener(idMirada: string): Promise<MiradaEspiritualRespuestaDTO | null> {
    const d = await MiradaEspiritualModel.findOne({ idMirada }).lean();
    return d ? aDTO(d as IMiradaEspiritual) : null;
  },
  async crear(dto: MiradaEspiritualCrearDTO): Promise<MiradaEspiritualRespuestaDTO> {
    const doc = await MiradaEspiritualModel.create({
      idMirada: dto.idMirada.trim(),
      nomMirada: dto.nomMirada.trim(),
      descripcion: dto.descripcion.trim(),
      activo: dto.activo !== false,
    });
    return aDTO(doc.toObject() as IMiradaEspiritual);
  },
  async actualizar(
    idMirada: string,
    partial: Partial<Omit<MiradaEspiritualCrearDTO, 'idMirada'>>
  ): Promise<MiradaEspiritualRespuestaDTO | null> {
    const d = await MiradaEspiritualModel.findOneAndUpdate(
      { idMirada },
      { $set: { ...partial } },
      { new: true, runValidators: true }
    ).lean();
    return d ? aDTO(d as IMiradaEspiritual) : null;
  },
  async eliminar(idMirada: string): Promise<boolean> {
    const r = await MiradaEspiritualModel.deleteOne({ idMirada });
    return r.deletedCount > 0;
  },
};
