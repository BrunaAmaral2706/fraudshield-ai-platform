const { setRecordCount } = require('../middleware/requestLogger');
const { getTransactionsPage } = require('../services/analyticsService');

function listTransactions(req, res) {
  const result = getTransactionsPage(req.query);
  setRecordCount(res, result.pagination.total);
  res.json(result);
}

module.exports = { listTransactions };
