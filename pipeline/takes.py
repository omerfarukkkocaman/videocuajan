"""Alım analizi (ham uzun kayıt): cümlelere böler, tekrar çekimleri (aynı fikrin farklı alımları) gruplar,
her alımı puanlar ve en iyisini önerir. Yönetmen (Claude) bu raporla plan.json -> edit.keep kurgusunu yazar.
Girdi : $WORK/transcript.json (00_align ile hizalanmış), $WORK/src_sdr4k.mp4 (varsa küçük resimler için)
Çıktı : $WORK/takes.json, $WORK/takes.md (okunabilir rapor), $WORK/takes_sheet.jpg (her cümlenin orta karesi)
"""
import json, re, subprocess
from difflib import SequenceMatcher
from pathlib import Path
from common import w, ROOT

TR = str.maketrans({"ç": "c", "ğ": "g", "ı": "i", "İ": "i", "ö": "o", "ş": "s", "ü": "u", "â": "a", "î": "i", "û": "u"})
FILLER = {"ııı", "ıı", "eee", "ee", "eh", "ah", "hmm", "mmm", "şey", "yani", "işte", "hani", "ımm", "ehm", "aaa"}
SOFT_FILLER = {"şey", "yani", "işte", "hani"}                       # anlamlı da olabilir: yarım ceza
GREET = {"merhaba", "selam", "selamlar", "herkese", "arkadaslar", "merhabalar"}
STOP = {"ve", "de", "da", "ki", "bu", "su", "o", "bir", "icin", "ile", "gibi", "cok", "daha", "en", "mi", "mu", "ne", "ya", "ama",
        "siz", "sizler", "biz", "ben", "hemen", "artik", "zaten", "bunlari", "bunlarin", "bunu", "arkadaslar", "iste", "yani", "sey"}
stems = lambda n: {t[:5] for t in n.split() if len(t) >= 3 and t not in STOP}   # Türkçe ekler: ilk 5 harf ~ kök

words = json.load(open(w("transcript.json")))["words"]
norm = lambda s: re.sub(r"[^a-z0-9 ]", "", s.lower().translate(TR)).strip()

# --- 1) cümlelere böl: noktalama veya 0.7 s+ duraklama (yarıda bırakılan alım da ayrı cümle olur) ---
sents, cur = [], []
for i, x in enumerate(words):
    cur.append(i)
    nxt = words[i + 1] if i + 1 < len(words) else None
    end_punct = bool(re.search(r"[.!?…]$", x["w"]))
    pause = nxt is not None and nxt["s"] - x["e"] > 0.7
    if nxt is None or end_punct or pause:
        sents.append({"w": cur, "punct": end_punct}); cur = []

out = []
for k, s in enumerate(sents):
    ws = [words[i] for i in s["w"]]
    toks = [norm(x["w"]) for x in ws]
    toks = [t for t in toks if t]
    text = " ".join(x["w"] for x in ws)
    dur = ws[-1]["e"] - ws[0]["s"]
    fillers = sum(1 for t in toks if t in FILLER - SOFT_FILLER) + .5 * sum(1 for t in toks if t in SOFT_FILLER)
    stutter = sum(1 for a, b in zip(toks, toks[1:]) if a == b) + sum(1 for t in toks if len(t) <= 2 and t not in {"ve", "de", "da", "ki", "mi", "bu", "o", "bi", "su"})
    prob = sum(x.get("p", 1) for x in ws) / len(ws)
    rate = len(toks) / max(dur, .3)                                    # kelime/sn (Türkçe doğal ~2.2-3.2)
    gaps = [b["s"] - a["e"] for a, b in zip(ws, ws[1:])]
    hesit = sum(1 for g in gaps if g > .45)                             # cümle içinde duraksama
    new_take = k == 0 or ws[0]["s"] - words[sents[k - 1]["w"][-1]]["e"] > 1.2   # uzun duraklamadan sonra: yeni alım başı
    score = 100 * prob - 12 * fillers - 10 * stutter - 8 * hesit - (0 if s["punct"] else 15) - 25 * (len(toks) < 2)
    out.append({"id": f"S{k + 1}", "i0": s["w"][0], "i1": s["w"][-1], "s": round(ws[0]["s"], 3), "e": round(ws[-1]["e"], 3),
                "text": text, "norm": " ".join(toks), "complete": s["punct"], "fillers": fillers, "stutter": stutter,
                "hesit": hesit, "prob": round(prob, 3), "rate": round(rate, 2), "score": round(score, 1),
                "greeting": bool(GREET & set(toks[:3])), "new_take": new_take})

# --- 2) tekrar alımları grupla: içerik benzerliği veya biri diğerinin başı (yarım alım) ---
def sim(a, b):
    A, B = a["norm"].split(), b["norm"].split()
    if not A or not B: return 0
    r = SequenceMatcher(None, A, B).ratio()
    short, long_ = (A, B) if len(A) <= len(B) else (B, A)
    prefix = len(short) >= 2 and long_[:len(short)] == short           # yarıda kesilen alım, tamamının başı
    if a["greeting"] and b["greeting"]: return max(r, .9)               # "merhaba arkadaşlar" ~ "selam arkadaşlar"
    sa, sb = stems(a["norm"]), stems(b["norm"])                         # içerik kökleri örtüşmesi (ekten bağımsız)
    cont = len(sa & sb) / min(len(sa), len(sb)) if min(len(sa), len(sb)) >= 3 else 0
    return max(r, .85 if prefix else 0, cont)

group = list(range(len(out)))
def find(x):
    while group[x] != x: group[x] = group[group[x]]; x = group[x]
    return x
for a in range(len(out)):
    for b in range(a + 1, len(out)):
        if sim(out[a], out[b]) >= .6: group[find(b)] = find(a)
gid, groups = {}, {}
for k, s in enumerate(out):
    g = gid.setdefault(find(k), f"G{len(gid) + 1}")
    s["group"] = g; groups.setdefault(g, []).append(s)
for g, ss in groups.items():
    # en iyi alım: tamamlanmış, puanı yüksek; eşitlikte sonraki (insan doğruyu tutturana kadar tekrar eder)
    best = max(ss, key=lambda s: (s["complete"], s["score"] + 3 * ss.index(s)))
    for s in ss: s["best"] = s is best; s["takes"] = len(ss)

json.dump({"sentences": out, "groups": {g: [s["id"] for s in ss] for g, ss in groups.items()}},
          open(w("takes.json"), "w"), ensure_ascii=False, indent=1)

# --- 3) rapor ---
L = ["# Alım analizi", "", f"{len(out)} cümle, {len(groups)} fikir grubu; {sum(1 for g in groups.values() if len(g) > 1)} grupta tekrar çekim var.",
     "Önerilen (★) = tamamlanmış ve puanı en yüksek alım; eşitlikte sonraki alım. Yönetmen sırayı ve seçimi kendisi kurar.", "",
     "| S | grup | kaynak sn | puan | not | metin |", "|---|---|---|---|---|---|"]
for s in out:
    notes = [x for x, c in [("yarım", not s["complete"]), (f"dolgu {s['fillers']:g}", s["fillers"]), (f"takılma {s['stutter']}", s["stutter"]),
                           (f"duraksama {s['hesit']}", s["hesit"]), ("selamlama", s["greeting"]), ("yeni alım başı", s["new_take"] and s["id"] != "S1"),
                           (f"{s['takes']} alım", s["takes"] > 1)] if c]
    L.append(f"| {s['id']}{' ★' if s['best'] and s['takes'] > 1 else ''} | {s['group']} | {s['s']:.1f}-{s['e']:.1f} | {s['score']:.0f} | {', '.join(notes)} | {s['text']} |")
L += ["", "Kelime indeksleri (edit.keep için): " + ", ".join(f"{s['id']}=[{s['i0']},{s['i1']}]" for s in out)]
Path(w("takes.md")).write_text("\n".join(L))

# --- 4) her cümlenin orta karesi (bakış, mimik, el hareketi kontrolü) ---
src = Path(w("src_sdr4k.mp4"))
if src.exists() and out:
    from PIL import Image, ImageDraw, ImageFont
    f = ImageFont.truetype(str(ROOT / "assets/fonts/Montserrat.ttf"), 20)
    tdir = Path(w("takes_thumbs")); tdir.mkdir(exist_ok=True)
    ims = []
    vdur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(src)],
                                capture_output=True, text=True).stdout or 1e9)
    for s in out:
        p = tdir / f"{s['id']}.jpg"
        tm = min((s['s'] + s['e']) / 2, vdur - 0.2)                     # son cümle videonun sonuna taşabiliyor
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{tm:.2f}", "-i", str(src), "-frames:v", "1",
                        "-vf", "scale=-2:360", str(p)], check=True)
        ims.append((s, Image.open(p).convert("RGB")))
    tw, th, cols = ims[0][1].width, ims[0][1].height, 8
    rows = (len(ims) + cols - 1) // cols
    S = Image.new("RGB", (cols * tw, rows * (th + 28)), (20, 20, 20)); d = ImageDraw.Draw(S)
    for n, (s, im) in enumerate(ims):
        x, y = (n % cols) * tw, (n // cols) * (th + 28)
        S.paste(im, (x, y + 28)); d.text((x + 4, y + 4), f"{s['id']}{'★' if s['best'] and s['takes'] > 1 else ''} {s['group']} {s['s']:.0f}s", fill="yellow", font=f)
    S.save(w("takes_sheet.jpg"), quality=85)
print("\n".join(L[:3]))
print(f"-> {w('takes.md')}, {w('takes.json')}" + (", takes_sheet.jpg" if src.exists() else ""))
