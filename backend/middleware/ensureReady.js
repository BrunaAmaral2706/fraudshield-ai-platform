/**
 * Ensures data store is initialized before handling analytics routes.
 */
const { getCache, initializeData } = require('../database/dataStore');

function ensureReady(req, res, next) {
  const cache = getCache();
  if (cache.ready) return next();

  initializeData()
    .then(() => next())
    .catch((err) => {
      console.error('[ERROR] Data init failed:', err.message);
      res.status(500).json({ error: 'Failed to initialize data store' });
    });
}

module.exports = { ensureReady };
