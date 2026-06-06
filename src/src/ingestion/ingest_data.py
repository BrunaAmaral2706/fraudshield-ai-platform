"""Legacy wrapper — use ml/pipelines/ingest_data.py"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
script = ROOT / "ml" / "pipelines" / "ingest_data.py"
sys.exit(subprocess.call([sys.executable, str(script)], cwd=str(ROOT)))
