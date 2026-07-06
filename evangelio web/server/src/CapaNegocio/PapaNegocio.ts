import { PapaModel, type IPapa } from '../capaConexion/Modelos.js';
import type { PapaCrearDTO, PapaRespuestaDTO } from '../CapaDTO/PapaDTO.js';

function aDTO(d: IPapa): PapaRespuestaDTO {
  return {
    idPapa: d.idPapa,
    nomPapa: d.nomPapa,
    pontificado: d.pontificado,
    queRepresenta: d.queRepresenta,
    cuandoElegirlo: d.cuandoElegirlo,
    activo: d.activo !== false,
  };
}

export const PapaNegocio = {
  async listar(soloActivos = false): Promise<PapaRespuestaDTO[]> {
    const filtro = soloActivos ? { activo: { $ne: false } } : {};
    const list = await PapaModel.find(filtro).sort({ nomPapa: 1 }).lean();
    return list.map((d) => aDTO(d as IPapa));
  },
  async obtener(idPapa: string): Promise<PapaRespuestaDTO | null> {
    const d = await PapaModel.findOne({ idPapa }).lean();
    return d ? aDTO(d as IPapa) : null;
  },
  async crear(dto: PapaCrearDTO): Promise<PapaRespuestaDTO> {
    const doc = await PapaModel.create({
      idPapa: dto.idPapa.trim(),
      nomPapa: dto.nomPapa.trim(),
      pontificado: dto.pontificado.trim(),
      queRepresenta: dto.queRepresenta.trim(),
      cuandoElegirlo: dto.cuandoElegirlo.trim(),
      activo: dto.activo !== false,
    });
    return aDTO(doc.toObject() as IPapa);
  },
  async actualizar(
    idPapa: string,
    partial: Partial<Omit<PapaCrearDTO, 'idPapa'>>
  ): Promise<PapaRespuestaDTO | null> {
    const d = await PapaModel.findOneAndUpdate(
      { idPapa },
      { $set: { ...partial } },
      { new: true, runValidators: true }
    ).lean();
    return d ? aDTO(d as IPapa) : null;
  },
  async eliminar(idPapa: string): Promise<boolean> {
    const r = await PapaModel.deleteOne({ idPapa });
    return r.deletedCount > 0;
  },
};
