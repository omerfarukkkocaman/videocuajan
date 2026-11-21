// ÖRNEK: editoryal-premium — sakin, az elemanlı "dergi" dili; marka / hizmet / site tanıtımı (40+ kitle).
// Ne zaman: güven ve kalite hissi istenen tanıtım; bölüm başlıkları (01-06), alt bantlar, ince çizgi ikonlar, logo kapanışı. Damga/flaş/sarsıntı yok.
// Plan stili: kind face, density sahne (ama sakin), captions sade, formats ['9x16'], libs yok (L.* v7 bileşenleri), son kart yerine logo kapanışı.
// Cue'lar (C.<ad>; C.end/C.total motordan): wipe2, gorusmek, cardUp1, expand1, cardUp2, wipe1, cardUp3, expand3, cardUp4, expand4, cardUp5, expand5, cardUp6,
//   expand6, ch1, answer, ch3, fikir, ch5, ch2, web, ch6, sifir, adim, yas, uygun, otomasyon, gelisim, edit, mobil,
//   otel, rezervasyon, mali, otomatize, hali, odeme, randevu, onlarca, hayata, ogren, biz
// Görseller projenin gorsel/ klasöründen: gorsel/vitrin_filmstrip.jpg + gorsel/vitrin_wave.png (videonun kendi karelerinden ve ses dalgasından
//   üretilmiş şerit; kurgu vitrini için). Ekran metinleri yer tutucudur; kişi adı / unvan / marka kendi projenden gelir.
// STİL: EDİTORYAL PREMİUM: derin lacivert/siyah, sıcak altın (#C9A45C), kırık beyaz (#F4F1EA); yalnız Montserrat (ince başlık, geniş aralıklı
//   üst etiket, italik cevap); ince çizgiler, ince çerçeveli kartlar, bol boşluk. Damga, flaş, sarsıntı, sekme YOK. Girişler fade + kısa kayma ya da
//   çizgi çizimi (.5-.8 s ease-out), çıkışlar .4 s; her eleman >= ~1.5 s ekranda (40+ kitle). Kamera: tam ekranda kesintisiz yavaş yakınlaşma
//   (V.slowPush), vurgu anlarında yumuşak punch-in (.03-.05), sinematik renk (V.faceFilter) + vinyet ve üst/alt koyu geçiş (V.vignette),
//   kart çerçevesi ince altın çizgi (V.cardRing/V.cardR), altyazı sade ve iri, hl kelimeler altın (V.capColors).
// Mod sırası: full (kanca: soru -> cevap) -> full (01 Eğitmen, alt bant) -> card (02 Program: sıfırdan adım adım) -> full (03 Kimler için)
//   -> card (Romen rakamlı liste) -> hidden (04 bölüm açılışı, çizgi tarayıcı + telefon) -> card (BU VİDEONUN gerçek kurgu şeridi)
//   -> full (05 Öğrenciler, üç ince ikon) -> card (01 Otel sahibi, rezervasyon takvimi) -> full (02 Mali müşavir, belge -> dişli)
//   -> hidden (03 Halı saha: saha, ödeme kartı, randevu ızgarası) -> card (onlarca öğrenci, sayısız) -> full (yazılım bilmiyorlardı: yalnız yüz)
//   -> card (06 Sıra sizde: yükselen rota) -> full (logo imzası) -> logo kapanışı (kararma + büyük logo, altın halka). Kullanıcı adı/döngü/takip kartı yok.
// Yüz kaynakta sola yakın (x≈0.41): tam ekran zoom 1.12 ile ortaya yaklaşır; saç üstü motorun kafa-güvenli kadrajıyla korunur.
// Tüm zamanlar plan.json cues'tan (C.xxx) ya da kelime başlangıcından (word(i).s) gelir; elle saniye yok.
const END = C.end, TOTAL = C.total;
const ws = i => word(i).s;
const TLD = window.TIMELINE;
const CUTS = [0, ...TLD.jumps, TLD.duration];                  // bu videonun gerçek kesimleri (çıkış saniyesi)
const ce = i => TLD.chunks.find(c => c.w.some(w => w.i === i)).e;   // kelimenin altyazı bloğunun bittiği an
const WIPE2 = C.wipe2 - .15;                                   // görsel silme 0.15 s önce başlar: kesim (61.77) silmenin altında kalır, silmenin ortası ses cue'suna denk (cue aynı)
const JG = TLD.jumps.find(j => j > C.gorusmek - .3);           // kapanış cümlesi ("… görüşmek üzere") kesimi (nötr -> gülümseme): sıcak punch-in burada
const FREEZE = END - .2;                                       // kapanış: göz teması kopmadan önceki kare donar
const FACEF = 'contrast(1.07) saturate(.86) sepia(.1) brightness(.98)';

defineVideo(F => {
  const ZF = 1.12;                                             // tam ekran: yüz ortaya yaklaşsın
  const CH = { x: 70, y: 264, size: 34 };                      // bölüm başlığı (sol üst, hep aynı yer)
  const LT = { x: 70, y: 1166 };                               // alt bant (altyazının üstünde, sol hizalı)

  return {
  style: 2,
  frameShift: true,
  introZoom: false, introFlash: false,                         // flaş yok; ilk kare = kanca
  transScale: 1.3,                                             // mod geçişleri 1.3 kat yavaş (40+)
  capFs: 64, capFsMin: 50, capMaxLines: 1,                     // sade, iri altyazı; tek satır (alt bantla üst üste 4 satır olmasın)
  capColors: { hl: '#D9B56E' },                                // hl kelimeler ince altın (okunurken değişmez)
  faceFilter: FACEF,
  vignette: { edge: .42, top: .66, topH: .34, bottom: .5, bottomH: .3 },
  slowPush: { rate: .0045, max: .07 },
  cardRing: { w: 2, color: 'rgba(201,164,92,.95)' }, cardR: 22,
  fonts: ['200 40px Mont', '300 40px Mont', '600 40px MontI'],
  layout: [
    { t: 0, mode: 'full', zoom: ZF },
    { t: C.cardUp1, mode: 'card' },
    { t: C.expand1, mode: 'full', zoom: ZF },
    { t: C.cardUp2, mode: 'card' },
    { t: C.wipe1, mode: 'hidden' },
    { t: C.cardUp3, mode: 'card' },
    { t: C.expand3, mode: 'full', zoom: ZF },
    { t: C.cardUp4, mode: 'card' },
    { t: C.expand4, mode: 'full', zoom: ZF },
    { t: WIPE2, mode: 'hidden' },
    { t: C.cardUp5, mode: 'card' },
    { t: C.expand5, mode: 'full', zoom: ZF },
    { t: C.cardUp6, mode: 'card' },
    { t: C.expand6, mode: 'full', zoom: ZF },
  ],
  punches: [
    { t: ws(195), amt: .05, z: 1, f: .45, until: C.cardUp6 + .5 },      // "Ve üstelik … yazılım bilmiyorlardı": yavaş punch-in, grafik yok
    { t: JG, amt: .045, z: 1, f: 1.3, until: TOTAL + 1 },               // kapanış cümlesi: sıcak punch-in tam kesimde başlar (ifade değişimi)
  ],
  shakes: [], flashes: [],
  hideCaptions: [[END - .35, TOTAL + 1]],                      // kararma başlarken ("üzere" 90.98'de biter) altyazı kalkar

  scenes: [
    // okunurluk zeminleri (yazıların altında; 40+ kontrast): kanca üst bandı + cevap yeri, tam ekrandaki bölüm başlıkları, sektör ikonları
    L.scene({ id: 'scrim', parts: [
      L.scrim({ x: 540, y: 360, w: 1500, h: 520, a: .66, t: 0, out: C.ch1 + .2 }),
      L.scrim({ x: 540, y: 1226, w: 1180, h: 360, a: .74, t: C.answer - .15, out: C.ch1 + .2 }),
      ...[[C.ch1, C.ch1 + 2.7], [C.ch3, C.fikir - .05], [C.ch5, ws(376) - .15]].map(([a, b]) =>
        L.scrim({ x: 250, y: 282, w: 1240, h: 300, a: .8, t: a - .1, out: b + .1 })),
      L.scrim({ x: 540, y: 340, w: 980, h: 300, a: .6, t: ws(376) - .15, out: C.cardUp4 + .6 }),
    ] }),

    // 0 - 5.5 s: kanca (dergi kapağı) — t=0'da üst etiket + soru okunur, soru yerinden kımıldamaz. C.answer'da ('yapay zekâyla')
    // cevap kendi ayrı yerinde (yüzün altında, koyu zemin üstünde): altın çizgi ortadan çizilir, 'Yapay zekâ.' (italik, açık altın) belirir
    L.coverHook({ kicker: 'ÖRNEK MARKA · TANITIM', kickerSize: 26, lines: ['Bu videoyu', 'kim kurguladı?'], sizes: 86, top: 262,
      answer: { text: 'Yapay zekâ.', t: C.answer, y: 1160, size: 76, line: 240, out: C.ch1 - .05 }, out: C.ch1 - .05 }),

    // bölüm başlıkları (sol üst; gizli sahnede ortada bölüm açılışı)
    L.scene({ id: 'ch', parts: [
      L.chapter({ num: '01', title: 'Eğitmen', ...CH, t: C.ch1, out: C.ch1 + 2.7 }),
      L.chapter({ num: '02', title: 'Program', ...CH, t: C.ch2, out: C.ch2 + 2.7 }),
      L.chapter({ num: '03', title: 'Kimler için', ...CH, t: C.ch3, out: C.fikir - .05 }),
      L.chapter({ num: '04', title: 'Neler yapabilirsiniz', x: 540, y: 740, size: 38, stack: true, t: C.wipe1 + .41, out: C.web - .1 }),
      L.chapter({ num: '05', title: 'Öğrenciler', ...CH, t: C.ch5, out: ws(376) - .15 }),
      L.chapter({ num: '06', title: 'Sıra sizde', ...CH, t: C.ch6, out: C.ch6 + 2.7 }),
    ] }),

    // 8.4 - 14.8 s: alt bant — altyazıyı tekrar etmesin: isim, adın söylendiği altyazı bloğu bitince; unvan, unvanın söylendiği blok bitince gelir;
    // kart küçülmeye başlarken söner
    L.scene({ id: 'ltKisi', from: ce(291), to: C.cardUp1 + .5, parts: [
      L.lowerThird({ ...LT, size: 104, name: 'Ayşe Yılmaz', sub: 'Kurucu · Örnek Marka', nameSize: 46, subSize: 28,
        t: ce(291) + .05, subT: ce(300) + .05, out: C.cardUp1 + .45, plate: true }),
    ] }),

    // 14.3 - 21.2 s: kart — taban çizgisi; "sıfırdan"da büyük ince '0'; "adım adım … koyarak"ta basamaklar altınla çizilir
    L.softScene({ id: 'program', from: C.cardUp1, to: C.expand1 + .6, under: true, parts: [
      L.stepChart({ x: 110, y: 332, w: 860, h: 396, steps: 3, t: ws(65), zero: { t: C.sifir, size: 150 },
        lit: [C.adim, ws(319), ws(321)], out: C.expand1 + .45 }),
    ] }),

    // 20.3 - 21.8 s: "yaş"ta hap (yüzün üstünde; kart genişlerken de okunur kalır, 03 başlığı gelirken söner)
    L.softScene({ id: 'yas', from: C.yas - .05, to: C.ch3 + .4, parts: [
      L.pill({ text: 'Her yaş için', x: 120, y: 344, size: 36, t: C.yas, out: C.ch3 + .35 }),
    ] }),

    // 22.7 - 36 s: kart — Romen rakamlı liste; "tam size göre"de üç satıra sırayla ince altın tik
    // kart düşerken (C.wipe1) liste söner; '04' bölüm açılışı ancak liste gidince gelir (listenin 4. maddesi gibi okunmasın)
    L.softScene({ id: 'kimler', from: C.cardUp2, to: C.wipe1 + .5, under: true, parts: [
      L.romanList({ x: 80, y: 328, w: 920, rowH: 130, size: 45, check: { t: C.uygun, stagger: .12 }, out: C.wipe1 + .4, items: [
        { num: 'I', icon: 'bulb', text: 'Bir yazılım fikri', t: C.fikir },
        { num: 'II', icon: 'gear', text: 'İşinizi otomatikleştirmek', t: C.otomasyon },
        { num: 'III', icon: 'trend', text: 'Kendinizi geliştirmek', t: C.gelisim },
      ] }),
    ] }),

    // 34.9 - 41.6 s: gizli sahne -> kart — '04' çıkarken tarayıcı çerçevesi çizilmeye başlar, "web"de iskeleti kurulur, "mobil"de telefon;
    // kart yükselirken üst banda çekilir
    L.softScene({ id: 'cihaz', from: C.wipe1 + .1, to: C.edit, under: true, parts: [
      L.group({ origin: { x: 540, y: 300 }, start: { y: 250 }, moves: [{ a: C.cardUp3 - .25, b: C.cardUp3 + .55, y: 0 }], parts: [
        L.lineDevice({ kind: 'browser', x: 96, y: 330, w: 620, h: 400, t: C.web - .45, build: { a: C.web + .15, b: C.web + 1.1 }, out: C.edit - .25 }),
        L.lineDevice({ kind: 'phone', x: 752, y: 296, w: 214, h: 434, t: C.mobil, build: { a: C.mobil + .35, b: C.mobil + 1.2 }, out: C.edit - .25 }),
      ] }),
    ] }),

    // 41.9 - 45.3 s: VİTRİN — bu videonun gerçek kurgu şeridi: kesimler = klip blokları (içinde gerçek kareler), altında gerçek ses dalgası;
    // imleç baştan şu ana kayar, sonra gerçek zamanı izler; altındaki klip altın çerçeveyle yanar. Etiket 'BU VİDEO'.
    L.softScene({ id: 'vitrin', from: C.edit - .05, to: C.expand3 + .6, under: true, parts: [
      L.cutStrip({ x: 80, y: 376, w: 920, cuts: CUTS, strip: 'gorsel/vitrin_filmstrip.jpg', wave: 'gorsel/vitrin_wave.png', vh: 170, ah: 56,
        t: C.edit, build: { a: C.edit + .15, b: C.edit + 1.0 }, play: { a: C.edit + .55, b: C.edit + 1.8, to: C.edit + 1.8 },
        label: { text: 'BU VİDEO', t: C.edit + .25 }, out: C.expand3 + .45 }),
    ] }),

    // 48 - 50.2 s: tam ekran — "Üçü de farklı sektörlerdeydi": üç ince çizgi ikon (otel, hesap/belge, saha), yazısız
    L.softScene({ id: 'sektor', from: ws(376) - .05, to: C.cardUp4 + .7, parts: [
      L.iconRow({ x: 540, y: 288, icons: ['hotel', 'ledger', 'pitch'], size: 104, gap: 110, t: ws(376), stagger: .2, color: '#F4F1EA',
        out: C.cardUp4 + .55 }),
    ] }),

    // 49.6 - 56.4 s: kart — üst başlık '01 · Otel sahibi' ("otel"de); "Kendi otelinin"de takvim ızgarası, "rezervasyonlarını"nda dolu günler
    L.softScene({ id: 'otel', from: C.otel - .2, to: C.expand4 + .6, under: true, parts: [
      L.lowerThird({ x: 70, y: 260, size: 92, num: '01', name: 'Otel sahibi', nameSize: 48, t: C.otel, out: C.expand4 + .45 }),
      L.calendarGrid({ x: 120, y: 392, w: 840, h: 340, cols: 7, rows: 4, t: ws(138), out: C.expand4 + .45, bookings: [
        { r: 0, c0: 1, c1: 3, t: C.rezervasyon },
        { r: 1, c0: 4, c1: 6, t: C.rezervasyon + .2 },
        { r: 2, c0: 0, c1: 1, t: C.rezervasyon + .4, tone: 'ivory' },
        { r: 2, c0: 3, c1: 5, t: C.rezervasyon + .6 },
        { r: 3, c0: 1, c1: 2, t: C.rezervasyon + .8, tone: 'ivory' },
      ] }),
    ] }),

    // 57.5 - 61.5 s: tam ekran — alt bant '02 · Mali müşavir' (numara ve unvan birlikte, "mali"de); "otomatize"de yüzün sağında belge -> dişli kartı
    L.softScene({ id: 'mali', from: C.mali - .05, to: WIPE2 + .05, parts: [
      L.lowerThird({ ...LT, size: 96, num: '02', name: 'Mali müşavir', nameSize: 46, t: C.mali, out: WIPE2 - .4, plate: true }),
      L.iconFlow({ x: 790, y: 468, w: 200, h: 330, from: 'docs', to: 'gear', dir: 'down', t: C.otomatize, tArrow: C.otomatize + .45,
        tTo: C.otomatize + .8, out: WIPE2 - .05 }),
    ] }),

    // 61.6 - 70 s: gizli sahne — silmeden itibaren saha çizgileri çizilir, "halı sahaları"nda tamamlanır; '03 · Halı saha' (numara + unvan "halı"da);
    // "ödeme"de ödeme kartı + altın tik; "randevularını"nda randevu ızgarası, dilimler altınla dolar (rakam/tutar yok)
    L.softScene({ id: 'saha', from: WIPE2 + .1, to: C.cardUp5 + .6, under: true, parts: [
      L.pitch({ x: 200, y: 336, w: 680, t: WIPE2 + .25, dur: C.hali - (WIPE2 + .25), out: C.cardUp5 + .4 }),
      L.payCard({ x: 130, y: 846, w: 340, t: C.odeme, tick: C.odeme + .6, out: C.cardUp5 + .4 }),
      L.slotGrid({ x: 570, y: 846, w: 350, h: 214, cols: 3, rows: 3, t: C.randevu, fillT: C.randevu + .45,
        fill: [[0, 1], [1, 0], [1, 2], [2, 1]], out: C.cardUp5 + .4 }),
      L.lowerThird({ ...LT, size: 96, num: '03', name: 'Halı saha', nameSize: 46, t: C.hali, out: C.randevu + 1.2 }),
    ] }),

    // 69.9 - 77.2 s: kart — "onlarca"da çok sayıda küçük daire avatar yavaşça dolar (rakam yok); "hayata geçirdiler"de soldan sağa altın parıltı
    L.softScene({ id: 'onlarca', from: C.onlarca - .05, to: C.expand5 + .7, under: true, parts: [
      L.avatarField({ x: 130, y: 360, cols: 10, rows: 4, size: 64, gap: 20, t: C.onlarca, fill: { a: C.onlarca + .2, b: ws(190) },
        lit: { a: C.hayata - .45, b: C.hayata + .55 }, seed: 11, out: C.expand5 + .5 }),
    ] }),

    // 80.5 - 86.7 s: kart — '06 Sıra sizde'; "onlarca öğrencimizin…"de altın rota çizilir, "yapay zekâyı öğrenebilir"de son nokta parlar
    L.softScene({ id: 'rota', from: ws(463) - .45, to: C.expand6 + .6, under: true, parts: [
      L.route({ x: 120, y: 356, w: 840, h: 372, pts: [[0, 1], [.25, .8], [.5, .62], [.74, .38], [1, .06]], t: ws(463) - .4,
        draw: { a: ws(463), b: C.ogren - .1 }, glow: C.ogren, out: C.expand6 + .45 }),
    ] }),

    // 86.6 - 90.7 s: tam ekran — "Bizler"de alt bantta yalnız logo avatarı, ince altın halka çizilir (logo zaten yazıyor)
    L.softScene({ id: 'imza', from: C.biz - .05, to: END, parts: [
      L.lowerThird({ ...LT, y: 1150, size: 120, t: C.biz, out: C.gorusmek + 1.0, plate: true }),
    ] }),

    // 91.2 s: göz teması kopmadan son iyi kare donar (renk + vinyet canlı kareyle aynı)
    L.scene({ id: 'freeze', from: FREEZE, z: 5, parts: [L.holdFace({ at: FREEZE, t: FREEZE, dim: .2, blur: 1.5, dur: .5, filter: FACEF })] }),
    // 91.05 - 93.4 s: logo kapanışı — kare yumuşakça kararır (donma bu kararmanın içinde), logo ancak zemin koyulaşınca belirir;
    // ince altın halka C.end+.5'te tamam -> logo 1.5 s tam okunur
    L.scene({ id: 'kapanis', from: END - .4, z: 7, parts: [
      L.logoClose({ t: END - .35, dur: .5, logoT: END - .05, logoDur: .5, ring: { a: END, b: END + .5 }, x: 540, y: 860, size: 340 }),
    ] }),
  ],
  };
});
