/**
 * Request logging middleware — records method, path, status, duration, record counts.
 */

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const recordCount = res.locals.recordCount ?? '-';
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';

    console.log(
      `[${level}] ${req.method} ${req.originalUrl} | ${res.statusCode} | ${duration}ms | records=${recordCount}`,
    );
  });

  next();
}

function setRecordCount(res, count) {
  res.locals.recordCount = count;
}

module.exports = { requestLogger, setRecordCount };
