import { getDb } from '../config/db.js';

/**
 * Consulta 3.1: Precio medio por tipo de propiedad.
 * Se listará el tipo de propiedad (property_type), el precio promedio y el total de anuncios.
 */
export async function getAvgPriceByProperty(req, res, next) {
  try {
    const db = getDb();
    const collection = db.collection('airbnb');

    const pipeline = [
      {
        $match: {
          property_type: { $exists: true, $ne: '' },
          price: { $exists: true },
        },
      },
      {
        $group: {
          _id: '$property_type',
          precio_promedio: { $avg: { $toDouble: '$price' } },
          total_anuncios: { $sum: 1 },
        },
      },
      {
        $sort: { total_anuncios: -1 },
      },
      {
        $project: {
          _id: 0,
          property_type: '$_id',
          precio_promedio: { $round: ['$precio_promedio', 2] },
          total_anuncios: 1,
        },
      },
    ];

    const data = await collection.aggregate(pipeline).toArray();

    return res.status(200).json({
      success: true,
      query: '3.1 - Precio medio por tipo de propiedad',
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Consulta 3.2: Anuncios con más de N comodidades y calificación > M.
 * Parámetros query:
 *  - minAmenities: Mínimo de comodidades (por defecto 5)
 *  - minRating: Calificación mínima (por defecto 90)
 *  - limit: Cantidad máxima de resultados a devolver (por defecto 50)
 */
export async function filterAmenitiesAndRating(req, res, next) {
  try {
    const db = getDb();
    const collection = db.collection('airbnb');

    const minAmenities = parseInt(req.query.minAmenities, 10) || 5;
    const minRating = parseFloat(req.query.minRating) || 90;
    const limit = parseInt(req.query.limit, 10) || 50;

    const pipeline = [
      {
        $match: {
          'review_scores.review_scores_rating': { $gt: minRating },
          $expr: {
            $gt: [{ $size: { $ifNull: ['$amenities', []] } }, minAmenities],
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          property_type: 1,
          price: { $toDouble: '$price' },
          review_scores_rating: '$review_scores.review_scores_rating',
          total_amenities: { $size: { $ifNull: ['$amenities', []] } },
          amenities: { $slice: ['$amenities', 10] },
          listing_url: 1,
          accommodates: 1,
          bedrooms: 1,
          beds: 1,
        },
      },
      {
        $sort: { review_scores_rating: -1, total_amenities: -1 },
      },
      {
        $limit: limit,
      },
    ];

    const data = await collection.aggregate(pipeline).toArray();

    return res.status(200).json({
      success: true,
      query: '3.2 - Anuncios por comodidades y calificación',
      params: { minAmenities, minRating, limit },
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Consulta 3.3: Encuentra a los mejores revisores (con más reseñas escritas).
 * Parámetros query:
 *  - limit: Número de revisores a mostrar (por defecto 5)
 */
export async function getTopReviewers(req, res, next) {
  try {
    const db = getDb();
    const collection = db.collection('airbnb');

    const limit = parseInt(req.query.limit, 10) || 5;

    const pipeline = [
      {
        $unwind: '$reviews',
      },
      {
        $group: {
          _id: '$reviews.reviewer_id',
          reviewer_name: { $first: '$reviews.reviewer_name' },
          total_resenas: { $sum: 1 },
        },
      },
      {
        $sort: { total_resenas: -1 },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 0,
          reviewer_id: '$_id',
          reviewer_name: 1,
          total_resenas: 1,
        },
      },
    ];

    const data = await collection.aggregate(pipeline).toArray();

    return res.status(200).json({
      success: true,
      query: '3.3 - Top revisores con más reseñas',
      params: { limit },
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Consulta 3.4: Buscar anuncios que mencionen un texto en sus reseñas.
 * Parámetros query:
 *  - text | query: Cadena a buscar (por defecto "Great Location")
 *  - limit: Límite de resultados (por defecto 50)
 */
export async function searchReviews(req, res, next) {
  try {
    const db = getDb();
    const collection = db.collection('airbnb');

    const searchText = (req.query.text || req.query.query || 'Great Location').trim();
    const limit = parseInt(req.query.limit, 10) || 50;

    const regex = new RegExp(searchText, 'i');

    const pipeline = [
      {
        $match: {
          'reviews.comments': { $regex: regex },
        },
      },
      {
        $unwind: '$reviews',
      },
      {
        $match: {
          'reviews.comments': { $regex: regex },
        },
      },
      {
        $project: {
          _id: 0,
          listing_id: '$_id',
          nombre_propiedad: '$name',
          nombre_reviewer: '$reviews.reviewer_name',
          comentario: '$reviews.comments',
          fecha_resena: '$reviews.date',
        },
      },
      {
        $limit: limit,
      },
    ];

    const data = await collection.aggregate(pipeline).toArray();

    return res.status(200).json({
      success: true,
      query: '3.4 - Búsqueda de texto en reseñas',
      params: { searchText, limit },
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
}
