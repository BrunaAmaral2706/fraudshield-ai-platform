"""
Bronze layer — raw CSV → parquet.
Run from project root: python ml/pipelines/ingest_data.py
"""
import logging
from datetime import datetime

import pandas as pd

from config import BRONZE_DIR, MAX_ROWS, RAW_CSV, RAW_DIR

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger(__name__)


def ingest():
    if not RAW_CSV.exists():
        raise FileNotFoundError(
            f"Raw CSV not found: {RAW_CSV}. Run: python ml/pipelines/generate_sample.py"
        )

    BRONZE_DIR.mkdir(parents=True, exist_ok=True)
    log.info("Starting Bronze ingestion from %s", RAW_CSV)

    df = pd.read_csv(RAW_CSV)
    if len(df) > MAX_ROWS:
        log.warning("Truncating %d rows to MAX_ROWS=%d", len(df), MAX_ROWS)
        df = df.head(MAX_ROWS)

    today = datetime.now().strftime("%Y%m%d")
    output_path = BRONZE_DIR / f"fraud_raw_{today}.parquet"
    df.to_parquet(output_path, index=False)

    log.info("Bronze saved: %s (%d rows, %d cols)", output_path, len(df), len(df.columns))
    return output_path


if __name__ == "__main__":
    ingest()
