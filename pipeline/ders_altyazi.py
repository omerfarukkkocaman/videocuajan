"""Ders altyazısı: cümle bazlı, dengeli bloklar (plan.chunks) ve platform için .srt.

  ./studyo py - pipeline/ders_altyazi.py bloklar <slug>   -> plan.chunks (work/timeline.json kelimelerinden; önce 01_timeline çalışmış olmalı)
  ./studyo py - pipeline/ders_altyazi.py srt <slug>       -> output/<slug>/<slug>.srt (plan.chunks + timeline zamanları)

Kurallar: cümle (. ! ? ya da > .7 s es) bir blok; 80 karakteri aşan cümle eşit uzunlukta parçalara bölünür, bölme noktası
hedefe ±14 karakter içinde virgülden sonra ya da bağlaçtan önce (ve, ama, veya, çünkü, yani, ki ...) seçilir. 14 karakterden kısa
blok komşusuna katılır. Noktalama korunur (plan.cap_punct).
"""
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAX, MIN = 80, 14
CONJ = {"ve", "ama", "veya", "ya", "çünkü", "yani", "ki", "fakat", "ancak", "ise", "hem", "sonra", "bu", "o", "şimdi", "mesela", "ya da"}


def L(ws, c):
    return sum(len(ws[k]["t"]) + 1 for k in c) - 1


def split_sentence(ws, sent):
    n = math.ceil(L(ws, sent) / MAX)
    if n <= 1: return [sent]
    parts, rest = [], list(sent)
    for left in range(n, 1, -1):
        target = L(ws, rest) / left
        best, bs = None, 1e9
        acc = 0
        for j in range(len(rest) - 1):
            acc += len(ws[rest[j]]["t"]) + 1
            d = abs(acc - target)
            if d > 14 and best is not None: continue
            t, nt = ws[rest[j]]["t"], ws[rest[j + 1]]["t"].lower()
            score = d - (10 if t.endswith(",") else 0) - (6 if nt in CONJ else 0)
            if score < bs and acc >= MIN and L(ws, rest[j + 1:]) >= MIN: bs, best = score, j
        if best is None: break
        parts.append(rest[: best + 1]); rest = rest[best + 1:]
    parts.append(rest)
    return parts


# özel adlar ve terimler: cümle ortasında büyük harfle kalır (Whisper'ın rastgele büyük harfini düzeltirken)
PROPER = set("""Google Antigravity Claude Code Gemini Anthropic Anthropic'in Opus Sonnet Fable Apple Windows Linux MacOS Intel Silicon
Yılmaz'ın Yılmaz'ı Workspace Settings Extension Account Usage Trust Folder Download IDE AI Pro Ultra Open Upgrade Low Medium High Flash HTML CSS
JavaScript ChatGPT Türkçe Türkçeyle İngilizce İngilizcesi Python Swift Kotlin Flutter SQL
Vibe GPT-OSS Antigravity'de Antigravity'nin Antigravity'ye Claude'a Claude'un Google'un Google'da Google'dayım Gemini'de ChatGPT'de ChatGPT'ye
ChatGPT'nin Windows'ta Windows'a Apple'larda Settings'e Antigravity'yi IDE'yi IDE'yi, Install Uninstall Disable Create Account,
Android Auto Manual Edit Effort Ultracode Compact Remote Control Enter Max Leaflet Mapbox Maps Haritalar Nominatim Next.js Supabase Vercel
Tailwind Playwright Vitest Markdown Message""".split())


def proper(t):
    """Özel ad mı: listede (eki/noktalaması atılmış kökü dahil) ya da ilk harften sonra büyük harf içeriyor (AGENTS.md, MVP'de, iOS)."""
    base = re.split(r"['’]", re.sub(r"[.,!?;:…\"]+$", "", t.strip('"')))[0]
    return t in PROPER or base in PROPER or any(c.isupper() for c in base[1:])


def case_fixes(plan, ws):
    """Cümle ortasında (önceki kelime . ! ? : ile bitmiyor) büyük harfle başlayan sıradan kelimeyi küçültür; plan.fixes'e yazar."""
    fx = plan.setdefault("fixes", {}); n = 0
    for k in range(1, len(ws)):
        t, prev = ws[k]["t"], ws[k - 1]["t"]
        if re.search(r"[.!?:…]$", prev) and not re.fullmatch(r"\d+\.", prev): continue
        if not t[:1].isupper() or t.isupper() or proper(t): continue
        low = ("i" if t[0] == "İ" else "ı" if t[0] == "I" else t[0].lower()) + t[1:]
        key = str(ws[k]["i"])
        if fx.get(key, t) is None: continue
        fx[key] = low; n += 1
    return n


def bloklar(slug):
    P = ROOT / "projects" / slug
    plan = json.load(open(P / "plan.json"))
    ws = json.load(open(P / "work/timeline.json"))["words"]
    nc = case_fixes(plan, ws)
    if nc:                                                   # yeni yazımla kelimeleri tazele (01_timeline'ı burada çağırmadan)
        for x in ws:
            v = plan["fixes"].get(str(x["i"]))
            if v: x["t"] = v
        print(f"büyük harf düzeltmesi: {nc} kelime (01_timeline'ı yeniden çalıştır)")
    sents, cur = [], []
    for n, x in enumerate(ws):
        cur.append(n)
        nx = ws[n + 1] if n + 1 < len(ws) else None
        ordinal = re.fullmatch(r"\d+\.", x["t"]) and nx is not None and nx["t"][:1].islower()   # "2. dersimize"
        if nx is None or (re.search(r"[.!?]$", x["t"]) and not ordinal) or nx["s"] - x["e"] > 0.7:
            sents.append(cur); cur = []
    blocks = [p for s in sents for p in split_sentence(ws, s)]
    out = []
    for c in blocks:
        if out and L(ws, c) < MIN and L(ws, out[-1]) + L(ws, c) + 1 <= MAX + 6 and ws[c[0]]["s"] - ws[out[-1][-1]]["e"] < 1.0:
            out[-1] = out[-1] + c
        else:
            out.append(c)
    plan["chunks"] = [{"w": [ws[k]["i"] for k in c]} for c in out]
    json.dump(plan, open(P / "plan.json", "w"), ensure_ascii=False, indent=1)
    lens = [L(ws, c) for c in out]
    print(f"{slug}: {len(out)} blok (ort. {sum(lens) / len(lens):.0f}, en uzun {max(lens)} karakter)")
    return ws, out


def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def srt(slug):
    P = ROOT / "projects" / slug
    tl = json.load(open(P / "work/timeline.json"))
    out = []
    for n, c in enumerate(tl["chunks"], 1):
        txt = " ".join(w["t"] for w in c["w"])
        out.append(f"{n}\n{ts(c['s'])} --> {ts(min(c['e'], c['s'] + max(1.0, c['e'] - c['s'])))}\n{txt}\n")
    o = ROOT / "output" / slug / f"{slug}.srt"
    o.parent.mkdir(parents=True, exist_ok=True)
    o.write_text("\n".join(out), encoding="utf-8")
    print("->", o, len(out), "altyazı")


if __name__ == "__main__":
    {"bloklar": bloklar, "srt": srt}[sys.argv[1]](sys.argv[2])
