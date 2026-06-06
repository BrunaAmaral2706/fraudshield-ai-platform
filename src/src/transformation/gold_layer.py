"""Legacy wrapper — use ml/pipelines/gold_layer.py"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
script = ROOT / "ml" / "pipelines" / "gold_layer.py"
sys.exit(subprocess.call([sys.executable, str(script)], cwd=str(ROOT)))
