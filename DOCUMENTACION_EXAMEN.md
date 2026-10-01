# INSTITUTO TECNOLÓGICO DE MÉXICO
## Departamento de Sistemas y Computación
### Materia: Big Data
### Examen – Competencia 1: Procesamiento y Analítica de Grandes Volúmenes de Datos

---

**Profesor:** M.A.V.D. José Jesús Sánchez Farías  
**Estudiante:** Emilio  
**Periodo:** Agosto – Diciembre 2026  
**Fecha:** 1 de octubre de 2026  

---

# Tabla de Contenido
1. [Introducción](#1-introducción)
2. [Desarrollo de Actividades](#2-desarrollo-de-actividades)
   - 2.1. [Arquitectura General y Tecnologías Empleadas](#21-arquitectura-general-y-tecnologías-empleadas)
   - 2.2. [Base de Datos NoSQL e Ingesta de Datos (MongoDB Atlas)](#22-base-de-datos-nosql-e-ingesta-de-datos-mongodb-atlas)
   - 2.3. [Desarrollo de Consultas del Framework de Agregación](#23-desarrollo-de-consultas-del-framework-de-agregación)
     - 2.3.1. [Consultas de Vuelos (Flights)](#231-consultas-de-vuelos-flights)
     - 2.3.2. [Consultas de Alojamientos (Airbnb)](#232-consultas-de-alojamientos-airbnb)
   - 2.4. [Desarrollo de la API REST en Node.js](#24-desarrollo-de-la-api-rest-en-nodejs)
   - 2.5. [Seguridad y Control de Acceso con JWT](#25-seguridad-y-control-de-acceso-con-jwt)
   - 2.6. [Interfaz Web y Dashboard Analítico](#26-interfaz-web-y-dashboard-analítico)
3. [Resultados y Pruebas de Ejecución](#3-resultados-y-pruebas-de-ejecución)
   - 3.1. [Pruebas de Autenticación y Control de Acceso](#31-pruebas-de-autenticación-y-control-de-acceso)
   - 3.2. [Resultados de Consultas de Vuelos](#32-resultados-de-consultas-de-vuelos)
   - 3.3. [Resultados de Consultas de Airbnb](#33-resultados-de-consultas-de-airbnb)
4. [Guión Sugerido para la Grabación del Video (Máx. 5 minutos)](#4-guión-sugerido-para-la-grabación-del-video-máx-5-minutos)
5. [Conclusiones](#5-conclusiones)
6. [Referencias Bibliográficas (Formato APA 7ma Edición)](#6-referencias-bibliográficas-formato-apa-7ma-edición)

---

# 1. Introducción

En el ecosistema tecnológico contemporáneo, el volumen, la velocidad y la variedad de la información que generan las organizaciones demandan arquitecturas de software capaces de almacenar, procesar y presentar métricas de valor sin comprometer el rendimiento ni la integridad del sistema. El procesamiento analítico de datos (Big Data) ha encontrado en las bases de datos orientadas a documentos, específicamente en **MongoDB**, una de sus herramientas más potentes gracias a su modelo flexible basado en BSON y, en particular, al **Framework de Agregación** (*Aggregation Framework*).

El presente proyecto documenta el diseño, desarrollo e implementación de una solución completa que integra la analítica avanzada de dos conjuntos masivos de datos:
1. **Flights Dataset (`flights.csv`)**: Más de 57,000 registros de vuelos comerciales globales que contemplan información de aerolíneas, aeropuertos origen y destino, pasajeros transportados, ingresos monetarios generados y factores de ocupación de las aeronaves.
2. **Airbnb Listings & Reviews (`airbnb.listingsAndReviews.json`)**: 5,555 propiedades con información detallada de comodidades (*amenities*), tipos de propiedad, calificaciones de huéspedes y cientos de miles de reseñas textuales anidadas.

Para exponer y consumir estos datos, se construyó una **API REST moderna** sobre el entorno de ejecución **Node.js v24 LTS** utilizando **Express.js**, protegida de extremo a extremo mediante el estándar de la industria **JSON Web Tokens (JWT)** y algoritmos criptográficos con **bcryptjs**. Finalmente, se diseñó un **Dashboard web analítico** interactivo para la visualización de resultados mediante tablas y gráficos en tiempo real con **Chart.js**.

---

# 2. Desarrollo de Actividades

## 2.1. Arquitectura General y Tecnologías Empleadas

El sistema se diseñó bajo una arquitectura de capas desacopladas que garantiza la escalabilidad, la mantenibilidad del código y la separación de responsabilidades:

1. **Capa de Almacenamiento y Cómputo (MongoDB Atlas)**: Aloja las colecciones `flights`, `airbnb` y `users`. Las operaciones complejas de agrupamiento, ordenamiento y ranking se delegan al motor de agregación de MongoDB, minimizando la transferencia de datos innecesarios a través de la red.
2. **Capa Backend (Node.js v24.21.0 LTS + Express.js)**:
   - Configurada de forma nativa con **ES Modules** (`import` / `export`).
   - Implementa un patrón MVC modular (*Model-View-Controller* / *Routes-Controllers-Middlewares*).
   - Middleware de autenticación que intercepta y valida tokens Bearer antes de autorizar el acceso a las rutas analíticas.
3. **Capa Frontend (Single Page Application - SPA)**:
   - Construida con HTML5 semántico, **Tailwind CSS** para un diseño moderno y responsivo con estética *glassmorphism*, y **Chart.js** para la representación gráfica (barras, líneas, áreas y gráficos comparativos).

---

## 2.2. Base de Datos NoSQL e Ingesta de Datos (MongoDB Atlas)

Se utilizó un clúster en la nube de **MongoDB Atlas** conectado a la base de datos `Examen_P2`.

### Ingesta del Dataset de Vuelos (`flights`)
El archivo `flights.csv` (119 MB) fue importado asegurando que todos los tipos de datos numéricos (`passengers_booked`, `revenue`, `load_factor_pct`, `departure_year`, `departure_month`) fueran almacenados como tipos de datos numéricos (`Double` e `Int32`) para permitir operaciones matemáticas y de promedio en las etapas de agregación. Total de documentos: **57,000**.

### Ingesta Optimizada del Dataset de Airbnb (`airbnb`)
El archivo `airbnb.listingsAndReviews.json` (107 MB) contiene estructuras complejas con objetos anidados de tipo Extended JSON (EJSON), en particular valores monetarios como `Decimal128` (`"$numberDecimal": "115.00"`). Para asegurar una importación limpia sin saturar el canal de red de Atlas, se desarrolló un script en Node.js (`scripts/import_airbnb.js`) que procesó los 5,555 documentos en lotes de 100 documentos mediante `BSON.EJSON.parse()` e `insertMany()`.

### Indexación para Alto Rendimiento
Se definieron índices compuestos en MongoDB para asegurar tiempos de respuesta inferiores a 100 ms:
- Colección `flights`: `{ destination_country: 1 }`, `{ origin_country: 1 }`, `{ departure_year: 1, departure_month: 1, airlinename: 1 }`, `{ origin_airport: 1, destination_airport: 1 }`.
- Colección `airbnb`: `{ property_type: 1 }`, `{ "review_scores.review_scores_rating": 1 }`, `{ "reviews.reviewer_id": 1 }`.
- Colección `users`: `{ email: 1 }` con restricción de unicidad (`unique: true`).

---

## 2.3. Desarrollo de Consultas del Framework de Agregación

### 2.3.1. Consultas de Vuelos (Flights)

#### Consulta 2.1: Tres principales aeropuertos origen/destino teniendo como destino/origen a un país en particular
- **Objetivo:** Identificar los 3 aeropuertos con mayor volumen de visitantes y vuelos teniendo a un país como origen o destino.
- **Pipeline de Agregación:**
```javascript
[
  { $match: { [campoPais]: { $regex: new RegExp(`^${country}$`, 'i') } } },
  {
    $group: {
      _id: { pais: campoPaisRef, aeropuerto: campoAeropuertoRef },
      total_visitantes: { $sum: "$passengers_booked" },
      total_vuelos: { $sum: 1 }
    }
  },
  { $sort: { total_visitantes: -1 } },
  { $limit: 3 },
  {
    $project: {
      _id: 0,
      tipo: isOrigin ? 'Origen' : 'Destino',
      pais: "$_id.pais",
      aeropuerto: "$_id.aeropuerto",
      total_visitantes: 1,
      total_vuelos: 1
    }
  }
]
```

#### Consulta 2.2: Desempeño mensual de las aerolíneas
- **Objetivo:** Mostrar para cada mes y año el total de vuelos, pasajeros, ganancias acumuladas y factor de ocupación promedio por aerolínea.
- **Pipeline de Agregación:**
```javascript
[
  {
    $group: {
      _id: {
        anio: "$departure_year",
        mes: "$departure_month",
        aerolinea: "$airlinename"
      },
      total_vuelos: { $sum: 1 },
      total_pasajeros: { $sum: "$passengers_booked" },
      total_ganancias: { $sum: "$revenue" },
      promedio_factor_ocupacion: { $avg: "$load_factor_pct" }
    }
  },
  { $sort: { "_id.anio": 1, "_id.mes": 1, "total_ganancias": -1 } },
  {
    $project: {
      _id: 0,
      anio: "$_id.anio",
      mes: "$_id.mes",
      aerolinea: "$_id.aerolinea",
      total_vuelos: 1,
      total_pasajeros: 1,
      total_ganancias: { $round: ["$total_ganancias", 2] },
      promedio_factor_ocupacion: { $round: ["$promedio_factor_ocupacion", 2] }
    }
  }
]
```

#### Consulta 2.3: Listado de las 50 rutas más rentables (vuelos operados > 70)
- **Objetivo:** Detectar las 50 combinaciones de origen y destino con mayor rentabilidad económica que superen el umbral mínimo de 70 operaciones de vuelo.
- **Pipeline de Agregación:**
```javascript
[
  {
    $group: {
      _id: {
        aeropuerto_origen: "$origin_airport",
        aeropuerto_destino: "$destination_airport"
      },
      total_vuelos: { $sum: 1 },
      total_pasajeros: { $sum: "$passengers_booked" },
      total_ganancias: { $sum: "$revenue" },
      promedio_ganancias_vuelo: { $avg: "$revenue" },
      promedio_factor_ocupacion: { $avg: "$load_factor_pct" }
    }
  },
  { $match: { total_vuelos: { $gt: 70 } } },
  { $sort: { total_ganancias: -1 } },
  { $limit: 50 },
  {
    $project: {
      _id: 0,
      aeropuerto_origen: "$_id.aeropuerto_origen",
      aeropuerto_destino: "$_id.aeropuerto_destino",
      total_vuelos: 1,
      total_pasajeros: 1,
      total_ganancias: { $round: ["$total_ganancias", 2] },
      promedio_ganancias_vuelo: { $round: ["$promedio_ganancias_vuelo", 2] },
      promedio_factor_ocupacion: { $round: ["$promedio_factor_ocupacion", 2] }
    }
  }
]
```

#### Consulta 2.4: Clasificación de aerolíneas por ingresos dentro de cada mes (Top 5)
- **Objetivo:** Segmentar mensualmente las aerolíneas y asignarles una posición de jerarquía (1 al 5) según sus ingresos usando la función moderna de ventanas de MongoDB.
- **Pipeline de Agregación:**
```javascript
[
  {
    $group: {
      _id: {
        anio: "$departure_year",
        mes: "$departure_month",
        aerolinea: "$airlinename"
      },
      total_vuelos: { $sum: 1 },
      total_pasajeros: { $sum: "$passengers_booked" },
      total_ganancias: { $sum: "$revenue" }
    }
  },
  { $sort: { "_id.anio": 1, "_id.mes": 1, "total_ganancias": -1 } },
  {
    $setWindowFields: {
      partitionBy: { anio: "$_id.anio", mes: "$_id.mes" },
      sortBy: { total_ganancias: -1 },
      output: {
        posicion_jerarquia_mensual: { $denseRank: {} }
      }
    }
  },
  { $match: { posicion_jerarquia_mensual: { $lte: 5 } } },
  {
    $project: {
      _id: 0,
      anio: "$_id.anio",
      mes: "$_id.mes",
      nombre_aerolinea: "$_id.aerolinea",
      total_vuelos: 1,
      total_pasajeros: 1,
      total_ganancias: { $round: ["$total_ganancias", 2] },
      posicion_jerarquia_mensual: 1
    }
  }
]
```

---

### 2.3.2. Consultas de Alojamientos (Airbnb)

#### Consulta 3.1: Precio medio por tipo de propiedad
- **Pipeline de Agregación:**
```javascript
[
  { $match: { property_type: { $exists: true, $ne: "" }, price: { $exists: true } } },
  {
    $group: {
      _id: "$property_type",
      precio_promedio: { $avg: { $toDouble: "$price" } },
      total_anuncios: { $sum: 1 }
    }
  },
  { $sort: { total_anuncios: -1 } },
  {
    $project: {
      _id: 0,
      property_type: "$_id",
      precio_promedio: { $round: ["$precio_promedio", 2] },
      total_anuncios: 1
    }
  }
]
```

#### Consulta 3.2: Anuncios con más de N comodidades y calificación > M
- **Pipeline de Agregación:**
```javascript
[
  {
    $match: {
      "review_scores.review_scores_rating": { $gt: minRating },
      $expr: {
        $gt: [{ $size: { $ifNull: ["$amenities", []] } }, minAmenities]
      }
    }
  },
  {
    $project: {
      _id: 1,
      name: 1,
      property_type: 1,
      price: { $toDouble: "$price" },
      review_scores_rating: "$review_scores.review_scores_rating",
      total_amenities: { $size: { $ifNull: ["$amenities", []] } },
      amenities: { $slice: ["$amenities", 10] },
      listing_url: 1
    }
  },
  { $sort: { review_scores_rating: -1, total_amenities: -1 } },
  { $limit: limit }
]
```

#### Consulta 3.3: Top N revisores con más reseñas escritas
- **Pipeline de Agregación:**
```javascript
[
  { $unwind: "$reviews" },
  {
    $group: {
      _id: "$reviews.reviewer_id",
      reviewer_name: { $first: "$reviews.reviewer_name" },
      total_resenas: { $sum: 1 }
    }
  },
  { $sort: { total_resenas: -1 } },
  { $limit: limit },
  {
    $project: {
      _id: 0,
      reviewer_id: "$_id",
      reviewer_name: 1,
      total_resenas: 1
    }
  }
]
```

#### Consulta 3.4: Búsqueda de anuncios que mencionen un texto en las reseñas
- **Pipeline de Agregación:**
```javascript
[
  { $match: { "reviews.comments": { $regex: new RegExp(searchText, "i") } } },
  { $unwind: "$reviews" },
  { $match: { "reviews.comments": { $regex: new RegExp(searchText, "i") } } },
  {
    $project: {
      _id: 0,
      listing_id: "$_id",
      nombre_propiedad: "$name",
      nombre_reviewer: "$reviews.reviewer_name",
      comentario: "$reviews.comments"
    }
  },
  { $limit: limit }
]
```

---

## 2.4. Desarrollo de la API REST en Node.js

La API fue estructurada con base en las mejores prácticas de la industria:
- **Estructura modular:** Controladores independientes (`flights.controller.js`, `airbnb.controller.js`, `auth.controller.js`) y enrutadores desacoplados.
- **Manejo de Errores Centralizado:** Middleware `errorHandler` que captura cualquier excepción y responde con código HTTP y estructura JSON consistente.
- **Soporte CORS y Morgan Logging:** Permite peticiones cruzadas y auditoría de peticiones HTTP en consola.

---

## 2.5. Seguridad y Control de Acceso con JWT

1. **Colección `users`**: Almacena las cuentas registradas con campos `name`, `email`, `password` (hasheado con `bcryptjs` con factor de coste de 10) y `createdAt`.
2. **Generación de Token**: Al iniciar sesión o registrarse, se emite un JSON Web Token firmado con clave secreta criptográfica y tiempo de expiración configurable de 24 horas.
3. **Protección de Rutas**: Todas las consultas analíticas `/api/flights/*` y `/api/airbnb/*` están vinculadas al middleware `verifyToken`. Si la cabecera `Authorization` no incluye un token válido en formato `Bearer <token>`, se deniega inmediatamente el acceso con código `401 Unauthorized`.

---

## 2.6. Interfaz Web y Dashboard Analítico

Se implementó una aplicación web tipo SPA alojada en `src/public/`:
- **Pantalla de Login y Registro:** Interfaz de autenticación con modal blur que solicita credenciales antes de mostrar el contenido.
- **Pestaña de Vuelos:** Formularios interactivos para elegir país (origen/destino), gráficos de barras y líneas con Chart.js, y tablas dinámicas.
- **Pestaña de Airbnb:** Gráficos de precios medios, controles numéricos en tiempo real para filtrar por comodidades y calificación, podio de revisores y barra de búsqueda de comentarios en vivo.
- **Gestión de Sesión:** El token JWT se almacena de forma segura en `localStorage` y se inyecta automáticamente en cada petición mediante el módulo cliente `api.js`.

---

# 3. Resultados y Pruebas de Ejecución

## 3.1. Pruebas de Autenticación y Control de Acceso

1. **Petición no autorizada (Sin Token):**
```bash
curl -s http://localhost:3000/api/flights/top-airports
# Respuesta:
# {"success":false,"message":"Acceso no autorizado: No se proporcionó el encabezado Authorization."}
```
2. **Inicio de Sesión y Emisión de JWT:**
```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@examen.com","password":"admin123"}'
# Respuesta:
# {"success":true,"message":"Inicio de sesión exitoso.","token":"eyJhbGci...","user":{"email":"admin@examen.com"}}
```

## 3.2. Resultados de Consultas de Vuelos

- **Consulta 2.1 (País: SPAIN, Destino):**
  - Aeropuerto 1: `ROTA NAVY` — 8,839 visitantes, 80 vuelos operados.
  - Aeropuerto 2: `GRANADA` — 8,581 visitantes, 80 vuelos operados.
  - Aeropuerto 3: `ROZAS` — 7,545 visitantes, 67 vuelos operados.
- **Consulta 2.2 (Desempeño mensual de aerolíneas):**
  - Muestra junio de 2015: `Ethiopia Airlines` lidera con 1,387 vuelos, 219,817 pasajeros, \$55,107,003.61 USD en ingresos y factor de ocupación promedio del 49.35%.
- **Consulta 2.3 (Top rutas con más de 70 vuelos):**
  - Ruta #1: `MC KINLEY NATL PARK` $\rightarrow$ `VIDSEL AB` con 93 vuelos, 16,163 pasajeros y \$4,069,136.73 USD en ingresos.
  - Ruta #2: `LYNEHAM AB` $\rightarrow$ `MAYKOP` con 80 vuelos, 13,092 pasajeros y \$3,295,770.76 USD.
- **Consulta 2.4 (Ranking mensual Top 5 aerolíneas por ingresos):**
  - Para cada mes (Junio, Julio, Agosto, Septiembre 2015), clasifica exactamente las primeras 5 aerolíneas con su posición jerárquica del 1 al 5.

## 3.3. Resultados de Consultas de Airbnb

- **Consulta 3.1 (Precios promedio por propiedad):**
  - `Apartment`: 3,626 anuncios, precio promedio \$255.39 USD.
  - `House`: 606 anuncios, precio promedio \$334.00 USD.
  - `Condominium`: 399 anuncios, precio promedio \$342.88 USD.
- **Consulta 3.2 (Comodidades > 5 y Calificación > 90):**
  - Identifica propiedades de alta gama como *⭐️Ocean/City Views⭐️* (70 comodidades, 100/100 de calificación) y *Westin Kaanapali KORVN Studio* (68 comodidades, 100/100).
- **Consulta 3.3 (Top 5 Revisores con más reseñas):**
  - 1º Filipe (ID 20775242) — 24 reseñas.
  - 2º Nick (ID 67084875) — 13 reseñas.
  - 3º Uge (ID 2961855) — 10 reseñas.
  - 4º Lisa (ID 20991911) — 9 reseñas.
  - 5º Thien (ID 162027327) — 9 reseñas.
- **Consulta 3.4 (Menciones de "Great Location"):**
  - Extrae comentarios reales citando el texto exacto con el autor y la propiedad asociada.

---

# 4. Guión Sugerido para la Grabación del Video (Máx. 5 minutos)

> [!IMPORTANT]
> **Criterio del Examen:** El video no debe exceder 5 minutos y se debe **ver y escuchar al estudiante** durante la presentación.

| Minuto | Actividad | Qué Mostrar en Pantalla | Qué Decir / Explicar |
|---|---|---|---|
| **0:00 - 0:45** | **Presentación Personal e Introducción** | Cámara del estudiante + Portada del proyecto / Navegador en `http://localhost:3000` | Saludo al profesor José Jesús Sánchez Farías. Mencionar nombre, materia (Big Data), fecha y objetivo: Demostrar las 8 consultas de agregación en MongoDB, API en Node.js con JWT y Dashboard analítico. |
| **0:45 - 1:30** | **Autenticación y Seguridad JWT** | Pantalla de Login / Registro en el navegador | Mostrar que las rutas de la API están protegidas (intentar consultar sin login o mostrar el modal). Iniciar sesión con `admin@examen.com` o registrar un usuario nuevo. Destacar la emisión del Token JWT. |
| **1:30 - 3:00** | **Demostración: Módulo de Vuelos (Flights)** | Pestaña "Analítica de Vuelos" | 1. **Consulta 2.1:** Elegir un país (ej. SPAIN o UNITED STATES), cambiar entre Destino/Origen y ver cómo el gráfico y la tabla del Top 3 se actualizan.<br>2. **Consulta 2.2:** Explicar el gráfico de ingresos mensuales y la tabla de desempeño de aerolíneas.<br>3. **Consulta 2.3:** Mostrar las 50 rutas más rentables con filtro mayor a 70 vuelos.<br>4. **Consulta 2.4:** Mostrar el ranking mensual Top 5 usando el selector de meses. |
| **3:00 - 4:15** | **Demostración: Módulo de Airbnb** | Pestaña "Analítica de Airbnb" | 1. **Consulta 3.1:** Mostrar el precio medio por tipo de propiedad en el gráfico.<br>2. **Consulta 3.2:** Modificar los filtros de comodidades y calificación mínima y presionar "Aplicar Filtro".<br>3. **Consulta 3.3:** Mostrar el podio de revisores y cambiar el selector a Top 10.<br>4. **Consulta 3.4:** Escribir en el buscador "Great Location" o cualquier otra palabra y mostrar cómo se resaltan las reseñas. |
| **4:15 - 5:00** | **Arquitectura y Conclusiones** | Mostrar brevemente la estructura del código en el editor (`server.js`, pipelines de agregación) | Resaltar el uso de Node.js v24 LTS, la indexación en MongoDB Atlas para responder en milisegundos y despedida formal. |

---

# 5. Conclusiones

El desarrollo de este examen permitió constatar la versatilidad y eficiencia del **Framework de Agregación de MongoDB** para operaciones de análisis masivo de datos que en modelos relacionales tradicionales requerirían complejas sentencias con múltiples `JOIN` y altos costes computacionales. El uso de operadores avanzados como `$setWindowFields`, `$group`, `$unwind` y `$match` posibilitó la extracción de valor empresarial tangible a partir de datasets de gran escala.

Por otro lado, la integración de una API desacoplada con **Node.js LTS** y la adopción de esquemas de autenticación robustos mediante **JWT** y **bcryptjs** garantizan que la capa de servicios cumpla con los estándares de seguridad de arquitecturas empresariales modernas. Finalmente, la materialización de los resultados en un Dashboard interactivo con **Chart.js** demuestra que la analítica de datos cobra su máximo valor cuando la información se presenta de forma clara y accesible para la toma estratégica de decisiones.

---

# 6. Referencias Bibliográficas (Formato APA 7ma Edición)

- MongoDB, Inc. (2024). *Aggregation Pipeline Quick Reference*. MongoDB Documentation. https://www.mongodb.com/docs/manual/meta/aggregation-quick-reference/
- MongoDB, Inc. (2024). *Window Functions in MongoDB Aggregation ($setWindowFields)*. MongoDB Documentation. https://www.mongodb.com/docs/manual/reference/operator/aggregation/setWindowFields/
- OpenJS Foundation. (2024). *Node.js v24 Documentation & LTS Release Lines*. Node.js Official Documentation. https://nodejs.org/docs/latest-v24.x/api/
- Express.js Foundation. (2024). *Express - Node.js web application framework*. Expressjs.com. https://expressjs.com/
- Auth0 by Okta. (2024). *Introduction to JSON Web Tokens (JWT)*. JWT.io. https://jwt.io/introduction
- Chart.js Contributors. (2024). *Chart.js: Simple yet flexible JavaScript charting library for designers & developers*. Chartjs.org. https://www.chartjs.org/docs/latest/
