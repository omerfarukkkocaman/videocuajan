"""Yüz takibi (Windows/Linux; Mac'te facetrack.swift kullanılır). Aynı arayüz ve çıktı:
Kullanım: python pipeline/facetrack.py <kare klasörü> <adım>  > JSON
Çıktı: [{"f": kare, "x0","y0","x1","y1": yüz kutusu (0-1, sol-üst orijin), "c": güven}] — yüz yoksa kare atlanır.
Model: OpenCV YuNet (ücretsiz, ~230 KB; ilk kullanımda .cache/models/ altına iner).
"""
import json, sys
from pathlib import Path
import cv2
sys.path.insert(0, str(Path(__file__).resolve().parent))
from arac import model

URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
# YuNet kutusu Vision'ınkinden biraz farklı oturur (alın/çene); 03_track'in saç payı Vision'a göre ayarlı.
# Kalibrasyon: aynı karelerde iki dedektörün kutuları karşılaştırıldı; YuNet alnı daha çok alır (üst ~%15.6 yukarıda),
# yanları daha dardır. Aşağıdaki düzeltmeyle kutu Vision'ınkine oturur (yüz yüksekliği/genişliği oranında).
KAL = {"top": -0.156, "bot": -0.012, "side": 0.083}

d = Path(sys.argv[1]); step = int(sys.argv[2]) if len(sys.argv) > 2 else 2
files = sorted(p for p in d.iterdir() if p.suffix.lower() == ".jpg")
det = None
out = []
for i, p in enumerate(files):
    if i % step: continue
    img = cv2.imread(str(p))
    if img is None: continue
    H, W = img.shape[:2]
    s = 640 / max(W, H)
    small = cv2.resize(img, (round(W * s), round(H * s)), interpolation=cv2.INTER_AREA)
    if det is None:
        det = cv2.FaceDetectorYN.create(model(URL, "face_detection_yunet_2023mar.onnx"), "", (small.shape[1], small.shape[0]), 0.6)
    det.setInputSize((small.shape[1], small.shape[0]))
    _, faces = det.detect(small)
    if faces is None or not len(faces): continue
    x, y, w, h = (float(v) for v in max(faces, key=lambda f: f[2])[:4])   # en büyük yüz = konuşan kişi
    c = float(max(faces, key=lambda f: f[2])[-1])
    sw, sh = float(small.shape[1]), float(small.shape[0])
    x0, x1 = (x - KAL["side"] * w) / sw, (x + w + KAL["side"] * w) / sw
    y0, y1 = (y - KAL["top"] * h) / sh, (y + h + KAL["bot"] * h) / sh
    out.append({"f": float(i), "x0": max(0.0, x0), "y0": max(0.0, y0), "x1": min(1.0, x1), "y1": min(1.0, y1), "c": c})
sys.stdout.write(json.dumps(out))
