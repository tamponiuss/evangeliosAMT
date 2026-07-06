import { FielModel } from '../capaConexion/Modelos.js';
import {
  ID_MIRADA_NINGUNA,
  type CatalogosEspiritualesDTO,
  type ContextoPersonalizacionDTO,
  type FiltrosEspiritualesDTO,
} from '../CapaDTO/FiltrosEspiritualesDTO.js';
import { CongregacionNegocio } from './CongregacionNegocio.js';
import { EvangelioNegocio, firmaContexto } from './EvangelioNegocio.js';
import { FielNegocio } from './FielNegocio.js';
import { MiradaEspiritualNegocio } from './MiradaEspiritualNegocio.js';
import { PapaNegocio } from './PapaNegocio.js';
import { esPerfilPlus } from './perfilesFiel.js';

const MIN_CONGREGACIONES = 1;
const MAX_CONGREGACIONES = 3;

function err400(msg: string): never {
  const e: Error & { status?: number } = new Error(msg);
  e.status = 400;
  throw e;
}

function err403(msg: string): never {
  const e: Error & { status?: number } = new Error(msg);
  e.status = 403;
  throw e;
}

async function asegurarPerfilPlus(email: string) {
  const fiel = await FielModel.findOne({ email: email.toLowerCase() }).lean();
  if (!fiel) err400('Usuario no encontrado');
  if (!esPerfilPlus(fiel.idPerfil)) {
    err403('Los filtros espirituales están disponibles solo para usuarios con perfil plus.');
  }
  return fiel;
}

export const FiltrosEspiritualesNegocio = {
  async catalogos(): Promise<CatalogosEspiritualesDTO> {
    const [papas, congregaciones, miradas] = await Promise.all([
      PapaNegocio.listar(true),
      CongregacionNegocio.listar(true),
      MiradaEspiritualNegocio.listar(true),
    ]);
    return { papas, congregaciones, miradas };
  },

  async obtener(email: string): Promise<FiltrosEspiritualesDTO> {
    await asegurarPerfilPlus(email);
    const f = await FielNegocio.obtener(email);
    if (!f) err400('Usuario no encontrado');
    return {
      idPapa: f.idPapa || '',
      congregaciones: f.congregaciones || [],
      idMirada: f.idMirada || '',
      filtrosConfigurados: Boolean(f.filtrosConfigurados),
    };
  },

  async guardar(
    email: string,
    dto: { idPapa?: string; congregaciones?: string[]; idMirada?: string }
  ) {
    await asegurarPerfilPlus(email);
    const idPapa = String(dto.idPapa ?? '').trim();
    const congregaciones = Array.isArray(dto.congregaciones)
      ? [...new Set(dto.congregaciones.map((c) => String(c).trim()).filter(Boolean))]
      : [];
    const idMirada = String(dto.idMirada ?? '').trim();

    if (idPapa) {
      const papa = await PapaNegocio.obtener(idPapa);
      if (!papa || !papa.activo) err400('Papa no válido');
    }

    if (congregaciones.length < MIN_CONGREGACIONES || congregaciones.length > MAX_CONGREGACIONES) {
      err400(`Debes elegir entre ${MIN_CONGREGACIONES} y ${MAX_CONGREGACIONES} congregaciones.`);
    }
    for (const id of congregaciones) {
      const cong = await CongregacionNegocio.obtener(id);
      if (!cong || !cong.activo) err400(`Congregación no válida: ${id}`);
    }

    if (!idMirada) err400('Debes elegir una mirada espiritual.');
    const mirada = await MiradaEspiritualNegocio.obtener(idMirada);
    if (!mirada || !mirada.activo) err400('Mirada espiritual no válida');

    const actualizado = await FielNegocio.actualizar(email, {
      idPapa,
      congregaciones,
      idMirada,
      filtrosConfigurados: true,
    });
    if (!actualizado) err400('No se pudo guardar la configuración');

    // Al guardar, regenera de inmediato las reflexiones/preguntas del día con la nueva
    // configuración para que reflejen los cambios en la app y en los envíos.
    try {
      const contexto = await this.contextoParaFiel(email);
      if (contexto) {
        await EvangelioNegocio.obtenerPorFecha(
          undefined,
          contexto,
          { email, firmaConfig: firmaContexto(contexto) },
          { forzarRegenerar: true },
        );
      }
    } catch (e) {
      // No bloquea el guardado: si falla la generación, se regenerará al abrir la app.
      console.warn('[FiltrosEspirituales] No se pudo regenerar reflexiones al guardar:', (e as Error).message);
    }

    return actualizado;
  },

  async contextoParaFiel(email: string): Promise<ContextoPersonalizacionDTO | null> {
    const f = await FielNegocio.obtener(email);
    if (!f || !esPerfilPlus(f.idPerfil) || !f.filtrosConfigurados) return null;

    const idPapa = (f.idPapa || '').trim();
    const idMirada = (f.idMirada || '').trim();
    const idsCong = f.congregaciones || [];

    const [papa, miradaRaw, ...congs] = await Promise.all([
      idPapa ? PapaNegocio.obtener(idPapa) : Promise.resolve(null),
      idMirada ? MiradaEspiritualNegocio.obtener(idMirada) : Promise.resolve(null),
      ...idsCong.map((id) => CongregacionNegocio.obtener(id)),
    ]);

    const congregaciones = congs.filter(Boolean) as NonNullable<(typeof congs)[number]>[];
    if (congregaciones.length === 0 || !miradaRaw) return null;

    const miradaParaTexto =
      miradaRaw.activo && miradaRaw.idMirada !== ID_MIRADA_NINGUNA ? miradaRaw : null;

    return {
      papa: papa && papa.activo ? papa : null,
      congregaciones,
      mirada: miradaParaTexto,
      idPapaElegido: idPapa,
      idMiradaElegida: idMirada,
    };
  },
};
