"""Proje klasörünü tarar: tür (face/montage/mixed/anim), yön, dosyalar, konu.
anim: yalnız seslendirme (ses/) ya da hiçbir medya yok (yalnız konu.txt) -> saf animasyon videosu.
Kullanım: ./studyo py - pipeline/inbox.py input/<proje>   -> JSON (stdout)

input/<proje>/
  konu.txt   (isteğe bağlı)   video/ (konuşan kafa)   ses/ (seslendirme)   broll/ (klipler)   gorsel/
Tek bir video dosyası doğrudan input/ altındaysa (eski düzen) konuşan kafa sayılır.
"""
import json, re, subprocess, sys
from pathlib import Path

VID = {".mov", ".mp4", ".m4v", ".mkv"}
AUD = {".m4a", ".wav", ".mp3", ".aac", ".caf", ".aiff"}


def probe(f):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                        "stream=width,height:stream_side_data=rotation:format=duration", "-of", "json", str(f)],
                       capture_output=True, text=True)
    d = json.loads(r.stdout or "{}")
    s = (d.get("streams") or [{}])[0]
    w, h = s.get("width", 0), s.get("height", 0)
    rot = next((abs(int(x.get("rotation", 0))) for x in s.get("side_data_list", []) if "rotation" in x), 0)
    if rot in (90, 270): w, h = h, w
    return {"w": w, "h": h, "dur": float(d.get("format", {}).get("duration", 0)), "orient": "v" if h >= w else "h"}


def files(d, exts):
    return sorted(p for p in d.iterdir() if p.is_file() and p.suffix.lower() in exts and not p.name.startswith(".")) if d.is_dir() else []


src = Path(sys.argv[1])
out = {"root": str(src), "topic": "", "video": None, "voice": None, "broll": [], "images": []}
if src.is_file():
    out["video"] = str(src)
else:
    vids = files(src / "video", VID) or files(src, VID)
    vids = sorted(vids, key=lambda p: [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", p.name)])   # 1, 2, 10 doğal sıra
    out["video"] = str(vids[0]) if vids else None
    out["videos"] = [str(p) for p in vids]                                   # birden fazla çekim: prep sırayla birleştirir
    voices = files(src / "ses", AUD) or files(src, AUD)
    out["voice"] = str(voices[0]) if voices else None
    out["broll"] = [str(p) for p in files(src / "broll", VID)]
    out["images"] = [str(p) for p in files(src / "gorsel", {".png", ".jpg", ".jpeg", ".svg", ".webp"})]
    if (src / "konu.txt").exists(): out["topic"] = (src / "konu.txt").read_text().strip()
    if (src / "senaryo.md").exists(): out["script"] = str(src / "senaryo.md")      # /senaryo çıktısı (referans metin)

if out["video"] and out["broll"]: out["kind"] = "mixed"
elif out["video"]: out["kind"] = "face"
elif out["broll"]: out["kind"] = "montage"                          # seslendirme yoksa sessiz montaj (müzik + ekran yazısı)
elif out["voice"] or src.is_dir(): out["kind"] = "anim"            # saf animasyon (seslendirmeli ya da sessiz)
else: out["kind"] = "unknown"

main = out["video"] or (out["broll"][0] if out["broll"] else None)
out["orient"] = probe(main)["orient"] if main else "v"
out["clips"] = [{"file": c, **probe(c)} for c in out["broll"]]
bad = [c["file"] for c in out["clips"] if c["orient"] != out["orient"]]
if bad: out["warn"] = f"projenin yönüyle ({out['orient']}) uyuşmayan klipler: {bad}"
print(json.dumps(out, ensure_ascii=False, indent=1))
