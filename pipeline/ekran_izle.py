"""Stok klipteki beyaz telefon/dizüstü ekranının dört köşesini kare kare bulur (canlı arayüz için).

Kullanım:
  ./studyo py - pipeline/ekran_izle.py projects/<slug>/work/face <çıktı.json> <ad>:<f0>-<f1> [<ad>:<f0>-<f1> ...]

Taban karelerde (cut sonrası, Ken Burns dahil) beyaz + düşük doygunluklu en büyük bileşeni alır; köşeler x+y / x−y uç
noktalarıdır (0-1 normalize). Motor tarafında arayüz matrix3d homografisiyle oturur, luma key ile parmak önde kalır.
Ekranda yazı/arayüz varsa (beyaz değilse) bu yöntem çalışmaz: beyaz ekranlı klip seç.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


def track(face, lo, hi):
    quads = {}
    for i in range(lo, hi + 1):
        a = np.asarray(Image.open(face / f"{i:04d}.jpg").convert("RGB").resize((720, 1280)), dtype=np.int16)
        mx, mn = a.max(2), a.min(2)
        white = (mn > 200) & (mx - mn < 30)
        lab, n = ndimage.label(white)
        if not n:
            continue
        sizes = ndimage.sum(white, lab, range(1, n + 1))
        k = int(np.argmax(sizes)) + 1
        ys, xs = np.nonzero(lab == k)
        s, d = xs + ys, xs - ys
        pts = {"tl": s.argmin(), "tr": d.argmax(), "br": s.argmax(), "bl": d.argmin()}
        quads[i] = {c: [round(xs[j] / 720, 4), round(ys[j] / 1280, 4)] for c, j in pts.items()} | {"area": int(sizes[k - 1])}
    return quads


def main():
    face, out = Path(sys.argv[1]), Path(sys.argv[2])
    res = {}
    for spec in sys.argv[3:]:
        name, rng = spec.split(":")
        lo, hi = (int(x) for x in rng.split("-"))
        res[name] = {"frames": [lo, hi], "space": "0-1 normalize (taban kare)", "quads": track(face, lo, hi)}
        print(f"{name}: {len(res[name]['quads'])}/{hi - lo + 1} kare")
    out.write_text(json.dumps(res, indent=0))


if __name__ == "__main__":
    main()
