import bcrypt from 'bcryptjs';
import { FielModel, type IFiel } from '../capaConexion/Modelos.js';
import type { FielCrearDTO, FielRespuestaDTO } from '../CapaDTO/FielDTO.js';
import { config } from '../config.js';

function normalizarHoraEnvio(valor: string | undefined): string {
  if (valor === undefined) return '';
  const h = String(valor).trim();
  if (!h) return '';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(h)) {
    throw new Error('horaEnvio debe tener formato HH:mm (24 horas)');
  }
  return h;
}

function aDTO(d: IFiel): FielRespuestaDTO {
  return {
    email: d.email,
    idPerfil: d.idPerfil,
    numCelular: d.numCelular || '',
    porEmail: Boolean(d.porEmail),
    porAPP: d.porAPP !== false,
    porWSP: Boolean(d.porWSP),
    porInstagram: Boolean(d.porInstagram),
    cuentaInstagram: d.cuentaInstagram || '',
    horaEnvio: d.horaEnvio || '',
    idPapa: d.idPapa || '',
    congregaciones: d.congregaciones || [],
    idMirada: d.idMirada || '',
    filtrosConfigurados: Boolean(d.filtrosConfigurados),
    plusPagadoEn: d.plusPagadoEn ? d.plusPagadoEn.toISOString() : '',
    plusReferenciaPago: d.plusReferenciaPago || '',
  };
}

export const FielNegocio = {
  toPublicDTO: aDTO,

  async listar(): Promise<FielRespuestaDTO[]> {
    const list = await FielModel.find().lean();
    return list.map((d) => aDTO(d as IFiel));
  },
  async obtener(email: string): Promise<FielRespuestaDTO | null> {
    const d = await FielModel.findOne({ email: email.toLowerCase() }).lean();
    return d ? aDTO(d as IFiel) : null;
  },
  async obtenerConClave(email: string): Promise<IFiel | null> {
    const d = await FielModel.findOne({ email: email.toLowerCase() }).lean();
    return d as IFiel | null;
  },
  async verificarClave(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  },
  async crear(dto: FielCrearDTO): Promise<FielRespuestaDTO> {
    const hash = await bcrypt.hash(dto.clave, 10);
    const doc = await FielModel.create({
      email: dto.email.toLowerCase().trim(),
      clave: hash,
      idPerfil: dto.idPerfil,
      numCelular: '',
      porEmail: false,
      porAPP: true,
      porWSP: false,
      porInstagram: false,
      cuentaInstagram: '',
      horaEnvio: '',
      idPapa: '',
      congregaciones: [],
      idMirada: '',
      filtrosConfigurados: false,
    });
    return aDTO(doc.toObject() as IFiel);
  },
  async actualizar(
    email: string,
    dto: {
      clave?: string;
      idPerfil?: string;
      nuevoEmail?: string;
      numCelular?: string;
      porEmail?: boolean;
      porAPP?: boolean;
      porWSP?: boolean;
      porInstagram?: boolean;
      cuentaInstagram?: string;
      horaEnvio?: string;
      idPapa?: string;
      congregaciones?: string[];
      idMirada?: string;
      filtrosConfigurados?: boolean;
      plusPagadoEn?: Date;
      plusReferenciaPago?: string;
    }
  ): Promise<FielRespuestaDTO | null> {
    const e = email.toLowerCase();
    const set: Record<string, unknown> = {};
    if (dto.idPerfil !== undefined) set.idPerfil = dto.idPerfil;
    if (dto.numCelular !== undefined) set.numCelular = String(dto.numCelular).trim();
    if (dto.porEmail !== undefined) set.porEmail = Boolean(dto.porEmail);
    if (dto.porAPP !== undefined) set.porAPP = Boolean(dto.porAPP);
    if (dto.porWSP !== undefined) set.porWSP = Boolean(dto.porWSP);
    if (dto.porInstagram !== undefined) set.porInstagram = Boolean(dto.porInstagram);
    if (dto.cuentaInstagram !== undefined) set.cuentaInstagram = String(dto.cuentaInstagram).trim();
    if (dto.horaEnvio !== undefined) set.horaEnvio = normalizarHoraEnvio(dto.horaEnvio);
    // Si activa email sin hora, asignar hora por defecto del servidor.
    if (set.porEmail === true && (set.horaEnvio === undefined || set.horaEnvio === '')) {
      const actual = await FielModel.findOne({ email: e }).lean();
      const horaActual = set.horaEnvio !== undefined ? String(set.horaEnvio) : (actual?.horaEnvio || '');
      if (!horaActual) set.horaEnvio = config.envioHoraDefault;
    }
    if (dto.idPapa !== undefined) set.idPapa = dto.idPapa;
    if (dto.congregaciones !== undefined) set.congregaciones = dto.congregaciones;
    if (dto.idMirada !== undefined) set.idMirada = dto.idMirada;
    if (dto.filtrosConfigurados !== undefined) set.filtrosConfigurados = Boolean(dto.filtrosConfigurados);
    if (dto.plusPagadoEn !== undefined) set.plusPagadoEn = dto.plusPagadoEn;
    if (dto.plusReferenciaPago !== undefined) set.plusReferenciaPago = dto.plusReferenciaPago;
    if (dto.nuevoEmail) {
      set.email = String(dto.nuevoEmail).toLowerCase().trim();
    }
    if (dto.clave && String(dto.clave).length) {
      set.clave = await bcrypt.hash(String(dto.clave), 10);
    }
    if (Object.keys(set).length === 0) {
      const d = await FielModel.findOne({ email: e }).lean();
      return d ? aDTO(d as IFiel) : null;
    }
    const d = await FielModel.findOneAndUpdate({ email: e }, { $set: set }, { new: true, runValidators: true }).lean();
    return d ? aDTO(d as IFiel) : null;
  },
  async eliminar(email: string): Promise<boolean> {
    const r = await FielModel.deleteOne({ email: email.toLowerCase() });
    return r.deletedCount > 0;
  },
};
