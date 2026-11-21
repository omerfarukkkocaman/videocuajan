"""Ücretsiz stok video: Pexels'te ara, kontak sayfasıyla seç, indir (lisans kaydıyla).

Kullanım:
  ./studyo py - pipeline/stok.py ara <proje klasörü> "<sorgu>" ["<sorgu 2>" ...] [--yon portrait|landscape|any] [--n 24]
  ./studyo py - pipeline/stok.py indir <proje klasörü> <id> [<id> ...]

ara: ayrı bir Chromium penceresi açar (Playwright'ın kendi tarayıcısı, .cache/stok-profil; pipeline/stok_ara.mjs), aramaları sırayla
yapıp kapatır; bot doğrulaması çıkarsa kullanıcı tıklayana kadar bekler. Arama sayfasından kimlik + küçük resim alır. <proje>/broll/stok/arama/<sorgu>.json ve
numaralı kontak sayfası <sorgu>.jpg yazar (yönetmen Read ile bakıp seçer).
indir: https://www.pexels.com/download/video/<id>/ yönlendirmesiyle en yüksek kaliteyi indirir
(<proje>/broll/pexels-<id>.mp4). Her klibin kaynağı, sayfası ve lisansı <proje>/broll/kaynaklar.json'a yazılır.

Lisans (pexels.com/license, 2026-11-03 doğrulandı): reklam dahil ticari kullanım ve düzenleme serbest, kaynak
göstermek gerekmez. Yasak: kişileri olumsuz göstermek, kişi/markanın ürünü ONAYLADIĞINI ima etmek (stok
oyuncu 'öğrencimiz/müşterimiz' diye sunulmaz), değiştirmeden yeniden satmak/dağıtmak.
"""
import argparse
import json
import re
import subprocess
import sys
from datetime import date
from io import BytesIO
from pathlib import Path
from urllib.parse import quote, unquote

ROOT = Path(__file__).resolve().parent.parent
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
LICENSE = "Pexels License (pexels.com/license): ticari kullanım ve düzenleme serbest, kaynak gerekmez; onay ima etmek ve değiştirmeden yeniden dağıtmak yasak"


def slug(q):
    return re.sub(r"[^a-z0-9]+", "-", q.lower()).strip("-")


GRAB = ("JSON.stringify({t: document.title, u: location.href, r: document.readyState, v: [...document.querySelectorAll(\"a[href*='/video/']\")]"
        ".map(a => ({h: a.getAttribute('href'), i: (a.querySelector('img') || {}).src || null}))})")


def collect(raw, found):
    for v in json.loads(raw)["v"]:
        m = re.search(r"/video/([a-z0-9-]+)-(\d{5,})/", v["h"] or "")
        if m and m.group(2) not in found:
            found[m.group(2)] = {"id": m.group(2), "title": m.group(1).replace("-", " "),
                                 "page": f"https://www.pexels.com/video/{m.group(1)}-{m.group(2)}/", "thumb": v["i"]}


def search_one(query, orient, n):
    """Ayrı Chromium penceresiyle tek sorgu (pipeline/stok_ara.mjs)."""
    url = f"https://www.pexels.com/search/videos/{quote(query)}/" + ("" if orient == "any" else f"?orientation={orient}")
    r = subprocess.run(["node", str(ROOT / "pipeline/stok_ara.mjs"), url, str(n)], capture_output=True, text=True, encoding="utf-8")
    if r.stderr.strip(): print(r.stderr.strip(), flush=True)
    found = {}
    collect(json.dumps({"v": json.loads(r.stdout or "[]")}), found)
    return list(found.values())[:n]


def search(folder, queries, orient, n):
    results = {qq: search_one(qq, orient, n) for qq in queries}
    out = folder / "broll/stok/arama"
    out.mkdir(parents=True, exist_ok=True)
    for query, items in results.items():
        (out / f"{slug(query)}.json").write_text(json.dumps({"query": query, "orient": orient, "items": items}, ensure_ascii=False, indent=1), encoding="utf-8")
        sheet = contact_sheet(items, out / f"{slug(query)}.jpg")
        print(f"{query!r}: {len(items)} sonuç" + (f" -> {sheet}" if sheet else ""))


def contact_sheet(items, target):
    """Küçük resimleri numaralı ızgaraya dizer (Pillow yoksa atlar)."""
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        return None
    cells = []
    for k, it in enumerate(items, 1):
        if not it.get("thumb"):
            continue
        raw = subprocess.run(["curl", "-sL", "-m", "20", "-A", UA, it["thumb"]], capture_output=True).stdout
        try:
            im = Image.open(BytesIO(raw)).convert("RGB")
        except Exception:
            continue
        im.thumbnail((240, 360))
        cell = Image.new("RGB", (240, 390), (20, 20, 24))
        cell.paste(im, ((240 - im.width) // 2, 0))
        ImageDraw.Draw(cell).text((6, 366), f"{k}. {it['id']}", fill=(255, 210, 63))
        cells.append(cell)
    if not cells:
        return None
    cols = 6
    rows = (len(cells) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 240, rows * 390), (10, 10, 12))
    for k, c in enumerate(cells):
        sheet.paste(c, ((k % cols) * 240, (k // cols) * 390))
    sheet.save(target, quality=85)
    return target


def download(folder, ids):
    broll = folder / "broll"
    broll.mkdir(parents=True, exist_ok=True)
    log_path = broll / "kaynaklar.json"
    log = json.loads(log_path.read_text(encoding="utf-8")) if log_path.exists() else {}
    known = {it["id"]: it for f in (broll / "stok/arama").glob("*.json") for it in json.loads(f.read_text(encoding="utf-8"))["items"]}
    for vid in ids:
        dst = broll / f"pexels-{vid}.mp4"
        r = subprocess.run(["curl", "-sL", "-m", "300", "-A", UA, "-o", str(dst), "-w", "%{http_code} %{url_effective}",
                            f"https://www.pexels.com/download/video/{vid}/"], capture_output=True, text=True)
        code, final = (r.stdout.split(" ", 1) + [""])[:2]
        if code != "200" or not dst.exists() or dst.stat().st_size < 50000:
            print(f"  {vid}: İNMEDİ (HTTP {code})", file=sys.stderr)
            dst.unlink(missing_ok=True)
            continue
        probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate:format=duration",
                                "-of", "json", str(dst)], capture_output=True, text=True)
        info = json.loads(probe.stdout or "{}")
        st = (info.get("streams") or [{}])[0]
        log[dst.name] = {"source": "pexels", "id": vid, "page": known.get(vid, {}).get("page", f"https://www.pexels.com/video/{vid}/"),
                         "file_url": final, "title": known.get(vid, {}).get("title", ""), "license": LICENSE,
                         "downloaded": date.today().isoformat(), "w": st.get("width"), "h": st.get("height"),
                         "fps": st.get("r_frame_rate"), "dur": round(float(info.get("format", {}).get("duration", 0)), 2)}
        print(f"  {vid}: {dst.name} {st.get('width')}x{st.get('height')} {log[dst.name]['dur']} s")
    log_path.write_text(json.dumps(log, ensure_ascii=False, indent=1), encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(prog="stok")
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("ara")
    a.add_argument("klasor"); a.add_argument("sorgular", nargs="+")
    a.add_argument("--yon", default="portrait", choices=["portrait", "landscape", "any"])
    a.add_argument("--n", type=int, default=24)
    d = sub.add_parser("indir")
    d.add_argument("klasor"); d.add_argument("ids", nargs="+")
    args = ap.parse_args()
    folder = Path(args.klasor)
    if args.cmd == "ara":
        search(folder, args.sorgular, args.yon, args.n)
    else:
        download(folder, args.ids)


if __name__ == "__main__":
    main()
