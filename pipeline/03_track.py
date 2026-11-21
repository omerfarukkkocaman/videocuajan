"""Yüz takibi -> kadraj verisi. Yüz kutusu (Mac: Apple Vision, diğer: OpenCV YuNet; pipeline/arac.py) bulunur, her çıktı karesine
interpolasyon + kesim parçası içinde yumuşatma uygulanır (kadraj titremez, kesimler arası kaymaz).
Çıktı: $WORK/face_track.json  {"cx":[...], "top":[...], "y0":[...], "y1":[...]}  (kare başına, 0-1 kaynak oranı)
  top = saç üstü tahmini (yüz kutusu üstü - 0.62 x yüz yüksekliği; QA ölçümüyle ayarlandı), y1 = çene/sakal altı.
"""
import json, subprocess
import numpy as np
from common import w, ROOT

from arac import facetrack_cmd

tl = json.load(open(w("timeline.json")))
N = tl["frames"]
if (tl.get("base") or {}).get("kind") in ("montage", "anim"):      # montaj / saf animasyon: konuşan yüz yok
    json.dump({}, open(w("face_track.json"), "w")); print("montaj: yüz takibi atlandı"); raise SystemExit
raw = json.loads(subprocess.run([*facetrack_cmd(), w("face"), "2"], capture_output=True, check=True).stdout or b"[]")
raw = [r for r in raw if r["c"] > 0.5]
cuts = tl.get("cutaways") or []                                      # karışık: ara görüntü karelerini takipten çıkar
raw = [r for r in raw if not any(a <= r["f"] < b for a, b in cuts)]
if len(raw) < 3:
    print("UYARI: yüz bulunamadı, kadraj varsayılanla yapılacak"); json.dump({}, open(w("face_track.json"), "w")); raise SystemExit

f = np.array([r["f"] for r in raw])
cols = {k: np.interp(np.arange(N), f, [r[k] for r in raw]) for k in ("x0", "y0", "x1", "y1")}
h = cols["y1"] - cols["y0"]
# saç payı 0.62 x yüz yüksekliği: kabarık saçta da güvenli (QA ölçümü)
track = {"cx": (cols["x0"] + cols["x1"]) / 2, "top": cols["y0"] - 0.62 * h, "y0": cols["y0"], "y1": cols["y1"],
         "x0": cols["x0"], "x1": cols["x1"]}                       # x0/x1: mikro animasyonlar yüzün yanına yerleşir

# kesim parçası sınırları (jump cut) -> her parçayı kendi içinde 0.8 s pencereyle yumuşat
bounds = [0] + [round(j * tl["fps"]) for j in tl["jumps"]] + [N]
win = int(0.8 * tl["fps"]) | 1
for k, v in track.items():
    out = v.copy()
    for a, b in zip(bounds, bounds[1:]):
        seg = v[a:b]
        if len(seg) < 3: continue
        pad = np.pad(seg, win // 2, mode="edge")
        out[a:b] = np.convolve(pad, np.ones(win) / win, mode="valid")[:len(seg)]
    track[k] = [round(float(x), 4) for x in out]
json.dump(track, open(w("face_track.json"), "w"))
print(f"yüz takibi: {len(raw)} örnek -> {N} kare | saç üstü medyan {np.median(track['top']):.3f}, "
      f"yüz merkezi x {np.median(track['cx']):.3f}, çene {np.median(track['y1']):.3f}")
