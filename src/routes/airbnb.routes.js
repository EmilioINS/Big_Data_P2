import { Router } from 'express';
import {
  getAvgPriceByProperty,
  filterAmenitiesAndRating,
  getTopReviewers,
  searchReviews,
} from '../controllers/airbnb.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de Airbnb protegidas por JWT
router.use(verifyToken);

// 3.1: Precio medio por tipo de propiedad y total de anuncios
router.get('/price-by-property', getAvgPriceByProperty);

// 3.2: Anuncios con más de N comodidades y calificación > M
router.get('/filter-amenities-rating', filterAmenitiesAndRating);

// 3.3: Top N revisores con más reseñas escritas
router.get('/top-reviewers', getTopReviewers);

// 3.4: Buscar anuncios con texto en sus reseñas
router.get('/search-reviews', searchReviews);

export default router;
