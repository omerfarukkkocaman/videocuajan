"""İnsan maskesi (Windows/Linux; Mac'te personmatte.swift kullanılır). Aynı arayüz ve çıktı:
Kullanım: python pipeline/personmatte.py <kare klasörü> <çıktı klasörü> [genişlik=720] [kalite=accurate|balanced|fast]
Her .jpg kare için aynı adla gri tonlu .png maske yazar (beyaz = kişi). Kişi yoksa siyah maske.
Model: MediaPipe selfie_multiclass_256x256 (ücretsiz; ilk kullanımda .cache/models/ altına iner). Kurulum: mediapipe paketi.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parent))
from arac import model
try:
    import mediapipe as mp
    from mediapipe.tasks import python as mpt
    from mediapipe.tasks.python import vision
except ImportError:
    raise SystemExit("kişi maskesi için mediapipe gerekli: ./studyo kur maske")

URL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite"
src, dst = Path(sys.argv[1]), Path(sys.argv[2])
width = int(sys.argv[3]) if len(sys.argv) > 3 else 720
dst.mkdir(parents=True, exist_ok=True)
opts = vision.ImageSegmenterOptions(base_options=mpt.BaseOptions(model_asset_path=model(URL, "selfie_multiclass_256x256.tflite")),
                                    output_confidence_masks=True, output_category_mask=False)
seg = vision.ImageSegmenter.create_from_options(opts)
files = sorted(p for p in src.iterdir() if p.suffix.lower() == ".jpg")
for n, p in enumerate(files):
    im = Image.open(p).convert("RGB")
    h = int(width * im.height / im.width)
    try:
        res = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.asarray(im)))
        bg = res.confidence_masks[0].numpy_view()               # sınıf 0 = arka plan
        m = np.clip((1.0 - bg) * 255.0, 0, 255).astype(np.uint8)
        out = Image.fromarray(m.squeeze()).resize((width, h), Image.Resampling.BILINEAR)
    except Exception:
        out = Image.new("L", (width, h), 0)
    out.save(dst / (p.stem + ".png"))
    if n % 200 == 0: print(f"maske {n}/{len(files)}", file=sys.stderr, flush=True)
