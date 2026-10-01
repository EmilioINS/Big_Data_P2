import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb+srv://emiliovazpe_db_user:tVS4AJCQB52VopLi@clusterbigdata.lgbe0nu.mongodb.net';
const dbName = process.env.DB_NAME || 'Examen_P2';

const client = new MongoClient(uri, {
  maxPoolSize: 20,
  minPoolSize: 5,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
});

let db = null;

export async function connectDB() {
  if (db) return db;
  try {
    await client.connect();
    db = client.db(dbName);
    console.log(`📡 MongoDB Atlas conectado exitosamente a la base de datos: [${dbName}]`);
    return db;
  } catch (error) {
    console.error('❌ Error de conexión a MongoDB Atlas:', error.message);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error('❌ La base de datos no está inicializada. Llama primero a connectDB().');
  }
  return db;
}

export async function closeDB() {
  if (client) {
    await client.close();
    db = null;
    console.log('🔌 Conexión con MongoDB cerrada.');
  }
}
