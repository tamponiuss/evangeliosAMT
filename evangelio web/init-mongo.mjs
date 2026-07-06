import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const uri = 'mongodb://127.0.0.1:27017/';
const dbName = 'evangelios';

const perfilSchema = new mongoose.Schema(
  {
    idPerfil: { type: String, required: true, unique: true, index: true },
    nomPerfil: { type: String, required: true, trim: true },
  },
  { collection: 'perfil' }
);

const usuarioSchema = new mongoose.Schema(
  {
    idusuario: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    clave: { type: String, required: true },
    fechaCreacion: { type: Date, default: () => new Date() },
    idperfil: { type: String, required: true },
  },
  { collection: 'usuario' }
);

const paisSchema = new mongoose.Schema(
  {
    idPais: { type: String, required: true, unique: true, index: true },
    nomPais: { type: String, required: true, trim: true },
    codigoPais: { type: String, required: true, unique: true, index: true, trim: true },
  },
  { collection: 'pais' }
);

const fielSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    clave: { type: String, required: true },
    numCelular: { type: String, default: '' },
    idPerfil: { type: String, required: true },
    porEmail: { type: Boolean, default: false },
    porAPP: { type: Boolean, default: false },
    porWSP: { type: Boolean, default: false },
    porInstagram: { type: Boolean, default: false },
    cuentaInstagram: { type: String, default: '' },
    horaEnvio: { type: String, default: '' },
  },
  { collection: 'fiel' }
);

const Perfil = mongoose.model('Perfil', perfilSchema);
const Usuario = mongoose.model('Usuario', usuarioSchema);
const Pais = mongoose.model('Pais', paisSchema);
const Fiel = mongoose.model('Fiel', fielSchema);

async function initMongo() {
  await mongoose.connect(uri, { dbName });

  await Perfil.createIndexes();
  await Usuario.createIndexes();
  await Pais.createIndexes();
  await Fiel.createIndexes();

  await Perfil.findOneAndUpdate(
    { idPerfil: 'perfil-admin-001' },
    { $set: { idPerfil: 'perfil-admin-001', nomPerfil: 'admin' } },
    { upsert: true, new: true }
  );
  await Perfil.findOneAndUpdate(
    { idPerfil: 'perfil-fiel' },
    { $set: { idPerfil: 'perfil-fiel', nomPerfil: 'fiel' } },
    { upsert: true, new: true }
  );

  const hash = await bcrypt.hash('evangelio', 10);
  await Usuario.findOneAndUpdate(
    { idusuario: 'admin' },
    {
      $set: { clave: hash, idperfil: 'perfil-admin-001', fechaCreacion: new Date() },
      $setOnInsert: { idusuario: 'admin' },
    },
    { upsert: true, new: true }
  );

  if ((await Pais.countDocuments()) === 0) {
    await Pais.create([
      { idPais: 'pais-1', nomPais: 'Colombia', codigoPais: 'CO' },
      { idPais: 'pais-2', nomPais: 'Ecuador', codigoPais: 'EC' },
    ]);
  }

  const counts = {
    perfil: await Perfil.countDocuments(),
    usuario: await Usuario.countDocuments(),
    pais: await Pais.countDocuments(),
    fiel: await Fiel.countDocuments(),
  };
  console.log('Mongo inicializado:', counts);
}

initMongo()
  .catch((e) => {
    console.error('Error inicializando Mongo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
