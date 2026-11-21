"""İsteğe bağlı: insan maskesi (kişiyi arka plandan ayırma) — plan.matte true ise çalışır.
Girdi : $WORK/face/%04d.jpg (02_cut)
Çıktı : $WORK/matte/%04d.png (gri, beyaz = kişi; genişlik plan.matte_width, vars. 720)
        Titreme olmasın diye komşu karelerle zamansal yumuşatma (±1 kare, ağırlık .25/.5/.25) + hafif kenar yumuşatma.
Motor tarafı: video.js'te V.matte ile 'kişinin arkası' katmanı kullanılır (plan-ve-sahne.md).
"""
import json, os, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from common import w, load_plan

ROOT = Path(__file__).resolve().parent.parent
from arac import personmatte_cmd
plan = load_plan()
if not plan.get("matte"):
    print("matte kapalı (plan.matte yok) — atlandı"); sys.exit(0)
width = str(plan.get("matte_width", 720))
raw = Path(w("matte_raw")); out = Path(w("matte"))
for d in (raw, out):
    d.mkdir(exist_ok=True)
    for f in d.glob("*.png"): f.unlink()
subprocess.run([*personmatte_cmd(), w("face"), str(raw), width, plan.get("matte_quality", "accurate")], check=True)
files = sorted(raw.glob("*.png"))
load = lambda p: np.asarray(Image.open(p), dtype=np.float32)
# isteğe bağlı plan.matte_fill (ör. .006): kişi siluetinin İÇİNDE kalan kapalı delikleri doldur (alan < matte_fill × kare).
# Vision, gövdenin önündeki elin parmak halkasının içini (aslında kazak) arka plan sayabiliyor -> oda kararınca/ipekte delikten
# zemin görünüyordu (deneyimde görüldü). Büyük boşluklar (kol-gövde arası gerçek oda) eşik sayesinde dokunulmaz.
# Verilmezse kod yolu birebir aynı.
#   Delik çoğu zaman ikili değil YARI SAYDAMDIR (hareket bulanıklığındaki el, yaka mikrofonu: alfa ~.4-.8). Bu yüzden:
#   siluet = alfa > 64; küçük kapalı delikleri doldur; siluetin kenardan `matte_fill_edge` px (vars. 6, maske genişliğinde)
#   içerisi tam opak (yalnız yükseltir). Dış kenarın yumuşaklığı ve büyük gerçek boşluklar korunur.
FILL = float(plan.get("matte_fill") or 0)
if FILL > 0:
    from scipy import ndimage
    EDGE = int(plan.get("matte_fill_edge", 6))
    def _fill(a):
        b = a > 64
        filled = b | (lambda h: (lambda lab, n: np.isin(lab, 1 + np.flatnonzero(ndimage.sum(h, lab, range(1, n + 1)) < FILL * a.size)) if n else h & False)(*ndimage.label(h)))(ndimage.binary_fill_holes(b) & ~b)
        inner = ndimage.binary_erosion(filled, iterations=EDGE)
        return np.where(inner, 255.0, a).astype(np.float32)
    load = lambda p: _fill(np.asarray(Image.open(p), dtype=np.float32))
# kesim sınırları (çıkış kare indeksi; yeni parçanın ilk karesi): yumuşatma sınırı aşmaz, yoksa komşu çekimin silueti
# %25 sızar ve stüdyo zemininde (oda söndüğünde) kesimin iki yanındaki karelerde saç çevresinde hayalet hale görünür
cuts = set()
try:
    tl = json.load(open(w("timeline.json")))
    acc = 0.0
    for a, b in tl.get("segments", [])[:-1]:
        acc += b - a; cuts.add(int(round(acc * 30)))
    cuts |= {int(round(j * 30)) for j in tl.get("jumps", [])}
except Exception:
    pass
cache = {}
def get(i):
    if i not in cache: cache[i] = load(files[i])
    for k in [k for k in cache if k < i - 1]: del cache[k]
    return cache[i]
for i, p in enumerate(files):
    cur = get(i)
    pv = get(i - 1) if i > 0 and i not in cuts else cur
    nx = get(i + 1) if i + 1 < len(files) and (i + 1) not in cuts else cur
    m = .25 * pv + .5 * cur + .25 * nx
    Image.fromarray(np.clip(m, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)).save(out / p.name, optimize=False)
for f in raw.glob("*.png"): f.unlink()
raw.rmdir()
print(f"maske: {len(files)} kare -> {out}")
