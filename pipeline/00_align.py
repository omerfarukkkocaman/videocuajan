"""Whisper metnini MMS forced alignment ile sese hizalar (kelime zamanları ±20 ms).
Whisper'ın kendi kelime zamanları 0.3-0.7 s kayabiliyor; altyazı ve kesimler buna dayanır.
Kullanım: ./studyo py <slug> pipeline/00_align.py
Çıktı: $WORK/transcript.json içinde "s","e" hizalanmış (orijinaller "ws","we").
"""
import json, os, re, sys
import numpy as np, scipy.io.wavfile as wf, torch
sys.path.insert(0, os.path.dirname(__file__))
from common import w, ROOT

os.environ.setdefault("TORCH_HOME", str(ROOT / ".cache/torch"))
from torchaudio.pipelines import MMS_FA as bundle

TR = str.maketrans({"ç": "c", "ğ": "g", "ı": "i", "İ": "i", "ö": "o", "ş": "s", "ü": "u", "â": "a", "î": "i", "û": "u"})
ONES = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"]
TENS = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"]


def num_tr(n):
    """Tamsayıyı Türkçe okunuşa çevirir: 2026 -> 'iki bin yirmi altı'."""
    if n == 0: return "sıfır"
    out = []
    for val, name in ((10**9, "milyar"), (10**6, "milyon"), (1000, "bin")):
        q, n = divmod(n, val)
        if q: out += ([] if (q == 1 and val == 1000) else [num_tr(q)]) + [name]
    h, n = divmod(n, 100)
    if h: out += ([] if h == 1 else [ONES[h]]) + ["yüz"]
    t, o = divmod(n, 10)
    out += [x for x in (TENS[t], ONES[o]) if x]
    return " ".join(out)


def spoken(tok):
    """Yazılı kelimeyi okunuşuna çevirir: 2026'dan, %50, 1,5, .com, 3."""
    tok = tok.replace("%", "yüzde ").replace(".com", " nokta com").replace("@", "et ")
    tok = re.sub(r"\b(\d{1,3})((?:\.\d{3})+)\b", lambda m: m.group(1) + m.group(2).replace(".", ""), tok)  # 2.500 -> 2500
    def rep(m):
        a, b, suf = m.group(1), m.group(2), m.group(3) or ""
        s = num_tr(int(a)) + (" virgül " + num_tr(int(b)) if b else "")
        return s + suf.lstrip("'’")
    return re.sub(r"(\d+)(?:[.,](\d+))?(['’]?[a-zçğıöşü]*)", rep, tok)


def norm(tok):
    s = spoken(tok).lower().translate(TR)
    return "".join(c for c in s if c.isalpha() or c == " ").strip() or "a"


data = json.load(open(w("transcript.json")))
words = data["words"]
sr, a = wf.read(w("audio16k.wav"))
assert sr == bundle.sample_rate
wav = torch.from_numpy(a.astype(np.float32) / 32768).unsqueeze(0)
model, tok, aligner = bundle.get_model(with_star=False), bundle.get_tokenizer(), bundle.get_aligner()

parts = [norm(x.get("raw", x["w"])).split() for x in words]   # sayılar birden çok sözcüğe açılır
flat = [p for ps in parts for p in ps]
with torch.inference_mode():
    emission, _ = model(wav)
spans = aligner(emission[0], tok(flat))
ratio = wav.size(1) / emission.size(1) / sr

k = 0
for x, ps in zip(words, parts):
    sp = spans[k:k + len(ps)]; k += len(ps)
    x.setdefault("ws", x["s"]); x.setdefault("we", x["e"])
    x["s"] = round(sp[0][0].start * ratio, 3)
    x["e"] = round(sp[-1][-1].end * ratio, 3)
json.dump(data, open(w("transcript.json"), "w"), ensure_ascii=False, indent=1)
for i, x in enumerate(words):
    flag = "  <-- kayma" if abs(x["s"] - x["ws"]) > 0.25 else ""
    print(f'{i:3d} {x["s"]:6.2f}-{x["e"]:6.2f}  (whisper {x["ws"]:6.2f})  {x["w"]}{flag}')
