# plan.json + video.js başvurusu

## plan.json (`projects/<slug>/plan.json`, yönetmen yazar)
```jsonc
{
 "slug": "ornek-01", "source": "input/IMG_1234.MOV", "brand": "ornek", "lang": "tr",
 "whisper_prompt": "Marka adları, özel terimler.",      // Whisper'a ipucu
 "mirror": true,                                         // ön kamera: arka yazı ters ise
 "face": {"fx": 0.5, "fy": 0.52},                        // yüz merkezi (kare oranı)
 "cut": {"tail": 0.10, "pre": 0.06, "min_cut": 0.12, "src_end": 30.1, "src_start": 1.0},
 "extra_cuts": [[12.4, 14.9]],                           // elle: tekrar edilen/bozuk cümle (kaynak saniye)
 "end_card": 1.1333,
 "fixes": {"0": "E-ticaret", "48": "ornek.com", "49": null},  // kelime indeksi -> yazım; null = öncekine kat
 "chunks": [{"w": [0, 1]}, {"w": [4, 5], "st": {"5": "red"}}],  // boşsa otomatik bloklar
 "cues": {
   "wipeIn": {"word": 9, "at": "s", "off": -0.2},       // kelimeye bağlı (tercih edilen)
   "stamp":  {"word": 22},
   "check2": {"cue": "check1", "off": 0.2},             // başka cue'ya göre
   "x":      {"t": 12.3}                                // düz saniye (son çare)
 },                                                      // hazır cue'lar: start, end (video sonu), total
 "brief": "Sahne sahne yaratıcı plan (hareket ajanı için düz metin).",
 "audio": {
   "sections": [{"name": "hook", "start": "start", "end": "wipeIn", "mood": "enerjik"}],
   "events": [{"cue": "stamp", "type": "stamp_impact"}, {"cue": "wipeIn", "type": "whoosh", "dur": 0.25}],
   "music": {}                                           // isteğe bağlı, bkz. ses-kurallari.md
 }
}
```
- Kelime indeksleri `work/transcript.json` sırasıdır (01_timeline çıktısı her kelimeyi `indeks çıkış-saniyesi metin` diye basar).
- Plan değişince `./studyo cut <slug>` (kesim/kelime/cue değiştiyse) veya yalnızca `render` yeterli.
- **Kesim tuzağı:** sessizlik tespiti enerjiyle değil hizalanmış kelime aralarıyla yapılır; "s/ş" sürtünmeli sesleri sessizlik sanılmaz. Kesimi daha sert istersen `tail`/`pre` küçült (min .06/.04), daha doğal istersen büyüt.

## video.js (`projects/<slug>/video.js`, hareket ajanı yazar)
Global'ler: `C` (cue'lar, saniye), `word(i)` → `{s, e, t}`, `BRAND`, `L` (kütüphane), `M` (yardımcılar: clamp, lerp, prog, E easing, spring, shake, css, vis, T, up).
```js
defineVideo({
  style: 2,                                // ZORUNLU (yeni videolar): kafa-güvenli kadraj, sade altyazı, kart x120-960
  frameShift: true,                        // YENİ VİDEOLARDA AÇ: kart genişlerken yüz sıçramaz (önce kaydır, gerekirse yakınlaş)
  headroomCard: 46, headroomFull: 40,      // isteğe bağlı: saç üstü boşluğu (px)
  layout: [ {t: 0, mode: 'full'}, {t: C.wipeIn, mode: 'hidden'}, {t: C.cardUp, mode: 'card', zoom: 1.25},
            {t: C.expand, mode: 'full', zoom: 1.25}, {t: C.shrink, mode: 'card', zoom: 1.25} ],
  punches: [{t: C.onemli, amt: .07, z: .45, f: 3, until: C.wipeIn + .22}],   // yüz punch-in
  shakes:  [{target: 'face', t: C.hemen, d: .3, amp: 10}],
  flashes: [{t: C.stamp, a: .45, d: .1}],
  capY: {full: 1430, card: 1515, hidden: 1380},   // isteğe bağlı (hidden: tam ekran animasyon sahnesinde)
  capFit: true,                            // isteğe bağlı: satırlar 880 px'e dizilir, aktif kelime pop'u komşuya binmez/70..1010 dışına taşmaz
  capFs: 70, capFsMin: 54,                 // isteğe bağlı (stil 2): iri altyazı punto / en küçük punto (F.pick ile formata göre; vars. formats.json cap.fs/fsMin)
  transScale: 1.3,                         // isteğe bağlı: mod geçişleri (küçülme/genişleme, yükseliş, düşüş, silme, dalış) bu kat yavaş (45+ kitle; vars. 1)
  natural: { d: .6, fade: .5, out: .4, dy: 30 },  // isteğe bağlı (YENİ VİDEOLARDA AÇ, onaylı "doğal geçiş" tercihi; true = bu değerler):
                                           // full<->card yaysız inOutCubic (d s); full<->hidden zemin çapraz geçişle belirir/söner (fade s; silme ve dalış yok,
                                           // hidden->full'de 'under' sahneler zeminle birlikte söner); hidden->card kart yerinde belirir (opaklık + dy px, fade s);
                                           // card->hidden kart yerinde söner (out s); altyazı gizlenmez. Verilmezse motor eski davranışında kalır.
                                           // İpucu: hidden->full'de çift görüntü olmasın -> gizli sahneye exit {a: geçiş - .3, b: geçiş + .1} ver (önce içerik söner, sonra kişi belirir)
                                           // QA deneyimi: d .8 (algılanan ~0.6 s); kart küçülürken/büyürken grafik kartın arkasına girmesin (önce söner / kart oturunca gelir)
  jumpEps: 1e-3,                           // isteğe bağlı (YENİ VİDEOLARDA AÇ): timeline kesimleri 4 haneye yukarı yuvarlar (3.2667 > 98/30) -> jump zoom bir kare geç
                                           // devreye girer; eps ile kesim karesinde değişir. Vars. 0 (eski davranış)
  jumpSkip: [3.2667, 33.3333],             // isteğe bağlı: bu kesimlerde jump zoom değişmez (ör. kart küçülme/büyüme sırasındaki kesim: yüz "pompa" gibi büyüyüp küçülmesin;
                                           // sonraki kesimlerin zoom sırası kayar, kontrol et). Tipik: kart<->tam ekran geçiş aralığındaki kesimler
  capMaxLines: 1,                          // isteğe bağlı: altyazı en fazla satır (vars. 2); 1 -> uzun blok kırılmaz, punto capFsMin'e kadar küçülür
  hideCaptions: [[a, b]],                  // isteğe bağlı: altyazının yazıyla çakıştığı an
  capAt: [{ a, b, y: 300, maxLines: 1 }],  // isteğe bağlı: a..b arasında altyazı merkezi y'de (ör. alt kısım içerikle dolu sahnede üst bant);
                                           // sınırları cümle aralarına koy (blok değişince yeni yerde belirir)
  // v7 (editoryal premium, ornekler/editoryal-premium) — hepsi isteğe bağlı, verilmezse davranış birebir aynı:
  faceFilter: 'contrast(1.07) saturate(.86) sepia(.1) brightness(.98)',   // yüz görüntüsüne CSS filtresi (sinematik renk)
  vignette: { edge: .42, top: .66, topH: .34, bottom: .5, bottomH: .3 },  // yüz çerçevesinde vinyet; top/bottom: üst/alt koyu geçiş (yalnız tam ekranda, kartta söner)
  slowPush: { rate: .0045, max: .07 },     // testere itme (6 s'de bir %3.6 geri sıçrar) yerine her tam ekran bölümünde kesintisiz yavaş yakınlaşma; geçişte yumuşakça sıfırlanır
                                           // span: true (v17) -> art arda tam ekran anahtarları (fx kaydırması) tek bölüm sayılır, itme sıfırlanmaz
  // v17 (yatay kaynak 16x9, yan sahne; ornekler/yatay-tanitim) — layout anahtarında isteğe bağlı; hiçbir anahtarda fx yoksa motor birebir eski:
  //   {t, mode: 'full', zoom: 1.2, fx: .36, d: .9}: tam ekranda yüz merkezi ekranın %36'sına kayar (yanda grafiklere geniş alan; zoom ver ki
  //   kenar boş kalmasın, kadraj clamp'le korunur, saç payı aynı). d: zoom/fx geçişi yaysız inOutCubic d sn (vars. eski yay). Art arda iki 'full'
  //   anahtarı = kadraj kaydırma (zemin görünmez); gizliden çıkışta fx animasyonsuz. Kaydırma sırasındaki kesimleri jumpSkip'e ekle.
  capColors: { hl: '#D9B56E' },            // sade altyazıda o stildeki kelimeler sabit renk (okunurken değişmez)
  cardRing: { w: 2, color: '#C9A45C' }, cardR: 22,   // kart çerçevesi (vars. 6 px beyaz halka) ve köşe yarıçapı (vars. 44)
  card: { x: 170, w: 740, h: 1060, corners: 'all' },  // isteğe bağlı (v12): kart dikdörtgeni (format profilinin üstüne yazılır). Çok yakın selfie'de
                                           // dar kart yüzü küçültür (yüz ölçeği = kart genişliği) -> ağız altyazının üstünde kalır. h <= headroomCard + (1 - saç) * w * 16/9
                                           // olsun (yoksa frameShift kadrajı aşağı iter); kart altı IG arayüzünün altında kalır
  fonts: ['300 40px Mont', '600 40px MontI'],         // ek yazı yüzlerini render öncesi yükle (ince ağırlık, italik 'MontI')
  introZoom: true, introFlash: true,
  frameShift: true,                        // isteğe bağlı (yeni videolar): kart<->tam ekran geçişinde yüz sıçramasın — altta boşluk
                                           // kalınca motor önce kadrajı kaydırır, saçı kesecekse yakınlaşır (vars. kapalı: eski davranış)
  // v9 (derinlik / stüdyo, ornekler/derinlik-studyo) — isteğe bağlı; verilmezse motor birebir aynı. plan.matte: true -> cut aşaması work/matte/NNNN.png üretir:
  matte: {                                  // kişi katmanı: yüz karesinin maskeyle kesilmiş kopyası, yüzle AYNI geometri (zoom, kadraj, punch, jump)
    hold: true,                             // video bitince son kare (oda + kesit) kalır (döngü kapanışı; vars. yüz END+.45'te gizlenir)
                                            // hold: {t, frame} -> t'den sonra kaynak karesi 'frame' (1 tabanlı; yüz + kesit + takip): frame 1 -> son kare = ilk kare
    choke: .3,                              // maske kenarını içeri çeker (alfa < choke -> 0): saç çevresindeki açık oda halesi kesilir
    room: [{ t, v: 0, d: .4 }, { t, v: 1 }],// oda görünürlüğü (1 gerçek oda, 0 stüdyo zemini #studio; ease: E adı)
    moves: [{ t, x, y, s, r, o, feather: { l, r, t, b }, ease: 'spring' | 'inCubic' | ..., zeta, f, d, blur: true }],
                                            // kesit dönüşümleri (origin vars. alt orta): tam boy, PIP (kutusuz, feather ile kare kenarı yumuşar),
                                            // fırlama (blur: yönlü hareket bulanıklığı), d: 0 -> anında konum (geri dönüş için ekran dışına koyma)
                                            // feather artarken önden, azalırken geriden gelir: PIP <-> tam boyda kare kenarı ekrandayken hep yumuşak
    origin, ref, z: 5, studio: 'CSS arka plan', dir: 'work/matte/', blurK: .45,
    roomZ: 4,                               // v13 (isteğe bağlı): klasik düzende (card/hidden da var) ilk karttan SONRA tam ekranda oda bu z'de -> 'behind' sahneler
                                            // (z 4) odanın üstünde, kişinin arkasında kalır (vars. 5: ilk karttan sonra 'behind' görünmez). Örnek: ornekler/ok-gecis-dalis
                                            // İpucu (V.natural ile): kart bölümlerinde kişi katmanını kapat (moves {t, d: 0, o: 0}), derinlik anında aç (o: 1);
                                            // oda ile aynı piksel olduğu için açılıp kapanması görünmez. Motor V.natural'ın kart opaklığını (fo) oda ve kişiyle çarpar.
  },
  scenes: [ ...sahneler ],
});
```
- **Derinlik z-sırası (V.matte):** oda (#faceWrap) / stüdyo (#studio) -> `L.scene({layer: 'behind'})` (z 4, kişinin ARKASINDA) -> kişi (z 5) -> `layer: 'front'` (z 6) -> altyazı (8) -> flaş (10). Kişi katmanı ve stüdyo sahne değildir, güvenli alan denetimine girmez; arkadaki tam ekran site/zemin görselleri `data-safe=ignore` taşır (bileşen içinde).
- **Maske deliği (`plan.matte_fill`, 03b_matte.py):** Vision, gövdenin önündeki elin parmak halkasını ve yaka mikrofonunu yarı saydam (alfa ~.4–.8) çıkarabilir; oda kararınca ya da ipek/stüdyo zemininde oradan zemin sızar. `"matte_fill": 0.006` → siluet (alfa > 64) içindeki kapalı delikler (alan < 0.006 × kare) doldurulur ve siluetin kenardan `matte_fill_edge` px (vars. 6) içerisi tam opak yapılır (yalnız yükseltir; dış kenar yumuşaklığı ve büyük gerçek boşluklar korunur). Maskeyi yeniden üretmek için: `./studyo py <slug> pipeline/03b_matte.py` (cut'a dokunmaz). Verilmezse çıktı birebir aynı.
- **Kesit kuralları:** saç kesilmez (geometri motordan); PIP'te yüz altyazının (y ~1340) üstünde ve sağ buton sütununun solunda kalır; s < 1 iken kare kenarı ekrana girer -> `feather` ver. Fırlama/geri dönüş 'uçan eleman' yasağının tek istisnasıdır (kişi kendisi çıkar). Oda geri gelirken kesit önce yerine otursun (çift görüntü olmasın).
Mod geçişleri otomatiktir: full→hidden çapraz lacivert silme + dalış · hidden→card alttan yükseliş · full↔card küçülme/genişleme · hidden→full silme geri açılır (zeminin üstündeki `under` sahneler de aynı çizgiyle silinir, ayrıca `exit` gerekmez) · card→hidden kart aşağı düşer (yüz düşerken üstte kalır, altyazı kart çıkana kadar ~0.34 s gizlenir).
- **Tuzak:** zaman parametresinin varsayılanı `Infinity` ise `prog(t, out-.2, out)` NaN verir; NaN stil yok sayılır ve önceki kare değeri kalır (kare saflığı bozulur). Yeni bileşende `isFinite(out)` ile koru.

### Sahne
`L.scene({id, from, to, under, z, layer, exit: {a, b, dy}, shake: {t, d, amp, seed}, parts: [...]})`
- `layer` (V.matte ile): `'behind'` -> kişi kesitinin arkasında (z 4), `'front'` -> önünde (z 6). Verilmezse eski davranış.
- `under: true` → yüz kartının ALTINDA, zeminin üstünde (üst grafikler, hidden sahneler). Varsayılan: yüzün üstünde (z 6).
- `exit` → a..b arasında yukarı kayıp söner. Kart genişlerken üst grafik için `{a: C.expand - .05, b: C.expand + .2, dy: 80}`.

### Kütüphane (`comp/library.js`) — tüm zamanlar parametre
| Bileşen | Ne yapar | Ana parametreler |
|---|---|---|
| `L.hook` (sahne) | çip + 2 satır başlık, vurgu kelimesi kırmızı kutuyla çarpar | `chip, lines:[[..],[..]], emph:{word, t}, out, pre, stagger, size, deco:{after, html, t}, box:{x,y,w,titleTop}, chipSize, chipAt:{x,y}` (stil 2: `pre: .4` → t=0'da okunur; `chipAt`: çip başlıktan ayrı, ör. 16x9'da yüz şeridinin öbür yanı) |
| `L.label` | üst başlık satırı (span = mavi) | `html, top, t, move:{a,b,dy}` |
| `L.storeBrowser` | e-ticaret sitesi penceresi, ürünler, alt bağlantılar parlar | `url, store, x,y,w,h, t, links:[{text,t}], move, products` |
| `L.doc` | belge kartı fırlar ve döner | `title, label, kind:'lines'|'form', t, from:{x,y}, to:{x,y,rot}` |
| `L.stamp` | damga çarpması | `text, t, x, y, rot, color, size` |
| `L.calendar` | takvim yaprağı, yıl hanesi döner | `day, month, yearPrefix, rollFrom, rollTo, x, y, t, tMonth, tRoll` |
| `L.tags` | etiket yığını (stamp:true çarpar) | `x, items:[{text, icon, style, t, top, stamp, stampFrom}]` (`stampFrom`: damga giriş ölçeği, vars. 1.9; dar alanda küçült) |
| `L.banner` (sahne) | kırmızı aciliyet bandı | `text, icon:'clock'|'alert', t, out, color, inPlace, top, inset, box:{x,y,w,h}, size` (stil 2: `inPlace: true`, ekran dışından kaymaz) |
| `L.typeBrowser` | adres yazılır → sayfa: logo + tikli satırlar + hap | `url, x,y,w,h, tIn, typeAt, enter, outAt, rows:[{text, check}], pill:{text,t}, enterDy, fs:{url, inset, row, rowH, logo, logoGap, pill, pad}` (stil 2: `enterDy: 0`; `fs`: dar sütun ölçüleri, ör. 1x1 kartta w 500) |
| `L.followCard` | takip kartı, el dokunur | `name, sub, avatar, x, y, w, h, tIn, tap` (`w < 800`: dar kart, buton ve el buton merkezine göre; ör. 1x1 sol sütunda w 620 + .8 ölçek) |
| `L.endCard` (sahne) | daire açılır, logo + adres + slogan | `t, at:{x,y}` |
| `L.group` | içindeki parçaları birlikte taşır/ölçekler (ör. tarayıcı küçülüp üste çekilir) | `parts, start:{x,y,s,r}, moves:[{a,b,x,y,s,r}], origin` |
| `L.notice` | resmi düzenleme belgesi yukarıdan iner, satırlar çizilir, bir satır fosforlanır | `title, icon, x,y,w,h, t, lines, mark:{line,t}, enterDy` |
| `L.checklist` | kontrol listesi kartı; satır kendi anında yazılır, x/tik damga gibi çarpar | `title, x,y,w, rowH, t, items:[{text, t, mark:'x'|'check', tMark}], placeholder, textSize, wrap` (`wrap: true`: uzun satır dar sütunda iki satıra kırılır) |
| `L.badge` | yuvarlak rozet/hap; pop, isteğe bağlı ikon dönüşü ve küçülerek çıkış | `icon, text, x,y, t, style, size, spin, iconScale, out` |
| `L.pointer` | kelimeleri konuşuldukça koyulaşan hap + zıplayan ok ("DETAYLAR AÇIKLAMADA" ↓) | `words:[{text,t}], t, y, dir, side:'right'|'below', out, size` |
| `L.bigType` | büyük tipografi (ör. yıl '2026'): karakterler `tGhost`'ta kontur, `t`'de sırayla dolarak çarpar (sayaç değil, söylenmeyen değer göstermez) | `text, x (merkez), y (üst), size, t, tGhost, stagger, color, accent:{i:[..],color}, out` |
| `L.siteGrid` | "her web sitesi": bir mağaza penceresi açılır, `tMulti`'de küçülüp ızgara hücresine geçer, çevresinde başka siteler belirir (yazısız) | `x,y,w,h, cols, rows, hero, heroW, t, tMulti, out, gap, themes` (9x16'da alanı y ≤ ~975 tut: sağ alt buton sütunu) |
| `L.paper` | belge kâğıdı: yerinde pop, köşe numarası, başlık kendi anında soldan yazılır; kopya yelpazesi / sararma (eski) / X-tik damgası / alt hap | `x,y,w,h, rot, t, num, title, tTitle, lines, copyAt, ageAt, mark:{t,kind:'x'|'check'}, tag:{text,t,style,size}, out` (ölçüler w'ye göre) |
| `L.shield` | kalkan rozeti (taraflar / koruma: Tüketici, Satıcı); `tPulse`'ta halka yayılır, yeşil tik | `x,y (merkez), size, icon, label, t, tPulse, color, out` (halka ~1.75×size çapına açılır) |
| `L.bubble` | konuşma balonu (alıntı / itiraz); `strike`'ta metnin üstü kırmızı çizilir, balon solar, köşesine X çarpar | `text, x,y (sol-üst), size, t, tail:{side:'bottom'|'top', at}, quote, strike:{t}, out` |
| `L.figure` | büyük tutar kartı ('3.973 TL'): damga gibi çarpar, altında açıklama hapı; `count` verilirse sayar | `value | count:{from,to,dur,decimals}, unit, label, t, tLabel, x,y (merkez), size, rot, color, out` |
| `L.gauge` | risk göstergesi: yeşil→sarı→kırmızı kadran, ibre girişte `from`'a tırmanır, `tMove`'da `to`'ya yay ile döner | `x,y (pivot), r, from, to (0 sol/düşük..1 sağ/yüksek), t, tMove, label, out` |
| `L.headline` (sahne) | kinetik kanca başlığı (çipsiz): tüm satırlar t=0'da okunur; vurgu satırı baştan yerinde (beyaz), `hit.t`'de renge döner ve ölçekle çarpar; `t` ile sonradan da kurulur (kapanışta kancaya dönüş → döngü) | `lines, sizes:[..], top, cx, gap, pre, stagger, hit:{line, t, color, from}, out, id, t, enter:{s, dy}` (`pre: .4` → t=0'da okunur; kapanışta `id: 'outro', pre: 0, enter: {s: 1.12, dy: -14}` üst sınırı aşmaz) |
| `L.editTimeline` | kurgu zaman çizelgesi süsü (yazısız): koyu panel, cetvel, renkli klip blokları + ses dalgası, kayan oynatma imleci; `done`'da parlayıp sekerek durur | `x,y,w,h, t, tracks, seed (aynı tohum = aynı kurgu), play:{a,b,from,to}, done, out` (imleç panelin 8 px üstüne taşar; `t: -1` → t=0'da hazır) |
| `L.codeWindow` | kod editörü penceresi (yazısız): satır numaraları, renkli soyut kod satırları parça parça yazılır, imleç | `x,y,w,h, t, lines, typeA, typeB, seed, out` |
| `L.flow` | akış şeması / pipeline: düğümler (ikon ya da kısa yazı + etiket) oklarla bağlanır, kelimesinde yanar (halka, tik, `spin`/`lift`), üzerinden jeton akar | `nodes:[{x,y,icon|text,label,tLabel,t,ghost,on,color,ink,check,size,shape:'round'|'circle'|'hex',anim}], links:[{from,to,t,dur,curve}], tokens:[{a,b,path}], size, labelSize, color, out` (bağlantı SVG'si yalnızca çizimi kapsar) |
| `L.agent` | ajan figürü (subagent / uzman): robot silüeti, ara sıra göz kırpar; `grow.t`'de küçükten büyür; göğsüne ikon rozeti çarpar | `x,y (merkez), size, t, color, grow:{t,from}, badge:{icon,t}, label:{text,t}, out` |
| `L.building` | bina: kesik çizgili taslak, temel blokları tek tek oturur, `done`'da yeşil tik, katlar alttan yükselir | `x (merkez), y (zemin), cols, bw, bh, gap, floorH, ghost, base:[t..], floors:[t..], done:{t}, out` |
| `L.chips` | çip listesi: dikey yığın; her çip (ikon dairesi + kısa etiket) kendi anında pop'lar; `ghost`'ta kesik çizgili boş yerler; tik zamanında ikon yeşil tike döner | `x,y, anchor:'left'|'center', items:[{text,icon,t,check}], size, gap, ghost, ghostW, check:{t,stagger}, iconBg, out` (pop sağa ~%10 taşar; sağ kenarda pay bırak) |
| `L.folder` | klasör / boş çalışma alanı: sekmede etiket (soldan yazılır), içinde kesik çizgili boş yerler, köşede adım numarası | `x,y,w,h, t, label, tLabel, num:{text,t}, slots:[sütun,satır], out` |
| `L.typingBubble` | "yazıyor…" balonu (yorum bekleniyor): pop, üç nokta sırayla zıplar | `x,y, size, t, tail:'left'|'right', out` |
| `L.stepNum` | adım numarası (1, 2, 3…): sarı daire; konuşmadaki sıra kelimesinde ('Öncelikle', 'Ve sonrasında'…) aynı yerde pop | `x,y (merkez), size, text, t, out` |
| `L.touch` | dokunma göstergesi (dikey telefon; fare imleci yerine): parmak ucu dairesi belirir, basar, halka yayılır | `x,y, size, t` (takip kartında: `.c-follow .hand` video.css'te gizlenir) |
| `L.freezeFace` | son kart yerine: yüz videosunun son karesi motorun kadrajıyla aynı yerde donar (motor yüzü video sonundan ~0.45 s sonra gizler); hafif kararma + bulanıklık | `t (C.end), dim, blur, dur, frame` (`L.scene({z: 5, from: C.end, ...})`; `data-safe=ignore`) |
| `L.monogram` | logosuz marka için baş harf rozeti (halkalı daire) | `x,y (merkez), size, text, t, out` (son kartta: `L.scene({z: 9, from: C.end, ...})` endCard'dan sonra) |
| **v6: sakin tempo (45+ kitle)** | yumuşak yaylar, sarsıntısız vurgu, `E.inCubic` çıkışlar (`ornekler/sakin-tempo-45`) | |
| `L.softScene` (sahne) | `L.scene` ile aynı, çıkış yumuşak (`inCubic`: yavaşça söner/kayar; `L.scene`'in inExpo çıkışı son karelerde birden kaybolur) | `L.scene` alanları + `exit:{a,b,dy}` (shake yok) |
| `L.softHook` (sahne) | sakin kanca: çip + satırlar t0'da tamamen yerinde (ilk kare = son hâl, döngü); vurgu satırı `hit.t`'de yumuşakça renge döner, hafifçe büyür (sarsıntı/eğim yok) | `chip, chipSize, chipGap, lines, sizes, top, cx, gap, hit:{line,t,color(hex),grow,pulse,dur,off,offDur}, pre (.8), stagger, enter:{s,dy}, out, outDur, id, t` (kapanış: `id:'outro', t: END+.12, pre: 0, enter:{s:1.06, dy:-14}, hit:{grow:1, off: TOTAL-.38}` → aynı yer/boyut; `off`: vurgu sonda beyaza döner, son kare = ilk kare) |
| `L.device` | yazısız cihaz penceresi: `'browser'` site, `'phone'` mobil uygulama, `'window'` masaüstü programı (grafik çubukları), `'video'` ders/oynatıcı kartı (oynat düğmesi, ilerleme çubuğu); iskelet blokları sırayla kurulur | `kind, x,y,w,h, t, build:{a,b}, accent (hex), check (t: köşede yeşil tik), lit (t: sarı halka), play:{a,b}, out, rot` (tik/halka kenardan ~30 px taşar: güvenli alana pay bırak) |
| `L.avatar` | marka logosu tam daire (object-fit cover, kırpılmadan sığan kare logo), beyaz halka, yerinde pop | `src (vars. BRAND.logo.avatar), x,y (merkez), size, ring, t, out` |
| `L.stairs` | merdiven ("sıfırdan, adım adım"): basamaklar soldan yükselir, numaralar alt hizada, `lit` anlarında sırayla sarıya yanar; en alt basamağın üstünde etiket hapı | `x (sol), y (zemin), w, h, steps, gap, t, lit:[t..], label:{text, icon, t, size}, out` |
| `L.softStamp` | yumuşak damga: `L.stamp` görünümü, büyükten yay ile süzülerek oturur (çarpma/sarsıntı yok) | `text, t, x,y (merkez), rot, color (çerçeve), ink (yazı), size, from (1.35), out` (genişlik ≤ 860) |
| `L.formCard` | reklam formu CTA'sı: yazısız form kartı (alanlar + gönder düğmesi), altında kısa etiket hapı, altında sarı daire içinde aşağı ok `arrow.t`'de n kez nazikçe zıplar | `x,y, w (h = 1.1w), t, fields, label:{text,t,size}, arrow:{in (giriş), t (zıplama), n, per, size}, accent, out` |
| `L.verdictList` | hüküm listesi: satırlar (ikon + kısa etiket) kendi anında gelir; `verdict.t`'de her satıra sırayla renkli hüküm hapı ('Gerek yok') oturur | `x,y, w, size, gap, rows:[{icon,text,t}], verdict:{text, icon, style, t, stagger, size, at:'right'|'below'|'corner'}, out` (`'below'`: dar sütun, 1x1; `gap` ≥ hap yüksekliği) |
| `L.holdFace` | yüzü belirli bir anda dondurur (görüntü + kadraj): kayıt sonunda konuşmacı başını çevirirse son iyi kareyi tutar (`freezeFace` canlı kadrajı kopyalar, takip kayarsa donmuş kare kayar) | `at (dondurulan an), t (kararma başlangıcı, ör. C.end), dim, blur, dur, undo:{t,dur}` (`undo`: son ~0.3 s'de kararma kalkar → döngü; `L.scene({id:'freeze', from: at, z: 5, ...})`) |
| **v7: editoryal premium** | ince çizgiler, altın (`--gold`), kırık beyaz (`--ivory`), bol boşluk; girişler fade + kısa kayma ya da çizgi çizimi (.5-.8 s ease-out), `out` = çıkışın bittiği an (.4 s); damga/flaş/sarsıntı yok (`ornekler/editoryal-premium`). İnce çizgi ikonlar `L.IL` (hotel, ledger, pitch, bulb, gear, trend, docs, clock, check, user, arrowDown, arrowRight, chevL, chevR), `L.ilSvg(ad, boyut, renk, px)`; italik yazı ailesi `MontI` | |
| `L.coverHook` (sahne) | dergi kapağı kanca: üst etiket (altın, iki yanında çizgi) + ince başlık satırları t=0'da okunur; `answer.t`'de etiket söner, soru `lift` px kalkıp `scale`'e küçülür, altında altın çizgi ortadan çizilir, cevap (italik, altın) belirir | `kicker, kickerSize, lines:['..','..'], sizes, top, cx, gap, pre, answer:{text, t, y, size, line, lift, scale, out}, out` |
| `L.chapter` | bölüm başlığı: '01' (altın) + çizgi çizilir + 'BAŞLIK' (geniş aralık); `stack: true` → gizli sahnede ortada bölüm açılışı (büyük ince numara üstte) | `num, title, x, y, size, t, out, line, upper, stack` (stack'te x = merkez) |
| `L.lowerThird` | alt bant: daire (logo avatarı ya da numara, ince altın halka çizilir) + isim + altın çizgi + alt satır; yazısız → yalnız logo imzası | `x, y, size, avatar \| num, name, sub, t, nameT, subT, nameSize, subSize, plate (koyu plaka), out` |
| `L.pill` | ince altın çerçeveli hap (kırık beyaz yazı) | `text, x, y, size, t, out, anchor, icon (IL)` |
| `L.stepChart` | sıfırdan adım adım çizgi grafik: taban çizgisi, büyük ince '0', basamaklar `lit` anlarında altınla çizilir | `x, y, w, h, steps, t, zero:{t, text, size}, lit:[t..], out` |
| `L.romanList` | Romen rakamlı liste: rakam + ince çizgi ikon (çizilir) + metin + ayırıcı; `check.t`'de sırayla ince altın halka + tik | `x, y, w, rowH, size, items:[{num, icon, text, t}], check:{t, stagger}, out` (satır genişliği ~ 1.6em + 1.45em ikon + metin + 1.25em tik) |
| `L.lineDevice` | koyu tema çizgi cihaz maketi (yazısız): çerçeve çizilir, iskelet blokları belirir | `kind:'browser'\|'phone', x, y, w, h, t, build:{a,b}, out` |
| `L.cutStrip` | GERÇEK kurgu şeridi ("bu video"): kesimler = klip blokları (içinde önceden üretilmiş küçük resim şeridi), gerçek ses dalgası görseli; imleç baştan `play.to`'ya kayar, sonra gerçek zamanı izler, altındaki klip altınla yanar | `x, y, w, cuts:[0,...kesimler,süre], strip, wave (proje yolu), vh, ah, t, build, play:{a,b,to}, follow, label:{text,t}, out` (küçük resim şeridi ve dalga görseli kesimlerden önceden üretilir; kullanım: `ornekler/editoryal-premium/video.js`) |
| `L.calendarGrid` | rezervasyon takvimi (yazısız): ızgara çizilir, dolu günler (altın/kırık beyaz şeritler) sırayla oturur | `x, y, w, h, cols, rows, t, bookings:[{r, c0, c1, t, tone}], out` |
| `L.pitch` | saha (üstten, ince çizgiler) sırayla çizilir; `ghost` → önce soluk kesik dış çerçeve | `x, y, w, t, dur, ghost, out` |
| `L.payCard` | ödeme kartı (yazısız) + köşede altın halka/tik | `x, y, w, t, tick, out` |
| `L.slotGrid` | randevu ızgarası: saat ikonu + dilim hapları, `fill` hücreleri sırayla altınla dolar | `x, y, w, h, cols, rows, t, fillT, fill:[[r,c]..], stagger, out` |
| `L.avatarField` | kalabalık (sayısız): küçük daire avatarlar tohumlu sırayla dolar, `lit`'te soldan sağa altın parıltı | `x, y, cols, rows, size, gap, t, fill:{a,b}, lit:{a,b}, seed, out` |
| `L.route` | yükselen rota: altın çizgi noktalardan geçerek çizilir, noktalar ulaşınca belirir, `glow`'da son nokta parlar | `x, y, w, h, pts:[[u,v]..], t, draw:{a,b}, glow, out` |
| `L.iconRow` | ince çizgi ikon dizisi (yazısız), ikonlar sırayla çizilir | `x (merkez), y, icons:[..], size, gap, t, stagger, color, out` |
| `L.iconFlow` | küçük dönüşüm kartı: A ikonu → ok → B ikonu (ör. belge yığını → dişli), B yavaş döner | `x, y, w, h, from, to, dir:'down'\|'right', t, tArrow, tTo, spin, out` |
| `L.logoClose` | logo kapanışı: kare koyu zemine kararır, ortada logo avatarı, ince altın halka çizilir (kullanıcı adı/döngü yok) | `t, dur, logoT, x, y, size, src` (`L.scene({z: 7, from: C.end - .2, ...})`) |
| **v8: viral sahne** | yazılım/pazarlama anlatımı, döngü kapanışı (`ornekler/viral-sayi-kancasi`). Yalnızca yeni adlar; mevcut bileşenler aynı | |
| `L.donut` | halka / pasta grafiği: boş halka çizilir, dilimler kendi anında saat yönünde dolar, ortadaki değer damga gibi çarpar; halka üstünde işaret ('?'); `lit`'te dış halka nabzı. Dilim yüzdesi yazılmaz (yalnız söylenen değer `center.text`) | `x,y (merkez), r, w, t, dur, track, gap, segs:[{a,b (0..1 tepeden saat yönü),color,t,dur,ghost (t: kesik çizgili dilim gölgesi)}], marks:[{text,at,t,out,size,color}], center:{text,t,size,color,from,count:{from,to,dur,prefix,suffix} (söylenen değere sayar)}, lit, out` (svg kutusu 2·(r+w/2+24); kartta `L.group` ile küçült) |
| `L.legend` | grafik lejantı: renkli nokta + kısa etiket hapları, her satır kendi anında pop (soldan büyür) | `x,y (sol-üst), items:[{text,color,t,out}], size, gap, out` (genişlik ~ .6·size·harf + 2.2·size; sağ kenarda pay) |
| `L.videoWall` | "onlarca video" (sayısız): tek dikey video karosu (hero) oynar; `tMulti`'de küçülüp hücresine geçer, diğer karolar dışa doğru hızla çoğalır; `people` gruplarında karolara içerik üretici silüeti + çerçeve rengi | `x,y,w,h, cols, rows, gap, t, hero, heroW, heroPlay (t: tek karo nefes alır, oynat nabız), tMulti, multDur, seed, people:[{cells,t,stagger,ring}], out` (9x16'da sağ alt karolar buton sütununa girmesin: x ≤ 925 ya da alt ≤ 1000) |
| `L.worldDots` | jenerik dünya nokta haritası (ülke adı/bayrak/sayı yok): noktalar soldan belirir, `origin` sarı nabız, `lit`'te origin'den dışa dalgayla yanar, `marks`'ta yeşil tik rozetleri çarpar | `x,y (sol-üst), w (h = w·21/48), t, dot, origin:{c,r,t}, lit:{a,b}, marks:[{c,r,t}], markSize, out` (48x21 hücre; c = (boylam+180)/7.5, r ≈ (77-enlem)/6.4) |
| `L.phoneApp` | jenerik uygulama telefonu (gerçek logo/arayüz taklidi değil): ekranda yalnız uygulama adı soldan yazılır, altında ikon kutucukları kendi anında pop | `x,y,w,h, t, title, tTitle, titleSize, accent (hex), tiles:[{icon,t,color}], cols, lit, out, rot` (ad ekran genişliğinin ~%80'ini geçmesin) |
| `L.loopHeadline` (sahne) | `L.headline` + `off`: vurgu satırı `off`'ta yumuşakça beyaza ve düz duruşa döner (döngü kapanışı: son kare = ilk kare) | `L.headline` alanları + `off, offDur` (`hit.color` hex), `pulses:[{t,amt,dur,line}]` (vuruştan önce hafif ölçek nabzı; t=0 karesi değişmez), `underline:{t,y,w,h,dur,color,hitColor}` (satır altına çizgi, vuruşta renge döner) |
| **v9: derinlik / stüdyo** | kişi maskesiyle grafikler konuşmacının ARKASINDAN çıkar (`ornekler/derinlik-studyo`). `L.scene({layer: 'behind'|'front'})`; yalnızca yeni adlar | |
| `L.emerge` | arkasından çıkış sarmalayıcısı: içindeki parçalar `t`'de `from` konumundan (kafa/omuz arkası, küçük ölçek) yayla `at`'a (vars. yerinde) gelir, `steps` ile sonraki yay hareketleri (ör. omuz üstünde küçük bekler, sonra yükselir), `out`'ta `to`'ya (vars. from: geri batar) döner | `parts, t, from:{x,y,s,r,o}, at, steps:[{t,x,y,s,r,o,zeta,f}], to, zeta, f, out (çıkışın bittiği an), outDur, origin, fade` |
| `L.logoCard` | koyu cam kart: logo dairesi (resmî SVG) ya da ikon dairesi + ad + alt satır; isteğe bağlı üst etiket, sol renk çizgisi | `x,y,w,h, logo, logoPad, icon, iconBg ('green'|'red'|'blue'), name, sub, kicker, nameSize, subSize, accent, lit` |
| `L.columns` | sütun grafik (puan): sütunlar 0'dan dürüst ölçekle tabandan yükselir (alt kenar yumuşak), tepede logo + değer, içinde dikey ad | `x, base, w, gap, scale (px/birim), bars:[{value, text, name, logo, color, t}], dur, labelSize, logoSize, nameSize, out` |
| `L.segmented` | segmentli seçici ('Efor: Orta'): etiket + seçenekler; sarı topuz `tPick`'te soldan seçilene kayar | `x,y,w, label, icon, options, pick, t, tPick, size, out` |
| `L.promptBox` | prompt penceresi: başlık + alıcı logoları, kullanıcı balonu yazıldıkça büyür (imleç), parça fosforlanır; isteğe bağlı şart satırları (tik/çarpı/dosya) | `x,y,w, title, logos, tLogos, logoSize, text, typeA, typeB, marks:[{text,t}], rows:[{icon,text,tag,t}], textSize, rowSize, t, out` |
| `L.siteWindow` | tarayıcı penceresinde gerçek site görüntüsü (tam sayfa PNG) yumuşak kayar; sekmede logo + ad; yerinde pop | `x,y,w,h, src, imgW, imgH, logo, logoPad, tab, barH, t, scroll:[{a,b,to}], enter:{s,dy}, out, moves:[{a,b,x,y,w,h,s,o,ease}]` (moves: yığından öne çıkıp büyüme / geri çekilip sönme; içerik pencereyle ölçeklenir) |
| `L.fullSite` | tam ekran site (arka plan, `data-safe=ignore`): alttan silmeyle açılır, kayar, isteğe bağlı kararma | `src, imgW, imgH, t, dur, scroll:[{a,b,to,ease}], dim, out, outDur` |
| `L.logoPill` | hap: [logo] metin [ikon]; yerinde pop (`t < 0`: t=0'da hazır), nabız | `x,y, logo, logoPad, icon, iconLeft, text, size, style ('white'|'dark'|'yellow'), anchor ('center'|'left'), t, out, pulse:{t,amt,dur}, from` |
| `L.pollCard` | anket kartı (yorumlardaki ankete çağrı): başlık + logolu seçenekler (boş seçim dairesi; sonuç/sayı YOK), `foot.t`'de kart uzar, sarı hap + zıplayan ok | `x,y,w, title, options:[{logo,text,t}], foot:{text,t}, size, t, out` |
| `L.frameRing` | çerçeve vurgusu: pencere/kart çevresinde ince renkli çerçeve + parıltı (ör. favori site için altın) | `x,y,w,h, r, width, color, glow, t, out, from (giriş ölçeği)` |
| `L.slot` | yer tutucu: kesik çizgili yuvarlak dikdörtgen (gelecek kartın yeri), kart gelince söner | `x,y,w,h, r, t, out, color` |
| `L.backdrop` | tam ekran perde/zemin (`data-safe=ignore`): kararma anı, site üstünde okunurluk gradyanı | `t, fade, out, outDur, bg (CSS)` |
| `L.lgDisc(src, size, {pad, bg, ring})` | yardımcı: logo dairesi HTML'i (sahne parçası içinde). Tüm v9 bileşenlerinde `logo` yol ya da `{src, bg, pad}` olabilir (ör. koyu daire + beyaz simge) | |
| `L.freezeLoop` | `L.freezeFace` + `undo`: kararma/bulanıklık/yakınlaşma sonda geri alınır; kadraj canlı motordan kopyalanır (kapanışta kart -> tam ekran açılışını da izler) | `L.freezeFace` alanları + `undo:{t,dur}` (`L.scene({z: 5, from: C.end, ...})`) |
| `L.commentBubble` | yorum balonu (CTA): "yazıyor…" üç noktasıyla açılır, `tText`'te genişler ve metin (videoda söylenen soru) soldan yazılır | `x,y (sol-üst), size, fs, text, t, tText, tail:'left'|'right', out` |
| **v10: doğal geçişli reklam** | `V.natural` ile; büyük kartlar `L.emerge({from:{y:30,s:.98,o:0}, zeta:.95, f:1.4, fade:.6})` içinde yerinde süzülür. Yalnızca yeni adlar + mevcutlarda isteğe bağlı parametreler | |
| `L.tone` | ton sarmalayıcısı: içindeki parçalar `t`'de griye döner ve soluklaşır ("eskiden böyleydi"; yerinde, hareketsiz); `out`'ta söner | `parts, t, dur, gray, o, dim, out, outDur` |
| `L.clock` | saat kadranı (süre: '4 saat'): yerinde süzülür, `fill`'den itibaren saat dilimleri `tick` aralıkla tek tek dolar (ses: flip_ticks ile aynı anlar), akrep ilerler; altında etiket hapı. Kadranda rakam yok | `x,y (merkez), r, hours, t, fill, tick, color, label:{text,t,size}, out` |
| ek parametreler (v10) | `L.cutStrip({ru, g})` kompakt şerit (cetvel / iz boşluğu, vars. 22/12) · `L.formCard({button: 'Formu doldur', arrow:{again: t\|[t..]}})` düğme yazısı + ok yeniden zıplar · `L.headline({hit:{line:[1,2]}})` birden çok satır vurgulanır | |
| **v11: net reklam (30+)** | tek fikir / en fazla 1-2 eleman, büyük yazısız ikon, yaysız (ease) hareket; A/B girişli reklam. Yalnızca yeni adlar + mevcutlarda isteğe bağlı parametreler | |
| `L.receipt` | fiş / fatura (maliyet; yazısız, rakamsız): kâğıt yerinde belirir, aşağı doğru basılarak uzar, satırlar toplamın üstünde sırayla belirir; `total.t`'de toplam satırı kırmızıya döner; `more.t`'de fiş biraz daha uzar (toplam aşağı kayar) | `x,y (sol-üst), w, rows, rowH, t, print:{a,b}, total:{t,color}, more:{t,rows,dur}, out, seed` |
| `L.coinStack` | ₺ jeton yığını (rakamsız): jetonlar sırayla yukarıdan yerine iner (ease, sekmesiz), yığın yükselir | `x (merkez), y (taban), w, times:[t..], drop, out` |
| `L.journey` | A'dan Z'ye yol: yatay iz, uçlarda kısa yazılı düğüm ('A' / 'Z'), arada boş adım düğümleri; `lit.t`'den soldan sağa `stagger` aralıkla sarı yanar, iz dolar; bitişte yeşil tik | `x0, x1 (uç merkezleri), y, from, to, steps, size, stepSize, t, tSteps, tEnd, lit:{t,stagger}, check, out` (tik bitiş düğümünün sağ üstünden ~%14 taşar) |
| `L.signupCard` | geniş kayıt formu CTA'sı: başlıkta logo avatarı + marka adı, yazısız alanlar, yazılı büyük gönder düğmesi, altında iri aşağı ok; yerinde süzülür (yay yok), düğme `pulse`'ta nabız | `x,y (sol-üst), w, h, t, brand:{src,text}, fields, button:{text,size,color}, pulse, arrow:{in,t,n,per,size,gap,again}, out` (kart modunda üst alanı doldurur; 9x16 ör. x 210, y 262, w 660, h 392) |
| ek parametreler (v11) | `L.softHook({hit:{words:[n..]}})` satır yerine yalnız bu kelimeler (0'dan, tüm satırlar boyunca) renge döner (komşuya binmesin: `grow: 1, pulse ≤ .03`) · `L.formCard({pulse: t\|[t..]})` gönder düğmesi hafif nabız · `L.device({draft: true})` kesik çizgili taslak (plan hâlinde; `L.tone` ile griye döndür) · `L.flow({ring})` / düğümde `ring`: yanma halkasının en büyük ölçeği (vars. 1.45; kenara yakın büyük düğümde 1.1–1.2) · `L.flow({ghostStrong: true})` kesik çizgili boş yerler belirgin (kalın, açık) · `L.signupCard({button:{t}})` düğmenin oturduğu an (kendi kelimesinde) · `L.holdFace({frame: true})` kartın halka + gölgesi donan karede de kalır (kapanış kartta) · ikonlar `L.I.dev` (dizüstü başında yazılımcı), `L.I.gradCap` (mezuniyet kepi) | |
| **v12: haber / son dakika** | ayaküstü haber Reels'i: her karede canlı rozet, gerçek tweet ekran görüntüleri (fosfor / çerçeve), çokluk yelpazesi. Yalnızca yeni adlar + mevcutlarda isteğe bağlı parametreler | |
| `L.liveBadge` | canlı yayın rozeti ('ANLIK GELİŞME', 'CANLI'): renkli hap, yanıp sönen nokta + yayılan halka (t'den saf; `loop` verilirse periyot video süresine tam bölünür -> döngüde ilk kare = son kare); `pulse`'ta hafif nabız | `text, x, y (anchor 'right': sağ kenar x), anchor, size, t (< 0: t=0'da hazır), color, ink, blink, loop (C.total), pulse, pulseAmt, pulseDur, out` (her karede: `L.scene({id, from: 0, z: 7, ...})`; diğer grafikler rozetin kutusuna girmez) |
| `L.shotCard` | GERÇEK ekran görüntüsü kartı (tweet / sayfa): beyaz yuvarlak köşeli kart + gölge, yerinde süzülür (ease) ya da pop (yay); `marks`: sarı fosfor (soldan çizilir, multiply: yazı okunur) / kırmızı çerçeve; alt kenarı kesik görselde `fade`; `moves` ile yaklaşma / küçülme. Görselin üstüne yazı / kurum adı konmaz | `src, imgW, imgH, x, y, w, r, t, enter:{s,dy,dur} \| {s,dy,zeta,f}, crop (görsel px), fade:{from}, marks:[{x,y,w,h (görsel px), t, kind:'hl'\|'box'\|'cover', color, fill, dur, pad, width, r, glow, out}], moves:[{a,b,x,y,s,o,ease}], pan:[{a,b,s,x,y,ease}], origin (kart içi px), out, outDur, shadow` (`pan`: çerçeve sabit, içerik yaklaşır (s içerik ölçeği, x/y görünen pencerenin sol-üstü, görsel px) -> telefonda okunurluk: gövde yazısı ≥ ~34 px; `cover`: görseldeki kusuru (kesik başlık) örten yama, color = CSS arka planı. Solan alt kısım da denetime girer: 9x16'da sağ kenar ≤ 930 ya da alt ≤ 1000; girişte aşağıdan kayma alt kenarı 1000'in altına iter -> `enter.dy: 0`) |
| `L.postFan` | yazısız gönderi iskeletleri (avatar dairesi + gri satırlar) bir kartın arkasından yelpaze gibi açılır (çokluk: "birçok ülke") | `x,y,w,h (öndeki kartın kutusu), n, t, dur, stagger, spread, rot, lift, r, seed, out, colors` (sahnede öndeki karttan ÖNCE yazılır; uç kartlar ~spread + .85·h·sin(rot) yana taşar) |
| ek parametreler (v12) | `L.headline` / `L.loopHeadline({hit:{words:[n..], bg:'#E5383B', color:'#FFFFFF'}})` yalnız bu kelimeler (0'dan) çarpar, arkasında renkli kutu (haber manşeti; `off`'ta kutu söner -> döngü) · `L.flow({tokens:[{a,b,path, icon:'mail', size, bg, ink}]})` ikonlu jeton (zarf), `L.flow({linkWidth})` kalın bağlantı çizgisi (ok ucu orantılı) · ikon `L.I.server` · motor `V.card` (kart dikdörtgeni, yukarıdaki not) | |
| **v13: ok geçişi + dalış** | konuşurken ekran girer, kıvrımlı ok bir noktaya çizilir, sonra ekranın içine dalınır (`ornekler/ok-gecis-dalis`). Yalnızca yeni adlar + `L.device` yeni türü | |
| `L.arrowPath` | çizilen kıvrımlı ok: kübik bezier `t..t+dur`'da çizilir, ok başı çizginin ucunu izler (uç `to`'da); isteğe bağlı başlangıç noktası, kesik çizgi | `from, to, c1, c2` (ya da `bend`: dik sapma px), `t, dur, ease, width, color, head (px, 0 = yok), dot, dash:[a,b], out, outDur, shadow` (SVG kutusu yalnız yolu + ~1.2·head payını kapsar: güvenli alana pay bırak) |
| `L.dive` | ekranın içine dalış (sarmalayıcı): parçalar `t`'de `focus` etrafında `s` kata büyür, focus `to`'ya kayar (ease), `fade` aralığında söner -> gizli sahne "içeride" açılır. Dalış başlayınca içerik `data-safe=ignore` (tam ekran geçiş zemini) | `parts, t, dur, focus:{x,y}, to:{x,y} (vars. ekran merkezi), s (vars. 6), fade:[a,b] (vars. [.55,1]), ease` (kişi katmanını `V.matte.moves` ile söndür; sahne sırası: içerideki sahne ÖNCE yazılır, dalış üstte kalır) |
| `L.puzzle` | yapboz parçası (uyum / uyumsuzluk): tek SVG; kenarlarda çıkıntı/girinti; `ghost` = boş yuva (opak açık zemin + kesik çizgi, altını örter); `moves` ile yuvaya kayar | `x,y (merkez), size, knobs:{t,r,b,l} (1 çıkıntı, -1 girinti, 0 düz), color, ink, icon, ghost, fill, stroke, t, moves:[{a,b,x,y,r,s,ease}], rot, out, outDur, shadow` (uymayan parça: yuvadan farklı çıkıntılar + biraz büyük; girintiler altındaki içeriği gösterir) |
| `L.crowd` | kalabalık (çokluk: "binlerce örnek"; sayı yok): renkli dolgu avatar daireleri (beyaz kişi simgesi + beyaz halka) `center`'dan dışa doğru hızlanarak çoğalır; `lit`'te soldan sağa sarı halka parıltısı. Açık/karışık zeminde okunur (`L.avatarField` koyu tema, ince çizgi) | `x,y (sol-üst), cols, rows, size, gap, t, fill:{a,b}, accel (vars. 1.6), lit:{a,b}, center:{x,y}, colors, seed, out, outDur` (V.matte ile kişinin arkasında: `layer: 'behind'`) |
| ek parametreler (v13) | `L.device({kind: 'list'})` kayıt listesi (müşteri / kişi listesi, CRM): başlık + düğme, satırlarda renkli avatar dairesi + iki gri çizgi + durum hapı · `L.device({kind: 'calendar'})` rezervasyon takvimi (ay başlığı, gün başlıkları, 5x7 gün hücresi, dolu günler marka renginde; `build` boyunca satır satır dolar) · motor `V.matte.roomZ` (yukarıdaki not) · motor (V.natural): gizliden tam ekrana geri açılış bitince zemin görünmez (ilk karttan ÖNCE gizli sahne varsa oda zeminin altında kalıyordu) | |
| **v14: kolaj + sinematik (stok montaj)** | `comp/kolaj.js`, global `K` (library.js'e dokunmaz; plan.json `"libs": ["kolaj"]` ile yüklenir). Taban görüntü `K.plate`'te çizilir (video.css: `#faceWrap{visibility:hidden}`), kesitler aynı kamera/kareyle piksel hizalı. Kare ve maskeler kare başı önceden yüklenir (`K.need` -> renderAt sarmalayıcısı). | |
| `K.film` (sahne dizisi) | ortak doku: kalkık siyahlar (lighten), vinyet, canlı tohumlu gren (overlay); karışım modu sahne öğesine verilir (sahneler ayrı yığın bağlamı) | `grain, size, vignette, lift, z (7)` |
| `K.plate` | taban kare + kamera + renk: `frame` (t -> kare dosyası; dondurma / 12 fps), `cam` (t -> {s,x,y,r,ox,oy}), `filter` (vars. `K.GRADE`), `dim`, `blur` (0..1 derinlik), `fill: {mirror, dim}` (dikey kaydırmada açılan bant aynalanır) | `a, b, frame, cam, filter, dim, blur, fill` (z 2, data-safe=ignore) |
| `K.cutout` | maskeli kesit (work/masks/<dir>/maske/NNNN.png): yazı-arkada, çıkartma (`border` beyaz kenar + `shadow`), 2.5D ön plan (kendi `cam`'i), seçici renk (`filter`, `clip`) | `a, b, dir, range:[n0,n1], frame, cam, choke, feather, dilate (delik kapatır), border:{w,color}, shadow, clip, filter, opacity` |
| `K.retouch` (çağrı) | stok yazı/logo temizliği: bölge yanındaki dokudan yumuşak yamayla örtülür ya da yerinde bulanıklaşır (plate + cutout aynı kaynağı çizer) | `{range, box: n -> [x0,y0,x1,y1] (kaynak px), from: [dx,dy] \| blur, feather}` |
| `K.title` | dev sıkışık başlık (Avenir Next Condensed 900, kırık beyaz): giriş `none` / `letters` (harf harf stop-motion) / `rise` (nesnenin arkasından yükselir) / `slam`; `grow` | `text, x (merkez), y, size, sy (dikey çekme), color, t, enter, rise:{dy,dur}, grow:{a,b,from,to}, out, track` (denetim yazı yüzünün içerik kutusunu ölçer: üstte ~%55·size pay bırak) |
| `K.note` | el yazısı not (Marker Felt): harf harf yazılır (12 fps), sarı + koyu gölge | `text, x, y, size, rot, color, t, dur, out, align, track` |
| `K.marker` + `K.SH` | marker çizimi: çizilerek gelir (stroke-dash), 12 fps boil; şekiller `K.SH.ellipse/line/arrow/x/tick/underline/rays/digit` (nokta dizisi); `pts` fonksiyon olabilir (nesneyi izler, kutu her karede gerçek noktalardan) | `shapes:[{pts,t,dur,w,color,closed}], color, width, boil, under, out, track, box` |
| `K.sticker` | yırtık kenarlı kâğıt çıkartma (doku, gölge, bant tuvale bir kez pişer), içerik DOM; stop-motion yapışma, wobble, sarsıntı | `x,y (merkez), w,h, rot, paper: white\|kraft\|dark\|yellow\|tape, torn, die, tape:[{x,y,w,h,rot}], html, t, out, shake, pop, wobble, track, onRender` |
| `K.board` | tam ekran kâğıt pano yırtık kenarla ekranı süpürür (`dir` left/right/up/down), geri açılabilir | `t, dur, dir, paper, slant, amp, outT, outDur` |
| `K.windowWord` | kelime penceresi: koyu kâğıt, harfler oyuk (video içinde oynar), `dive` ile bir harfin içinden geçiş (dalışta denetim dışı); probe kutusu denetime girer | `text, x, y, size, sy, t, stagger, dive:{a,b,letter,s}, out` |
| `K.contour` | kontur çizgisi: maskenin dış hattı kare kare izlenir, marker gibi çizilir; kenara değen / `clip` dışı kısımlar çizilmez | `a, b, dir, range, t, dur, width, color, clip, glow` |
| `K.screen` + `K.quadTrack` + `K.appUI` / `K.formUI` | ekrana homografiyle (matrix3d) oturan arayüz; beyaz olmayan taban pikselleri (parmak, çentik, çerçeve) öne geri çizilir (luma key); `cam` + `portal` ile ekranın içine dalış. quadTrack: paralelkenar artığı büyük karelerde bozuk köşe yeniden kurulur + zamanda yumuşatma | `a, b, quad, ui:{w,h,html,render}, bleed, key:{lum,sat}, cam, portal:{a,b,frame}` (arayüz zemini altta boş pay bırakır: alt kenar 1500'ü geçmesin) |
| `K.glow` · `K.capStyle` · `K.capUnderline` · `K.flowY` · `K.ink.*` | ılık parlama (screen) · altyazı kolaj stili (sıkışık kırık beyaz, hl kelimede sarı marker şeridi) · altyazıdaki kelimenin altını çizer · dikey akış izinden nokta taşıma (merdiven) · yazısız mürekkep çizimleri (code, person, calendar, receipt, chart, todo, stopwatch) | |
| **v15: premium vitrin (öncesi / sonrası)** | `comp/premium.js`, global `PR` (library.js'e dokunmaz; plan.json `"libs": ["premium"]`, gren istenirse önce `"kolaj"` -> `K.film`). Güzellik / klinik reklamı, iki dil: **zarif** (ipek zemin + altın çerçeveli kart + Didot: `PR.silk`, `PR.frameCard`, `PR.headline`, `PR.swapLabel`) ve **cesur sosyal** (tam ekran klip `PR.frameCard({bare: true})` + kalın sıkışık yazı, eğik altın kutu, 'pat' girişleri, IG/WhatsApp satırları: `PR.punch`, `PR.veil`, `PR.ICON`). Motorun yüz katmanı video.css'te gizli (`#faceWrap{visibility:hidden}`); klip PR.frameCard'da çizilir, kare görüntüleri renderAt'tan önce yüklenir. Yazı tipi adlarını tek tırnakla yaz (bileşen HTML'i style="" içinde). Örnek: `ornekler/oncesi-sonrasi/video.js` (cesur sosyal, 9x16 + 1x1) | |
| `PR.silk` | tam ekran akan ipek / aurora zemin (data-safe=ignore): eğik, kendi içinde bükülen yavaş dalgalardan yükseklik alanı, ışıkla gölgelenir (satin kıvrım + yumuşak parıltı); düşük çözünürlükte hesaplanıp büyütülür, t'den saf (telifsiz, indirme yok) | `colors:{shade,base,light,hi}, speed, angle, relief, spec, specA, res (4), wash (CSS katmanı, ör. kartın arkasında ışık), seed` (`L.scene({z: 1})`; gren için üstte `K.film`) |
| `PR.frameCard` | klip kartı ya da tam ekran klip (`bare: true`: çerçeve/gölge/köşe yok, zemin data-safe=ignore; `filter`: canlı renk, ör. 'contrast(1.08) saturate(1.12)'): iki katmanlı kare dizisi (a öncesi / b sonrası, kare kare aynı an, piksel hizalı); buzlu cam (kanca okunurken, açılırken hafif uzaklaşma), lazer taraması (yatay altın-beyaz ışın, geçtiği yer b), karşılaştırma sürgüsü (dikey çizgi + tutamak, solu a / sağı b, köşe etiketleri), kartın üstünde logo filigranı, tek parıltı, yavaş süzülme + 3B eğim, `moves` ile küçülüp taşınma | `x,y,w,h,r, layers:{a: n->url, b: n->url}, frame, crop:{x,y,zoom} (kaynakta odak, kenar boş kalmaz), show, scan:{t,dur,ease,color,core,width,glow,glowA,halo,haloColor,haloA,fresh}, compare:{a,b,at,inDur,outDur,line:{w,color,glow,glowColor},knob:{r,bg,ring,ink} \| 0,tags:{a,b,size,mode:'corner'\|'divider',top,gap,css:{a,b}}}, frost:{until,dur,blur,veil,color,zoom}, float:{y,rx,ry,persp,periods} \| false, moves:[{a,b,x,y,s}], ring:{w,bg}, shadow, watermark:{src,size,right,bottom,opacity,filter}, glint:{t,dur,x,y,size}, out` (9x16: sağ kenar ≤ 925, alt ≤ 1340 -> çerçeve + süzülme güvenli alanda; 3B eğim 1°'yi geçmesin) |
| `PR.headline` | başlık bloğu (kanca / çağrı): ortalı satırlar (yazı tipi, altın gradyan dolgu, `maxW`'ye sığdırma), ortadan çizilen altın çizgi + seyrek aralıklı alt satır; t=0'da yerinde (kanca) ya da `enter` ile sırayla belirir; `move` ile küçülüp üste çekilir (alt satır + çizgi söner) | `x,y (blok merkezi), lines:[{text,size,font,weight,italic,color,gradient,spacing,maxW,gap,lh}], rule:{w,h,color,gap,t,dur}, sub:{text,size,font,weight,color,spacing,gap,t,upper}, enter:{t,dur,dy,stagger}, settle:{line,from,t,dur}, move:{a,b,x,y,s}, keepSub, out, outDur` (yazı tipi adlarında tek tırnak: `"Didot, 'Bodoni 72', serif"`) |
| `PR.swapLabel` | etiket kelimesi harf harf değişir (ÖNCESİ -> SONRASI): aynı yer, aynı yazı yüzü; eski harfler yukarı kayıp söner, yenileri aşağıdan yükselir (maske içinde); iki yanda altın kıl çizgi | `x,y, words:[{text,t}], size, font, weight, color, spacing (em), rules:{w,gap,h,color,dur}, stagger, dur, rise, lag, out, outDur` |
| `PR.image` · `PR.arrowDisc` | logo/görsel yerinde belirir (opaklık + kısa yükseliş) · altın daire içinde aşağı ok (IG düğmesine): yayla belirir, `bounce` anlarında ok nazikçe iki kez iner | `src, x,y (merkez), w, h, t, dur, dy, out, filter` · `x,y, size, color, ink, t, bounce:[t..], amp, out` |
| `PR.punch` | cesur sosyal öğeler ('pat'): her öğe merkezinden yerleşir, `t`'de büyükten yayla çarpar (isteğe bağlı eğimden düzelir), okunurken kıpırdamaz. Türler: kalın sıkışık yazı (Avenir Next Condensed 900; `stroke` kontur + `shadow` sert gölge, `\n` satır kırar), eğik renkli kutu / çerçeveli hap (`box`), görsel (logo, `img`), ikon + yazı satırı (`icon: 'instagram' \| 'whatsapp'`) | `items:[{x,y (merkez), ax (yatay çapa 0 sol / .5 / 1 sağ), text \| html (hazır gövde: satır içi kutu + yazı) \| img:{src,w,h,filter} \| icon, size, font, weight, color, spacing, lh, stroke, shadow, upper, box:{bg,border,radius,pad:[v,h],w,h (sabit kutu: kare numara rozeti),shadow}, rot, opacity, iconSize, gap, maxW, t (<= 0: ilk karede görünür), pop:{from,rot,zeta,f,fade}, out:{t,dur,s,dy}, hide:[{a,b,dur}], kick:[{t,amt,dur}] (yerinde kısa ölçek nabzı: müzikte drop)}]` (aynı yerde etiket değişimi: eski öğe `out` .05 s, yeni öğe `pop.fade` .02 -> tek karede temiz 'pat'; pop ölçeği 9x16'da sağ sütun bölgesinde sağ kenarı 930'u geçirmesin) |
| `PR.tiles` | görsel ızgarası (ör. 'hangisi senin tarzın?' seçkisi): donmuş kareler kırpılmış karolarda (kaynakta odak + yakınlaşma, kenar boş kalmaz), beyaz çerçeve + gölge, köşede altın numara rozeti; karolar `t`'lerinde sırayla 'pat' (± eğimli), `out` ile söner | `x,y (sol-üst), cols, rows, w, h, gap, r, border, shadow, aspect (kaynak h/w, vars. TIMELINE.src), items:[{src, fx, fy, zoom, label, t}], badge:{size,bg,color,font,inset,rot}, pop:{from,rot,zeta,f,fade}, out:{t,dur,s}` (9x16 reklam alanında ızgarayı y < 1000'de tut: sağ sütun yasağı; pop ölçeği ≤ 1.06 -> kenar karolar sınırı aşmaz). Örnek: `ornekler/secki-reklami/video.js` |
| `PR.capStyle` · `PR.progress` | motor altyazısına serinin görünümü (Avenir Next Condensed 900, siyah kontur + sert gölge; hl kelime altın kutu (kutu gölge yayılmasıyla: motorun satır ölçümünü bozmaz), brand altın, konuşulan kelime açık altın; `PR.capStyle()` video.js sonunda çağrılır, fontları `V.fonts`'a ekle) · ince altın ilerleme çizgisi a..b boyunca soldan dolar (marka çubuğunun altında) | `font, weight, stroke, shadow, color, active, brand, hlBg, hlInk` · `x, y, w, h, a, b, color, track, t, dur, out, outDur` (konuşan kafa testimonial: `ornekler/musteri-yorumu/video.js`) |
| `PR.frameCard({anchor})` | serbest kadraj: `anchor: t -> {s, ax, ay, sx, sy}` kaynaktaki (ax, ay) ekranda (sx, sy)'de, genişlik W·s. Konuşan kafayı yüz takibiyle (`FACE_TRACK.top + .03` saç çizgisi, ±8 kare yumuşatma) reklam bölgesine yerleştirmek için: saç çizgisi sabit kalır, yakınlaşmalar oradan aşağı büyür (saç üstü kesilmez); açılan alt alan `under` rengine `fadeBottom` px'te erir | motorun yüz katmanı video.css'te gizli; eski gömülü bant varsa bandın alt kenarını opak üst şeridin kenarına hizala (örnek: `ornekler/musteri-yorumu/video.js`) |
| **v16: emojili + 3D reklam** | konuşan yüz, tam ekran (siyah şerit yok), üstte kalıcı kanca başlığı, yüzün yanında tek büyük 3D öğe (premium.js; `ornekler/emojili-3d/video.js`). Emoji yalnız kullanıcının açıkça istediği işlerde (kurallar §8 istisnası); headless Chromium'da Mac'te Apple Color Emoji çıkıyor (`V.fonts`'a `'40px "Apple Color Emoji"'` ekle; Windows'ta karşılığı `"Segoe UI Emoji"`). Takvim emojileri (📅 🗓️) 'JUL' / '17' yazar: söylenmeyen tarih | |
| `PR.headAnchor` | `PR.frameCard({anchor})` için konuşan yüz kadrajı: saç üstü (takip top + pad) ekranda `ht`'de, yüz yatayda `x`'te, görüntü hep kenardan kenara dolu; çekim başına sabit (`cuts`: yeni çekimin ilk kareleri) ya da yumuşatılmış takip; ara görüntü / elle sabit kadraj için `plain` | `ht, x, s (sayı \| çekim başına dizi; x ile yüz yana alınır: büyük 3D öğeye yer), cuts, mode: 'fixed' \| 'follow', k, zoom: t -> çarpan (kesim vuruşu), plain: [[f0, f1, {s, fx, fy}]], pad (.035)`; dönen fonksiyonun `.at(n, t)`'si donmuş kare için |
| `PR.hookTitle` | kalıcı kanca başlığı (üst başlık): satırlar alt alta ortalı, ilk karede okunur, 'pat' ile oturur, `out`'a kadar sabit; satır türleri `plain` (beyaz + siyah kontur), `gold` (eğik altın kutu), `white` (beyaz kutu), `pill` (koyu hap, küçük alt satır); satır sonuna emoji | `x, y (üst), gap, lines: [{text, emoji, size, kind, rot, spacing}], maxW, t, out, outDur` (9x16 reklam alanında y ≥ 290: kontur yazının glif kutusu ~12 px yukarı taşar) |
| `PR.badge3d` | 3D altın rozet / etiket (CSS 3D: perspective + preserve-3d, katmanlı kalınlık): `kind: 'seal'` tırtıllı yuvarlak rozet ('%95'), `'tag'` askılı fiyat etiketi (delik + ip, sarkaç gibi sallanır); `t`'de dönerek 'pat' gelir, parlama geçer, hafif salınır; `label` altında düz beyaz kutu | `kind, x, y (gövde merkezi), size, text, unit, label, labelSize, t, out, depth, tilt:{x,y}, spin, sway:{y,x,period}, string (ip boyu / gövde yüksekliği, vars. .62)` (salınım + perspektif sağ kenarı ~28 px taşırır: 9x16'da x + size/2 ≤ ~985; etiketin ipi gövdenin .62·h üstüne çıkar) |
| `PR.emoji3d` | büyük emoji, koyu arka katmanlarla kalınlık + 3D eğim; `t`'de dönerek 'pat', hafif salınır, `out`'ta söner | `items: [{ch, x, y (merkez), size, t, out, tilt:{x,y,z}, depth, sway}]` (kesimden önce sönsün: `out` = kesim − .22; mavi LED gibi aynı renkli zeminde emoji kaybolur) |
| `PR.adCta` | serinin çağrı ekranı (kararmış kare üstünde): logo, hap, HEMEN RANDEVUNU + altın OLUŞTUR, Instagram ve WhatsApp satırları (`BRAND.handle`, `BRAND.phone`) | `t, hap, at: {logo:[y,w], hap:[y,size], call:[y,size,lh], make:[y,size], ig:[y,size,icon], wa:[y,size,icon]}, step, maxW` |
| ek parametreler (v16) | `PR.capStyle({drop: [kelime indeksi..]})` büyük grafiğin gösterdiği kelimeler altyazıda çizilmez (aynı kelime iki kez görünmez), `st: 'red'` kelimeler kırmızı kutuda · `PR.frameCard({inT, inDur})` katman belirir (donan kareye çapraz geçiş) · `PR.panel` opak kart | |
| `PR.veil` · `PR.ICON` | tam ekran perde (data-safe=ignore; alt koyu geçiş, çağrıda karartma; opaklık anahtarları) · kodla çizilmiş iletişim ikonları: Instagram uygulama ikonu (degrade kare + kamera çizgisi), WhatsApp (yeşil daire + balon + ahize) | `bg (CSS), o, keys:[{t,to,dur,ease}]` · `PR.ICON.instagram(px)`, `PR.ICON.whatsapp(px)` (SVG dizgesi; `PR.punch` içinde `icon` ile) |
İkonlar: `L.I.lock|cart|doc|star|refresh|checkCircle|check|clock|alert|search|hand|gavel|bank|x|arrowDown|user|store|scale|copy|code|puzzle|layers|folder|book|list|megaphone|eye|commit|rocket|gear|question|target|scope|flask|trend|burst|sparkles|cpu|bulb|play|coin|tag|home|glass|mug|bottle|globe|pin|arrowRight|phone|camera|scissors|image|video|slides|mail|calendar|dev|gradCap|server|team|office|hotel` (jenerik; `team` ekip (üç kişi), `office` dış şirket binası, `hotel` otel (H tabelalı bina); `coin` ₺ işaretli para; yapay zekâ için nötr `cpu` — kıvılcım/yıldız marka logosu çağrıştırır; resmi logo/arma çizilmez; `doc` rengi sabit, koyu ikon gerekirse `folder`/`list`).

### Ders bileşenleri (`comp/ders.js`, global `D`; v1)
Yüzsüz slayt anlatımı ve ekran kaydı dersleri (16:9). plan.json `"libs": ["ders"]`; engine.js / library.js'e dokunmaz. Örnek: `ornekler/ders-yatay/video.js`.
- **Motor ayarı:** `V.focus` MUTLAKA verilir (en az `[{t: 0, z: 1, cx: .5, cy: .5}]`): yüz kadrajı, jump / slowPush / punch zoom devre dışı kalır. `introZoom: false, introFlash: false`, `layout: [{t: 0, mode: 'full'}]`.
- **`V.focus` (v18):** `[{t, z, cx, cy, d}]` taban görüntüde bölgeye yakınlaşma; t'den itibaren d s (vars. .7) inOutCubic ile z kata ve (cx, cy) kaynak oranındaki noktaya geçer. Kenar kırpılır: alttaki öğeye yakınlaşmada (cy 1) öğe ekranın altında KALIR (yukarı taşınamaz). Kural: z ≤ 1.5, en az 3 s tut, geçiş .7–.9 s, slayt değişmeden z 1'e dön. Yakınlaşmada kesik başlık parçası görünmesin (alt anchorlu: z ≥ 1080 / (1080 − başlık altı)).
- **Koordinatlar:** slayt öğesi = KAYNAK px (TIMELINE.src, 1920x1080; stills alıp kareden ölç). `D.pt / D.rect` motorun o karede `#face`'e yazdığı geometriyi okur → `D.mark`, `D.blur`, `D.callout`, `D.hold` yakınlaşmayla birlikte hareket eder. Not / terim / çip ekran koordinatıdır (sabit).
- **Güvenli alan (16x9 x 96–1824, y 54–960):** slaydın altındaki öğeye (y > 960; alt bantlar) çerçeve / fosfor KONMAZ, yalnızca `spot` (soluklaştırma, data-safe=ignore) verilir.
- **Katman / z:** `D.hold` 2 · fosfor (`kind: 'hl'`) multiply sahnesinde `D.layer({blend: 'multiply'})` 5 · çerçeve / spot 6 · not / terim / çip 7 · altyazı 8.
- **Okunurluk (960 px gömülü oynatıcıda okunur; onaylı ölçüler), 1920 ölçeğinde:** not maddesi ≥ 30 px (`D.note size: 30`), not başlığı ve üst etiket ≥ 22 (`kickerSize: 22`), terim tanımı ≥ 28 (`D.term size: 28`), çip / etiket listesi ≥ 26, konu çipi ≥ 24 (`D.topic size: 24` + ince hap `lh`/`pad`), altyazı ≥ 38. Bileşen varsayılanları küçüktür (geriye uyum); boyutu video.js'ten ver. Kart büyüyünce slayttaki önemli içeriği kapatmasın: konum/genişlik ayarla, maddeler iki satıra inebilir.
- **Zaman:** kelimeye bağla (`word(i).s`, kurgu değişse de indeks sabit); slayt geçişleri plan.json cue'ları (`{"t": ...}`, work/slayt_gecis.txt). `out` = sönmenin bittiği an.

| Bileşen | Ne yapar | Ana parametreler |
|---|---|---|
| `D.capStyle` (V alanları döner: `...D.capStyle({...})`) | ders altyazısı: Manrope, beyaz, koyu yarı saydam TEK yuvarlatılmış kutu (dengeli satırlar, kutu en uzun satıra daralır), en fazla 2 satır; `place` pencereleri altyazıyı başka yere taşır (motorun `V.capAt`'ını üretir, cx/box her kareden önce `M.F.cap`'e yazılır) | `fs (42), fsMin (38), lh, bg, y (902), cx, box (1360), place: [{a, b, y, cx, box, maxLines}]` (sınırları blok başlarına koy: `D.blockAt(i) - .02`; tek satır geniş mod `{y: 932, box: 1640, maxLines: 1}` slaydın alt öğelerini açık bırakır) |
| `D.topic` | küçük sabit konu çipi "Bölüm 1 · Temeller › <konu>"; konu değişince yazı yerinde değişir (genişlik yumuşak) | `items:[{t, text}], prefix, x, y (54), anchor 'left'|'right', size (20), t, out, hide:[[a,b]] (slayt başlığına binen anlar), theme, icon, lh, pad` (`lh`/`pad` isteğe bağlı ince hap: satır yüksekliği + CSS padding; 24 px + `lh: 1.12, pad: '.07em .8em .07em .6em'` → 32 px yükseklik, y 54–86, başlık y ≥ 88 olan slaytlara binmez) |
| `D.note` | sabit not kartı: üst etiket (+ ikon), başlık, maddeler kendi anında gelir, kart içeriğiyle uzar (boş kutu yok); `arrow` odak tarafını gösterir | `x, y, w, anchor 'top'|'bottom' (bottom: y alt kenar, yukarı uzar), kicker, kickerSize (isteğe bağlı px; vars. max(18, size·.76)), icon, title, items:[{text, t, icon:'check'|'x', accent}], numbered, chips (hap biçimi), size, pad, gap, theme 'dark'|'light', arrow 'left'|'right'|'up'|'down', t, out` |
| `D.term` | terim kartı: "TERİM" etiketi + terim + karşılık + kısa açıklama; `inline` → tek satır hap (dar boşluk) | `x, y, w, term, tr, def, kicker, kickerSize (isteğe bağlı), size, theme, inline, anchor, t, out` |
| `D.mark` | slayttaki bölgeye vurgu (kaynak px, yakınlaşmayla birlikte): `box` çizilen yuvarlak çerçeve, `hl` fosfor (multiply katmanında, `sweep` ile konuşmayla soldan dolar), `under` marker alt çizgi, `pulse` halka nabzı, `spot` bölge dışı soluklaşır; `seq` ile vurgu bölgeden bölgeye kayar | `rect:[x,y,w,h] | seq:[{t, rect, frame}], kind ('box'|'hl'|'under'|'pulse'|'spot', birleşik: 'box+under'), spot (0..1), veil ('r,g,b'), pad, r, color, width, draw, move, sweep:[a,b], hl, times (pulse), t, out` (aynı anda tek spot; uzun süreli spot slaydı soluk bırakır, kısa tut) |
| `D.veil` | tam ekran perde (not anında slayt soluklaşır; data-safe=ignore) | `t, out, a, color, fade` |
| `D.callout` | ok + etiket: hedef kaynak noktası, etiket yanında (ör. İngilizce arayüze Türkçe karşılık); `arrow: false` → oksuz etiket hedefe yaslanır | `to:[x,y], text, sub (özgün ad), side, dist, size, color, theme, arrow, t, out` |
| `D.speed` | hızlandırma rozeti "▶▶ ×N hızlandırıldı" (oklar sırayla parlar) | `x, y, anchor 'right'|'left', n, text, size, theme, t, out` |
| `D.blur` | gizlilik bulanıklığı (backdrop-filter; kaynak px, yakınlaşmayla birlikte; data-safe=ignore) | `rect, px, r, tint, fade, t, out` |
| `D.steps` | adım izleyici hap "Adım 2/6 · Kurulum" + nokta dizisi; adım değişince sayı ve yazı yerinde değişir | `items:[{t, text}], total, label ('Adım'), x, y, anchor, size, dots, theme, t, out` |
| `D.hold` | taban görüntüdeki istenmeyen anı sabit kareyle örter (yakınlaşma geometrisiyle aynı yer) | `src ('work/....jpg'), a, b, fade` (`L.scene({z: 2, parts: [D.hold(...)]})`) |
| `D.layer` | `L.scene` + karışım modu (fosfor için `blend: 'multiply'`; sahneler ayrı yığın bağlamı) | `L.scene` alanları + `blend` |
| yardımcılar | `D.pt(x, y)`, `D.rect([x,y,w,h])` kaynak → ekran (o kare), `D.cam()`, `D.blockAt(i)` (kelimenin altyazı bloğu başı), `D.ic(ad)` ikon SVG (note, book, bulb, info, map, layers, check, x, flag, help, ff, arrowL/R/U/D), `D.pre(f)` renderAt öncesi kanca | |

### Kapak bileşenleri (`comp/kapak.js`, global `KP`; v1)
Kapak reklam dili: konuşmacı %100 tam ekran, grafikler V.matte kişi maskesiyle ARKASINDA, sanal çift kamera, sade iri tek satır altyazı. plan.json `"matte": true`, `"libs": ["kapak"]`; engine.js / library.js'e dokunmaz. Örnek: `ornekler/kapak-dili/video.js` (9x16 reklam alanı + 1x1). Ayrıntılı API dosyanın başında.
- **Motor:** `...KP.look(F)` (stil 2, sade, `capMaxLines: 1`, capY 9x16 1186 / 1x1 965, faceFilter + vinyet, introZoom/flaş/itme yok, Manrope). Altyazı blokları `plan.chunks`'ta ≤ ~20 harf (tek satır: yakın kadrajda ağza binmez). 1x1'de `headroomFull: ~214` (başın üstünde yazıya yer).
- **Sanal çift kamera:** `const cam = KP.cams([{t: 0, z: 1}, {t, z: 1.3, fx: .38}, ...])` -> `layout: cam.layout, jumpSkip: cam.jumpSkip`; `cam.cuts` = kareye yuvarlanmış kesme anları (nesne `out`'ları buna bağlanır). Kesme anında (layout `d: 1e-4`, motor değişikliği yok); `t` jump'a ±.45 s yakınsa tam o kareye alınır (jump cut örtülür). Kesmeler cümle başında ya da cümle içi ≥ .25 s duraklamada; her kadraj ≥ ~2.5 s; arka plan değişimiyle aynı kare değil. Yakında yüz yana (fx .38 / .62), karşı tarafta nesne. Kişi öne eğildiği anı yakına koyma (ağız altyazıya iner).
- **Yerleşim (9x16 geniş):** başın üstü ~y 269–470 (saç üstü = face_track top × 1920). Yazı bloğunu `base` (son satır taban çizgisi = o aralıktaki en yüksek saç) ile koy; Manrope glif kutusu büyük harfin ~.35 em üstünden başlar: `1.153·s1 + gap + .853·s2 ≤ ~205`. Kanıt nesneleri yakında yüzün karşı tarafında (~x 680–1010 ya da 65–410, y 300–840) ya da genişte başın yanında (≤ 260 px genişlik).

| Bileşen | Ne yapar | Ana parametreler |
|---|---|---|
| `KP.stage` (V.matte döner) | oda kararır + derinlik bulanıklığı, koyu marka zemini (#studio), son kare donar | `dark: [{a, b, v (.16), in, out, start}]` (a ≤ 0: açılıştan kararık), `blur`, `choke` |
| `KP.cover` (sahne) | kapak başlığı kişinin arkasında, t=0'da okunur, yerinde ölçek + opaklık; anahtar kelime sarı | `lines, key, x, base \| top, sizes, w, gap, lh, pre (.3), out, outDur` |
| `KP.word` (sahne) | dev arka kelime (büyük harf), satırlar kendi kelimesinde belirir | `id, lines: [{text, t}], key, base, sizes (ör. [76, 116]: küçük beyaz + dev sarı), out` |
| `KP.silk` (sahne, z 3) | ipek kumaş zemin anı (PR.silk algoritması + kıvrım sıklığı, lacivert/mavi, hafif altın parıltı) | `t, out, fade, outDur, fold (1.9), colors, speed, angle` |
| `KP.glass` | cam kart kabuğu (#0E1A33, ince gök mavisi çizgi, yumuşak gölge) | `x, y, w, h, r, t, out, html, render` |
| `KP.curve` | yükselen hız / gelir eğrisi (sayısız), etiket hapı, eğriden yeni dallar | `x, y, w, h, t, draw: [a, b], label: {text, t}, tone: 'speed' \| 'revenue', branches: [{t, at, rise}], out` |
| `KP.noteToPhone` | yapışkan not -> uygulama ikonuna dönüşür, telefonda ekran kurulur, yeşil tik | `x, y, w, h (telefon), note: {text, t, rot}, phone: {t, build, check}, out` |
| `KP.paperToPanel` | kâğıt tablo (elle tikler) -> panel (dashboard) + ilerleme çubuğu hızla dolar + tik | `x, y, w, h, paper: {t, ticks, rot}, panel: {t, build}, progress: {t, dur}, out` |
| `KP.phone` · `KP.browser` · `KP.browserPhone` | yazısız uygulama / site iskeleti, sırayla kurulur | `x, y, w, h, t, build: [a, b], check, out` |
| `KP.progress` | cam hap ilerleme çubuğu (şimşek, sonda tik) | `x, y, w, h, t, fill: [a, b], label, out` |
| `KP.clock` | saat kartı (rakamsız), yelkovan hızla döner, yay dolar, etiket hapı | `x, y, size, t, spin: [a, b], turns, label: {text, t}, out` |
| `KP.crowd` | avatar kalabalığı (yüzsüz, marka renkleri), merkezden dolar, sarı halka süpürmesi | `x, y, w, h, cols, rows, t, fill: [a, b], lit: [a, b], seed, out` |
| `KP.chip` · `KP.link` · `KP.code` | cam çip (sarı üstü çizgi), bağ çizgisi, kod penceresi kartı (üstü çizilir) | `text, icon, x, y, size, anchor, t, strike: {t}, out` · `from, to, t` · `x, y, w, h, t, strike, out` |
| `KP.logo` | marka logosu (koyu zemin sürümü) cam kartta + CTA hapı (ör. 'Katıl →'; karta sığdırılır); `card: false` yalnız koyu zeminde | `x, y, w, t, out, card, pill: {text, t, size}` |
| `KP.cta` | büyük beyaz düğme + 2 aşağı ok, tek yumuşak nabız (önde; altyazıyı `hideCaptions` ile kapat) | `text, x, y, w, h, size, t, pulse, chev: {size, gap, dy}, out` |
| `KP.close` (sahne, z 7) | donmuş kare lacivert zemine kararır; logo, adres, slogan | `t (C.end), logoW, y, urlSize, sloganSize` |

### Yatay tanıtım bileşenleri (`comp/topluluk.js`, global `TP`; v1)
16:9 yatay tanıtım / platform turu dili (onaylı uzun yatay site tanıtımından genelleştirildi). plan.json `"libs": ["topluluk"]`; engine.js / library.js'e dokunmaz. Örnek: `ornekler/yatay-tanitim/video.js` (hoş geldin videosu). Proje video.css'i yalnız `#cap` / `#bg` görünümünü verir; bileşen stilleri (`.yc`, `.ypill`, `.pn`…) kütüphanede enjekte edilir.
- **Kadraj:** konuşmacı tam ekranda, `layout` anahtarları `{mode: 'full', zoom: 1.2, fx: .36}`; animasyonlar sağda (x ~1052-1824). Tam ekran panel anı = `{t: a, mode: 'hidden'}` … `{t: b, mode: 'full', zoom: 1.2, fx: .36}` + panel `uKeys` `{t: a + .4, to: 1}`, `{t: b - .75, to: 0}` (önce kişi söner, sonra panel büyür; dönüşte panel küçülür, kişi sonra belirir). Yalnız tam ekran blokları (`only: 'full'`) küçülme BAŞLAMADAN (`out: b - .75`) sönsün.
- **Okunurluk (960 px oynatıcı):** panel içerik tabanı 28 px (`kc` 1.75 × 16), kart maddeleri 30-32 px, çipler ≥ 26 px.

| Bileşen | Ne yapar | Ana parametreler |
|---|---|---|
| `TP.panel` (sahne) | platform paneli: tek arayüz sağ pencere (u 0) <-> tam ekran (u 1); kabuk, menü, bloklar yeni yerlerine akar. Menüde aktif öğe kayar; `drawer` pencerede menü çekmecesi açar (etiketli, içerik kararır); `ghosts` kesik çizgili kilitli "Yakında" öğeleri (adsız); `ring` menü öğesine nabız halkası; imleç `{menu}`, `{blk}`, `{sel}` hedeflerine gider ve tıklar | `id, from, to, win, full, menu:[[anahtar, etiket, ikon]], user:{name, sub, initials}, uKeys:[{t,to,d}], enter:{t,d,s,stagger}, out, active:[{t,key}], drawer:[{a,b}], ghosts:{t,n,label,icon,wiggle,out}, ring:[{key,a,b}], bell:{jig,dot}, cursor:[{t,to,d,click,hold}], blocks:[{id,t,out,W,F,html,upd(t,el,g),fx,d,only,moves:[{a,b,W,F}],z,fs}], url` (W/F içerik alanına göre px: pencere 650 × ~650, tam ekran 1378 × ~650) |
| `TP.browser` | aynı kabukta tarayıcı penceresi: adres harf harf yazılır, sayfa (`page` html) `pageT`'de yüklenir; `after` ile adres değişir | `x,y,w,h, t, out, url:{a,b,text}, after:{t,text}, page, pageT, upd` |
| `TP.it` · `TP.path` · `TP.cursor` | süzülen parça (up / pop / fade / left giriş, inCubic çıkış; `upd` içeriği canlandırır) · çizilen yol · bağımsız fare imleci (tıklama halkası) | `x,y,w,h,html,t,out,fx,d,dy,od,upd` · `d, box, t, dur, out, color, w` · `[{t,to,d,click,hold}]` |
| `TP.scrim` · `TP.endCard` | sağ sahne koyuluğu (yalnız tam ekranda görünür, data-safe=ignore) · son kart: logo maskeyle açılır, arkasında yörünge ışığı, adres + slogan (tanıtım videosuyla aynı) | `on:[[a,b]], x` · `t (C.end), total (C.total), w, y` |
| yardımcılar | `TP.ic / icE` çizgi ikonlar (`TP.ICO`: home, book, library, users, calendar, zap, chat, tool, star, link, copy, mail, flag, hand, send, lock, …), `TP.kick` üst etiket, `TP.chk` yeşil tik, `TP.card / plain / title / postHead / postCard / skel / eduBadge / vCard (logosuz dikey video kartı) / thumbBg`, `TP.popIn / tickUpd`, zaman `TP.eo / ei / io / bump` | |

### Yeni bileşen gerekirse
İçerik kütüphanede yoksa (ör. grafik çubuğu, telefon ekranı, sayaç, karşılaştırma tablosu) **`comp/library.js`'e genel bir bileşen ekle**, video.js'e gömme:
- Biçim: `L.adi = ({...param, t}) => ({ html, render(t, root) { ... } })`; stil `comp/base.css`'e `.c-adi` sınıfıyla.
- Tüm zamanlar parametre; giriş `spring`, çıkış `E.inExpo`; renkler `var(--...)`; t'den saf fonksiyon (Date/rastgele yok, sarsıntı tohumlu).
- Tabloya ve buraya bir satır ekle. Mevcut bileşenlerin varsayılan davranışını değiştirme; yeni seçenekleri isteğe bağlı ekle.
- Yalnızca o videoya özel küçük stil: `projects/<slug>/video.css` (otomatik yüklenir).

### Stil 2 notları
- Kart geometrisi: x 120, y 780, w 840 (h ekran altına kadar). Üst grafikler y 250–740 arasında durur.
- Kadraj `work/face_track.json`'dan otomatik kurulur: saç üstü kesilmez, yüz yatayda ortalanır. Kartta zoom vermene gerek yok, varsayılan 1.0'dır.
- Güvenli alan sabitleri `M.SAFE` içindedir: `{x0:70, x1:1010, y0:250, y1:1500, railX:930, railY0:1000, railY1:1720}`. Bileşen yerleşiminde ve girişlerde bu sınırları kullan.
- Denetim: `./studyo safe <slug>`. Taşan elemanı saniyesi ve kutusuyla raporlar.
- Altyazı stil 2'de motor tarafından çizilir (cümle düzeni, 58 px, koyu zemin, merkez y 1395). `capY` ile değiştirme; çakışma varsa grafiği taşı.

## v3: tür, formatlar, mikro, montaj

### plan.json ek alanları
```jsonc
{
 "kind": "face" | "montage" | "mixed",       // prep tahmin eder, soru turunda onaylanır
 "orient": "v" | "h",                         // kaynağın yönü (prep yazar)
 "formats": ["9x16", "1x1", "16x9"],           // paket: ./studyo package <slug>
 "captions": "vurgulu" | "sade" | "yok",
 "density": "sahne" | "mikro" | "karma" | "yok",
 "topic": "konu.txt içeriği",
 "base": {                                     // montage / mixed
   "kind": "montage",
   "clips": [                                  // montaj: start..end boşluksuz; 'from' yoksa öncekinin 'to'su
     { "from": "start", "to": {"word": 10, "off": -0.2}, "clip": "pencere", "in": 0.5, "move": "push-in" },
     { "to": {"word": 18}, "clip": "ofis", "in": 0, "move": "pan-left", "speed": 0.9, "fade": 0.2 },
     { "to": "end", "clip": "sokak", "in": 1.0, "move": "static", "focus": [0.5, 0.4] }
   ]                                           // karışık: yalnızca ara görüntü aralıkları ({from,to} zorunlu)
 }
}
```
- `clip`: `work/broll/index.json`'daki `id` (dosya adından türetilir). Klibe bakmak için `work/broll/sheets/<id>.jpg` ve `overview_*.jpg` kullanılır.
- `move`: push-in | pull-out | pan-left | pan-right | static. Elle ayar için `kb: {"from":[s,cx,cy],"to":[s,cx,cy]}`.
- Kesim sonrası timeline'a şunlar yazılır:
  - `base.clips[].f0/f1`
  - `cutaways` (karışık)
  - montajda `jumps: []` (jump-cut zoom'u kapalı)

### video.js: çok formatlı yazım
```js
defineVideo(F => ({               // F.id: '9x16' | '1x1' | '16x9'
  style: 2,
  layout: F.pick({ '1x1': [{ t: 0, mode: 'card' }, ...], default: [...] }),
  scenes: [
    L.hook({ ..., box: F.pick({ '9x16': undefined, default: { ...M.R.hook, titleTop: 90 } }), size: F.pick({ '9x16': 104, default: 80 }) }),
    L.scene({ id: 'gfx', under: true, parts: [
      L.frame({ design: [70, 250, 940, 490], into: M.R['gfx.card'], parts: [ /* 9x16 koordinatlarıyla tasarlanmış parçalar */ ] }),
    ] }),
    L.endCard({ t: C.end }),      // konumları formats.json 'end'den alır
  ],
}));
```
- `F.pick({ '9x16': a, '1x1': b, default: c })`: format başına değer seçer.
- **Bölgeler:** `M.R` (`hook`, `gfx.full`, `gfx.full.left`, `gfx.full.right`, `gfx.card`, `gfx.hidden`, `cap`). Yardımcılar: `M.place(bölge, {w,h,ax,ay})` ve `M.fit(tasarım, bölge)`.
- `L.frame`: 9x16 için tasarlanmış alt kompozisyonu bir bölgeye ölçekleyip taşır. Kimlik eşlemede DOM'u değiştirmez.
- **`box` parametresi:** L.hook `{x,y,w,titleTop}` + `chipSize`, L.banner `{x,y,w}` + `size`, L.label `{x,y,w}`, L.pointer `{x,w}`.
- **9x16 dalı:** önce 9x16'yı tasarla; diğer formatları `F.pick` ile ondan türet (9x16 değerleri formatlar eklenince değişmesin).

### Mikro bileşenler (yerleşim otomatik: M.slot)
| Bileşen | Parametreler |
|---|---|
| `L.sticker` | `{icon, text, color, ink, t, out, prefer, at}` (ikon: L.I anahtarı; dumbbell, spark, bolt, heart, chat, time, bell, doc, check…) |
| `L.keyword` | `{text, color, ink, t, out}` |
| `L.notif` | `{app, title, body, icon, t, out}` (640 px geniş; 1x1'de çoğu zaman sığmaz) |
| `L.counter` | `{from, to, prefix, suffix, decimals, grouping, dur, label, t, out}` (yıl için `grouping: false`) |
| `L.ring` | `{at:{x,y,r}, t, out, color}` (elle konum) |
| `L.progress` | `{a, b, color}` |

- **Mikro elemanlar** `L.scene({id:'micro', parts:[...]})` içine konur.
- **Konumlar** sayfa açılışında zaman sırasıyla çözülür (deterministik). Yer yoksa render konsolu ve `safe` "MİKRO YER YOK" der.
- **Motor API'si:**
  - `M.face(t)` → `{ok, face, head, avoid, clip}` (ekran koordinatı)
  - `M.headSpan(a,b)`
  - `M.slot({a,b,w,h,prefer,at})`

### Komutlar (format)
- `./studyo render|safe|final <slug> [9x16|1x1|16x9|all]`
- `./studyo package <slug>`
- `./studyo sheet <slug> 0.5 <fmt>`
- `node comp/render.mjs projects/<slug> stills t1,t2 --fmt 1x1`
- `node comp/render.mjs projects/<slug> fsheet t1,t2,...` (planın formatları yan yana → `work/qa/fsheet.jpg`)
- **Çıktı yolları:** 9x16 için `work/`, diğer formatlar için `work/fmt/<id>/`. Final dosyaları `output/<slug>/<slug>_<fmt>.mp4`.

### Kurgu: ham uzun kayıt (`plan.edit`)
```jsonc
"edit": {
  "keep": [[56, 64], [5, 24], [25, 31], [32, 45], [46, 53], [54, 55], [109, 110]],   // kaynak kelime aralıkları, İSTENEN SIRADA
  "_not": "S7 kanca -> S2 -> S3 (S9 yerine, S2'nin devamı) -> S4 -> S5 -> S6 -> S12; S1/S8/S9/S10/S11 atıldı"
}
```
- Aralıklar `work/takes.md`'nin sonundaki kelime indekslerinden alınır (`S7=[56,64]`).
- Kaynakta bitişik ve sırası korunan aralıklar otomatik birleşir. Birleşen aralıkların içindeki duraklamalar `cut` ayarlarıyla kısalır.
- `edit` varken `extra_cuts`, `src_start` ve `src_end` kullanılmaz.
- Atılan alımların kelimeleri timeline'da yoktur. Cue ve chunk'lar yalnızca tutulan kelimelere bağlanır.
- `cut.edge_pre`, `edge_tail` ve `end_tail` ile parça kenarlarındaki nefes payı ayarlanır. Atılan kelimeye komşu kenarda pay otomatik kısalır. `cut.pre_vowel` (isteğe bağlı, yeni projelerde .10) ünlüyle başlayan kelimelerin önüne daha geniş pay bırakır. `cut.fade_out_ms` (isteğe bağlı, vars. 6) parça sonu ses fade'ini uzatır; nefes kuyruğu sert kesiliyorsa 20–25 kullan.
- **Kelimeye özel kesim payı:**
  - `cut.hold: {"<kelime indeksi>": saniye}`: o kelimeden sonraki kuyruk. Hem iç duraklamalarda hem parça sonunda geçerlidir.
    - Kısaltmak: kelimeden sonra kalan küçük ses (nefes, "ıı", sonraki kelimenin başı). Örnek: "kazandı?" sonrası `0.05`.
    - Uzatmak: Whisper'ın böldüğü kelime ("3 .8") ya da efekt için tutulan duraklama. Örnek: "sonuçlar" sonrası dosyadan çalan jenerik efektine yer açmak için `1.9`.
  - `cut.pre_word: {"<kelime indeksi>": saniye}`: o kelimenin önündeki pay. Önünde "ııı" kırıntısı kalıyorsa küçült (ör. "Ama" `0.06`).
