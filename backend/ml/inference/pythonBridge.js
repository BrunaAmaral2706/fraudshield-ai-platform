/**
 * Python ML bridge — optional sklearn training/inference integration.
 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ML_DIR = path.join(__dirname, '..');
const PYTHON_METRICS = path.join(ML_DIR, 'models', 'metrics_python.json');

function isPythonAvailable() {
  try {
    execSync('python --version', { stdio: 'pipe' });
    return true;
  } catch {
    try {
      execSync('python3 --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }
}

function getPythonCommand() {
  try {
    execSync('python --version', { stdio: 'pipe' });
    return 'python';
  } catch {
    return 'python3';
  }
}

function runTraining() {
  if (!isPythonAvailable()) {
    console.log('[ML:PYTHON] Python not found — skipping sklearn training (JS pipeline active)');
    return null;
  }

  const script = path.join(ML_DIR, 'fraud_model.py');
  const py = getPythonCommand();
  console.log('[ML:PYTHON] Starting sklearn training via fraud_model.py...');
  const start = Date.now();

  try {
    const result = spawnSync(py, [script], {
      cwd: ML_DIR,
      encoding: 'utf-8',
      timeout: 300000,
    });

    if (result.status !== 0) {
      console.warn('[ML:PYTHON] Training stderr:', result.stderr?.slice(0, 500));
      return null;
    }

    console.log(`[ML:PYTHON] Training complete in ${Date.now() - start}ms`);
    if (fs.existsSync(PYTHON_METRICS)) {
      return JSON.parse(fs.readFileSync(PYTHON_METRICS, 'utf-8'));
    }
  } catch (err) {
    console.warn('[ML:PYTHON] Training failed:', err.message);
  }
  return null;
}

function loadPythonMetrics() {
  if (!fs.existsSync(PYTHON_METRICS)) return null;
  try {
    return JSON.parse(fs.readFileSync(PYTHON_METRICS, 'utf-8'));
  } catch {
    return null;
  }
}

function mergeMetrics(jsMetrics, pythonMetrics) {
  if (!pythonMetrics?.metrics) return jsMetrics;
  return {
    ...jsMetrics,
    metrics: { ...jsMetrics.metrics, ...pythonMetrics.metrics, source: 'sklearn+js' },
    roc_curve: pythonMetrics.roc_curve ?? jsMetrics.roc_curve,
    python_trained: true,
  };
}

module.exports = {
  isPythonAvailable,
  runTraining,
  loadPythonMetrics,
  mergeMetrics,
  PYTHON_METRICS,
};
