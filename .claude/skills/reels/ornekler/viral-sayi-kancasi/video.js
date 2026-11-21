// ÖRNEK: viral-sayi-kancasi — VİRAL tempo: dev sayı kancası ('%30'), cevabı sonda grafikle (halka), 1-2 s'de bir görsel olay, döngü kapanışı.
// Ne zaman: merak + sayı ile açılan bilgi / seri açılışı videosu; yorum balonunda somut soru, logolu takip kartı; son kart yok (brand.json "end": "loop").
// Plan stili: kind face, density sahne, captions vurgulu, formats ['9x16'], libs yok (L.* v8 bileşenleri), son kart kapalı (döngü).
// Cue'lar (C.<ad>; C.end/C.total motordan): cardUp0, wipe1, expand1, cardUp1, wipe2, cardUp2, expand2, wipe3, cardUp3, expand3, cardUp4, hook, tikan, dogru,
//   yuzde, para, otomatize, uygulama, pazarlama, ticari, yzpaz, ornek, app, appAdi, ev, icecek, onlarca, influencer,
//   turk, dunya, test, strateji, reklam, seri, girisim, yorum, takip, devam
// Ekran metinleri yer tutucudur (uygulama adı 'Örnek App', hesap '@ornekmarka'); takip kartı avatarı BRAND.logo.avatar (brand.json).
// Kanca (merak + sayı): 'Uygulama, işin sadece' + DEV '%30'u' (t=0'da okunur, beyaz); "kim yapacak"ta sarıya döner ve çarpar (punch + flaş).
//   Cevabı ~50 s'de halka grafiği verir (%30 dilimi sarı, kalan gri + '?'); kartta kalan kısım Strateji / Reklam sistemi ile dolar. '%70' yazılmaz.
// Mod sırası: full (kanca) -> card (Gelir + Otomasyon -> yapay zekâ -> uygulama) -> hidden#1 (telefon -> fiyat etiketi -> PAZARLAMA)
//   -> full (yapay zekâ -> pazarlama akışı, TIKANIYORLAR damgası) -> card (konum, geliştirici -> örnek uygulama telefonu, ev + içecekler)
//   -> hidden#2 (tek video -> onlarca video karosu, üreticiler) -> card (dünya noktaları, test tikleri) -> full ('Pazarlama' + tik)
//   -> hidden#3 (halka grafiği, %30) -> card (Strateji, Reklam sistemi) -> full (Pazarlama serisi, roket, ampul)
//   -> card (yorum balonu, takip kartı + dokunma, devam oku) -> döngü kapanışı (son kart yok: marka "end": "loop").
// Büyük yazı vuruşları: kanca %30, PAZARLAMA, TIKANIYORLAR, halka ortasında %30. Flaş: kanca, tıkanma, %30 cevabı.
// KADRAJ: yüz kaynakta solda (x≈0.41): tam ekranda 1.2 yakınlaştırma yüzü ortalar; saç üstü y≈520 takip (gerçek saç ≈590; headroomFull), üst bant 250-560 grafiklere.
// DÖNGÜ: kapanışta kart tam ekrana açılır (jump cut zoom paritesi telafi edilir, kadraj t=0 ile aynı), yüz donar, kanca t=0'daki yerine döner,
//   '%30'u' son vuruşta sarı çarpar, sonda beyaza döner; kararma geri alınır -> son kare t=0 ile aynı görünür.
// Dürüstlük: üçüncü taraf uygulamanın logosu / arayüzü çizilmez (jenerik telefon, yalnız ad yazısı); bayrak, ülke adı, sahte sayı yok.
// Tüm zamanlar plan.json cues'tan (C.xxx) ya da kelime başlangıcından (word(i).s) gelir; elle saniye yok.
const END = C.end, TOTAL = C.total;
const ws = i => word(i).s;
const YEL = '#FFD23F', SKY = '#5DB3F0', GRN = '#1FB766';
const ZF = 1.2;                                             // tam ekran yakınlaştırma (kartta 1.0)
// kapanış kadrajı t=0 ile aynı olsun: C.end'e kadar tek sayıda jump cut varsa motorun x1.09 jump zoom'u telafi edilir
const JK = window.TIMELINE.jumps.filter(j => j <= END).length % 2 ? 1.09 : 1;
// kanca başlığı: açılışta ve kapanışta birebir aynı yer / boyut (Reels başa sarınca kesintisiz döngü)
const HOOK = { lines: [['Uygulama,', 'işin', 'sadece'], ["%30'u"]], sizes: [64, 228], top: 262, gap: 0, stagger: .05 };
const SCRIM = { x: 540, y: 400, w: 1400, h: 600, a: .5 };  // kanca arkasında yumuşak koyuluk (açık tavan üstünde okunurluk)

defineVideo({
  style: 2,
  frameShift: true,                                         // kart<->tam ekran geçişinde yüz sıçramasın
  introZoom: false, introFlash: false,                      // döngü: ilk kare = son kadraj (kanca t=0'da okunur)
  slowPush: { rate: .004, max: .05 },                       // testere itme yerine kesintisiz yavaş yakınlaşma (kapanışta 72.0'da sıçrama olmasın)
  headroomFull: 520,                                        // tam ekranda saç üstü aşağıda: üst bant grafiklere
  layout: [
    { t: 0, mode: 'full', zoom: ZF },
    { t: C.cardUp0, mode: 'card' },
    { t: C.wipe1, mode: 'hidden' },
    { t: C.expand1, mode: 'full', zoom: ZF },
    { t: C.cardUp1, mode: 'card' },
    { t: C.wipe2, mode: 'hidden' },
    { t: C.cardUp2, mode: 'card' },
    { t: C.expand2, mode: 'full', zoom: ZF },
    { t: C.wipe3 - .1, mode: 'hidden' },                    // görsel silme cue'dan 0.1 s önce: wipe3 öncesi 1 karelik jump görünmesin
    { t: C.cardUp3, mode: 'card' },
    { t: C.expand3, mode: 'full', zoom: ZF },
    { t: C.cardUp4, mode: 'card' },
    { t: END - .2, mode: 'full', zoom: ZF / JK },          // kapanış: sessiz kuyrukta kart açılır; jump cut zoom'u telafi (kadraj t=0 ile aynı)
  ],
  punches: [
    { t: ws(6), amt: .03, z: .6, f: 2.5, until: C.cardUp0 },   // "pazarlamayı": hafif ön itme (vuruşu ezmez, üstüne eklenir)
    { t: C.hook, amt: .06, z: .5, f: 3, until: C.cardUp0 },
    { t: C.tikan, amt: .08, z: .45, f: 3, until: C.cardUp1 },
    { t: C.dogru, amt: .05, z: .5, f: 3, until: C.wipe3 - .1 },
  ],
  shakes: [{ target: 'face', t: C.tikan, d: .3, amp: 12, seed: 3 }],
  flashes: [{ t: C.hook, a: .35, d: .1 }, { t: C.tikan, a: .45, d: .1 }, { t: C.yuzde, a: .4, d: .1 }],
  hideCaptions: [[END - .3, TOTAL + 1]],                    // kapanışta altyazı yok

  scenes: [
    // 0 - 3.8 s: kanca — iki satır t=0'da okunur (beyaz; t=0 karesi = kapak); "yapay"da '%30'u' hafif nabız, "geliştirdiniz"de altına ince çizgi
    // çekilir, "pazarlamayı"da hafif punch-in; "kim yapacak"ta '%30'u' sarıya döner ve damga gibi çarpar (punch + flaş), çizgi de sarıya döner.
    // Başlık üst bantta, saçın üstünde; ilk mod değişiminden 0.05 s önce çıkar.
    L.scene({ id: 'hookBg', from: 0, to: C.cardUp0, z: 6, parts: [L.scrim({ ...SCRIM, t: 0, out: C.cardUp0 - .05, fade: .3 })] }),
    L.loopHeadline({ ...HOOK, pre: .6, hit: { line: 1, t: C.hook, color: YEL, from: 1.45 }, out: C.cardUp0 - .25,
      pulses: [{ t: ws(1), amt: .045, dur: .55 }], underline: { t: ws(4), y: 297, w: 560, h: 11, dur: .45 } }),

    // 3.8 - 10.3 s: kart — iki yol: "para kazanmak" Gelir (₺), "otomatize" Otomasyon (dişli); kesik çizgili boş yerler kart otururken belirir.
    // "yapay zekâ"da ikisi ortadaki yapay zekâ çipine bağlanır; "uygulama"da çip telefona bağlanır, telefon kurulur, "geliştiriyor" sonunda tik.
    L.scene({ id: 'yollar', from: C.cardUp0, to: C.wipe1 + .3, under: true, exit: { a: C.wipe1 - .05, b: C.wipe1 + .2, dy: 60 }, parts: [
      L.flow({ size: 160, labelSize: 36, nodes: [
        { x: 220, y: 366, icon: 'coin', label: 'Gelir', t: C.para, ghost: C.cardUp0 + .35, on: C.para + .05, color: 'var(--yellow)', ink: '#0B1F33' },
        { x: 220, y: 614, icon: 'gear', label: 'Otomasyon', t: C.otomatize, ghost: C.cardUp0 + .45, on: C.otomatize + .05, color: 'var(--sky)', ink: '#0B1F33', anim: 'spin' },
        { x: 505, y: 478, icon: 'cpu', t: ws(20), ghost: C.cardUp0 + .55, on: ws(20) + .05, color: 'var(--yellow)', ink: '#0B1F33', shape: 'circle', size: 150 },
        { x: 712, y: 500, text: '', size: 0, t: Infinity },                                  // telefonun sol kenarı (ok ucu)
      ], links: [{ from: 0, to: 2, t: ws(20) - .05 }, { from: 1, to: 2, t: ws(20) + .08 }, { from: 2, to: 3, t: C.uygulama + .1 }],
      tokens: [{ a: C.uygulama + .35, b: C.uygulama + 1.0, path: [0, 2, 3] }, { a: C.uygulama + .45, b: C.uygulama + 1.1, path: [1, 2, 3] }] }),
      L.device({ kind: 'phone', x: 722, y: 282, w: 236, h: 450, t: C.uygulama, build: { a: C.uygulama + .15, b: C.uygulama + .8 }, check: ws(24) + .35 }),
    ] }),

    // 10.3 - 15.3 s: hidden#1 — telefon ortada; "ikisi de": iki hedef (₺, dişli) yanında; "ticari": fiyat etiketi köşesine çarpar (hedefler söner);
    // "dönüşüyor": telefon sarı halkayla parlar; "pazarlama": BÜYÜK 'PAZARLAMA' dolarak çarpar + megafon (sarsıntı). Silme ile geri açılır.
    L.scene({ id: 'ticari', from: C.wipe1 + .05, to: C.expand1 + .32, under: true, shake: { t: C.pazarlama, d: .35, amp: 12, seed: 4 }, parts: [
      L.device({ kind: 'phone', x: 350, y: 500, w: 380, h: 720, t: C.wipe1 + .15, build: { a: C.wipe1 + .25, b: C.wipe1 + .8 }, lit: ws(33) }),
      L.badge({ icon: 'coin', x: 190, y: 820, t: ws(26), style: 'white', size: 160, iconScale: 2.3, out: C.ticari }),
      L.badge({ icon: 'gear', x: 890, y: 820, t: ws(26) + .1, style: 'white', size: 160, iconScale: 2.3, out: C.ticari }),
      L.badge({ icon: 'tag', x: 720, y: 540, t: C.ticari, style: 'yellow', size: 190, iconScale: 2.6, rot: 12 }),
      L.bigType({ text: 'PAZARLAMA', x: 540, y: 300, size: 128, t: C.pazarlama, tGhost: C.pazarlama - .3, stagger: .035, color: YEL }),
      L.badge({ icon: 'megaphone', x: 352, y: 1180, t: C.pazarlama + .25, style: 'red', size: 190, iconScale: 2.5 }),
    ] }),

    // 15.4 - 21.6 s: tam ekran — "yapay zekâ ile": çip, "pazarlama": megafon; ok çizilir, jeton akar ("sanıyor"). "tıkanıyorlar"dan hemen önce söner,
    // yerine kırmızı TIKANIYORLAR damgası çarpar (punch + sarsıntı + flaş); damga kart yükselirken üst alanda kalır, konum pininden önce söner.
    L.scene({ id: 'yzpaz', from: C.expand1 + .1, to: C.tikan + .05, parts: [
      L.flow({ size: 170, nodes: [
        { x: 310, y: 395, icon: 'cpu', t: C.yzpaz, on: C.yzpaz + .05, color: 'var(--yellow)', ink: '#0B1F33', shape: 'circle' },
        { x: 770, y: 395, icon: 'megaphone', t: ws(44), on: ws(44) + .05, color: 'var(--sky)', ink: '#0B1F33' },
      ], links: [{ from: 0, to: 1, t: ws(44) - .1, dur: .4 }],
      tokens: [{ a: ws(45), b: ws(46) + .3, path: [0, 1] }, { a: ws(47), b: ws(50) + .2, path: [0, 1] }], out: C.tikan - .02 }),
    ] }),
    L.scene({ id: 'tikan', from: C.tikan - .05, to: ws(55) - .1, exit: { a: ws(55) - .4, b: ws(55) - .15, dy: 40 }, parts: [
      L.stamp({ text: 'TIKANIYORLAR', t: C.tikan, x: 540, y: 400, rot: -4, size: 84 }),
    ] }),

    // 22.3 - 32.2 s: kart — "Türkiye'den": konum pini; "Bir Türk geliştirici": geliştirici + kod rozeti; "uygulama çıkardı": telefon,
    // ok bağlanır; uygulamanın adı söylenince: ekranda yalnız uygulama adı yazılır (jenerik; logo/arayüz yok); "evde": ev, "içecekler": üç içecek kutucuğu;
    // "hazırlayabilmenize": telefon sarı halkayla parlar.
    L.scene({ id: 'ornek', from: C.cardUp1, to: C.wipe2 + .3, under: true, exit: { a: C.wipe2 - .05, b: C.wipe2 + .2, dy: 60 }, parts: [
      L.badge({ icon: 'pin', x: 300, y: 340, t: C.ornek, style: 'yellow', size: 130, iconScale: 1.9 }),
      L.flow({ size: 196, nodes: [
        { x: 300, y: 560, icon: 'user', t: C.app, on: C.app + .05, color: 'var(--sky)', ink: '#fff', shape: 'circle' },
        { x: 630, y: 520, text: '', size: 0, t: Infinity },
      ], links: [{ from: 0, to: 1, t: ws(96) + .05, dur: .35 }] }),
      L.badge({ icon: 'code', x: 386, y: 640, t: ws(94), style: 'yellow', size: 88, iconScale: 1.2 }),
      L.phoneApp({ x: 630, y: 278, w: 320, h: 462, t: ws(96), title: 'Örnek App', tTitle: C.appAdi, titleSize: 44, accent: '#2F6BFF', lit: ws(104),
        tiles: [{ icon: 'home', t: C.ev, color: '#2F6BFF' }, { icon: 'glass', t: C.icecek, color: '#F59E0B' },
                { icon: 'mug', t: C.icecek + .12, color: '#E5383B' }, { icon: 'bottle', t: C.icecek + .24, color: '#1FB766' }] }),
    ] }),

    // 32.5 - 40.2 s: hidden#2 — tek dikey video karosu; "o Türk geliştirici": karonun köşesine geliştirici + kod rozeti gelir, karo "oynar"
    // (nefes alır, oynat düğmesi nabız); "onlarca": geliştirici söner, karo küçülüp yerine geçer, karolar dışa doğru hızla çoğalır (sayı yok);
    // "yabancı influencer'lara": üst sırada üretici silüetleri + küre rozeti; "Türk içerik üreticilerine": ikinci sıra + konum rozeti.
    L.scene({ id: 'videolar', from: C.wipe2 + .1, to: C.cardUp2 + .3, under: true, exit: { a: C.cardUp2 - .1, b: C.cardUp2 + .15, dy: 60 }, parts: [
      L.videoWall({ x: 200, y: 400, w: 725, h: 737, cols: 5, rows: 3, gap: 16, t: C.wipe2 + .2, heroW: 340, tMulti: C.onlarca, multDur: .85, seed: 7,   // duvar x 200-925: sağ buton sütunundan (x>930) uzak
        heroPlay: ws(113) + .1,
        people: [{ cells: [0, 1, 2, 3, 4], t: C.influencer + .08, stagger: .07, ring: SKY }, { cells: [5, 6, 7, 8, 9], t: C.turk + .08, stagger: .07, ring: YEL }] }),
      L.flow({ size: 150, nodes: [{ x: 395, y: 470, icon: 'user', t: ws(113), on: ws(113) + .05, color: 'var(--sky)', ink: '#fff', shape: 'circle' }], out: C.onlarca + .15 }),
      L.badge({ icon: 'code', x: 456, y: 532, t: ws(114), style: 'yellow', size: 76, iconScale: 1.05, out: C.onlarca + .15 }),
      L.badge({ icon: 'globe', x: 126, y: 517, t: C.influencer, style: 'white', size: 104, iconScale: 1.55 }),
      L.badge({ icon: 'pin', x: 126, y: 768, t: C.turk, style: 'yellow', size: 104, iconScale: 1.55 }),
    ] }),

    // 39.5 - 43.4 s: kart — jenerik dünya noktaları (ülke adı / bayrak yok); başlangıç noktası sarı nabız; "tüm dünyada": noktalar ondan dışa
    // dalgayla yanar; "test": birkaç noktada yeşil tik rozetleri sırayla çarpar.
    L.scene({ id: 'dunya', from: C.cardUp2 + .05, to: C.expand2 + .3, under: true, exit: { a: C.expand2 - .05, b: C.expand2 + .2, dy: 60 }, parts: [
      L.worldDots({ x: 100, y: 318, w: 880, t: C.cardUp2 + .2, origin: { c: 28, r: 6, t: C.cardUp2 + .6 }, lit: { a: C.dunya, b: C.dunya + .9 }, markSize: 62,
        marks: [[10, 6], [23, 4], [34, 9], [17, 14], [42, 6], [41, 16]].map(([c, r], i) => ({ c, r, t: C.test + i * .09 })) }),
    ] }),

    // 43.4 - 47.4 s: tam ekran — "pazarlamayı": üst bantta 'Pazarlama' çipi; "doğru": ikon yeşil tike döner (punch-in)
    L.scene({ id: 'dogru', from: C.expand2 + .1, to: C.wipe3, exit: { a: C.wipe3 - .22, b: C.wipe3 - .02, dy: 30 }, parts: [
      L.chips({ x: 540, y: 320, anchor: 'center', size: 58, items: [{ icon: 'megaphone', text: 'Pazarlama', t: ws(141), check: C.dogru }] }),
    ] }),

    // 48.0 - 59.5 s: hidden#3 -> kart — halka çizilir (gri); "Uygulama": telefon rozeti + 'Uygulama' etiketi; "işin": '?'; "sadece": %30 diliminin
    // kesik çizgili gölgesi; "%30'unu": dilim sarı dolar, ortada sayaç 0 -> %30 çarparak sayar (flaş).
    // Kart yükselirken halka sol üste küçülür; sağda lejant: Uygulama, "strateji" (mavi dilim dolar, '?' söner), "reklam sistemi" (yeşil dilim);
    // "inşa": halka tamamlanır, nabız. Kalan kısmın yüzdesi yazılmaz.
    L.scene({ id: 'pasta', from: C.wipe3 - .05, to: C.expand3 + .3, under: true, exit: { a: C.expand3 - .05, b: C.expand3 + .2, dy: 60 }, parts: [
      L.group({ origin: { x: 540, y: 790 }, moves: [{ a: C.cardUp3 - .1, b: C.cardUp3 + .45, x: -232, y: -292, s: .66 }], parts: [
        L.donut({ x: 540, y: 790, r: 255, w: 120, t: C.wipe3 + .05, dur: .8,
          segs: [{ a: 0, b: .3, color: YEL, t: C.yuzde, dur: .45, ghost: ws(149) }, { a: .3, b: .65, color: SKY, t: C.strateji, dur: .55 }, { a: .65, b: 1, color: GRN, t: C.reklam, dur: .55 }],
          marks: [{ text: '?', at: .66, t: ws(148), out: C.strateji, size: 92 }],
          center: { text: '%30', t: C.yuzde, size: 150, color: YEL, count: { from: 0, to: 30, dur: .45, prefix: '%' } }, lit: ws(169) }),
        L.badge({ icon: 'phone', x: 862, y: 556, t: ws(145) + .05, style: 'white', size: 124, iconScale: 1.9, out: C.cardUp3 - .05 }),   // "Uygulama": dilimin yanında
        L.legend({ x: 600, y: 330, size: 44, items: [{ text: 'Uygulama', color: YEL, t: ws(145) + .2, out: C.cardUp3 - .05 }] }),
      ] }),
      L.legend({ x: 532, y: 362, size: 42, gap: 16, items: [
        { text: 'Uygulama', color: YEL, t: C.cardUp3 + .4 },
        { text: 'Strateji', color: SKY, t: C.strateji },
        { text: 'Reklam sistemi', color: GRN, t: C.reklam },
      ] }),
    ] }),

    // 58.7 - 66.5 s: tam ekran — "Bu seride": üst bantta 'Pazarlama serisi' çipi; "girişimlerinizde": roket; "nasıl": ampul
    L.scene({ id: 'seri', from: C.expand3 + .1, to: C.cardUp4 + .2, exit: { a: C.cardUp4 - .1, b: C.cardUp4 + .12, dy: 40 }, parts: [
      L.chips({ x: 540, y: 288, anchor: 'center', size: 54, items: [{ icon: 'megaphone', text: 'Pazarlama serisi', t: C.seri }] }),
      L.badge({ icon: 'rocket', x: 215, y: 485, t: C.girisim, style: 'yellow', size: 130, iconScale: 2.0 }),
      L.badge({ icon: 'bulb', x: 865, y: 485, t: ws(185), style: 'white', size: 130, iconScale: 2.0 }),
    ] }),

    // 67.4 - 72.1 s: kart CTA — "yorumlarınızı": yorum balonu "yazıyor…" ile açılır, sonra kancanın sorusu yazılır ('Pazarlamayı kim yapacak?',
    // 0-3.9 s'de söyleniyor) ve CTA boyunca kalır; "Takip": takip kartı (0.8 ölçek; profil logosu tam daire; sahte sayı/rozet yok),
    // "edin": parmak dokunuşu; "Devamını": sarı devam oku. Sessiz kuyrukta kart açılmadan önce söner.
    L.scene({ id: 'cta', from: C.cardUp4 + .05, to: END, under: true, exit: { a: END - .42, b: END - .2, dy: 60 }, parts: [
      L.commentBubble({ x: 116, y: 266, size: 106, fs: 45, text: 'Pazarlamayı kim yapacak?', t: C.yorum, tText: C.yorum + .5, tail: 'left' }),
      L.group({ origin: { x: 110, y: 384 }, start: { s: .8 }, parts: [
        L.followCard({ name: '@ornekmarka', sub: '', avatar: BRAND.logo.avatar, x: 110, y: 384, w: 640, h: 470, tIn: C.takip - .1, tap: ws(195) }),
      ] }),
      L.touch({ x: 366, y: 694, size: 84, t: ws(195) }),                                   // takip butonu merkezi (kart 110,384 + .8 x (320,388))
      L.badge({ icon: 'arrowRight', x: 800, y: 590, t: C.devam, style: 'yellow', size: 130, iconScale: 1.7 }),
    ] }),

    // döngü kapanışı (1.0 s; son kart yok): sessiz kuyrukta kart tam ekrana açılır; C.end'de yüz donar (hafif kararma), kanca t=0'daki yerine
    // döner, son vuruşta '%30'u' sarı çarpar; son ~0.4 s'de kararma kalkar, vurgu beyaza döner -> son kare t=0 ile aynı.
    L.scene({ id: 'freeze', from: END, z: 5, parts: [L.freezeLoop({ t: END, dim: .22, blur: 1.5, dur: .25, undo: { t: TOTAL - .42, dur: .3 } })] }),
    L.scene({ id: 'outroBg', from: END - .15, z: 6, parts: [L.scrim({ ...SCRIM, t: END - .15, fade: .25 })] }),
    L.loopHeadline({ ...HOOK, id: 'outro', t: END - .1, pre: 0, enter: { s: 1.12, dy: -14 }, hit: { line: 1, t: END + .03, color: YEL, from: 1.45 },
      off: TOTAL - .4, offDur: .28 }),
  ],
});
