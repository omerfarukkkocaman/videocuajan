# Stil kataloğu

Her proje dört seçimle tanımlanır ve seçimler `plan.json`'a yazılır:
- `kind` → video türü
- `density` → animasyon yoğunluğu
- `captions` → altyazı
- `formats` → çıktı formatları

/reels başta bunları sorar (SKILL.md §0). Hepsinde kurallar.md geçerlidir: güvenli alan, kafa kadrajı, efekt bütçesi ve kanca.

## Video türü (`kind`)
| Değer | Ne | Klasör |
|---|---|---|
| `face` — **Konuşan kafa** | Tek kamera çekimi; ses videodan gelir | `video/` |
| `montage` — **B-roll montaj** | Seslendirme + stok/çekim klipleri; görüntü tamamen kliplerden kurulur | `ses/` + `broll/` |
| `mixed` — **Karışık** | Konuşan kafa + belirli anlarda yüzün yerine B-roll (ara görüntü) | `video/` + `broll/` (isteğe bağlı `ses/`) |
| `anim` — **Saf animasyon** | Yüz ve klip yok; kullanıcının seslendirmesi ya da sessiz (yalnız ekran yazısı + müzik). Ayrıntı: [anim.md](anim.md) | `ses/` ya da boş klasör |

## Animasyon yoğunluğu (`density`)
| Değer | Ad | Ne olur | Ne zaman |
|---|---|---|---|
| `sahne` | **Hareketli Anlatım** (motion explainer) | `ornekler/sahne-3format` tarzı: yüz kart / tam ekran / ayrı animasyon sahneleri, kinetik kanca, büyük damgalar, bantlar | Bilgi yoğun, reklam, "öğretici" içerik |
| `mikro` | **Dikkat Noktaları** (micro-motion) | Yüz/klip hep ekranda, sahne değişmez. Konuşulan kelimede yüzün yanında küçük çip, anahtar kelime, sayaç, bildirim balonu çıkar. Kanca ve son kart vardır | Samimi, günlük, vlog, montaj |
| `karma` | **Karma** | Mikro + en güçlü bilgi için 1 adet ayrı tam ekran sahne (`hidden`) | Hikâye + tek vurucu bilgi |
| `yok` | **Temiz** | Kesim + altyazı + müzik. Grafik, damga, geçiş yok; son kart isteğe bağlı | Ham, doğal his; ya da "sadece altyazı" isteği |

Örnekler (`ornekler/<ad>/video.js`):
- Sahne: `ornekler/sahne-3format/video.js` (sahne yoğunluğu, 9x16 + 1x1 + 16x9, `defineVideo(F => …)`)
- Sahne, **editoryal premium** (sakin, az elemanlı; ince çizgi, altın + kırık beyaz, bölüm başlıkları, alt bantlar, sinematik renk; damga/flaş/sarsıntı yok; 40+ / site tanıtımı): `ornekler/editoryal-premium/video.js` (v7 bileşenleri, plan-ve-sahne.md)
- Sahne, **viral Reels** (sayı kancası + cevabı sonda grafikle, 1–2 s'de bir görsel olay, yorum balonunda somut soru, logolu takip kartı, döngü kapanışı): `ornekler/viral-sayi-kancasi/video.js` (v8 bileşenleri)
- Sahne, **meta / kurgu vitrini** (Claude'un kurguladığını gösteren zaman çizelgesi, adım rozetleri, döngü kapanışı): `ornekler/kurgu-vitrini/video.js`
- Sahne, **sakin tempo 45+ reklam, A/B** (iri altyazı, V.capFs / V.transScale, form CTA, 9x16 + 1x1): `ornekler/sakin-tempo-45/video.js`
- Sahne, **derinlik / stüdyo** (kişi maskesi: grafikler konuşmacının arkasından çıkar, oda söner -> stüdyo zemini, kesit PIP'e küçülür / ekrandan fırlar / geri döner; klasik yüz-alta kart düzeni yok): `ornekler/derinlik-studyo/video.js` (v9 bileşenleri, `V.matte`; plan.json `"matte": true`)
  - **Sonuç/karşılaştırma ekranı** (onaylı tasarım):
    - Kişi ekrandan çıkar (fırlama), ekranı sonuçlar kaplar.
    - Siteler masaüstü pencereleri olarak alt alta durur; kazanan/favori en üstte. Konuşma bitene kadar ekranda kalır (~15 s).
    - Ana sayfalar ~1.7 s durur, sonra hızlıca kayar, sonra yavaşça başa döner.
    - Favoriye yalnızca altın çerçeve (`L.frameRing`) ve "… favorisi ★" rozeti verilir; büyütme yok.
    - Altyazı bu aralıkta `V.capAt` ile üst banda alınır, içeriği örtmez.
    - Kişi sonraki CTA'da (anket) geri gelir.
- Sahne, **ok geçişi + dalış** (45+ reklam; uzak çekim 2160x3840'tan kayıpsız yakınlaşma; klasik full/card/hidden + V.matte: grafikler kişinin arkasından, kıvrımlı ok bir noktaya çizilir, sonra ekranın içine dalınır; `L.arrowPath`, `L.dive`, `L.puzzle`, `V.matte.roomZ`): `ornekler/ok-gecis-dalis/video.js`
- Sahne, **öncesi/sonrası güzellik-hizmet reklamı** (yüzsüz montaj, konuşma yok, güzellik / klinik. 'Zarif kart + ipek zemin' sürümü soluk ve küçük bulundu; onaylı dil cesur sosyal: video ilk kareden tam ekran ve canlı renkte, kalın sıkışık beyaz kanca + eğik altın kutu, 'pat' girişleri, beyaz ÖNCESİ -> altın SONRASI kutusu, beyaz-altın lazer taraması, kıyas sürgüsü, çağrıda karartma + logo + IG ve WhatsApp satırları; döngü yok; `comp/premium.js` PR.punch / PR.frameCard bare): `ornekler/oncesi-sonrasi/video.js` (9x16 + 1x1)
- Sahne, **seçki reklamı** (aynı cesur sosyal dilin ikincisi. 8 tasarımlı hızlı ilk sürüm 'izleyen göremiyor' diye beğenilmedi; onaylı sürüm: 'Hangisi senin tarzın?' kancası (müzikteki drop'ta yumuşak nabız, flaş yok), uzun ekranda 4 tasarım (altın kare numara rozeti + /4 + beyaz eğik kutuda ad; satır tasarım başına tırnaklardan uzak yerde, kesim karesinde 'pat'), 'BUNLAR GİBİ DAHA FAZLASI / <MARKA>'DA' + 2x2 kolaj, çağrı müzikteki stop karesinde; `PR.tiles`, `PR.punch`): `ornekler/secki-reklami/video.js` (9x16 reklam alanı + 1x1)
- Mikro, **gerçek müşteri memnuniyeti (testimonial) reklamı** (hazır video, yüz hep ekranda; merak kancası: 'MÜŞTERİMİZ ANLATIYOR' + konu + müşterinin sonradan söyleyeceği söz tırnak içinde; üstte kalıcı marka çubuğu (monogram + '<MARKA> · <ŞEHİR>') + altın ilerleme çizgisi; kontur altyazı göğüs hizasında; vurgu kelimelerinde 1.06 yakınlaşma; saydıklarında onay çipleri; seri çağrısı; cutaway yok): `ornekler/musteri-yorumu/video.js` (9x16 reklam alanı + 1x1)
- Mikro, **emojili + 3D konuşan yüz reklamı** (istek: 'ilgi çekecek; güzel kancayı caption yap; emojili, 3D'li'; işletme sahibinin kendi çekimi, tam ekran: üstte kalıcı kanca başlığı (kalın yazı + altın kutu + emoji), yüzün yanında tek büyük 3D öğe (altın '%95' rozeti / askılı '1000 TL' etiketi / 3D emoji), göğüste kontur altyazı (grafiğin gösterdiği kelime altyazıda çizilmez), küçük logo filigranı, donmuş kare üstünde seri çağrısı; çok çekimli kurguda kesim karesinde yakınlaşma vuruşu; ara görüntülü ve yatarak çekilmiş sürümler de bu dille yapılır): `ornekler/emojili-3d/video.js` (9x16 reklam alanı + 1x1)
- **Ders** (yüzsüz slayt anlatımı / ekran kaydı, 16:9, uzun; kaliteli sade altyazı, konu çipi, sabit notlar, terim kartları, slayttaki öğeye çerçeve + soluklaştırma + fosfor, az ve anlamlı `V.focus` yakınlaşması): `ornekler/ders-yatay/video.js` (`comp/ders.js`, D.* bileşenleri, plan-ve-sahne.md "Ders bileşenleri")
- Sahne, **Kapak reklam dili** (35+, form; konuşmacı %100 tam ekran, kart/gizli sahne yok; kapak başlığı ve dev kelimeler kişinin ARKASINDA, oda kararır/ipeğe döner, sanal çift kamera geniş 1.0 <-> yakın 1.3 anında kesme, kanıt nesneleri cam kartta yanında, sade iri tek satır altyazı, büyük beyaz CTA düğmesi, logo kapanışı): `ornekler/kapak-dili/video.js` (`comp/kapak.js`, KP.* bileşenleri, plan-ve-sahne.md "Kapak bileşenleri"; 9x16 reklam alanı + 1x1)
- Mikro: `ornekler/mikro.js`
- Montaj: `ornekler/montaj.js`

## Altyazı (`captions`)
| Değer | Ne |
|---|---|
| `vurgulu` | Cümle düzeni, koyu zemin. Konuşulan kelime sarı ve hafif pop; `hl`/`red`/`brand` renkleri |
| `sade` | Cümle düzeni, koyu zemin, beyaz. Vurgu, renk ve pop yok; sakin giriş |
| `yok` | Altyazı çizilmez (videoda yazılı metin olmaz; kanca yine olabilir) |

## Formatlar (`formats`)
| Format | Boyut | Kullanım | Yerleşim (dikey kaynak) |
|---|---|---|---|
| `9x16` | 1080×1920 | Reels, TikTok, Shorts | Bugünkü düzen |
| `1x1` | 1080×1080 | Feed, reklam | full = kafa-güvenli kare kırpım; card = yüz sağda, grafik solda |
| `16x9` | 1920×1080 | YouTube, web | full = ortada dikey yüz şeridi + bulanık yan dolgu; card = yüz sağda, grafik solda geniş |

- Yatay **hoş geldin / platform turu** (yeni üyenin ilk videosu): `ornekler/yatay-tanitim/video.js` (`comp/topluluk.js`, TP.* bileşenleri; tanıtım videosunun dili: konuşmacı ~%82 tam ekranda solda, sağda logo kartı / eğitmen kartı / hedef yolu / tarayıcı -> panel; dört kısa tam ekran panel anı toplam ≤ 50 s; menü çekmecesinde kilitli "Yakında" öğeleri; kontrol listesi kapanışı).
- Yatay çekilmiş projede ana format `16x9`'dur, full tam ekran olur. Uzun yatay site tanıtımında onaylı düzen: kart/PIP YOK, yüz videonun büyük kısmında tam ekranda, kadraj `fx` ile sola kayar, animasyonlar SAĞDAKİ boş alanda; kısa gizli anlar (kitle, logo, panel turunun 2-3 anı, fırsat); panel arayüzü sağ pencere <-> tam ekran aynı bileşenin büyüyüp küçülmesi (örnek: `ornekler/yatay-tanitim/video.js`). B-roll yönü her zaman projenin yönüyle aynıdır (dikey projeye dikey, yatay projeye yatay klip).
- Paket: `./studyo package <slug>` → `output/<slug>/<slug>_<format>.mp4` (aynı ses, aynı kurgu).
