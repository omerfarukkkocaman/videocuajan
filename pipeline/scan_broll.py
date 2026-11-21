"""B-roll klip tarayıcı: yönetmen (Claude) klipleri görüp seçebilsin diye dizin + kontak sayfaları.
Girdi : $WORK/inbox.json (prep üretir) -> broll klipleri
Çıktı : $WORK/broll/index.json  [{id, file, src, dur, w, h, fps, orient, hdr, motion, faces, bright, thumbs}]
        $WORK/broll/sheets/<id>.jpg   (8 kare, zaman etiketli)
        $WORK/broll/overview_<n>.jpg  (8 klip/sayfa: baş-orta-son)
HDR (iPhone HLG/Dolby Vision) klipler SDR'a (Mac: avconvert, diğer: ffmpeg ton eşleme) çevrilir: $WORK/broll/src/<id>.mp4
"""
import json, re, shutil, subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from common import w, ROOT

D = Path(w("broll")); (D / "src").mkdir(parents=True, exist_ok=True); (D / "sheets").mkdir(exist_ok=True)
FONT = ImageFont.truetype(str(ROOT / "assets/fonts/Montserrat.ttf"), 22)
from arac import facetrack_cmd, to_sdr
ib = json.load(open(w("inbox.json")))


def probe(f):
    r = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                   "stream=width,height,r_frame_rate,color_transfer:stream_side_data=rotation:format=duration",
                                   "-of", "json", str(f)], capture_output=True, text=True).stdout)
    s = r["streams"][0]; w_, h_ = s["width"], s["height"]
    rot = next((abs(int(x.get("rotation", 0))) for x in s.get("side_data_list", []) if "rotation" in x), 0)
    if rot in (90, 270): w_, h_ = h_, w_
    n, d = s.get("r_frame_rate", "30/1").split("/")
    return {"w": w_, "h": h_, "fps": round(float(n) / float(d or 1), 3), "dur": float(r["format"]["duration"]),
            "hdr": s.get("color_transfer") in ("arib-std-b67", "smpte2084")}


index, used = [], set()
for c in ib.get("clips", []):
    f = Path(c["file"])
    cid = re.sub(r"[^a-z0-9]+", "-", f.stem.lower()).strip("-") or "klip"
    while cid in used: cid += "x"
    used.add(cid)
    info = probe(f)
    src = f
    if info["hdr"]:                                            # HDR -> SDR (Apple ton eşleme), döndürme uygulanır
        src = D / "src" / f"{cid}.mp4"
        if not src.exists():
            to_sdr(f, src)
    dur = info["dur"]
    ts = [round(dur * (i + .5) / 8, 2) for i in range(8)]
    tdir = D / "thumbs" / cid; shutil.rmtree(tdir, ignore_errors=True); tdir.mkdir(parents=True)
    for i, t in enumerate(ts):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", str(src), "-frames:v", "1",
                        "-vf", "scale=-2:480", str(tdir / f"{i:02d}.jpg")], check=True)
    ims = [Image.open(tdir / f"{i:02d}.jpg").convert("RGB") for i in range(8)]
    g = [np.asarray(im.convert("L").resize((64, 64)), float) for im in ims]
    motion = float(np.mean([np.abs(a - b).mean() for a, b in zip(g, g[1:])]))   # kareler arası ortalama fark
    bright = float(np.mean([x.mean() for x in g]))
    faces = 0
    if True:
        r = subprocess.run([*facetrack_cmd(), str(tdir), "1"], capture_output=True)
        faces = len([x for x in json.loads(r.stdout or b"[]") if x["c"] > .6])   # yüz görünen örnek sayısı (0-8)
    # kontak sayfası: 4x2, başlıkta id · süre · boyut · fps · yön
    tw = ims[0].width; th = ims[0].height
    S = Image.new("RGB", (4 * tw, 2 * th + 40), (20, 20, 20)); dr = ImageDraw.Draw(S)
    dr.text((10, 8), f"{cid} · {dur:.1f}s · {info['w']}x{info['h']} · {info['fps']}fps · {'dikey' if info['h'] >= info['w'] else 'yatay'}"
            f"{' · HDR' if info['hdr'] else ''}", fill="yellow", font=FONT)
    for i, (im, t) in enumerate(zip(ims, ts)):
        x, y = (i % 4) * tw, 40 + (i // 4) * th
        S.paste(im, (x, y)); dr.rectangle((x, y, x + 90, y + 28), fill="black"); dr.text((x + 6, y + 2), f"t={t}s", fill="white", font=FONT)
    S.save(D / "sheets" / f"{cid}.jpg", quality=85)
    index.append({"id": cid, "file": str(f), "src": str(src), **info, "orient": "v" if info["h"] >= info["w"] else "h",
                  "motion": round(motion, 1), "bright": round(bright, 1), "faces": faces, "thumbs": ts,
                  "sheet": str(D / "sheets" / f"{cid}.jpg"), "desc": ""})
    print(f"{cid:20s} {dur:5.1f}s {info['w']}x{info['h']} {'HDR' if info['hdr'] else 'SDR'} hareket {motion:4.1f} yüz {faces}/8")

# genel bakış: sayfa başına 8 klip, her klipten baş-orta-son
for p in range(0, len(index), 8):
    rows = index[p:p + 8]
    tw, th = 160, 284
    S = Image.new("RGB", (4 * (3 * tw + 20), 2 * (th + 36)), (20, 20, 20)); dr = ImageDraw.Draw(S)
    for k, c in enumerate(rows):
        ox, oy = (k % 4) * (3 * tw + 20), (k // 4) * (th + 36)
        dr.text((ox + 4, oy + 6), f"{c['id']} ({c['dur']:.1f}s)", fill="yellow", font=FONT)
        for j, i in enumerate((0, 4, 7)):
            im = Image.open(D / "thumbs" / c["id"] / f"{i:02d}.jpg").convert("RGB")
            im = im.resize((tw, round(im.height * tw / im.width))) if im.width > im.height else im.resize((round(im.width * th / im.height), th))
            S.paste(im.crop((0, 0, tw, th)), (ox + j * tw, oy + 36))
    S.save(D / f"overview_{p // 8}.jpg", quality=85)

old = {c["id"]: c for c in json.load(open(D / "index.json"))} if (D / "index.json").exists() else {}
for c in index: c["desc"] = old.get(c["id"], {}).get("desc", "")          # yönetmenin açıklamaları korunur
json.dump(index, open(D / "index.json", "w"), ensure_ascii=False, indent=1)
print(f"-> {D}/index.json, sheets/, overview_*.jpg ({len(index)} klip)")
