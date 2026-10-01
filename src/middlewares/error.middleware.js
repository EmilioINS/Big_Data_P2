export function errorHandler(err, req, res, next) {
  console.error('❌ Error capturado en el servidor:', err.stack || err);

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'production' ? null : err.message,
  });
}
