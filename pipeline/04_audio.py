"""Reels ses tasarımı — müzik + SFX + ses temizliği + miks (tamamen veri güdümlü).

Kullanım (klasör kökünden):
    ./studyo audio <slug>        (WORK yoksa: "work")
Girdi ($WORK):  voice_cut.wav   kurgulanmış ses (mono/stereo, 48 kHz)
                timeline.json   "duration", "words" [{s,e}] (çıktı zamanı)
                events.json     total_duration, video_end, sections, events, (opsiyonel) music, voice
                                (plan.json "audio" bloğundan 01_timeline.py ile türetilir; elle düzenleme)
Çıktı ($WORK):  music.wav (ducking'siz yatak, -1 dBFS tepe), sfx.wav (miks seviyesinde),
                voice_proc.wav, mix.wav (48 kHz/24 bit/stereo, tam total_duration, -14 LUFS, TP <= -1.5 dBTP),
                audio_report.json (ölçümler)
Videoya özgü hiçbir sabit yok: müzik düzeni events.json "music" bloğundan okunur; blok ya da alanları
eksikse olaylardan/bölümlerden türetilir (derive_music). Kurallar: .claude/skills/reels/ses-kurallari.md
Tüm rastgelelik tohumludur -> aynı girdi, bit-bit aynı çıktı.
"""
import json, math, os, re, subprocess, sys, wave
from functools import lru_cache
from pathlib import Path
from types import SimpleNamespace

import numpy as np
from scipy import signal
from scipy.io import wavfile
from scipy.ndimage import maximum_filter1d, minimum_filter1d, uniform_filter1d

ROOT = Path(__file__).resolve().parent.parent
W = Path(os.environ.get("WORK", "work"))
if not W.is_absolute():
    W = ROOT / W
FF = "ffmpeg"

SR = 48000
FRAME = 1 / 30                    # SFX tepesi görsel olaydan 1 kare sonra
FADE_END = 0.15                   # son 0.15 s tam sessizliğe iner
LUFS_TARGET, TP_CEIL = -14.0, -1.9
VOICE_LUFS = -28.0                # mono ses için hedef; kompresör eşiği bu seviyeye göre ayarlı
MUSIC_UNDER_VOICE = 18.5          # konuşurken müzik, konuşmanın bu kadar dB altında
DUCK_DB = 6.0                     # boşluklarda müzik bu kadar yükselir


def warn(msg):
    print(f"   UYARI: {msg}", file=sys.stderr)
# ───────────────────────── yardımcılar ─────────────────────────
def db(x):
    return 10 ** (x / 20)


def to_db(x):
    return 20 * np.log10(np.maximum(x, 1e-12))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(n):
    return np.arange(n) / SR


def sos(kind, f, order=2):
    return signal.butter(order, f, kind, fs=SR, output="sos")


def filt(x, s):
    return signal.sosfilt(s, x, axis=0)


def fade_tail(n, sec=0.01):
    """son `sec` saniyede kosinüs fade-out (tık olmasın)"""
    e = np.ones(n)
    k = min(n, int(sec * SR))
    if k > 0:
        e[-k:] = 0.5 * (1 + np.cos(np.linspace(0, np.pi, k)))
    return e


def panned(x, pan):
    """mono -> stereo, eşit güç pan (-1 sol .. +1 sağ), merkezde her kanal 1.0"""
    if x.ndim == 2:
        return x
    a = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2)


def place(bus, x, t0=None, i0=None, gain=1.0, pan=0.0):
    """sinyali stereo bus'a t0 (s) veya i0 (örnek) konumundan ekler, taşanı kırpar"""
    x = panned(np.asarray(x, float), pan) * gain
    if i0 is None:
        i0 = int(round(t0 * SR))
    a, b = max(i0, 0), min(i0 + len(x), len(bus))
    if b > a:
        bus[a:b] += x[a - i0:b - i0]


def norm_peak(x):
    return x / (np.max(np.abs(x)) + 1e-12)


def rbj(kind, f0, q=0.707, gain_db=0.0):
    """RBJ biquad (lowpass/highpass/lowshelf) -> sos"""
    w = 2 * np.pi * f0 / SR
    cw, sw = np.cos(w), np.sin(w)
    al = sw / (2 * q)
    if kind == "lp":
        b = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2]; a = [1 + al, -2 * cw, 1 - al]
    elif kind == "hp":
        b = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2]; a = [1 + al, -2 * cw, 1 - al]
    else:  # ls / hs raf, S=1
        A = 10 ** (gain_db / 40)
        sa = 2 * np.sqrt(A) * sw / 2 * np.sqrt(2)
        if kind == "ls":
            b = [A * ((A + 1) - (A - 1) * cw + sa), 2 * A * ((A - 1) - (A + 1) * cw), A * ((A + 1) - (A - 1) * cw - sa)]
            a = [(A + 1) + (A - 1) * cw + sa, -2 * ((A - 1) + (A + 1) * cw), (A + 1) + (A - 1) * cw - sa]
        else:
            b = [A * ((A + 1) + (A - 1) * cw + sa), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - sa)]
            a = [(A + 1) - (A - 1) * cw + sa, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - sa]
    b, a = np.array(b) / a[0], np.array(a) / a[0]
    return np.concatenate([b, a])[None, :]


def sweep(x, t0, t1, fc_of_t, kind, q, blk=128):
    """zamanla değişen rezonanslı filtre (blok bazlı, durum taşınır); bölge kenarlarında 15 ms crossfade"""
    a, b = int(t0 * SR), int(t1 * SR)
    seg = x[a:b].copy()
    out = np.zeros_like(seg)
    zi = np.zeros((1, 2, 2))
    for s in range(0, len(seg), blk):
        fc = float(fc_of_t(t0 + (s + blk / 2) / SR))
        y, zi = signal.sosfilt(rbj(kind, min(fc, 20000), q), seg[s:s + blk], axis=0, zi=zi)
        out[s:s + blk] = y
    k = int(0.015 * SR)
    ramp = np.ones(len(seg)); ramp[:k] = np.linspace(0, 1, k); ramp[-k:] = np.linspace(1, 0, k)
    x[a:b] = seg * (1 - ramp[:, None]) + out * ramp[:, None]
    return x


def env_rms(x, win_s):
    """kanalların ortalaması üzerinden kayan RMS zarfı"""
    m = x.mean(1) if x.ndim == 2 else x
    return np.sqrt(np.maximum(uniform_filter1d(m ** 2, max(1, int(win_s * SR))), 0))


def peak_index(x, win_s):
    return int(np.argmax(env_rms(x, win_s)))


def read_wav(p):
    sr, x = wavfile.read(p)
    assert sr == SR, sr
    if x.dtype == np.int32:
        x = x / 2.0 ** 31
    elif x.dtype == np.int16:
        x = x / 32768.0
    return x.astype(np.float64)


def write_wav24(p, x):
    x = np.ascontiguousarray(np.clip(x, -1.0, 1.0 - 2 ** -23))
    q = np.round(x * 2 ** 23).astype("<i4")
    raw = q.view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(str(p), "wb") as w:
        w.setnchannels(x.shape[1]); w.setsampwidth(3); w.setframerate(SR)
        w.writeframes(raw)


def ebur128(p):
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", str(p), "-af",
                        "ebur128=peak=true:framelog=quiet", "-f", "null", "-"],
                       capture_output=True, text=True)
    I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)[-1])
    tp = float(re.findall(r"Peak:\s+(-?[\d.]+|-inf) dBFS", r.stderr)[-1])
    return I, tp


def ebur128_frames(p):
    """ffmpeg ebur128 kare günlüğü -> [(t, M, S)]: t = pencere sonu (s), M = momentary (400 ms), S = short-term (3 s) LUFS"""
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-v", "verbose", "-i", str(p), "-af", "ebur128", "-f", "null", "-"],
                       capture_output=True, text=True)       # kare günlüğü verbose düzeyinde basılır (ffmpeg 8)
    return [(float(a), float(b), float(c)) for a, b, c in
            re.findall(r"t:\s*([\d.]+)\s+TARGET:\S+ LUFS\s+M:\s*(-?[\d.]+|-inf)\s+S:\s*(-?[\d.]+|-inf)", r.stderr)]


def end_fade(x):
    """son 0.15 s kosinüs fade -> son örnek tam 0"""
    k = int(FADE_END * SR)
    x[-k:] *= (0.5 * (1 + np.cos(np.linspace(0, np.pi, k))))[:, None]
    x[-1] = 0.0
    return x


def reverb_ir(rt60, length, seed, predelay=0.012, hf_rt=0.5):
    """stereo konvolüsyon IR'ı: sönümlenen gürültü, tizler daha hızlı söner"""
    rng = np.random.default_rng(seed)
    n = int(length * SR)
    t = tt(n)
    ir = np.zeros((n, 2))
    for c in range(2):
        nz = rng.standard_normal(n)
        lo = filt(nz, sos("lowpass", 3000))
        hi = nz - lo
        ir[:, c] = lo * np.exp(-6.9 * t / rt60) + 0.6 * hi * np.exp(-6.9 * t / (rt60 * hf_rt))
    ir = filt(ir, sos("highpass", 180))
    ir *= np.minimum(1, t / 0.02)[:, None]                      # yumuşak başlangıç
    ir = np.concatenate([np.zeros((int(predelay * SR), 2)), ir])
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def convolve(x, ir):
    y = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return y


# ───────────────────────── 0) YAPILANDIRMA (events.json -> cfg) ─────────────────────────
KEYS = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6,
        "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}
# Fa majörde voicing'ler (bas midi, stab, pad); başka tonlar transpoze edilir
ROMAN_F = {
    "I":   dict(bass=41, stab=[65, 69, 72, 76], pad=[53, 57, 60, 64]),   # Fmaj9
    "ii":  dict(bass=43, stab=[62, 65, 67, 70], pad=[55, 58, 62, 65]),   # Gm7
    "iii": dict(bass=45, stab=[64, 67, 69, 72], pad=[57, 60, 64, 67]),   # Am7
    "IV":  dict(bass=34, stab=[62, 65, 69, 72], pad=[46, 53, 57, 62]),   # Bbmaj9
    "V":   dict(bass=36, stab=[64, 67, 72, 74], pad=[48, 55, 60, 64]),   # Cadd9
    "vi":  dict(bass=38, stab=[65, 69, 72, 74], pad=[50, 57, 60, 65]),   # Dm7
}
LIGHT_KW = ("brand", "marka", "çözüm", "cozum", "ferah", "solution", "logo", "ürün", "urun", "product")
CTA_KW = ("cta", "takip", "follow", "abone", "subscribe", "kaydet")
URGENT_KW = ("urgent", "acil", "aciliyet", "gerilim", "hemen", "tension", "uyarı")


def kw(sec, words):
    s = (sec.get("name", "") + " " + sec.get("mood", "")).lower()
    return any(w in s for w in words)


def r6(x):
    """türetilmiş zamanları yuvarla (kayan nokta kırıntısı ızgarayı bozmasın)"""
    return round(x, 6)


def voicing(roman, key_pc):
    if roman not in ROMAN_F:
        warn(f"bilinmeyen akor '{roman}', I kullanılıyor"); roman = "I"
    v, off = ROMAN_F[roman], (key_pc - 5 + 6) % 12 - 6
    bass = v["bass"] + off
    bass += 12 if bass < 33 else -12 if bass > 47 else 0
    return dict(bass=bass, stab=[m + off for m in v["stab"]], pad=[m + off for m in v["pad"]])


def subtract(ranges, cuts):
    """aralık listesinden kesilecek aralıkları çıkar"""
    out = [list(r) for r in ranges]
    for c0, c1 in cuts:
        nxt = []
        for a, b, *g in out:
            if c1 <= a or c0 >= b:
                nxt.append([a, b, *g]); continue
            if a < c0: nxt.append([a, c0, *g])
            if c1 < b: nxt.append([c1, b, *g])
        out = nxt
    return [r for r in out if r[1] - r[0] > 1e-6]


def derive_music(ev, m, final, beat):
    """music bloğunda olmayan her alanı olaylardan/bölümlerden türetir"""
    s16 = beat / 4
    ceilb = lambda t: r6(math.ceil(r6(t / beat)) * beat)
    floorb = lambda t: r6(math.floor(r6(t / beat)) * beat)
    floor8 = lambda t: r6(math.floor(r6(t / (beat / 2))) * beat / 2)
    events, secs = ev.get("events", []), ev.get("sections", [])
    risers = [e for e in events if "riser" in e["type"]]
    rend = [e["t"] + e.get("dur", 0.7) for e in risers]
    d = {}
    if "builds" not in m:       # her riser'ın sonunda biten 3 vuruşluk trampet rulosu + HPF
        d["builds"] = [[min(floorb(e["t"]), r6(floor8(x) - 3 * beat)), floor8(x)] for e, x in zip(risers, rend)]
    builds = m.get("builds", d.get("builds"))
    if "gaps" not in m:         # riser sonundaki vuruşa kadar kısa boşluk
        d["gaps"] = [[floor8(x), ceilb(x + 0.01)] for x in rend]
    if "hits" not in m:         # riser sonuna denk gelen impact = müzik vuruşu
        d["hits"] = [{"t": e["t"]} for e in events if "impact" in e["type"] and "final" not in e["type"]
                     and any(abs(e["t"] - x) < 0.06 for x in rend)]
    if "drops" not in m:        # videonun ortasındaki damga/impact: davul kesilir + LPF
        drops, last = [], -1e9
        for e in events:
            if e["type"] in ("stamp_impact", "impact") and 0.25 * final < e["t"] < 0.75 * final \
                    and not any(abs(e["t"] - x) < 0.06 for x in rend) and e["t"] - last > 8:
                drops.append([r6(math.floor(r6(e["t"] / s16)) * s16), ceilb(e["t"] + 0.9)]); last = e["t"]
        d["drops"] = drops
    drops = m.get("drops", d.get("drops"))
    light = [[floor8(s["start"]), ceilb(s["end"])] for s in secs if kw(s, LIGHT_KW) and s["start"] < final]
    cta = [[ceilb(s["start"]), final] for s in secs if kw(s, CTA_KW) and s["start"] < final and not kw(s, LIGHT_KW)]
    urgent = [[ceilb(s["start"]), floor8(min(s["end"], final))] for s in secs if kw(s, URGENT_KW)]
    if "light" not in m: d["light"] = light
    if "urgent" not in m: d["urgent"] = urgent
    light, urgent = m.get("light", d.get("light")), m.get("urgent", d.get("urgent"))
    hook = [[0.0, ceilb(secs[0]["end"])]] if secs else [[0.0, ceilb(min(4 * beat * 2, final))]]
    lay = dict(m.get("layers", {}))
    calm = drops + m.get("gaps", d.get("gaps")) + builds
    lay.setdefault("ghost_hats", hook + urgent + light + cta)
    lay.setdefault("open_hats", subtract(urgent, [[b[0], final] for b in builds]))
    lay.setdefault("stabs", subtract(hook + urgent + cta, calm + light))
    lay.setdefault("stabs_sparse", subtract([[hook[0][1], final]], hook + urgent + cta + light + calm))
    lay.setdefault("arps", subtract([[hook[0][1], final]], light + cta + calm))
    d["layers"] = lay
    if "crashes" not in m:      # açılış, drop dönüşleri, CTA girişi
        cr = [[0.0, 0.30]] if any(e["t"] < 0.1 for e in events) else []
        d["crashes"] = cr + [[b, 0.22] for a, b in drops] + [[c[0], 0.16] for c in cta]
    if "skip_first_kick" not in m:
        d["skip_first_kick"] = any("impact" in e["type"] and e["t"] < 0.1 for e in events)
    return d


def load_config():
    ev = json.load(open(W / "events.json"))
    try:
        tl = json.load(open(W / "timeline.json"))
    except OSError:
        tl = {}
    words = tl.get("words", [])
    video_end = float(ev.get("video_end", tl.get("duration", 0)) or 0)
    finals = [e["t"] for e in ev.get("events", []) if "final" in e["type"]]
    m = dict(ev.get("music", {}))
    final = float(m.get("final_hit", finals[0] if finals else video_end))
    if m.get("file") and "final_hit" not in m and not finals:
        # hazır parça (music.file): sentez final vuruşu yok; "final" = son fade'in başı (total'i uzatmasın)
        final = float(ev.get("total_duration", video_end)) - float(m["file"].get("fade_out", 1.0))
    total = float(ev.get("total_duration", final + 1.13))
    if total < final + 0.4:
        warn(f"total_duration {total} final vuruşa çok yakın; {final + 1.0:.2f} s yapıldı"); total = final + 1.0
    bpm = float(m.get("bpm", 120)); beat = 60 / bpm
    key = m.get("key", "F")
    if key not in KEYS:
        warn(f"bilinmeyen ton '{key}', F kullanılıyor"); key = "F"
    # isteğe bağlı music.bed_end: final vuruşundan sonra pad/arp yatağı bu ana kadar sürer (verilmezse = final, eski yol)
    bed_end = min(float(m.get("bed_end", final)), total)
    nbars = math.ceil(r6(max(final, bed_end) / (4 * beat)))
    prog = m.get("progression", ["I", "vi", "IV", "V"])
    bars = list(m.get("bars", [])) or [prog[i % len(prog)] for i in range(nbars)]
    bars += [prog[i % len(prog)] for i in range(len(bars), nbars)]      # kısa liste -> döngüyle tamamla
    derived = derive_music(ev, m, final, beat)
    mus = {**derived, **m}
    mus["layers"] = {**derived["layers"], **m.get("layers", {})}
    events = []
    for e in ev.get("events", []):
        e = dict(e)
        if not 0 <= e["t"] < total:
            warn(f"olay {e['type']} t={e['t']} süre dışında, atlandı"); continue
        events.append(e)
    last_word = max((w["e"] for w in words), default=video_end)
    cfg = SimpleNamespace(
        N=int(round(total * SR)), total=total, video_end=video_end, final=final,
        beat=beat, s16=beat / 4, key_pc=KEYS[key], bars=bars,
        chords=[voicing(b, KEYS[key]) for b in bars], final_chord=voicing(m.get("final_chord", "I"), KEYS[key]),
        drops=mus["drops"], builds=mus["builds"], gaps=mus["gaps"], light=mus["light"],
        light_gain_db=float(mus.get("light_gain_db", 2.0)), layers=mus["layers"],
        hits=mus["hits"], crashes=mus["crashes"], skip_first_kick=bool(mus["skip_first_kick"]),
        events=events, words=words, last_word=last_word, voice_opts=ev.get("voice", {}),
        derived=derived, sections=ev.get("sections", []),
        gain_ramps=m.get("gain_ramps", []),   # [[t0, t1, dB, (geri dönüş s)]]: bölgesel müzik seviyesi (ör. girişte kısık)
        piano=dict(m.get("piano", {})),       # piyano ayarları: final, final_pluck, room, tone_db, hall
        light_pluck=float(m.get("light_pluck_gain", 0.24)),   # hafif bölümdeki 8'lik çan-pluck kazancı (0 = yok)
        final_crash=float(m.get("final_crash_gain", 0.32)),   # final vuruşundaki crash
        kick_kind=str(m.get("kick", "club")),                 # "felt" = kliksiz keçe/timpani vuruşu (tüm müzik kick'leri)
        tp_ceil=float(ev.get("tp_ceil", TP_CEIL)))   # limiter tavanı; AAC kodlaması tepeyi ~0.5 dB taşırabilir
    # isteğe bağlı konuşmasız yol (voice.none): ses zinciri, ducking ve konuşma ölçümleri
    # atlanır; SFX seviyeleri müzik gövdesinin voice.music_under dB üstündeki SANAL konuşma referansına göre kurulur
    vo = ev.get("voice", {}) if isinstance(ev.get("voice"), dict) else {}
    cfg.no_voice = bool(vo.get("none"))
    cfg.nv_music_under = float(vo.get("music_under", 12.0))
    # isteğe bağlı music.drive: müzik veriyolu sonundaki tanh doygunluğunun sürüşü (vars. 1.4 = eski ifade, bit bit aynı).
    # Müzik önde olduğunda (konuşmasız) kick atakları limiter'ı her vuruşta 2-3 dB çalıştırır; daha yüksek sürüş
    # (ör. 2.0) atakları yumuşak kırpar, limiter'dan önce tepe/loudness oranını düşürür (mastering'de clipper -> limiter)
    cfg.music_drive = float(m.get("drive", 1.4))
    # isteğe bağlı final sonrası yatak : çağrı kartı okunurken müzik ölmesin. Final vuruşu
    # yerinde kalır; davul/8'lik bas/stab finalde eskisi gibi kesilir, pad + arp + light pluck/uzun bas bed_end'e kadar
    # sürer ve son bed_fade s'de kosinüsle söner (döngü yok). bed_end <= final ise kod yolu eskisiyle bit bit aynı.
    cfg.bed_end = max(bed_end, final)
    cfg.bed_fade = float(m.get("bed_fade", 0.5))
    # isteğe bağlı hazır müzik (music.file; kullanıcının kendi lisanslı müziği): {path, start, gain_db, fade_in, fade_out}.
    # Verilirse sentez müzik hiç üretilmez; parça (telifsiz, lisanslı) gövde olur. Verilmezse kod yolu aynı.
    cfg.music_file = dict(m["file"]) if isinstance(m.get("file"), dict) else None
    if cfg.tp_ceil != TP_CEIL:
        print(f"   limiter tavanı {cfg.tp_ceil} dBTP (events.json tp_ceil)")
    return cfg


# ───────────────────────── 1) SES (voice) ─────────────────────────
def speech_mask(cfg, n, pre=0.06, post=0.10):
    """timeline.json kelimelerinden konuşma maskesi (kelime yoksa her yer konuşma sayılır)"""
    if not cfg.words:
        return np.ones(n, bool)
    m = np.zeros(n, bool)
    for w in cfg.words:
        m[max(0, int((w["s"] - pre) * SR)):int((w["e"] + post) * SR)] = True
    return m


def clip_gain(cfg, n, ranges, xf=0.02):
    """voice.gain: [[t0, t1, dB], ...] (çıktı zamanı) -> doğrusal kazanç zarfı (alımlar arası seviye farkı).
    Basamak dB zarfı ~xf s'lik Hann ile süzülür: geçiş sınır merkezli ve yumuşak; sınırlar kesim/duraklama
    (sessizlik) içine konmalı, kelime içine düşerse uyarır."""
    g = np.zeros(n)
    for t0, t1, d in ranges:
        for t in (t0, t1):
            if any(w["s"] < t < w["e"] for w in cfg.words):
                warn(f"voice.gain sınırı {t} bir kelimenin içinde")
        g[max(0, int(round(t0 * SR))):min(n, int(round(t1 * SR)))] += float(d)
    k = signal.windows.hann(int(xf * SR) + 1)
    h = len(k) // 2
    g = signal.fftconvolve(np.pad(g, (h, h), mode="edge"), k / k.sum(), mode="valid")
    return db(g)


def range_eq(cfg, x, ranges, xf=0.02):
    """voice.eq (isteğe bağlı): [[t0, t1, [[f_Hz, kazanç_dB, Q?], ...]], ...] (çıktı zamanı).
    Farklı oda/mikrofon mesafesinde çekilmiş alımların tonunu yaklaştırır: aralığa RBJ tepe (peaking) filtreleri uygulanır,
    sınırda ~xf s'lik Hann geçişiyle karışır (sınırlar kesim/duraklama içinde olmalı; kelime içine düşerse uyarır).
    Kompresörden ÖNCE (dfn ve voice.gain'den sonra). Verilmezse kod yolu aynı."""
    n = len(x)
    for t0, t1, bands in ranges:
        for t in (t0, t1):
            if any(w["s"] < t < w["e"] for w in cfg.words):
                warn(f"voice.eq sınırı {t} bir kelimenin içinde")
        y = x
        for bnd in bands:
            f0, g, q = float(bnd[0]), float(bnd[1]), float(bnd[2]) if len(bnd) > 2 else 1.0
            A, w0 = 10 ** (g / 40), 2 * np.pi * f0 / SR
            al = np.sin(w0) / (2 * q)
            bb = np.array([1 + al * A, -2 * np.cos(w0), 1 - al * A]); aa = np.array([1 + al / A, -2 * np.cos(w0), 1 - al / A])
            y = signal.sosfilt(np.concatenate([bb / aa[0], aa / aa[0]])[None, :], y)
        m = np.zeros(n)
        m[max(0, int(round(t0 * SR))):min(n, int(round(t1 * SR)))] = 1.0
        k = signal.windows.hann(int(xf * SR) + 1); h = len(k) // 2
        m = signal.fftconvolve(np.pad(m, (h, h), mode="edge"), k / k.sum(), mode="valid")
        x = x * (1 - m) + y * m
    return x


def declick(cfg, x):
    """yalnız konuşma DIŞINDAKİ ani ağız/dudak tıklarını bastırır (konuşmaya dokunmaz)"""
    hf = filt(x, sos("highpass", 1500))
    e_fast = np.sqrt(np.maximum(uniform_filter1d(hf ** 2, int(0.001 * SR)), 0))
    e_bg = np.sqrt(np.maximum(uniform_filter1d(hf ** 2, int(0.08 * SR)), 0))
    click = (e_fast > 4 * e_bg) & (e_fast > db(-50)) & ~speech_mask(cfg, len(x))
    g = np.where(minimum_filter1d(~click, int(0.006 * SR)), 1.0, db(-24))
    g = uniform_filter1d(g, int(0.003 * SR))
    idx = np.flatnonzero(click)
    times = sorted({round(i / SR, 2) for i in idx})
    return x * g, times


def spectral_denoise(cfg, x, opts):
    """voice.denoise (isteğe bağlı): konuşma-farkında spektral gürültü azaltma, kompresörden SONRA
    (kompresör duraklardaki gürültüyü ~5 dB yükseltiyor). Değişen gürültüyü (geçen araç, motor) izler: gürültü PSD'si ortalanmış
    minimum istatistiğiyle (win_s) bulunur, sapması kelime dışı karelerden ölçülür. Kazanç: karar-yönlendirmeli Wiener (dd),
    'sqrt' kuralı (genlik; ünsüz kaybı az, müzikal gürültü az). Konuşmada frekansa bağlı taban (sp_floor [[üst_Hz, dB], ...]);
    kelime dışında ns_extra dB ek kısma, toplam ns_min dB'de durur (delik açmaz). Konuşma = kelime hizalaması (pre/post pay)
    VEYA 300-3000 Hz bandı gürültü tahmininin vad_db üstünde (hizalama geç/erken kalsa da kelime başı kısılmaz); geçiş xf s."""
    o = dict(sp_floor=[[1000, -10.0], [6000, -8.0], [24000, -10.0]], ns_extra=-16.0, ns_min=-24.0, over=1.0, win_s=1.0,
             dd=0.98, pre=0.06, post=0.08, xf=0.03, vad_db=8.0, rule="sqrt", nfft=1024, hop=256, fsmooth=3, tsmooth=3)
    o.update(opts if isinstance(opts, dict) else {})
    nfft, hop = int(o["nfft"]), int(o["hop"])
    f, t, X = signal.stft(x, SR, window="hann", nperseg=nfft, noverlap=nfft - hop, boundary="even", padded=True)
    P = np.abs(X) ** 2 + 1e-20
    Ps = np.maximum(signal.filtfilt([0.2], [1, -0.8], P, axis=1), 1e-20)          # ~25 ms sıfır fazlı yumuşatma
    Pmin = minimum_filter1d(Ps, size=max(3, int(o["win_s"] * SR / hop)), axis=1, mode="nearest")
    sp = np.zeros(len(t), bool)
    for w in cfg.words:
        sp |= (t > w["s"] - o["pre"]) & (t < w["e"] + o["post"])
    end = cfg.words[-1]["e"] + 0.15 if cfg.words else t[-1]
    ns = ~sp & (t > 0.05) & (t < end)
    bias = np.median(Ps[:, ns] / Pmin[:, ns], axis=1) if ns.sum() >= 10 else np.full(len(f), 2.0)
    bias = np.clip(uniform_filter1d(bias, 9), 1.0, 6.0)
    Nz = uniform_filter1d(bias[:, None] * Pmin, max(1, int(0.25 * SR / hop)), axis=1) * float(o["over"])
    G = np.empty_like(P)
    gprev, Pprev = np.ones(len(f)), P[:, 0]
    for i in range(P.shape[1]):
        xi = o["dd"] * gprev ** 2 * Pprev / Nz[:, i] + (1 - o["dd"]) * np.maximum(P[:, i] / Nz[:, i] - 1, 0)
        g = xi / (1 + xi)
        g = np.sqrt(g) if o["rule"] == "sqrt" else g
        G[:, i] = g
        gprev, Pprev = g, P[:, i]
    band = (f >= 300) & (f <= 3000)
    vad = 10 * np.log10(Ps[band].sum(0) / Nz[band].sum(0)) > o["vad_db"]
    vad = maximum_filter1d(vad.astype(np.uint8), 2 * max(1, int(0.02 * SR / hop)) + 1).astype(bool)
    spv = sp | (vad & (t < end + 0.3))
    fl = np.zeros(len(f)); lo = 0.0
    for hi, d in o["sp_floor"]:
        fl[(f >= lo) & (f < hi)] = d; lo = hi
    fl = uniform_filter1d(fl, 5)
    m = uniform_filter1d(spv.astype(float), max(1, int(o["xf"] * SR / hop)))
    G = np.maximum(G * db(o["ns_extra"] * (1 - m))[None, :], db(o["ns_min"] + (fl[:, None] - o["ns_min"]) * m[None, :]))
    G = uniform_filter1d(uniform_filter1d(G, int(o["fsmooth"]), axis=0), int(o["tsmooth"]), axis=1)
    _, y = signal.istft(X * G, SR, window="hann", nperseg=nfft, noverlap=nfft - hop, boundary=True)
    y = np.pad(y[:len(x)], (0, max(0, len(x) - len(y))))
    return y, dict(o, noise_bias_dB=round(float(10 * np.log10(np.median(bias))), 1), noise_frames=int(ns.sum()),
                   vad_added_frames=int((spv & ~sp).sum()))


def dfn_denoise(x, opts):
    """voice.dfn (isteğe bağlı): DeepFilterNet3 ile konuşmayı gürültüden ayırır (araç/motor/trafik,
    konuşmayla aynı bantta olsa da). Resmi deep-filter programı (v0.5.6, .cache/dfn/deep-filter; repo: Rikorose/DeepFilterNet).
    opts: {"atten_lim": dB (gürültü en fazla bu kadar kısılır, ses doğal kalsın; 100 = sınırsız), "pf": son filtre}.
    -D ile STFT/lookahead gecikmesi telafi edilir; kalan kayma çapraz korelasyonla ölçülüp geri alınır (dudak senkronu)."""
    exe = ROOT / opts.get("bin", ".cache/dfn/deep-filter")
    if not exe.exists():
        sys.exit(f"voice.dfn: {exe} yok (DeepFilterNet deep-filter programı)")
    d = W / "_dfn"
    (d / "out").mkdir(parents=True, exist_ok=True)
    wavfile.write(d / "v.wav", SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
    lim = float(opts.get("atten_lim", 20))
    subprocess.run([str(exe), "-D", "-a", str(lim), *(["--pf"] if opts.get("pf") else []), "-o", str(d / "out"), str(d / "v.wav")],
                   check=True, capture_output=True)
    y = read_wav(d / "out" / "v.wav")
    y = y[:, 0] if y.ndim == 2 else y
    y = np.concatenate([y, np.zeros(max(0, len(x) - len(y)))])[:len(x)]
    lag = xcorr_lag(y, x)
    y = np.roll(y, -lag) if lag else y
    return y, dict(atten_lim_dB=lim, pf=bool(opts.get("pf")), lag=lag)


def xcorr_lag(a, b, absolute=False):
    seg = slice(min(SR * 2, len(a) // 4), min(SR * 8, len(a)))
    c = signal.correlate(a[seg], b[seg], mode="full", method="fft")
    return int(signal.correlation_lags(len(a[seg]), len(b[seg]))[np.argmax(np.abs(c) if absolute else c)])


def process_voice(cfg):
    N = cfg.N
    x = read_wav(W / "voice_cut.wav")
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    L, R = x[:, 0], x[:, 1]
    # iPhone stereo mikrofonları arasında ~12 örnek gecikme olabilir: toplamadan önce hizala (2 kHz çentiği olmasın)
    lag = xcorr_lag(L, R)
    mono, clicks = declick(cfg, 0.5 * (L + np.roll(R, lag)))
    dfn_info = None
    if cfg.voice_opts.get("dfn"):    # isteğe bağlı yapay zekâ gürültü ayırma (DeepFilterNet3): tüm zincirden ÖNCE
        mono, dfn_info = dfn_denoise(mono, cfg.voice_opts["dfn"])
    if cfg.voice_opts.get("gain"):   # isteğe bağlı klip kazancı: dinamik işlemden (ön kazanç, kompresör) ÖNCE
        mono = mono * clip_gain(cfg, len(mono), cfg.voice_opts["gain"])
    if cfg.voice_opts.get("eq"):     # isteğe bağlı aralık EQ'su: alımlar arası ton farkı (kompresörden ÖNCE)
        mono = range_eq(cfg, mono, cfg.voice_opts["eq"])
    wavfile.write(W / "_voice_mono.wav", SR, mono.astype(np.float32))
    # seviye: kompresör eşiği VOICE_LUFS (mono) için ayarlı; 1 dB+ sapma varsa önce kazançla getir
    I_in, _ = ebur128(W / "_voice_mono.wav")
    pre = float(np.clip(VOICE_LUFS - I_in, -20, 30)) if abs(VOICE_LUFS - I_in) > 1.0 else 0.0
    if pre:
        mono = mono * db(pre)
        wavfile.write(W / "_voice_mono.wav", SR, mono.astype(np.float32))
    # gürültü tabanı: konuşma dışı 50 ms karelerin 10. yüzdeliği -> afftdn ayarı (temiz kayıtta nazik)
    nsp = ~speech_mask(cfg, len(mono), 0.08, 0.15)
    fr = mono[:len(mono) // 2400 * 2400].reshape(-1, 2400)
    quiet = nsp[:len(fr) * 2400].reshape(-1, 2400).all(1)
    rms = to_db(np.sqrt((fr[quiet] ** 2).mean(1))) if quiet.sum() >= 4 else to_db(np.sqrt((fr ** 2).mean(1)))
    noise = float(np.percentile(rms, 10))
    vo = cfg.voice_opts
    noisy = noise > -50
    nf, nr = (float(np.clip(round(noise) + 8, -70, -25)), 20) if noisy else (-45, 10)
    nf, nr = vo.get("nf", nf), vo.get("nr", nr)
    # gürültülü kayıtta kompresör tabanı geri yükseltir -> ardından yumuşak expander (en fazla ~-10 dB)
    gate = vo.get("expander", noisy)
    # isteğe bağlı voice.hpf (Hz): dışarıda/rüzgârda çekimde 80 Hz HPF'nin bıraktığı uğultu için (ör. 120); yoksa 80
    chain = ",".join([
        f"highpass=f={vo.get('hpf', 80)}:poles=2"] + ([
        f"afftdn=nr={nr}:nf={nf}:tn=1"] if nr else []) + [   # nazik gürültü azaltma (voice.nr 0 = afftdn yok)
        "equalizer=f=250:t=q:w=1.0:g=-2",                  # kutu/çamur sesi
        "equalizer=f=3500:t=q:w=0.9:g=2.5",                # presence
        "highshelf=f=9000:g=1.5",                          # hava
        "acompressor=threshold=0.05:ratio=3:attack=8:release=150:knee=2.5:makeup=1.5",
    ] + (["agate=threshold=0.03:ratio=2:range=0.3:attack=5:release=150:knee=4"] if gate else []))
    subprocess.run([FF, "-v", "error", "-y", "-i", str(W / "_voice_mono.wav"), "-af", chain,
                    "-c:a", "pcm_f32le", str(W / "_voice_proc_f.wav")], check=True)
    v = read_wav(W / "_voice_proc_f.wav")
    v = v[:, 0] if v.ndim == 2 else v
    # afftdn gecikme ekler (~25 ms): çapraz korelasyonla ölç, dudak senkronu için geri kaydır
    delay = xcorr_lag(v, mono)
    v = np.concatenate([v[delay:], np.zeros(delay)]) if delay > 0 else v
    if delay < 0:                 # afftdn yoksa (voice.nr 0) zincirin faz kayması tepeyi birkaç örnek öne alabilir: geri hizala
        v = np.concatenate([np.zeros(-delay), v[:delay]])
    dn_info = None
    if vo.get("denoise"):         # isteğe bağlı konuşma-farkında spektral NR (kompresörden sonra; değişen araç/motor gürültüsü)
        v, dn_info = spectral_denoise(cfg, v, vo["denoise"])
    out = np.zeros(N)
    out[:min(len(v), N)] = v[:N]
    if "head_fade_ms" in vo:      # isteğe bağlı: kayıt ses ortasından başlıyorsa (önceki kelimenin kuyruğu) kosinüs giriş
        k = max(1, int(float(vo["head_fade_ms"]) / 1000 * SR))
        out[:k] *= 0.5 * (1 - np.cos(np.linspace(0, np.pi, k)))
    else:
        out[:int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))   # baş tık güvenliği
    # isteğe bağlı: kelime dışı ağız/dudak sesi (declick'in yakalamadığı ~10-20 ms'lik şaklama) susturulur;
    # voice.mute = [[t0, t1], ...] (çıktı zamanı, s), kenarlar aralık dışında 3 ms kosinüs
    for a_, b_ in vo.get("mute", []):
        if any(w["s"] < b_ and w["e"] > a_ for w in cfg.words):
            warn(f"voice.mute [{a_}, {b_}] bir kelimeyle çakışıyor")
        i0, i1, k = int(round(a_ * SR)), int(round(b_ * SR)), int(0.003 * SR)
        g = np.ones(N)
        g[i0:i1] = 0.0
        g[max(0, i0 - k):i0] = 0.5 * (1 + np.cos(np.linspace(0, np.pi, i0 - max(0, i0 - k))))
        g[i1:min(N, i1 + k)] = 0.5 * (1 - np.cos(np.linspace(0, np.pi, min(N, i1 + k) - i1)))
        out *= g
    # son kelimeden sonra oda tonunu video sonundan ~1 kare önce yumuşakça kapat
    sp = np.flatnonzero(speech_mask(cfg, N, 0, 0.18))
    b = int(round(cfg.video_end - 1 / 60, 2) * SR)
    a = min(int(sp[-1]) if len(sp) else b - int(0.6 * SR), b)
    out[a:b] *= 0.5 * (1 + np.cos(np.linspace(0, np.pi, b - a)))
    out[b:] = 0
    vs = np.stack([out, out], 1)
    write_wav24(W / "voice_proc.wav", vs)
    return vs, dict(channel_lag=lag, afftdn_delay=delay, input_lufs=I_in, pre_gain_db=round(pre, 2),
                    noise_floor_dBFS=round(noise, 1), afftdn=f"nr={nr}:nf={nf}", expander=bool(gate), declicked_at_s=clicks,
                    **({"head_fade_ms": float(vo["head_fade_ms"])} if "head_fade_ms" in vo else {}),
                    **({"hpf_Hz": vo["hpf"]} if "hpf" in vo else {}),
                    **({"denoise": dn_info} if dn_info else {}),
                    **({"dfn": dfn_info} if dfn_info else {}),
                    **({"muted_s": vo["mute"]} if vo.get("mute") else {}),
                    **({"clip_gain_dB": vo["gain"]} if vo.get("gain") else {}),
                    **({"range_eq": vo["eq"]} if vo.get("eq") else {}),
                    noise_vs_speech_dB=dict(before=noise_vs_speech(cfg, mono), after=noise_vs_speech(cfg, out[:len(mono)])))


def noise_vs_speech(cfg, x):
    """konuşma dışı 50 ms karelerin 10. yüzdeliği - konuşma RMS'i (dB); kısa boşlukta None"""
    k = min(len(x), int(cfg.last_word * SR)) // 2400 * 2400      # son kelimeden sonraki fade hariç
    fr = x[:k].reshape(-1, 2400)
    nsp = (~speech_mask(cfg, len(x), 0.08, 0.15))[:k].reshape(-1, 2400).all(1)
    sp = speech_mask(cfg, len(x), 0, 0)[:k].reshape(-1, 2400).all(1)
    if nsp.sum() < 4 or sp.sum() < 4:
        return None
    r = to_db(np.sqrt((fr ** 2).mean(1)))
    return round(float(np.percentile(r[nsp], 10) - to_db(np.sqrt((fr[sp] ** 2).mean()))), 1)


# ───────────────────────── 2) MÜZİK ─────────────────────────
ARP_PAT = [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 1, 3, 2, 4, 5, 3]


def inside(t, r):
    return r[0] <= t < r[1]


def inr(t, ranges):
    return any(r[0] <= t < r[1] for r in ranges)


def overlap(a, b, ranges):
    return sum(max(0.0, min(b, r[1]) - max(a, r[0])) for r in ranges)


@lru_cache(maxsize=None)
def pluck(midi, dur, decay, bright, cents=0.0, seed=0):
    """additive testere: üst harmonikler daha hızlı söner -> filtre zarflı pluck"""
    f = mtof(midi) * 2 ** (cents / 1200)
    n = int(dur * SR); t = tt(n)
    rng = np.random.default_rng(seed)
    y = np.zeros(n)
    for k in range(1, max(1, min(28, int(11000 / f))) + 1):
        y += np.sin(2 * np.pi * f * k * t + rng.uniform(0, 2 * np.pi)) * np.exp(-t * (1 + bright * (k - 1)) / decay) / k
    y *= np.minimum(1, t / 0.0015) * fade_tail(n, 0.015)
    return norm_peak(y)


@lru_cache(maxsize=None)
def bass_note(midi, dur, growl=1.0):
    f = mtof(midi); n = int(dur * SR); t = tt(n)
    sub = np.sin(2 * np.pi * f * t)
    harm = sum(np.sin(2 * np.pi * f * k * t) / k * np.exp(-t * (k - 1) / 0.25) for k in range(2, 10))
    y = np.tanh(2.0 * (0.35 * sub + 0.9 * growl * harm))                    # alt harmonikler telefonda da duyulsun
    env = np.minimum(1, t / 0.004) * (0.8 + 0.2 * np.exp(-t / 0.08)) * fade_tail(n, 0.03)
    return norm_peak(y * env)


def saw_blep(f, n, ph0):
    dt = f / SR
    ph = (ph0 + dt * np.arange(n)) % 1.0
    y = 2 * ph - 1
    m = ph < dt; x = ph[m] / dt; y[m] -= x + x - x * x - 1
    m = ph > 1 - dt; x = (ph[m] - 1) / dt; y[m] -= x * x + x + x + 1
    return y


def pad_chord(notes, dur, cutoff, rng, att=0.35, rel=0.6):
    n = int((dur + rel) * SR); t = tt(n)
    y = np.zeros((n, 2))
    for m in notes:
        for c, cents in enumerate((-9, 9)):               # sol/sağ farklı detune -> genişlik
            for d in (0, cents):
                y[:, c] += saw_blep(mtof(m) * 2 ** (d / 1200), n, rng.uniform())
    y = filt(y, sos("lowpass", cutoff, 4))
    env = np.minimum(1, t / att)
    env[t > dur] *= np.exp(-(t[t > dur] - dur) / (rel / 4))
    return y * (env * fade_tail(n, 0.05))[:, None] / (len(notes) * 2)


def make_kick():
    n = int(0.45 * SR); t = tt(n)
    f = 58 + 110 * np.exp(-t / 0.025) + 70 * np.exp(-t / 0.004)
    body = 0.75 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)
    knock = 0.45 * np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.018)       # telefonda duyulan "tok" kısım
    click = filt(np.random.default_rng(11).standard_normal(n), sos("highpass", 2500)) * np.exp(-t / 0.003) * 0.45
    y = np.tanh(2.4 * (body + knock + click)) * fade_tail(n, 0.03)
    return norm_peak(y)


def make_felt_kick():
    """kliksiz yumuşak vuruş (keçe tokmak / timpani benzeri): perde 110->58 Hz, 4 ms atak, gürültü kliği yok;
    165 Hz gövde telefonda duyulur, 4. derece 1.2 kHz alçak geçiren -> 2.5 kHz üstünde enerji yok"""
    n = int(0.6 * SR); t = tt(n)
    f = 58 + 52 * np.exp(-t / 0.04)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    knock = 0.35 * np.sin(2 * np.pi * 165 * t) * np.exp(-t / 0.035)
    nz = filt(np.random.default_rng(12).standard_normal(n), sos("lowpass", 700))
    felt = 0.25 * nz / (np.std(nz) + 1e-12) * np.exp(-t / 0.012)
    y = (body + knock + felt) * np.minimum(1, t / 0.004) * fade_tail(n, 0.05)
    return norm_peak(filt(y, sos("lowpass", 1200, 4)))


def make_clap(seed):
    rng = np.random.default_rng(seed)
    n = int(0.45 * SR); t = tt(n)
    out = np.zeros((n, 2))
    for c in range(2):
        nz = filt(rng.standard_normal(n), sos("bandpass", [950, 4200]))
        e = sum((t >= d) * np.exp(-np.clip(t - d, 0, None) / 0.0045) for d in (0, 0.010, 0.021))
        e = e + (t >= 0.028) * 0.6 * np.exp(-np.clip(t - 0.028, 0, None) / 0.10)
        out[:, c] = nz * e
    out += (0.35 * np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.04))[:, None]   # trampet gövdesi
    return norm_peak(out * fade_tail(n)[:, None])


def make_hat(seed, decay, n_s=0.35):
    rng = np.random.default_rng(seed)
    n = int(n_s * SR); t = tt(n)
    metal = sum(np.sign(np.sin(2 * np.pi * f * t + rng.uniform(0, 6))) for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0))
    y = 0.5 * metal / 6 + rng.standard_normal(n)
    y = filt(filt(y, sos("highpass", 7000, 4)), sos("lowpass", 15000))
    y *= np.exp(-t / decay) * np.minimum(1, t / 0.0005) * fade_tail(n)
    return norm_peak(y)


def make_crash(seed, length=2.6, decay=0.9):
    rng = np.random.default_rng(seed)
    n = int(length * SR); t = tt(n)
    out = np.zeros((n, 2))
    for c in range(2):
        metal = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) for f in rng.uniform(3000, 9000, 24))
        y = rng.standard_normal(n) + 0.4 * metal / 24
        y = filt(filt(y, sos("highpass", 4500, 4)), sos("lowpass", 12500))
        out[:, c] = y * np.exp(-t / decay) * np.minimum(1, t / 0.001)
    return norm_peak(out * fade_tail(n, 0.2)[:, None])


def kick_pump(kick_times, n, depth, rel=0.16):
    """sidechain pompası: kick'ten sonra kazanç düşer, ~rel s'de geri gelir"""
    imp = np.zeros(n)
    for k in kick_times:
        i = int(k * SR)
        if 0 <= i < n:
            imp[i] = 1.0
    t = tt(int(rel * 4 * SR))
    ker = np.minimum(1, t / 0.004) * np.exp(-t / rel)
    c = np.clip(signal.fftconvolve(imp, ker)[:n], 0, 1)
    return 1 - depth * c


# ───── piyano (isteğe bağlı katman: music.layers.piano + music.piano) ─────
# her desen: (16'lık konum, el, ton indeksi, velocity). Sol el "L" = [kök, beşli, oktav] (~F2-E3 kök),
# sağ el "R" = akor tonları alçaktan yükseğe (~Bb3-E5). Aynı konumdaki notalar alttan üste ~16 ms yayılır (rolled).
PIANO_STYLES = {
    "one":    [(0, "R", 0, .40), (4, "R", 2, .32), (6, "R", 3, .30), (10, "R", 1, .30)],             # tek el, sakin
    "two":    [(0, "L", 0, .44), (2, "R", 0, .30), (4, "R", 1, .33), (6, "R", 2, .31),                 # iki el, hafif hareket
               (8, "L", 1, .34), (10, "R", 3, .34), (12, "R", 2, .30), (14, "R", 1, .28)],
    "full":   [(0, "L", 0, .54), (0, "L", 2, .44), (0, "R", 1, .44), (0, "R", 3, .48), (2, "R", 0, .36),   # doruk: daha dolu
               (4, "R", 2, .40), (6, "R", 3, .40), (8, "L", 1, .44), (8, "R", 1, .38), (10, "R", 2, .38),
               (12, "R", 3, .42), (14, "R", 2, .36)],
    "chords": [(0, "L", 0, .52), (0, "L", 1, .42), (0, "R", 0, .40), (0, "R", 1, .40), (0, "R", 2, .42),   # açık, kararlı akorlar
               (0, "R", 3, .45), (8, "L", 2, .38), (8, "R", 0, .34), (8, "R", 1, .34), (8, "R", 2, .36),
               (8, "R", 3, .38), (14, "R", 2, .28)],
    "hold":   [(0, "L", 0, .38), (0, "R", 0, .30), (0, "R", 1, .30), (0, "R", 2, .32), (0, "R", 3, .34)],   # tek uzun akor
    "thin":   [(0, "R", 3, .30), (8, "R", 1, .26)],                                                     # nefes: tek notalar
}


@lru_cache(maxsize=None)
def piano_note(midi, vq, length=3.2):
    """tek piyano notası (pedal basılı, damper yok); vq = velocity*20.
    İki tel (±0.6 cent vuruşma), inharmonik kısmiler f_k = k f0 sqrt(1 + B k^2), çekiç konumu 1/7.3 (7. kısmi zayıf),
    kısmi başına iki aşamalı üstel sönüm (üst kısmiler hızlı), velocity'ye bağlı ton: yumuşakta koyu (una corda),
    çekiç atağı = kısa filtreli gürültü + tok gövde vuruşu."""
    vel = vq / 20
    f0 = mtof(midi); n = int(length * SR); t = tt(n)
    B = 1.2e-4 * 2 ** ((midi - 60) / 18)
    tau = 1.6 * 2 ** (-(midi - 48) / 24)                  # C3 ~1.6 s, C5 ~0.8 s
    tilt = 0.85 + 1.1 * (1 - vel)                         # yumuşak vuruş -> hızlı tiz düşüşü
    fmax = 700 + 4300 * vel ** 1.4                        # yumuşak vuruşta kısmiler ~2 kHz altında
    pos = 1 / 7.3
    a1 = abs(np.sin(np.pi * pos))
    y = np.zeros(n)
    for k in range(1, 30):
        fk = k * f0 * np.sqrt(1 + B * k * k)
        if fk > 12000:
            break
        a = abs(np.sin(np.pi * k * pos)) / a1 / k ** tilt / (1 + (fk / fmax) ** 4)
        if a < 2e-4:
            continue
        t1 = tau / (1 + 0.3 * (k - 1))
        env = 0.7 * np.exp(-t / t1) + 0.3 * np.exp(-t / (3.5 * t1))   # hızlı + uzun "aftersound"
        for cents, ph in ((-0.6, 0.3 * k), (0.6, 0.3 * k + 0.4)):
            y += 0.5 * a * np.sin(2 * np.pi * fk * 2 ** (cents / 1200) * t + ph) * env
    rng = np.random.default_rng(midi * 101 + vq)
    nh = int(0.04 * SR); th = t[:nh]
    nz = filt(rng.standard_normal(nh), sos("bandpass", [150, min(900 + 3000 * vel, 6000)]))
    y[:nh] += (0.05 + 0.20 * vel) * nz / (np.std(nz) + 1e-12) * np.exp(-th / 0.0035)
    y[:nh] += 0.08 * vel * np.sin(2 * np.pi * 110 * th) * np.exp(-th / 0.025)       # gövde "tok"u
    y *= np.minimum(1, t / 0.002) * fade_tail(n, 0.05)
    return y * vel ** 1.5


def piano_hands(ch):
    lr = 41 + (ch["bass"] % 12 - 41) % 12                 # sol el kökü F2..E3
    rh = sorted(m - 12 if m >= 77 else m for m in ch["stab"])
    return [lr, lr + 7, lr + 12], rh


def piano_place(bus, midi, vel, t_on, t_off, gain):
    """notayı yerleştir; t_off'ta pedal kalkar -> damper ~90 ms'de susturur"""
    x = piano_note(int(midi), int(round(np.clip(vel, 0.05, 1.0) * 20)))
    d = max(0.05, t_off - t_on)
    k = min(len(x), int((d + 0.45) * SR))
    t = tt(k)
    env = np.exp(-np.maximum(t - d, 0.0) / 0.09) * fade_tail(k, 0.03)
    place(bus, x[:k] * env, t_on, gain=gain, pan=float(np.clip((midi - 60) / 28, -0.45, 0.45)))


def piano_post(cfg, bus):
    """hafif oda reverb'ü + konuşma bandından çekilme (1.5 kHz üstü raf)"""
    pc = cfg.piano
    room = float(pc.get("room", 0.25))
    if room > 0:
        bus = bus + room * convolve(bus, reverb_ir(1.1, 1.8, 23, predelay=0.014, hf_rt=0.45))
    bus = filt(bus, sos("highpass", 70))
    return filt(bus, rbj("hs", 1500, gain_db=float(pc.get("tone_db", -4.0))))


def make_piano(cfg, ranges):
    """layers.piano: [[t0, t1, kazanç, desen?, velocity çarpanı?]]; akorlar bars'ı izler,
    pedal ölçü başında (ya da aralık sonunda) değişir -> kuyruklar akor sınırında temizlenir"""
    rng = np.random.default_rng(7000)                     # ortak rng'ye dokunmaz (katman yokken çıktı aynı)
    bus = np.zeros((cfg.N, 2))
    bar = 4 * cfg.beat
    for b in range(len(cfg.chords)):
        tb = bar * b
        if tb >= cfg.final:
            break
        hands = dict(zip("LR", piano_hands(cfg.chords[b])))
        for r in ranges:
            t0, t1, g = r[0], r[1], r[2]
            style = r[3] if len(r) > 3 else "two"
            vs = r[4] if len(r) > 4 else 1.0
            if style not in PIANO_STYLES:
                warn(f"bilinmeyen piyano deseni '{style}', 'two' kullanıldı"); style = "two"
            roll = {}
            for pos, hand, idx, v in PIANO_STYLES[style]:
                t = tb + pos * cfg.s16
                if not (t0 <= t < t1) or t >= cfg.final:
                    continue
                j = roll.get(pos, 0); roll[pos] = j + 1
                t_on = t + 0.016 * j + rng.uniform(-0.004, 0.004)
                vel = v * vs + rng.uniform(-0.03, 0.03)
                piano_place(bus, hands[hand][idx], vel, t_on, min(tb + bar, t1, cfg.final), g)
    return piano_post(cfg, bus)


def piano_final(cfg, chord):
    """final: tek, sönümlenen maj9 akoru (kök-beşli | 3-7-9), alttan üste yayılır; ilk notanın tepesi ofset 0'a hizalı"""
    lr = piano_hands(chord)[0][0]
    notes = [lr, lr + 7, lr + 16, lr + 23, lr + 26]
    vels = [.46, .40, .40, .38, .36]
    n = int((cfg.total - cfg.final + 0.5) * SR)
    buf = np.zeros((n, 2))
    for j, (m, v) in enumerate(zip(notes, vels)):
        piano_place(buf, m, v, 0.028 * j, 1e9, 1.0)
    buf = piano_post(cfg, buf)
    return buf, int(np.argmax(np.abs(buf[:int(0.02 * SR)]).max(1)))


# ───── kâğıt/foley perküsyon (isteğe bağlı katman: music.layers.foley) ─────
# 16'lık konum -> (kâğıt hışırtısı velocity, karton tık velocity); 0 = çalmaz. Tek 16'lıklar `swing` kadar gecikir.
FOLEY_STYLES = {
    "paper": [(.55, 0), (.22, 0), (.80, 0), (.30, 0), (.50, .80), (.22, 0), (.85, 0), (.34, .30),
              (.55, 0), (.22, 0), (.80, 0), (.30, 0), (.50, .80), (.26, 0), (.90, .38), (.40, 0)],
    "light": [(0, 0), (0, 0), (.65, 0), (0, 0), (0, .70), (0, 0), (.60, 0), (0, 0),
              (0, 0), (0, 0), (.65, 0), (0, 0), (0, .70), (0, 0), (.70, .30), (0, 0)],
}


@lru_cache(maxsize=None)
def foley_hit(kind, seed):
    """'paper': kâğıt hışırtısı = seyrek mikro tıklar (1.6-7 kHz bant), 2 ms atak, ~35 ms sönüm (her tohum farklı doku).
    'tap': karton/parmak tık = 210 Hz'den inen kısa gövde + 0.6-2.4 kHz gürültü, kliksiz (ilk 1 ms yumuşak)."""
    rng = np.random.default_rng(9000 + seed + (500 if kind == "tap" else 0))
    if kind == "paper":
        n = int(0.11 * SR); t = tt(n)
        imp = rng.standard_normal(n) * (rng.random(n) < 0.18)                    # kırışık kâğıt: seyrek mikro tıklar
        y = filt(filt(imp, sos("bandpass", [1600, 7000], 2)), sos("lowpass", 9000))
        env = np.minimum(1, t / 0.002) * np.exp(-t / rng.uniform(0.026, 0.042))
        return norm_peak(y * env * fade_tail(n, 0.01))
    n = int(0.09 * SR); t = tt(n)
    f = 150 + 60 * np.exp(-t / 0.01)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.016)
    nz = filt(rng.standard_normal(n), sos("bandpass", [600, 2400], 2)) * np.exp(-t / 0.006)
    y = body + 0.5 * nz / (np.std(nz) + 1e-12) * 0.35
    return norm_peak(y * np.minimum(1, t / 0.001) * fade_tail(n, 0.01))


def make_foley(cfg, ranges):
    """layers.foley: [[t0, t1, kazanç, desen?, swing?]] -> el yapımı kâğıt hışırtısı + karton tık (16'lık ızgara).
    Drop/gap/build içinde çalmaz; insan dokunuşu: ±3 ms zaman, ±%12 velocity, tohumlu. Ortak rng'ye dokunmaz."""
    rng = np.random.default_rng(8100)
    bus = np.zeros((cfg.N, 2))
    for k in range(int(cfg.final / cfg.s16) + 1):
        t = k * cfg.s16
        if t >= cfg.final - 1e-9:
            break
        jit, vj, var = rng.uniform(-0.003, 0.003), rng.uniform(0.88, 1.12), int(rng.integers(0, 6))
        r = [x for x in ranges if inside(t, x)]
        if not r or inr(t, cfg.drops) or inr(t, cfg.gaps) or inr(t, cfg.builds):
            continue
        g, style = r[0][2], (r[0][3] if len(r[0]) > 3 else "paper")
        swing = float(r[0][4]) if len(r[0]) > 4 else 0.12
        if style not in FOLEY_STYLES:
            warn(f"bilinmeyen foley deseni '{style}', 'paper' kullanıldı"); style = "paper"
        vp, vt = FOLEY_STYLES[style][k % 16]
        ts = t + (swing * cfg.s16 if k % 2 else 0.0) + jit
        if vp:
            place(bus, foley_hit("paper", var), ts, gain=g * vp * vj, pan=0.3)
        if vt:
            place(bus, foley_hit("tap", var), ts, gain=g * 0.8 * vt * vj, pan=-0.2)
    return bus


def music_hits(cfg):
    """(tepe zamanı, voicing, büyük mü) — ara vuruşlar + final; SFX tepesiyle aynı ana hizalı"""
    bar = 4 * cfg.beat
    out = []
    for h in cfg.hits:
        t = h["t"] + FRAME
        ch = voicing(h["chord"], cfg.key_pc) if h.get("chord") else cfg.chords[min(int(h["t"] // bar), len(cfg.chords) - 1)]
        out.append((t, ch, False))
    out.append((cfg.final + FRAME, cfg.final_chord, True))
    return out


def make_music(cfg):
    rng = np.random.default_rng(120)
    n, END, BEAT, S16 = cfg.N, cfg.final, cfg.beat, cfg.s16
    BED = cfg.bed_end                           # final sonrası yatak sonu (verilmezse = END)
    lay = cfg.layers
    drums = np.zeros((n, 2)); mel = np.zeros((n, 2)); bass = np.zeros((n, 2))
    send = np.zeros((n, 2))                     # reverb gönderimi
    hits = np.zeros((n, 2)); hsend = np.zeros((n, 2))
    kick = make_felt_kick() if cfg.kick_kind == "felt" else make_kick()   # "felt": kliksiz yumuşak vuruş
    claps = [make_clap(s) for s in (21, 22, 23)]
    hats = [make_hat(s, 0.028) for s in (31, 32, 33, 34)]
    ohat = make_hat(35, 0.16)
    crash = make_crash(41)
    kicks = []
    kick_stop = r6(math.floor(r6(END / BEAT)) * BEAT)              # son vuruştan önceki vuruşta davul durur
    pickups = [kick_stop, r6(kick_stop + S16)] if kick_stop + 2 * S16 <= END + 0.03 else []
    drop_bass = [r6(math.ceil(r6(a / BEAT)) * BEAT) for a, b in cfg.drops]
    returns = [(r6(b - 0.5), b) for a, b in cfg.drops]               # drop dönüşü: hat kreşendo
    rolls = [(a, b, r6(b - 1.5 * BEAT)) for a, b in cfg.builds]     # önce 8'lik, son 1.5 vuruş 16'lık
    full_pos, sparse_pos = (2, 6, 10, 14), (2, 10)

    for k in range(int(BED / S16) + 1):
        t = k * S16
        if t >= BED - 1e-9:
            break
        post = t >= END - 1e-9                  # final sonrası yatak: davul/8'lik bas/stab yok, pad + arp + light sürer
        p = k % 16
        ch = cfg.chords[min(k // 16, len(cfg.chords) - 1)]
        off = inr(t, cfg.drops) or inr(t, cfg.gaps) or post
        light = inr(t, cfg.light)
        build = inr(t, cfg.builds)
        hv = rng.uniform(0.85, 1.0)             # hi-hat insan dokunuşu

        # --- kick: 4/4; hafif bölümde yarım tempo/yumuşak; açılış vuruşunu impact SFX karşılayabilir
        if p % 4 == 0 and not off and (t > 0 or not cfg.skip_first_kick) and t < kick_stop:
            if not light:
                place(drums, kick, t, gain=1.0); kicks.append(t)
            elif p in (0, 8):
                place(drums, kick, t, gain=0.7); kicks.append(t)
        # --- clap 2 ve 4'te; build'de rulo; finalden önce 16'lık "pickup"
        pick = any(abs(t - x) < 1e-9 for x in pickups)
        if p in (4, 12) and not off and not build and not pick:    # pickup backbeat'e düşerse clap'in yerini alır (çift clap yok)
            g = 0.32 if light else 0.55
            c = claps[k % 3]; place(drums, c, t, gain=g); place(send, c, t, gain=g * 0.35)
        for a, b, b16 in rolls:
            if inside(t, (a, b)):
                prog = (t - a) / (b - a)
                if t >= b16 or p % 2 == 0:
                    g = 0.12 + 0.43 * prog ** 1.5
                    c = claps[k % 3]; place(drums, c, t, gain=g); place(send, c, t, gain=g * 0.3)
        if pick:
            place(drums, claps[k % 3], t, gain=0.4 if abs(t - pickups[0]) < 1e-9 else 0.5)
        # --- hi-hat: 8'lik offbeat (+ açık hat) + bazı bölümlerde hayalet 16'lıklar
        if not off:
            if p % 4 == 2:
                if inr(t, lay["open_hats"]):
                    place(drums, ohat, t, gain=0.24 * hv, pan=0.15)
                else:
                    place(drums, hats[k % 4], t, gain=(0.40 if light else 0.36) * hv, pan=0.15)
            elif p % 2 == 1 and inr(t, lay["ghost_hats"]):
                place(drums, hats[k % 4], t, gain=0.15 * hv, pan=-0.2)
        else:
            for a, b in returns:
                if inside(t, (a, b)):
                    place(drums, hats[k % 4], t, gain=0.04 + 0.16 * (t - a) / 0.5, pan=0.1)

        # --- bas: 8'lik, offbeat vurgulu, 6. ve 14. 16'lıkta oktav
        if p % 2 == 0 and not off and not light:
            note = ch["bass"] + (12 if p in (6, 14) else 0)
            place(bass, bass_note(note, 0.21), t, gain=1.0 if p % 4 == 2 else 0.8)
        if light and p in (0, 8):
            place(bass, bass_note(ch["bass"], 0.95, 0.5), t, gain=0.75)
        if any(abs(t - r[0]) < 1e-9 for r in cfg.light) and not post:   # hafif bölüm girişi: yumuşak kick + uzun bas
            place(drums, kick, t, gain=0.6); kicks.append(t)
            place(bass, bass_note(ch["bass"], 0.45, 0.5), t, gain=0.7)
        if any(abs(t - x) < 1e-9 for x in drop_bass) and not post:      # drop'ta tek uzun bas
            place(bass, bass_note(ch["bass"], 1.0, 0.3), t, gain=0.6)

        # --- akor stab'ları (pluck, iki detune ses L/R)
        stab_on = (inr(t, lay["stabs"]) and p in full_pos) or (inr(t, lay["stabs_sparse"]) and p in sparse_pos)
        if stab_on and not off:
            for m in ch["stab"]:
                for cents, pan in ((-6, -0.5), (6, 0.5)):
                    s = pluck(m, 0.4, 0.20, 0.30, cents, m)
                    place(mel, s, t, gain=0.14, pan=pan); place(send, s, t, gain=0.045, pan=pan)
        # --- arp 16'lık
        tones = sorted(ch["stab"]) + [ch["stab"][0] + 12, ch["stab"][1] + 12]
        arp = [r for r in lay["arps"] if inside(t, r)]
        if arp:
            m = tones[ARP_PAT[p]] + 12
            s = pluck(m, 0.3, 0.14, 0.40, 0.0, 99)
            g = arp[0][2] if len(arp[0]) > 2 else 0.11
            place(mel, s, t, gain=g, pan=0.35 * np.sin(k * 0.7)); place(send, s, t, gain=g * 0.6)
        # --- hafif bölüm: parlak çan-pluck 8'likler, bir oktav yukarı
        if light and p % 2 == 0 and cfg.light_pluck > 0:
            m = tones[ARP_PAT[p]] + 12
            s = pluck(m, 0.7, 0.45, 0.25, 0.0, 77)
            place(mel, s, t, gain=cfg.light_pluck, pan=0.4 * np.sin(k * 0.9)); place(send, s, t, gain=cfg.light_pluck * 0.5)

    # --- pad: her ölçü (yarısı hafif bölümdeyse açık/yüksek, drop'taysa biraz yüksek)
    bar = 4 * BEAT
    for b in range(len(cfg.chords)):
        t0 = bar * b
        if t0 >= BED:
            break
        d = min(bar, BED - t0)
        is_light = overlap(t0, t0 + bar, cfg.light) >= bar / 2
        cut = 4200 if is_light else 1900
        g = 0.6 if is_light else 0.42 if overlap(t0, t0 + bar, cfg.drops) >= bar / 2 else 0.30
        p = pad_chord(tuple(cfg.chords[b]["pad"]), d, cut, rng)
        place(mel, p, t0, gain=g); place(send, p, t0, gain=g * 0.5)

    # --- crash'ler (bir olayla aynı andaysa SFX tepesiyle birlikte, +1 kare)
    for tc, g in cfg.crashes:
        if any(abs(tc - e["t"]) < 0.01 for e in cfg.events):
            tc = tc + FRAME
        place(drums, crash, tc, gain=g); place(send, crash, tc, gain=g * 0.3)

    # --- sidechain pompası ve final öncesi kapı
    mel *= kick_pump(kicks, n, 0.40)[:, None]
    bass *= kick_pump(kicks, n, 0.65, 0.12)[:, None]
    main = 0.8 * drums + mel + 0.5 * bass
    # hafif bölüm: düzenleme seyrek/parlak, seviye light_gain_db ile konuşma altında dengede kalır
    sec = np.ones(n)
    for a, b in cfg.light:
        sec[int(a * SR):int(b * SR)] = db(cfg.light_gain_db)
    main *= uniform_filter1d(sec, int(0.05 * SR))[:, None]
    if lay.get("piano"):                        # isteğe bağlı piyano: pompasız, light kazancından bağımsız
        pb = make_piano(cfg, lay["piano"])
        main = main + pb
        send = send + float(cfg.piano.get("hall", 0.12)) * pb
    if lay.get("foley"):                        # isteğe bağlı kâğıt/foley perküsyon: pompasız, kısa oda gönderimi
        fb = make_foley(cfg, lay["foley"])
        main = main + fb
        send = send + 0.15 * fb
    gate = np.ones(n)
    if BED > END:                               # yatak: final vuruşu üstünden sürer, son bed_fade s'de kosinüsle söner
        a, b = int((BED - cfg.bed_fade) * SR), int(BED * SR)
        gate[a:b] = 0.5 * (1 + np.cos(np.linspace(0, np.pi, b - a))); gate[b:] = 0
    else:
        a, b = int((END - 0.012) * SR), int(END * SR)
        gate[a:b] = np.linspace(1, 0, b - a); gate[b:] = 0
    main *= gate[:, None]; send *= gate[:, None]

    hall = reverb_ir(1.7, 2.6, 5)
    main = main + 0.55 * convolve(send, hall)

    # --- drop: rezonanslı LPF aşağı, sonra geri açılır
    for a, b in cfg.drops:
        down, up = r6(a + 0.185), r6(b - 0.55)
        def drop_fc(t, a=a, down=down, up=up):
            if t < a: return 18000
            if t < down: return 18000 * (500 / 18000) ** ((t - a) / 0.185)
            if t < up: return 500
            return 500 * (18000 / 500) ** min(1, (t - up) / 0.55)
        main = sweep(main, r6(a - 0.075), r6(b + 0.03), drop_fc, "lp", 2.2)
    # --- build: HPF yükselir (bas incelir, gerilim)
    for a, b in cfg.builds:
        main = sweep(main, r6(a - 0.05), r6(b + 0.12),
                     lambda t, a=a, b=b: 25 * (1100 / 25) ** float(np.clip((t - a) / (b - a), 0, 1)), "hp", 1.3)

    # --- vuruşlar (filtre dışı): ara vuruşlar ve final
    for th, chord, big in music_hits(cfg):
        ik = int(round(th * SR)) - int(np.argmax(np.abs(kick)))
        place(hits, kick, i0=ik, gain=1.0)
        place(hits, crash, i0=ik, gain=cfg.final_crash if big else 0.26); place(hsend, crash, i0=ik, gain=0.15)
        bn = bass_note(chord["bass"], 1.1 if big else 0.36, 0.6)
        place(hits, bn * (np.exp(-tt(len(bn)) / 0.35) if big else 1), i0=ik, gain=0.6)
        if big:   # final akor: tonik maj9 yığını + üst oktav + pad
            root = chord["pad"][0]
            fp = float(cfg.piano.get("final_pluck", 1.0))       # piyano finalinde pluck yığını kısılabilir
            for m in (root, root + 7, root + 12, root + 16, root + 19, root + 23, root + 26, root + 28):
                for cents, pan in ((-7, -0.6), (7, 0.6)):
                    if fp <= 0:
                        break
                    s = pluck(m, 1.1, 0.42, 0.22, cents, m + 3)
                    place(hits, s, i0=ik, gain=0.075 * fp, pan=pan); place(hsend, s, i0=ik, gain=0.09 * fp, pan=pan)
            if float(cfg.piano.get("final", 0)) > 0:           # piyano: tek, sönümlenen I maj9
                pf, pk = piano_final(cfg, chord)
                i0 = int(round(th * SR)) - pk
                place(hits, pf, i0=i0, gain=float(cfg.piano["final"])); place(hsend, pf, i0=i0, gain=0.1 * float(cfg.piano["final"]))
            pc = pad_chord((root, root + 4, root + 7, root + 11, root + 14), 0.25, 3500, rng, att=0.01, rel=0.9)
            place(hits, pc, i0=ik, gain=0.35); place(hsend, pc, i0=ik, gain=0.3)
        else:
            for m in chord["stab"]:
                for cents, pan in ((-6, -0.5), (6, 0.5)):
                    s = pluck(m, 0.5, 0.26, 0.35, cents, m)
                    place(hits, s, i0=ik, gain=0.1, pan=pan); place(hsend, s, i0=ik, gain=0.08, pan=pan)
    hits = hits + 0.6 * convolve(hsend, hall)

    mus = main + hits
    # telefon dostu: 60 Hz HPF + 120 Hz altında -4 dB raf, 5 kHz üstü +3 dB parlaklık
    mus = filt(filt(mus, sos("highpass", 60)), rbj("ls", 120, gain_db=-4.0))
    mus = filt(mus, rbj("hs", 5000, gain_db=3.0))
    dr = cfg.music_drive                                      # vars. 1.4; konuşmasız/müzik önde: tepe/loudness oranını düşürür
    mus = np.tanh(dr * norm_peak(mus)) / np.tanh(dr)         # yumuşak saturasyon / tutkal
    mus = end_fade(mus)
    return norm_peak(mus) * db(-1.0)


# ───────────────────────── 3) SFX ─────────────────────────
def spectral_noise(n, rng, fc_t, bw_oct):
    """STFT'de zamanla kayan bant geçiren gürültü (fc_t: kare zamanı -> merkez frekans)"""
    nz = rng.standard_normal(n)
    f, tz, Z = signal.stft(nz, SR, nperseg=1024, noverlap=768)
    fc = np.array([fc_t(x) for x in tz])
    mask = np.exp(-0.5 * (np.log2((f[:, None] + 1) / fc[None, :]) / bw_oct) ** 2)
    _, y = signal.istft(Z * mask, SR, nperseg=1024, noverlap=768)
    y = y[:n] if len(y) >= n else np.pad(y, (0, n - len(y)))
    return y


def whoosh(rng, dur, f0, f1, pan0, pan1, tail=0.20, bw=0.7, tone=0.12, shape=2.5):
    """filtreli gürültü süpürmesi; zarf tam `dur` anında tepe yapar"""
    n = int((dur + tail) * SR); t = tt(n)
    fc = lambda x: f0 * (f1 / f0) ** float(np.clip(x / dur, 0, 1.15))
    L = spectral_noise(n, rng, fc, bw); R = spectral_noise(n, rng, fc, bw)
    st = np.stack([L, R], 1) / np.std(L)
    fs = np.interp(t, t[::48], [fc(x) * 0.25 for x in t[::48]])
    ph = 2 * np.pi * np.cumsum(fs) / SR
    st += tone * np.sin(ph)[:, None]                          # perde hareketi
    env = np.where(t <= dur, (t / dur) ** shape, np.exp(-(t - dur) / 0.06))
    env *= fade_tail(n, 0.03)
    p = pan0 + (pan1 - pan0) * np.clip(t / (dur + 0.05), 0, 1)  # stereo pan hareketi
    a = (p + 1) * np.pi / 4
    st[:, 0] *= np.cos(a) * np.sqrt(2) * env; st[:, 1] *= np.sin(a) * np.sqrt(2) * env
    return st


def impact(rng, f_hi=95, f_lo=50, tau=0.38, burst=0.5):
    n = int(max(1.2, tau * 4) * SR); t = tt(n)
    f = f_lo + (f_hi - f_lo) * np.exp(-t / 0.06)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / tau) * np.minimum(1, t / 0.002)
    out = np.zeros((n, 2))
    for c in range(2):
        nz = filt(rng.standard_normal(n), sos("bandpass", [180, 5000]))
        crack = filt(rng.standard_normal(n), sos("highpass", 2500))
        out[:, c] = boom + burst * nz / 3 * np.exp(-t / 0.05) + 0.25 * crack / 3 * np.exp(-t / 0.006)
    return norm_peak(np.tanh(1.6 * out) * fade_tail(n, 0.1)[:, None])


def pop(rng, f0):
    n = int(0.14 * SR); t = tt(n)
    f = f0 * (1 + 1.4 * (1 - np.exp(-t / 0.018)))            # yükselen "bubble"
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = (np.sin(ph) + 0.18 * np.sin(2 * ph)) * np.exp(-t / 0.038) * np.minimum(1, t / 0.0008)
    return norm_peak(y * fade_tail(n))


def stamp(rng):
    n = int(0.5 * SR); t = tt(n)
    f = 62 + 90 * np.exp(-t / 0.025)
    thud = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09)
    slap = filt(rng.standard_normal(n), sos("bandpass", [800, 4500])) / 3 * np.exp(-t / 0.012)
    paper = filt(rng.standard_normal(n), sos("lowpass", 900)) / 3 * np.exp(-t / 0.05)
    y = np.tanh(1.5 * (thud + 0.9 * slap + 0.5 * paper)) * np.minimum(1, t / 0.0007)
    return norm_peak(y * fade_tail(n))


def bell(rng, f0, dec=1.0, length=1.6):
    n = int(length * SR); t = tt(n)
    y = np.zeros(n)
    for r, a, d in ((1, 1, 1.0), (2.0, 0.45, 0.7), (3.01, 0.25, 0.45), (4.17, 0.15, 0.3), (5.43, 0.08, 0.2), (6.8, 0.05, 0.12)):
        if f0 * r < 7600:                                      # tüm kısmiler 8 kHz altında (pay ile)
            y += a * np.sin(2 * np.pi * f0 * r * t + rng.uniform(0, 6)) * np.exp(-t / (d * dec))
    y *= np.minimum(1, t / 0.001)
    return norm_peak(y * fade_tail(n, 0.1))


def tick(rng, f, body=0.3):
    n = int(0.06 * SR); t = tt(n)
    y = filt(rng.standard_normal(n), sos("highpass", 3000)) / 3 * np.exp(-t / 0.0025)
    y += 0.5 * np.sin(2 * np.pi * f * t) * np.exp(-t / 0.008) + body * np.sin(2 * np.pi * 380 * t) * np.exp(-t / 0.014)
    return norm_peak(y * np.minimum(1, t / 0.0003) * fade_tail(n, 0.005))


def key_click(rng):
    n = int(0.07 * SR); t = tt(n)
    y = filt(rng.standard_normal(n), sos("bandpass", [2000, 7000])) / 3 * np.exp(-t / 0.004)
    y += 0.6 * np.sin(2 * np.pi * rng.uniform(200, 320) * t) * np.exp(-t / 0.012)
    return norm_peak(y * np.minimum(1, t / 0.0003) * fade_tail(n, 0.005))


def ui_tap(rng, f_a=1600, f_b=1100):
    n = int(0.09 * SR); t = tt(n)
    f = f_b + (f_a - f_b) * np.exp(-t / 0.01)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.018)
    y += 0.4 * filt(rng.standard_normal(n), sos("highpass", 4000)) / 3 * np.exp(-t / 0.002)
    return norm_peak(y * np.minimum(1, t / 0.0004) * fade_tail(n, 0.01))


def shimmer(rng, length=1.15):
    n = int(length * SR); t = tt(n)
    out = np.zeros((n, 2))
    for c in range(2):
        for f in rng.uniform(2200, 7500, 14):
            out[:, c] += np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t / rng.uniform(0.25, 0.6))
    out *= (np.minimum(1, t / 0.02) * (1 + 0.25 * np.sin(2 * np.pi * 9 * t)))[:, None]
    return norm_peak(out * fade_tail(n, 0.15)[:, None])


def at(n, *parts):
    """parçaları (sinyal, örnek ofseti, kazanç) ile tek stereo buffer'da birleştir"""
    buf = np.zeros((n, 2))
    for x, off, g in parts:
        place(buf, x, i0=off, gain=g)
    return buf


# olay tipi -> (50 ms tepe RMS'in konuşma RMS'ine göre seviyesi dB, reverb gönderimi, varsayılan dur)
SFX = {
    "impact_intro":     (-2, 0.08, 0),    "impact":       (-3, 0.08, 0),
    "whoosh":           (-9, 0.15, 0.3),  "whoosh_up":    (-9, 0.15, 0.3),  "whoosh_down": (-9, 0.15, 0.3),
    "pop":              (-9, 0.15, 0),    "swoosh_pop":   (-8, 0.15, 0),
    "stamp_impact":     (-3, 0.08, 0),    "ding_stamp":   (-5, 0.12, 0),    "ding":        (-8, 0.12, 0),
    "flip_ticks":       (-11, 0.08, 0.45), "typing":      (-12, 0.08, 0.8),
    "click_load":       (-10, 0.08, 0),   "click_tap":    (-10, 0.08, 0),
    "riser":            (-6, 0.2, 0.7),   "whoosh_final_hit": (-1, 0.25, 0),
    "file":             (0, 0.0, 0),      # dosyadan efekt: seviye = etkin kısmın ortalama RMS'i (tepe değil), reverb yok
}
SWEEPS = {"whoosh", "whoosh_up", "whoosh_down", "riser"}
HF_TYPES = {"pop", "swoosh_pop", "ding", "typing", "click_load", "click_tap", "flip_ticks"}
# bilinmeyen tipler için ad parçasına göre en yakın ses (yoksa pop)
FALLBACK = [("final", "whoosh_final_hit"), ("riser", "riser"), ("stamp", "stamp_impact"), ("whoosh", "whoosh"),
            ("swoosh", "swoosh_pop"), ("impact", "impact"), ("hit", "impact"), ("boom", "impact"),
            ("ding", "ding"), ("bell", "ding"), ("chime", "ding"), ("tick", "flip_ticks"), ("typ", "typing"),
            ("key", "typing"), ("click", "click_tap"), ("tap", "click_tap")]


def normalize_event(e):
    """tipi bilinen bir SFX'e eşle, eksik dur'u doldur (asla çökme)"""
    e = dict(e)
    e["kind"] = e["type"]
    if e["type"] not in SFX:
        e["kind"] = next((k for frag, k in FALLBACK if frag in e["type"].lower()), "pop")
        warn(f"bilinmeyen olay tipi '{e['type']}' (t={e['t']}) -> '{e['kind']}' sesi kullanıldı")
    if SFX[e["kind"]][2] and not e.get("dur"):
        e["dur"] = SFX[e["kind"]][2]
    return e


def render_event(cfg, ev, idx):
    """-> (stereo buffer, tepe ofseti örnek, tepe ölçüm penceresi s)"""
    rng = np.random.default_rng(1000 + idx)
    typ, dur = ev["kind"], ev.get("dur", 0.0)
    if typ == "impact_intro":
        x = at(int(1.6 * SR), (impact(rng, 110, 52, 0.42), 0, 1.0), (shimmer(rng, 0.8), 0, 0.12))
    elif typ == "impact":
        x = impact(rng, 100, 50, 0.38)
    elif typ == "whoosh":
        x = whoosh(rng, dur, 500, 3200, -0.6, 0.6)
    elif typ == "whoosh_up":
        x = whoosh(rng, dur, 350, 4200, -0.2, 0.2, shape=3.0)
    elif typ == "whoosh_down":
        x = whoosh(rng, dur, 3800, 380, 0.3, -0.3, shape=2.0, tone=0.18)
    elif typ == "pop":
        x = pop(rng, 380 + 140 * (idx % 3))
    elif typ == "swoosh_pop":
        w = whoosh(rng, 0.16, 700, 3600, -0.6, 0.4, tail=0.05)
        w = w * db(-7) / np.max(np.abs(w))
        off = int(0.16 * SR)
        x = at(off + int(0.2 * SR), (w, 0, 1.0), (pop(rng, 520 + 80 * idx % 160), off, 1.0))
    elif typ == "stamp_impact":
        x = at(int(1.3 * SR), (stamp(rng), 0, 1.0), (impact(rng, 85, 48, 0.30, 0.3), 0, 0.6))
    elif typ == "ding_stamp":   # damga + tonun 3. derecesinde çan
        x = at(int(1.6 * SR), (stamp(rng), 0, 1.0),
               (bell(rng, mtof(72 + (cfg.key_pc + 4) % 12), 1.0), int(0.01 * SR), 0.45))
    elif typ == "ding":         # tonun 5. derecesinden başlar, her ding bir üst nota (miksolidyen adımlar)
        same = [e for e in cfg.events if e["kind"] == "ding"]
        k = same.index(ev)
        x = bell(rng, mtof(84 + (cfg.key_pc + 7) % 12 + [0, 2, 4, 5, 7, 9, 10, 12][k % 8]))
    elif typ == "flip_ticks":
        offs = np.linspace(0, dur - 0.06, 4)
        x = at(int((dur + 0.1) * SR), *[(panned(tick(rng, f), p), int(o * SR), v) for o, f, v, p in
                                         zip(offs, (3300, 2900, 3150, 2700), (1.0, 0.75, 0.8, 0.9), (-0.15, 0.15, -0.1, 0.1))])
    elif typ == "typing":
        cnt = max(1, int(ev.get("count", 12)))
        sp = dur / cnt
        parts = []
        for k in range(cnt):
            o = 0 if k == 0 else k * sp + rng.uniform(-0.012, 0.012)
            v = 1.0 if k == 0 else rng.uniform(0.5, 0.85)
            parts.append((panned(key_click(rng), rng.uniform(-0.2, 0.2)), int(o * SR), v))
        x = at(int((dur + 0.15) * SR), *parts)
    elif typ == "click_load":
        n = int(0.35 * SR); t = tt(int(0.15 * SR))
        chirp = np.sin(2 * np.pi * np.cumsum(700 * 2 ** (t / 0.12)) / SR) * np.minimum(1, t / 0.02) * np.exp(-t / 0.05)
        x = at(n, (ui_tap(rng, 3000, 2200), 0, 1.0), (ui_tap(rng, 2600, 1900), int(0.004 * SR), 0.5),
               (chirp, int(0.035 * SR), 0.22))
    elif typ == "click_tap":
        x = at(int(0.25 * SR), (ui_tap(rng), 0, 1.0), (ui_tap(rng, 2300, 2000), int(0.08 * SR), 0.3))
    elif typ == "file":         # dosyadan efekt (ör. jenerik kesiti): 48 kHz stereo, ilk örnek olay anına oturur
        x = load_clip(ev.get("path", ""))
    elif typ == "riser":
        n = int((dur + 0.03) * SR); t = tt(n)
        fc = lambda x: 260 * (7000 / 260) ** float(np.clip(x / dur, 0, 1))
        nz = np.stack([spectral_noise(n, rng, fc, 0.9), spectral_noise(n, rng, fc, 0.9)], 1)
        nz /= np.std(nz)
        f = mtof(48 + cfg.key_pc) * 4 ** np.clip(t / dur, 0, 1)    # tonik, 2 oktav yükselir
        ph = 2 * np.pi * np.cumsum(f) / SR
        rate = 6 + 18 * np.clip(t / dur, 0, 1)
        trem = 1 + 0.3 * np.sin(2 * np.pi * np.cumsum(rate) / SR)
        tone = sum(np.sin(k * ph) / k for k in range(1, 6)) * trem
        env = np.where(t <= dur, (t / dur) ** 2.2, np.exp(-(t - dur) / 0.006))
        x = (nz + 0.35 * tone[:, None]) * env[:, None]
    else:  # whoosh_final_hit
        lead = int(0.30 * SR)
        w = whoosh(rng, 0.30, 400, 4000, 0.6, 0.0, tail=0.02)
        w = w * db(-6) / np.max(np.abs(w))
        x = at(lead + int(1.25 * SR), (w, 0, 1.0), (impact(rng, 110, 50, 0.45), lead, 1.0),
               (shimmer(rng), lead, 0.22))
    win = 0.015 if typ in SWEEPS else 0.002
    return x, main_peak(x, typ, win), win


def load_music_file(cfg):
    """music.file: hazır parçayı gövde müzik olarak yükler (sentez yok). Dosyanın tamamı ffmpeg ile 48 kHz stereo float'a
    çözülür, sonra örnek hassasiyetinde kesilir (girişte -ss arama yok: mp3 kodlayıcı gecikmesi/kare sınırı kaydırmasın).
    {path, start (s, parçada video 0), gain_db (0), fade_in (s, 0.005, kosinüs), fade_out (s, 1.0, total'de biten kosinüs)}.
    EQ/saturasyon uygulanmaz (parça zaten mastered); seviye miks loudness döngüsünde ayarlanır."""
    o = cfg.music_file
    path = str(o.get("path", ""))
    p = Path(path)
    if not p.is_absolute():
        p = next((q for q in (ROOT / p, W.parent / p, W / p) if q.is_file()), ROOT / p)
    if not path or not p.is_file():
        raise SystemExit(f"music.file bulunamadı: {path!r}")
    r = subprocess.run([FF, "-v", "error", "-i", str(p), "-vn", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                       capture_output=True, check=True)
    x = np.frombuffer(r.stdout, "<f4").reshape(-1, 2).astype(np.float64)
    i0 = int(round(float(o.get("start", 0.0)) * SR))
    y = np.zeros((cfg.N, 2))
    seg = x[max(0, i0):i0 + cfg.N]
    y[max(0, -i0):max(0, -i0) + len(seg)] = seg
    if i0 + cfg.N > len(x):
        warn(f"music.file kesiti parçanın sonunu aşıyor ({(i0 + cfg.N - len(x)) / SR:.2f} s sessizlik)")
    y *= db(float(o.get("gain_db", 0.0)))
    k = max(1, int(float(o.get("fade_in", 0.005)) * SR))
    y[:k] *= (0.5 * (1 - np.cos(np.linspace(0, np.pi, k))))[:, None]
    k = max(1, int(float(o.get("fade_out", 1.0)) * SR))
    y[-k:] *= (0.5 * (1 + np.cos(np.linspace(0, np.pi, k))))[:, None]
    y[-1] = 0.0
    return y


def load_clip(path):
    """'file' olayı: ses dosyasını (wav/mp3/m4a…) ffmpeg ile 48 kHz stereo float'a çevirir.
    Göreli yol: önce klasör kökü, sonra proje klasörü, sonra $WORK. Kenarlarda tık güvenliği (2 ms giriş, 10 ms çıkış)."""
    p = Path(path)
    if not p.is_absolute():
        p = next((q for q in (ROOT / p, W.parent / p, W / p) if q.is_file()), ROOT / p)
    if not path or not p.is_file():
        raise SystemExit(f"'file' olayının dosyası bulunamadı: {path!r}")
    r = subprocess.run([FF, "-v", "error", "-i", str(p), "-vn", "-ac", "2", "-ar", str(SR), "-f", "f64le", "-"],
                       capture_output=True, check=True)
    x = np.frombuffer(r.stdout, "<f8").reshape(-1, 2).copy()
    if len(x) == 0:
        raise SystemExit(f"'file' olayının dosyası boş: {p}")
    k = min(len(x), int(0.002 * SR))
    x[:k] *= np.linspace(0, 1, k)[:, None]
    return x * fade_tail(len(x), 0.01)[:, None]


def clip_level(x):
    """'file' seviyesi: 50 ms zarfı tepenin 30 dB altından yüksek olan örneklerin ortalama RMS'i (dB)"""
    e, m = env_rms(x, 0.05), (x.mean(1) if x.ndim == 2 else x)
    return float(to_db(np.sqrt(np.mean(m[e > e.max() * db(-30)] ** 2))))


def main_peak(x, kind, win):
    """ana tepe örneği. Çan uzun sürer, kısmilerin vuruşu sonraki bir anı tepe yapabilir -> ilk 25 ms'de ara"""
    if kind == "file":          # dosya tepe ile değil, başlangıcıyla yerleşir
        return 0
    if kind == "ding":
        return int(np.argmax(env_rms(x, win)[:int(0.025 * SR)]))
    if kind in ("flip_ticks", "typing"):   # çoklu tık: ilk tık olaya oturur (sonraki tık tepe olursa dizi erken başlar)
        return int(np.argmax(env_rms(x, win)[:int(0.03 * SR)]))
    return peak_index(x, win)


def target_time(ev):
    """nokta olaylar t + 1 kare; süpürmeler (whoosh/riser) dur sonunda tepe yapar; dosya t anında başlar"""
    if ev["kind"] == "file":
        return ev["t"]
    return ev["t"] + ev["dur"] if ev["kind"] in SWEEPS else ev["t"] + FRAME


def make_sfx(cfg, voice_ref):
    N = cfg.N
    sfx = np.zeros((N, 2)); send = np.zeros((N, 2))
    log = []
    for i, ev in enumerate(cfg.events):
        x, pk, win = render_event(cfg, ev, i)
        x = filt(x, sos("highpass", 40))
        lvl = clip_level(x) if ev["kind"] == "file" else to_db(env_rms(x, 0.05).max())
        gdb = voice_ref + SFX[ev["kind"]][0] + float(ev.get("gain_db", 0)) - lvl
        x *= db(gdb)
        tgt = target_time(ev)
        pk = main_peak(x, ev["kind"], win)
        i0 = int(round(tgt * SR)) - pk
        place(sfx, x, i0=i0)
        place(send, x, i0=i0, gain=SFX[ev["kind"]][1])
        log.append(dict(type=ev["type"], kind=ev["kind"], t=ev["t"], target=tgt, i0=i0, pk=pk, win=win, x=x,
                        **({"file_gain_db": gdb} if ev["kind"] == "file" else {})))
    sfx += 0.5 * convolve(send, reverb_ir(0.6, 1.0, 9, predelay=0.008))
    sfx = filt(sfx, rbj("ls", 90, gain_db=-2.0))
    return end_fade(sfx), log


# ───────────────────────── 4) DUCKING + MİKS ─────────────────────────
def voice_activity(v, N, look=0.04, hold=0.15, att=0.03, rel=0.12):
    """konuşma aktivitesi 0..1 (1 ms çözünürlük, ileriye bakışlı, hold + attack/release)"""
    e = to_db(env_rms(v, 0.02)[::48])
    thr = np.percentile(e, 95) - 24
    act = (e > thr).astype(float)
    Lk, Hd = int(look * 1000), int(hold * 1000)
    c = np.convolve(act, np.ones(Lk + Hd + 1))
    dil = (c[Lk:Lk + len(act)] > 0).astype(float)
    a_at, a_rel = np.exp(-1 / (att * 1000)), np.exp(-1 / (rel * 1000))
    g = np.empty_like(dil); prev = 0.0
    for i, d in enumerate(dil.tolist()):
        prev = d + (prev - d) * (a_at if d > prev else a_rel)
        g[i] = prev
    return np.interp(np.arange(N) / 48, np.arange(len(g)), g), dil


def tp_limit(x, ceil_db, look_ms=1.5, rel_ms=60):
    """4x aşırı örneklemeli, ileriye bakışlı true-peak limiter"""
    up = signal.resample_poly(x, 4, 1, axis=0)
    pk = np.abs(up).max(1)[:len(x) * 4].reshape(-1, 4).max(1)
    pk = np.maximum(pk, np.abs(x).max(1))
    r = np.minimum(1.0, db(ceil_db) / np.maximum(pk, 1e-12))
    L = int(look_ms * 1e-3 * SR)
    gmin = minimum_filter1d(r, 2 * L + 1)
    a = np.exp(-1 / (rel_ms * 1e-3 * SR))
    g = np.empty_like(gmin); prev = 1.0
    for i, v in enumerate(gmin.tolist()):
        prev = v if v < prev else v + (prev - v) * a
        g[i] = prev
    g = uniform_filter1d(g, L)
    return x * g[:, None], g


def win_rms_db(x, a, b):
    s = x[max(0, int(a * SR)):int(b * SR)]
    return float(to_db(np.sqrt(np.mean(s.mean(1) ** 2))))


def speech_windows(cfg, n=8, length=2.0):
    """ölçüm için konuşmanın kesintisiz sürdüğü 2 s'lik pencereler (kelime maskesinden)"""
    m = speech_mask(cfg, cfg.N, 0.02, 0.05)
    out, t = [], 0.5
    while t + length <= min(cfg.last_word, cfg.final) and len(out) < 40:
        if m[int(t * SR):int((t + length) * SR)].mean() > 0.85:
            out.append((round(t, 2), round(t + length, 2))); t += length + 0.5
        else:
            t += 0.25
    if len(out) <= n:
        return out
    return [out[int(i)] for i in np.linspace(0, len(out) - 1, n).round()]   # tüm konuşmaya yay


def main():
    cfg = load_config()
    print(f"WORK={W}  süre {cfg.total:.2f} s, final {cfg.final:.2f} s, {len(cfg.chords)} ölçü, {len(cfg.events)} olay")
    print("   türetilen müzik alanları:", json.dumps({k: v for k, v in cfg.derived.items() if k != "layers"}))
    N = cfg.N
    cfg.events = [normalize_event(e) for e in cfg.events]

    if cfg.no_voice:     # konuşmasız: ses zinciri yok (sessiz kanalda ölçümler/kazançlar anlamsız), ses stem'i tam 0
        print("1) ses: KONUŞMASIZ (voice.none) — ses zinciri, ducking ve konuşma ölçümleri atlanıyor")
        voice = np.zeros((N, 2))
        write_wav24(W / "voice_proc.wav", voice)
        vinfo = dict(mode="none", music_under_ref_dB=cfg.nv_music_under)
    else:
        print("1) ses işleniyor ...")
        voice, vinfo = process_voice(cfg)
        print("  ", vinfo)

    if cfg.music_file:
        print(f"2) müzik: hazır parça {cfg.music_file.get('path')} @ {cfg.music_file.get('start', 0)} s (sentez kapalı)")
        music = load_music_file(cfg)
    else:
        print("2) müzik sentezleniyor ...")
        music = make_music(cfg)
    write_wav24(W / "music.wav", music)

    if cfg.no_voice:
        # sanal konuşma referansı = müzik gövdesinin (0..final) RMS'i + music_under; SFX tablosu ve gain_db buna göre.
        # ducking yok (act = 0), müzik kazancı 1 (seviye zaten referansın kendisi)
        act, speech = np.zeros(N), np.zeros(N, bool)
        m_body = float(to_db(np.sqrt(np.mean(music[:int(cfg.final * SR)].mean(1) ** 2))))
        voice_ref = m_body + cfg.nv_music_under
    else:
        act, dil = voice_activity(voice, N)
        speech = np.repeat(dil, 48)[:N] > 0.5
        speech[int(round(cfg.last_word + 0.13, 1) * SR):] = False
        voice_ref = float(to_db(np.sqrt(np.mean(voice[speech, 0] ** 2))))
        if not np.isfinite(voice_ref) or voice_ref < -90:
            # sessiz ses kanalında referans -240 dB olur: SFX/müzik -250 dB'ye iner, loudness döngüsü +240 dB basar ve
            # dengesi bozuk bir miks "GEÇTİ" ile çıkar -> sessizce yanlış üretmek yerine dur
            sys.exit(f"HATA: ses kanalında konuşma yok (konuşma RMS {voice_ref:.0f} dBFS). Konuşmasız video ise plan.json "
                     f"audio.voice = {{\"none\": true}} ver (ses-kurallari.md: konuşmasız yol).")

    print("3) SFX ...")
    sfx, log = make_sfx(cfg, voice_ref)

    # ducking: konuşurken -DUCK_DB; müzik konuşmanın MUSIC_UNDER_VOICE dB altında
    duck = db(-DUCK_DB * act)
    mus_d = music * duck[:, None]
    if not cfg.no_voice:
        m_ref = float(to_db(np.sqrt(np.mean(mus_d[speech].mean(1) ** 2))))
        gm = db(voice_ref - MUSIC_UNDER_VOICE - m_ref)
        mus_d *= gm
    if cfg.gain_ramps:                       # bölgesel müzik seviyesi: [t0,t1] arası dB, sonra yumuşak dönüş
        env = np.ones(N)
        for r in cfg.gain_ramps:
            t0, t1, g = r[0], r[1], r[2]; back = r[3] if len(r) > 3 else 1.0
            i0, i1, i2 = int(t0 * SR), int(t1 * SR), min(N, int((t1 + back) * SR))
            env[i0:i1] *= db(g)
            env[i1:i2] *= db(g * (1 - np.linspace(0, 1, i2 - i1)))
        mus_d *= env[:, None]

    mix = voice + mus_d + sfx
    mix = filt(mix, sos("highpass", 30))

    print("4) loudness + true-peak limiter ...")
    tmp = W / "_mix_f.wav"
    wavfile.write(tmp, SR, mix.astype(np.float32))
    I0, _ = ebur128(tmp)
    g = LUFS_TARGET - I0
    for it in range(6):
        y, gr = tp_limit(mix * db(g), cfg.tp_ceil)
        y = end_fade(y)
        wavfile.write(tmp, SR, y.astype(np.float32))
        I, TP = ebur128(tmp)
        print(f"   tur {it}: kazanç {g:+.2f} dB -> I {I:.2f} LUFS, TP {TP:.2f} dBTP, maks GR {to_db(gr.min()):.2f} dB")
        if abs(I - LUFS_TARGET) <= 0.05 and TP <= -1.5:
            break
        g += LUFS_TARGET - I
    write_wav24(W / "mix.wav", y)
    G = db(g)
    write_wav24(W / "sfx.wav", sfx * G if np.max(np.abs(sfx * G)) < 1 else sfx)

    # ───── doğrulama (dinlemeden ölçüm) ─────
    I, TP = ebur128(W / "mix.wav")
    with wave.open(str(W / "mix.wav")) as w:
        nfr, sr_, ch_, sw_ = w.getnframes(), w.getframerate(), w.getnchannels(), w.getsampwidth()
    mx = read_wav(W / "mix.wav")
    rep = dict(mix=dict(I_LUFS=I, TP_dBTP=TP, samples=nfr, expected_samples=N, sr=sr_, channels=ch_, bits=sw_ * 8,
                        duration_s=nfr / sr_, last_0_15s_peak_dBFS=float(to_db(np.abs(mx[-int(FADE_END * SR):]).max())),
                        last_sample=float(np.abs(mx[-1]).max())))
    f, P = signal.welch(mx.mean(1), SR, nperseg=8192)
    rep["mix"]["energy_below_80Hz_pct"] = float(100 * P[f < 80].sum() / P.sum())

    vs = voice * G; ms = mus_d * G
    if cfg.no_voice:
        # konuşma-müzik farkı, ducking ve dudak senkronu anlamsız -> yerine: bölüm loudness'ı (momentary, 400 ms),
        # final sonrası sönüm, limiter etkisi ve ses stem'inin gerçekten sıfır olduğu
        fr_ = ebur128_frames(W / "mix.wav")
        def m_stats(a, b):           # pencere sonu (a+0.4, b] -> tamamı bölüm içinde kalan 400 ms pencereler
            v = [M for t_, M, S in fr_ if a + 0.4 - 1e-6 <= t_ <= b + 1e-6 and M > -70]
            return dict(M_med=round(float(np.median(v)), 1), M_max=round(float(max(v)), 1)) if v else None
        rep["sections_LUFS"] = [dict(name=s["name"], start=s["start"], end=s["end"], **(m_stats(s["start"], s["end"]) or {}))
                                for s in cfg.sections]
        rep["final_decay_M_LUFS"] = [dict(t=round(t_, 1), M=M) for t_, M, S in fr_          # final sonrası her 0.5 s
                                     if cfg.final < t_ <= cfg.total + 0.01 and round(round(t_, 1) * 10) % 5 == 0]
        rep["mix"]["limiter_gr_max_dB"] = round(float(to_db(gr.min())), 2)
        rep["voice_stem_peak"] = float(np.abs(voice).max())
        rep["voice_vs_music_dB"] = rep["duck_gain_dB"] = rep["voice_sync_lag_samples"] = "konuşmasız (voice.none): ölçülmez"
    else:
        wins = speech_windows(cfg)
        rep["voice_vs_music_dB"] = [dict(win=w_, voice=round(win_rms_db(vs, *w_), 1), music=round(win_rms_db(ms, *w_), 1),
                                         diff=round(win_rms_db(vs, *w_) - win_rms_db(ms, *w_), 1)) for w_ in wins]
        # ducking kazancı (müzik içeriğinden bağımsız): konuşma / son kelimeden sonraki boşluk / final sonrası
        dg = lambda a, b: round(float(np.mean(-DUCK_DB * act[int(a * SR):int(b * SR)])), 2) if b > a else None
        tail = cfg.last_word + 0.45
        rep["duck_gain_dB"] = dict(speech=round(float(np.mean(-DUCK_DB * act[speech])), 2),
                                   after_last_word=dg(tail, cfg.final), after_final=dg(cfg.final, cfg.total - FADE_END))
        # ses: dudak senkronu (voice_cut ile çapraz korelasyon)
        # referans: işlemin kullandığı hizalı mono (L + kaydırılmış R). Düz L/R ortalaması mikrofonlar arası
        # kaymayı (örn. 6-12 örnek) içerir ve tepeyi kanal dengesine göre 0..kayma arasında oynatır -> ayrıca raporlanır
        vc = read_wav(W / "voice_cut.wav")
        if vc.ndim == 2:
            vref = 0.5 * (vc[:, 0] + np.roll(vc[:, 1], xcorr_lag(vc[:, 0], vc[:, 1])))
            rep["voice_sync_lag_vs_LR_mean_samples"] = xcorr_lag(voice[:len(vc), 0], vc.mean(1), absolute=True)
        else:
            vref = vc
        rep["voice_sync_lag_samples"] = xcorr_lag(voice[:len(vref), 0], vref, absolute=True)

    # SFX tepe zamanları: (a) tek başına render, (b) toplam sfx stem'inde pencere içi tepe
    stem = sfx
    hf = filt(stem, sos("highpass", 250, 4))       # impact gövdesini dışarıda bırak
    rows = []
    for L_ in log:
        pk = main_peak(L_["x"], L_["kind"], L_["win"])
        iso = (L_["i0"] + pk) / SR
        src = hf if L_["kind"] in HF_TYPES else stem
        a, b = (L_["target"] - 0.12, L_["target"] + 0.02) if L_["kind"] in SWEEPS else (L_["target"] - 0.03, L_["target"] + 0.03)
        ia = max(0, int(a * SR))
        # zarf pencereden geniş hesaplanır: kesik parçada uniform_filter1d kenarı yansıtır ve
        # pencere sonunda sahte tepe üretir (ör. süpürmede +19 ms hata)
        pad = int(L_["win"] * SR)
        p0 = max(0, ia - pad)
        seg = env_rms(src[p0:int(b * SR) + pad], L_["win"])[ia - p0:ia - p0 + int(b * SR) - ia]
        if L_["kind"] == "file":   # dosya: tepe değil tüm dalga -> stem içindeki yeri çapraz korelasyonla (±50 ms)
            m50 = int(0.05 * SR)
            xm = L_["x"].mean(1)[:max(1, len(stem) - L_["i0"])]          # süre sonunda kırpılan kesit
            a0 = max(0, L_["i0"] - m50)
            c = signal.correlate(stem[a0:L_["i0"] + len(xm) + m50].mean(1), xm, mode="valid", method="fft")
            ins = (a0 + int(np.argmax(c))) / SR
        elif L_["kind"] == "ding":   # çan: tepe yerine atak (yarı genlik) anından tepe zamanını çıkar
            e_iso = env_rms(L_["x"], L_["win"])
            d_on = pk - int(np.argmax(e_iso >= 0.5 * e_iso[pk]))
            base = seg[:int(0.02 * SR)].min()            # önceki sesin kuyruğu üzerine yükseliş
            ins = (ia + int(np.argmax(seg >= base + 0.5 * (seg.max() - base))) + d_on) / SR
        else:
            ins = (ia + int(np.argmax(seg))) / SR
        crowded = any(o is not L_ and abs(o["target"] - L_["target"]) < 0.06 for o in log)
        # seviye: SFX 50 ms tepe RMS - çevresindeki konuşmanın RMS'i (±0.5 s)
        e50 = to_db(env_rms(stem[max(0, int((L_["target"] - 0.05) * SR)):int((L_["target"] + 0.05) * SR)], 0.05).max())
        vloc = win_rms_db(voice, L_["target"] - 0.5, L_["target"] + 0.5)
        rows.append(dict(type=L_["type"], event_t=L_["t"], target=round(L_["target"], 4),
                         isolated=round(iso, 4), in_stem=round(ins, 4),
                         err_ms=round(1000 * (ins - L_["target"]), 1), overlapped=crowded,
                         vs_voice_dB=round(float(e50 - vloc), 1) if vloc > -60 else None))
        if cfg.no_voice:           # konuşmasız: SFX 50 ms tepe RMS - çevresindeki müziğin RMS'i (±0.5 s, rampalar dahil)
            mloc = win_rms_db(mus_d, L_["target"] - 0.5, L_["target"] + 0.5)
            rows[-1]["vs_music_dB"] = round(float(e50 - mloc), 1) if mloc > -80 else None
        if L_["kind"] == "file":   # dosya: kendi seviyesi (konuşma ortalamasına göre), uygulanan kazanç, limiter etkisi
            fa, fb = max(0, L_["i0"]), min(len(stem), L_["i0"] + len(L_["x"]))
            fseg = stem[fa:fb]
            rows[-1].update(dur_s=round(len(L_["x"]) / SR, 3),
                            rms_vs_voice_dB=round(clip_level(fseg) - voice_ref, 1),
                            peak50_vs_voice_dB=round(float(to_db(env_rms(fseg, 0.05).max())) - voice_ref, 1),
                            file_gain_dB=round(L_["file_gain_db"] + float(to_db(G)), 2),
                            limiter_gr_max_dB=round(float(to_db(gr[fa:fb].min())), 2))
    rep["sfx_peaks"] = rows
    rep["music_hits_peak_s"] = [] if cfg.music_file else [round(h[0], 4) for h in music_hits(cfg)]
    if cfg.music_file:             # hazır parça: sentez vuruşu yok; kullanılan kesit
        rep["music_file"] = cfg.music_file
    rep["voice_processing"] = vinfo
    rep["voice_ref_dBFS_premaster"] = round(voice_ref, 2)
    rep["music_config"] = dict(bars=cfg.bars, drops=cfg.drops, builds=cfg.builds, gaps=cfg.gaps, light=cfg.light,
                               hits=cfg.hits, crashes=cfg.crashes, layers=cfg.layers)
    json.dump(rep, open(W / "audio_report.json", "w"), ensure_ascii=False, indent=1)
    for p in ("_voice_mono.wav", "_voice_proc_f.wav", "_mix_f.wav"):
        (W / p).unlink(missing_ok=True)

    print("\n=== RAPOR ===")
    print(json.dumps(rep["mix"], indent=1))
    if cfg.no_voice:
        for s in rep["sections_LUFS"]:
            print(f"   bölüm {s['name']:<10} {s['start']:5.2f}-{s['end']:5.2f} s: momentary medyan {s.get('M_med')} LUFS, "
                  f"maks {s.get('M_max')} LUFS")
        print("   final sonrası sönüm (M, LUFS):", [(d["t"], d["M"]) for d in rep["final_decay_M_LUFS"]])
        print(f"   ses stem tepesi: {rep['voice_stem_peak']} (konuşmasız, 0 olmalı)")
        if rep["mix"]["limiter_gr_max_dB"] < -3:
            warn(f"limiter GR {rep['mix']['limiter_gr_max_dB']} dB (> 3 dB): SFX/vuruş seviyesini düşür")
    else:
        for r in rep["voice_vs_music_dB"]:
            print(f"   ses-müzik {r['win']}: ses {r['voice']} dB, müzik {r['music']} dB -> fark {r['diff']} dB")
        print("   ducking:", rep["duck_gain_dB"], " ses senkron kayması:", rep["voice_sync_lag_samples"], "örnek")
    for r in rows:
        print(f"   {r['type']:<17} t={r['event_t']:6.2f} hedef={r['target']:7.3f}  izole={r['isolated']:7.3f}  "
              f"stem={r['in_stem']:7.3f}  hata={r['err_ms']:+.1f} ms  "
              + (f"sfx-müzik={r['vs_music_dB']} dB" if cfg.no_voice else f"sfx-ses={r['vs_voice_dB']} dB"))
        if "file_gain_dB" in r:
            print(f"   {'':<17} dosya {r['dur_s']} s: ort. RMS konuşmaya göre {r['rms_vs_voice_dB']:+.1f} dB, 50 ms tepe "
                  f"{r['peak50_vs_voice_dB']:+.1f} dB, dosyaya uygulanan kazanç {r['file_gain_dB']:+.2f} dB, "
                  f"limiter GR maks {r['limiter_gr_max_dB']:.2f} dB")
    # geçme ölçütü: tek başına tepe tam hedefte; çakışmayan olaylarda stem içi hata <= 10 ms
    bad = [r for r in rows if abs(r["isolated"] - r["target"]) > 0.001
           or (not r["overlapped"] and abs(r["err_ms"]) > 10)]
    ok = abs(I - LUFS_TARGET) <= 0.1 and TP <= -1.5 and nfr == N and not bad
    if cfg.no_voice:             # konuşmasız: ses stem'i tam sıfır olmalı (sessiz kanaldan gürültü/artık sızmasın)
        ok = ok and rep["voice_stem_peak"] == 0.0
    print("SONUÇ:", "GEÇTİ" if ok else f"KALDI (zamanlama hatası: {[r['type'] for r in bad]})")


if __name__ == "__main__":
    main()


