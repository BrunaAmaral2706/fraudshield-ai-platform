import pandas as pd
from datetime import datetime

print("Iniciando ingestão Bronze...")

INPUT_FILE = "data/raw/credit_card_transactions.csv"

df = pd.read_csv(INPUT_FILE)

print(f"Linhas carregadas: {len(df)}")
print(f"Colunas encontradas: {len(df.columns)}")

today = datetime.now().strftime("%Y%m%d")

output_path = f"data/bronze/fraud_raw_{today}.parquet"

df.to_parquet(output_path, index=False)

print(f"Arquivo salvo em: {output_path}")
print("Camada Bronze finalizada.")