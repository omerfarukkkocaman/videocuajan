"""Platform araçları: Mac'te Apple araçları (avconvert, Vision/Swift, VideoToolbox), Windows/Linux'ta karşılıkları
(ffmpeg ton eşleme, OpenCV YuNet yüz bulma, MediaPipe kişi maskesi, libx264). Diğer betikler buradan çağırır;
böylece akış iki sistemde de aynı dosyaları üretir.

Zorla Python yolu (Mac'te Windows yolunu denemek için): ortamda VA_PLATFORM=genel
"""
import json, os, platform, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache"
MAC = platform.system() == "Darwin" and os.environ.get("VA_PLATFORM") != "genel"
WIN = platform.system() == "Windows"


def var(prog):
    return shutil.which(prog) is not None


def run(cmd, **kw):
    return subprocess.run([str(c) for c in cmd], **kw)


# ---------------------------------------------------------------- ffmpeg yardımcıları
def ffprobe_json(f, entries="stream=width,height,r_frame_rate,color_transfer:stream_side_data=rotation:format=duration"):
    r = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", entries, "-of", "json", f],
            capture_output=True, text=True)
    return json.loads(r.stdout or "{}")


def is_hdr(f):
    s = (ffprobe_json(f).get("streams") or [{}])[0]
    return s.get("color_transfer") in ("arib-std-b67", "smpte2084")


_ENC = None


def encoders():
    global _ENC
    if _ENC is None:
        _ENC = run(["ffmpeg", "-hide_banner", "-encoders"], capture_output=True, text=True).stdout
    return _ENC


def h264_fast():
    """Ara dosyalar için hızlı ve yüksek kaliteli H.264 kodlayıcı argümanları."""
    if MAC and "h264_videotoolbox" in encoders():
        return ["-c:v", "h264_videotoolbox", "-b:v", "45M"]
    return ["-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p"]


def aac(name="aac"):
    """plan.aac 'aac_at' (Apple AudioToolbox) yalnız Mac'te var; yoksa ffmpeg'in aac'si."""
    return name if name != "aac_at" or (MAC and "aac_at" in encoders()) else "aac"


def _has_filter(name):
    return f" {name} " in run(["ffmpeg", "-hide_banner", "-filters"], capture_output=True, text=True).stdout


def to_sdr(src, dst, max_side=3840):
    """Kaynak videoyu SDR H.264'e çevirir (HDR ise ton eşleme), döndürmeyi uygular.
    Mac: avconvert (Apple ton eşlemesi). Diğer: ffmpeg zscale+tonemap (yoksa düz çevirme + uyarı)."""
    src, dst = str(src), str(dst)
    if MAC and var("avconvert"):
        r = run(["avconvert", "-s", src, "-p", "Preset3840x2160", "-o", dst, "--replace"], capture_output=True)
        if r.returncode == 0:
            return
        # iPhone'un ek veri izleri uzun kayıtta avconvert'i takabiliyor: yalnız görüntü+ses yeniden paketlenip denenir
        remux = dst + ".remux.mov"
        run(["ffmpeg", "-v", "error", "-y", "-i", src, "-map", "0:v:0", "-map", "0:a:0?", "-c", "copy", remux], check=True)
        r = run(["avconvert", "-s", remux, "-p", "Preset3840x2160", "-o", dst, "--replace"], capture_output=True)
        os.remove(remux)
        if r.returncode == 0:
            return
        print("avconvert başarısız -> ffmpeg ile çevriliyor", flush=True)
    scale = f"scale='if(gt(iw,ih),min({max_side},iw),-2)':'if(gt(iw,ih),-2,min({max_side},ih))'"
    vf = scale
    if is_hdr(src):
        if _has_filter("zscale"):
            vf = ("zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,"
                  "zscale=t=bt709:m=bt709:r=tv,format=yuv420p," + scale)
        else:
            print("UYARI: HDR video, ama bu ffmpeg'de zscale yok; renkler soluk görünebilir. "
                  "Tam ffmpeg sürümü kurun (Windows: gyan.dev 'full' build).", flush=True)
    run(["ffmpeg", "-v", "error", "-y", "-i", src, "-map", "0:v:0", "-map", "0:a:0?", "-vf", vf,
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p",
         "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
         "-c:a", "aac", "-b:a", "256k", "-ar", "48000", dst], check=True)


# ---------------------------------------------------------------- yüz takibi / kişi maskesi
def _swift_bin(name):
    """Mac'te Swift aracını derler (ilk seferde) ve yolunu döner; derleyici yoksa None."""
    if not MAC or not var("swiftc"):
        return None
    src = ROOT / f"pipeline/{name}.swift"
    b = CACHE / "bin" / name
    if not b.exists() or b.stat().st_mtime < src.stat().st_mtime:
        b.parent.mkdir(parents=True, exist_ok=True)
        if run(["swiftc", "-O", src, "-o", b]).returncode != 0:
            return None
    return b


def facetrack_cmd():
    """facetrack <kare klasörü> <adım>  -> stdout JSON [{f,x0,y0,x1,y1,c}]"""
    b = _swift_bin("facetrack")
    return [str(b)] if b else [sys.executable, str(ROOT / "pipeline/facetrack.py")]


def personmatte_cmd():
    """personmatte <kare klasörü> <çıktı klasörü> [genişlik] [kalite]  -> gri .png maskeler"""
    b = _swift_bin("personmatte")
    return [str(b)] if b else [sys.executable, str(ROOT / "pipeline/personmatte.py")]


def objmatte_cmd():
    b = _swift_bin("objmatte")
    return [str(b)] if b else None


def ocr_cmd():
    b = _swift_bin("ocr")
    return [str(b)] if b else None


def model(url, name):
    """Küçük ücretsiz modeli ilk kullanımda .cache/models/ altına indirir."""
    f = CACHE / "models" / name
    if not f.exists():
        import urllib.request
        f.parent.mkdir(parents=True, exist_ok=True)
        print(f"model indiriliyor: {name}", file=sys.stderr, flush=True)
        try:
            import certifi, ssl
            ctx = ssl.create_default_context(cafile=certifi.where())
        except Exception:
            ctx = None
        with urllib.request.urlopen(url, context=ctx) as r, open(f.with_suffix(".part"), "wb") as o:
            shutil.copyfileobj(r, o)
        f.with_suffix(".part").replace(f)
    return str(f)


def pool(n):
    """Paralel havuz: fork olan sistemde süreç havuzu; Windows'ta (fork yok) iş parçacığı havuzu."""
    import multiprocessing as mp
    from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
    if "fork" in mp.get_all_start_methods():
        return ProcessPoolExecutor(max_workers=n, mp_context=mp.get_context("fork"))
    return ThreadPoolExecutor(max_workers=n)
