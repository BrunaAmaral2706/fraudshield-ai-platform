# FraudShield Data Lakehouse

Medallion architecture layers for the fraud analytics platform.

## Layers

| Layer | Path | Format | Git |
|-------|------|--------|-----|
| Raw | `data/raw/credit_card_transactions.csv` | CSV (≤5k rows) | ✅ committed (demo sample) |
| Bronze | `data/bronze/fraud_raw_*.parquet` | Parquet | ❌ gitignored — regenerate |
| Silver | `data/silver/fraud_clean.parquet` | Parquet | ❌ gitignored — regenerate |
| Gold | `data/gold/*.json` | JSON | ✅ committed (backend reads these) |
| Gold | `data/gold/*.parquet` | Parquet | ❌ gitignored — regenerate |

## Regenerate all data

```bash
pip install -r ml/requirements.txt
python ml/pipelines/run_pipeline.py
```

## Backend dependency

The Node.js backend requires **gold JSON files** at startup:
- `fraud_kpis.json`
- `fraud_by_category.json`
- `fraud_by_hour.json`

And loads fraud transactions from `data/raw/credit_card_transactions.csv`.
