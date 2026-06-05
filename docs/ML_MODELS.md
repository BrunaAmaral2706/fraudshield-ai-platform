# FraudShield ML Models — Documentation

## Overview

FraudShield uses an **ensemble ML pipeline** combining rule-based risk scoring with statistical and tree-based models for fraud detection, anomaly scoring, and explainable AI outputs.

## Architecture

```
backend/ml/
├── features/featureEngine.js    # 9 engineered features
├── inference/inferenceEngine.js # Isolation Forest + RF + XGBoost stub
├── pipelines/fraudPipeline.js   # Batch scoring at startup
├── training/train.py            # Python sklearn training (optional)
├── models/metrics.json          # Auto-generated metrics
└── utils/stats.js
```

## Feature Engineering

| Feature | Description |
|---------|-------------|
| `transaction_hour` | Hour of transaction (0–23) |
| `amount_zscore` | Global amount z-score |
| `user_velocity` | Transactions per card in dataset |
| `transaction_frequency` | Card frequency count |
| `avg_customer_amount` | Mean amount for card |
| `high_risk_category` | Binary — critical category flag |
| `suspicious_hour` | Binary — 22h–03h window |
| `amount_deviation` | Deviation from customer mean |
| `customer_risk` | Composite behavioral risk (0–1) |

## Models

### 1. Isolation Forest (Production)
- **Purpose:** Anomaly detection in feature space
- **Output:** `anomaly_score` (0–1)
- **Implementation:** Multi-dimensional normalized deviation ensemble

### 2. Random Forest (Production)
- **Purpose:** Fraud probability classification
- **Output:** `fraud_probability` component
- **Implementation:** Rule-weighted ensemble (Python training available)

### 3. XGBoost (Staging)
- **Purpose:** Gradient-boosted fraud prediction
- **Status:** Structural placeholder — weights RF + risk engine
- **Training:** `python backend/ml/training/train.py`

### 4. Risk Engine (Rules)
- **Purpose:** Interpretable baseline score
- **Output:** `risk_score`, `risk_level`, `risk_explanation`

## Ensemble Weights

| Component | Weight |
|-----------|--------|
| Random Forest | 35% |
| Isolation Forest | 35% |
| Risk Engine | 20% |
| Behavioral | 10% |

## Output Fields (per transaction)

```json
{
  "risk_score": 78,
  "risk_level": "HIGH",
  "fraud_probability": 0.72,
  "anomaly_score": 0.61,
  "ml_prediction": "FRAUD",
  "severity": "HIGH",
  "ai_confidence": 87.3,
  "risk_explanation": {
    "summary": "Risk increased because: suspicious hour, high amount",
    "factors": [...]
  }
}
```

## Severity Classification

| Level | Condition |
|-------|-----------|
| CRITICAL | fraud_probability ≥ 0.85 OR risk_level CRITICAL |
| HIGH | fraud_probability ≥ 0.65 OR risk_level HIGH |
| WARNING | fraud_probability ≥ 0.40 OR risk_level MEDIUM |
| INFO | Otherwise |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /risk-analysis` | Aggregated risk intelligence |
| `GET /ml-predictions` | ML predictions with explanations |
| `GET /anomalies` | Top anomalies |
| `GET /fraud-insights` | AI insights + behavioral analytics |
| `GET /data-analysis` | Statistical dataset report |
| `GET /ml/metrics` | Precision, recall, F1, confusion matrix |
| `GET /ml/pipeline` | Pipeline status |

## Python Modules (Enterprise)

| File | Purpose |
|------|---------|
| `backend/ml/risk_engine.py` | Rule-based risk scoring (production reference) |
| `backend/ml/fraud_model.py` | Isolation Forest + Random Forest + XGBoost stub |
| `backend/ml/inference/pythonBridge.js` | Optional sklearn training integration |

Train with sklearn:
```bash
pip install pandas scikit-learn numpy
python backend/ml/fraud_model.py
```

Outputs: `backend/ml/models/metrics_python.json`

## Roadmap

- [ ] Wire Python model artifacts into Node inference
- [ ] SHAP values for feature explainability
- [ ] Real-time streaming inference
- [ ] Model drift monitoring dashboard
- [ ] A/B testing between model versions
