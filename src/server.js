import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB, closeDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import flightsRoutes from './routes/flights.routes.js';
import airbnbRoutes from './routes/airbnb.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Servir frontend estático
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de estado / health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Examen Big Data Competencia 1 API',
  });
});

// Registrar rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/flights', flightsRoutes);
app.use('/api/airbnb', airbnbRoutes);

// Manejador 404 para rutas API no encontradas
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta API no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Fallback al frontend para cualquier otra ruta
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware central de errores
app.use(errorHandler);

// Iniciar servidor y base de datos
async function startServer() {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(`📊 Dashboard Web disponible en http://localhost:${PORT}`);
      console.log(`🔐 Autenticación JWT activa en rutas protegidas`);
      console.log('====================================================');
    });

    // Cierre ordenado (Graceful shutdown)
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Señal ${signal} recibida. Cerrando servidor y conexiones...`);
      server.close(async () => {
        await closeDB();
        console.log('👋 Servidor detenido limpiamente.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error('❌ Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
