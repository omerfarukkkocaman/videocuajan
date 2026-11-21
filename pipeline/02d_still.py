"""Saf animasyon (kind: anim) için taban kare: work/still.jpg (marka zemin renginde, hafif dikey degrade).
plan.base_still verilmişse (proje klasörüne göre yol, ör. "gorsel/zemin.jpg") o kullanılır, bu adım bir şey yapmaz.
"""
import json
from pathlib import Path
from PIL import Image
from common import w, load_plan, ROOT

plan = load_plan()
tl = json.load(open(w("timeline.json"), encoding="utf-8"))
if (tl.get("base") or {}).get("kind") != "anim" or plan.get("base_still"):
    raise SystemExit(0)
S = tl.get("src") or {"w": 1440, "h": 2560}
bj = ROOT / "brands" / (plan.get("brand") or "_yok") / "brand.json"
col = (json.load(open(bj, encoding="utf-8")).get("colors", {}) if bj.exists() else {})
hexc = plan.get("bg") or col.get("navy") or col.get("ink") or "#0B1F33"
c = tuple(int(hexc.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
top = tuple(min(255, int(v * 1.25 + 8)) for v in c)
im = Image.new("RGB", (S["w"], S["h"]))
px = [tuple(round(top[k] + (c[k] - top[k]) * y / (S["h"] - 1)) for k in range(3)) for y in range(S["h"])]
for y, p in enumerate(px): im.paste(p, (0, y, S["w"], y + 1))
im.save(w("still.jpg"), quality=92)
print("taban kare:", w("still.jpg"), hexc)
