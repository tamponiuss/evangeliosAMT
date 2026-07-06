import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { conectarMongoDB } from './capaConexion/ConexionMongo.js';
import {
  CongregacionModel,
  MiradaEspiritualModel,
  PapaModel,
  ParametroModel,
  PaisModel,
  PerfilModel,
  UsuarioModel,
} from './capaConexion/Modelos.js';
import { ID_PARAMETRO_TARIFA_PLUS } from './CapaDTO/PlusDTO.js';
import { ID_PERFIL_FIEL, ID_PERFIL_FIEL_PLUS } from './CapaNegocio/perfilesFiel.js';
import { config } from './config.js';
import { SEED_CONGREGACIONES, SEED_MIRADAS, SEED_PAPAS } from './seedCatalogos.js';

const ID_PERFIL_ADMIN = 'perfil-admin-001';
const NOM_PERFIL_ADMIN = 'admin';
const NOM_PERFIL_FIEL = 'fiel';
const NOM_PERFIL_FIEL_PLUS = 'plus';

async function seed() {
  console.log('Conectando a', config.mongoDatabase);
  await conectarMongoDB();

  await PerfilModel.findOneAndUpdate(
    { idPerfil: ID_PERFIL_ADMIN },
    { $set: { idPerfil: ID_PERFIL_ADMIN, nomPerfil: NOM_PERFIL_ADMIN } },
    { upsert: true, new: true }
  );
  const perfil = await PerfilModel.findOne({ idPerfil: ID_PERFIL_ADMIN });
  if (!perfil) throw new Error('No se pudo crear perfil admin');
  console.log('Perfil admin listo:', perfil.idPerfil);

  await PerfilModel.findOneAndUpdate(
    { idPerfil: ID_PERFIL_FIEL },
    { $set: { idPerfil: ID_PERFIL_FIEL, nomPerfil: NOM_PERFIL_FIEL } },
    { upsert: true, new: true }
  );
  console.log('Perfil fiel (básico) listo:', ID_PERFIL_FIEL);

  await PerfilModel.findOneAndUpdate(
    { idPerfil: ID_PERFIL_FIEL_PLUS },
    { $set: { idPerfil: ID_PERFIL_FIEL_PLUS, nomPerfil: NOM_PERFIL_FIEL_PLUS } },
    { upsert: true, new: true }
  );
  console.log('Perfil fiel plus listo:', ID_PERFIL_FIEL_PLUS);

  const hash = await bcrypt.hash('evangelio', 10);
  await UsuarioModel.findOneAndUpdate(
    { idusuario: 'admin' },
    {
      $set: { clave: hash, idperfil: ID_PERFIL_ADMIN, fechaCreacion: new Date() },
      $setOnInsert: { idusuario: 'admin' },
    },
    { upsert: true, new: true }
  );
  console.log("Usuario 'admin' / 'evangelio' listo (clave hasheada).");

  if ((await PaisModel.countDocuments()) === 0) {
    await PaisModel.create([
      { idPais: 'pais-1', nomPais: 'Colombia', codigoPais: 'CO' },
      { idPais: 'pais-2', nomPais: 'Ecuador', codigoPais: 'EC' },
    ]);
    console.log('Países de ejemplo insertados.');
  }

  for (const p of SEED_PAPAS) {
    await PapaModel.findOneAndUpdate(
      { idPapa: p.idPapa },
      { $set: { ...p, activo: true } },
      { upsert: true, new: true }
    );
  }
  console.log(`Catálogo papas: ${SEED_PAPAS.length} registros.`);

  for (const c of SEED_CONGREGACIONES) {
    await CongregacionModel.findOneAndUpdate(
      { idCongregacion: c.idCongregacion },
      { $set: { ...c, activo: true } },
      { upsert: true, new: true }
    );
  }
  console.log(`Catálogo congregaciones: ${SEED_CONGREGACIONES.length} registros.`);

  for (const m of SEED_MIRADAS) {
    await MiradaEspiritualModel.findOneAndUpdate(
      { idMirada: m.idMirada },
      { $set: { ...m, activo: true } },
      { upsert: true, new: true }
    );
  }
  console.log(`Catálogo miradas espirituales: ${SEED_MIRADAS.length} registros.`);

  await ParametroModel.findOneAndUpdate(
    { idParametro: ID_PARAMETRO_TARIFA_PLUS },
    {
      $set: {
        idParametro: ID_PARAMETRO_TARIFA_PLUS,
        monto: 4.99,
        moneda: 'USD',
        descripcion: 'Suscripción Plus: reflexiones personalizadas con Papa, congregaciones y mirada espiritual.',
        periodo: 'mensual',
        activo: true,
        actualizadoEn: new Date(),
      },
    },
    { upsert: true, new: true }
  );
  console.log('Tarifa Plus (parametro tarifa-plus) lista.');

  console.log('Seed finalizado.');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
