import { Router } from 'express';
import {
  getTopAirports,
  getMonthlyPerformance,
  getProfitableRoutes,
  getMonthlyRanking,
  getAvailableCountries,
} from '../controllers/flights.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de vuelos protegidas por JWT
router.use(verifyToken);

// 2.1: Determinar los tres principales aeropuertos origen/destino teniendo como destino/origen a un país
router.get('/top-airports', getTopAirports);

// 2.2: Desempeño mensual de las aerolíneas
router.get('/monthly-performance', getMonthlyPerformance);

// 2.3: Listado de las 50 rutas más rentables (vuelos > 70)
router.get('/profitable-routes', getProfitableRoutes);

// 2.4: Clasificar las aerolíneas por ingresos dentro de cada mes (Top 5)
router.get('/monthly-ranking', getMonthlyRanking);

// Helper para frontend: Países disponibles
router.get('/countries', getAvailableCountries);

export default router;
