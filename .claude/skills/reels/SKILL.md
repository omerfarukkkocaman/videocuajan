---
name: reels
description: input/<proje>/ klasöründeki ham videoyu (konuşan kafa) veya seslendirme + B-roll kliplerini (montaj / karışık) Instagram Reels'e hazır, animasyonlu, altyazılı, müzikli MP4'e çevirir; istenirse 1:1 kare ve 16:9 yatay paketiyle. Stil (animasyon yoğunluğu, altyazı, format) başta sorulur. Kullanıcı "/reels", "bu videoyu kurgula", "reels yap", "montaj yap" dediğinde veya input/'a yeni klasör/video koyduğunda kullan.
argument-hint: "[input/<proje> klasörü | video] [marka-slug] [istekler]"
---

# /reels — Reels stüdyosu

Sen bu akışın **yönetmenisin**. Kırmızı çizgiler (kurallar.md):
- güvenli alan (otomatik denetim, her format)
- kafanın kesilmemesi (yüz takipli kadraj)
- cümle düzeninde altyazı
- efekt bütçesi
- güçlü kanca

Referanslar: `ornekler/sahne-3format/video.js` (sahne yoğunluğu, 3 format), `ornekler/mikro.js`, `ornekler/montaj.js`; diğer tarz örnekleri stiller.md'de. Ağır işleri üç alt ajana dağıtırsın: `reels-hareket` (animasyon), `reels-ses` (müzik/efekt/miks), `reels-kontrol` (bağımsız kalite kontrol).

Önce oku:
- [stiller.md](stiller.md): türler, yoğunluklar, altyazı modları, formatlar (isimler ve anlamları)
- [kurallar.md](kurallar.md): tasarım ve hareket kuralları (zorunlu)
- [plan-ve-sahne.md](plan-ve-sahne.md): plan.json şeması, video.js API'si, bileşenler (v3 bölümü: formatlar, mikro, montaj)
- [ses-kurallari.md](ses-kurallari.md): ses olay tipleri, efekt bütçesi
- [stok-montaj.md](stok-montaj.md): yalnız ses verildiğinde stok video + animasyon (kolaj + sinematik) tarzı, stok indirme ve maske araçları

Yalnızca bu klasörde çalış. Kullanıcı Türkçe ve samimi konuşur, sen de öyle konuş.

## 0. Klasörü bul ve tara
- **Kaynak:** `$ARGUMENTS`'ta klasör/video verildiyse onu kullan. Yoksa `input/` altında, hiçbir `projects/*/plan.json` "folder"/"source" alanında geçmeyen en yeni klasörü al.
- **Klasör düzeni:**
  - `input/<proje>/video/` (konuşan kafa)
  - `ses/` (seslendirme)
  - `broll/` (klipler, projenin yönünde)
  - `gorsel/`
  - `konu.txt` (isteğe bağlı)
- **Tara:** `./studyo py - pipeline/inbox.py input/<proje>` → tür tahmini (`face` / `montage` / `mixed`), yön, klipler. Yönle uyuşmayan klip UYARI'sı varsa not al.
- **Slug:** `<marka>-<sıra>` (ör. `ornek-01`).

## 0b. Soru turu (TEK AskUserQuestion, en fazla 4 soru)
Cevabı mesajda veya `konu.txt`'de olanı sorma. Kalanları tek seferde sor:
1. **Video türü:**
   - tahmin edilen tür (Önerilen)
   - Konuşan kafa
   - B-roll montaj
   - Karışık (konuşma + araya B-roll)
   - (Klasörde yalnız `ses/` varsa ya da hiç medya yoksa tür `anim`dır: [anim.md](anim.md); dikey hikâye için `/hikaye`, yatay için `/youtube` akışına geç)
2. **Animasyon yoğunluğu:**
   - Sahne — Hareketli Anlatım (bol animasyon, ayrı sahneler)
   - Mikro — Dikkat Noktaları (yüz hep ekranda, küçük animasyonlar)
   - Karma (mikro + 1 güçlü sahne)
   - Temiz (sadece altyazı)

   Konuşan kafa bilgi videosunda Sahne, montajda Mikro "Önerilen" olur.
3. **Altyazı:** Vurgulu (Önerilen) / Sade / Yok
4. **Formatlar** (çoklu seçim): 9:16 Reels / 1:1 kare / 16:9 yatay

Marka belirsizse (klasör adı veya `konu.txt` söylemiyorsa) ayrı bir soru olarak sor. Cevaplar alındıktan sonra sonuna kadar soru sormadan çalış.

**Yeni marka** (`brands/<marka>/brand.json` yoksa; hazır örnek marka `brands/ornek/`, alanlar için ona bak):
1. Marka adını, Instagram kullanıcı adını ve siteyi sor.
2. Sitenin CSS'inden renkleri, sloganı ve logoyu al.
3. `./studyo py - pipeline/brand.py <marka> <logo.png> [--mark ...]` çalıştır, `brand.json`'u doldur.
4. `logo-mark.png`'ye bak.

## 1. Hazırlık (otomatik, ~1 dk)
```
./studyo prep <slug> input/<proje> <marka>
```
Bu komut şunları yapar:
- Tarama, HDR→SDR dönüşümü ve ses çıkarma (montajda `ses/` dosyası kullanılır). Mac'te Apple araçları, Windows'ta ffmpeg/MediaPipe karşılıkları otomatik kullanılır (studyo.py seçer).
- `video/` içinde birden fazla video varsa her birini 30 fps SDR'a çevirip ad sırasıyla birleştirir (`work/parts/parts.json`)
- Whisper transkripti, MMS hizalaması (±20 ms) ve otomatik bloklar
- Plan iskeleti
- Montaj/karışıkta B-roll taraması: `work/broll/index.json`, `sheets/`, `overview_*.jpg`

Prep'ten sonra soru turundaki seçimleri `plan.json`'a yaz: `kind`, `density`, `captions`, `formats`.

## 2. Yönetmenlik: plan.json yaz
1. **Görüntü:**
   - Konuşan kafa/karışık: `work/peek.jpg`'de yazı ters okunuyorsa `mirror: true`. Yüz merkezi .52'den belirgin farklıysa `face.fy`'yi ayarla.
   - Montaj/karışık: `overview_*.jpg` ve gerekirse `sheets/<id>.jpg` sayfalarına **Read ile bak**. Her klibe `index.json` → `desc` (kısa açıklama + iyi anlar) yaz.
2. **Metin:**
   - **`input/<proje>/senaryo.md` varsa** (/senaryo ile yazılmış): seçilen varyantı oku.
     - Terimleri ve marka adını `whisper_prompt`'a ekle.
     - Transkriptle karşılaştırıp yanlış duyulan terimleri `fixes` ile düzelt. Konuşmacının **söylediği** esas alınır; senaryodan farklı söylediyse altyazı söyleneni yazar.
     - Ekran kancası ve kurgu önerisini başlangıç noktası yap.
   - Transkripti oku (`indeks saniye kelime`). Konuyu ve cümle yapısını çıkar.
   - Belirsiz kelimeyi (düşük olasılık, garip yazım) sese karşı doğrula. Gerekirse ipucusuz Whisper ile ya da MMS hizalama skoruyla adayları karşılaştır.
3. **Kurgu ve kesim:**
   - **Ham uzun kayıt ya da tekrar çekimler varsa** (kurallar.md §3e): `work/takes.md` ve `takes_sheet.jpg`'yi oku. Her fikirden en iyi alımı seç, hikâye sırasını kur ve `edit.keep: [[i0,i1], ...]` yaz (kelime aralıkları, istenen sırada). Ardından `cut` çalıştır ve `voice_cut.wav`'ı ipucusuz Whisper ile metne dökerek akışı doğrula.
   - **Tek ve temiz alımsa:** varsayılan doğal-hızlı kesim yeterlidir. Yarım cümleler `extra_cuts` ile atılır. `src_end` = son kelime + ~0.8 s.
4. **fixes:** yalnızca yazım. **chunks:** 2–4 kelime; `hl` / `red` (en fazla 3) / `brand`. Cümle düzeni korunur.
5. **Kanca** (kurallar.md §2): 2–3 alternatif yaz, en güçlüsünü gerekçesiyle seç. Her iddia videoda söylenmiş olmalı.
6. **B-roll ataması** (montaj/karışık, kurallar.md §3d): `base.clips`. Görüntü söyleneni göstersin; kesimler cümle sınırına düşsün; çekim 1.2–4 s; Ken Burns hareketleri dönüşümlü.
7. **Sahne planı** (yoğunluğa göre: kurallar.md §3 sahne / §3b mikro / §3c karma-temiz): Cümle cümle mod, görsel ve kelime eşlemesini `brief`'e yaz. Formatlar istendiyse 1x1/16x9 için önemli farkları da yaz (ör. 1x1'de kısa çipler).
8. **cues:** kelimeye bağlı yaz. Geçişlerde `off: -0.2`.
9. **audio:**
   - Bölümler mod/bölüm sınırlarıyla aynıdır.
   - Olaylar efekt bütçesine uyar (sahne: 30 s'de 8–10; mikro/karma: 4–6; temiz: 2–4).
   - Girişte müzik kısıktır (`music.gain_ramps`).
10. **Kesimi çalıştır:** `./studyo cut <slug>` (kesim, taban görüntü, yüz takibi). Kare sayısını ve cue'ları kontrol et.

## 3. Paralel üretim (iki alt ajan, aynı mesajda başlat)
- **reels-hareket:** "projects/<slug> için video.js yaz (density: …, formats: …), kurallar.md'ye göre QA, her format için render + safe" görevini ver; brief özetini ve markayı ekle.
- **reels-ses:** "projects/<slug> için sesi üret ve ölçümle doğrula" görevini ver; yoğunluğu ve türü belirt (montajda müzik biraz daha önde).

Cue değişirse `cut` yeniden çalıştırılır. Ses olayları cue'lara bağlıdır; değişiklik olursa ses ajanına haber ver.

## 4. Paket ve bağımsız kontrol
```
./studyo safe <slug> all      # her format: GEÇTİ olmadan teslim YOK
./studyo final <slug> all     # -> output/<slug>/<slug>_<fmt>.mp4
```
`reels-kontrol` ajanını çalıştır (her formatı incelesin; `node comp/render.mjs projects/<slug> fsheet ...`). Bulguları hareket/ses ajanına düzelttir, yeniden render ve final al. En fazla 2 tur yap. Haklı bulmadığın öneriyi gerekçesiyle reddet.

## 5. Teslim
`output/<slug>/notlar.md` dosyasına şunları yaz, kullanıcıya da kısaca söyle:
- Çıktılar (format, süre, kesilen süre)
- Sahne sahne ne olduğu
- Yazım düzeltmeleri ve eklenen yazılar (dürüstlük)
- Bakılması/dinlenmesi gereken yerler

"Şu saniyede şunu değiştir" dendiğinde yalnızca ilgili kısmı değiştir. Gerekirse `cut` → `render` → `audio` → `final` çalıştır.

## Akış sorunları
- **Playwright Chromium bulunamadı:** `comp/render.mjs` içindeki `EXE` yolunu mevcut headless_shell ile eşle.
- **Hizalama modeli SSL hatası verirse:** `SSL_CERT_FILE` studyo.py'de certifi'ye ayarlı. Model `.cache/torch` altında durur.
- **Kare sayısı tutmazsa:** kaynak 30 fps değil demektir; `ffprobe` ile kontrol et. Montajda klipler `start..end` boşluksuz olmalıdır.
- **"MİKRO YER YOK":** o format için elemanı kısalt, süresini kaydır ya da `prefer`/`at` ver.
