import dns from 'node:dns';
import mongoose from 'mongoose';
import { config } from '../config.js';
import { registrarModelos } from './Modelos.js';

let conectado = false;

/** En algunos Windows, el resolver por defecto rechaza consultas SRV de mongodb+srv. */
function prepararDnsParaAtlas(): void {
  if (process.platform !== 'win32') return;
  if (!config.mongoUri.startsWith('mongodb+srv://')) return;
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
}

export async function conectarMongoDB(): Promise<void> {
  if (conectado) return;
  try {
    prepararDnsParaAtlas();
    await mongoose.connect(config.mongoUri, { dbName: config.mongoDatabase });
    conectado = true;
    console.log('MongoDB conectado:', config.mongoDatabase);
    await registrarModelos();
  } catch (err) {
    conectado = false;
    const e = err as NodeJS.ErrnoException & { cause?: unknown };
    console.error('Error al conectar MongoDB:', err);
    const msg = String(e.message ?? err);
    if (
      e.code === 'ECONNREFUSED' ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('connect ECONNREFUSED')
    ) {
      console.error(
        '→ No hay nada escuchando en ese host/puerto. Arranca MongoDB o ejecuta desde la carpeta server: docker compose up -d'
      );
    }
    if (msg.includes('Authentication failed')) {
      console.error(
        '→ Usuario/clave MongoDB incorrectos. Revisa MONGODB_URI en .env (ej. debe coincidir con root del contenedor/authSource).'
      );
    }
    throw err;
  }
}

export { mongoose };
