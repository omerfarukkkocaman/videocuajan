// ÖRNEK: sahne-3format — tek hikâye, üç formata ayrı yerleşim (kırpma değil). Hareketli anlatım (motion explainer) tarzı.
// Ne zaman: konuşan kafa bilgilendirme / uyarı videosu; kart <-> tam ekran <-> gizli sahne dansı, kinetik kanca, damga, kırmızı bant, takip kartı, son kart.
// Plan stili: kind face, density sahne, captions sade (stil 2 varsayılanı), formats ['9x16','1x1','16x9'], libs yok (yalnız L.* + M.fit), son kart açık.
// Cue'lar (C.<ad>; C.end motordan): web, doc1, doc2, guncel, zorunlu, typeAt, bunlarDocs, enter, igIn, check1, check2, ready, tap, shrink1, wipeIn,
//   reveal, shrink2, expand, shrink3, dikkat, ceza, detay, bakanlik, duzenleme, cal, ocak, yil, yururluk, liste, eksik,
//   guncelDegil
// Ekran metinleri yer tutucudur ("Örnek ..."); kendi videonda yalnız konuşmada geçen ifadeleri yaz. BRAND.tagline brand.json'dan gelir.
// Formatlar: 9x16 (Reels; referans tasarım), 1x1 (kare, 1080x1080), 16x9 (yatay, 1920x1080).
// Her formata özel yerleşim (kırpma değil); hikâye, cue'lar ve sesler aynı.
// Mod sırası: full (kanca) -> card (kurum rozeti + düzenleme belgesi) -> hidden (site + belgeler + damga) -> full (takvim + YÜRÜRLÜKTE)
//             -> card (kontrol listesi) -> full (kırmızı uyarı bandı) -> card (marka sitesi yazılır, takip) -> son kart.
//   1x1: kare kırpımda kafanın üstünde yer yok -> kanca kart modunda açılır (yüz sağ kartta, başlık sol sütunda);
//        tam ekran bölümlerde saç üstü 150 px'e itilir, üstteki bant (y 60-170) grafiklere kalır.
//   16x9: tam ekran = ortada dikey yüz şeridi; kanca (çip + başlık) solda; takvim solda, YÜRÜRLÜKTE sağda;
//        hidden sahne yatay dizilir (site solda, belgeler sağa fırlar); kart sahneleri sol geniş alana 1.17 büyür.
// Tüm zamanlar plan.json cues'tan (C.xxx) ya da kelime başlangıcından (word(i).s) gelir.
// Stil 2: kafa-güvenli kadraj ve sade altyazı motordan; her eleman formatın güvenli alanında.
const END = C.end;
const docIcons = `<i style="transform:rotate(-9deg)">${L.I.doc()}</i><i style="margin-left:-16px;transform:rotate(9deg) translateY(6px)">${L.I.doc()}</i>`;

defineVideo(F => {
  const P = F.pick, R = F.R, V9 = F.id === '9x16', SQ = F.id === '1x1', WD = F.id === '16x9';
  // 9x16'da tasarlanmış alt kompozisyonu formatın bölgesine ölçekler (9x16'da parçalar olduğu gibi)
  const fit = (design, into, parts, o = {}) => V9 ? parts : [L.frame({ design, into, parts, ...o })];
  const CARD9 = [70, 250, 940, 490];                         // 9x16 kart modunun üst grafik bölgesi

  // ---------- hidden: mağaza tarayıcısı küçülüp kenara çekilir; belgeler alt bağlantılarından fırlar ----------
  // G: BR tarayıcı kutusu, O/S/DX/DY grup dönüşümü (ölçek merkezi, ölçek, kayma), d1/d2 belge hedefleri, st damga merkezi
  const gfxParts = G => {
    const brPt = (x, y) => ({ x: G.O.x + (x - G.O.x) * G.S + G.DX, y: G.O.y + (y - G.O.y) * G.S + G.DY });   // grup sonrası nokta
    const foot = G.BR.y + G.BR.h - 28;
    return [
      L.group({ origin: G.O, moves: [{ a: word(14).s, b: word(14).s + .4, ...(G.DX ? { x: G.DX } : {}), y: G.DY, s: G.S }],
        parts: [L.storeBrowser({ url: 'ornekmagaza.com', ...G.BR, t: C.web,
          links: [{ text: 'Örnek Hizmet Sözleşmesi', t: C.doc1 - .2 }, { text: 'Örnek Bilgilendirme', t: C.doc2 - .2 }] })] }),
      L.doc({ title: 'Örnek Hizmet Sözleşmesi', label: 'SÖZLEŞME', kind: 'lines', t: C.doc1,
              from: brPt(G.BR.x + 220, foot), to: G.d1 }),
      L.doc({ title: 'Örnek Bilgilendirme Formu', label: 'FORM', kind: 'form', t: C.doc2,
              from: brPt(G.BR.x + 530, foot), to: G.d2 }),
      L.badge({ icon: 'refresh', x: G.d1.x + 363, y: G.d1.y - 29, t: C.guncel, style: 'yellow', spin: true }),
      L.badge({ icon: 'refresh', x: G.d2.x + 420, y: G.d2.y + 26, t: C.guncel + .1, style: 'yellow', spin: true }),
      L.stamp({ text: 'ZORUNLU', t: C.zorunlu, x: G.st.x, y: G.st.y, rot: -7, size: 110 }),
    ];
  };
  const G9 = { BR: { x: 110, y: 330, w: 860, h: 540 }, O: { x: 540, y: 330 }, S: .62, DX: 0, DY: -50,
               d1: { x: 170, y: 680, rot: -9 }, d2: { x: 470, y: 700, rot: 7 }, st: { x: 540, y: 905 } };
  const gfx = P({
    '16x9': gfxParts({ BR: { x: 530, y: 190, w: 860, h: 540 }, O: { x: 530, y: 190 }, S: .88, DX: -400, DY: 0,
                       d1: { x: 990, y: 220, rot: -9 }, d2: { x: 1305, y: 265, rot: 7 }, st: { x: 1360, y: 500 } }),
    '1x1': fit([100, 270, 880, 900], [60, 60, 960, 780], gfxParts(G9)),          // kare ~ 9x16 kompozisyonu: .87
    default: gfxParts(G9),
  });

  // ---------- marka: belge çipleri -> marka adresi yazılır, sayfa açılır; sonra takip kartı ----------
  // çipler: O merkezli çift; s0 başlangıç ölçeği, m1 tarayıcının alt boşluğuna iner, m2 adres kutusuna çekilip kaybolur
  const chips = ({ O, s0, m1, m2 }) => L.group({ origin: O, start: { s: s0 }, moves: [
      { a: C.typeAt - .35, b: C.typeAt - .05, ...m1 },
      { a: C.typeAt + .02, b: C.typeAt + .3, ...m2 }],
    parts: [
      L.badge({ icon: 'doc', text: 'Örnek Hizmet Sözleşmesi', x: O.x, y: O.y - 50, t: C.bunlarDocs, style: 'yellow', size: 84, out: C.typeAt + .3 }),
      L.badge({ icon: 'doc', text: 'Örnek Bilgilendirme Formu', x: O.x, y: O.y + 50, t: C.bunlarDocs + .1, style: 'yellow', size: 84, out: C.typeAt + .3 }),
    ] });
  const browser = o => L.typeBrowser({ url: 'ornekmarka.com', enterDy: 0, ...o,
    tIn: C.typeAt - .3, typeAt: C.typeAt, enter: C.enter, outAt: C.igIn,
    rows: [{ text: 'Örnek Hizmet Sözleşmesi', check: C.check1 }, { text: 'Örnek Bilgilendirme Formu', check: C.check2 }],
    pill: { text: BRAND.tagline, t: C.ready } });
  const follow = w => L.followCard({ x: 140, y: 270, ...(w ? { w } : {}), tIn: C.igIn, tap: C.tap });
  const brand9 = () => [
    browser({ x: 120, y: 262, w: 840, h: 478 }),
    // "bunları": iki belge çip olarak gelir; tarayıcı açılırken aşağı kayar, yazım başlayınca adres kutusuna çekilip kaybolur
    chips({ O: { x: 540, y: 420 }, s0: 1.25, m1: { y: 230, s: .92 }, m2: { y: 97, s: .3 } }),
    follow(),
  ];
  // 1x1: sol sütun (x 60-560); tarayıcı dar ölçülerle, takip kartı dar tasarım (w 620) .8 ölçekte
  const FOL1 = [60, 272, 500, 376], FOLD1 = [140, 270, 620, 470];
  const brand1 = () => [
    browser({ x: 60, y: 190, w: 500, h: 480, fs: { url: 44, inset: 20, row: 32, rowH: 84, logo: 300, logoGap: 18, pill: 22, pad: 30 } }),
    chips({ O: { x: 310, y: 400 }, s0: .82, m1: { y: 190, s: .72 }, m2: { y: 45, s: .3 } }),
    ...fit(FOLD1, FOL1, [follow(620)]),
  ];
  // son kart takip butonundan açılır (9x16 buton merkezi: kart 140,270 + 400,388); diğer formatlarda aynı nokta dönüştürülür
  const at9 = { x: 540, y: 658 }, mapPt = (f, p) => ({ x: f.x + p.x * f.s, y: f.y + p.y * f.s });
  const endAt = P({ '1x1': mapPt(M.fit(FOLD1, FOL1), { x: 140 + 310, y: 658 }),
                    '16x9': mapPt(M.fit(CARD9, R['gfx.card'] || CARD9, { max: 1.2 }), at9), default: at9 });

  const layout = [
    { t: 0, mode: P({ '1x1': 'card', default: 'full' }) },
    { t: C.shrink1, mode: 'card' },
    { t: C.wipeIn, mode: 'hidden' },
    { t: C.reveal, mode: 'full' },
    { t: C.shrink2, mode: 'card' },
    { t: C.expand, mode: 'full' },
    { t: C.shrink3, mode: 'card' },
  ].filter((l, i, a) => i === 0 || l.mode !== a[i - 1].mode);                   // 1x1: kanca zaten kartta

  return {
  style: 2,
  layout,
  headroomFull: P({ '1x1': 150 }),                                               // 1x1 tam ekran: üst bant (y 60-170) grafiklere
  capY: P({ '1x1': { full: 955 } }),                                            // 1x1 tam ekran/hidden: altyazı ağızdan uzak; hidden'daki 2 satır < 1020
  punches: [
    { t: C.dikkat, amt: .07, z: .45, f: 3, until: C.shrink1 },
    { t: C.ceza, amt: P({ '1x1': .05, default: .10 }), z: .5, f: 3, until: C.shrink3 },   // 1x1: ağız altyazıya inmesin
  ],
  shakes: [{ target: 'face', t: C.ceza, d: .3, amp: 10, seed: 3 }],
  flashes: [{ t: C.dikkat, a: .35, d: .1 }, { t: C.zorunlu, a: .45, d: .1 }, { t: C.ceza, a: .3, d: .09 }],
  hideCaptions: [[C.detay - .03, END + 1]],          // "Detayları açıklamada" hapın kendisi altyazı görevi görür

  scenes: [
    // 0 - 1.95 s: kanca — t=0'da okunur (pre), '2' yanında iki belge ikonu, 'dikkat!' konuşmadaki "dikkat"te kırmızı kutuyla çarpar
    L.hook(Object.assign({ chip: 'ÖRNEK BİR SİTENİZ VARSA', lines: [['Bu', '2', 'belgeye'], ['dikkat!']], size: 104, pre: .4, stagger: .06,
             deco: { after: '2', html: docIcons, t: -.6 }, shadow: 'strong',               // ikon t=0'da yerinde
             emph: { word: 'dikkat!', t: C.dikkat }, out: C.shrink1 - .3, z: 6 },          // 1.95'te tamamen çıkmış
      P({
        // 1x1: sol sütunda üç satır; mod değişimi yok, "dikkat!" kurum rozetine kadar ekranda
        '1x1': { lines: [['Bu', '2'], ['belgeye'], ['dikkat!']], box: { x: 60, y: 252, w: 500, titleTop: 92 }, chipSize: 28,
                 out: C.bakanlik - .35 },
        // 16x9: çip + başlık yüz şeridinin solunda (sütun x 96-646; çip 32 px sütuna sığan en büyük punto)
        '16x9': { lines: [['Bu', '2'], ['belgeye'], ['dikkat!']], box: { x: 96, y: 252, w: 550, titleTop: 92 }, chipSize: 32 },
        default: {},
      }))),

    // 2.05 - 4.7 s: yüz kartta; üstte jenerik kurum rozeti, sonra 'Düzenleme' belgesi iner (etiket yok: altyazı söylüyor)
    L.scene({ id: 'reg', from: C.bakanlik - .05, to: C.wipeIn + .3, under: true,
      exit: { a: C.wipeIn - .04, b: C.wipeIn + .2, dy: 60 },
      parts: P({
        '1x1': [
          L.badge({ icon: 'bank', x: 310, y: 450, t: C.bakanlik, style: 'white', size: 230, iconScale: 2.5, out: C.duzenleme }),
          L.notice({ title: '', icon: 'gavel', x: 70, y: 262, w: 480, h: 400, t: C.duzenleme, lines: 5, mark: { line: 1, t: C.duzenleme + .75 } }),
        ],
        default: fit(CARD9, R['gfx.card'] || CARD9, [
          L.badge({ icon: 'bank', x: 540, y: 490, t: C.bakanlik, style: 'white', size: 250, iconScale: 2.7, out: C.duzenleme }),
          // başlık metni yok: altyazı "düzenlemelerine" diyor
          L.notice({ title: '', icon: 'gavel', x: 190, y: 300, w: 700, h: 400, t: C.duzenleme,
                     lines: 5, mark: { line: 1, t: C.duzenleme + .75 } }),
        ], { max: 1.2 }),
      }) }),

    // 4.7 - 12.2 s: tam ekran animasyon (kart aşağı düşer) — site, belgeler yelpaze, GÜNCEL rozetleri, ZORUNLU
    // çıkış: motor, zemin silinirken bu sahneyi de aynı çizgiyle siler (hidden->full)
    L.scene({ id: 'gfx', from: C.wipeIn + .1, to: C.reveal + .32, under: true, shake: { t: C.zorunlu, d: .4, amp: 14, seed: 5 },
      parts: gfx }),

    // 12.2 - 15.6 s: yüz geri gelir (zemin silinir); yüzün üstünde takvim + YÜRÜRLÜKTE
    L.scene({ id: 'date', from: C.reveal + .2, to: C.shrink2 + .3, under: false,
      exit: { a: C.shrink2 - P({ '16x9': .15, default: .05 }), b: C.shrink2 + P({ '16x9': .1, default: .2 }),
              dy: P({ '1x1': 0, default: 60 }) },   // 1x1: üst bantta, yerinde söner; 16x9: yüz karta kaymadan söner
      parts: (({ cx, cy, cs, tx, ty, sf }) => [
        // takvim küçültülür (saçın üstüne binmez); yıl doğrudan 2026 (2025 söylenmiyor), "2026'dan"da son hane kırmızıya döner
        L.group({ origin: { x: cx, y: cy }, start: { s: cs }, parts: [
          L.calendar({ day: '1', month: 'OCAK', yearPrefix: '202', rollFrom: '6', rollTo: '6', x: cx, y: cy,
                       t: C.cal, tMonth: C.ocak, tRoll: C.yil }),
        ] }),
        L.tags({ x: tx, items: [{ text: 'YÜRÜRLÜKTE', icon: 'checkCircle', style: 'green', t: C.yururluk, top: ty, stamp: true,
                                  ...(sf ? { stampFrom: sf } : {}) }] }),
      ])(P({
        '1x1': { cx: 78, cy: 86, cs: .66, tx: 578, ty: 90, sf: 1.3 },  // takvim sol üst, etiket sağ üst (saç y>=150); damga girişi kısa
        '16x9': { cx: 166, cy: 220, cs: 1, tx: 1351, ty: 380 },     // takvim şeridin solunda, etiket sağında
        default: { cx: 86, cy: 276, cs: .74, tx: 396, ty: 330 },
      })) }),

    // 15.6 - 20.5 s: kart; üstte kontrol listesi, eksik / güncel olmayan belge kırmızı X
    L.scene({ id: 'check', from: C.liste - .05, to: C.expand + .3, under: true,
      exit: { a: C.expand - .05, b: C.expand + .2, dy: 60 },
      parts: (o => [
        // başlık yok (altyazıyı tekrar etmez); bantta yalnızca büyüteç ikonu
        L.checklist(Object.assign({ title: '', icon: 'search', x: 120, y: 290, w: 840, t: C.liste, items: [
          { text: 'Eksik belge', t: C.eksik, mark: 'x' },
          { text: 'Güncel olmayan belge', t: C.guncelDegil, mark: 'x' },
        ] }, o)),
      ])(P({ '1x1': { x: 60, y: 230, w: 500, rowH: 150, textSize: 38, wrap: true }, default: {} }))
        .flatMap(p => SQ ? [p] : fit(CARD9, R['gfx.card'] || CARD9, [p], { max: 1.2 })) }),

    // 21.1 s: "uyarı" kelimesi -> kırmızı band yerinde çarpar, punch-in, sarsıntı
    L.banner(Object.assign({ text: 'ÖRNEK UYARI METNİ', icon: 'alert', t: C.ceza, out: C.shrink3, inPlace: true },
      P({ '1x1': { box: { x: 90, y: 64, w: 900, h: 104 }, size: 52 },     // saçın üstündeki bantta
          '16x9': { box: { x: 510, y: 110, w: 900 }, size: 62 },          // yüz şeridinin üstünde, ortada
          default: { top: 290, inset: 110 } }))),

    // 23.4 - 30.1 s: belge çipleri -> ornekmarka.com yazılır, sayfa açılır; sonra takip kartı
    L.scene({ id: 'brand', from: C.shrink3 + .05, to: END + .5, under: true,
      parts: SQ ? brand1() : fit(CARD9, R['gfx.card'] || CARD9, brand9(), { max: 1.2 }) }),

    // 28.4 s: "Detayları açıklamada" -> hap + aşağı ok (açıklamayı gösterir); altyazının yerinde (16x9: takip kartının altında)
    L.scene({ id: 'cta', from: C.detay - .05, to: END + .5, under: false,
      parts: [L.pointer({ words: [{ text: 'Detayları', t: C.detay }, { text: 'açıklamada', t: word(56).s }], t: C.detay,
                          y: P({ '1x1': 935, '16x9': 880, default: 1430 }), size: P({ '1x1': 44, default: 46 }),
                          box: P({ '16x9': { x: 96, w: 1100 } }) })] }),          // 16x9: takip kartının altında

    // son kart: takip butonundan açılır
    L.endCard({ t: END, at: endAt }),
  ],
  };
});
