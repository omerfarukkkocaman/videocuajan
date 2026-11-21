# Hareket ve tasarım kuralları (stil 2)

Bütün yeni videolar `defineVideo({ style: 2, ... })` ile yapılır. Stil 1 motorun eski varsayılan davranışıdır; yeni videoda kullanılmaz. **Kırmızı çizgiler**:
- güvenli alan
- kafanın kesilmemesi
- sade altyazı
- efekt bütçesi
- güçlü kanca

## 1. Güvenli alan (ZORUNLU, otomatik denetlenir)
Instagram arayüzü ekranın kenarlarını kapatır. Yazılar, kartlar, damgalar, bantlar ve altyazı **her karede** şu kutunun içinde kalır:
- x 70–1010, y 250–1500
- Ayrıca sağ buton sütunu (x > 930, y 1000–1720) boş kalır.

| Bölge | Neden |
|---|---|
| Üst 0–250 | "Reels" başlığı, kamera ikonu |
| Alt 1500–1920 | kullanıcı adı, açıklama, müzik satırı |
| Sağ x > 930, y 1000–1720 | beğen / yorum / paylaş butonları |

- **Denetim:** `./studyo safe <slug>` her kareyi ölçer. 4 kare veya daha uzun süren taşma varsa **KALDI** der ve video teslim edilmez.
- **Girişler** güvenli alanın içinden başlar: yerinde pop, ölçek, fade veya alan içinde kısa kayma. Ekran dışından uçarak gelen eleman olmaz.
- Büyük damga ve döndürülmüş kartlar dönmüş hâlleriyle de sınır içinde kalır. Damga genişliği ≤ 860 px'tir; gerekirse `size` küçültülür.
- **Muafiyetler:** Yüz videosu, lacivert zemin ve son kartın zemini (`data-safe="ignore"`) denetime girmez. Son kartın yazıları ise denetime girer.
- **Diğer formatlar** (`comp/formats.json`; denetim: `./studyo safe <slug> all`):

  | Format | Güvenli kutu | Neden |
  |---|---|---|
  | 9x16 | x 70–1010, y 250–1500, sağ sütun yasak | Reels arayüzü |
  | 1x1 | x 60–1020, y 60–1020 | feed'de arayüz yok; kenar payı |
  | 16x9 | x 96–1824, y 54–960 | %5 başlık güvenli alanı, alt 120 px oynatıcı çubuğu |

- **Ücretli reklam (Instagram/Meta Reels reklamı):** plan.json'a `"yerlesim": "reklam"` yaz. 9x16 denetimi şu kutuya geçer:
  - x 65–1015, y 269–1248 (üst %14, alt %35, yanlar %6);
  - sağ sütun yasağı aynı.

  Sebep: reklamda alttaki ~%35'i reklam açıklaması ve CTA düğmesi kaplar. Organik sınır (y 1500) etiketi, telefonu ve filigranı bu katmanın altında bırakır.
  - 1x1 sınırı değişmez.
  - Kullanıcı "reklam" dediğinde bayrağı baştan koy.
- Mikro elemanların yerleşemediği durumda denetim "MİKRO YER YOK" yazar ve bu da **KALDI** sayılır.

## 2. Kanca (ilk 3 saniye) — videonun en önemli kısmı
İzleyici ilk 1-2 saniyede kalır ya da kaydırır. Ekrandaki kanca metni **konuşmanın kopyası değildir**; konuşmayı destekleyen, düzgün Türkçeyle yazılmış bir başlıktır.
- **Hedef kitleyi doğru adla çağır:** "E-ticaretiniz varsa" ❌ → "E-ticaret siteniz varsa" ✅. Gramer ve terim doğru olmalı (e-ticaret sitesi, mesafeli satış sözleşmesi…).
- **Tek güçlü fikir** taşı; en fazla 6–8 kelime, 2 satır. Şu kalıplardan biri seçilir:
  - kayıp/risk: "Bu 2 belge eksikse ceza riski var"
  - merak boşluğu: "Çoğu site bunu bilmiyor"
  - sayı: "2 belge, 1 tarih"
  - doğrudan uyarı: "Sitende bu yoksa dikkat"
- **Dürüst kalır:** kancadaki her iddia videoda söylenmelidir. Abartı, uydurma rakam ve "%100" gibi ifadeler kullanılmaz.
- **İlk kare (t=0):** kanca metninin ana satırı okunur durumdadır. Animasyon onu bozmaz; kelimeler ilk 0.2 s içinde yerine oturur.
- **Kinetik tipografi:** Başlık kelime kelime kurulur, anahtar kelime (risk, sayı, hedef kitle) renk ve ölçekle çarpar. Anahtar kelime konuşmadaki karşılığına denk gelir. Destekleyici küçük bir görsel eklenebilir (ör. 2 belge ikonu).
- Kanca ekranda 1.5–3 s kalır ve ilk mod değişiminden 0.05 s önce çıkar; yükselen kartla üst üste binmez.

## 3. Video grameri (yoğunluk: `sahne`; diğer yoğunluklar §3b–3d, ad ve tanımlar stiller.md)
Üç görünüm dönüşümlü kullanılır: `full` (tam ekran yüz), `card` (yüz alttaki kartta, üstte grafik), `hidden` (yüz tamamen çıkar, ekran animasyona döner).

| Bölüm | Ne olur |
|---|---|
| Kanca | §2 |
| Hidden sahne(ler) | Videonun omurgası, en güçlü bilgiyi taşır. 35 s'ye kadar en az 1, daha uzun videolarda en az 2 tane. Her biri 4–7 s. Söylenen şey somut nesnelerle görselleştirilir. |
| Kart bölümleri | Tarih → takvim, sayı → sayaç, liste → checklist, süreç → adımlar |
| Aciliyet | Tam ekran yüz, punch-in ve band |
| Marka / çözüm | Kart; adres yazılır, sayfa açılır |
| CTA | Takip kartı veya "detaylar açıklamada" |
| Son kart | Logo, adres, slogan. Markanın brand.json'unda `"end": "loop"` varsa son kart yapılmaz; yerine kancaya dönen döngü kapanışı gelir: `L.freezeFace` ile son kare donar, kanca başlığı ve süsü t=0'daki yerine döner (örnek: `ornekler/kurgu-vitrini/video.js`) |

- **Konuya göre tasarım:** örnek projelerin sahne sırası kopyalanmaz. Aynı mod art arda gelmez; düzen 4–7 s'de bir değişir.
- **Açı çeşitliliği:** her videoda en az 3 görünüm bulunur. Kart, yakın plan ve uzak plan dönüşümlü kullanılır.
- **Büyük yazı vuruşları** videoda 2–3 kez kullanılır (damga, band). Fazlası etkisini kaybettirir.
- **Büyük yazı istisnası:** Damga ve bant gibi büyük yazı vuruşları konuşulan anahtar kelimeyi **büyütür** (ZORUNLU, PARA CEZASI RİSKİ, YÜRÜRLÜKTE). Bu tekrar sayılmaz, vuruşun amacı budur. Yasak olan küçük etiket ve başlıkların altyazıyı aynen tekrarlamasıdır.
- **Tarih:** Takvim ve sayaçlarda videoda söylenmeyen bir yıl veya değer (ör. 2025→2026 dönüşü) gösterilmez.
- **Tekrar yok:** Grafik altyazıyla aynı metni yazmaz. Örneğin altyazı "web sitenizde" derken üst etiket de "WEB SİTENİZDE" yazmaz; grafik bilgiyi **gösterir** ya da tamamlar.

### 3b. Mikro yoğunluk ("Dikkat Noktaları")
- Layout tek mod: `full` (yüz veya klip hep ekranda). Ayrı sahne, damga, bant ve flaş yoktur. Kanca ve son kart vardır.
- Konuşulan anahtar kelimede yüzün yanında küçük bir eleman çıkar:
  - `L.sticker`: ikon + 1-3 kelime
  - `L.keyword`: tek kelime
  - `L.counter`: sayı
  - `L.notif`: bildirim balonu
  - `L.ring`: videodaki bir nesneyi çevreler
  - `L.progress`: üstte ince çizgi
- **Yerleşim otomatiktir** (`M.slot`): güvenli alan içinde, yüz/saç, altyazı ve diğer mikroların dışında. Elle konum gerekirse `at:{x,y}`, yön tercihi için `prefer:['right','left','above','below']` verilir.
- **Ritim:** 4–6 s'de bir mikro olay. Aynı anda en fazla 1 eleman, her biri 0.8–1.6 s görünür. Eleman kelimeyle senkron girer, metni videoda söylenen ya da onun kısaltmasıdır.
- **1x1 karede yüzün yanı dardır:** 1–2 kelimelik kısa çipler kullanılır. Sığmayan eleman otomatik küçülür (en fazla %65'e); yine sığmazsa denetim "MİKRO YER YOK" der ve o format için daha kısa bir eleman seçilir.
- **Ses:** mikro elemanlara efekt konmaz (en fazla 1–2 yumuşak pop). Müzik daha sade tutulur.

### 3c. Karma ve Temiz
- **Karma:** Mikro kuralları geçerlidir, buna ek olarak en güçlü bilgi için **1 adet** 4–7 s'lik `hidden` sahne (+ 1 damga) kullanılır.
- **Temiz (`yok`):** Yalnızca kesim, altyazı ve müzik. Kanca metni ve son kart isteğe bağlıdır (kullanıcıya sorulmadıysa ikisi de olur). Efekt bütçesi en fazla 4 (açılış, son kart).

### 3d. B-roll montaj ve karışık (`kind: montage | mixed`)
- **Tarama:** `prep` klipleri tarar (`work/broll/index.json`, `sheets/`, `overview_*.jpg`). Yönetmen sayfalara bakar ve her klibe `desc` yazar.
- **Atama** (`plan.base.clips`, şema: plan-ve-sahne.md):
  - Görüntü o an söylenen şeyi gösterir ("spor yaparken" → spor klibi).
  - Kesim cümle ya da vurgu sınırına düşer.
  - Çekim 1.2–4 s sürer.
  - Aynı klip 10 s içinde tekrar edilmez; tekrar edilecekse farklı bölümü (`in`) kullanılır.
  - Ken Burns hareketleri (`move`: push-in / pull-out / pan-left / pan-right / static) dönüşümlü seçilir.
  - Çapraz geçiş (`fade`) yalnızca sahne değişiminde kullanılır, en fazla 0.25 s.
- **Montaj:** klipler `start`..`end` boşluksuz döşenir. Klip yetmiyorsa `speed` 0.8–0.9 ile uzatılır ya da aynı klibin başka bölümü kullanılır.
- **Karışık:** ara görüntü yalnızca `full` mod anlarına konur. Toplam sürenin en fazla %40'ı olur, ilk 2 s'de kullanılmaz. Mümkünse jump cut'ların üstüne denk getirilir (kesimi saklar).
- **Yön:** klipler projenin yönündedir (dikey proje → dikey klip). Uyuşmayan klip `prep`'te UYARI verir; kullanılmaz ya da kullanıcıya sorulur.
- **Yüz yok:** stok klipte yüz takibi yapılmaz. Mikro elemanlar üst banda ya da altyazının üstüne yerleşir; klipte önemli bir nesne varsa `at`/`prefer` ile ondan uzak tutulur.

### 3e. Ham uzun kayıt: kurgu (tekrar çekimler, en iyi alım, hikâye sırası)
Kullanıcı çoğu zaman tek bir uzun dikey kayıt verir (1–2 dk). Kayıtta aynı şeyi birkaç kez söyler ("merhaba arkadaşlar" … "selam arkadaşlar"), yarım bırakır, yeniden başlar. Video bu kayıttan **kurgulanır**:
- **TEK ALIM ÖNCELİĞİ (deneyimde doğrulandı):** Farklı alımlardan cümle cümle birleştirilen kurgu akıcılığı bozar. Her alımda duruş, el, ses tonu ve enerji farklıdır; mod geçişleriyle örtülse bile izleyen "kesitleri izliyor" hissine kapılır.
  - Önce kayıtta baştan CTA'ya kadar **tek seferde söylenmiş** bir alım ara. Bunu bulmak için Whisper'ı ipucusuz ve kelime zamanlı olarak alımın tamamında yeniden çalıştır; gizli yarım alımları, uzun duraklamaları ve dil kusurlarını listele.
  - Tek alım varsa onu kullan ve yalnızca küçük düzeltme yap: takılma, yarım başlangıç ya da bozuk tek bir cümle.
  - Alım içindeki doğal duraklamaları kısaltma (`cut.min_cut` büyük, ör. 9.0). Böylece jump cut olmaz.
  - Cümle cümle birleştirme yalnızca tek alım yoksa ve kullanıcı kabul ederse yapılır. O durumda bile aynı oturumdaki, aynı duruştaki ardışık alımlar tercih edilir.
- **Analiz:** `prep` sonunda `work/takes.md` üretilir. Cümleler, fikir grupları (aynı fikrin alımları), her alımın puanı (tamamlanmış mı, dolgu "ııı/şey", takılma, duraksama, Whisper güveni) ve ★ önerisi bulunur. `work/takes_sheet.jpg` her cümlenin orta karesini gösterir (bakış, mimik, kadraj).
- **Her fikirden tek alım** seçilir:
  - Tamamlanmış ve akıcı olan alım tercih edilir.
  - Eşitlikte sonraki alım seçilir (insan doğrusunu tutturana kadar tekrar eder).
  - Bakışın kameradan kaçtığı, güldüğü ya da takıldığı alım seçilmez.
  - ★ yalnızca öneridir; bağlama en iyi oturan alımı yönetmen seçer.
- **Tek giriş:** Birden fazla selamlama ya da kanca alımı varsa yalnızca en güçlüsü kalır, o da başa gelir.
- **Hikâye sırası:** kanca → sorun / bağlam → kanıt / tarih / detay → risk / aciliyet → çözüm (marka) → CTA → kapanış. Kayıttaki sıra bozuksa cümleler yeniden dizilir (`edit.keep` sırası).
- **Bağlantı kontrolü:** "bunlar", "bu yüzden", "ve" gibi önceki cümleye bağlanan ifadelerin öncülü kurguda önce gelmelidir. Örnek: "Ve bunların 1 Ocak'tan itibaren…" alımı ancak "bunlar"ın anlattığı cümleden sonra kullanılır; yoksa "Ve 1 Ocak'tan itibaren…" alımı seçilir.
- **Kesim noktaları:** yalnızca cümle sınırında kesilir, kelimenin ortasında asla. Kenarlarda nefes payı vardır (`cut.edge_pre` .08, `edge_tail` .12, son cümlede `end_tail` .6). Aynı fikrin iki alımı art arda gelmez.
  - Atılan bir kelimeye (dolgu, yarım alım) komşu kenarda pay otomatik kısalır (boşluk − 20 ms). Böylece "işte yani" gibi atılan kelimelerin "iş…ni" kırıntısı içeri sızmaz.
  - Kayıt sonunda konuşmacı kamerayı durdurmak için uzanıyorsa `end_tail`'ı .3'e indir (son karede kol/el görünmesin).
  - Ünlüyle başlayan kelimelerde (Aynı, Öncelikle…) hizalama başı geç kalabilir. Yeni projelerde `cut.pre_vowel: .10` kullan; ünlü atağı kesilmez.
  - **Takılma** ("ü… üçün… üçüncüsü"): Whisper takılmayı kelimenin içine katabilir. MMS ve enerji zarfıyla gerçek başlangıcı bul. `work/transcript.json`'da kelimenin `s` değerini düzelt, sonra `cut.hold` / `cut.pre_word` ile payı ayarla.
  - **Kırıntı:** kesimden sonra kelimenin önünde ya da arkasında küçük ses kalıyorsa `cut.pre_word` / `cut.hold` ile o kelimenin payını küçült. Dolgu kelimeyi ("Yani") atmak hece kırıntısı bırakıyorsa dolguyu geri al; kırıntı, dolgudan daha kötü duyulur.
- **Birden fazla video:** `video/` içinde birden fazla dosya varsa prep onları ad sırasıyla birleştirir (`work/parts/parts.json` = her parçanın başlangıcı). Alımlar parçalara dağılmış olabilir; `edit.keep` parçalar arasında serbestçe dizilir.
- **Doğrulama:** `cut` sonrası `work/voice_cut.wav` ipucusuz Whisper ile tekrar metne dökülür. Kurgulanmış metin baştan sona okunur; anlam akıyor mu, tekrar var mı, cümleler arasında kopukluk var mı kontrol edilir.
  - **Whisper yarım tekrarları gizleyebilir.** "Diğer kişilerin, diğer kişilerin sordu…" gibi bir başlangıcı yazmayıp akıcı bir cümleye çevirebilir.
  - Bu yüzden tutulan kelimelerin süresini de tara: timeline.json words, `e - s > 1.3 s` olanlar. Hizalama bir kelimeyi saniyelerce uzattıysa arkasında gizli bir alım vardır.
  - Kelimenin içinde "konuşma, ≥0.25 s sessizlik, yine konuşma" deseni varsa ses zarfıyla gerçek bitişi bul, `work/transcript.json`'da `e`'yi düzelt; boşluk `min_cut`'ı aşınca kesim kendiliğinden atar.
- **Cümle bağlantısı Türkçe doğru olmalı:** "…fikirlerini hayata geçirmek istiyorsanız, detaylarını açıklamaya bıraktığım formu doldurun" gibi iki parçası ayrı ayrı doğru ama birleşince bozuk akan cümleleri kullanma. Gerekirse cümlenin yarısını al ve başka bir alımın temiz başlayan kuyruğuyla tamamla (örnek: "…istiyorsanız," + ayrı alım "Formu doldurun, eğitimde görüşelim."). Kayıtta tek cümlelik düzgün bir alım varsa soru-cevap biçimli ikiliyi ("X'i nasıl yaparsınız? A'dan Z'ye öğreniyorsunuz.") onunla değiştir. Kancadaki satır kırılımı da anlam sınırına düşer ("Fikir sizden, / yazılım yapay zekâdan").
- **Alımlar arası seviye:** farklı günlerde ya da farklı mesafeden çekilmiş alımlar birleşince konuşma seviyesi 3–5 dB oynayabilir (özellikle kanca alımı kısık kalırsa reklam zayıflar). Parça parça ölç ve `audio.voice.gain` ile eşitle (ses-kurallari.md).
- **İki girişli A/B:** aynı kayıttan iki giriş varsa gövde ve CTA iki videoda aynı alımlardan kurulur, görsel olarak da birebir aynı kod olur. Böylece test yalnızca girişi ölçer.
- **Teslim:** `notlar.md`'de hangi alımların kullanıldığı ve neden atıldığı yazılır (ör. "S1 zayıf kanca, S9 tekrar alım").

## 4. Zamanlama ve hareket
- Her görsel olay bir kelimeye bağlanır (`cues`). Geçişler cümlenin ilk kelimesinden 0.15–0.2 s önce başlar.
- Girişler yay (spring) ile yapılır. Çıkışlar ease-in ile 0.2–0.26 s sürer.
- Bir sahnedeki elemanlar sırayla gelir, aralarında 0.07–0.12 s bırakılır. Aynı anda iki kahraman hareket olmaz.
- **Yay ayarları (zeta / f):**
  - Pop: .5–.62 / 2.4–3.5
  - Kart: .6–.65 / 1.7–2.2
  - Düzen geçişi: .72–.9 / 1.6–2.0
- **Damga:** 2.6x boyuttan 1x'e 0.1 s'de iner, ardından sekme yapar. Sarsıntı 10–16 px, flaş ≤ .45 ve 0.1 s.
- **Flaş:** açılış hariç en fazla 3 tane.
- Yazı ekranda en az (0.3 s × kelime + 0.5 s) kalır. Okunurken hareket etmez.
- **Doğal geçiş (onaylı tercih):** büyük düzen ve kişi değişimleri yaysız (ease, zıplamasız) yapılır.
  - **Kişi kesiti:** tam boy ↔ PIP ↔ yan hareketleri `inOutCubic` ile 0.5–1.0 s sürer.
  - **Oda ↔ stüdyo:** 0.45–0.8 s çapraz geçişle yapılır. Kesit önce yerine oturur, oda sonra gelir ya da gider; çift görüntü olmaz.
  - **Kartlar:** sahne kartları (anket, takip, "sırada") yerinde süzülür (opaklık + ~30 px kayma). Küçükten fırlama ya da başın arkasından uçma yapılmaz.
  - **Süs efektleri:** ışık süpürmesi gibi süsler ve ikinci flaş eklenmez.
  - **Kişinin yeniden girişi:** kişi, ekranı kaplayan içeriğin (site yığını) içinden yükselerek gelmez. İçerik söner, kişi yerinde belirir.
  - Yay yalnızca küçük vurgu elemanlarında (çip, rozet, logo) kalır.
  - **Klasik düzende (full / card / hidden)** `natural: true` aç (plan-ve-sahne.md): kart küçülme/genişleme yaysız, zemin çapraz geçişle, kart yerinde belirir/söner. Gizli sahneden kişiye dönüşte önce içerik söner (sahne `exit`), sonra kişi belirir.
- **Konuşulan soruyu ayrıca yazma:** altyazıda görünen soru ("Sizce hangisi kazandı?") ek bir hap ya da başlık olarak tekrar yazılmaz (ör. ayrıca "Kazanan hangisi?" hapı konmaz).

## 5. Altyazı (stil 2)
- **Cümle düzeni:** BÜYÜK HARF KULLANILMAZ. Yalnızca cümle başı ve özel adlar büyük yazılır (motor transkripti olduğu gibi yazar; `fixes` ile düzelt).
- **Görünüm:** küçük ve sade; Montserrat 800, 58 px (uzun satırda 42 px'e kadar küçülür). Satırın arkasında koyu yarı saydam zemin bulunur, parlak arka planda da okunur.
- **Konum:** blok merkezi y 1395 (iki modda da). En fazla 2 satır, 780 px genişlik (x 150–930).
- **Konuşulan kelime:** sarı renk ve hafif pop (en fazla %8).
- **Vurgu stilleri:**
  - `hl` (sarı): anahtar terim, tarih
  - `red` (açık kırmızı yazı): en fazla 3 aciliyet kelimesi
  - `brand` (açık mavi): marka ve URL
- **Bloklar:** 2–4 kelime, cümle ortasında anlamsız bölünmez.
- **Düzeltme yalnızca yazımda yapılır.** Konuşmacının söylemediği kelime eklenmez.

## 6. Yüz ve kadraj (stil 2, otomatik)
- `cut` aşaması yüz takibi çıkarır (`work/face_track.json`). Mac'te Apple araçları (Vision), Windows'ta ffmpeg/MediaPipe karşılıkları otomatik kullanılır (studyo.py seçer).
- **Saç üstü asla kesilmez:**
  - Kartta saç üstü ile kart kenarı arasında ≥ 46 px, tam ekranda ≥ 40 px boşluk kalır.
  - Kesme gerekirse motor **yakınlaşmak yerine kadrajı kaydırır / uzaklaşır**.
  - Kart dar tutulur (x 120–960, y 780'den aşağı); kafa ve omuzlar görünür.
- Yüz yatayda ortalanır (takipten).
- Yeni videolarda `frameShift: true` kullanılır: kart ↔ tam ekran geçişinde yüz bir karede büyüyüp sıçramaz (motorda varsayılan kapalıdır, yeni videoda aç).
- **Kartta zoom 1.0**'dır. Yakınlaştırma yalnızca punch-in ve jump cut gizleme için kullanılır; motor yine de saçı korur.
- **Aynalama:** `peek.jpg`'de yazı ters okunuyorsa `mirror: true` yapılır. Aynı telefonun ön kamerası daima aynalıdır.
- Ağız ve gözlerin üstüne grafik ya da altyazı gelmez.
- Tam ekranda üst grafikler (takvim vb.) saçın üstüne en fazla birkaç piksel taşar.

## 7. Ses ve efekt (ayrıntı: ses-kurallari.md)
- **Efekt bütçesi:** 30 saniyelik videoda **en fazla 8–10 efekt** olur. Efekt yalnızca **baskın anlarda** kullanılır:
  - açılış
  - kanca vuruşu
  - hidden'a giriş
  - büyük damga(lar)
  - aciliyet bandı
  - marka anı (yazma sesi)
  - son kart
- **Her cümle ya da her küçük eleman (çip, satır, tik, etiket) için ses yoktur.** Cümle bittikten hemen sonra efekt gelmez; konuşmanın akışını bozar. Efekt ya kelimenin üstüne ya da sessiz geçişe düşer.
- Efekt ekrandaki metinle aynı anlamı taşır: damga sesi damgada, yazma sesi yazarken. Belgelerin uçuşu gibi baskın bir görselde yumuşak bir swoosh kullanılabilir.
- **Müzik yapıyı izler:**
  - Kancada enerji
  - Bilgide sakin
  - Uyarı ve aciliyette gerilim ve kırılma
  - Çözümde ferahlama
  - Finalde çözülme

  Konuşmanın altında sade kalır; davul ve hi-hat yoğunluğu konuşmayı bastırmaz.

## 8. Görsel dil ve içerik dürüstlüğü
- **Renkler:**
  - Marka paleti; lacivert zemin ve ince ızgara
  - Sarı: vurgu
  - Kırmızı: aciliyet
  - Yeşil: onay
- **Kartlar:** beyaz, 26–44 px köşe. **Emoji kullanılmaz**, SVG ikon kullanılır.
- **YASAK:**
  - neon/mor gradyan, parlayan küreler, parçacıklar
  - her şeyin fade+slide-up ile gelmesi
  - lineer easing ile hareket
  - okunurken kayan yazı
  - aynı efektin art arda 3 kez kullanılması
  - ekran dışından uçan yazı
- **İçerik dürüstlüğü:**
  - Ekrana yalnızca videoda söylenenler ve markanın kendi sitesindeki ifadeler yazılır.
  - Kurumlar için logo veya arma çizilmez.
  - Takip kartında sahte rozet ve takipçi sayısı olmaz.

## 9. Kontrol döngüsü (teslimden önce hepsi)
1. **Kontak sayfası:** `./studyo sheet <slug> 0.5` → `work/qa/sheet_*.jpg` dosyalarına Read ile bak.
2. **Cue'lar:** `node comp/render.mjs projects/<slug> stills t1,t2,...` ile cue anlarına bak. Geçişleri 12 karelik şeritlerle kontrol et.
3. **Güvenli alan:** `./studyo safe <slug>` → **GEÇTİ** olmalı.
4. **Kontrol listesi:**
   - [ ] İlk kare: kanca metni okunur, hedef kitle doğru adlandırılmış
   - [ ] Saç üstü hiçbir karede kesilmiyor (kart ve tam ekran)
   - [ ] Her eleman kendi kelimesinde geliyor
   - [ ] Altyazı cümle düzeninde, ağza ve grafiğe binmiyor
   - [ ] 3 kareden uzun boş kare yok; son karede altyazı yok
   - [ ] Efekt sayısı bütçe içinde, cümle sonlarına yapışık efekt yok
   - [ ] Türkçe karakterler doğru (İ/ı, ş, ğ)
5. Hatayı frame numarasıyla not et, düzelt ve tekrar ölç. 2–3 tur normaldir.
