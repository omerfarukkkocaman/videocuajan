#!/usr/bin/env python3
"""Video stüdyosu komut satırı (Mac + Windows). Kullanıcı klasörü input/<proje>/ (video/ ses/ broll/ gorsel/ konu.txt),
iş alanı projects/<slug>/, çıktı output/<slug>/.

  ./studyo doktor                       -> neyin kurulu olduğunu gösterir (eksikleri söyler)
  ./studyo kur [animasyon|temel|maske|hepsi]
                                               -> .venv + Python paketleri + Node paketleri + Chromium
                                                  animasyon: yalnız animasyon/sentez müzik; temel: + konuşma (Whisper) ve yüz takibi;
                                                  maske: + kişi maskesi. (ffmpeg/Node gibi sistem araçlarını kurulum/ betikleri kurar)
  ./studyo prep    <slug> <klasör|video> [marka] [--yon v|h] [--sure 30]
                                               -> tarama, SDR, ses, transkript, hizalama, plan iskeleti
                                                  (--yon/--sure: saf animasyon için yön ve sessiz videoda süre)
  ./studyo scan    <slug>                -> B-roll klipleri: SDR, kontak sayfaları, index.json
  ./studyo cut     <slug>                -> zaman çizelgesi + taban görüntü + yüz takibi (+ isteğe bağlı maske/rötuş)
  ./studyo audio   <slug>                -> müzik + efekt + miks (plan.audio)
  ./studyo render  <slug> [fmt|all]      -> animasyon render (9x16 1x1 16x9; varsayılan plan.formats)
  ./studyo safe    <slug> [fmt|all]      -> güvenli alan denetimi (taşma varsa KALDI)
  ./studyo sheet   <slug> [adım] [fmt]   -> kontak sayfaları (QA)
  ./studyo final   <slug> [fmt|all]      -> output/<slug>/<slug>_<fmt>.mp4
  ./studyo package <slug>                -> render + safe + final, plan.formats'taki her format
  ./studyo py <slug|-> pipeline/X.py [arg...]  -> bir pipeline betiğini doğru Python ve proje ortamıyla çalıştırır
  ./studyo gorsel input/<proje> [--yon v|h] [--sure 5]
                                               -> gorsel/ içindeki fotoğrafları broll/ klibine çevirir (hikâye/montaj: Ken Burns ile döşenir)

Hangi Python ile çağrılırsa çağrılsın, .venv varsa kendini onunla yeniden başlatır.
"""
import json, os, platform, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WIN = platform.system() == "Windows"
VENV_PY = ROOT / ".venv" / ("Scripts/python.exe" if WIN else "bin/python")

# ---- .venv Python'una geç (kur/doktor hariç: onlar .venv yokken de çalışmalı)
if len(sys.argv) > 1 and sys.argv[1] not in ("kur", "doktor") and VENV_PY.exists() \
        and Path(sys.executable).resolve() != VENV_PY.resolve() and not os.environ.get("VA_NO_REEXEC"):
    os.environ["VA_NO_REEXEC"] = "1"
    sys.exit(subprocess.call([str(VENV_PY), str(ROOT / "studyo.py"), *sys.argv[1:]]))

os.chdir(ROOT)
try: sys.stdout.reconfigure(line_buffering=True, encoding='utf-8')   # alt süreç çıktılarıyla sıra karışmasın; Windows konsolunda Türkçe
except Exception: pass
sys.path.insert(0, str(ROOT / "pipeline"))
ENV = dict(os.environ, PYTHONUTF8="1", PYTHONIOENCODING="utf-8", VA_PY=sys.executable,
           TORCH_HOME=str(ROOT / ".cache/torch"))
try:
    import certifi
    ENV["SSL_CERT_FILE"] = certifi.where()
except ImportError:
    pass
PY = sys.executable


def sh(*cmd, check=True, env=None, **kw):
    r = subprocess.run([str(c) for c in cmd], env=env or ENV, **kw)
    if check and r.returncode != 0:
        raise SystemExit(f"HATA ({r.returncode}): {' '.join(str(c) for c in cmd)[:200]}")
    return r


def out(*cmd, env=None):
    return subprocess.run([str(c) for c in cmd], env=env or ENV, capture_output=True, text=True).stdout.strip()


def ffdur(f):
    return float(out("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f) or 0)


# ======================================================================== doktor / kur
# Kurulum seviyeleri (öğrencinin işine göre): animasyon < temel < hepsi
PAKET = {
    "animasyon": ["numpy", "scipy", "pillow", "certifi"],                       # saf animasyon + sentez müzik
    "temel": ["opencv-contrib-python", "openai-whisper", "torch", "torchaudio"],  # + konuşma/seslendirme (Whisper), yüz takibi
    "maske": ["mediapipe"],                                                       # + kişi maskesi (grafik kişinin arkasından)
}
SEVIYE = {"animasyon": ["animasyon"], "temel": ["animasyon", "temel"], "maske": ["animasyon", "temel", "maske"],
          "hepsi": ["animasyon", "temel", "maske"]}


def doktor():
    """Kurulu olanları seviye seviye gösterir: animasyon / temel (konuşma) / maske."""
    def isaret(v): return "✔" if v else "✘"
    print(f"Sistem: {platform.system()} {platform.machine()}  Python {platform.python_version()}")
    sistem = {"ffmpeg / ffprobe": bool(shutil.which("ffmpeg") and shutil.which("ffprobe")), "Node.js": bool(shutil.which("node")),
              ".venv (Python ortamı)": VENV_PY.exists(), "playwright + Chromium": (ROOT / "node_modules/playwright").exists()}
    for k, v in sistem.items(): print(f"  {isaret(v)} {k}")
    mods = {}
    if VENV_PY.exists():
        code = ("import importlib.util as u,json;print(json.dumps({k:bool(u.find_spec(k)) for k in "
                "['numpy','scipy','PIL','certifi','cv2','whisper','torch','torchaudio','mediapipe']}))")
        try: mods = json.loads(out(VENV_PY, "-c", code) or "{}")
        except ValueError: mods = {}
    need = {"animasyon": ["numpy", "scipy", "PIL", "certifi"], "temel": ["cv2", "whisper", "torch", "torchaudio"], "maske": ["mediapipe"]}
    base_ok = all(sistem.values())
    hazir = {}
    acc = base_ok
    for lv in ("animasyon", "temel", "maske"):
        acc = acc and all(mods.get(m) for m in need[lv]); hazir[lv] = acc
    print("Seviyeler:")
    print(f"  {isaret(hazir['animasyon'])} animasyon  (saf animasyon, sentez müzik)")
    print(f"  {isaret(hazir['temel'])} temel      (+ konuşan video / seslendirme: Whisper, yüz takibi)")
    print(f"  {isaret(hazir['maske'])} maske      (+ kişi maskesi: grafik kişinin arkasından; isteğe bağlı)")
    if shutil.which("ffmpeg") and not (platform.system() == "Darwin" and shutil.which("avconvert")):   # Mac'te HDR'ı avconvert çevirir
        z = " zscale " in out("ffmpeg", "-hide_banner", "-filters")
        print(f"  {'✔' if z else '·'} ffmpeg zscale (iPhone HDR videolarında doğru renk)" + ("" if z else "  -> tam ffmpeg sürümü önerilir"))
    if platform.system() == "Darwin":
        print(f"  {'✔' if shutil.which('swiftc') else '·'} Apple Vision araçları (swiftc)"
              + ("" if shutil.which("swiftc") else "  -> xcode-select --install (yoksa OpenCV yedeği kullanılır)"))
    eksik = [k for k, v in sistem.items() if not v]
    if eksik: print("Eksik sistem parçaları:", ", ".join(eksik), "-> kurulum/kur_mac.sh | kurulum/kur_windows.ps1, sonra ./studyo kur <seviye>")
    print("SONUÇ:", "HAZIR (" + ", ".join(k for k, v in hazir.items() if v) + ")" if hazir["animasyon"] else "EKSİK VAR")
    return 0 if hazir["animasyon"] else 1


def kur(hangi="temel"):
    base = shutil.which("uv")
    if not VENV_PY.exists():
        print("· .venv oluşturuluyor (Python 3.12)")
        if base:
            sh(base, "venv", "--python", "3.12", ROOT / ".venv", env=dict(os.environ))
        else:
            sh(sys.executable, "-m", "venv", ROOT / ".venv", env=dict(os.environ))
    if hangi not in SEVIYE: raise SystemExit(f"bilinmeyen seviye: {hangi} (animasyon | temel | maske | hepsi)")
    pk = [x for k in SEVIYE[hangi] for x in PAKET[k]]
    print("· Python paketleri:", " ".join(pk))
    if base:
        sh(base, "pip", "install", "--python", VENV_PY, *pk, env=dict(os.environ))
    else:
        sh(VENV_PY, "-m", "pip", "install", "-q", "--upgrade", "pip", env=dict(os.environ))
        sh(VENV_PY, "-m", "pip", "install", *pk, env=dict(os.environ))
    if not (ROOT / "node_modules/playwright").exists() or hangi != "maske":
        npm = shutil.which("npm")
        if not npm: raise SystemExit("npm yok: önce Node.js kurulmalı (kurulum/ betiği)")
        print("· Node paketleri + Chromium")
        sh(npm, "install", "--no-audit", "--no-fund", env=dict(os.environ))
        npx = shutil.which("npx")
        sh(npx, "playwright", "install", "chromium", env=dict(os.environ))
    print("kurulum bitti. Kontrol: ./studyo doktor")


# ======================================================================== proje komutları
def proj(slug):
    P = ROOT / "projects" / slug; W = P / "work"
    W.mkdir(parents=True, exist_ok=True); (ROOT / "output" / slug).mkdir(parents=True, exist_ok=True)
    ENV.update(P=str(P), WORK=str(W))
    return P, W


def plan(P):
    f = P / "plan.json"
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}


def fmts(P, want="all"):
    return [want] if want and want != "all" else (plan(P).get("formats") or ["9x16"])


def fvid(W, f):
    return W / "video_noaudio.mp4" if f == "9x16" else W / "fmt" / f / "video_noaudio.mp4"


def pyrun(script, *args, check=True):
    return sh(PY, ROOT / "pipeline" / script, *args, check=check)


def prep(slug, src, brand="", yon=None, sure=30.0):
    import arac
    P, W = proj(slug)
    S = Path(src)
    if not S.exists(): raise SystemExit(f"klasör/video yok: {src}")
    if S.is_file() and S.parent.resolve() == (ROOT / "input").resolve():           # input/'a klasörsüz bırakılan video
        d = ROOT / "input" / slug / "video"; d.mkdir(parents=True, exist_ok=True)
        S = Path(shutil.move(str(S), d / S.name)).parent.parent
        print(f"video {d} altına taşındı")
    ib_txt = out(PY, ROOT / "pipeline/inbox.py", S)
    (W / "inbox.json").write_text(ib_txt, encoding="utf-8")
    ib = json.loads(ib_txt)
    kind, video, voice = ib["kind"], ib.get("video") or "", ib.get("voice") or ""
    print(f"tür: {kind}  video: {video or 'yok'}  ses: {voice or 'yok'}")
    if ib.get("warn"): print("UYARI:", ib["warn"])
    if kind == "unknown": raise SystemExit("klasörde video/ veya ses/+broll/ bulunamadı")
    if yon in ("v", "h"): ib["orient"] = yon
    silent = kind in ("anim", "montage") and not voice      # sessiz animasyon / sessiz montaj
    vids = ib.get("videos") or []
    src4k = W / "src_sdr4k.mp4"
    if video and len(vids) > 1:                       # birden fazla çekim: her biri SDR + 30 fps, sonra ad sırasıyla birleştir
        (W / "parts").mkdir(exist_ok=True); lst = []
        for i, V in enumerate(vids, 1):
            part = W / "parts" / f"p{i}.mp4"
            if not part.exists() or part.stat().st_size == 0 or Path(V).stat().st_mtime > part.stat().st_mtime:
                print(f"çekim {i}/{len(vids)}: {V}")
                sdr = W / "parts" / f"sdr{i}.mp4"
                arac.to_sdr(V, sdr)
                sh("ffmpeg", "-v", "error", "-y", "-i", sdr, "-vf", "fps=30", *arac.h264_fast(),
                   "-c:a", "aac", "-b:a", "256k", "-ar", "48000", part)
                sdr.unlink(missing_ok=True)
            lst.append(part.resolve())
        (W / "parts/list.txt").write_text("".join(f"file '{p.as_posix()}'\n" for p in lst), encoding="utf-8")
        sh("ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", W / "parts/list.txt", "-c", "copy", src4k)
        t, info = 0.0, []
        for p in lst:
            d = ffdur(p); info.append({"file": str(p), "start": round(t, 3), "dur": round(d, 3)}); t += d
        (W / "parts/parts.json").write_text(json.dumps(info, indent=1), encoding="utf-8")
        print("birleştirildi:", [(o["start"], o["dur"]) for o in info])
        video = str(src4k)
    if video:
        if len(vids) <= 1 and (not src4k.exists() or src4k.stat().st_size == 0 or Path(video).stat().st_mtime > src4k.stat().st_mtime):
            arac.to_sdr(video, src4k)                                         # HDR->SDR + döndürme
        fr = out("ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", src4k).split(",")[0]
        if fr != "30/1":                                                      # motor 30 fps
            print(f"kaynak {fr} fps -> 30 fps'e çevriliyor")
            tmp = W / "src_30.mp4"
            sh("ffmpeg", "-v", "error", "-y", "-i", src4k, "-vf", "fps=30", *arac.h264_fast(), "-c:a", "copy", tmp)
            tmp.replace(src4k)
        audio_src = voice or video                                            # karışıkta ayrı seslendirme varsa o
    elif silent:                                                              # sessiz animasyon/montaj: süre --sure ile
        audio_src = W / "sessiz.wav"
        sh("ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", f"{sure + 1}", audio_src)
    else:
        audio_src = voice                                                     # montaj / anim: seslendirme dosyası
    sh("ffmpeg", "-v", "error", "-y", "-i", audio_src, "-vn", "-ac", "1", "-ar", "16000", W / "audio16k.wav")
    sh("ffmpeg", "-v", "error", "-y", "-i", audio_src, "-vn", "-ac", "2", "-ar", "48000", "-c:a", "pcm_s24le", W / "audio48k.wav")
    if not (P / "plan.json").exists():
        sk = {"slug": slug, "source": ib["video"] or ib["voice"], "folder": ib["root"], "brand": brand, "lang": "tr",
              "topic": ib["topic"], "whisper_prompt": "Instagram, takip edin.",
              "kind": kind, "orient": ib["orient"], "formats": ["9x16" if ib["orient"] == "v" else "16x9"],
              "captions": "vurgulu", "density": "sahne",
              "mirror": False, "face": {"fx": 0.5, "fy": 0.52}, "cut": {"tail": 0.10, "pre": 0.06, "pre_vowel": 0.10, "min_cut": 0.12},
              "end_card": 1.1333, "fixes": {}, "chunks": [], "cues": {}, "audio": {"sections": [], "events": []},
              **({"base": {"kind": kind, "clips": []}} if kind in ("montage", "mixed") else {})}
        if silent:
            sk.update(captions="yok", cut={**sk["cut"], "src_start": 0, "src_end": sure},
                      audio={"sections": [], "events": [], "voice": {"none": True, "music_under": 12}})
        (P / "plan.json").write_text(json.dumps(sk, ensure_ascii=False, indent=1), encoding="utf-8")
    if silent:
        (W / "transcript.json").write_text(json.dumps({"text": "", "words": []}), encoding="utf-8")
        if kind == "montage": pyrun("scan_broll.py")
        print(f"-> sessiz {kind} iskeleti ({sure:.0f} s): {P}/plan.json  (montajda önce plan.base.clips yaz, sonra cut)"); return
    pyrun("transcribe.py")
    pyrun("00_align.py", check=False)
    tr = json.loads((W / "transcript.json").read_text(encoding="utf-8"))
    if not tr["words"] or "ws" not in tr["words"][0]:                         # hizalama bellek yetmezse (uzun kayıt) -> parçalı yol
        raise SystemExit(f"UYARI: 00_align çıktı yazmadı (uzun kayıt?). Parçalı yol: ./studyo py {slug} pipeline/transcribe_parca.py yazi {slug} "
                         f"&& ./studyo py {slug} pipeline/transcribe_parca.py hizala {slug}")
    pyrun("01_timeline.py")
    if src4k.exists():                                                        # ayna/yüz konumu için hızlı bakış
        sh("ffmpeg", "-v", "error", "-y", "-i", src4k, "-vf", "fps=1/4,scale=270:-1,tile=6x1", "-frames:v", "1", W / "peek.jpg")
    if kind in ("montage", "mixed"): pyrun("scan_broll.py")
    if video: pyrun("takes.py")                                               # alım analizi: tekrar çekimler, en iyi alım
    print(f"-> {W}/transcript.json, timeline.json, inbox.json, {P}/plan.json (iskelet)")


def cut(slug):
    P, W = proj(slug)
    pyrun("01_timeline.py"); pyrun("02_cut.py")
    pyrun("02c_base.py"); pyrun("02d_still.py"); pyrun("03_track.py"); pyrun("03b_matte.py")
    if plan(P).get("rotus"): pyrun("rotus.py", slug)


def final(slug, want="all"):
    import arac
    P, W = proj(slug)
    a = arac.aac(plan(P).get("aac", "aac"))
    for f in fmts(P, want):
        o = ROOT / "output" / slug / f"{slug}_{f}.mp4"
        dur = ffdur(W / "mix.wav")                                            # -shortest son kareyi düşürüyordu
        sh("ffmpeg", "-v", "error", "-y", "-i", fvid(W, f), "-i", W / "mix.wav",
           "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-profile:v", "high", "-level", "4.2",
           "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-r", "30",
           "-c:a", a, "-b:a", "256k", "-ar", "48000", "-t", f"{dur}", "-movflags", "+faststart", o)
        print(out("ffprobe", "-v", "error", "-show_entries", "format=duration:stream=width,height", "-of", "compact", o).replace("\n", " "))
        r = subprocess.run(["ffmpeg", "-i", str(o), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
        print(" ".join(" ".join(l.split()) for l in r.stderr.splitlines() if l.strip().startswith(("I:", "Peak:")))[-80:])
        print("->", o)


def gorsel(folder, yon="v", sure=5.0):
    """Fotoğraf -> sabit B-roll klibi (30 fps, projenin yönünde; taşan kısım bulanık dolgu). Ken Burns hareketini 02c_base verir."""
    src = Path(folder) / "gorsel"; dst = Path(folder) / "broll"
    ims = sorted(p for p in src.glob("*") if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"))
    if not ims: raise SystemExit(f"{src} içinde fotoğraf yok")
    dst.mkdir(exist_ok=True)
    W, H = (1440, 2560) if yon == "v" else (2560, 1440)
    vf = (f"split[a][b];[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},gblur=sigma=40,eq=brightness=-0.08[bg];"
          f"[b]scale={W}:{H}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p")
    for im in ims:
        if im.stem.lower().startswith("logo"): continue                       # logolar klip olmaz
        o = dst / f"foto-{im.stem}.mp4"
        sh("ffmpeg", "-v", "error", "-y", "-loop", "1", "-i", im, "-t", f"{sure}", "-r", "30", "-filter_complex", vf,
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", o)
        print("->", o)


def node_render(P, *args):
    return sh("node", ROOT / "comp/render.mjs", P, *args, check=False).returncode


def main(a):
    if not a or a[0] in ("-h", "--help", "yardim"):
        print(__doc__); return 0
    cmd = a[0]
    if cmd == "doktor": return doktor()
    if cmd == "kur": kur(a[1] if len(a) > 1 else "temel"); return 0
    if cmd == "py":
        if len(a) < 3: raise SystemExit("kullanım: ./studyo py <slug|-> pipeline/X.py [arg...]")
        if a[1] != "-": proj(a[1])
        return sh(PY, *a[2:], check=False).returncode
    if cmd == "gorsel":
        if len(a) < 2: raise SystemExit("kullanım: ./studyo gorsel input/<proje> [--yon v|h] [--sure 5]")
        opt = dict(zip(a[2::2], a[3::2]))
        gorsel(a[1], opt.get("--yon", "v"), float(opt.get("--sure", 5))); return 0
    if len(a) < 2: print(__doc__); return 1
    slug = a[1]; P, W = proj(slug)
    if cmd == "prep":
        if len(a) < 3: raise SystemExit("kullanım: ./studyo prep <slug> input/<proje> [marka] [--yon v|h] [--sure 30]")
        opt = {k: v for k, v in zip(a[3::1], a[4::1]) if k.startswith("--")}
        pos = [x for i, x in enumerate(a[3:]) if not x.startswith("--") and not (i and a[3:][i - 1].startswith("--"))]
        prep(slug, a[2], pos[0] if pos else "", opt.get("--yon"), float(opt.get("--sure", 30)))
    elif cmd == "scan": pyrun("scan_broll.py")
    elif cmd == "cut": cut(slug)
    elif cmd == "audio": pyrun("01_timeline.py", check=False); pyrun("04_audio.py")
    elif cmd == "render":
        for f in fmts(P, a[2] if len(a) > 2 else "all"):
            if node_render(P, "video", "8", "--fmt", f): return 1
    elif cmd == "safe":
        rc = 0
        for f in fmts(P, a[2] if len(a) > 2 else "all"): rc |= node_render(P, "safecheck", "--fmt", f)
        return rc
    elif cmd == "sheet": return node_render(P, "sheet", a[2] if len(a) > 2 else "0.5", "--fmt", a[3] if len(a) > 3 else "9x16")
    elif cmd == "final": final(slug, a[2] if len(a) > 2 else "all")
    elif cmd == "package":
        if main(["render", slug, "all"]) or main(["safe", slug, "all"]): return 1
        final(slug, "all")
    else:
        print("bilinmeyen komut:", cmd); return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]) or 0)
