"""Ortak yollar: her video projects/<slug>/ altında yaşar.
P=projects/<slug> ortam değişkeni proje klasörünü, WORK ise ara dosyaları gösterir.
"""
import json, os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if "P" not in os.environ and "WORK" not in os.environ:
    raise SystemExit("P=projects/<slug> ortam değişkeni gerekli (./studyo kullan)")
P = Path(os.environ.get("P") or Path(os.environ["WORK"]).parent)
if not P.is_absolute(): P = ROOT / P
WORK = Path(os.environ.get("WORK", P / "work"))
if not WORK.is_absolute(): WORK = ROOT / WORK
WORK.mkdir(parents=True, exist_ok=True)
FPS = 30


def load_plan():
    f = P / "plan.json"
    return json.load(open(f)) if f.exists() else {}


def w(name):  # WORK içindeki dosya yolu (str)
    return str(WORK / name)
