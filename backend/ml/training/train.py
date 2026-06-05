#!/usr/bin/env python3
"""
FraudShield ML Training Script
Trains Isolation Forest + Random Forest on credit card fraud dataset.
Run: python backend/ml/training/train.py
Requires: pip install pandas scikit-learn numpy
"""
import json
import os
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[3]
CSV_PATH = ROOT / "data" / "raw" / "credit_card_transactions.csv"
MODELS_DIR = Path(__file__).resolve().parents[1] / "models"

FEATURES = [
    "amt",
    "hour",
    "category_encoded",
    "velocity",
]


def load_data():
    df = pd.read_csv(CSV_PATH)
    df["timestamp"] = pd.to_datetime(df["trans_date_trans_time"])
    df["hour"] = df["timestamp"].dt.hour
    df["category_encoded"] = pd.Categorical(df["category"]).codes
    df["velocity"] = df.groupby("cc_num")["cc_num"].transform("count")
    return df


def train():
    print("[TRAIN] Loading dataset...")
    df = load_data()
    X = df[FEATURES].fillna(0)
    y = df["is_fraud"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("[TRAIN] Training Isolation Forest...")
    iso = IsolationForest(contamination=0.01, random_state=42, n_estimators=100)
    iso.fit(X_train)

    print("[TRAIN] Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=12)
    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)
    y_prob = rf.predict_proba(X_test)[:, 1]

    metrics = {
        "precision": float(precision_score(y_test, y_pred)),
        "recall": float(recall_score(y_test, y_pred)),
        "f1_score": float(f1_score(y_test, y_pred)),
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "auc_roc": float(roc_auc_score(y_test, y_prob)),
        "confusion_matrix": {
            "tp": int(((y_pred == 1) & (y_test == 1)).sum()),
            "fp": int(((y_pred == 1) & (y_test == 0)).sum()),
            "fn": int(((y_pred == 0) & (y_test == 1)).sum()),
            "tn": int(((y_pred == 0) & (y_test == 0)).sum()),
        },
        "trained_at": pd.Timestamp.now().isoformat(),
        "samples": len(df),
        "features": FEATURES,
    }

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = MODELS_DIR / "metrics_python.json"
    with open(out_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"[TRAIN] Metrics saved → {out_path}")
    print(json.dumps(metrics, indent=2))
    print(classification_report(y_test, y_pred))


if __name__ == "__main__":
    train()
