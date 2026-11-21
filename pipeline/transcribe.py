"""Whisper medium ile Türkçe transkript (kelime zamanlı). Çıktı: $WORK/transcript.json
Zamanlar kaba; kesin zamanlar 00_align.py ile gelir.
"""
import whisper, json, warnings
from common import w, load_plan
warnings.filterwarnings("ignore")

plan = load_plan()
prompt = plan.get("whisper_prompt", "e-ticaret, Instagram, takip edin.")
m = whisper.load_model("medium", device="cpu")
r = m.transcribe(w("audio16k.wav"), language=plan.get("lang", "tr"), word_timestamps=True, fp16=False,
                 condition_on_previous_text=False, initial_prompt=prompt)
words = [{"w": x["word"].strip(), "s": round(x["start"], 3), "e": round(x["end"], 3), "p": round(x.get("probability", 0), 3)}
         for s in r["segments"] for x in s["words"]]
json.dump({"text": r["text"], "words": words}, open(w("transcript.json"), "w"), ensure_ascii=False, indent=1)
print(r["text"])
