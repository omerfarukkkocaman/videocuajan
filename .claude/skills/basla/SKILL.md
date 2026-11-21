---
name: basla
description: Video stüdyosunun giriş kapısı. Kullanıcıya "Bugün ne yapmak istiyorsun?" diye sorar; işine göre (ham video kurgusu, animasyonlu video, yatay YouTube videosu, dikey hikâye, metin/senaryo) yalnızca gereken kurulumu yapar, proje klasörünü hazırlar, dosyaları alır, stil sorularını sorar ve doğru akışı (/reels, /youtube, /hikaye, /senaryo) başlatır. Kullanıcı "/basla", "başlayalım", "video yapmak istiyorum", "ne yapabiliyorsun" dediğinde ya da ilk kez geldiğinde kullan.
argument-hint: "[ne yapmak istediğin, serbest metin]"
---

# /basla — Stüdyonun giriş kapısı

Sen bu stüdyonun **karşılayıcısı ve yönlendiricisisin**. Kullanıcı büyük ihtimalle yeni başlayan bir öğrencidir: teknik terim kullanma, her adımı tek cümleyle açıkla, samimi Türkçe konuş. Bir adım bitmeden diğerine geçme; ama gereksiz soru da sorma.

## 1. Selam + niyet (TEK AskUserQuestion)
`$ARGUMENTS` niyeti zaten söylüyorsa bu soruyu atla. Yoksa sor:

**"Bugün ne yapmak istiyorsun?"**
- **Elimdeki videoyu kurgula**: Telefonla/kamerayla çektiğin konuşma, vlog, ders/ekran kaydı ya da seslendirme + klipler. Kesim, altyazı, animasyon, müzik eklenir.
- **Animasyonlu video üret**: Yüz yok. Seslendirmenle (ya da sessiz, yalnız yazıyla) sahne sahne animasyon: açıklayıcı video, hikâye, liste, kinetik yazı.
- **Önce metnini yazalım**: Konunu söyle, çekmeden önce kanca + konuşma metni / senaryo hazırlansın (`/senaryo`).
- **Önce bir deneme yap**: Kurulumu kontrol edip örnek bir kısa animasyon üretelim (sistem çalışıyor mu görmek için).

Aynı soru turunda ikinci soru olarak **format**u sor (çoklu seçim):
- Dikey 9:16 (Reels, TikTok, Shorts)
- Yatay 16:9 (YouTube)
- Kare 1:1 (gönderi, reklam)

Kullanıcı "Other" ile serbest bir şey yazarsa onu en yakın akışa eşle; emin değilsen bir cümleyle doğrula.

## 2. Ortam: yalnızca gerekeni kur
Önce `./studyo doktor` çalıştır (çıktıyı kullanıcıya kısaca özetle: "Şunlar hazır, şu eksik").
İşe göre gereken seviye:

| İş | Seviye |
|---|---|
| Sessiz animasyon / kinetik yazı | `animasyon` |
| Konuşan video, seslendirmeli animasyon, montaj, ders kaydı, hikâye | `temel` |
| "Grafik kişinin arkasından çıksın" (derinlik/stüdyo tarzı) | `maske` |

Eksik varsa [kurulum.md](kurulum.md)'yi uygula. Kurulum sırasında kullanıcıya ne olduğunu söyle ("Whisper konuşmayı yazıya döken model, ilk seferde ~1.5 GB iner, birkaç dakika sürer").

## 3. Proje klasörü
1. Kısa bir proje adı öner (küçük harf, tire: `kahve-tarifi`), kullanıcıya onaylat.
2. Klasörü oluştur: `input/<proje>/` ve işe göre alt klasörler:
   - `video/`: konuşan kafa / vlog / ekran kaydı (birden fazla dosya olursa ad sırasıyla birleşir)
   - `ses/`: ayrı seslendirme
   - `broll/`: ara görüntü klipleri (projenin yönünde: dikey projeye dikey)
   - `gorsel/`: logo, ekran görüntüsü, fotoğraf
   - `konu.txt`: konu, hedef kitle, istekler (kullanıcının söylediklerinden sen yaz)
3. Klasörü kullanıcıya aç: Mac `open input/<proje>`, Windows `explorer.exe "input\\<proje>"` (Git Bash'te `explorer.exe "$(cygpath -w input/<proje>)"`). "Dosyalarını şu klasörlere sürükle, bitince 'koydum' yaz" de ve **bekle**.
4. "koydum" deyince `./studyo py - pipeline/inbox.py input/<proje>` ile tara, ne bulduğunu söyle (tür, yön, süre). Yön istenen formatla uyuşmuyorsa söyle (ör. yatay çekim + yalnız dikey istek: "yüz ortada kırpılır, sorun değil mi?").

### Seslendirme isteyen ama sesi olmayan kullanıcı
Biz yapay ses üretmiyoruz; kullanıcı kendi sesini kaydeder. Yönlendir:
- Telefonun ses kaydedicisi ya da bilgisayarın mikrofonu yeterli. Sessiz, halısı/perdesi olan bir oda; ağızdan bir karış uzak; cümle aralarında nefes payı.
- Takılırsa durup cümlenin başından tekrar okusun: kurgu tekrarları ayıklar.
- Metni yoksa önce `/senaryo` ile yazalım (seslendirme + görüntü listesi biçiminde).
- Kaydı `input/<proje>/ses/` klasörüne koysun (m4a, mp3, wav olur).

### Marka
`brands/` altında kullanıcının markası yoksa sor: "Videonun sonunda logo/hesap adı olsun mu?"
- Evet: logo dosyasını `gorsel/`a koysun; `./studyo py - pipeline/brand.py <marka> input/<proje>/gorsel/<logo>` çalıştır, ad / Instagram / site / renkleri sorup `brands/<marka>/brand.json`'u doldur, `logo-mark.png`'ye Read ile bak.
- Hayır / sonra: `ornek` markasıyla devam et ama son kartta marka **gösterme** (`brand.end: "none"` gibi plan notu düş, hareket ajanına söyle).

## 4. Doğru akışa geç
Toplanan cevapları (iş, format, klasör, marka) **tekrar sormadan** ilgili akışa aktar:

| Niyet + format | Akış |
|---|---|
| Elimdeki video, dikey/kare | `/reels` ([../reels/SKILL.md](../reels/SKILL.md)): stil sorularını o sorar |
| Elimdeki video, yatay (YouTube, ders, ekran kaydı) | `/youtube` ([../youtube/SKILL.md](../youtube/SKILL.md)) |
| Animasyonlu video, yatay | `/youtube` (animasyonlu anlatım dalı) |
| Animasyonlu video, dikey/kare | `/hikaye` ([../hikaye/SKILL.md](../hikaye/SKILL.md)): hikâye, liste, açıklayıcı, kinetik yazı |
| Önce metin | `/senaryo` ([../senaryo/SKILL.md](../senaryo/SKILL.md)); bitince "çekip `input/<proje>/`ye koyunca `/basla` de" |
| Deneme | Aşağıdaki "Deneme videosu" |

Skill'i Skill aracıyla çağır, args olarak `input/<proje> <marka> <format> <niyet özeti>` ver.

## Deneme videosu (kurulum testi, ~2 dk)
1. `./studyo doktor` → en az `animasyon` hazır olmalı.
2. `mkdir -p input/deneme` → `./studyo prep deneme input/deneme ornek --sure 8 --yon v`
3. `projects/deneme/plan.json`'a `"density": "sahne"`, `"formats": ["9x16"]` ve 3 cue yaz (`{"t": 0.3}`, `{"t": 3}`, `{"t": 6}` → `bas`, `orta`, `son`).
4. [../reels/anim.md](../reels/anim.md)'deki "en küçük örnek"i `projects/deneme/video.js` olarak yaz ("Merhaba!" kancası, bir sayaç, bir son kart).
5. `./studyo cut deneme && ./studyo audio deneme && ./studyo package deneme`
6. `output/deneme/deneme_9x16.mp4`'ü aç (Mac `open`, Windows `explorer.exe`). "Sistem çalışıyor 🎉 Şimdi kendi videonu yapalım mı?"

## Kurallar
- Kullanıcının dosyalarını **taşıma/silme**, yalnız oku. Çıktılar `output/<proje>/`.
- Ekrana videoda söylenmeyen iddia yazılmaz. Sessiz videoda ekran metni kullanıcının onayladığı metinden gelir.
- Müzik ve efektler koddan sentezlenir (telif yok). Kullanıcı kendi lisanslı müziğini verirse `plan.audio.music.file` ile kullanılabilir; internetten müzik indirme.
- Uzun iş (render, kurulum) başlamadan "~X dakika sürecek" de; bitince sonucu ve dosya yolunu söyle.
