"""Taban görüntü: B-roll kliplerini zaman çizelgesine döşer (montaj) ya da konuşan kafanın
belirli aralıklarına ara görüntü koyar (karışık). Çıktı sözleşmesi aynı: $WORK/face/%04d.jpg
Girdi: timeline.json -> base.clips [{clip, f0, f1, in, speed, move|kb, focus, fade}], broll/index.json
  move: push-in (varsayılan) | pull-out | pan-left | pan-right | static ; kb: {"from":[s,cx,cy],"to":[s,cx,cy]} elle
Ken Burns PIL ile alt-piksel hassas (EXTENT dönüşümü): ffmpeg zoompan titremesi yok.
"""
import json, math, os, shutil, subprocess, tempfile
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
from PIL import Image
from common import w

tl = json.load(open(w("timeline.json")))
base = tl.get("base")
if not base or not base.get("clips"):
    raise SystemExit(0)                                          # konuşan kafa: yapılacak bir şey yok
SZ = tl.get("src") or {"w": 1440, "h": 2560}
W, H, FPS, NF = SZ["w"], SZ["h"], tl["fps"], tl["frames"]
idx = {c["id"]: c for c in json.load(open(w("broll/index.json")))}
face = Path(w("face"))
if base["kind"] == "montage":
    shutil.rmtree(face, ignore_errors=True); face.mkdir()
MOVES = {"push-in": ([1.0, .5, .5], [1.08, .5, .5]), "pull-out": ([1.08, .5, .5], [1.0, .5, .5]),
         "pan-left": ([1.07, .56, .5], [1.07, .44, .5]), "pan-right": ([1.07, .44, .5], [1.07, .56, .5]),
         "static": ([1.0, .5, .5], [1.0, .5, .5])}
ease = lambda u: .5 - .5 * math.cos(math.pi * u)                  # inOutSine: Ken Burns yumuşak başlar/biter
MARGIN = 1.2                                                      # yakınlaşma payı için kaynak 1.2x büyük çıkarılır

def build(k):
    """Bir klibin karelerini üretir (paralel çalışır). Döner: son kare yolu."""
    c = base["clips"][k]
    if c["clip"] not in idx: raise SystemExit(f"index.json'da klip yok: {c['clip']} (önce ./studyo scan <slug>)")
    ci = idx[c["clip"]]
    n, speed, t_in = c["f1"] - c["f0"], float(c.get("speed", 1.0)), float(c.get("in", 0))
    need = n / FPS * speed
    warn = f"UYARI: {c['clip']} {t_in:.2f}+{need:.2f}s > süre {ci['dur']:.2f}s — son kare dondurulur" if t_in + need > ci["dur"] + .05 else ""
    kf = max(W / ci["w"], H / ci["h"]) * MARGIN                  # kaplama ölçeği x pay
    ew, eh = round(ci["w"] * kf / 2) * 2, round(ci["h"] * kf / 2) * 2
    tmp = Path(tempfile.mkdtemp(dir=w(".")))
    # -t çıktı süresidir (setpts sonrası): ağır çekimde (hız < 1) kaynak süresi + 1 s yetmez
    vf = f"setpts=PTS/{speed},fps={FPS},scale={ew}:{eh}:flags=lanczos,tpad=stop_mode=clone:stop_duration=3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t_in:.3f}", "-i", ci["src"], "-t", f"{max(need, n / FPS) + 1:.3f}",
                    "-vf", vf, "-frames:v", str(n), "-q:v", "2", str(tmp / "%05d.jpg")], check=True)
    frames = sorted(tmp.iterdir())
    if len(frames) < n: raise SystemExit(f"{c['clip']}: {len(frames)}/{n} kare çıkarılabildi")
    k0, k1 = (c["kb"]["from"], c["kb"]["to"]) if "kb" in c else MOVES[c.get("move", "push-in")]
    fx, fy = c.get("focus", [.5, .5])
    for i, fp in enumerate(frames[:n]):
        u = ease(i / max(1, n - 1))
        s = k0[0] + (k1[0] - k0[0]) * u
        cx = (k0[1] + (k1[1] - k0[1]) * u) + (fx - .5)
        cy = (k0[2] + (k1[2] - k0[2]) * u) + (fy - .5)
        im = Image.open(fp).convert("RGB")
        vw, vh = min(W * MARGIN / s, ew), min(H * MARGIN / s, eh)  # pencere (çıkarılmış görüntüde)
        x0 = min(max(cx * ew - vw / 2, 0), ew - vw); y0 = min(max(cy * eh - vh / 2, 0), eh - vh)
        im.transform((W, H), Image.Transform.EXTENT, (x0, y0, x0 + vw, y0 + vh), Image.Resampling.BICUBIC) \
          .save(face / f"{c['f0'] + i + 1:04d}.jpg", quality=92)
    shutil.rmtree(tmp)
    return f"{c['clip']:20s} kare {c['f0']}-{c['f1']} ({n/FPS:.2f}s) giriş {t_in:.2f}s hız {speed} {c.get('move', 'kb' if 'kb' in c else 'push-in')}" + (f"\n{warn}" if warn else "")


from arac import pool
with pool(min(8, os.cpu_count() or 4)) as ex:   # fork: modül yeniden çalışmaz (Windows: iş parçacığı)
    for line in ex.map(build, range(len(base["clips"]))): print(line)

# çapraz geçiş (fade): klibin ilk kareleri önceki klibin son karesiyle karışır (sırayla, üretimden sonra)
for k, c in enumerate(base["clips"]):
    fade = int(round(float(c.get("fade", 0)) * FPS))
    if not fade or c["f0"] == 0: continue
    prev = Image.open(face / f"{c['f0']:04d}.jpg").convert("RGB")
    for i in range(min(fade, c["f1"] - c["f0"])):
        fp = face / f"{c['f0'] + i + 1:04d}.jpg"
        Image.blend(prev, Image.open(fp).convert("RGB"), (i + 1) / (fade + 1)).save(fp, quality=92)

cnt = len(list(face.glob("*.jpg")))
print("taban kareler:", cnt, "beklenen:", NF)
assert cnt == NF, "kare sayısı tutmuyor (montajda klipler 0..video sonu boşluksuz olmalı)"
