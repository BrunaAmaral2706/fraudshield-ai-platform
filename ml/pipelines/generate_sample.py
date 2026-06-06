"""
Generate lightweight demo CSV for GitHub portfolio (max 5k rows).
Run from project root: python ml/pipelines/generate_sample.py
"""
import logging
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

from config import (
    CATEGORIES,
    CITIES,
    FRAUD_RATE,
    MAX_ROWS,
    RANDOM_SEED,
    RAW_CSV,
    RAW_DIR,
    STATES,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger(__name__)


def generate_sample() -> pd.DataFrame:
    rng = np.random.default_rng(RANDOM_SEED)
    n = MAX_ROWS
    n_fraud = int(n * FRAUD_RATE)

    is_fraud = np.zeros(n, dtype=int)
    fraud_idx = rng.choice(n, size=n_fraud, replace=False)
    is_fraud[fraud_idx] = 1

    categories = rng.choice(CATEGORIES, size=n)
    # Fraud skew toward high-risk categories
    fraud_mask = is_fraud == 1
    high_risk = ["shopping_net", "grocery_pos", "misc_net", "shopping_pos"]
    categories[fraud_mask] = rng.choice(high_risk, size=fraud_mask.sum())

    states = rng.choice(STATES, size=n)
    base_date = datetime(2024, 1, 1)

    rows = []
    for i in range(n):
        state = states[i]
        fraud = is_fraud[i]
        cat = categories[i]

        if fraud:
            hour = int(rng.choice([0, 1, 2, 3, 22, 23, 4, 5]))
            amt = float(rng.uniform(500, 15000) if rng.random() > 0.3 else rng.uniform(50, 800))
        else:
            hour = int(rng.integers(8, 21))
            amt = float(rng.uniform(5, 400))

        ts = base_date + timedelta(days=int(i % 365), hours=hour, minutes=int(rng.integers(0, 59)))
        cc = f"{rng.integers(1000, 9999)}{i:06d}"

        rows.append(
            {
                "trans_num": f"TXN-{i + 1:06d}",
                "cc_num": cc,
                "merchant": f"Merchant_{cat}_{rng.integers(1, 50)}",
                "category": cat,
                "amt": round(amt, 2),
                "trans_date_trans_time": ts.strftime("%Y-%m-%d %H:%M:%S"),
                "city": CITIES.get(state, "Unknown"),
                "state": state,
                "is_fraud": int(fraud),
            }
        )

    return pd.DataFrame(rows)


def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    df = generate_sample()
    df.to_csv(RAW_CSV, index=False)
    frauds = int(df["is_fraud"].sum())
    size_kb = RAW_CSV.stat().st_size / 1024
    log.info("Sample CSV created: %s", RAW_CSV)
    log.info("Rows=%d | Frauds=%d (%.1f%%) | Size=%.1f KB", len(df), frauds, 100 * frauds / len(df), size_kb)


if __name__ == "__main__":
    main()
