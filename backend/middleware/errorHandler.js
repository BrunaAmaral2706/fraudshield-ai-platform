/**
 * Global error handler — consistent JSON errors + logging.
 */
function notFoundHandler(req, res) {
  console.warn(`[WARN] 404 ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
  });
}

function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    path: req.originalUrl,
  });
}

module.exports = { notFoundHandler, errorHandler };
