# FraudShield ML & Lakehouse Pipelines

Python modules for data engineering and ML training.

## Lakehouse Pipeline (Medallion)

```bash
pip install -r ml/requirements.txt
python ml/pipelines/run_pipeline.py
```

| Step | Script | Output |
|------|--------|--------|
| Sample | `generate_sample.py` | `data/raw/credit_card_transactions.csv` (≤5k rows) |
| Bronze | `ingest_data.py` | `data/bronze/fraud_raw_YYYYMMDD.parquet` |
| Silver | `silver_layer.py` | `data/silver/fraud_clean.parquet` |
| Gold | `gold_layer.py` | `data/gold/*.json` + `*.parquet` |

## ML Training (optional)

```bash
python backend/ml/fraud_model.py
python backend/ml/risk_engine.py
```

See [docs/ML_MODELS.md](../docs/ML_MODELS.md) for model details.
