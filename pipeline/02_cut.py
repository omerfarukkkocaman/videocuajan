"""EDL'e göre yüz karelerini ve kesilmiş sesi üretir.
Çıktı: $WORK/face/%04d.jpg (1440x2560; plan.mirror ise yatay çevrilmiş), $WORK/voice_cut.wav (48 kHz stereo)
"""
import json, subprocess, os, shutil
from common import w, load_plan

tl = json.load(open(w("timeline.json")))
segs, fps = tl["segments"], tl["fps"]

SZ = (tl.get("src") or {"w": 1440, "h": 2560})
MONTAGE = not os.path.exists(w("src_sdr4k.mp4"))               # montaj: kamera görüntüsü yok, kareleri 02c_base üretir
if MONTAGE: print("montaj: görüntü kesimi atlandı (02c_base klipleri döşeyecek)")
else: shutil.rmtree(w("face"), ignore_errors=True); os.makedirs(w("face"))
parts, labels = [], []
for k, (a, b) in enumerate(segs):
    parts.append(f"[0:v]trim=start_frame={round(a * fps)}:end_frame={round(b * fps)},setpts=PTS-STARTPTS[v{k}]")
    labels.append(f"[v{k}]")
post = ("hflip," if tl.get("mirror") else "") + f"scale={SZ['w']}:{SZ['h']}:flags=lanczos"
vf = ";".join(parts) + f";{''.join(labels)}concat=n={len(segs)}:v=1:a=0,{post}[v]"
REORDER = any(b[0] < a[1] for a, b in zip(segs, segs[1:]))      # kurguda sıra değişti: tek geçişli filtre tamponlanır
if not MONTAGE and REORDER:
    # her parçayı ayrı (doğru konumdan) çıkar, sonra sırayla numarala; paralel
    import multiprocessing as mp, tempfile
    from concurrent.futures import ProcessPoolExecutor
    def one(k):
        a, b = segs[k]; n = round(b * fps) - round(a * fps)
        d = tempfile.mkdtemp(dir=w("."))
        pre = "hflip," if tl.get("mirror") else ""
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{round(a * fps) / fps:.4f}", "-i", w("src_sdr4k.mp4"),
                        "-frames:v", str(n), "-vf", f"{pre}scale={SZ['w']}:{SZ['h']}:flags=lanczos", "-q:v", "2",
                        os.path.join(d, "%05d.jpg")], check=True)
        return d, n
    from arac import pool
    with pool(6) as ex:
        res = list(ex.map(one, range(len(segs))))
    idx = 1
    for d, n in res:
        fs = sorted(os.listdir(d))
        assert len(fs) >= n, f"parça kare eksik: {len(fs)}/{n}"
        for f in fs[:n]:
            os.replace(os.path.join(d, f), w(f"face/{idx:04d}.jpg")); idx += 1
        shutil.rmtree(d)
    print(f"kurgu: {len(segs)} parça sırası değişmiş olarak kesildi")
if not MONTAGE and not REORDER:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", w("src_sdr4k.mp4"), "-filter_complex", vf,
                    "-map", "[v]", "-q:v", "2", w("face/%04d.jpg")], check=True)
if not MONTAGE:
    n = len(os.listdir(w("face")))
    print("yüz kareleri:", n, "beklenen:", tl["frames"])
    assert abs(n - tl["frames"]) <= 1, "kare sayısı tutmuyor"

# ses: parça başı/sonu 6 ms fade, tıklama olmasın (isteğe bağlı plan.cut.fade_out_ms: parça sonundaki nefes kuyruğu sert kesilmesin)
FO = (load_plan().get("cut", {}).get("fade_out_ms", 6)) / 1000
parts, labels = [], []
for k, (a, b) in enumerate(segs):
    d = b - a
    fo = min(FO, d / 4)
    parts.append(f"[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS,"
                 f"afade=t=in:d=0.006,afade=t=out:st={d - fo:.4f}:d={fo}[a{k}]")
    labels.append(f"[a{k}]")
af = ";".join(parts) + f";{''.join(labels)}concat=n={len(segs)}:v=0:a=1[a]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", w("audio48k.wav"), "-filter_complex", af,
                "-map", "[a]", "-c:a", "pcm_s24le", w("voice_cut.wav")], check=True)
print("voice_cut.wav ok")
