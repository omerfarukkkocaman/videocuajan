"""Yayın öncesi sızıntı taraması: git'e girecek dosyalarda kişisel/müşteri izi, medya, sır var mı?
Kullanım: python3 araclar/sizinti_tara.py        (repo kökünde; çıkış kodu 1 = sorun var, yayınlama)
Yasaklı kelimeler: .yasakli.txt (her satır bir düzenli ifade; 'izin: <metin>' satırları istisnadır; dosya repoya GİRMEZ).
Ek kontroller: e-posta adresi, kullanıcı yolu (/Users/<ad>, C:\\Users\\<ad>), API anahtarı kalıpları,
izinli olmayan medya dosyaları, büyük dosyalar.
"""
import re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
files = subprocess.run(["git", "ls-files", "--cached", "--others", "--exclude-standard"], cwd=ROOT,
                       capture_output=True, text=True).stdout.split("\n")
files = [f for f in files if f and (ROOT / f).is_file()]
yas = ROOT / ".yasakli.txt"
lines = [l.strip() for l in yas.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")] if yas.exists() else []
IZIN = [l[5:].strip() for l in lines if l.startswith("izin:")]              # izinli ifadeler (ör. repo adresi, lisans telif satırı)
pats = [l for l in lines if not l.startswith("izin:")]
if not pats: print("UYARI: .yasakli.txt yok ya da boş; yalnız genel kontroller yapılıyor")
WORD = re.compile("|".join(pats), re.I) if pats else None
GENEL = {
    "e-posta": re.compile(r"[A-Za-z0-9._%+-]+@(?!ornek)[A-Za-z0-9.-]+\.(com|org|net|io|tr)\b"),
    "kullanıcı yolu": re.compile(r"/Users/(?!<|\$)[a-z][\w.-]+|C:\\\\?Users\\\\?(?!<)[A-Za-z]\w+", re.I),
    "anahtar": re.compile(r"(sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|ghp_[A-Za-z0-9]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY)"),
}
MEDYA_IZIN = {"brands/ornek/", "assets/fonts/", "assets/sessiz_1s.wav"}
MEDYA = {".mp4", ".mov", ".m4a", ".mp3", ".wav", ".jpg", ".jpeg", ".png", ".webp", ".heic", ".svg", ".pdf"}
bad = []
for f in files:
    p = ROOT / f
    if f == ".yasakli.txt" or f.startswith("araclar/sizinti_tara"): continue
    if p.suffix.lower() in MEDYA and not any(f.startswith(m) for m in MEDYA_IZIN):
        bad.append((f, 0, "izinsiz medya dosyası")); continue
    if p.stat().st_size > 2_000_000 and not f.startswith("assets/fonts/"):
        bad.append((f, 0, f"büyük dosya ({p.stat().st_size // 1_000_000} MB)"))
    if p.suffix.lower() in MEDYA or p.suffix.lower() in (".ttf", ".otf"): continue
    try: text = p.read_text(encoding="utf-8")
    except UnicodeDecodeError: continue
    for i, line in enumerate(text.splitlines(), 1):
        for z in IZIN: line = line.replace(z, "")
        if WORD and (m := WORD.search(line)): bad.append((f, i, f"yasaklı '{m.group(0)}': {line.strip()[:110]}"))
        for k, rx in GENEL.items():
            if (m := rx.search(line)): bad.append((f, i, f"{k} '{m.group(0)}': {line.strip()[:110]}"))
for f, i, msg in bad: print(f"{f}:{i}: {msg}")
print(f"\n{len(files)} dosya tarandı, {len(bad)} sorun." + (" YAYINLAMA." if bad else " TEMİZ."))
sys.exit(1 if bad else 0)
