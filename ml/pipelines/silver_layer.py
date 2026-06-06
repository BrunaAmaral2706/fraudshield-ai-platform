"""
Silver layer — bronze parquet → cleaned fraud dataset.
Run from project root: python ml/pipelines/silver_layer.py
"""
import logging
from pathlib import Path

import pandas as pd

from config import BRONZE_DIR, SILVER_DIR, SILVER_PARQUET

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger(__name__)


def find_latest_bronze() -> Path:
    files = sorted(BRONZE_DIR.glob("fraud_raw_*.parquet"))
    if not files:
        raise FileNotFoundError(f"No bronze parquet in {BRONZE_DIR}. Run ingest_data.py first.")
    return files[-1]


def transform_silver():
    SILVER_DIR.mkdir(parents=True, exist_ok=True)
    bronze_path = find_latest_bronze()
    log.info("Reading bronze: %s", bronze_path)

    df = pd.read_parquet(bronze_path)
    log.info("Loaded %d rows", len(df))

    # Type coercion
    df["amt"] = pd.to_numeric(df["amt"], errors="coerce").fillna(0)
    df["is_fraud"] = pd.to_numeric(df["is_fraud"], errors="coerce").fillna(0).astype(int)
    df["trans_date_trans_time"] = pd.to_datetime(df["trans_date_trans_time"], errors="coerce")

    # Drop invalid rows
    before = len(df)
    df = df.dropna(subset=["trans_num", "trans_date_trans_time", "category"])
    df = df[df["amt"] >= 0]
    log.info("Cleaned rows: %d removed", before - len(df))

    # Normalize text fields
    df["category"] = df["category"].astype(str).str.strip().str.lower()
    df["state"] = df["state"].astype(str).str.strip().str.upper()
    df["merchant"] = df["merchant"].fillna("unknown").astype(str)
    df["city"] = df["city"].fillna("").astype(str)
    df["cc_num"] = df["cc_num"].fillna(df["trans_num"]).astype(str)

    df["transaction_hour"] = df["trans_date_trans_time"].dt.hour
    df["ingested_at"] = pd.Timestamp.utcnow()

    df.to_parquet(SILVER_PARQUET, index=False)
    frauds = int(df["is_fraud"].sum())
    log.info("Silver saved: %s (%d rows, %d frauds)", SILVER_PARQUET, len(df), frauds)
    return SILVER_PARQUET


if __name__ == "__main__":
    transform_silver()
