"""Ayrı kaydedilmiş anlatımı sessiz ekran kaydına eşler (ör. ekran kaydında mikrofon kopmuş,
ses sonradan tek nefeste kaydedildi). Zaman çizelgesini SES belirler; her konuşma bloğu videodaki sahnesine bağlanır.

Hazırlık: work/src_orig.mp4 (sessiz video, 30 fps), work/audio16k.wav + audio48k.wav + transcript.json (anlatım; Whisper + MMS)
  ./studyo py - pipeline/ders_eslestir.py analiz <slug>  -> work/ders_cumleler.md (anlatım cümleleri), work/ders_aktivite.json (video hareketi)
  plan.json "eslesme": {
     "bloklar": [
       {"w": [i0, i1], "v": [s0, s1]},          # anlatım kelimeleri i0..i1, videonun s0..s1 aralığı konuşma süresine yayılır
       {"w": [i0, i1], "v": s0},                # tek kare (slayt) dondurulur
       {"w": [i0, i1], "v": [s0, s1], "on": .4, "son": .8},   # bloğun önüne/arkasına ek es (video o sürede de akar)
       {"v": [s0, s1], "d": 3.0},               # konuşmasız ara: video s0..s1, d saniyede (hızlandırma rozeti için "hiz": true)
       {"w": [i0, i1], "v": [[s0, s1, pay], [s2, s3, pay]]}   # blok içinde birden çok video parçası, süre paylara göre bölünür
     ],
     "drop": [[i0, i1], ...], "drop_t": [[a, b], ...],        # anlatımdan atılan kelime / saniye aralıkları
     "fixes": {i: "yazım" | null},
     "es": {"cumle": .45, "virgul": .18, "max": .6, "blok": .35}  # cümle sonu / virgül sonrası en az es, en uzun es, blok arası es
  }
  ./studyo py - pipeline/ders_eslestir.py kur <slug>     -> work/src_sdr4k.mp4, audio16k/48k.wav (çıkış), transcript.json (çıkış zamanı),
                                                     work/ders_harita.json; plan.cut güncellenir. Sonrası normal hat (render/audio/final).
Kurallar:
  - Anlatım neredeyse durmadan okunduğu için cümle sonlarına es eklenir (oda tonu); doğal es max'tan uzunsa kısaltılır.
  - Kelime kenarı payları ders_kurgu ile aynı (pre / pre_vowel / tail); atılan kelimenin kırıntısı girmez.
  - Video yavaşlatılırsa (konuşma, ekrandaki işten uzun) kare tekrarlanır; ekran kaydında fark edilmez. 3 kattan fazla yavaşlatmada uyarı.
"""
import json
import re
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ders_kurgu import ROOT, FPS, SR, VOWELS, wpath, load_wav, rms_db, sentences, activity  # noqa: E402

PRE, PRE_V, TAIL = .10, .14, .16


def analiz(slug):
    tr = json.load(open(wpath(slug, "transcript.json")))
    words = tr["words"]
    lines = []
    for si, s in enumerate(sentences(words)):
        a, b = words[s[0]]["s"], words[s[-1]]["e"]
        lp = [i for i in s if words[i].get("p", 1) < 0.5]
        lines.append(f"S{si} [{s[0]}-{s[-1]}] {a:7.2f}-{b:7.2f}  " + " ".join(words[i]["w"] for i in s)
                     + (f"   (düşük güven: {', '.join(words[i]['w'] + '@' + str(i) for i in lp)})" if lp else ""))
    wpath(slug, "ders_cumleler.md").write_text("\n".join(lines), encoding="utf-8")
    if not wpath(slug, "ders_aktivite.json").exists():
        activity(slug)
    print(f"{slug}: {len(words)} kelime, {len(lines)} cümle -> work/ders_cumleler.md, ders_aktivite.json")


def kur(slug):
    P = ROOT / "projects" / slug
    plan = json.load(open(P / "plan.json"))
    E = plan["eslesme"]
    es = {"cumle": .45, "virgul": .18, "max": .6, "blok": .35, **E.get("es", {})}
    src_tr = wpath(slug, "transcript_src.json")
    if not src_tr.exists():
        src_tr.write_text(wpath(slug, "transcript.json").read_text(encoding="utf-8"), encoding="utf-8")
    words = json.load(open(src_tr))["words"]
    for k in ("audio48k.wav", "audio16k.wav"):
        o = wpath(slug, k.replace(".wav", "_src.wav"))
        if not o.exists(): wpath(slug, k).rename(o)
    x48 = load_wav(wpath(slug, "audio48k_src.wav"), SR)
    vdur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                 str(wpath(slug, "src_orig.mp4"))], capture_output=True, text=True).stdout)

    dropped = set()
    for i0, i1 in E.get("drop", []): dropped.update(range(i0, i1 + 1))
    for a, b in E.get("drop_t", []):
        dropped.update(i for i, w in enumerate(words) if w["s"] >= a - 1e-3 and w["e"] <= b + 1e-3)
    FIL = re.compile(r"^(e+|ı+|i+h?|hı+|ıh+|hm+|m+|ee+m*|a+h?)$", re.I)
    dropped.update(i for i, w in enumerate(words) if FIL.match(re.sub(r"[.,!?…\-]", "", w["w"]).lower()))

    # oda tonu: anlatımdaki en sessiz 0.5 s
    blk = int(SR * .5); m = len(x48) // blk
    e = np.sqrt(np.mean(x48[: m * blk].reshape(m, blk) ** 2, axis=1)); j = int(np.argmin(e[1:-1])) + 1
    tone = x48[j * blk:(j + 1) * blk] * .7
    def room(n): return np.resize(tone, n).astype(np.float32) if n > 0 else np.zeros(0, np.float32)
    fade = int(.008 * SR)
    def clip(a, b):
        s = x48[int(a * SR): int(b * SR)].copy()
        r = np.linspace(0, 1, min(fade, len(s) // 2), dtype=np.float32)
        if len(r): s[: len(r)] *= r; s[-len(r):] *= r[::-1]
        return s

    def voice(i0, i1):
        """Blok sesi: [(ses dizisi), kelime çıkış zamanları (blok içi)]."""
        kept = [i for i in range(i0, i1 + 1) if i not in dropped]
        out, wt, t = [], [], 0.0
        for n, i in enumerate(kept):
            w = words[i]
            pre = PRE_V if w["w"][:1] in VOWELS else PRE
            if n == 0:
                lim = w["s"] - words[i - 1]["e"] - .02 if i > 0 else pre
                a = w["s"] - max(0.0, min(pre, lim))
            else:
                p = kept[n - 1]; pw = words[p]
                if p == i - 1:
                    gap = w["s"] - pw["e"]
                    want = es["cumle"] if re.search(r"[.!?…:]$", pw["w"]) else es["virgul"] if re.search(r"[,;]$", pw["w"]) else 0
                    if gap <= es["max"] and gap >= want:
                        a = cur_end                                        # doğal es yeterli: kesintisiz devam
                    else:                                               # boşluğun ortasından kes; es = hedef
                        mid = pw["e"] + min(gap, .06) / 2 if gap < .12 else pw["e"] + min(TAIL, gap / 2)
                        out.append(clip(seg_a, mid)); t += mid - seg_a
                        keep = min(max(gap, want), es["max"]) - (mid - pw["e"])
                        a = w["s"] - min(pre, max(0.0, w["s"] - mid), max(0.0, gap / 2))
                        keep -= (w["s"] - a)
                        if keep > 0: out.append(room(int(keep * SR))); t += keep
                        seg_a = a
                else:                                                   # atılan kelime(ler) arası
                    b = pw["e"] + max(0.0, min(TAIL, words[p + 1]["s"] - pw["e"] - .02))
                    out.append(clip(seg_a, b)); t += b - seg_a
                    want = es["cumle"] if re.search(r"[.!?…:]$", pw["w"]) else es["virgul"]
                    out.append(room(int(want * .6 * SR))); t += want * .6
                    lim = w["s"] - words[i - 1]["e"] - .02
                    a = w["s"] - max(0.0, min(pre, lim)); seg_a = a
            if n == 0: seg_a = a
            wt.append((i, t + (w["s"] - seg_a), t + (w["e"] - seg_a)))
            cur_end = w["e"]
        last = words[kept[-1]]
        nxt = words[kept[-1] + 1]["s"] if kept[-1] + 1 < len(words) else last["e"] + TAIL
        b = last["e"] + max(0.0, min(TAIL, nxt - last["e"] - .02))
        out.append(clip(seg_a, b)); t += b - seg_a
        y = np.concatenate(out)
        return y, wt

    parts, audio, tw, t_out = [], [], [], 0.0
    for k, B in enumerate(E["bloklar"]):
        on, son = B.get("on", 0.0), B.get("son", es["blok"] if "w" in B else 0.0)
        if "w" in B:
            y, wt = voice(*B["w"])
            d = on + len(y) / SR + son
            seg = [room(int(on * SR)), y, room(int(son * SR))]
        else:
            d = B["d"]; wt = []
            seg = [room(int(d * SR))]
        nfr = int(round((t_out + d) * FPS)) - int(round(t_out * FPS))
        d_fr = nfr / FPS
        y = np.concatenate(seg)
        n_s = int(round(d_fr * SR))
        y = y[:n_s] if len(y) >= n_s else np.concatenate([y, room(n_s - len(y))])
        audio.append(y)
        for i, s, e in wt: tw.append((i, t_out + on + s, t_out + on + e))
        V = B["v"]
        if not isinstance(V, list): V = [[V, V, 1]]
        elif not isinstance(V[0], list): V = [[V[0], V[1], 1]]
        tot = sum(v[2] if len(v) > 2 else 1 for v in V); f_used = 0
        for vi, v in enumerate(V):
            share = (v[2] if len(v) > 2 else 1) / tot
            nf = nfr - f_used if vi == len(V) - 1 else int(round(nfr * share))
            f_used += nf
            s0, s1 = min(v[0], vdur - .05), min(v[1], vdur - .04)
            parts.append({"blok": k, "src_a": s0, "src_b": s1, "n": nf, "out_a": round(t_out + (f_used - nf) / FPS, 4),
                          "hiz": bool(B.get("hiz")), "k": round((s1 - s0) / (nf / FPS), 3) if nf else 0})
        t_out += d_fr
    slow = [p for p in parts if p["src_b"] > p["src_a"] and 0 < p["k"] < 1 / 3]
    if slow: print("UYARI 3 kattan fazla yavaşlatma:", [(p["blok"], p["src_a"], p["k"]) for p in slow][:10])

    # görüntü: parça başı ayrı kodla, uç uca ekle
    tmp = Path(tempfile.mkdtemp(prefix="eslestir_", dir=str(wpath(slug, "."))))
    def enc(job):
        i, p = job; out = tmp / f"{i:05d}.mp4"; n = p["n"]
        if n <= 0: return None
        if p["src_b"] - p["src_a"] < 1.5 / FPS:                        # dondurulmuş kare
            vf = f"trim=end_frame=1,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop={n}"
            inp = ["-ss", f"{p['src_a']:.4f}", "-i", str(wpath(slug, "src_orig.mp4"))]
        else:
            sd = p["src_b"] - p["src_a"]; od = n / FPS
            vf = f"setpts=(PTS-STARTPTS)*{od / sd:.6f},fps={FPS}"
            inp = ["-ss", f"{p['src_a']:.4f}", "-t", f"{sd + .1:.4f}", "-i", str(wpath(slug, "src_orig.mp4"))]
        subprocess.run(["ffmpeg", "-v", "error", "-y", *inp, "-an", "-vf", vf, "-frames:v", str(n), "-r", str(FPS),
                        "-c:v", "h264_videotoolbox", "-b:v", "16M", "-pix_fmt", "yuv420p", str(out)], check=True)
        got = int(subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries",
                                  "stream=nb_read_frames", "-of", "csv=p=0", str(out)], capture_output=True, text=True).stdout.strip() or 0)
        if got < n:                                                     # eksik kare: son kareyi uzat
            fix = tmp / f"{i:05d}_f.mp4"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(out), "-vf", f"tpad=stop_mode=clone:stop={n - got}",
                            "-frames:v", str(n), "-c:v", "h264_videotoolbox", "-b:v", "16M", "-pix_fmt", "yuv420p", str(fix)], check=True)
            fix.replace(out)
        return out
    with ThreadPoolExecutor(6) as ex:
        res = [r for r in ex.map(enc, enumerate(parts)) if r]
    (tmp / "list.txt").write_text("".join(f"file '{o}'\n" for o in res))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(tmp / "list.txt"), "-c", "copy",
                    str(wpath(slug, "src_sdr4k.mp4"))], check=True)
    shutil.rmtree(tmp)

    y = np.concatenate(audio).astype(np.float32)
    for name, sr in (("audio48k.wav", SR), ("audio16k.wav", 16000)):
        ch = "2" if sr == SR else "1"
        codec = ["-c:a", "pcm_s24le"] if sr == SR else []
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-ac", ch, "-ar", str(sr), *codec,
                        str(wpath(slug, name))], input=y.tobytes(), check=True)

    nw = [{**words[i], "s": round(s, 3), "e": round(e, 3), "src_i": i, "src_s": words[i]["s"], "src_e": words[i]["e"]} for i, s, e in tw]
    json.dump({"text": " ".join(w["w"] for w in nw), "words": nw}, open(wpath(slug, "transcript.json"), "w"), ensure_ascii=False, indent=1)
    src2new = {w["src_i"]: n for n, w in enumerate(nw)}
    plan["fixes"] = {str(src2new[int(k)]): v for k, v in E.get("fixes", {}).items() if int(k) in src2new}
    json.dump({"src_dur": vdur, "out_dur": t_out, "parts": parts}, open(wpath(slug, "ders_harita.json"), "w"), indent=1)
    plan.setdefault("cut", {}).update({"min_cut": 99, "src_start": 0.0, "src_end": round(t_out - 1 / FPS, 4)})
    json.dump(plan, open(P / "plan.json", "w"), ensure_ascii=False, indent=1)
    unused = sorted(set(range(len(words))) - dropped - set(src2new))
    print(f"{slug}: anlatım {len(x48) / SR / 60:.1f} dk, video {vdur / 60:.1f} dk -> çıkış {t_out / 60:.2f} dk | "
          f"{len(E['bloklar'])} blok, {len(parts)} parça | {len(nw)} kelime, atılan {len(dropped)}, bloksuz {len(unused)}")
    if unused: print("  bloğa girmeyen kelimeler:", unused[:40])


if __name__ == "__main__":
    cmd, slug = sys.argv[1], sys.argv[2]
    {"analiz": analiz, "kur": kur, "aktivite": activity}[cmd](slug)
