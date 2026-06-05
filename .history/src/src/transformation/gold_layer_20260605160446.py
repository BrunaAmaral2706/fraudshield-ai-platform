import pandas as pd
import logging

# =========================================
# CONFIG LOGS
# =========================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logging.info("Iniciando camada Gold...")

# =========================================
# LEITURA SILVER
# =========================================

df = pd.read_parquet("data/silver/fraud_clean.parquet")

logging.info(f"Total registros carregados: {len(df)}")

# =========================================
# TRATAMENTO DATA
# =========================================

df["trans_date_trans_time"] = pd.to_datetime(
    df["trans_date_trans_time"]
)

df["transaction_hour"] = df["trans_date_trans_time"].dt.hour

# =========================================
# KPIs GERAIS
# =========================================

total_transacoes = len(df)

total_fraudes = df["is_fraud"].sum()

taxa_fraude = (
    total_fraudes / total_transacoes
) * 100

volume_total = df["amt"].sum()

ticket_medio = df["amt"].mean()

# =========================================
# PRINT KPIs
# =========================================

print("\n========== KPIs FRAUDE ==========")

print(f"Total Transações: {total_transacoes}")

print(f"Total Fraudes: {total_fraudes}")

print(f"Taxa Fraude: {taxa_fraude:.4f}%")

print(f"Volume Financeiro: ${volume_total:,.2f}")

print(f"Ticket Médio: ${ticket_medio:,.2f}")

# =========================================
# FRAUDES POR CATEGORIA
# =========================================

fraudes_categoria = (
    df[df["is_fraud"] == 1]
    .groupby("category")
    .agg(
        qtd_fraudes=("is_fraud", "count"),
        volume_fraude=("amt", "sum")
    )
    .sort_values(
        by="qtd_fraudes",
        ascending=False
    )
)

print("\nTOP CATEGORIAS FRAUDE:")
print(fraudes_categoria.head(10))

# =========================================
# FRAUDES POR HORÁRIO
# =========================================

fraudes_horario = (
    df[df["is_fraud"] == 1]
    .groupby("transaction_hour")
    .agg(
        qtd_fraudes=("is_fraud", "count")
    )
)

print("\nFRAUDES POR HORÁRIO:")
print(fraudes_horario)

# =========================================
# EXPORTAÇÃO GOLD
# =========================================

kpis = pd.DataFrame({
    "total_transacoes": [total_transacoes],
    "total_fraudes": [total_fraudes],
    "taxa_fraude": [taxa_fraude],
    "volume_total": [volume_total],
    "ticket_medio": [ticket_medio]
})

kpis.to_parquet(
    "data/gold/fraud_kpis.parquet",
    index=False
)

fraudes_categoria.to_parquet(
    "data/gold/fraud_by_category.parquet"
)

fraudes_horario.to_parquet(
    "data/gold/fraud_by_hour.parquet"
)

logging.info("Camada Gold finalizada.")

# =========================================
# EXPORT JSON
# =========================================

kpis.to_json(
    "data/gold/fraud_kpis.json",
    orient="records"
)

fraudes_categoria.to_json(
    "data/gold/fraud_by_category.json",
    orient="records"
)

fraudes_horario.to_json(
    "data/gold/fraud_by_hour.json",
    orient="records"
)

print("\nJSONs exportados com sucesso.")