import { ParametroModel, type IParametro } from '../capaConexion/Modelos.js';
import type { ParametroActualizarDTO, ParametroCrearDTO, ParametroRespuestaDTO } from '../CapaDTO/PlusDTO.js';

function aDTO(d: IParametro): ParametroRespuestaDTO {
  return {
    idParametro: d.idParametro,
    monto: d.monto,
    moneda: d.moneda,
    descripcion: d.descripcion,
    periodo: d.periodo,
    activo: d.activo !== false,
    actualizadoEn: d.actualizadoEn?.toISOString?.() ?? new Date().toISOString(),
  };
}

export const ParametroNegocio = {
  async listar(): Promise<ParametroRespuestaDTO[]> {
    const list = await ParametroModel.find().sort({ idParametro: 1 }).lean();
    return list.map((d) => aDTO(d as IParametro));
  },
  async obtener(idParametro: string): Promise<ParametroRespuestaDTO | null> {
    const d = await ParametroModel.findOne({ idParametro }).lean();
    return d ? aDTO(d as IParametro) : null;
  },
  async crear(dto: ParametroCrearDTO): Promise<ParametroRespuestaDTO> {
    const doc = await ParametroModel.create({
      idParametro: dto.idParametro.trim(),
      monto: dto.monto,
      moneda: dto.moneda.trim(),
      descripcion: dto.descripcion.trim(),
      periodo: dto.periodo.trim(),
      activo: dto.activo !== false,
      actualizadoEn: new Date(),
    });
    return aDTO(doc.toObject() as IParametro);
  },
  async actualizar(idParametro: string, partial: ParametroActualizarDTO): Promise<ParametroRespuestaDTO | null> {
    const d = await ParametroModel.findOneAndUpdate(
      { idParametro },
      { $set: { ...partial, actualizadoEn: new Date() } },
      { new: true, runValidators: true }
    ).lean();
    return d ? aDTO(d as IParametro) : null;
  },
  async eliminar(idParametro: string): Promise<boolean> {
    const r = await ParametroModel.deleteOne({ idParametro });
    return r.deletedCount > 0;
  },
};
