import bcrypt from 'bcryptjs';
import { PerfilModel, UsuarioModel, type IUsuario } from '../capaConexion/Modelos.js';
import type { UsuarioCrearDTO, UsuarioRespuestaDTO } from '../CapaDTO/UsuarioDTO.js';

function aDTO(doc: IUsuario, nomPerfil?: string): UsuarioRespuestaDTO {
  return {
    idusuario: doc.idusuario,
    fechaCreacion: doc.fechaCreacion.toISOString(),
    idperfil: doc.idperfil,
    nomPerfil,
  };
}

export const UsuarioNegocio = {
  async listar(): Promise<UsuarioRespuestaDTO[]> {
    const list = await UsuarioModel.find().lean();
    const out: UsuarioRespuestaDTO[] = [];
    for (const d of list) {
      const u = d as IUsuario;
      const p = await PerfilModel.findOne({ idPerfil: u.idperfil }).lean();
      out.push(aDTO(u, p ? (p as { nomPerfil: string }).nomPerfil : undefined));
    }
    return out;
  },
  async obtener(idusuario: string): Promise<UsuarioRespuestaDTO | null> {
    const d = await UsuarioModel.findOne({ idusuario: idusuario.toLowerCase() }).lean();
    if (!d) return null;
    const u = d as IUsuario;
    const p = await PerfilModel.findOne({ idPerfil: u.idperfil }).lean();
    return aDTO(u, p ? (p as { nomPerfil: string }).nomPerfil : undefined);
  },
  async crear(dto: UsuarioCrearDTO): Promise<UsuarioRespuestaDTO> {
    const p = await PerfilModel.findOne({ idPerfil: dto.idperfil });
    if (!p) throw new Error('Perfil no encontrado');
    const hash = await bcrypt.hash(dto.clave, 10);
    const doc = await UsuarioModel.create({
      idusuario: dto.idusuario.toLowerCase().trim(),
      clave: hash,
      idperfil: dto.idperfil,
      fechaCreacion: new Date(),
    });
    return aDTO(doc.toObject() as IUsuario, p.nomPerfil);
  },
  async actualizar(
    idusuario: string,
    data: { clave?: string; idperfil: string }
  ): Promise<UsuarioRespuestaDTO | null> {
    const p = await PerfilModel.findOne({ idPerfil: data.idperfil });
    if (!p) throw new Error('Perfil no encontrado');
    const set: Partial<IUsuario> = { idperfil: data.idperfil };
    if (data.clave && data.clave.length) {
      set.clave = await bcrypt.hash(data.clave, 10);
    }
    const d = await UsuarioModel.findOneAndUpdate(
      { idusuario: idusuario.toLowerCase() },
      { $set: set },
      { new: true, runValidators: true }
    ).lean();
    if (!d) return null;
    return aDTO(d as IUsuario, p.nomPerfil);
  },
  async eliminar(idusuario: string): Promise<boolean> {
    const r = await UsuarioModel.deleteOne({ idusuario: idusuario.toLowerCase() });
    return r.deletedCount > 0;
  },
  async verificarClave(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  },
  async obtenerConClave(
    idusuario: string
  ): Promise<IUsuario & { clave: string } | null> {
    const d = await UsuarioModel.findOne({ idusuario: idusuario.toLowerCase() }).lean();
    return d ? (d as IUsuario & { clave: string }) : null;
  },
};
