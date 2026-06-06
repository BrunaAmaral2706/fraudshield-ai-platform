"""
Run full Medallion pipeline: sample → bronze → silver → gold.
Run from project root: python ml/pipelines/run_pipeline.py
"""
import logging
import sys
from pathlib import Path

# Allow imports when run as script
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import RAW_CSV
from generate_sample import generate_sample, RAW_DIR
from ingest_data import ingest
from silver_layer import transform_silver
from gold_layer import transform_gold

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger(__name__)


def main():
    log.info("=== FraudShield Lakehouse Pipeline ===")

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    if not RAW_CSV.exists():
        log.info("Raw CSV missing — generating lightweight sample...")
        df = generate_sample()
        df.to_csv(RAW_CSV, index=False)
    else:
        log.info("Using existing raw CSV: %s", RAW_CSV)

    bronze = ingest()
    log.info("Bronze: %s", bronze)

    silver = transform_silver()
    log.info("Silver: %s", silver)

    transform_gold()
    log.info("=== Pipeline complete ===")


if __name__ == "__main__":
    main()
