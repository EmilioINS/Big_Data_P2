import { getDb } from '../config/db.js';

/**
 * Consulta 2.1: Determinar los tres principales aeropuertos origen/destino
 * teniendo como destino/origen a un país en particular.
 * Parámetros query:
 *  - country: Nombre del país (ej. "SPAIN", "MEXICO", "UNITED STATES")
 *  - type: 'destination' | 'origin' (por defecto 'destination')
 */
export async function getTopAirports(req, res, next) {
  try {
    const db = getDb();
    const collection = db.collection('flights');

    const country = (req.query.country || 'SPAIN').trim();
    const type = (req.query.type || 'destination').toLowerCase().trim();

    const isOrigin = type === 'origin';
    const matchField = isOrigin ? 'origin_country' : 'destination_country';
    const airportField = isOrigin ? '$origin_airport' : '$destination_airport';
    const countryField = isOrigin ? '$origin_country' : '$destination_country';

    const pipeline = [
      {
        $match: {
          [matchField]: { $regex: new RegExp(`^${country}$`, 'i') },
        },
      },
      {
        $group: {
          _id: {
            pais: countryField,
            aeropuerto: airportField,
          },
          total_visitantes: { $sum: '$passengers_booked' },
          total_vuelos: { $sum: 1 },
        },
      },
      {
        $sort: { total_visitantes: -1 },
      },
      {
        $limit: 3,
      },
      {
        $project: {
          _id: 0,
          tipo: isOrigin ? 'Origen' : 'Destino',
          pais: '$_id.pais',
          aeropuerto: '$_id.aeropuerto',
          total_visitantes: 1,
          total_vuelos: 1,
        },
      },
    ];

    const data = await collection.aggregate(pipeline).toArray();

    return res.status(200).json({
      success: true,
      query: '2.1 - Tres principales aeropuertos por país',
      params: { country, type: isOrigin ? 'origin' : 'destination' },
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Consulta 2.2: Desempeño mensual de las aerolíneas.
 * Indicando año, mes, aerolínea, total de vuelos operados, total de pasajeros,
 * total de ganancias y promedio del factor de ocupación.
 */
export async function getMonthlyPerformance(req, res, next) {
  try {
    const db = getDb();
    const collection = db.collection('flights');

    const pipeline = [
      {
        $group: {
          _id: {
            anio: '$departure_year',
            mes: '$departure_month',
            aerolinea: '$airlinename',
          },
          total_vuelos: { $sum: 1 },
          total_pasajeros: { $sum: '$passengers_booked' },
          total_ganancias: { $sum: '$revenue' },
          promedio_factor_ocupacion: { $avg: '$load_factor_pct' },
        },
      },
      {
        $sort: {
          '_id.anio': 1,
          '_id.mes': 1,
          total_ganancias: -1,
        },
      },
      {
        $project: {
          _id: 0,
          anio: '$_id.anio',
          mes: '$_id.mes',
          aerolinea: '$_id.aerolinea',
          total_vuelos: 1,
          total_pasajeros: 1,
          total_ganancias: { $round: ['$total_ganancias', 2] },
          promedio_factor_ocupacion: { $round: ['$promedio_factor_ocupacion', 2] },
        },
      },
    ];

    const data = await collection.aggregate(pipeline).toArray();

    return res.status(200).json({
      success: true,
      query: '2.2 - Desempeño mensual de las aerolíneas',
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Consulta 2.3: Listado de las 50 rutas más rentables.
 * Indicando aeropuerto origen, aeropuerto destino, total vuelos operados,
 * total pasajeros, total ganancias, promedio ganancias por vuelo y promedio factor ocupación.
 * Solo rutas con total de vuelos > 70.
 */
export async function getProfitableRoutes(req, res, next) {
  try {
    const db = getDb();
    const collection = db.collection('flights');

    const minFlights = parseInt(req.query.minFlights, 10) || 70;
    const limit = parseInt(req.query.limit, 10) || 50;

    const pipeline = [
      {
        $group: {
          _id: {
            aeropuerto_origen: '$origin_airport',
            aeropuerto_destino: '$destination_airport',
          },
          total_vuelos: { $sum: 1 },
          total_pasajeros: { $sum: '$passengers_booked' },
          total_ganancias: { $sum: '$revenue' },
          promedio_ganancias_vuelo: { $avg: '$revenue' },
          promedio_factor_ocupacion: { $avg: '$load_factor_pct' },
        },
      },
      {
        $match: {
          total_vuelos: { $gt: minFlights },
        },
      },
      {
        $sort: { total_ganancias: -1 },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 0,
          aeropuerto_origen: '$_id.aeropuerto_origen',
          aeropuerto_destino: '$_id.aeropuerto_destino',
          total_vuelos: 1,
          total_pasajeros: 1,
          total_ganancias: { $round: ['$total_ganancias', 2] },
          promedio_ganancias_vuelo: { $round: ['$promedio_ganancias_vuelo', 2] },
          promedio_factor_ocupacion: { $round: ['$promedio_factor_ocupacion', 2] },
        },
      },
    ];

    const data = await collection.aggregate(pipeline).toArray();

    return res.status(200).json({
      success: true,
      query: '2.3 - 50 rutas más rentables (vuelos > 70)',
      params: { minFlights, limit },
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Consulta 2.4: Clasificar las aerolíneas por ingresos dentro de cada mes.
 * Se mostrará el año, mes, nombre de aerolínea, total vuelos, total pasajeros,
 * total ganancias y su posición en la jerarquía mensual (top 5 por mes).
 */
export async function getMonthlyRanking(req, res, next) {
  try {
    const db = getDb();
    const collection = db.collection('flights');

    const topN = parseInt(req.query.top, 10) || 5;

    const pipeline = [
      {
        $group: {
          _id: {
            anio: '$departure_year',
            mes: '$departure_month',
            aerolinea: '$airlinename',
          },
          total_vuelos: { $sum: 1 },
          total_pasajeros: { $sum: '$passengers_booked' },
          total_ganancias: { $sum: '$revenue' },
        },
      },
      {
        $sort: {
          '_id.anio': 1,
          '_id.mes': 1,
          total_ganancias: -1,
        },
      },
      {
        $setWindowFields: {
          partitionBy: { anio: '$_id.anio', mes: '$_id.mes' },
          sortBy: { total_ganancias: -1 },
          output: {
            posicion_jerarquia_mensual: { $denseRank: {} },
          },
        },
      },
      {
        $match: {
          posicion_jerarquia_mensual: { $lte: topN },
        },
      },
      {
        $project: {
          _id: 0,
          anio: '$_id.anio',
          mes: '$_id.mes',
          nombre_aerolinea: '$_id.aerolinea',
          total_vuelos: 1,
          total_pasajeros: 1,
          total_ganancias: { $round: ['$total_ganancias', 2] },
          posicion_jerarquia_mensual: 1,
        },
      },
    ];

    const data = await collection.aggregate(pipeline).toArray();

    return res.status(200).json({
      success: true,
      query: '2.4 - Ranking mensual de aerolíneas por ingresos (Top 5)',
      params: { top: topN },
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Helper: Obtener lista de países únicos para los selectores del frontend
 */
export async function getAvailableCountries(req, res, next) {
  try {
    const db = getDb();
    const collection = db.collection('flights');

    const countries = await collection.distinct('destination_country');
    const validCountries = countries.filter(Boolean).sort();

    return res.status(200).json({
      success: true,
      count: validCountries.length,
      data: validCountries,
    });
  } catch (error) {
    next(error);
  }
}
