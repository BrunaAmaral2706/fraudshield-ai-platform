/**
 * Statistical utilities for feature engineering and ML inference.
 */

function mean(values) {
  if (!values?.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stdDev(values, avg = mean(values)) {
  if (!values?.length || values.length < 2) return 1;
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance) || 1;
}

function zScore(value, avg, std) {
  return (value - avg) / (std || 1);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

module.exports = { mean, stdDev, zScore, clamp, percentile };
