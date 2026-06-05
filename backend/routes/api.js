/**
 * API routes — delegates to controllers (MVC architecture).
 */
const express = require('express');
const { ensureReady } = require('../middleware/ensureReady');
const { getRoot, getHealth } = require('../controllers/healthController');
const { listTransactions } = require('../controllers/transactionsController');
const {
  getKpis,
  getCategories,
  getHours,
  getAlerts,
  getModels,
  getSummary,
} = require('../controllers/analyticsController');
const { getPredictions, getPipeline, getMlPredictionsHandler, getAnomaliesHandler, getMetrics, getRiskAnalysisHandler, getFraudInsightsHandler, getDataAnalysisHandler } = require('../controllers/mlController');

const router = express.Router();

router.get('/', getRoot);
router.get('/health', getHealth);

router.get('/kpis', ensureReady, getKpis);
router.get('/fraudes/categorias', ensureReady, getCategories);
router.get('/fraudes/horarios', ensureReady, getHours);
router.get('/transactions', ensureReady, listTransactions);
router.get('/transacoes', ensureReady, listTransactions);
router.get('/alertas', ensureReady, getAlerts);
router.get('/modelos', ensureReady, getModels);
router.get('/analytics/summary', ensureReady, getSummary);

router.get('/ml/predict', ensureReady, getPredictions);
router.get('/ml/pipeline', ensureReady, getPipeline);
router.get('/ml/metrics', ensureReady, getMetrics);
router.get('/ml-predictions', ensureReady, getMlPredictionsHandler);
router.get('/anomalies', ensureReady, getAnomaliesHandler);
router.get('/risk-analysis', ensureReady, getRiskAnalysisHandler);
router.get('/fraud-insights', ensureReady, getFraudInsightsHandler);
router.get('/data-analysis', ensureReady, getDataAnalysisHandler);

module.exports = router;
