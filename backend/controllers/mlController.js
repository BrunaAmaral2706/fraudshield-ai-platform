const { setRecordCount } = require('../middleware/requestLogger');
const {
  predictFraud,
  getMlPredictions,
  getAnomalies,
  getPipelineStatus,
  getPipelineMetrics,
  getRiskAnalysis,
  getFraudInsights,
  getDataAnalysis,
} = require('../services/mlService');

function getPredictions(req, res) {
  const result = predictFraud(req.query);
  setRecordCount(res, result.predictions.length);
  res.json(result);
}

function getMlPredictionsHandler(req, res) {
  const result = getMlPredictions(req.query);
  setRecordCount(res, result.predictions.length);
  res.json(result);
}

function getAnomaliesHandler(req, res) {
  const result = getAnomalies(req.query);
  setRecordCount(res, result.anomalies.length);
  res.json(result);
}

function getPipeline(req, res) {
  res.json(getPipelineStatus());
}

function getMetrics(req, res) {
  const metrics = getPipelineMetrics();
  setRecordCount(res, metrics?.summary?.total_scored ?? 0);
  res.json(metrics ?? { error: 'Metrics not yet computed' });
}

function getRiskAnalysisHandler(req, res) {
  const result = getRiskAnalysis(req.query);
  setRecordCount(res, result.summary.total_analyzed);
  res.json(result);
}

function getFraudInsightsHandler(req, res) {
  const result = getFraudInsights(req.query);
  setRecordCount(res, result.insights?.length ?? 0);
  res.json(result);
}

function getDataAnalysisHandler(req, res) {
  const report = getDataAnalysis();
  setRecordCount(res, report.overview?.total_fraud_transactions ?? 0);
  res.json(report);
}

module.exports = {
  getPredictions,
  getMlPredictionsHandler,
  getAnomaliesHandler,
  getPipeline,
  getMetrics,
  getRiskAnalysisHandler,
  getFraudInsightsHandler,
  getDataAnalysisHandler,
};
