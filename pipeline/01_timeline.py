"""Kesim listesi (EDL) + çıktı zaman çizelgesi + plan uygulama.
Girdi : $WORK/transcript.json (00_align ile hizalanmış), $P/plan.json (yoksa varsayılanlar)
Çıktı : $WORK/timeline.json (segments, jumps, words, chunks, cues, total)
        $WORK/events.json   (plan.audio varsa: ses ajanının girdisi)
Plan değişince tekrar çalıştırmak güvenli; sonra 02_cut ve render yeniden çalışmalı.
"""
import json, math, re, subprocess
from common import w, load_plan, FPS

plan = load_plan()
cut = {"tail": 0.10, "pre": 0.06, "min_cut": 0.12, **plan.get("cut", {})}
tr = json.load(open(w("transcript.json")))["words"]
snap = lambda t: round(t * FPS) / FPS

import os
SRCF = w("src_sdr4k.mp4") if os.path.exists(w("src_sdr4k.mp4")) else w("audio48k.wav")   # montaj: görüntü yok, ses dosyası
src_dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                SRCF], capture_output=True, text=True).stdout or 9999)
if not tr and "src_end" not in cut:                 # sessiz video (konuşma yok, ör. müzikli öncesi/sonrası): süre plandan
    raise SystemExit("transkriptte kelime yok: plan.cut.src_end (ve isteğe bağlı src_start) ile süreyi ver")
SRC_END = min(cut["src_end"] if "src_end" in cut else tr[-1]["e"] + 0.8, src_dur - 1 / FPS)

# --- kesim: kelimeler arası boşluğu kısalt, kelimenin içine asla girme ---
VOW = set("aeıioöuüâîûAEIİOÖUÜÂÎÛ")
pre_of = lambda x: cut.get("pre_vowel", cut["pre"]) if x["w"][:1] in VOW else cut["pre"]   # isteğe bağlı: ünlüyle başlayan kelimede hizalama başı geç kalır
cuts = []
for a, b in zip(tr, tr[1:]):
    ca, cb = a["e"] + cut["tail"], b["s"] - pre_of(b)
    if cb - ca >= cut["min_cut"]: cuts.append((snap(ca), snap(cb)))
cuts += [tuple(map(snap, c)) for c in plan.get("extra_cuts", [])]      # elle: tekrar edilen cümle vb.
cuts.sort()
segs, cur = [], snap(max(0, cut["src_start"] if "src_start" in cut else (tr[0]["s"] - 0.08 if tr else 0)))
for ca, cb in cuts:
    if ca > cur: segs.append([cur, ca])
    cur = max(cur, cb)
segs.append([cur, snap(SRC_END)])

# --- kurgu (ham uzun kayıt): plan.edit.keep = [[i0, i1], ...] kaynak kelime aralıkları, İSTENEN SIRADA ---
# Tekrar çekimler/yarım alımlar dışarıda kalır; sıra kaynaktan farklı olabilir. Aralık içindeki boşluklar yine kısalır.
EDIT = (plan.get("edit") or {}).get("keep")
keep_idx = None
if EDIT:
    rng = []
    for i0, i1 in EDIT:                                       # kaynakta bitişik ve sırası korunan aralıkları birleştir
        if rng and i0 == rng[-1][1] + 1: rng[-1][1] = i1
        else: rng.append([i0, i1])
    keep_idx = {i for a, b in rng for i in range(a, b + 1)}
    pre_e, tail_e = cut.get("edge_pre", 0.08), cut.get("edge_tail", 0.12)
    HOLD = {int(k): float(v) for k, v in (cut.get("hold") or {}).items()}
    PREW = {int(k): float(v) for k, v in (cut.get("pre_word") or {}).items()}   # isteğe bağlı: {kelime: saniye} — o kelimenin ön payı (önündeki kırıntıyı dışarıda bırak)   # isteğe bağlı: {kelime: saniye} — o kelimeden sonraki kesim kuyruğu (uzun: efekt/sahne duraklaması, çok kısa: hemen ardından gelen takılmayı at)
    segs = []
    for n, (i0, i1) in enumerate(rng):
        pre_n = pre_e if pre_of(tr[i0]) == cut["pre"] else max(pre_e, pre_of(tr[i0]))
        pre_n = PREW.get(i0, pre_n)
        tail_n = tail_e if n < len(rng) - 1 else cut.get("end_tail", 0.6)
        tail_n = HOLD.get(i1, tail_n)                                         # hold parça sonundaki kuyruğa da uygulanır
        # atılan komşu kelimenin (dolgu, yarım alım) sesi kenar payıyla içeri sızmasın: pay, boşluk - 20 ms ile sınırlı
        if i0 > 0 and (i0 - 1) not in keep_idx: pre_n = min(pre_n, max(0, tr[i0]["s"] - tr[i0 - 1]["e"] - 0.02))
        if i1 + 1 < len(tr) and (i1 + 1) not in keep_idx: tail_n = min(tail_n, max(0, tr[i1 + 1]["s"] - tr[i1]["e"] - 0.02))
        a0 = min(snap(max(0, tr[i0]["s"] - pre_n)), math.floor(tr[i0]["s"] * FPS) / FPS)          # kare yuvarlaması kelimeyi kırpmasın
        b0 = min(src_dur - 1 / FPS, max(snap(tr[i1]["e"] + tail_n), math.ceil(tr[i1]["e"] * FPS) / FPS))
        cur = a0
        for j, (a, b) in enumerate(zip(tr[i0:i1], tr[i0 + 1:i1 + 1]), start=i0):
            ca, cb = snap(a["e"] + HOLD.get(j, cut["tail"])), snap(b["s"] - PREW.get(j + 1, pre_of(b)))   # HOLD: bu kelimeden sonra doğal duraklama korunur
            if cb - ca >= cut["min_cut"] and ca > cur: segs.append([cur, ca]); cur = cb
        segs.append([cur, b0])


def src2out(t):
    if EDIT:                                                  # sırası değişmiş parçalar: t'yi içeren parçayı bul
        acc = 0.0
        for a, b in segs:
            if a - 1e-6 <= t <= b + 1e-6: return acc + (t - a)
            acc += b - a
        return None
    acc = 0.0
    for a, b in segs:
        if t < a: return acc
        if t <= b: return acc + (t - a)
        acc += b - a
    return acc


dur = round(sum(b - a for a, b in segs), 4)

# --- kelimeler: yalnızca yazım düzeltmeleri (plan.fixes: {indeks: "metin" | null=öncekine kat}) ---
fixes = {int(k): v for k, v in plan.get("fixes", {}).items()}
words = []
for i, x in enumerate(tr):
    if keep_idx is not None and i not in keep_idx: continue      # kurguda kullanılmayan alım
    txt = fixes.get(i, x["w"])
    prev_kept = keep_idx is None or (i - 1) in keep_idx
    glue = prev_kept and i not in fixes and words and x["w"][:1] in "-.'’" and x["s"] - tr[i - 1]["e"] < 0.15   # "E" + "-ticaret", "x" + ".com"
    if glue:
        words[-1]["t"] += x["w"]; words[-1]["e"] = round(src2out(x["e"]), 3); continue
    if txt is None and words and prev_kept:
        words[-1]["e"] = round(src2out(x["e"]), 3); continue
    o = src2out(x["s"])
    if o is None or o >= dur: continue
    words.append({"i": i, "t": txt.strip(), "s": round(src2out(x["s"]), 3), "e": round(src2out(x["e"]), 3)})
if not plan.get("cap_punct"):                                          # isteğe bağlı (ders altyazısı): noktalama korunur
    for x in words: x["t"] = re.sub(r"[.,!?;:…]+$", "", x["t"]) if not x["t"].endswith(".com") else x["t"]
byi = {x["i"]: x for x in words}


# --- altyazı blokları: plan.chunks veya otomatik (2-3 kelime, noktalama/duraklamada böl) ---
def auto_chunks():
    out, curc = [], []
    order = sorted(byi, key=lambda j: (byi[j]["s"], j))            # çıktı sırası (kurguda kaynaktan farklı olabilir)
    for n, k in enumerate(order):
        x = tr[k]
        curc.append(k)
        nxt = order[n + 1] if n + 1 < len(order) else None
        chars = sum(len(byi[j]["t"]) + 1 for j in curc)
        end = (nxt is None or len(curc) >= 3 or re.search(r"[.,!?]$", x["w"])
               or byi[nxt]["s"] - byi[k]["e"] > 0.35 or chars + len(byi[nxt]["t"]) > 18)
        if end: out.append({"w": curc}); curc = []
    return out


chunks = []
for c in plan.get("chunks") or auto_chunks():
    ws = [dict(byi[i], st=c.get("st", {}).get(str(i), "")) for i in c["w"] if i in byi]
    if ws: chunks.append({"s": ws[0]["s"], "e": ws[-1]["e"], "w": ws})
chunks.sort(key=lambda c: c["s"])
for a, b in zip(chunks, chunks[1:]):
    a["e"] = min(b["s"], a["e"] + 0.5)
if chunks: chunks[-1]["e"] = dur

end_card = float(plan.get("end_card", 0))
total = round(round((dur + end_card) * FPS) / FPS, 4)

# --- işaretler (cue): {"t":x} | {"word":i,"at":"s|e","off":x} | {"cue":"ad","off":x} | sayı | "ad" ---
raw_cues = {k: v for k, v in plan.get("cues", {}).items() if not k.startswith("_")}
cues = {"start": 0.0, "end": dur, "total": total}


def resolve(spec, stack=()):
    if isinstance(spec, (int, float)): return float(spec)
    if isinstance(spec, str):
        if spec in cues: return cues[spec]
        if spec in stack: raise ValueError("döngüsel cue: " + spec)
        cues[spec] = resolve(raw_cues[spec], stack + (spec,)); return cues[spec]
    off = spec.get("off", 0)
    if "t" in spec: return round(spec["t"] + off, 4)
    if "word" in spec: return round(byi[spec["word"]][spec.get("at", "s")] + off, 4)
    if "cue" in spec: return round(resolve(spec["cue"], stack) + off, 4)
    raise ValueError(f"çözülemeyen cue: {spec}")


for k in raw_cues: resolve(k)

jumps, acc = [], 0.0
for a, b in segs[:-1]:
    acc += b - a; jumps.append(round(acc, 4))

out = {"fps": FPS, "duration": dur, "frames": int(round(dur * FPS)), "total": total, "end_card": end_card,
       "segments": segs, "jumps": jumps, "cues": cues, "words": words, "chunks": chunks,
       "mirror": bool(plan.get("mirror", False)), "face": plan.get("face", {"fx": 0.5, "fy": 0.52})}
# stil seçimleri ve tür (yalnızca planda varsa yazılır; eski projelerin timeline'ı değişmez)
for k in ("kind", "orient", "captions", "density", "formats"):
    if k in plan: out[k] = plan[k]
if "orient" in plan:                                       # taban görüntü boyutu (02_cut / 02c_base ile aynı)
    out["src"] = {"w": 1440, "h": 2560, "orient": "v"} if plan["orient"] == "v" else {"w": 2560, "h": 1440, "orient": "h"}
    if plan.get("src_size"):                               # isteğe bağlı: 4K kaynakta kayıpsız yakınlaşma için büyük kare (ör. [2160, 3840])
        out["src"].update(w=plan["src_size"][0], h=plan["src_size"][1])

# --- B-roll: montaj (klipler zaman çizelgesini döşer) / karışık (yüzün yerine ara görüntü) ---
base = plan.get("base")
if base and base.get("clips"):
    NF = out["frames"]
    clips = []
    prev_to = "start"
    for c in base["clips"]:                                   # 'from' yazılmazsa bir önceki klibin 'to'su (zincirleme)
        a, b = resolve(c.get("from", prev_to)), resolve(c.get("to", "end")); prev_to = c.get("to", "end")
        f0, f1 = max(0, round(a * FPS)), min(NF, round(b * FPS))
        if f1 <= f0: raise SystemExit(f"B-roll aralığı boş: {c}")
        clips.append({**{k: v for k, v in c.items() if k not in ("from", "to")}, "a": round(a, 4), "b": round(b, 4), "f0": f0, "f1": f1})
    clips.sort(key=lambda c: c["f0"])
    for x, y in zip(clips, clips[1:]):
        if y["f0"] < x["f1"]: raise SystemExit(f"B-roll aralıkları çakışıyor: {x['clip']} / {y['clip']}")
    kind = base.get("kind", plan.get("kind", "montage"))
    if kind == "montage":
        if clips[0]["f0"] != 0 or clips[-1]["f1"] != NF or any(y["f0"] != x["f1"] for x, y in zip(clips, clips[1:])):
            raise SystemExit("montajda klipler zaman çizelgesini boşluksuz döşemeli (start..end)")
        out["jumps"] = []                                   # ses kesimleri görüntüde görünmez -> jump-cut zoom yok
        out["cuts"] = [round(c["a"], 4) for c in clips[1:]]  # klip geçişleri
    out["base"] = {"kind": kind, "clips": clips}
    out["cutaways"] = [[c["f0"], c["f1"]] for c in clips] if kind == "mixed" else []
if plan.get("kind") == "anim" and not out.get("base"):  # saf animasyon: yüz yok -> jump-cut zoom yok, taban sabit kare
    out["jumps"] = []
    out["base"] = {"kind": "anim", "clips": []}
json.dump(out, open(w("timeline.json"), "w"), ensure_ascii=False, indent=1)

# --- ses ajanı girdisi ---
au = plan.get("audio")
if au:
    ev = []
    for e in au.get("events", []):
        e = dict(e); spec = {k: e.pop(k) for k in ("t", "word", "at", "cue", "off") if k in e}
        ev.append({"t": resolve(spec), **e})
    sec = [{**s, "start": resolve(s["start"]), "end": resolve(s["end"])} for s in au.get("sections", [])]
    json.dump({"fps": FPS, "total_duration": total, "video_end": dur,
               "note": "Zamanlar çıktı zaman çizelgesinde saniye. Vuruş tepesi olaydan 1 kare sonra; süpürmeler dur sonunda tepe yapar.",
               "voice_file": "voice_cut.wav", "sections": sec, "events": sorted(ev, key=lambda e: e["t"]),
               **({"music": au["music"]} if "music" in au else {}), **({"voice": au["voice"]} if "voice" in au else {}),
               **({"tp_ceil": au["tp_ceil"]} if "tp_ceil" in au else {})},          # limiter tavanı (yoksa 04_audio varsayılanı)
              open(w("events.json"), "w"), ensure_ascii=False, indent=1)

print(f"kesim: {len(segs)} parça, {dur:.2f} s video + {end_card:.2f} s son kart = {total:.2f} s ({int(round(total * FPS))} kare)")
print("cues:", {k: round(v, 3) for k, v in cues.items()})
for x in words: print(f'{x["i"]:3d} {x["s"]:6.2f}-{x["e"]:6.2f} {x["t"]}', end=" |" if x["i"] % 6 != 5 else "\n")
print("\naltyazı:", " / ".join(" ".join(x["t"] for x in c["w"]) for c in chunks))
