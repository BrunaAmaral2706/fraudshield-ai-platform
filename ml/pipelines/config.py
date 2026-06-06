"""FraudShield lakehouse pipeline configuration."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
BRONZE_DIR = DATA_DIR / "bronze"
SILVER_DIR = DATA_DIR / "silver"
GOLD_DIR = DATA_DIR / "gold"

RAW_CSV = RAW_DIR / "credit_card_transactions.csv"
SILVER_PARQUET = SILVER_DIR / "fraud_clean.parquet"

MAX_ROWS = 5000
FRAUD_RATE = 0.15
RANDOM_SEED = 42

CATEGORIES = [
    "shopping_net",
    "grocery_pos",
    "misc_net",
    "shopping_pos",
    "gas_transport",
    "home",
    "food_dining",
    "entertainment",
    "personal_care",
    "health_fitness",
    "travel",
    "kids_pets",
    "misc_pos",
]

STATES = ["CA", "NY", "TX", "FL", "IL", "WA", "GA", "OH", "PA", "NC"]
CITIES = {
    "CA": "Los Angeles",
    "NY": "New York",
    "TX": "Houston",
    "FL": "Miami",
    "IL": "Chicago",
    "WA": "Seattle",
    "GA": "Atlanta",
    "OH": "Columbus",
    "PA": "Philadelphia",
    "NC": "Charlotte",
}
