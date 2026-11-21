"""Doğal cilt rötuşu (leke / ton eşitsizliği / ince çizgi yumuşatma): taban karelerde yüz bölgesine uygulanır.

Kullanım:
  ./studyo py - pipeline/rotus.py <slug> [--guc 1.0] [--kareler 100,300] [--onizle <çıktı.jpg>]   # önizleme: önce | sonra
  ./studyo py - pipeline/rotus.py <slug> [--guc 1.0]                                               # tüm work/face karelerine yerinde uygula

Yöntem: yüz kutusu (work/face_track.json, Apple Vision) içinde ten maskesi çıkarılır (yüz ortasının renk dağılımına yakın
pikseller; saç, zemin, giysi dışarıda). Ten bölgesine kenar koruyan yumuşatma (guided filter, kılavuz = parlaklık) uygulanır:
düşük kontrastlı sapmalar (leke, ton dalgalanması, ince çizgi gölgesi) yumuşar; göz, kaş, dudak, burun gölgesi gibi güçlü
hatlar korunur. Yumuşatmanın attığı ince doku (gözenek) geri eklenir, sonuç maskeyle orijinale karıştırılır (plastik görünmez,
renk kaymaz). Filtre kareden kareye aynı olduğu için titreme yapmaz. (İlk iki deneme: bant kısma -> grileşme ve yama izi.) Plan: plan.json "rotus": {"guc": 1.0} -> ./studyo cut sonunda otomatik çalışır
(yalnız bayraklı projelerde; orijinal kareler work/face_ham/ altında saklanır, yeniden çalıştırmak güvenli).
"""
import argparse
import json
import shutil
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, uniform_filter

ROOT = Path(__file__).resolve().parent.parent


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def guided(I, p, r, eps):
    """Kenar koruyan yumuşatma (guided filter, He 2010): I kılavuz (parlaklık), p süzülecek kanal."""
    k = 2 * int(r) + 1
    mI, mp = uniform_filter(I, k), uniform_filter(p, k)
    a = (uniform_filter(I * p, k) - mI * mp) / (uniform_filter(I * I, k) - mI * mI + eps)
    return uniform_filter(a, k) * I + uniform_filter(mp - a * mI, k)


def retouch(im, box, guc=1.0):
    """im: PIL RGB; box: (x0, x1, y0, y1) yüz kutusu 0-1. Döner: PIL RGB."""
    W, H = im.size
    x0, x1, y0, y1 = box
    fw, fh = (x1 - x0) * W, (y1 - y0) * H
    if fw < 40:
        return im
    cx, cy = (x0 + x1) / 2 * W, (y0 + y1) / 2 * H
    L, R = int(max(0, cx - fw * 1.0)), int(min(W, cx + fw * 1.0))        # çalışma penceresi: alın ve boyun da girsin
    T, B = int(max(0, cy - fh * 1.25)), int(min(H, cy + fh * 1.45))
    a = np.asarray(im.crop((L, T, R, B)), np.float32) / 255.0
    Y = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    Cb, Cr = (a[..., 2] - Y) * 0.564, (a[..., 0] - Y) * 0.713
    h, w = Y.shape
    yy, xx = np.mgrid[0:h, 0:w]
    ex, ey = (xx - (cx - L)) / (fw * 0.5), (yy - (cy - T)) / (fh * 0.5)
    core = (ex ** 2 + ey ** 2) < 0.35                                    # ten referansı: yüz ortası (yanak/burun) medyanı
    mY, mCb, mCr = np.median(Y[core]), np.median(Cb[core]), np.median(Cr[core])
    dC = np.sqrt((Cb - mCb) ** 2 + (Cr - mCr) ** 2)
    skin = (1 - smoothstep(0.045, 0.09, dC)) * smoothstep(mY * 0.4, mY * 0.6, Y)
    region = 1 - smoothstep(1.1, 1.7, np.sqrt((ex / 1.05) ** 2 + (np.where(ey < 0, ey / 1.4, ey / 1.8)) ** 2))
    mask = np.clip(gaussian_filter(skin * region, fw * 0.02), 0, 1)[..., None]
    g = float(np.clip(guc, 0, 1.6))
    r, eps = fw * (0.035 + 0.015 * g), (0.035 + 0.03 * g) ** 2           # eps: bu kontrastın altındaki sapmalar (leke, ton, ince çizgi) yumuşar; güçlü hatlar kalır
    q = np.stack([guided(Y, a[..., c], r, eps) for c in range(3)], -1)
    res = a - q                                                          # yumuşatmanın attığı her şey: leke + gözenek
    fine = res - gaussian_filter(res, (fw * 0.008, fw * 0.008, 0))       # gözenek/ince doku: geri eklenir (plastik görünmesin)
    out = np.clip(q + 0.9 * fine, 0, 1)
    k = min(1.0, 0.55 + 0.3 * g)
    res2 = a * (1 - k * mask) + out * (k * mask)
    o = im.copy()
    o.paste(Image.fromarray((res2 * 255 + 0.5).astype(np.uint8)), (L, T))
    return o


def _one(args):
    src, dst, box, guc = args
    retouch(Image.open(src).convert("RGB"), box, guc).save(dst, quality=92)
    return 1


def main():
    ap = argparse.ArgumentParser(prog="rotus")
    ap.add_argument("slug"); ap.add_argument("--guc", type=float, default=None)
    ap.add_argument("--kareler", default=""); ap.add_argument("--onizle", default="")
    a = ap.parse_args()
    P = ROOT / "projects" / a.slug; Wk = P / "work"
    plan = json.load(open(P / "plan.json"))
    guc = a.guc if a.guc is not None else float((plan.get("rotus") or {}).get("guc", 1.0))
    tr = json.load(open(Wk / "face_track.json"))
    if not tr:
        raise SystemExit("yüz takibi yok (face_track.json boş)")
    n = len(tr["x0"])
    box = lambda f: (tr["x0"][f - 1], tr["x1"][f - 1], tr["y0"][f - 1], tr["y1"][f - 1])
    face = Wk / "face"
    if a.onizle:
        fs = [int(x) for x in a.kareler.split(",")] if a.kareler else [n // 4, n // 2, 3 * n // 4]
        rows = []
        for f in fs:
            src = (Wk / "face_ham" / f"{f:04d}.jpg") if (Wk / "face_ham").exists() else face / f"{f:04d}.jpg"
            im = Image.open(src).convert("RGB"); o = retouch(im, box(f), guc)
            x0, x1, y0, y1 = box(f); W, H = im.size
            cx, cy, fw = (x0 + x1) / 2 * W, (y0 + y1) / 2 * H, (x1 - x0) * W
            c = (int(cx - fw * 0.8), int(cy - fw * 1.0), int(cx + fw * 0.8), int(cy + fw * 1.0))
            row = Image.new("RGB", (1620, 1000), (0, 0, 0))
            for i, x in enumerate((im, o)):
                row.paste(x.crop(c).resize((800, 1000), Image.LANCZOS), (i * 820, 0))
            rows.append(row)
        sheet = Image.new("RGB", (1620, 1010 * len(rows)), (0, 0, 0))
        for i, r in enumerate(rows):
            sheet.paste(r, (0, i * 1010))
        sheet.save(a.onizle, quality=93); print("önizleme:", a.onizle, "(sol önce | sağ sonra)")
        return
    ham = Wk / "face_ham"
    frames = sorted(face.glob("*.jpg"))
    stamp = Wk / "rotus.json"                                  # rötuşlanmış karelerin damgası: cut yeni kare üretirse damga tutmaz -> ham kopya yenilenir
    done_before = stamp.exists() and ham.exists() and abs(json.load(open(stamp))["mtime"] - frames[0].stat().st_mtime) < 1 and len(list(ham.glob("*.jpg"))) == len(frames)
    if not done_before:
        shutil.rmtree(ham, ignore_errors=True); shutil.copytree(face, ham)
    jobs = [(str(ham / f.name), str(f), box(int(f.stem)) if int(f.stem) <= n else box(n), guc) for f in frames]
    with ProcessPoolExecutor(8) as ex:
        done = sum(ex.map(_one, jobs, chunksize=8))
    json.dump({"mtime": frames[0].stat().st_mtime, "guc": guc}, open(stamp, "w"))
    print(f"rötuş: {done} kare (güç {guc}) -> {face}")


if __name__ == "__main__":
    main()
