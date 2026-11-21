---
name: youtube
description: Yatay 16:9 YouTube videosu üretir. Üç dal var: (1) konuşan kafa / vlog yatay kurgu (yüz tam ekranda, animasyonlar yandaki boş alanda), (2) ders / ekran kaydı / slayt anlatımı (sade altyazı, terim kartları, yakınlaşma, hızlandırma), (3) animasyonlu anlatım (yüz yok; kullanıcının seslendirmesi + sahne sahne animasyon). Bölüm (chapter) listesi, açıklama metni, SRT altyazı ve kapak görseli önerisiyle teslim eder. Kullanıcı "/youtube", "YouTube videosu", "yatay video", "ders videosu", "ekran kaydını kurgula" dediğinde kullan.
argument-hint: "[input/<proje>] [marka] [konuşan|ders|animasyon] [istekler]"
---

# /youtube — Yatay video stüdyosu

Sen bu akışın yönetmenisin. Altyapı `/reels` ile aynıdır: aynı motor, aynı ajanlar (`reels-hareket`, `reels-ses`, `reels-kontrol`), aynı kurallar. Önce şunları oku:
- [../reels/SKILL.md](../reels/SKILL.md): akışın adımları (prep → plan → cut → paralel üretim → safe → final → kontrol)
- [../reels/kurallar.md](../reels/kurallar.md), [../reels/stiller.md](../reels/stiller.md), [../reels/plan-ve-sahne.md](../reels/plan-ve-sahne.md)

Fark: ana format **16x9**, video uzundur (3–30 dk), izleyici daha sabırlıdır ama **ilk 30 saniye** belirleyicidir.

## 0. Dal seç (basla'dan gelmediyse TEK AskUserQuestion)
1. **Konuşan kafa / vlog (yatay çekim)**: Örnek `ornekler/yatay-tanitim` (`libs: ["topluluk"]`, TP.*). Yüz ~%75–85 süre tam ekranda, kadraj `fx` ile bir yana kayar, animasyon **boş tarafta** durur. Kart/PIP yok ya da çok az. Kısa tam ekran anlar (≤ 4 adet, toplam ≤ 50 s) en güçlü bilgiye ayrılır.
2. **Ders / ekran kaydı / slayt**: Örnek `ornekler/ders-yatay` (`libs: ["ders"]`, D.*). Uzun kayıtta `pipeline/ders_kurgu.py` akışı (analiz → kurgu kararı → kur): bekleme, "eee", tekrar ve düzeltmeler kesilir; uzun bekleme/yükleme anları hızlandırılır (rozetle gösterilir). Sade altyazı, konu çipi, terim kartı (her terim ilk geçtiğinde basitçe açıklanır), slayttaki öğeye çerçeve/fosfor, az ve anlamlı `V.focus` yakınlaşması. İngilizce arayüzde Türkçe not. Gizli bilgi (e-posta, kod, şifre, kişisel ad) görünüyorsa **bulanıklaştır**.
3. **Animasyonlu anlatım (yüz yok)**: [../reels/anim.md](../reels/anim.md) → `kind: "anim"`, `--yon h`. Seslendirme kullanıcının kendi sesi (yoksa `/basla`'daki seslendirme yönlendirmesi). Bölüm başına bir görsel dil: başlık kartı → 3–6 sahne → özet kartı.

Yoğunluk sorusu (mikro / sahne / karma / temiz) dal 1 ve 3 için sorulur; dersler varsayılan olarak "sade" altyazı + ders bileşenleriyle yapılır.

## 1. Hazırlık
```
./studyo prep <slug> input/<proje> <marka>                 # dal 1-2 (yatay video otomatik 16x9 olur)
./studyo prep <slug> input/<proje> <marka> --yon h         # dal 3 (seslendirmeli animasyon)
```
Uzun kayıtta hizalama belleğe sığmazsa prep'in yazdığı parçalı yol komutunu uygula (`transcribe_parca.py`).
Birden fazla kayıt (`video/1.mp4, 2.mp4 ...`) ad sırasıyla birleşir.

## 2. YouTube'a özel yönetmenlik
- **Açılış (0–30 s):** Videonun vaadini ilk 10 saniyede söyle/göster. Uzun logo/intro yok. İlk cümlede ekran kancası (kurallar.md §2), ardından "bu videoda neler var" çipleri (3–5 madde, konuşulan sırayla).
- **Bölümler:** Konu değişimlerinde bölüm kartı (başlık + numara). Bölüm başlıkları konuşmadan çıkar, yeni iddia eklenmez.
- **Tempo:** Konuşan kafada 6–12 sn'de bir görsel olay (çip, not, yakınlaşma, B-roll); derste ekranda zaten hareket varsa daha seyrek.
- **Altyazı:** Uzun videoda `sade` önerilir (göz yormaz); kısa ve enerjik videoda `vurgulu`.
- **Kapanış:** Özet kartı (3 madde) + sonraki adım (abone ol / açıklamadaki bağlantı). Döngü kapanışı Reels'e özgüdür, YouTube'da yok.
- **Formatlar:** Ana format `16x9`. Kullanıcı isterse aynı projeden dikey "kısa" kesitler: en güçlü 30–60 sn'lik bölümü ayrı slug ile (`<slug>-kisa`) `/reels` akışından geçir.

## 3. Üretim ve kontrol
`/reels` SKILL.md §3–§4 ile aynıdır: `reels-hareket` + `reels-ses` paralel, sonra `./studyo safe <slug> all` (GEÇTİ olmadan teslim yok), `./studyo final <slug> all`, `reels-kontrol`.
Uzun videoda render uzun sürer (10 dk video ≈ 18 000 kare). Kullanıcıya süreyi önceden söyle, önce kontak sayfasıyla (`./studyo sheet <slug> 2 16x9`) onay al.

## 4. YouTube teslim paketi (`output/<slug>/`)
- `<slug>_16x9.mp4`
- `<slug>.srt`: `./studyo py - pipeline/ders_altyazi.py srt <slug>` (YouTube'a ayrı altyazı olarak yüklenir)
- `youtube.md`: 
  - **Başlık önerileri (3)**: konuşulandan, abartısız
  - **Açıklama**: 2–3 cümle özet + bölümler listesi `00:00 Giriş`, `01:12 ...` (bölüm kartı zamanlarından; ilk bölüm 00:00 olmak zorunda)
  - **Kapak (thumbnail) önerisi**: en güçlü kare zamanı + üstüne yazılacak 2–4 kelime. İstenirse `node comp/render.mjs projects/<slug> stills <t> --fmt 16x9` ile kareyi çıkar, 1280x720'ye ölçekle (`ffmpeg -i kare.png -vf scale=1280:720 kapak.jpg`).
- `notlar.md` (reels SKILL.md §5 ile aynı)
