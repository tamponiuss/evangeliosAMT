import crypto from 'node:crypto';
import { PagoPlusModel, ParametroModel, type IParametro, type IPagoPlus } from '../capaConexion/Modelos.js';
import type {
  PagoPlusHistorialDTO,
  ParametroActualizarDTO,
  ParametroRespuestaDTO,
  TarifaPlusPublicaDTO,
} from '../CapaDTO/PlusDTO.js';
import { ID_PARAMETRO_TARIFA_PLUS } from '../CapaDTO/PlusDTO.js';
import type { FielRespuestaDTO } from '../CapaDTO/FielDTO.js';
import { FielNegocio } from './FielNegocio.js';
import { ID_PERFIL_FIEL_PLUS, esPerfilPlus } from './perfilesFiel.js';

function err400(msg: string): never {
  const e: Error & { status?: number } = new Error(msg);
  e.status = 400;
  throw e;
}

function err409(msg: string): never {
  const e: Error & { status?: number } = new Error(msg);
  e.status = 409;
  throw e;
}

function aParametroDTO(d: IParametro): ParametroRespuestaDTO {
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

function aPagoDTO(d: IPagoPlus): PagoPlusHistorialDTO {
  return {
    idPago: d.idPago,
    email: d.email,
    monto: d.monto,
    moneda: d.moneda,
    referencia: d.referencia,
    estado: d.estado,
    fechaPago: d.fechaPago?.toISOString?.() ?? new Date().toISOString(),
  };
}

export const PlusNegocio = {
  async obtenerTarifaPlus(): Promise<IParametro | null> {
    return ParametroModel.findOne({ idParametro: ID_PARAMETRO_TARIFA_PLUS }).lean() as Promise<IParametro | null>;
  },

  async tarifaPublica(): Promise<TarifaPlusPublicaDTO> {
    const t = await this.obtenerTarifaPlus();
    if (!t) {
      return {
        monto: 0,
        moneda: 'USD',
        descripcion: 'Suscripción Plus no configurada',
        periodo: 'mensual',
        activo: false,
      };
    }
    return {
      monto: t.monto,
      moneda: t.moneda,
      descripcion: t.descripcion,
      periodo: t.periodo,
      activo: t.activo !== false,
    };
  },

  async obtenerParametroAdmin(): Promise<ParametroRespuestaDTO | null> {
    const t = await this.obtenerTarifaPlus();
    return t ? aParametroDTO(t) : null;
  },

  async actualizarTarifaPlus(dto: ParametroActualizarDTO): Promise<ParametroRespuestaDTO> {
    if (dto.monto !== undefined && (typeof dto.monto !== 'number' || dto.monto < 0)) {
      err400('El monto debe ser un número mayor o igual a 0');
    }
    const doc = await ParametroModel.findOneAndUpdate(
      { idParametro: ID_PARAMETRO_TARIFA_PLUS },
      {
        $set: {
          ...dto,
          actualizadoEn: new Date(),
        },
        $setOnInsert: {
          idParametro: ID_PARAMETRO_TARIFA_PLUS,
          monto: dto.monto ?? 4.99,
          moneda: dto.moneda ?? 'USD',
          descripcion: dto.descripcion ?? 'Acceso a filtros espirituales personalizados',
          periodo: dto.periodo ?? 'mensual',
          activo: dto.activo !== false,
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).lean();
    return aParametroDTO(doc as IParametro);
  },

  async listarPagos(): Promise<PagoPlusHistorialDTO[]> {
    const list = await PagoPlusModel.find().sort({ fechaPago: -1 }).lean();
    return list.map((d) => aPagoDTO(d as IPagoPlus));
  },

  async procesarPagoPlus(email: string, referenciaExterna?: string): Promise<{ referencia: string; usuario: FielRespuestaDTO }> {
    const emailNorm = email.toLowerCase().trim();
    const fiel = await FielNegocio.obtener(emailNorm);
    if (!fiel) err400('Usuario no encontrado');
    if (esPerfilPlus(fiel.idPerfil)) err409('Ya tienes suscripción Plus activa.');

    const tarifa = await this.obtenerTarifaPlus();
    if (!tarifa || tarifa.activo === false) {
      err400('La suscripción Plus no está disponible en este momento.');
    }
    if (tarifa.monto <= 0) {
      err400('La tarifa Plus no está configurada correctamente.');
    }

    const referencia =
      String(referenciaExterna ?? '').trim() ||
      `PLUS-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const idPago = `pago-${crypto.randomUUID()}`;
    await PagoPlusModel.create({
      idPago,
      email: emailNorm,
      monto: tarifa.monto,
      moneda: tarifa.moneda,
      referencia,
      estado: 'completado',
      fechaPago: new Date(),
    });

    const usuario = await FielNegocio.actualizar(emailNorm, {
      idPerfil: ID_PERFIL_FIEL_PLUS,
      plusReferenciaPago: referencia,
      plusPagadoEn: new Date(),
    });
    if (!usuario) err400('No se pudo activar la suscripción Plus');

    return { referencia, usuario };
  },
};
