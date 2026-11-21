# Stok montaj: seslendirme + stok video + animasyon (kolaj + sinematik)

Kullanıcı yalnızca ses verir (`input/<proje>/ses/`). Görüntü, konuşmayı destekleyen ücretsiz stok videolar ve animasyonla kurulur (`kind: montage`). Hedef, izleyenin "oha, bu ne güzel animasyon" diyeceği bir Reels reklamı. Klasik kütüphane görünümü (lacivert zemin, beyaz kart, çip) bu tarzda kullanılmaz. Onaylı yön **kolaj + sinematik karma**:
- **Omurga sinematik:** tam ekran stok, ortak renk ve film greni, yazı-nesnenin-arkasında, 2.5D derinlik, eşleşen kesim ve içinden geçiş.
- **Kilit anlarda el yapımı kolaj:** kesilmiş çıkartmalar, sarı marker çizimleri, kâğıt dokusu, stop-motion ritmi.

## Stok kaynağı ve kurallar
- **Kaynak:** Pexels (pexels.com/license; kullanmadan önce lisans sayfasını kontrol et). Reklam dahil ticari kullanım ve düzenleme serbest, kaynak göstermek gerekmez.
- **Lisansın yasakları:**
  - Kişiyi olumsuz göstermek.
  - **Kişinin ya da markanın ürünü onayladığını ima etmek.** Stok oyuncu asla "öğrencimiz", "müşterimiz" ya da "kullanıcımız" diye sunulmaz.
  - Değiştirmeden yeniden satmak veya dağıtmak.
- **Ekrana yazılanlar:** Yalnızca seste söylenen şeyler (CLAUDE.md). Stokta görünen marka ve logolar ön plana alınmaz.
- **Müzik:** İndirilmez, koddan üretilir (ses-kurallari.md).
- **Kayıt:** Her klibin kaynağı ve lisansı `input/<proje>/broll/kaynaklar.json`'da durur; `notlar.md`'ye özeti yazılır.

## Araçlar
- `./studyo py - pipeline/stok.py ara input/<proje> "<sorgu 1>" "<sorgu 2>" ... [--yon portrait] [--n 18]`
  - Kullanıcının kendi tarayıcısına dokunmaz; ayrı bir tarayıcı (Playwright) açar, sorguları sırayla yapar, sonra kapatır. Mac'te ve Windows'ta aynı çalışır.
  - Sık aramada site "Bir dakika lütfen" bot doğrulaması çıkarabilir. Çıkarsa kullanıcıdan açılan penceredeki kutuya tıklamasını iste; araç bir süre bekler.
  - Tüm sorguları **tek komutta** ver; ayrı ayrı çok sayıda komut doğrulama riskini artırır.
  - Numaralı kontak sayfası yazar: `broll/stok/arama/<sorgu>.jpg`. Read ile bakıp seç.
- `./studyo py - pipeline/stok.py indir input/<proje> <id> ...`
  - En yüksek kaliteyi `broll/pexels-<id>.mp4` olarak indirir, genelde 2160×3840/4096 dikey 4K.
  - `kaynaklar.json`'a yazar.
  - **Çözünürlüğü çıktıdan oku:** "hd_1080" adlı dosya bazen 720p çıkıyor. 1080'in altındaki klibi kullanma, alternatifine bak.
  - Hızlı yoklama: `curl -sI -L https://www.pexels.com/download/video/<id>/ | grep -i location` (dosya adında uhd/hd yazar).
- `./studyo py - pipeline/klipmaske.py <klip | projects/<slug>/work/face> <çıktı> [--aralik f0-f1] [--mod nesne|kisi]`
  - Ön plan maskesi çıkarır. Mac'te Apple araçları (Vision), Windows'ta ffmpeg/MediaPipe karşılıkları otomatik kullanılır (studyo.py seçer). `nesne` modu kişiyi ya da herhangi bir belirgin nesneyi ayırır.
  - **Tercih edilen kullanım:** `cut`'tan sonra taban kare klasörü + çekimin kare aralığı. Ken Burns dahil olduğundan maske kareyle birebir hizalanır; maskeler taban kare numarasıyla adlanır (`work/masks/<çekim>/maske/NNNN.png`).
  - `kontrol.jpg` dosyası kare, maske ve kesik hali yan yana gösterir.
  - Hız: 720 px'de ~18 kare/s (Mac; Windows'ta makineye göre değişir).
  - Maskeyi şu teknikler kullanır: çıkartma, yazı-nesnenin-arkasında, 2.5D derinlik ve kontur çizgisi.
- `./studyo py - pipeline/iyilestir.py <klip> <çıktı.mp4> [--bas s] [--sure s] [--model video|foto] [--karis 0.25]`: düşük kaliteli müşteri videosunu (WhatsApp/TikTok sıkıştırması, 576x1024) yapay zekâyla büyütür.
  - Araç Real-ESRGAN (ücretsiz, yerel, `.cache/realesrgan`).
  - `video` modeli: animevideov3 x2, ~0.5 s/kare, titremez.
  - `foto` modeli: x4plus, ~6 s/kare; tek kare ve fotoğraf için.
  - Hareket bulanıklığını düzeltmez. Önce klipte elin/nesnenin sabit ve net olduğu pencereyi bul (Laplace varyansı / kare farkı oranı).
  - Sonra yalnız kullanılacak bölümü büyüt.
  - Önce/sonra karşılaştırması kullanıcıya gösterilir.
- **Beyaz ekranlı telefon/dizüstü** (canlı arayüz için en iyi stok):
  - Ekran kare kare eşiklenir: beyaz + düşük doygunluk, en büyük bileşen. Dört köşe x+y / x−y uç noktalarından bulunur (scipy, cv2 yok).
  - Köşeler `work/masks/ekranlar.json`'a yazılır.
  - Arayüz matrix3d homografisiyle oturur. Luma key kullanılır, böylece parmak önde kalır.
- **Animasyon bileşenleri:** `comp/kolaj.js` (`K.*`; plan.json `"libs": ["kolaj"]`). Katalog: plan-ve-sahne.md v14 (taban görüntü `K.plate`'te, maskeli kesit, homografi + luma key, dondur-açıkla, kelime penceresi, kâğıt pano).
- Stoklar genelde 24/25 fps'tir. Motor 30 fps çalışır, bu yüzden prep/cut aşaması dönüştürür. Gerekirse `ffmpeg fps=30` kullan.

## Akış
1. **Ses:** `./studyo prep <slug> input/<proje>` → transkript ve hizalama (montaj türü).
2. **Vuruş planı:** Her cümle için şunları belirle:
   - ne gösterilecek (somut nesne ya da eylem);
   - stok sorgusu (İngilizce, 2-3 alternatif);
   - teknik (aşağıdaki listeden);
   - geçiş.

   Aynı teknik art arda 2 kez kullanılmaz. Her 1-2 saniyede bir görsel olay olur.
3. **Stok:** Her vuruş için 1-2 arama yap. Kontak sayfalarından seç ve indir.
   - Dikey 4K tercih edilir.
   - İçinde metin ya da logo olan, aşırı "stok" duran (gülümseyen ofis grubu) ve konuyla zayıf bağlı klipler seçilmez.
   - Kitleye uymayan klipler seçilmez. Örneğin 45+ kitleye eğitim reklamında çocuk eli kullanılmaz; deftere yazan çocuk eli yerine yetişkin eli seçilir.
   - Tanınan bir kişinin üstüne X ya da olumsuz bir not konmaz (lisans). Olumsuz vurgu kendi çizimimize ya da yalnız ellerin göründüğü bir klibe yapılır.
   - Yönlendirme projeyle aynı olur: dikey projeye dikey klip.
4. **Maske:** Çıkartma, yazı-arkası ve derinlik kullanılacak kliplerde `klipmaske.py` çalıştır, `kontrol.jpg`'e bak. Maske kötüyse başka klip seç.
5. **Plan.json `base.clips`:** kesimler cümle ya da vurgu sınırında, çekimler 1.2-4 s (kurallar.md §3d).
6. **Hareket ajanı** ve **ses ajanı** (SKILL.md §3), sonra güvenli alan denetimi ve kontrol.

## Teknik menüsü (çarpıcı ama okunur; 45+ için de anlaşılır)
| Teknik | Ne | Ne zaman |
|---|---|---|
| Yazı nesnenin arkasında | Dev kelime ekrana gelir, maskelenen kişi/nesne önünde kalır | Kanca, ana kavram |
| Çıkartma kolaj | Nesne/kişi kesilir, beyaz kenar + gölge, kâğıt dokulu zemine stop-motion (12 fps) yapışır | Örnek, liste, "şunlar" |
| Marker çizimi | Sarı el çizimi daire, ok, alt çizgi; hafif titreme (boil) | Videodaki bir ayrıntıyı işaret etmek |
| Kontur çizgisi | Maskenin dış hattı parlayan çizgiyle izlenir | Kişi/nesneyi "seçmek", dönüşüm anı |
| 2.5D derinlik | Ön plan ve arka plan farklı hızda kayar, kamera içinden geçer | Sinematik giriş, duygu anı |
| Eşleşen kesim / içinden geçiş | Bir klipteki daire/ekran sonraki klibin penceresi olur | Konu değişimi, "ve sonra" |
| Kelime penceresi | Dev harflerin içinde video oynar | Marka/kavram vuruşu |
| Dondur-açıkla | Klip donar, renksizleşir, üstüne çizimle not gelir, sonra devam eder | Önemli ayrıntı, "dikkat" |
| Canlı arayüz | Stoktaki ekrana bizim animasyonlu uygulamamız girer | Yazılım, yapay zekâ, ürün |
| Ortak doku | Tüm kliplerde aynı renk ayarı, film greni, hafif vinyet | Her zaman (stok hissini siler) |

Görsel kimlik:
- kâğıt ve gren dokusu;
- kalın, sıkışık başlık fontu;
- sarı marker (`--yellow`), kırık beyaz;
- kırmızı yalnızca risk anında.

Emoji yok. Neon ve parçacık yok (kurallar.md §8).
