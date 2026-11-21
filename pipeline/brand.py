"""Yeni marka klasörü: logodan koyu/beyaz/ikon sürümleri + brand.json iskeleti.
Kullanım: ./studyo py - pipeline/brand.py <marka-slug> <logo.png> [--mark x0,y0,x1,y1]
  --mark: kırpılmış logodaki ikon kısmı (avatar için). Verilmezse logo kare değilse sol kare alınır.
Renkleri ve slogan/URL'yi sonra brand.json'a elle (sitenin CSS'inden) yaz.
"""
import json, sys, shutil
from pathlib import Path
from PIL import Image

slug, logo = sys.argv[1], sys.argv[2]
mark = None
if "--mark" in sys.argv: mark = tuple(int(v) for v in sys.argv[sys.argv.index("--mark") + 1].split(","))
d = Path(__file__).resolve().parent.parent / "brands" / slug
d.mkdir(parents=True, exist_ok=True)
shutil.copy(logo, d / ("original" + Path(logo).suffix))

im = Image.open(logo).convert("RGBA")
bbox = im.getchannel("A").point(lambda a: 255 if a > 16 else 0).getbbox()
if bbox is None or bbox == (0, 0, *im.size):        # şeffaf değil: beyaz zemini şeffaflaştır
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if r > 240 and g > 240 and b > 240: px[x, y] = (r, g, b, 0)
    bbox = im.getchannel("A").getbbox()
im = im.crop(bbox)
im.save(d / "logo-dark.png")
white = Image.new("RGBA", im.size, (255, 255, 255, 255)); white.putalpha(im.getchannel("A")); white.save(d / "logo-light.png")
m = im.crop(mark) if mark else (im.crop((0, 0, im.height, im.height)) if im.width > im.height * 1.3 else im)
m.save(d / "logo-mark.png")

bj = d / "brand.json"
if not bj.exists():
    json.dump({"name": slug, "handle": slug, "url": f"{slug}.com", "tagline": "",
               "about": "Markanın tek cümlelik tanımı (sitesinden).",
               "colors": {"navy": "#0B1F33", "brand": "#0B3568", "blue": "#2F6BFF", "sky": "#5DB3F0",
                          "yellow": "#FFD23F", "red": "#E5383B", "green": "#1FB766", "ink": "#111827", "muted": "#64748B"},
               "logo": {"dark": "logo-dark.png", "light": "logo-light.png", "mark": "logo-mark.png"}, "logo_ar": round(im.height / im.width, 4),
               "source": "Renkleri sitenin CSS değişkenlerinden ve logodan doldur."},
              open(bj, "w"), ensure_ascii=False, indent=1)
print(f"{d}: logo {im.size}, ikon {m.size}. brand.json'u doldur ve logo-mark.png'ye bak.")
