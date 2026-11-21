"""Stok klip için ön plan maskesi: kareleri çıkarır, objmatte ile maskeler, kontrol görüntüsü yazar.

Kullanım:
  ./studyo py - pipeline/klipmaske.py <klip.mp4> <çıktı klasörü> [--mod nesne|kisi] [--genislik 720] [--fps 30] [--bas 0] [--sure 0]
  ./studyo py - pipeline/klipmaske.py projects/<slug>/work/face <çıktı> --aralik 41-95 [--mod nesne]   # taban kareleri

Kare klasörü verilirse (cut sonrası taban kareler, Ken Burns dahil) yalnız --aralik karelerine bağ kurulur ve
maskeler taban kare numarasıyla adlanır (0041.png …): motor maskeyi kare numarasıyla doğrudan bulur.
Çıktı: <çıktı>/kare/%05d.jpg (genişlik px), <çıktı>/maske/%05d.png (beyaz = ön plan), <çıktı>/kontrol.jpg
(birkaç anda kare | maske | kesik çıktı yan yana; yönetmen Read ile bakar). Motor tarafında maske, çıkartma
(kesilmiş nesne + beyaz kenar), yazı-nesne-arkası ve 2.5D derinlik bileşenlerinde kullanılır.
"""
import argparse
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from arac import objmatte_cmd, personmatte_cmd


def main():
    ap = argparse.ArgumentParser(prog="klipmaske")
    ap.add_argument("klip"); ap.add_argument("cikti")
    ap.add_argument("--mod", default="nesne", choices=["nesne", "kisi"])
    ap.add_argument("--genislik", type=int, default=720)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--bas", type=float, default=0.0, help="başlangıç (s)")
    ap.add_argument("--sure", type=float, default=0.0, help="süre (s); 0 = klibin sonuna kadar")
    ap.add_argument("--aralik", default="", help="kare klasörü girişinde ilk-son kare numarası (ör. 41-95)")
    a = ap.parse_args()
    out = Path(a.cikti)
    frames, masks = out / "kare", out / "maske"
    for d in (frames, masks):
        shutil.rmtree(d, ignore_errors=True)
        d.mkdir(parents=True)
    src = Path(a.klip)
    if src.is_dir():
        lo, hi = (int(x) for x in a.aralik.split("-"))
        for i in range(lo, hi + 1):
            f = next(src.glob(f"{i:04d}.jpg"), None) or next(src.glob(f"{i:05d}.jpg"))
            shutil.copy2(f, frames / f.name)            # Windows'ta sembolik bağ yönetici ister
    else:
        cut = ["-ss", str(a.bas)] + (["-t", str(a.sure)] if a.sure > 0 else [])
        subprocess.run(["ffmpeg", "-v", "error", "-y", *cut, "-i", a.klip, "-vf", f"fps={a.fps},scale={a.genislik}:-2:flags=lanczos",
                        "-q:v", "2", str(frames / "%05d.jpg")], check=True)
    obj = objmatte_cmd()                                     # Mac: Apple Vision (nesne + kişi)
    if obj:
        subprocess.run([*obj, str(frames), str(masks), str(a.genislik), a.mod], check=True)
    else:                                                    # Windows/Linux: yalnız kişi maskesi (MediaPipe)
        if a.mod == "nesne":
            print("UYARI: nesne maskesi yalnız Mac'te var; kişi maskesi kullanılıyor", flush=True)
        subprocess.run([*personmatte_cmd(), str(frames), str(masks), str(a.genislik)], check=True)
    names = sorted(f.stem for f in frames.glob("*.jpg"))
    n = len(names)
    picks = [names[k] for k in sorted({0, n // 3, 2 * n // 3, n - 1})]
    # kontrol: her satırda kare | maske | gri zemin üstüne kesilmiş ön plan
    from PIL import Image
    rows = []
    for i in picks:
        f = Image.open(frames / f"{i}.jpg").convert("RGB")
        f.thumbnail((720, 1280))
        m = Image.open(masks / f"{i}.png").convert("L").resize(f.size)
        cutout = Image.new("RGB", f.size, (128, 128, 128)); cutout.paste(f, mask=m)
        row = Image.new("RGB", (f.width * 3, f.height))
        for k, im in enumerate((f, m.convert("RGB"), cutout)):
            row.paste(im, (k * f.width, 0))
        row.thumbnail((720, 720)); rows.append(row)
    sheet = Image.new("RGB", (max(r.width for r in rows), sum(r.height for r in rows)))
    y = 0
    for r in rows:
        sheet.paste(r, (0, y)); y += r.height
    sheet.save(out / "kontrol.jpg", quality=85)
    print(f"{n} kare maskelendi ({a.mod}) -> {masks}\nkontrol: {out / 'kontrol.jpg'}")


if __name__ == "__main__":
    main()
