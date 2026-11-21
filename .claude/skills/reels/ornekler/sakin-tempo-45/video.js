// ÖRNEK: sakin-tempo-45 — SAKİN TEMPO reklam (45+ kitle, A/B sürümlerine uygun kısa reklam), sahne yoğunluğu, form CTA, döngü kapanışı.
// Ne zaman: kısa (~30 s) reklam; iri altyazı (V.capFs), yavaş mod geçişleri (V.transScale), yumuşak damga, sarsıntı/flaş yok; 9x16 + 1x1 paket.
// Plan stili: kind face, density sahne, captions vurgulu, formats ['9x16','1x1'], libs yok (L.* v6 yumuşak bileşenler), son kart yok (döngü).
// Cue'lar (C.<ad>; C.end/C.total motordan): dogru, expand1, hersey, web, mobil, yz, cardUp0, wipe1, cardUp1, cardUp2, expand2, hook, hayata, saat, kod,
//   yazilimci, gerek, biz, ogret, sifir, adim, detay, form
// Ekran metinleri genel örnek kanca/çağrıdır; kendi videonda yalnız konuşmada geçenleri yaz.
// Kanca: 'AKLINIZDA BİR PROJE Mİ VAR?' + 'Yazılım bilmeden / hayata geçirin' ('Yazılım bilmeden' C.hook'ta yumuşakça sarıya döner).
// Mod sırası: full (kanca) -> card (ampul -> uygulama, saatler içinde) -> hidden (tarayıcı + telefon + yapay zekâ çipi)
//   -> card (Kod bilgisi / Yazılımcı: Gerek yok) -> full (DOĞRU KULLANIM yumuşak damga)
//   -> card (logo avatarı + ders kartı -> 'Sıfırdan' merdiveni, adım adım yanar) -> full (form CTA) -> döngü kapanışı (son kart yok).
// KİTLE 45+: yumuşak yaylar (v6 bileşenleri), mod geçişleri 1.3 kat yavaş (transScale), sarsıntı ve flaş yok, iri altyazı (capFs),
//   sahne başına en fazla 3 eleman, her eleman ≥ 1.5 s, tikler ≥ 1.2 s.
// KADRAJ: konuşmacı kaynakta solda (yüz x≈0.2), sağda bilgisayarlar. 9x16 tam ekran zoom 1.2: yüz biraz ortaya gelir, bilgisayarlar kısmen kadrajda;
//   saç üstü headroomFull ile y≈505'e itilir -> üst bant (y 250-500) kanca / liste / damga için boş; sağ sütun (x ≥ 530) CTA için.
//   1x1 tam ekran zoom 1.0, saç y≈320 -> üst bant 60-300; kartta yüz sağda, grafik solda.
// DÖNGÜ: kapanışta son kare donar, kararır, kanca yerine döner ve vurgu sarı çarpar; son ~0.3 s'de kararma kalkar, vurgu beyaza döner
//   -> son kare t=0 ile aynı görünür (Reels başa sarınca sıçrama yok).
// Tüm zamanlar plan.json cues'tan (C.xxx), kelime başlangıcından (word(i).s) ya da timeline'ın jump cut listesinden gelir.
const END = C.end, TOTAL = C.total;
const ws = i => word(i).s;
const LAST = END - 1 / 30 + .001;                                             // son video karesi (kadrajıyla donar)

defineVideo(F => {
  const P = F.pick, SQ = F.id === '1x1';
  const ZF = P({ '1x1': 1, default: 1.2 });                                   // tam ekran yakınlaştırma (kartta 1.0)
  // kanca: açılışta ve kapanışta birebir aynı yer/boyut (Reels başa sarınca kesintisiz döngü)
  const HOOK = { chip: 'AKLINIZDA BİR PROJE Mİ VAR?', lines: [['Yazılım', 'bilmeden'], ['hayata', 'geçirin']],
    ...P({ '1x1': { chipSize: 38, sizes: 72, top: 66, chipGap: 8 }, default: { chipSize: 44, sizes: 86, top: 254, chipGap: 12 } }) };
  const YEL = '#FFD23F';
  // 1x1: liste kartta sol sütunda büyük durur, kaymaz; tam ekrana geçiş damgadan hemen önceye kayar (rozetler ≥ 1.5 s okunur)
  const EXP1 = P({ '1x1': C.dogru - .2, default: C.expand1 });

  // ---------- hidden: tarayıcı + telefon üstte, yapay zekâ çipi altta (C.hersey), iki cihaza çizgiyle bağlanır ----------
  const H = P({
    '1x1': { br: { x: 70, y: 80, w: 520, h: 360 }, ph: { x: 700, y: 70, w: 240, h: 470 }, cpu: { x: 520, y: 700, size: 230 } },
    default: { br: { x: 70, y: 290, w: 600, h: 440 }, ph: { x: 710, y: 280, w: 260, h: 520 }, cpu: { x: 540, y: 990, size: 260 } },
  });
  const hub = [
    L.device({ kind: 'browser', ...H.br, t: C.web, build: { a: C.web + .2, b: C.web + 1.0 } }),
    L.device({ kind: 'phone', ...H.ph, t: C.mobil, build: { a: C.mobil + .2, b: C.mobil + 1.0 }, accent: '#1FB766' }),
    L.flow({ size: H.cpu.size, nodes: [
      { x: H.cpu.x, y: H.cpu.y, icon: 'cpu', t: C.hersey, on: C.yz, color: 'var(--yellow)', ink: '#0B1F33', shape: 'circle' },
      { x: H.br.x + H.br.w / 2, y: H.br.y + H.br.h + 8, text: '', size: 0, t: Infinity },   // bağlantı uçları (cihazların alt kenarı)
      { x: H.ph.x + H.ph.w / 2, y: H.ph.y + H.ph.h + 8, text: '', size: 0, t: Infinity },
    ], links: [{ from: 0, to: 1, t: C.yz + .1, dur: .45 }, { from: 0, to: 2, t: C.yz + .3, dur: .45 }] }),
  ];

  const layout = [
    { t: 0, mode: 'full', zoom: ZF },
    { t: C.cardUp0, mode: 'card' },
    { t: C.wipe1, mode: 'hidden' },
    { t: C.cardUp1, mode: 'card' },
    { t: EXP1, mode: 'full', zoom: ZF },
    { t: C.cardUp2, mode: 'card' },
    { t: C.expand2, mode: 'full', zoom: ZF },
  ];
  // kartta görünen jump cut'lar (yüz 10-20 px kayıyor): .03 punch ile yumuşatılır
  const jumpPunch = window.TIMELINE.jumps.filter(j => (j > C.cardUp1 + .6 && j < EXP1) || (j > C.cardUp2 + .6 && j < C.expand2))
    .map(j => ({ t: j, amt: .03, z: .7, f: 2, until: j + .9 }));

  return {
  style: 2,
  frameShift: true,
  introZoom: false, introFlash: false,                    // döngü: ilk kare = son kadraj; 45+: açılış flaşı yok
  transScale: 1.3,                                        // mod geçişleri ~.45-.6 s (45+)
  capFs: P({ '1x1': 60, default: 70 }), capFsMin: P({ '1x1': 48, default: 54 }),   // İRİ altyazı
  capY: P({ '1x1': { full: 965 } }), capMaxLines: P({ '1x1': 1 }),   // 1x1 tam ekran: altyazı ağızdan uzak (kartta 935), tek satır (alt sınır)
  headroomFull: P({ '1x1': 320, default: 505 }),          // tam ekranda saç üstü aşağıda: üst bant grafiklere
  layout,
  punches: [{ t: C.dogru, amt: .04, z: .7, f: 1.6, until: C.cardUp2 }, ...jumpPunch],   // DOĞRU KULLANIM: çok hafif punch-in
  shakes: [], flashes: [],
  hideCaptions: [[END - .3, END + 2]],                    // son 0.3 s'de altyazı yok

  scenes: [
    // 0 - 2.6 s: kanca — t=0'da tamamen okunur; 'Yazılım bilmeden' konuşmacı "yazılım" derken yumuşakça sarıya döner ve hafifçe büyür
    L.softHook({ ...HOOK, hit: { line: 0, t: C.hook, color: YEL, grow: 1.05 }, out: C.cardUp0 - .45 }),

    // 3.07 - 6.9 s: kart — fikir (ampul) -> uygulama penceresi kurulur; "saatler"de saat çipi; "hayata"dan hemen önce pencereye yeşil tik (≥ 1.2 s)
    L.softScene({ id: 'fikir', from: C.cardUp0, to: C.wipe1 + .2, under: true, exit: { a: C.wipe1 - .2, b: C.wipe1 + .18, dy: 30 },
      parts: (o => [
        L.flow({ size: o.bs, nodes: [
          { ...o.bulb, icon: 'bulb', t: C.cardUp0 + .3, on: C.cardUp0 + .3, color: 'var(--yellow)', ink: '#0B1F33', shape: 'circle' },
          { ...o.tip, text: '', size: 0, t: Infinity }], links: [{ from: 0, to: 1, t: ws(10), dur: .45 }] }),
        L.device({ kind: 'window', ...o.win, t: ws(11), build: { a: ws(11) + .2, b: C.hayata - .4 }, check: C.hayata - .25 }),
        L.chips({ ...o.chip, anchor: 'center', items: [{ icon: 'clock', text: 'Saatler içinde', t: C.saat }] }),
      ])(P({
        '1x1': { bs: 170, bulb: { x: 310, y: 185 }, tip: { x: 310, y: 332 }, win: { x: 70, y: 340, w: 480, h: 300 }, chip: { x: 310, y: 668, size: 44 } },
        default: { bs: 220, bulb: { x: 230, y: 470 }, tip: { x: 422, y: 470 }, win: { x: 430, y: 292, w: 545, h: 340 }, chip: { x: 702, y: 656, size: 50 } },
      })) }),

    // 6.9 - 10.94 s: hidden — "Web sitesi"nde tarayıcı, "mobil"de telefon, "her şeyi"nde yapay zekâ çipi; "yapay zekâ"da iki cihaza bağlanır
    L.softScene({ id: 'hub', from: C.wipe1 + .1, to: C.cardUp1 + .25, under: true, exit: { a: C.cardUp1 - .2, b: C.cardUp1 + .2, dy: 0 }, parts: hub }),

    // 10.94 - 16.3 s: kart -> tam ekran — "yazılım": Kod bilgisi, "yazılımcı": Yazılımcı; "gerek"te sırayla yeşil 'Gerek yok'.
    // 9x16: kartta ortada; tam ekrana geçerken üst banda süzülür, damgadan önce söner. 1x1: sol sütunda büyük durur, kaymadan söner.
    L.softScene({ id: 'gerek', from: C.cardUp1, to: C.dogru, ...(SQ ? { under: true } : {}),
      exit: P({ '1x1': { a: C.dogru - .55, b: C.dogru - .17, dy: 0 }, default: { a: C.dogru - .5, b: C.dogru - .1, dy: 24 } }), parts: [
      L.group({ origin: { x: 0, y: 0 }, start: { y: P({ '1x1': 0, default: 107 }) },
        moves: SQ ? [] : [{ a: C.expand1 - .05, b: C.expand1 + .55, y: 0 }], parts: [
        L.verdictList({ ...P({ '1x1': { x: 70, y: 290, size: 46, gap: 86 }, default: { x: 80, y: 262, w: 920, size: 56, gap: 28 } }),
          rows: [{ icon: 'code', text: 'Kod bilgisi', t: C.kod }, { icon: 'user', text: 'Yazılımcı', t: C.yazilimci }],
          verdict: { text: 'Gerek yok', icon: 'check', style: 'green', t: C.gerek, ...P({ '1x1': { size: 44, at: 'below', stagger: .15 }, default: { size: 46, at: 'right', stagger: .2 } }) } }),
      ] }),
    ] }),

    // 16.41 s: tam ekran — "doğru kullanım": üst bantta yumuşak damga (yeşil çerçeve, koyu yazı; sarsıntı yok) + çok hafif punch-in
    L.softScene({ id: 'dogru', from: C.dogru - .05, to: C.cardUp2 + .2, exit: { a: C.cardUp2 - .3, b: C.cardUp2 + .1, dy: 24 }, parts: [
      L.softStamp({ text: 'DOĞRU KULLANIM', t: C.dogru, color: 'var(--green)', ink: '#138A4C', rot: -3,
        ...P({ '1x1': { x: 540, y: 180, size: 62 }, default: { x: 540, y: 376, size: 70 } }) }),
    ] }),

    // 18.14 - 26.03 s: kart — "Bizler": logo avatarı; "bu yapay zekâ": ders kartı, "nasıl … geliştirebilirsiniz" boyunca ders ilerler, bitince yeşil tik
    // (≥ 1.2 s); "öğretiyoruz": kart hafif nabız; "Sıfırdan": ders kartı söner, merdiven kurulur ('Sıfırdan' en alt basamakta);
    // "adım adım": basamaklar 1-2-3 yanar (3. basamak ≥ 1.2 s yanık)
    L.softScene({ id: 'egitim', from: C.cardUp2, to: C.expand2 + .25, under: true, exit: { a: C.expand2 - .1, b: C.expand2 + .28, dy: 30 },
      parts: (o => [
        L.avatar({ ...o.av, t: C.biz + .1 }),
        L.device({ kind: 'video', ...o.vd, t: ws(49), build: { a: ws(49) + .15, b: ws(49) + .8 }, play: { a: ws(53), b: ws(56) + .4 },
          check: ws(56) + .45, lit: C.ogret, out: C.sifir + .2 }),
        L.stairs({ ...o.st, t: C.sifir + .15, lit: [C.adim, C.adim + .22, C.adim + .44], label: { text: 'Sıfırdan', t: C.sifir + .3, size: o.ls } }),
      ])(P({
        '1x1': { av: { x: 310, y: 175, size: 180 }, vd: { x: 85, y: 300, w: 430, h: 360 }, st: { x: 130, y: 800, w: 400, h: 400 }, ls: 44 },
        default: { av: { x: 205, y: 495, size: 260 }, vd: { x: 360, y: 292, w: 600, h: 420 }, st: { x: 380, y: 735, w: 580, h: 445 }, ls: 48 },
      })) }),

    // 26.03 - 28.63 s: tam ekran CTA — "Detayları": yüzün yanında form kartı (yazısız alanlar + düğme); "açıklamaya": 'Detaylar formda' ve aşağı ok;
    // "formda": ok iki kez nazikçe zıplar. Kapanıştan önce söner (kanca aynı alana döner)
    L.softScene({ id: 'cta', from: C.detay + .15, to: END + .1, exit: { a: END - .3, b: END + .08, dy: 20 }, parts: [
      L.formCard({ ...P({ '1x1': { x: 640, y: 320, w: 260 }, default: { x: 585, y: 290, w: 340 } }), t: C.detay + .25,   // yüz tam ekrana açıldıktan sonra
        label: { text: 'Detaylar formda', t: ws(65), size: P({ '1x1': 44, default: 46 }) },
        arrow: { in: ws(65) + .25, t: C.form, n: 2, per: .38, size: P({ '1x1': 86, default: 110 }) } }),
    ] }),

    // döngü kapanışı (son kart yok): C.end'de son kare (kadrajıyla) donar ve kararır; kanca t=0'daki yerine döner, 'Yazılım bilmeden' sarı çarpar
    // (~0.6 s); son ~0.3 s'de kararma ve bulanıklık kalkar, vurgu beyaza döner -> son kare = ilk kare
    L.scene({ id: 'freeze', from: END, z: 5, parts: [L.holdFace({ at: LAST, t: END, dim: .3, blur: 2, dur: .45, undo: { t: TOTAL - .36, dur: .3 } })] }),
    L.softHook({ ...HOOK, id: 'outro', t: END + .12, pre: 0, enter: { s: 1.06, dy: -14 },
      hit: { line: 0, t: END + .4, dur: .25, color: YEL, grow: 1, pulse: .05, off: TOTAL - .38, offDur: .3 } }),
  ],
  };
});
