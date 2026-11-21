// ÖRNEK: kurgu-vitrini — meta anlatım: "bu videoyu da yapay zekâ kurguladı" + adım adım iş akışı (1-4 adım rozetleri), döngü kapanışı.
// Ne zaman: süreç / yöntem anlatan öğretici video; kancadaki kurgu zaman çizelgesi finalde geri gelir (aynı tohum = aynı kurgu), son kart yok.
// Plan stili: kind face, density sahne, captions vurgulu, formats ['9x16'], libs yok (yalnız L.*), son kart kapalı (brand.json "end": "loop").
// Cue'lar (C.<ad>; C.end motordan): anayasa, kurallar, cardUp0, wipe1, cardUp1, expand1, wipe2, expand2, cardUp2, wipe3, cardUp3, expand3, shrink4,
//   wipe4, cardUp5, expand5, shrink6, expand6, aracA, ogret, goz, verimli, md, nasil, sifir, doc, diller, bagimlilik,
//   mimari, tektek, ozet, amac, kapsam, kime, farkli, kolay, workflow, subagent, uzman, reklam, wf2, commit, yayin,
//   gelistirme, devam, temel, test, yayin2, insta, takip, edit, yorum
// Ekran metinleri yer tutucudur; hesap '@ornekmarka', takip kartı avatarı BRAND.logo.avatar (brand.json). C.aracA: konuşmacının kullandığı
//   yapay zekâ aracının adını söylediği an (marka adı ekrana yazılmaz).
// Mod sırası (kapanış: son kart yok, donmuş son kare + kanca başlığı geri gelir -> döngü): full (kanca) -> card (soru) -> hidden#1 (sıfırdan: klasör + proje dokümanı) -> card (Diller/Bağımlılıklar/Mimari)
//   -> full (Özet/Amaç/Kapsam/Hedef kitle, tek tek tik) -> hidden#2 (.md dağılımı, Anayasa/Kurallar) -> full (öğret: .md -> kıvılcım)
//   -> card (tek .md -> 3 farklı yapay zekâ) -> hidden#3 (Workflow + Subagent) -> card (Reklam projesi + uzmanlar)
//   -> full (ÜÇÜNCÜ GÖZ) -> card (workflow zinciri kurulur) -> hidden#4 (Commit / Yayına alma / Geliştirme yanar)
//   -> card (temel + bina) -> full (Test/Yayın, verim) -> card (takip kartı) -> full (zaman çizelgesi geri, yorum balonu) -> döngü.
// Görsel dil: "kurgu zaman çizelgesi" kancada ve finalde (aynı tohum = aynı kurgu, imleç kaldığı yerden sona gider);
//   akış düğümleri (.md -> yapay zekâ, workflow, pipeline) ve ajan figürleri aynı bileşenle baştan sona sürer. Marka logosu yok.
// Yüz kadrajda solda (takip x≈0.345): tam ekran grafikleri üst bantta (y < ~450) ya da sağ sütunda (x ≥ ~650).
// Tüm zamanlar plan.json cues'tan (C.xxx) ya da kelime başlangıcından (word(i).s) gelir; elle saniye yok.
const END = C.end;
const ws = i => word(i).s;
const STEP = { x: 132, y: 312, size: 108 };
// kanca başlığı + zaman çizelgesi: açılışta ve kapanışta birebir aynı yer/boyut (Reels başa sarınca kusursuz döngü)
const HEAD = { lines: [['Kurgusu', 'da', 'konusu', 'da'], ['yapay zekâ']], sizes: [68, 118], top: 262, gap: 4, stagger: .05 };
const TL0 = { x: 140, y: 498, w: 800, h: 60, tracks: 2, seed: 7 };          // adım numaraları (1-4): sol üst köşe, hep aynı yer ve stil
// hidden#2 dosyaları (sol-üst, açı); ikon rozeti kâğıdın sağ-üst kıvrık köşesine (kâğıt merkezinden döndürülmüş nokta)
const MW = 284, MH = 365;
const MDF = [{ x: 85, y: 600, rot: -5, title: 'Anayasa', tt: C.anayasa, icon: 'book' }, { x: 393, y: 580, rot: 0 },
             { x: 698, y: 600, rot: 4, title: 'Kurallar', tt: C.kurallar, icon: 'list' }];
const corner = f => { const a = f.rot * Math.PI / 180, dx = MW / 2 - 40, dy = -MH / 2 + 40;   // sağ buton sütunu payı: rozet x <= ~1000
  return { x: f.x + MW / 2 + dx * Math.cos(a) - dy * Math.sin(a), y: f.y + MH / 2 + dx * Math.sin(a) + dy * Math.cos(a) }; };

defineVideo({
  style: 2,
  frameShift: true,               // kart<->tam ekran geçişinde yüz sıçramasın
  layout: [
    { t: 0, mode: 'full' },
    { t: C.cardUp0, mode: 'card' },
    { t: C.wipe1, mode: 'hidden' },
    { t: C.cardUp1, mode: 'card' },
    { t: C.expand1, mode: 'full' },
    { t: C.wipe2, mode: 'hidden' },
    { t: C.expand2, mode: 'full' },
    { t: C.cardUp2, mode: 'card' },
    { t: C.wipe3, mode: 'hidden' },
    { t: C.cardUp3, mode: 'card' },
    { t: C.expand3, mode: 'full' },
    { t: C.shrink4, mode: 'card' },
    { t: C.wipe4, mode: 'hidden' },
    { t: C.cardUp5, mode: 'card' },
    { t: C.expand5, mode: 'full' },
    { t: C.shrink6, mode: 'card' },
    { t: C.expand6, mode: 'full' },
  ],
  punches: [
    { t: C.aracA, amt: .06, z: .5, f: 3, until: C.cardUp0 },
    { t: C.ogret, amt: .06, z: .5, f: 3, until: C.cardUp2 },
    { t: C.goz, amt: .08, z: .45, f: 3, until: C.shrink4 },
    { t: C.verimli, amt: .06, z: .5, f: 3, until: C.shrink6 },
  ],
  shakes: [{ target: 'face', t: C.goz, d: .3, amp: 10, seed: 3 }],
  flashes: [{ t: C.aracA, a: .35, d: .1 }, { t: C.md, a: .45, d: .1 }, { t: C.goz, a: .4, d: .1 }],
  hideCaptions: [[END - .3, END + 2]],          // son 0.3 s'de altyazı yok

  scenes: [
    // 0 - ~3.35 s: kanca — iki satır t=0'da okunur; 'yapay zekâ' konuşmacı aracın adını söylerken sarıya döner ve ölçekle çarpar (punch + flaş).
    // Altında yazısız kurgu zaman çizelgesi (klipler dolar, imleç kayar). Başlık üst bantta, saçın üstünde; "konu"dan hemen önce çıkar.
    L.headline({ ...HEAD, pre: .4, hit: { line: 1, t: C.aracA, color: 'var(--yellow)', from: 1.5 }, out: ws(10) - .1 }),
    L.scene({ id: 'hookTl', from: 0, to: ws(10) + .2, parts: [
      L.editTimeline({ ...TL0, t: -1, play: { a: .35, b: ws(10) - .15, from: .03, to: .42 }, out: ws(10) + .1 }),   // t=0'da hazır (döngü)
    ] }),

    // 3.95 - 8.66 s: kart — "Bir yazılımcı": kod editörü yazılır; "yapay zekâyı": kıvılcım rozeti; "nasıl": sarı soru işareti
    L.scene({ id: 'soru', from: C.cardUp0, to: C.wipe1 + .3, under: true, exit: { a: C.wipe1 - .05, b: C.wipe1 + .2, dy: 60 }, parts: [
      L.codeWindow({ x: 110, y: 292, w: 610, h: 430, t: ws(13), lines: 9, typeA: ws(13) + .3, typeB: C.wipe1 - .4, seed: 3 }),
      L.badge({ icon: 'cpu', x: 862, y: 395, t: ws(14), style: 'white', size: 160, iconScale: 1.9 }),
      L.badge({ icon: 'question', x: 862, y: 615, t: C.nasil, style: 'yellow', size: 170, iconScale: 2.3 }),
    ] }),

    // 8.66 - 20.9 s: hidden#1 -> kart. "Öncelikle": adım 1; "sıfırdan": boş 'Yeni proje' klasörü; "doküman": belge klasöre düşer.
    // Kart yükselirken belge sola-üste çekilir; içerik çipleri kendi kelimesinde boş yerlerine oturur (kısa etiket, altyazı kopyası değil).
    L.scene({ id: 'h1', from: C.wipe1 + .05, to: C.expand1 + .3, under: true, exit: { a: C.expand1 - .05, b: C.expand1 + .2, dy: 60 }, parts: [
      L.stepNum({ ...STEP, text: '1', t: C.wipe1 + .12, out: C.cardUp1 }),
      L.folder({ x: 160, y: 450, w: 760, h: 600, t: C.wipe1 + .22, label: 'Yeni proje', tLabel: C.sifir, slots: [3, 2], out: C.cardUp1 + .1 }),
      L.group({ origin: { x: 540, y: 790 }, start: { y: -80 }, moves: [
        { a: C.doc, b: C.doc + .28, y: 0 },
        { a: C.cardUp1 - .1, b: C.cardUp1 + .45, x: -285, y: -290, s: .74 }], parts: [
        L.paper({ x: 340, y: 540, w: 400, h: 500, rot: -3, t: C.doc, lines: 8 }),          // başlık yazısı yok: başlık çubuğu (video.css)
      ] }),
      L.chips({ x: 440, y: 330, size: 48, gap: 24, ghost: C.cardUp1 + .5, ghostW: 470, items: [
        { icon: 'code', text: 'Diller', t: C.diller },
        { icon: 'puzzle', text: 'Bağımlılıklar', t: C.bagimlilik },
        { icon: 'layers', text: 'Mimari', t: C.mimari },
      ] }),
    ] }),

    // 20.9 - 27.5 s: tam ekran — projenin kimliği: yüzün sağında çipler sırayla, "tek tek"te sırayla yeşil tik
    L.scene({ id: 'kimlik', from: C.expand1 + .1, to: C.wipe2 + .2, exit: { a: C.wipe2 - .1, b: C.wipe2 + .1, dy: 40 }, parts: [
      L.chips({ x: 640, y: 520, size: 38, gap: 18, check: { t: C.tektek, stagger: .12 }, items: [
        { icon: 'list', text: 'Özet', t: C.ozet },
        { icon: 'target', text: 'Amaç', t: C.amac },
        { icon: 'scope', text: 'Kapsam', t: C.kapsam },
        { icon: 'user', text: 'Hedef kitle', t: C.kime },
      ] }),
    ] }),

    // 27.5 - 33.7 s: hidden#2 — proje dokümanı ortada; ".md"de üç dosyaya dağılır + büyük '.md' (flaş); Anayasa (kitap), Kurallar (liste)
    L.scene({ id: 'mdSrc', from: C.wipe2 + .16, to: C.md + .2, under: true, parts: [
      L.paper({ x: 340, y: 545, w: 400, h: 500, rot: 2, t: C.wipe2 + .2, lines: 8, out: C.md + .1 }),
    ] }),
    L.scene({ id: 'md', from: C.wipe2 + .16, to: C.expand2 + .45, under: true, parts: [
      L.stepNum({ ...STEP, text: '2', t: ws(62), out: C.expand2 + .4 }),
      L.bigType({ text: '.md', x: 540, y: 286, size: 230, t: C.md, tGhost: ws(68), stagger: .06, color: 'var(--yellow)' }),
      ...MDF.map((f, i) => L.group({ origin: { x: f.x + MW / 2, y: f.y + MH / 2 }, start: { x: 540 - (f.x + MW / 2), y: 795 - (f.y + MH / 2), s: .45 },
          moves: [{ a: C.md, b: C.md + .35, x: 0, y: 0, s: 1 }], parts: [
            L.paper({ x: f.x, y: f.y, w: MW, h: MH, rot: f.rot, t: C.md, title: f.title || '', tTitle: f.tt, lines: f.title ? 6 : 8,
                      tag: { text: '.md', t: C.md + .3 + i * .08, style: 'yellow', size: 46 } }),
          ] })),
      // ikon rozetleri dosyaların kıvrık köşesinde (başlığı örtmez)
      ...MDF.filter(f => f.icon).map(f => L.badge({ icon: f.icon, ...corner(f), t: f.tt + .05, style: 'white', size: 84, iconScale: 1.3 })),
    ] }),

    // 35.3 s: tam ekran — "öğretebilmek": yüzün sağında .md dosyası -> kıvılcım (yapay zekâ), jeton akar
    L.scene({ id: 'ogret', from: C.expand2 + .2, to: C.cardUp2 + .2, exit: { a: C.cardUp2 - .08, b: C.cardUp2 + .12, dy: 40 }, parts: [
      L.flow({ size: 130, nodes: [
        { x: 880, y: 575, text: '.md', t: C.ogret },
        { x: 880, y: 815, icon: 'cpu', t: C.ogret + .35, on: C.ogret + .35, color: 'var(--yellow)', ink: '#0B1F33', shape: 'circle' },
      ], links: [{ from: 0, to: 1, t: C.ogret + .15 }], tokens: [{ a: C.ogret + .5, b: C.ogret + 1.3, path: [0, 1] }] }),
    ] }),

    // 37.5 - 43.1 s: kart — tek .md dosyasından 3 farklı yapay zekâya (renk/şekil farklı, isim/logo yok); "kolaylıkla"da hepsine tik
    L.scene({ id: 'farkli', from: C.cardUp2 + .05, to: C.wipe3 + .3, under: true, exit: { a: C.wipe3 - .05, b: C.wipe3 + .2, dy: 60 }, parts: [
      L.flow({ size: 132, nodes: [
        { x: 250, y: 495, text: '.md', t: C.cardUp2 + .2, size: 190 },
        { x: 805, y: 340, icon: 'cpu', t: C.farkli, on: C.farkli, color: 'var(--sky)', ink: '#0B1F33', shape: 'circle', check: C.kolay },
        { x: 805, y: 495, icon: 'cpu', t: ws(86), on: ws(86), color: 'var(--yellow)', ink: '#0B1F33', shape: 'round', check: C.kolay + .1 },
        { x: 805, y: 650, icon: 'cpu', t: ws(87), on: ws(87), color: '#fff', ink: '#0B1F33', shape: 'hex', check: C.kolay + .2 },
      ], links: [{ from: 0, to: 1, t: C.farkli - .1 }, { from: 0, to: 2, t: ws(86) - .1 }, { from: 0, to: 3, t: ws(87) - .1 }],
      tokens: [{ a: ws(92), b: ws(92) + .8, path: [0, 1] }, { a: ws(92) + .1, b: ws(92) + .9, path: [0, 2] }, { a: ws(92) + .2, b: ws(92) + 1.0, path: [0, 3] }] }),
    ] }),

    // 43.2 - 48.2 s: hidden#3 — üstte workflow (düğümler girişte dolu gelir, "workflow"da oklarla bağlanır, jeton akar);
    // altta subagent figürleri "subagent'ları"nda gelir, "yetiştiriyorum"da küçükten büyür. Başlık yazısı yok (altyazı söylüyor).
    L.scene({ id: 'wf', from: C.wipe3 + .1, to: C.cardUp3 + .3, under: true, exit: { a: C.cardUp3 - .12, b: C.cardUp3 + .12, dy: 40 }, parts: [
      L.stepNum({ ...STEP, text: '3', t: ws(97), out: C.cardUp3 }),
      L.flow({ size: 150, color: 'var(--blue)', nodes: ['folder', 'gear', 'code', 'check'].map((icon, i) => ({
        x: 180 + i * 240, y: 490, icon, t: C.wipe3 + .3 + i * .1, on: C.workflow + .3 + i * .28 })),
        links: [0, 1, 2].map(i => ({ from: i, to: i + 1, t: C.workflow + i * .1 })),
        tokens: [{ a: C.workflow + .2, b: C.workflow + 1.1, path: [0, 1, 2, 3] }] }),
    ] }),
    // subagent'lar kart yükselirken üst alana çıkar; "reklam"da proje çipi, "uzmanı"nda her birinin göğsüne megafon rozeti çarpar
    L.scene({ id: 'ajan', from: C.wipe3 + .2, to: C.expand3 + .3, under: true, exit: { a: C.expand3 - .05, b: C.expand3 + .2, dy: 60 }, parts: [
      L.group({ origin: { x: 540, y: 900 }, moves: [{ a: C.cardUp3 - .1, b: C.cardUp3 + .45, y: -305, s: .95 }], parts:
        [262, 540, 818].map((x, i) => L.agent({ x, y: 900, size: 220, t: C.subagent + i * .12, color: ['var(--sky)', 'var(--blue)', 'var(--green)'][i],
          grow: { t: ws(107) + i * .1, from: .55 }, badge: { icon: 'megaphone', t: C.uzman + i * .15 } })) }),
      L.chips({ x: 540, y: 272, anchor: 'center', size: 42, items: [{ icon: 'megaphone', text: 'Reklam projesi', t: C.reklam }] }),
    ] }),

    // 54.5 s: tam ekran — "üçüncü göz": büyük damga (üst bantta, saçın üstünde) + göz rozeti; punch-in, sarsıntı, flaş
    L.scene({ id: 'goz', from: C.expand3 + .1, to: C.shrink4 + .2, exit: { a: C.shrink4 - .1, b: C.shrink4 + .12, dy: 40 }, parts: [
      L.stamp({ text: 'ÜÇÜNCÜ GÖZ', t: C.goz, x: 540, y: 362, rot: 3, size: 92 }),
      L.badge({ icon: 'eye', x: 870, y: 610, t: C.goz + .2, style: 'white', size: 170, iconScale: 2.3 }),
    ] }),

    // 55.8 - 64.9 s: kart -> hidden#4 — boş zincir "workflow'ları"nda kurulur; gizli sahnede büyür, düğümler kelimesinde yanar, jeton akar
    L.scene({ id: 'pipe', from: C.shrink4 + .2, to: C.cardUp5 + .3, under: true, exit: { a: C.cardUp5 - .1, b: C.cardUp5 + .15, dy: 60 }, parts: [
      L.group({ origin: { x: 540, y: 470 }, moves: [{ a: C.wipe4 + .05, b: C.wipe4 + .5, y: 75, s: 1.18 }], parts: [
        L.flow({ size: 150, labelSize: 32, color: 'var(--green)', nodes: [
          { x: 250, y: 470, icon: 'commit', ghost: C.shrink4 + .35, t: C.wf2, on: C.commit, label: 'Commit', tLabel: C.commit, check: C.commit + .3 },
          { x: 540, y: 470, icon: 'rocket', ghost: C.shrink4 + .45, t: C.wf2 + .12, on: C.yayin, label: 'Yayına alma', tLabel: C.yayin, anim: 'lift', check: C.yayin + .3 },
          { x: 830, y: 470, icon: 'gear', ghost: C.shrink4 + .55, t: C.wf2 + .24, on: C.gelistirme, label: 'Geliştirme', tLabel: C.gelistirme, anim: 'spin', check: C.gelistirme + .3 },
        ], links: [{ from: 0, to: 1, t: C.wf2 + .1 }, { from: 1, to: 2, t: C.wf2 + .22 }],
        tokens: [{ a: C.commit + .25, b: C.yayin - .02, path: [0, 1] }, { a: ws(141), b: C.gelistirme - .02, path: [1, 2] },
                 { a: ws(145), b: ws(149) + .3, path: [0, 1, 2] }] }),
      ] }),
      // gizli sahnede zincirin altında projenin kodu yazılmaya devam eder (geliştirme)
      L.codeWindow({ x: 170, y: 810, w: 740, h: 410, t: C.wipe4 + .45, lines: 8, typeA: C.wipe4 + .7, typeB: C.cardUp5 - .5, seed: 5 }),
    ] }),

    // 64.9 - 70.9 s: kart — "yavaş yavaş emin adımlarla": taslak, temel blokları tek tek oturur; "temelini": tik; "devam": katlar yükselir
    L.scene({ id: 'temel', from: C.cardUp5 + .1, to: C.expand5 + .3, under: true, exit: { a: C.expand5 - .05, b: C.expand5 + .2, dy: 60 }, parts: [
      L.stepNum({ ...STEP, text: '4', t: ws(150), out: C.expand5 + .2 }),
      L.building({ x: 540, y: 716, cols: 3, bw: 190, bh: 78, gap: 12, floorH: 84, ghost: C.cardUp5 + .4,
                   base: [ws(153), ws(154), ws(155)], floors: [C.devam, C.devam + .22, C.devam + .44], done: { t: C.temel } }),
    ] }),

    // 70.9 - 77.3 s: tam ekran — "test" / "yayın" çipleri (tik), "verimli"de yeşil yükseliş rozeti + punch-in
    L.scene({ id: 'verim', from: C.expand5 + .1, to: C.shrink6 + .2, exit: { a: C.shrink6 - .08, b: C.shrink6 + .12, dy: 40 }, parts: [
      L.flow({ size: 124, nodes: [
        { x: 730, y: 620, icon: 'flask', t: C.test, check: C.test + .3, shape: 'circle' },
        { x: 900, y: 620, icon: 'rocket', t: C.yayin2, check: C.yayin2 + .3, shape: 'circle' },
      ] }),
      L.badge({ icon: 'trend', x: 815, y: 840, t: C.verimli, style: 'green', size: 150, iconScale: 2.2 }),
    ] }),

    // 77.3 - 83.1 s: kart CTA — "bu verimli kullanımı": editör yazılır; "Instagram"da takip kartı (profil logosu, sahte rozet/sayı yok); "takip"te dokunma
    L.scene({ id: 'cta', from: C.shrink6 + .1, to: C.expand6 + .3, under: true, exit: { a: C.expand6 - .05, b: C.expand6 + .2, dy: 60 }, parts: [
      L.codeWindow({ x: 170, y: 292, w: 740, h: 430, t: C.shrink6 + .3, lines: 8, typeA: C.shrink6 + .5, typeB: C.insta - .3, seed: 11, out: C.insta }),
      L.followCard({ name: '@ornekmarka', sub: '', avatar: BRAND.logo.avatar, x: 140, y: 270, tIn: C.insta, tap: C.takip }),   // logo daireyi doldurur (video.css)
      L.touch({ x: 540, y: 658, size: 96, t: C.takip }),                                  // takip butonu merkezi (kart 140,270 + 400,388)
    ] }),

    // kapanış (son kart yok): C.end'de yüz son karede donar, hafif kararır/bulanıklaşır (yüz görünür kalır)
    L.scene({ id: 'freeze', from: END, z: 5, parts: [L.freezeFace({ t: END, dim: .3, blur: 2, dur: .35 })] }),
    // 84.4 - 88.4 s: "edit": kancadaki zaman çizelgesi kancadaki yerinde geri gelir, imleç kaldığı yerden C.end'de sona varır, parlayıp durur
    // ("kurgu bitti"); "yorum": yazıyor balonu (kapanışta söner)
    L.scene({ id: 'final', from: C.expand6 + .1, parts: [
      L.editTimeline({ ...TL0, t: C.edit - .05, play: { a: C.edit + .1, b: END, from: .42, to: 1 }, done: END }),
      L.typingBubble({ x: 700, y: 600, size: 110, t: C.yorum, tail: 'left', out: END + .15 }),
    ] }),
    // hemen ardından kancanın başlığı aynı yerde geri kurulur, 'yapay zekâ' sarı çarpar -> son kare ≈ ilk kare (döngü). Yeni yazı yok.
    L.headline({ ...HEAD, id: 'outro', t: END + .12, pre: 0, enter: { s: 1.12, dy: -14 }, hit: { line: 1, t: END + .45, color: 'var(--yellow)', from: 1.3 } }),   // alttan kısa yükselir (üst sınır)
  ],
});
