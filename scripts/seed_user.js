import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';

dotenv.config();

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME || 'Examen_P2';

async function seedUser() {
  console.log('👤 Configurando colección de usuarios en MongoDB Atlas...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Índice único para email
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    console.log('✅ Índice único creado para el campo "email".');

    const defaultEmail = 'admin@examen.com';
    const existingUser = await usersCollection.findOne({ email: defaultEmail });

    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const result = await usersCollection.insertOne({
        name: 'Administrador',
        email: defaultEmail,
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
      });

      console.log(`✅ Usuario inicial creado con éxito:`);
      console.log(`   Email: ${defaultEmail}`);
      console.log(`   Password: admin123`);
      console.log(`   ID: ${result.insertedId}`);
    } else {
      console.log(`ℹ️ El usuario inicial '${defaultEmail}' ya existe en la base de datos.`);
    }

    const count = await usersCollection.countDocuments();
    console.log(`📊 Total de usuarios en la colección: ${count}`);
  } catch (error) {
    console.error('❌ Error configurando usuarios:', error);
  } finally {
    await client.close();
  }
}

seedUser();
