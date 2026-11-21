"""Uzun kayıt için parçalı transkript + hizalama .
Neden: 00_align.py tüm sesi tek geçişte hizalar; ~40 dk'lık kayıtta bellek yetmeyip sessizce öldürüldü (çıktı yazılmadan).
Whisper medium da tek geçişte bazı kısa yerleri atladı (30 s pencere kayması). Bu betik sesi sessizliklerden ≤ 24 s parçalara böler,
her parçayı ayrı yazıya döker (atlamayı önler) ve ayrı hizalar (MMS, bellek sınırlı).

  DİKKAT (ders-03): parça parça Whisper medium + initial_prompt kısa parçada prompt'u uydurdu ("Topluluk.", "Bu Bu Bu"). Önerilen yol:
  tam geçiş medium (transcribe.py) + tam geçiş small birleşimi, hizalama parça parça:
  ./studyo py - pipeline/transcribe_parca.py birlestir <slug> <small.json>  -> work/transcript_birlesik.json (medium yazımı; medium'un
          atladığı yerler small'dan; zamanlar Whisper) — small.json: [{w,s,e}] (whisper small, word_timestamps, tam geçiş)
  ./studyo py <slug> pipeline/transcribe_parca.py hizala <slug> [birlesik] -> work/transcript.json (MMS ±20 ms; parçalar kelime
          boşluklarından kesilir, kelime iki parçaya bölünmez; "ws","we" = Whisper zamanı)
  ./studyo py - pipeline/transcribe_parca.py kirp <slug>  -> sessizliğe yayılmış uzun kelimeleri sesli kümeye kırpar (hizalamadan sonra)
  (eski yol: yazi <slug> -> work/transcript_parca.json)
"""
import json
import os
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))


def wpath(slug, n): return ROOT / "projects" / slug / "work" / n


def load16(slug):
    import scipy.io.wavfile as wf
    sr, a = wf.read(wpath(slug, "audio16k.wav"))
    assert sr == 16000
    return a.astype(np.float32) / 32768


def parcalar(x, sr=16000, hedef=(14, 24)):
    """Sessizlik ortalarından kesim noktaları: her parça hedef[0]..hedef[1] s; pencere içindeki en uzun sessizliğin ortası."""
    st = int(sr * .02); m = len(x) // st
    db = 20 * np.log10(np.sqrt(np.mean(x[: m * st].reshape(m, st) ** 2, axis=1)) + 1e-9)
    floor = np.percentile(db, 10)
    q = db < floor + 8
    cuts, t = [0.0], 0.0
    dur = len(x) / sr
    while dur - t > hedef[1]:
        a, b = int((t + hedef[0]) / .02), int((t + hedef[1]) / .02)
        best, run, bs = (0, a), 0, a
        for k in range(a, b):
            if q[k]:
                if run == 0: bs = k
                run += 1
                if run > best[0]: best = (run, bs)
            else: run = 0
        c = (best[1] + best[0] / 2) * .02 if best[0] else (t + hedef[1])
        cuts.append(round(c, 3)); t = c
    cuts.append(dur)
    return list(zip(cuts, cuts[1:]))


def yazi(slug):
    import whisper, warnings
    warnings.filterwarnings("ignore")
    plan = json.load(open(ROOT / "projects" / slug / "plan.json"))
    x = load16(slug)
    P = parcalar(x)
    m = whisper.load_model("medium", device="cpu")
    out = []
    for k, (a, b) in enumerate(P):
        seg = x[int(a * 16000): int(b * 16000)]
        r = m.transcribe(seg, language=plan.get("lang", "tr"), word_timestamps=True, fp16=False,
                         condition_on_previous_text=False, initial_prompt=plan.get("whisper_prompt"))
        for s in r["segments"]:
            for w in s["words"]:
                out.append({"w": w["word"].strip(), "s": round(a + w["start"], 3), "e": round(a + w["end"], 3),
                            "p": round(w.get("probability", 0), 3), "parca": k})
        print(f"{k + 1}/{len(P)} {a:7.1f}-{b:7.1f} {r['text'][:90]}", flush=True)
    json.dump({"parcalar": P, "words": out}, open(wpath(slug, "transcript_parca.json"), "w"), ensure_ascii=False, indent=1)


def birlestir(slug, small_path):
    import difflib, re
    TRm = str.maketrans("çğıöşüâî", "cgiosuai")
    n = lambda t: re.sub(r"[^a-z0-9]", "", t.lower().replace("İ", "i").translate(TRm))
    M = json.load(open(wpath(slug, "transcript_medium.json")))["words"]
    S = json.load(open(small_path))
    a, b = [n(x["w"]) for x in M], [n(x["w"]) for x in S]
    out = []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op in ("equal", "delete"): out += [dict(x) for x in M[i1:i2]]; continue
        la, lb = len("".join(a[i1:i2])), len("".join(b[j1:j2]))
        if op == "insert" or lb > la * 1.3 + 3:                           # medium burayı atlamış: small'un kelimeleri
            out += [{"w": x["w"], "s": x["s"], "e": x["e"], "p": 0.0, "ek": 1} for x in S[j1:j2]]
        else:
            out += [dict(x) for x in M[i1:i2]]
    for x in out: x.pop("parca", None)
    # sıra düzeltmesi: Whisper bazen birkaç kelimeyi yanlış zamana koyar (ders-05: 20 s'deki kelimeler 48 s'de); sonraki kelimelerden
    # geç başlayan kelimeler "bozuk" sayılır ve önceki/sonraki sağlam kelimeler arasına eşit aralıkla yayılır
    nxt, bad = 1e9, [False] * len(out)
    for i in range(len(out) - 1, -1, -1):
        if out[i]["s"] > nxt + .3: bad[i] = True
        else: nxt = min(nxt, out[i]["s"])
    i, nfix = 0, 0
    while i < len(out):
        if not bad[i]: i += 1; continue
        j = i
        while j + 1 < len(out) and bad[j + 1]: j += 1
        t0 = out[i - 1]["e"] if i > 0 else 0.0
        t1 = out[j + 1]["s"] if j + 1 < len(out) else t0 + .4 * (j - i + 1)
        step = max(.05, (t1 - t0) / (j - i + 1))
        for k in range(i, j + 1):
            out[k]["s"] = round(t0 + step * (k - i), 3); out[k]["e"] = round(t0 + step * (k - i + 1), 3); nfix += 1
        i = j + 1
    if nfix: print(f"sıra düzeltmesi: {nfix} kelime yeniden zamanlandı")
    json.dump({"text": " ".join(x["w"] for x in out), "words": out}, open(wpath(slug, "transcript_birlesik.json"), "w"),
              ensure_ascii=False, indent=1)
    print(f"medium {len(M)} + small {len(S)} -> {len(out)} kelime ({sum(1 for x in out if x.get('ek'))} small'dan)")


def bosluk_parcalari(words, x, sr=16000, hedef=(10, 24)):
    """Kelime listesini parçalara böl: kesim, ardışık iki kelime arasındaki en geniş boşlukta (Whisper zamanı), sesin o boşluktaki
    en sessiz anına. Kelime asla iki parçaya düşmez."""
    st = int(sr * .02); m = len(x) // st
    db = 20 * np.log10(np.sqrt(np.mean(x[: m * st].reshape(m, st) ** 2, axis=1)) + 1e-9)
    groups, cur, a = [], [], 0.0
    i = 0
    while i < len(words):
        cur.append(i)
        if words[i]["e"] - a >= hedef[0]:
            # pencere: bundan sonraki kelimeler hedef[1]'e kadar; en geniş boşluğu seç
            j_end = i
            while j_end + 1 < len(words) and words[j_end + 1]["e"] - a < hedef[1]: j_end += 1
            if j_end + 1 >= len(words): i += 1; continue
            best = max(range(i, j_end + 1), key=lambda k: words[k + 1]["s"] - words[k]["e"])
            cur += list(range(i + 1, best + 1))
            g0, g1 = words[best]["e"], words[best + 1]["s"]
            if g1 <= g0: g0, g1 = g0 - .15, g0 + .15
            k0, k1 = int(g0 / .02), max(int(g0 / .02) + 1, int(g1 / .02))
            c = (k0 + int(np.argmin(db[k0:k1]))) * .02
            if c <= a + .5:                                         # Whisper zamanı kaymışsa kesim önceki kesimin gerisine düşebilir (ders-05)
                c = max(words[best]["e"], a + max(1.0, words[best]["e"] - words[cur[0]]["s"]))
            groups.append((a, c, cur)); cur, a = [], c
            i = best + 1; continue
        i += 1
    if cur: groups.append((a, len(x) / sr, cur))
    return groups


def hizala(slug, kaynak="parca"):
    import torch
    os.environ.setdefault("TORCH_HOME", str(ROOT / ".cache/torch"))
    from torchaudio.pipelines import MMS_FA as bundle
    import re
    src = (ROOT / "pipeline" / "00_align.py").read_text(encoding="utf-8")   # okunuş yardımcıları (TR, num_tr, spoken, norm) tek kaynak
    ns = {"re": re}
    exec("TR = " + src.split("\nTR = ", 1)[1].split("\n\ndata = json.load", 1)[0], ns)
    _n = ns["norm"]
    def norm(t):                                                       # MMS sözlüğü yalnız a-z: Whisper'ın sessizlikte uydurduğu yabancı harfler atılır (ders-05: '직')
        v = re.sub(r"[^a-z ]", "", _n(t)).strip()
        return v or "a"
    x = load16(slug)
    if kaynak == "birlesik":
        words = json.load(open(wpath(slug, "transcript_birlesik.json")))["words"]
        G = bosluk_parcalari(words, x)
        T = {"parcalar": [(a, b) for a, b, _ in G]}
        groups = [[words[i] for i in g] for _, _, g in G]
    else:
        T = json.load(open(wpath(slug, "transcript_parca.json")))
        words = T["words"]
        groups = [[w for w in words if w["parca"] == k] for k in range(len(T["parcalar"]))]
    model, tok, aligner = bundle.get_model(with_star=False), bundle.get_tokenizer(), bundle.get_aligner()
    for k, (a, b) in enumerate(T["parcalar"]):
        ws = groups[k]
        if not ws: continue
        seg = torch.from_numpy(x[int(a * 16000): int(b * 16000)].copy()).unsqueeze(0)
        parts = [norm(w["w"]).split() for w in ws]
        flat = [p for ps in parts for p in ps]
        with torch.inference_mode():
            em, _ = model(seg)
        spans = aligner(em[0], tok(flat))
        ratio = seg.size(1) / em.size(1) / 16000
        j = 0
        for w, ps in zip(ws, parts):
            sp = spans[j:j + len(ps)]; j += len(ps)
            w["ws"], w["we"] = w["s"], w["e"]
            w["s"] = round(a + sp[0][0].start * ratio, 3)
            w["e"] = round(a + sp[-1][-1].end * ratio, 3)
        print(f"{k + 1}/{len(T['parcalar'])}", flush=True)
    for w in words: w.pop("parca", None)
    json.dump({"text": " ".join(w["w"] for w in words), "words": words}, open(wpath(slug, "transcript.json"), "w"),
              ensure_ascii=False, indent=1)
    kay = [w for w in words if abs(w["s"] - w["ws"]) > .4]
    print(f"{len(words)} kelime hizalandı; Whisper'dan > 0.4 s kayan {len(kay)}")


def kirp(slug):
    """Hizalama bazen kelimeyi önündeki/arkasındaki sessizliğe yayar (ders-03: "Şimdi" 21 s). > 0.8 s kelimede sesli kümeler bulunur;
    kelime cümle sonuysa (. ? ! …) ilk kümeye, değilse son kümeye kırpılır (önündeki es atılır)."""
    import re
    T = json.load(open(wpath(slug, "transcript.json"))); w = T["words"]
    x = load16(slug); st = 320; m = len(x) // st
    db = 20 * np.log10(np.sqrt(np.mean(x[: m * st].reshape(m, st) ** 2, axis=1)) + 1e-9); v = db > np.percentile(db, 10) + 14
    n = 0
    for y in w:
        if y["e"] - y["s"] <= .8: continue
        k0, k1 = int(y["s"] / .02), int(y["e"] / .02); idx = np.nonzero(v[k0:k1])[0]
        if not len(idx): continue
        runs, s0, pv = [], idx[0], idx[0]
        for j in idx[1:]:
            if j - pv > 15: runs.append((s0, pv)); s0 = j
            pv = j
        runs.append((s0, pv))
        if len(runs) == 1 and idx[0] <= 15 and (k1 - k0 - 1 - idx[-1]) <= 15: continue
        r = runs[0] if re.search(r"[.?!…]$", y["w"]) else runs[-1]
        y["s"], y["e"] = round(max(y["s"], (k0 + r[0]) * .02 - .03), 3), round(min(y["e"], (k0 + r[1] + 1) * .02 + .03), 3); n += 1
    json.dump(T, open(wpath(slug, "transcript.json"), "w"), ensure_ascii=False, indent=1)
    print(f"{n} kelime sessizlikten kırpıldı")


if __name__ == "__main__":
    {"yazi": yazi, "hizala": hizala, "birlestir": birlestir, "kirp": kirp}[sys.argv[1]](*sys.argv[2:])
