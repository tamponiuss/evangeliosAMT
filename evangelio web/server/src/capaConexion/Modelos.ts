import mongoose, { Schema, model, type Model } from 'mongoose';

export interface IPerfil {
  idPerfil: string;
  nomPerfil: string;
}

const perfilSchema = new Schema<IPerfil>(
  {
    idPerfil: { type: String, required: true, unique: true, index: true },
    nomPerfil: { type: String, required: true, trim: true },
  },
  { collection: 'perfil' }
);

export interface IUsuario {
  idusuario: string;
  clave: string;
  fechaCreacion: Date;
  idperfil: string;
}

const usuarioSchema = new Schema<IUsuario>(
  {
    idusuario: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    clave: { type: String, required: true },
    fechaCreacion: { type: Date, default: () => new Date() },
    idperfil: { type: String, required: true, ref: 'Perfil' },
  },
  { collection: 'usuario' }
);

export interface IPais {
  idPais: string;
  nomPais: string;
  codigoPais: string;
}

const paisSchema = new Schema<IPais>(
  {
    idPais: { type: String, required: true, unique: true, index: true },
    nomPais: { type: String, required: true, trim: true },
    codigoPais: { type: String, required: true, unique: true, index: true, trim: true },
  },
  { collection: 'pais' }
);

export interface IFiel {
  email: string;
  clave: string;
  idPerfil: string;
  /** Teléfono para WhatsApp (opcional). */
  numCelular?: string;
  /** Canales de entrega del evangelio diario. */
  porEmail?: boolean;
  porAPP?: boolean;
  porWSP?: boolean;
  porInstagram?: boolean;
  cuentaInstagram?: string;
  /** Hora preferida de envío (HH:mm, hora local del usuario). */
  horaEnvio?: string;
  /** Papa elegido (0 o 1). Solo perfil plus. */
  idPapa?: string;
  /** Congregaciones elegidas (1–3). Solo perfil plus. */
  congregaciones?: string[];
  /** Mirada espiritual elegida. Solo perfil plus. */
  idMirada?: string;
  /** Indica si el usuario plus completó la configuración de filtros. */
  filtrosConfigurados?: boolean;
  /** Fecha en que adquirió la suscripción Plus. */
  plusPagadoEn?: Date;
  /** Referencia del pago (interna o pasarela). */
  plusReferenciaPago?: string;
}

export interface IPapa {
  idPapa: string;
  nomPapa: string;
  pontificado: string;
  queRepresenta: string;
  cuandoElegirlo: string;
  activo: boolean;
}

export interface ICongregacion {
  idCongregacion: string;
  nomCongregacion: string;
  enfoqueEditorial: string;
  activo: boolean;
}

export interface IMiradaEspiritual {
  idMirada: string;
  nomMirada: string;
  descripcion: string;
  activo: boolean;
}

/** Parámetros de configuración de la app (p. ej. tarifa Plus). */
export interface IParametro {
  idParametro: string;
  monto: number;
  moneda: string;
  descripcion: string;
  periodo: string;
  activo: boolean;
  actualizadoEn: Date;
}

/** Registro de pago de suscripción Plus. */
export interface IPagoPlus {
  idPago: string;
  email: string;
  monto: number;
  moneda: string;
  referencia: string;
  estado: 'completado' | 'pendiente' | 'fallido';
  fechaPago: Date;
}

const fielSchema = new Schema<IFiel>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    clave: { type: String, required: true },
    idPerfil: { type: String, required: true },
    numCelular: { type: String, default: '' },
    porEmail: { type: Boolean, default: false },
    porAPP: { type: Boolean, default: true },
    porWSP: { type: Boolean, default: false },
    porInstagram: { type: Boolean, default: false },
    cuentaInstagram: { type: String, default: '' },
    horaEnvio: { type: String, default: '' },
    idPapa: { type: String, default: '' },
    congregaciones: { type: [String], default: [] },
    idMirada: { type: String, default: '' },
    filtrosConfigurados: { type: Boolean, default: false },
    plusPagadoEn: { type: Date },
    plusReferenciaPago: { type: String, default: '' },
  },
  { collection: 'fiel' }
);

const parametroSchema = new Schema<IParametro>(
  {
    idParametro: { type: String, required: true, unique: true, index: true },
    monto: { type: Number, required: true, min: 0 },
    moneda: { type: String, required: true, trim: true, default: 'USD' },
    descripcion: { type: String, required: true, trim: true },
    periodo: { type: String, required: true, trim: true, default: 'mensual' },
    activo: { type: Boolean, default: true },
    actualizadoEn: { type: Date, default: () => new Date() },
  },
  { collection: 'parametro' }
);

const pagoPlusSchema = new Schema<IPagoPlus>(
  {
    idPago: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    monto: { type: Number, required: true },
    moneda: { type: String, required: true, trim: true },
    referencia: { type: String, required: true, trim: true },
    estado: { type: String, enum: ['completado', 'pendiente', 'fallido'], default: 'completado' },
    fechaPago: { type: Date, default: () => new Date() },
  },
  { collection: 'pago_plus' }
);

const papaSchema = new Schema<IPapa>(
  {
    idPapa: { type: String, required: true, unique: true, index: true },
    nomPapa: { type: String, required: true, trim: true },
    pontificado: { type: String, required: true, trim: true },
    queRepresenta: { type: String, required: true, trim: true },
    cuandoElegirlo: { type: String, required: true, trim: true },
    activo: { type: Boolean, default: true },
  },
  { collection: 'papa' }
);

const congregacionSchema = new Schema<ICongregacion>(
  {
    idCongregacion: { type: String, required: true, unique: true, index: true },
    nomCongregacion: { type: String, required: true, trim: true },
    enfoqueEditorial: { type: String, required: true, trim: true },
    activo: { type: Boolean, default: true },
  },
  { collection: 'congregacion' }
);

const miradaEspiritualSchema = new Schema<IMiradaEspiritual>(
  {
    idMirada: { type: String, required: true, unique: true, index: true },
    nomMirada: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    activo: { type: Boolean, default: true },
  },
  { collection: 'mirada_espiritual' }
);

/** Evangelio del día en caché (una fila por fecha YYYY-MM-DD). */
export interface IEvangelioDia {
  fecha: string;
  titulo: string;
  contenido: string;
  fuente: string;
  actualizadoEn: Date;
  /** Dos textos de reflexión (p. ej. generados por IA). */
  reflexiones?: string[];
  /** Dos preguntas de reflexión espiritual (IA). */
  preguntasReflexion?: string[];
}

const evangelioDiaSchema = new Schema<IEvangelioDia>(
  {
    fecha: { type: String, required: true, unique: true, index: true, trim: true },
    titulo: { type: String, required: true },
    contenido: { type: String, required: true },
    fuente: { type: String, required: true },
    actualizadoEn: { type: Date, default: () => new Date() },
    reflexiones: { type: [String], default: [] },
    preguntasReflexion: { type: [String], default: [] },
  },
  { collection: 'evangelio_dia' }
);

export const PerfilModel: Model<IPerfil> =
  (mongoose.models['Perfil'] as Model<IPerfil>) || model<IPerfil>('Perfil', perfilSchema);
export const UsuarioModel: Model<IUsuario> =
  (mongoose.models['Usuario'] as Model<IUsuario>) || model<IUsuario>('Usuario', usuarioSchema);
export const PaisModel: Model<IPais> =
  (mongoose.models['Pais'] as Model<IPais>) || model<IPais>('Pais', paisSchema);
export const FielModel: Model<IFiel> =
  (mongoose.models['Fiel'] as Model<IFiel>) || model<IFiel>('Fiel', fielSchema);
export const PapaModel: Model<IPapa> =
  (mongoose.models['Papa'] as Model<IPapa>) || model<IPapa>('Papa', papaSchema);
export const CongregacionModel: Model<ICongregacion> =
  (mongoose.models['Congregacion'] as Model<ICongregacion>) ||
  model<ICongregacion>('Congregacion', congregacionSchema);
export const MiradaEspiritualModel: Model<IMiradaEspiritual> =
  (mongoose.models['MiradaEspiritual'] as Model<IMiradaEspiritual>) ||
  model<IMiradaEspiritual>('MiradaEspiritual', miradaEspiritualSchema);
export const ParametroModel: Model<IParametro> =
  (mongoose.models['Parametro'] as Model<IParametro>) || model<IParametro>('Parametro', parametroSchema);
export const PagoPlusModel: Model<IPagoPlus> =
  (mongoose.models['PagoPlus'] as Model<IPagoPlus>) || model<IPagoPlus>('PagoPlus', pagoPlusSchema);
export const EvangelioDiaModel: Model<IEvangelioDia> =
  (mongoose.models['EvangelioDia'] as Model<IEvangelioDia>) ||
  model<IEvangelioDia>('EvangelioDia', evangelioDiaSchema);

/**
 * Reflexiones y preguntas personalizadas por usuario plus y fecha.
 * Se reutilizan en cada ingreso a la app y se regeneran cuando cambia la configuración (firmaConfig).
 */
export interface IReflexionPersonalizada {
  email: string;
  fecha: string;
  /** Huella de la configuración (idPapa|congregaciones|idMirada) usada al generar. */
  firmaConfig: string;
  reflexiones: string[];
  preguntasReflexion: string[];
  actualizadoEn: Date;
}

const reflexionPersonalizadaSchema = new Schema<IReflexionPersonalizada>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    fecha: { type: String, required: true, trim: true, index: true },
    firmaConfig: { type: String, required: true, default: '' },
    reflexiones: { type: [String], default: [] },
    preguntasReflexion: { type: [String], default: [] },
    actualizadoEn: { type: Date, default: () => new Date() },
  },
  { collection: 'reflexion_personalizada' }
);
reflexionPersonalizadaSchema.index({ email: 1, fecha: 1 }, { unique: true });

export const ReflexionPersonalizadaModel: Model<IReflexionPersonalizada> =
  (mongoose.models['ReflexionPersonalizada'] as Model<IReflexionPersonalizada>) ||
  model<IReflexionPersonalizada>('ReflexionPersonalizada', reflexionPersonalizadaSchema);

/** Código de verificación de registro móvil (un documento por email pendiente). */
export interface IRegistroCodigo {
  email: string;
  codigoHash: string;
  expira: Date;
}

const registroCodigoSchema = new Schema<IRegistroCodigo>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    codigoHash: { type: String, required: true },
    expira: { type: Date, required: true, index: true },
  },
  { collection: 'registro_codigo' }
);

export const RegistroCodigoModel: Model<IRegistroCodigo> =
  (mongoose.models['RegistroCodigo'] as Model<IRegistroCodigo>) ||
  model<IRegistroCodigo>('RegistroCodigo', registroCodigoSchema);

/** Log de envíos diarios del evangelio (evita duplicados por email+fecha+canal). */
export interface IEnvioEvangelio {
  email: string;
  fecha: string;
  canal: 'email' | 'wsp' | 'instagram';
  horaProgramada: string;
  estado: 'enviado' | 'error' | 'omitido';
  error?: string;
  titulo?: string;
  enviadoEn: Date;
}

const envioEvangelioSchema = new Schema<IEnvioEvangelio>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    fecha: { type: String, required: true, trim: true, index: true },
    canal: { type: String, required: true, enum: ['email', 'wsp', 'instagram'], default: 'email' },
    horaProgramada: { type: String, required: true, default: '' },
    estado: { type: String, required: true, enum: ['enviado', 'error', 'omitido'], default: 'enviado' },
    error: { type: String, default: '' },
    titulo: { type: String, default: '' },
    enviadoEn: { type: Date, default: () => new Date() },
  },
  { collection: 'envio_evangelio' }
);
envioEvangelioSchema.index({ email: 1, fecha: 1, canal: 1 }, { unique: true });

export const EnvioEvangelioModel: Model<IEnvioEvangelio> =
  (mongoose.models['EnvioEvangelio'] as Model<IEnvioEvangelio>) ||
  model<IEnvioEvangelio>('EnvioEvangelio', envioEvangelioSchema);

export async function registrarModelos(): Promise<void> {
  await PerfilModel.createIndexes();
  await UsuarioModel.createIndexes();
  await PaisModel.createIndexes();
  await FielModel.createIndexes();
  await PapaModel.createIndexes();
  await CongregacionModel.createIndexes();
  await MiradaEspiritualModel.createIndexes();
  await ParametroModel.createIndexes();
  await PagoPlusModel.createIndexes();
  await EvangelioDiaModel.createIndexes();
  await ReflexionPersonalizadaModel.createIndexes();
  await RegistroCodigoModel.createIndexes();
  await EnvioEvangelioModel.createIndexes();
}
