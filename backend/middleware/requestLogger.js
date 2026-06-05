/**
 * HTTP request logging middleware — delegates to lib/logger.
 */
const { requestLogger, setRecordCount } = require('../lib/logger');

module.exports = { requestLogger, setRecordCount };
