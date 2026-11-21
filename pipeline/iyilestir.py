"""Düşük kaliteli (WhatsApp/TikTok sıkıştırmalı) klibi yapay zekâyla büyütür: Real-ESRGAN (ncnn-vulkan, ücretsiz/açık kaynak, yerel).

Kullanım:
  ./studyo py - pipeline/iyilestir.py <klip> <çıktı.mp4> [--bas s] [--sure s] [--model video|foto] [--karis 0.0]

  --model video : realesr-animevideov3 x2 (vars.; ~0.5 s/kare, video için kararlı, titremez)
          foto  : realesrgan-x4plus x4 (~6 s/kare; tek kare/fotoğraf için en temiz)
  --karis       : sonucu klasik (lanczos) büyütmeyle karıştırma oranı (0 = saf YZ; 0.25 cilde doğal doku bırakır)
Çıktı kaynak fps'inde, sessiz, h264 crf 12 (yeterince kayıpsız). Hareket bulanıklığını düzeltmez: elin sabit olduğu
bölümü seç (bkz. stok-montaj.md 'sabit pencere'). Program: .cache/realesrgan (git dışı; github.com/xinntao/Real-ESRGAN
releases v0.2.5.0 macos zip, kullanıcının onayıyla kurulur).
"""
import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RE = ROOT / ".cache/realesrgan"
MODELS = {"video": ("realesr-animevideov3", 2), "foto": ("realesrgan-x4plus", 4)}


def probe(f, entry):
    return subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", entry, "-of", "csv=p=0", str(f)],
                          capture_output=True, text=True).stdout.strip().split(",")[0]


def main():
    ap = argparse.ArgumentParser(prog="iyilestir")
    ap.add_argument("klip"); ap.add_argument("cikti")
    ap.add_argument("--bas", type=float, default=0.0); ap.add_argument("--sure", type=float, default=0.0)
    ap.add_argument("--model", default="video", choices=MODELS); ap.add_argument("--karis", type=float, default=0.0)
    a = ap.parse_args()
    if not (RE / "realesrgan-ncnn-vulkan").exists():
        raise SystemExit("Real-ESRGAN yok: .cache/realesrgan (README'deki kaynaktan kur)")
    fps = probe(a.klip, "stream=r_frame_rate")
    name, scale = MODELS[a.model]
    tmp = Path(tempfile.mkdtemp(prefix="iyilestir_"))
    src, up = tmp / "src", tmp / "up"
    src.mkdir(); up.mkdir()
    cut = ["-ss", str(a.bas)] + (["-t", str(a.sure)] if a.sure > 0 else [])
    # -noautorotate yok: ffmpeg döndürmeyi uygular (iPhone/WhatsApp -90 meta veri)
    subprocess.run(["ffmpeg", "-v", "error", "-y", *cut, "-i", a.klip, "-vsync", "0", str(src / "%05d.png")], check=True)
    subprocess.run([str(RE / "realesrgan-ncnn-vulkan"), "-i", str(src), "-o", str(up), "-n", name, "-s", str(scale),
                    "-m", str(RE / "models"), "-f", "png"], check=True, capture_output=True)
    n = len(list(up.glob("*.png")))
    if a.karis > 0:                                       # klasik büyütmeyle karıştır (doğal doku)
        from PIL import Image
        for f in sorted(up.glob("*.png")):
            ai = Image.open(f).convert("RGB")
            lz = Image.open(src / f.name).convert("RGB").resize(ai.size, Image.LANCZOS)
            Image.blend(ai, lz, a.karis).save(f)
    Path(a.cikti).parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", fps, "-i", str(up / "%05d.png"), "-c:v", "libx264", "-crf", "12",
                    "-preset", "slow", "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
                    a.cikti], check=True)
    shutil.rmtree(tmp)
    print(f"{n} kare {name} x{scale}{' karış ' + str(a.karis) if a.karis else ''} -> {a.cikti} "
          f"({probe(a.cikti, 'stream=width')}x{probe(a.cikti, 'stream=height')}, {fps} fps)")


if __name__ == "__main__":
    main()
