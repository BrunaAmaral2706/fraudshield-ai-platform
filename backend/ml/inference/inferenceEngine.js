/**
 * ML Inference Engine — Isolation Forest approximation + ensemble prediction.
 */
const { clamp } = require('../utils/stats');

const MODEL_WEIGHTS = {
  isolationForest: 0.35,
  randomForest: 0.35,
  riskEngine: 0.2,
  behavioral: 0.1,
};

function isolationForestScore(features) {
  const dims = [
    Math.abs(features.amount_zscore) / 3,
    Math.abs(features.amount_deviation) / 3,
    features.suspicious_hour,
    features.high_risk_category,
    features.customer_risk,
    Math.min(features.velocity_fraud ?? features.user_velocity ?? 0, 1) / 5,
    features.anomaly_behavior ?? 0,
  ];
  const score = dims.reduce((s, v) => s + v, 0) / dims.length;
  return Number(clamp(score, 0, 1).toFixed(4));
}

function randomForestPredict(features) {
  let prob = 0.12;
  if (Math.abs(features.amount_zscore) > 2) prob += 0.22;
  if (Math.abs(features.amount_zscore) > 3) prob += 0.12;
  if (features.suspicious_hour) prob += 0.18;
  if (features.high_risk_category) prob += 0.16;
  if (features.velocity_fraud > 3 || features.user_velocity > 3) prob += 0.14;
  if (features.anomaly_behavior > 0.5) prob += 0.12;
  if (features.customer_risk > 0.5) prob += 0.12;
  if (Math.abs(features.amount_deviation) > 2) prob += 0.1;
  return Number(clamp(prob, 0, 0.99).toFixed(4));
}

function xgboostPredict(features, riskScore) {
  // Structural placeholder — weighted gradient-style boost
  const base = randomForestPredict(features);
  const boost =
    (riskScore / 100) * 0.15 +
    (features.customer_risk * 0.1) +
    (isolationForestScore(features) * 0.08);
  return Number(clamp(base + boost, 0, 0.99).toFixed(4));
}

function mapSeverity(fraudProbability, riskLevel) {
  if (fraudProbability >= 0.85 || riskLevel === 'CRITICAL') return 'CRITICAL';
  if (fraudProbability >= 0.65 || riskLevel === 'HIGH') return 'HIGH';
  if (fraudProbability >= 0.4 || riskLevel === 'MEDIUM') return 'WARNING';
  return 'INFO';
}

function mapMlPrediction(fraudProbability) {
  if (fraudProbability >= 0.72) return 'FRAUD';
  if (fraudProbability >= 0.45) return 'SUSPICIOUS';
  return 'LEGITIMATE';
}

function computeAiConfidence(fraudProbability, anomalyScore, riskScore) {
  const spread = Math.abs(fraudProbability - 0.5);
  const base = 0.55 + spread * 0.8;
  const anomalyBoost = anomalyScore > 0.6 ? 0.08 : 0;
  const riskBoost = riskScore >= 70 ? 0.07 : 0;
  return Number(clamp((base + anomalyBoost + riskBoost) * 100, 50, 99).toFixed(1));
}

function predictTransaction(transaction, features) {
  const anomaly_score = isolationForestScore(features);
  const rfProb = randomForestPredict(features);
  const xgbProb = xgboostPredict(features, transaction.risk_score ?? 0);

  const fraud_probability = Number(
    clamp(
      rfProb * MODEL_WEIGHTS.randomForest +
        anomaly_score * MODEL_WEIGHTS.isolationForest +
        ((transaction.risk_score ?? 0) / 100) * MODEL_WEIGHTS.riskEngine +
        features.customer_risk * MODEL_WEIGHTS.behavioral,
      0.01,
      0.99,
    ).toFixed(4),
  );

  const ml_prediction = mapMlPrediction(fraud_probability);
  const severity = mapSeverity(fraud_probability, transaction.risk_level);
  const ai_confidence = computeAiConfidence(
    fraud_probability,
    anomaly_score,
    transaction.risk_score ?? 0,
  );

  return {
    anomaly_score,
    fraud_probability,
    ml_prediction,
    severity,
    ai_confidence,
    model_scores: {
      isolation_forest: anomaly_score,
      random_forest: rfProb,
      xgboost: xgbProb,
    },
  };
}

module.exports = {
  isolationForestScore,
  randomForestPredict,
  xgboostPredict,
  predictTransaction,
  mapSeverity,
  mapMlPrediction,
  MODEL_WEIGHTS,
};
