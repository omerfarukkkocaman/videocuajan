"""Ders kurgusu (ekran kaydı + anlatım, yüz yok): bekleme / "eee" / düzeltme kesimi ve hızlandırma.

Akış:
  1) hazırlık: work/src_orig.mp4 (30 fps), audio16k/48k.wav, transcript.json (Whisper + MMS hizalama, KAYNAK zamanı)
  2) ./studyo py - pipeline/ders_kurgu.py analiz <slug>   -> work/ders_cumleler.md (cümleler + indeks), work/ders_aktivite.json,
                                                     work/ders_bosluklar.md (sessizlik / ekran hareketi / dolgu adayları)
  3) plan.json "ders": {"drop": [[i0,i1],...], "drop_t": [[a,b],...], "keep_t": [[a,b],...], "speed_t": [[a,b],...],
                       "fixes": {kaynak_indeks: "yazım" | null}, ...}   (kur, fixes'i yeni indekslere taşıyıp plan.fixes'e yazar)
  4) ./studyo py - pipeline/ders_kurgu.py kur <slug>      -> work/src_sdr4k.mp4 (kesilmiş + hızlandırılmış taban, 30 fps 1920x1080),
                                                     audio16k/48k.wav (kesilmiş ses), transcript.json (ÇIKIŞ zamanı; kaynak:
                                                     transcript_src.json), work/ders_harita.json (parça: kaynak -> çıkış, hız)
  5) normal hat: plan.cut.min_cut 99 + src_start 0 + src_end = taban süresi -> ./studyo cut / render / audio / final

Kurallar:
  - Konuşma parçaları kelimelerden kurulur: ilk kelimeden önce pre (ünlüyle başlayan kelimede pre_vowel), son kelimeden sonra tail.
  - Kelime arası boşluk <= max_pause ise olduğu gibi kalır (doğal konuşma). Daha uzunsa ortası kesilir: kalan es = pause_keep.
    Boşlukta sesli enerji varsa (Whisper'ın yazmadığı "eee/ıı" dolgusu) es, dolgunun dışında kalacak şekilde kırpılır.
  - Ekranda hareket olan uzun sessizlik (kurulum, yükleme, yapay zekâ yazıyor) kesilmez, hızlandırılır (speed_t ya da otomatik):
    hedef süre = clamp(1.2 + .12 * süre, 1.5, 4.0) s, hız tamsayı (kare seçimi), ses sessiz.
  - drop: atılacak kelime aralıkları (yanlış söyleyip düzeltme, yarım cümle, tekrar). drop_t / keep_t: elle saniye aralığı.
"""
import json
import math
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
SR = 48000
VOWELS = set("aeıioöuüAEIİOÖUÜâîû")


def wpath(slug, name):
    return ROOT / "projects" / slug / "work" / name


def load_wav(path, sr):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)


def rms_db(x, sr, step=0.02):
    n = int(sr * step); m = len(x) // n
    v = np.sqrt(np.mean(x[: m * n].reshape(m, n) ** 2, axis=1))
    return 20 * np.log10(v + 1e-9)


def zcr(x, sr, step=0.02):
    n = int(sr * step); m = len(x) // n
    s = np.sign(x[: m * n].reshape(m, n))
    return np.mean(np.abs(np.diff(s, axis=1)), axis=1) / 2 * sr


# ---------------------------------------------------------------- analiz
def activity(slug):
    """Ekran hareketi: 4 kare/s, 320x180 gri; ardışık kare farkı (değişen piksel oranı) ve değişim kutusu."""
    src = wpath(slug, "src_orig.mp4")
    W, H = 320, 180
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", str(src), "-vf", f"fps=4,scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
                       capture_output=True, check=True).stdout
    fr = np.frombuffer(p, np.uint8).reshape(-1, H, W).astype(np.int16)
    out = []
    for k in range(1, len(fr)):
        d = np.abs(fr[k] - fr[k - 1]) > 18
        frac = float(d.mean())
        if frac > 0:
            ys, xs = np.nonzero(d)
            box = [int(xs.min()) / W, int(ys.min()) / H, (int(xs.max()) + 1) / W, (int(ys.max()) + 1) / H]
        else:
            box = None
        out.append({"t": round(k / 4, 2), "f": round(frac, 5), "box": [round(v, 3) for v in box] if box else None})
    json.dump(out, open(wpath(slug, "ders_aktivite.json"), "w"))
    return out


def sentences(words):
    """Cümleler: noktalama ya da >0.9 s es ile böl."""
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(i)
        nxt = words[i + 1] if i + 1 < len(words) else None
        if nxt is None or re.search(r"[.!?]$", w["w"]) or nxt["s"] - w["e"] > 0.9:
            out.append(cur); cur = []
    return out


def analiz(slug):
    tr = json.load(open(wpath(slug, "transcript.json")))
    words = tr["words"]
    act_f = wpath(slug, "ders_aktivite.json")
    act = json.load(open(act_f)) if act_f.exists() else activity(slug)
    x = load_wav(wpath(slug, "audio16k.wav"), 16000)
    db, zc = rms_db(x, 16000), zcr(x, 16000)
    floor = float(np.percentile(db, 10))

    def act_in(a, b):
        v = [r for r in act if a <= r["t"] <= b]
        return (max([r["f"] for r in v], default=0.0), float(np.mean([r["f"] for r in v])) if v else 0.0)

    def voiced_in(a, b):
        i0, i1 = int(a / 0.02), int(b / 0.02)
        seg_db, seg_z = db[i0:i1], zc[i0:i1]
        if len(seg_db) == 0: return 0.0
        v = (seg_db > max(floor + 22, -42)) & (seg_z < 3500)          # sesli (ünlü benzeri) enerji: dolgu "eee/ıı"
        return float(v.sum() * 0.02)

    lines = []
    for si, s in enumerate(sentences(words)):
        a, b = words[s[0]]["s"], words[s[-1]]["e"]
        lp = [i for i in s if words[i].get("p", 1) < 0.5]
        txt = " ".join(words[i]["w"] for i in s)
        lines.append(f"S{si} [{s[0]}-{s[-1]}] {a:7.2f}-{b:7.2f}  {txt}" + (f"   (düşük güven: {', '.join(words[i]['w'] + '@' + str(i) for i in lp)})" if lp else ""))
    (wpath(slug, "ders_cumleler.md")).write_text("\n".join(lines), encoding="utf-8")

    gl = ["# boşluk listesi: i (önceki kelime) | kaynak a-b | süre | sesli enerji (dolgu adayı) | ekran hareketi max/ort | öneri"]
    for i in range(len(words) - 1):
        a, b = words[i]["e"], words[i + 1]["s"]
        if b - a < 0.35: continue
        v = voiced_in(a + 0.05, b - 0.05)
        amax, amean = act_in(a, b)
        if b - a >= 2.5 and amean > 0.002: oner = "HIZLANDIR"
        elif b - a > 0.55: oner = "kısalt" + (" (dolgu)" if v > 0.15 else "")
        else: oner = "dolgu?" if v > 0.15 else ""
        gl.append(f"{i:5d} | {a:8.2f}-{b:8.2f} | {b - a:5.2f} | {v:4.2f} | {amax:.4f}/{amean:.4f} | {oner}  [{words[i]['w']} … {words[i + 1]['w']}]")
    (wpath(slug, "ders_bosluklar.md")).write_text("\n".join(gl), encoding="utf-8")
    dur = len(x) / 16000
    print(f"{slug}: {len(words)} kelime, {len(lines)} cümle, kaynak {dur / 60:.1f} dk -> work/ders_cumleler.md, ders_bosluklar.md")


# ---------------------------------------------------------------- kur
def kur(slug):
    P = ROOT / "projects" / slug
    plan = json.load(open(P / "plan.json"))
    cfg = {"pre": .10, "pre_vowel": .14, "tail": .16, "max_pause": .55, "pause_keep": .32, "auto_speed": True,
           "drop": [], "drop_t": [], "keep_t": [], "speed_t": [], "no_speed_t": []}
    cfg.update(plan.get("ders", {}))
    src_tr = wpath(slug, "transcript_src.json")
    if not src_tr.exists():                                            # ilk kurulum: kaynak transkripti sakla
        src_tr.write_text(wpath(slug, "transcript.json").read_text(encoding="utf-8"), encoding="utf-8")
    words = json.load(open(src_tr))["words"]
    for k in ("audio48k.wav", "audio16k.wav"):                         # kaynak sesleri sakla (kur tekrar çalışabilsin)
        o = wpath(slug, k.replace(".wav", "_src.wav"))
        if not o.exists(): wpath(slug, k).rename(o)
    x48 = load_wav(wpath(slug, "audio48k_src.wav"), SR)
    src_dur = len(x48) / SR
    x16 = load_wav(wpath(slug, "audio16k_src.wav"), 16000)
    db, zc = rms_db(x16, 16000), zcr(x16, 16000)
    floor = float(np.percentile(db, 10))
    voiced = (db > max(floor + 22, -42)) & (zc < 3500)

    dropped = set()
    for i0, i1 in cfg["drop"]:
        dropped.update(range(i0, i1 + 1))
    for a, b in cfg["drop_t"]:
        dropped.update(i for i, w in enumerate(words) if w["s"] >= a - 1e-3 and w["e"] <= b + 1e-3)
    if cfg.get("auto_filler", True):                                  # Whisper'ın yazdığı dolgu: "Ee", "Iı", "Hı", "Hmm"
        FIL = re.compile(r"^(e+|ı+|i+h?|hı+|ıh+|hm+|m+|ee+m*|a+h?)$", re.I)
        dropped.update(i for i, w in enumerate(words) if FIL.match(re.sub(r"[.,!?…\-]", "", w["w"]).lower()))
    kept = [i for i in range(len(words)) if i not in dropped]

    def first_voiced(a, b, rev=False):
        """[a,b] içinde ilk (rev: son) sesli enerji anı; yoksa None."""
        i0, i1 = int(a / 0.02), int(b / 0.02)
        idx = np.nonzero(voiced[i0:i1])[0]
        if len(idx) == 0: return None
        return (i0 + (idx[-1] if rev else idx[0])) * 0.02 + (0.02 if rev else 0)

    # 1) konuşma parçaları (kaynak zamanı)
    segs = []
    for n, i in enumerate(kept):
        w = words[i]
        pre = cfg["pre_vowel"] if w["w"][:1] in VOWELS else cfg["pre"]
        a, b = w["s"] - pre, w["e"] + cfg["tail"]
        prev_kept = n > 0 and kept[n - 1] == i - 1
        if n > 0:
            pw = words[kept[n - 1]]
            gap = w["s"] - pw["e"]
            # atılan kelimeye komşu kenar: pay boşluk - 20 ms (atılanın kırıntısı girmesin)
            if not prev_kept:
                lim = w["s"] - words[i - 1]["e"] - 0.02
                a = w["s"] - max(0.0, min(pre, lim))
            if segs and prev_kept and gap <= cfg["max_pause"]:
                segs[-1][1] = max(segs[-1][1], b); continue
            if segs and prev_kept:                                      # uzun es: ortasını kes; dolgu varsa dışında kal
                ga, gb = pw["e"], w["s"]
                ta = min(cfg["tail"], cfg["pause_keep"] / 2 + 0.02)
                tb = min(pre, cfg["pause_keep"] / 2 + 0.02)
                fv = first_voiced(ga + 0.03, gb - 0.03)
                if fv is not None: ta = max(0.03, min(ta, fv - ga - 0.02))
                lv = first_voiced(ga + 0.03, gb - 0.03, rev=True)
                if lv is not None: tb = max(0.03, min(tb, gb - lv - 0.02))
                segs[-1][1] = ga + ta; a = gb - tb
        if n + 1 < len(kept) and kept[n + 1] != i + 1:                 # sonraki kelime atılmış: kuyruğu kırp
            nxt = words[i + 1]
            b = w["e"] + max(0.0, min(cfg["tail"], nxt["s"] - w["e"] - 0.02))
        segs.append([max(0.0, a), min(src_dur, b)])
    # atılan kelimenin iki yanındaki birleşme: cümle/virgül sonrası es kalmadıysa atılan bölgenin içindeki en uzun temiz sessizlikten
    # ~.2 s ödünç al (yoksa "…siniz En" gibi yapışık duyulur)
    auto_keep = []
    if cfg.get("auto_pause", True):
        quiet = db < floor + 8
        for n in range(1, len(kept)):
            i0, i1 = kept[n - 1], kept[n]
            if i1 == i0 + 1 or not re.search(r"[.,!?;:]$", words[i0]["w"]): continue
            ga, gb = words[i0]["e"] + 0.05, words[i1]["s"] - 0.05
            if any(not (sp[1] <= ga or sp[0] >= gb) for sp in cfg["speed_t"]): continue   # elle hızlandırılan beklemeye es konmaz
            if gb - ga < 0.2: continue
            q = quiet[int(ga / 0.02): int(gb / 0.02)]
            best, run, st = (0, 0), 0, 0
            for k, v in enumerate(q):
                if v: run += 1
                else: run = 0
                if run > best[1] - best[0]: best = (k - run + 1, k + 1)
            if (best[1] - best[0]) * 0.02 >= 0.15:
                a = ga + best[0] * 0.02; auto_keep.append([a, min(a + 0.2, ga + best[1] * 0.02)])
    for a, b in cfg["keep_t"] + auto_keep: segs.append([a, b])
    for a, b in cfg["drop_t"]:                                         # elle atılan saniye aralığı her parçadan oyulur
        nxt = []
        for s0, s1 in segs:
            if b <= s0 or a >= s1: nxt.append([s0, s1]); continue
            if s0 < a: nxt.append([s0, a])
            if b < s1: nxt.append([b, s1])
        segs = nxt
    segs.sort()
    merged = []
    for s in segs:
        if merged and s[0] <= merged[-1][1] + 1 / FPS: merged[-1][1] = max(merged[-1][1], s[1])
        else: merged.append(list(s))
    speech = [{"a": a, "b": b, "k": 1} for a, b in merged]

    # 2) hızlandırılacak sessiz bölümler (ekranda hareket)
    speed = [list(s) for s in cfg["speed_t"]]
    elle = [(s[0], s[1]) for s in speed]
    if cfg["auto_speed"]:
        act = json.load(open(wpath(slug, "ders_aktivite.json")))
        at = np.array([r["t"] for r in act]); af = np.array([r["f"] for r in act])
        for s0, s1 in zip(merged, merged[1:]):
            ga, gb = s0[1], s1[0]
            if gb - ga < 2.5: continue
            if any(not (b <= ga or a >= gb) for a, b in cfg["drop_t"] + cfg["no_speed_t"]): continue
            if any(ga < words[j]["s"] < gb for j in dropped): continue        # atılan konuşmanın boşluğu: hızlandırılmaz, kesilir
            if any(not (b <= ga or a >= gb) for a, b in elle): continue        # elle verilmiş hızlandırma var
            m = (at >= ga) & (at <= gb)
            if m.sum() and af[m].mean() > 0.002: speed.append([ga, gb])
    parts = speech[:]
    for sp in speed:
        a, b = sp[0], sp[1]
        dur = b - a
        target = sp[2] if len(sp) > 2 else min(4.0, max(1.5, 1.2 + 0.12 * dur))   # speed_t: [a, b] ya da [a, b, hedef süre]
        k = max(2, int(round(dur / target)))
        parts.append({"a": a, "b": b, "k": k, "hiz": True})
    parts.sort(key=lambda p: p["a"])
    for p, q in zip(parts, parts[1:]):                                 # hızlı bölüm konuşmayla çakışmasın
        if q["a"] < p["b"]:
            if p.get("hiz"): p["b"] = q["a"]
            else: q["a"] = p["b"]
    parts = [p for p in parts if p["b"] - p["a"] >= 1 / FPS]

    # 3) kare seçimi (kare indeksine yuvarla) + çıkış haritası
    t_out, harita, sel_ranges = 0.0, [], []
    for p in parts:
        f0, f1 = int(round(p["a"] * FPS)), int(round(p["b"] * FPS))
        n = len(range(f0, f1, p["k"]))
        if n <= 0: continue
        d = n / FPS
        harita.append({"src_a": f0 / FPS, "src_b": f1 / FPS, "out_a": round(t_out, 4), "out_b": round(t_out + d, 4), "k": p["k"]})
        sel_ranges.append((f0, f1, p["k"])); t_out += d

    # 4) görüntü: her parça ayrı kodlanır (kare doğru arama, paralel), sonra kayıpsız uç uca (concat demuxer)
    import shutil, tempfile
    from concurrent.futures import ThreadPoolExecutor
    tmp = Path(tempfile.mkdtemp(prefix="ders_parca_", dir=str(wpath(slug, "."))))
    def enc(job):
        k_i, (f0, f1, k) = job
        n = len(range(f0, f1, k)); out = tmp / f"{k_i:05d}.mp4"
        vf = (f"select='not(mod(n,{k}))',setpts=N/{FPS}/TB" if k > 1 else f"setpts=PTS-STARTPTS")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{f0 / FPS:.4f}", "-i", str(wpath(slug, "src_orig.mp4")), "-an",
                        "-vf", vf, "-frames:v", str(n), "-r", str(FPS), "-c:v", "h264_videotoolbox", "-b:v", "16M",
                        "-pix_fmt", "yuv420p", str(out)], check=True)
        got = int(subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries",
                                  "stream=nb_read_frames", "-of", "csv=p=0", str(out)], capture_output=True, text=True).stdout.strip() or 0)
        return out, n, got
    with ThreadPoolExecutor(6) as ex:
        res = list(ex.map(enc, enumerate(sel_ranges)))
    short = [(o.name, n, g) for o, n, g in res if g != n]
    if short: print("UYARI kare sayısı:", short[:8])
    (tmp / "list.txt").write_text("".join(f"file '{o}'\n" for o, _, _ in res))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(tmp / "list.txt"), "-c", "copy",
                    str(wpath(slug, "src_sdr4k.mp4"))], check=True)
    shutil.rmtree(tmp)

    # 5) ses: parça başı/sonu 8 ms fade; hızlı bölüm sessiz (oda tonu: kaynaktaki en sessiz 1 s, düşük seviye)
    fade = int(0.008 * SR)
    quiet = None
    blk = int(SR * 0.5); m = len(x48) // blk
    if m > 4:
        e = np.sqrt(np.mean(x48[: m * blk].reshape(m, blk) ** 2, axis=1)); j = int(np.argmin(e[1:-1])) + 1
        quiet = x48[j * blk:(j + 1) * blk] * 0.7
    out = []
    for h, (f0, f1, k) in zip(harita, sel_ranges):
        n = int(round((h["out_b"] - h["out_a"]) * SR))
        if k == 1:
            seg = x48[int(f0 / FPS * SR): int(f0 / FPS * SR) + n].copy()
            if len(seg) < n: seg = np.pad(seg, (0, n - len(seg)))
        else:
            seg = np.resize(quiet, n).copy() if quiet is not None else np.zeros(n, np.float32)
        r = np.linspace(0, 1, min(fade, len(seg) // 2), dtype=np.float32)
        if len(r): seg[: len(r)] *= r; seg[-len(r):] *= r[::-1]
        out.append(seg)
    y = np.concatenate(out).astype(np.float32)
    for name, sr in (("audio48k.wav", SR), ("audio16k.wav", 16000)):
        ch = "2" if sr == SR else "1"
        codec = ["-c:a", "pcm_s24le"] if sr == SR else []
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-ac", ch, "-ar", str(sr), *codec,
                        str(wpath(slug, name))], input=y.tobytes(), check=True)

    # 6) transkript: tutulan kelimeler çıkış zamanına
    sp = [h for h in harita if h["k"] == 1]
    def s2o(t):
        best = None
        for h in sp:                                                   # kare yuvarlaması: en yakın konuşma parçasına kenetle
            d = 0 if h["src_a"] <= t <= h["src_b"] else min(abs(t - h["src_a"]), abs(t - h["src_b"]))
            if best is None or d < best[0]: best = (d, h)
            if d == 0: break
        if best is None or best[0] > 0.12: return None
        h = best[1]; t = min(max(t, h["src_a"]), h["src_b"])
        return h["out_a"] + (t - h["src_a"])
    nw = []
    for i in kept:
        w = words[i]; s, e = s2o(w["s"]), s2o(w["e"])
        if s is None or e is None: continue
        nw.append({**w, "s": round(s, 3), "e": round(e, 3), "src_i": i, "src_s": w["s"], "src_e": w["e"]})
    json.dump({"text": " ".join(w["w"] for w in nw), "words": nw}, open(wpath(slug, "transcript.json"), "w"), ensure_ascii=False, indent=1)
    src2new = {w["src_i"]: n for n, w in enumerate(nw)}                # yazım düzeltmeleri kaynak indeksinde (plan.ders.fixes) -> yeni indeks
    plan["fixes"] = {str(src2new[int(k)]): v for k, v in cfg.get("fixes", {}).items() if int(k) in src2new}
    json.dump({"src_dur": src_dur, "out_dur": t_out, "parts": harita}, open(wpath(slug, "ders_harita.json"), "w"), indent=1)

    # 7) plan: tek parça, kesim yok (kesim burada yapıldı)
    plan.setdefault("cut", {}).update({"min_cut": 99, "src_start": 0.0, "src_end": round(t_out - 1 / FPS, 4)})
    json.dump(plan, open(P / "plan.json", "w"), ensure_ascii=False, indent=1)
    hz = [h for h in harita if h["k"] > 1]
    print(f"oto es: {len(auto_keep)} birleşme")
    print(f"{slug}: kaynak {src_dur / 60:.1f} dk -> {t_out / 60:.1f} dk | {len(harita)} parça, {len(hz)} hızlandırma "
          f"({sum(h['src_b'] - h['src_a'] for h in hz):.0f} s -> {sum(h['out_b'] - h['out_a'] for h in hz):.0f} s) | "
          f"{len(nw)}/{len(words)} kelime (atılan {len(words) - len(kept)})")


if __name__ == "__main__":
    cmd, slug = sys.argv[1], sys.argv[2]
    {"analiz": analiz, "kur": kur, "aktivite": activity}[cmd](slug)
