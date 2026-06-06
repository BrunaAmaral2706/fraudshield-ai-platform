"""
Gold layer — silver parquet → KPI aggregates (parquet + JSON for Node backend).
Run from project root: python ml/pipelines/gold_layer.py
"""
import json
import logging

import pandas as pd

from config import GOLD_DIR, SILVER_PARQUET

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger(__name__)


def export_json(df: pd.DataFrame, path, orient="records"):
    GOLD_DIR.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(json.loads(df.to_json(orient=orient)), f, indent=2)


def transform_gold():
    if not SILVER_PARQUET.exists():
        raise FileNotFoundError(f"Silver not found: {SILVER_PARQUET}. Run silver_layer.py first.")

    GOLD_DIR.mkdir(parents=True, exist_ok=True)
    log.info("Starting Gold layer from %s", SILVER_PARQUET)

    df = pd.read_parquet(SILVER_PARQUET)
    df["trans_date_trans_time"] = pd.to_datetime(df["trans_date_trans_time"])
    df["transaction_hour"] = df["trans_date_trans_time"].dt.hour

    total_transacoes = len(df)
    total_fraudes = int(df["is_fraud"].sum())
    taxa_fraude = (total_fraudes / total_transacoes * 100) if total_transacoes else 0
    volume_total = float(df["amt"].sum())
    ticket_medio = float(df["amt"].mean())

    kpis = pd.DataFrame(
        {
            "total_transacoes": [total_transacoes],
            "total_fraudes": [total_fraudes],
            "taxa_fraude": [taxa_fraude],
            "volume_total": [volume_total],
            "ticket_medio": [ticket_medio],
        }
    )

    fraudes_categoria = (
        df[df["is_fraud"] == 1]
        .groupby("category", as_index=False)
        .agg(qtd_fraudes=("is_fraud", "count"), volume_fraude=("amt", "sum"))
        .sort_values("qtd_fraudes", ascending=False)
    )
    fraudes_categoria["category_raw"] = fraudes_categoria["category"]

    # 24-hour array — backend uses index as hour slot
    fraudes_horario = pd.DataFrame({"qtd_fraudes": [0] * 24})
    hourly = df[df["is_fraud"] == 1].groupby("transaction_hour").size()
    for hour, count in hourly.items():
        if 0 <= hour < 24:
            fraudes_horario.at[hour, "qtd_fraudes"] = int(count)

    # Parquet exports
    kpis.to_parquet(GOLD_DIR / "fraud_kpis.parquet", index=False)
    fraudes_categoria.to_parquet(GOLD_DIR / "fraud_by_category.parquet", index=False)
    fraudes_horario.to_parquet(GOLD_DIR / "fraud_by_hour.parquet", index=False)

    # JSON exports (required by Node backend)
    export_json(kpis, GOLD_DIR / "fraud_kpis.json")
    export_json(fraudes_categoria, GOLD_DIR / "fraud_by_category.json")
    export_json(fraudes_horario, GOLD_DIR / "fraud_by_hour.json")

    log.info(
        "Gold complete — transactions=%d frauds=%d rate=%.2f%%",
        total_transacoes,
        total_fraudes,
        taxa_fraude,
    )
    print("\n========== KPIs FRAUDE ==========")
    print(f"Total Transações: {total_transacoes}")
    print(f"Total Fraudes: {total_fraudes}")
    print(f"Taxa Fraude: {taxa_fraude:.4f}%")
    print(f"Volume Financeiro: ${volume_total:,.2f}")
    print(f"Ticket Médio: ${ticket_medio:,.2f}")


if __name__ == "__main__":
    transform_gold()
