import { CongregacionModel, type ICongregacion } from '../capaConexion/Modelos.js';
import type { CongregacionCrearDTO, CongregacionRespuestaDTO } from '../CapaDTO/CongregacionDTO.js';

function aDTO(d: ICongregacion): CongregacionRespuestaDTO {
  return {
    idCongregacion: d.idCongregacion,
    nomCongregacion: d.nomCongregacion,
    enfoqueEditorial: d.enfoqueEditorial,
    activo: d.activo !== false,
  };
}

export const CongregacionNegocio = {
  async listar(soloActivos = false): Promise<CongregacionRespuestaDTO[]> {
    const filtro = soloActivos ? { activo: { $ne: false } } : {};
    const list = await CongregacionModel.find(filtro).sort({ nomCongregacion: 1 }).lean();
    return list.map((d) => aDTO(d as ICongregacion));
  },
  async obtener(idCongregacion: string): Promise<CongregacionRespuestaDTO | null> {
    const d = await CongregacionModel.findOne({ idCongregacion }).lean();
    return d ? aDTO(d as ICongregacion) : null;
  },
  async crear(dto: CongregacionCrearDTO): Promise<CongregacionRespuestaDTO> {
    const doc = await CongregacionModel.create({
      idCongregacion: dto.idCongregacion.trim(),
      nomCongregacion: dto.nomCongregacion.trim(),
      enfoqueEditorial: dto.enfoqueEditorial.trim(),
      activo: dto.activo !== false,
    });
    return aDTO(doc.toObject() as ICongregacion);
  },
  async actualizar(
    idCongregacion: string,
    partial: Partial<Omit<CongregacionCrearDTO, 'idCongregacion'>>
  ): Promise<CongregacionRespuestaDTO | null> {
    const d = await CongregacionModel.findOneAndUpdate(
      { idCongregacion },
      { $set: { ...partial } },
      { new: true, runValidators: true }
    ).lean();
    return d ? aDTO(d as ICongregacion) : null;
  },
  async eliminar(idCongregacion: string): Promise<boolean> {
    const r = await CongregacionModel.deleteOne({ idCongregacion });
    return r.deletedCount > 0;
  },
};
