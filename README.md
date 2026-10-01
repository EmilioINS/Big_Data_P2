
# Examen P2 - Big Data

Proyecto realizado para la materia de **Big Data**.

El proyecto consiste en una aplicación web que trabaja con datos de vuelos y alojamientos de Airbnb utilizando **MongoDB**, una API con **Node.js y Express** y un dashboard para consultar y mostrar los resultados.

## Tecnologías utilizadas

- Node.js
- Express
- MongoDB Atlas
- MongoDB Aggregation Framework
- JWT
- bcryptjs
- Tailwind CSS
- Chart.js
- JavaScript

## Requisitos

Antes de ejecutar el proyecto es necesario tener instalado:

- Node.js
- npm
- Git
- MongoDB Atlas o una conexión a MongoDB

Se recomienda utilizar la versión LTS de Node.js.

```bash
nvm use --lts
node -v
npm -v
````

 ## Instalación

 Primero se instalan las dependencias:

```
npm install
```

 Después se debe revisar el archivo `.env` y colocar los datos de conexión a MongoDB.

 Ejemplo:

```
PORT=3000
MONGO_URI=tu_conexion_de_mongodb
DB_NAME=Examen_P2
JWT_SECRET=tu_clave_secreta
JWT_EXPIRES_IN=24h
```

 ## Cargar los datos

 Para importar los datos de Airbnb:

```
npm run import:airbnb
```

 Para crear el usuario administrador:

```
npm run seed:user
```

 ## Ejecutar el proyecto

 Para iniciar el servidor:

```
npm start
```

 También se puede ejecutar en modo desarrollo:

```
npm run dev
```

 Después de iniciar el proyecto, se puede acceder desde:

```
http://localhost:3000
```

 ## Usuario de prueba

 El proyecto incluye un usuario para acceder al dashboard:

```
Usuario: admin@examen.com
Contraseña: admin123
```

 También se pueden registrar nuevos usuarios desde la aplicación.

 ## Consultas de vuelos

 Se realizaron diferentes consultas utilizando el sistema de agregaciones de MongoDB:

 - **Top 3 aeropuertos por país**
  - `/api/flights/top-airports`
- **Desempeño mensual de aerolíneas**
  - `/api/flights/monthly-performance`
- **Rutas más rentables**
  - `/api/flights/profitable-routes`
- **Ranking mensual**
  - `/api/flights/monthly-ranking`

 ## Consultas de Airbnb

 Para los datos de Airbnb se realizaron las siguientes consultas:

 - **Precio promedio por propiedad**
  - `/api/airbnb/price-by-property`
- **Filtro por comodidades y rating**
  - `/api/airbnb/filter-amenities-rating`
- **Usuarios con más reseñas**
  - `/api/airbnb/top-reviewers`
- **Búsqueda de texto en reseñas**
  - `/api/airbnb/search-reviews`

 ## Estructura del proyecto

```
Examen_p2/
├── scripts/
│   ├── import_airbnb.js
│   └── seed_user.js
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   └── public/
│
├── package.json
├── .env
├── README.md
└── DOCUMENTACION_EXAMEN.md
```

 ## Funcionamiento

 La aplicación utiliza MongoDB para guardar y consultar los datos.

 El servidor está desarrollado con Express y se encarga de las peticiones de la API, la autenticación y la comunicación con MongoDB.

 Desde el dashboard se pueden consultar los datos de vuelos y Airbnb mediante tablas, gráficas y filtros.

 Para procesar la información se utiliza principalmente el **Aggregation Framework de MongoDB**.

