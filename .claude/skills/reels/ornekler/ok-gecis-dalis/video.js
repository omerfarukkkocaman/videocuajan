// ÖRNEK: ok-gecis-dalis — uzun REKLAM (45+), sahne yoğunluğu, derinlik (V.matte) + OK GEÇİŞLERİ + kameranın ekranın İÇİNE dalışı.
// Ne zaman: "sorun -> çözüm -> eğitim/hizmet -> form" akışlı reklam; kişi uzak/orta planda çekilmiş 4K kaynak, form CTA, döngü YOK.
//   Pencereler omzun arkasından yükselir, ok kişinin başının üstünden kıvrılıp ekrandaki noktaya çizilir, kamera o noktadan ekrana dalar.
// Plan stili: kind face, density sahne, captions vurgulu, formats ['9x16'] (kod F.pick ile 1x1'e hazır; 1x1 dalı taslak), plan.json "matte": true,
//   libs yok (L.* + V.natural yaysız geçiş), son kart yok (yüz son karede donar, form kartı kalır).
// Cue'lar (C.<ad>; C.end motordan): card1, wipe1, soru, dive, ornek, egitim, cta, crm, erp, uymaz, crmApp, hookHit, genel, yuk, build, done, aiOn, ai,
//   ozel, gecir, az, adim, form
// Ekran metinleri yer tutucudur (marka 'Örnek Marka'); CRM / ERP gibi genel terimler örnek kanca içeriğidir.
// Mod sırası (9x16; her mod değişimi bir alım değişimine denk gelir; kart <-> tam ekran geçişi kesimden 0.3 s önce başlar, kesim hareketin ortasına düşer):
//   full (kanca ~3.7 s; ardından CRM / ERP pencereleri omuzların ARKASINDAN yükselir; V.matte) -> card (pencere + oturmayan yapboz, gri ton)
//   -> hidden#1 (iş yükü: belgeler üst üste biner, EK İŞ YÜKÜ yumuşak damga) -> full (soru; "noktada" ekran omzun arkasından yükselir,
//   OK kişinin yanından başının üstünden kıvrılarak ekrandaki yapay zekâ noktasına çizilir, "devreye"de nokta yanar)
//   -> hidden#2 ("Artık": kamera ekranın İÇİNE dalar; hedef daire içerideki yapay zekâ düğümüne dönüşüp yerine küçülür; özel yazılım kendini kurar, tik)
//   -> full (müşteri listesi omzun arkasından) -> card ("Bu müşteri…": liste üst alana geçer; "kendime": liste sola küçülüp griye döner,
//   OK ile sağdaki özel pencereye geçilir, "hayata"da tik) -> full ("bunları": özel pencere omzun arkasından döner; "A'dan Z'ye": yol, "adım adım")
//   -> card (form CTA; kapanışta yüz kameraya baktığı karede donar).
// KAYNAK UZAK ÇEKİM (2160x3840): tam ekran zoom 1.7 (belden yukarı orta plan, kayıpsız), kartta 2.0 (baş + omuzlar). Saç üstü motor korur.
// DERİNLİK (V.matte): kişi katmanı yalnız kanca, yapay zekâ anı ve eğitim bölümünde açık; kartlarda kapalı (oda ile aynı piksel, görünmez geçiş).
//   V.matte.roomZ 4: ilk karttan sonra tam ekranda da 'behind' sahneler odanın üstünde, kişinin arkasında.
// 45+: sakin tempo (V.natural yaysız geçiş, transScale 1.3), iri altyazı (capFs 70), yumuşak damga; sarsıntı ve flaş yok (açılış dahil);
//   her anda tek fikir, en fazla 1-2 eleman; büyük yazısız ikonlar; etiketler 1-2 kelime (yalnız söylenenler).
// Tüm zamanlar plan.json cues'tan (C.xxx), kelime başlangıcından (word(i).s) ya da timeline'ın kesim listesinden gelir; elle saniye yok.
// 1x1 DALI TASLAK: F.pick değerleri yazıldı (kanca kartta, yüz sağda); 1x1 istenirse stills + safe ile ayarlanmalı.
const END = C.end;
const ws = i => word(i).s, we = i => word(i).e;
const TLD = window.TIMELINE;
const JUMP = t => TLD.jumps.reduce((b, j) => Math.abs(j - t) < Math.abs(b - t) ? j : b, Infinity);   // t'ye en yakın kesim
const JN = (t, d) => { const j = JUMP(t); return Math.abs(j - t) < .45 ? j : d; };   // t'nin 0.45 s yakınındaki kesim (yoksa d)
const NAT = { d: .8, fade: .5, out: .4, dy: 30 }, TS = 1.3;          // doğal geçiş (V.natural) x 45+ yavaşlatma
const SHRINK = NAT.d * TS, FADEIN = NAT.fade * TS, FADEOUT = NAT.out * TS;   // gerçek süreler: kart küçülme/büyüme, zemin/kart belirme, kart sönme
const YEL = '#FFD23F', BLUE = '#2F6BFF';
const SOFT = { from: { y: 30, s: .98, o: 0 }, to: { y: -16, s: 1, o: 0 }, zeta: .95, f: 1.4, fade: .6 };   // büyük kart: yerinde süzülür
const BGHOLD = ['linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px) 36px 36px / 72px 72px',   // motorun #bg zemini (ızgara + degrade), birebir
  'linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px) 36px 36px / 72px 72px',
  'radial-gradient(120% 60% at 50% -10%, rgba(47,107,255,.28), rgba(47,107,255,0) 60%)', 'linear-gradient(180deg, #0D2440 0%, var(--navy) 55%, #08182A 100%)'].join(', ');

// ---------- geçiş anları (cue + kesim): her mod değişimi alım değişimini örter ----------
const PRE = .3;                                                      // kart <-> tam ekran geçişi kesimden bu kadar önce başlar: kesim hareketin ortasına düşer
const CARD1 = JN(C.card1, C.card1 + .2) - PRE;                       // tam ekran -> kart (6.4 kesimi küçülmenin içinde; jump zoom yok)
const W1 = JN(C.wipe1, C.wipe1 + .2) - .5;                           // kart yerinde söner; kesim sönüş bitince (eski alımın son karesi görünmez)
const REV = JN(C.soru, C.soru + .2) - .08;                           // gizli -> tam ekran: içerik önce söner, kişi kesimden hemen önce belirir
const DIVE = C.dive;                                                 // "Artık": ekranın içine dalış (kesim yok)
const ORN = JN(C.ornek, C.ornek + .2) - .08;                         // gizli -> tam ekran: içerik önce söner, kişi kesimden hemen önce belirir
const CARD2 = ws(1328) - .15;                                        // "Bu müşteri…": tam ekran -> kart (cümle arası; kesim yok)
const EGT = JN(C.egitim, C.egitim + .2) - PRE;                       // kart -> tam ekran (38.33 kesimi büyümenin içinde)
const CTA = JN(C.cta, C.cta + .2) - PRE;                             // tam ekran -> kart (46.67 kesimi küçülmenin içinde)
const SKIPJ = [C.card1, C.egitim, C.cta].map(JUMP);                  // bu üç kesimde jump zoom değişmez (geçiş hareketi örter, %9 sıçrama yok)
const HOLD = we(1552) - .13;                                         // kapanışta donan kare: "görüşelim" biterken kameraya bakıyor (sonrası aşağı-yana bakış)
const AIUP = ws(1800) + .3;                                          // "noktada": ekran omzun arkasından yükselmeye başlar

defineVideo(F => {
  const P = F.pick, SQ = F.id === '1x1';
  const scene = o => L.softScene({ under: true, ...o });             // kart / gizli bölüm sahneleri (yumuşak çıkış)
  const behind = o => L.softScene({ layer: 'behind', ...o });        // kişinin arkasında (V.matte)
  const ZF = P({ '1x1': 1.25, default: 1.7 }), ZC = P({ '1x1': 2.0, default: 2.0 });   // tam ekran / kart yakınlaşması (kaynak 2160 px: kayıpsız)

  // ---------- kanca ----------
  const HK = P({
    '1x1': { lines: [['Kullandığınız'], ['yazılım'], ['işinize', 'göre', 'mi?']], sizes: [56, 64, 64], top: 120, cx: 310, gap: 4, hw: [1] },
    default: { lines: [['Kullandığınız', 'yazılım'], ['işinize', 'göre', 'mi?']], sizes: [74, 98], top: 268, cx: 540, gap: 6, hw: [1] },
  });
  // CRM / ERP pencereleri: omuzların arkasından yükselir (9x16: başın iki yanında, kancanın altında; 1x1: sol sütunda alt alta)
  const WIN = P({
    '1x1': [{ x: 80, y: 520, w: 220, h: 160, rot: -4, pill: 'CRM', t: C.crm, acc: BLUE }, { x: 320, y: 540, w: 220, h: 160, rot: 4, pill: 'ERP', t: C.erp, acc: '#1FB766' }],
    default: [{ x: 80, y: 640, w: 372, h: 258, rot: -5, pill: 'CRM', t: C.crm, acc: BLUE }, { x: 612, y: 656, w: 316, h: 230, rot: 5, pill: 'ERP', t: C.erp, acc: '#1FB766' }],
  });
  const HOUT = C.crm - .5;                                           // kanca "CRM"den 0.15 s önce yumuşakça çıkar (§2: ekranda ~3.7 s)
  const WOUT = CARD1 - .05;                                          // CRM / ERP pencereleri ardından tek başına, kart küçülmeden önce batar

  // ---------- kart#1: pencere + oturmayan yapboz (yuva: yanlara çıkıntılı; parça: alt-üste çıkıntılı, biraz büyük -> oturmaz) ----------
  const S1 = P({
    '1x1': { win: { x: 70, y: 150, w: 470, h: 290 }, slot: { x: 400, y: 330, s: 84 }, pz: { x: 300, y: 560, s: 96 }, mv: [{ x: 60, y: -150, r: 14 }, { x: 40, y: -120, r: 8 }] },
    default: { win: { x: 110, y: 300, w: 700, h: 360 }, slot: { x: 676, y: 548, s: 112 }, pz: { x: 884, y: 470, s: 124 }, mv: [{ x: -84, y: 50, r: 14 }, { x: -58, y: 44, r: 8 }] },
  });
  const PZ0 = C.uymaz - .45;                                         // yapboz parçası "bizim"de belirir, "işimize"de yuvaya kayar ama oturmaz

  // ---------- gizli#1: iş yükü yığını ----------
  const PAPT = [W1 + FADEOUT * .72, ws(1674), ws(1676), ws(1677), ws(1678), ws(1682)];   // belgeler sırayla biner ("daha"da sonuncusu)
  const PAP = P({ '1x1': { x: 400, y: 330, w: 280, h: 340, dy: 26, st: { x: 540, y: 800, size: 60 } },
                  default: { x: 350, y: 600, w: 380, h: 470, dy: 46, st: { x: 540, y: 1196, size: 92 } } });
  const PROT = [-4, 3, -2, 5, -5, 2], PDX = [0, 14, -10, 18, -16, 6];

  // ---------- yapay zekâ ekranı + ok + dalış ----------
  const AI = P({
    '1x1': { scr: { x: 640, y: 120, w: 340, h: 250 }, node: { x: 810, y: 255, s: 104 }, arr: { from: { x: 300, y: 330 }, c1: { x: 300, y: 120 }, c2: { x: 560, y: 110 }, to: { x: 750, y: 236 } } },
    default: { scr: { x: 592, y: 384, w: 408, h: 296 }, node: { x: 806, y: 548, s: 124 },
               arr: { from: { x: 318, y: 806 }, c1: { x: 160, y: 470 }, c2: { x: 470, y: 290 }, to: { x: 738, y: 522 } } },
  });
  // gizli#2 (içeride): yapay zekâ düğümü üstte, altında özel yazılım (taslak -> kendini kurar)
  const IN = P({
    '1x1': { hub: { x: 540, y: 150, s: 150 }, app: { x: 240, y: 290, w: 600, h: 420 } },
    default: { hub: { x: 540, y: 404, s: 190 }, app: { x: 150, y: 640, w: 780, h: 500 } },
  });
  // dalış sonu: ekran tam kadrajı kaplar, hedef daire DS katına çıkıp DTO'da durur; gizli#2'nin yapay zekâ düğümü aynı yer/boyutta başlar,
  // dalış birkaç karede söner (sarı -> sarı: hardal yok) ve düğüm küçülerek yerine gider. Daire güvenli alanda ve altyazıya binmez.
  const DS = P({ '1x1': 5, default: 4.8 }), DTO = P({ '1x1': { x: 540, y: 560 }, default: { x: 540, y: 760 } });   // daire altyazı bandının üstünde (alt kenar ~1058)
  const DIVED = 1.05, HUBGO = DIVE + DIVED + .01;                   // dalış süresi; düğümün küçülmeye başladığı an

  // ---------- örnek: müşteri listesi (tam ekranda başın yanında küçük -> kartta üst alan) -> (ok) -> özel pencere ----------
  const OR = P({
    '1x1': { list: { x: 70, y: 150, w: 480, h: 300 }, o: { x: 310, y: 300 }, mv: { x: -120, y: -40, s: .5 }, sm: { x: 470, y: -110, s: .5 },
             ozel: { x: 330, y: 300, w: 230, h: 220 }, arr: { from: { x: 190, y: 210 }, c1: { x: 210, y: 120 }, c2: { x: 300, y: 120 }, to: { x: 340, y: 290 } } },
    default: { list: { x: 170, y: 300, w: 740, h: 384 }, o: { x: 540, y: 492 }, mv: { x: -254, y: 26, s: .5 }, sm: { x: -290, y: 28, s: .48 },
               ozel: { x: 588, y: 316, w: 400, h: 330 }, arr: { from: { x: 352, y: 424 }, c1: { x: 382, y: 306 }, c2: { x: 520, y: 292 }, to: { x: 582, y: 384 } } },
  });

  // müşteri listesi penceresi: arkadaki (tam ekran) ve öndeki (kart) kopya birebir aynı (satırlar görünmeden hazır: boş kutu yok)
  const LIST = () => L.device({ kind: 'list', ...OR.list, t: C.crmApp - .05, build: { a: C.crmApp - .5, b: C.crmApp - .1 } });

  // ---------- eğitim (tam ekran): özel pencere omzun arkasından döner; A'dan Z'ye yol ----------
  const ED = P({
    '1x1': { win: { x: 650, y: 120, w: 330, h: 270 }, jr: { x0: 140, x1: 940, y: 150, size: 120, stepSize: 72 } },
    default: { win: { x: 618, y: 360, w: 360, h: 296 }, jr: { x0: 186, x1: 894, y: 410, size: 150, stepSize: 90 } },
  });

  const layout = [
    { t: 0, mode: P({ '1x1': 'card', default: 'full' }), zoom: P({ '1x1': ZC, default: ZF }) },
    { t: CARD1, mode: 'card', zoom: ZC },
    { t: W1, mode: 'hidden' },
    { t: REV, mode: 'full', zoom: ZF },
    { t: DIVE, mode: 'hidden' },
    { t: ORN, mode: 'full', zoom: ZF },
    { t: CARD2, mode: 'card', zoom: ZC },
    { t: EGT, mode: 'full', zoom: ZF },
    { t: CTA, mode: 'card', zoom: ZC },
  ].filter((l, i, a) => i === 0 || l.mode !== a[i - 1].mode);       // 1x1: kanca zaten kartta

  return {
  style: 2,
  frameShift: true,
  natural: NAT,                                                      // doğal geçiş (yaysız, çapraz geçiş, kart yerinde)
  transScale: TS,                                                    // 45+: geçişler 1.3 kat yavaş
  jumpEps: 1e-3,                                                     // jump zoom kesim karesinde
  jumpSkip: SKIPJ,                                                   // kart <-> tam ekran geçişinin içindeki kesimlerde zoom sıçraması yok
  introFlash: false, introZoom: false,                               // ilk kare (reklam önizlemesi) net; kanca okunurken yüz sabit
  slowPush: { rate: .004, max: .04 },                                // tam ekranda kesintisiz yavaş yakınlaşma (testere sıçraması yok)
  layout,
  capFs: P({ '1x1': 60, default: 70 }), capFsMin: P({ '1x1': 48, default: 54 }),   // İRİ altyazı (45+)
  capY: P({ '1x1': { full: 965 } }), capMaxLines: P({ '1x1': 1 }),
  punches: [{ t: ws(1792), amt: .04, z: .9, f: 1.6, until: ws(1797) }],   // soru ("kendi işime"): çok hafif yaklaşma, sıçramasız
  shakes: [], flashes: [],
  matte: {
    roomZ: 4,                                                        // ilk karttan sonra da tam ekranda 'behind' sahneler kişinin arkasında
    choke: .3,                                                       // maske kenarı içeri: saç çevresindeki açık oda halesi kesilir
    moves: [                                                         // kişi katmanı yalnız derinlik anlarında açık (oda ile aynı piksel: açılıp kapanması görünmez)
      { t: CARD1, d: 0, o: 0 },                                      // kartta kapalı (kart geçişleri motorda)
      { t: AIUP - .4, d: 0, o: 1 },                                  // yapay zekâ ekranı omzun arkasından
      { t: DIVE + .2, d: .12, o: 0, ease: 'inOutCubic' },            // dalış: ekran arkasında büyümeye başlarken kişi önde, ekran başa ulaşmadan hızla söner
      { t: ORN + FADEIN + .1, d: 0, o: 1 },                          // örnek: tam ekran oturduktan sonra (liste omzun arkasından)
      { t: CARD2, d: 0, o: 0 },
      { t: EGT + SHRINK + .05, d: 0, o: 1 },                         // eğitim: tam ekran oturduktan sonra
      { t: CTA, d: 0, o: 0 },
    ],
  },

  scenes: [
    // ===== 0 - 6.35 s: KANCA. 'Kullandığınız yazılım / işinize göre mi?' t=0'da okunur (arkasında yumuşak koyu zemin: duvar yazısının üstünde okunur);
    // "yazılımı"nda 'yazılım' yumuşakça sarıya döner (ses: yumuşak vuruş). "CRM"de bir uygulama penceresi kişinin sol omzunun ARKASINDAN yükselir
    // ('CRM' hapı), "ERP"de ikincisi sağ omzundan; ikisi hafif eğik, kişi önde. Hepsi kart küçülmeden önce omuzların arkasına geri batar.
    ...P({ '1x1': [], default: [L.scene({ id: 'hookScrim', z: 2, from: 0, to: HOUT + .4, parts: [
      L.scrim({ x: 540, y: 362, w: 1560, h: 560, a: .84, t: 0, out: HOUT + .35, fade: .35 })] })] }),
    L.softHook({ lines: HK.lines, sizes: HK.sizes, top: HK.top, cx: HK.cx, gap: HK.gap, pre: .8, stagger: .05,
      hit: { words: HK.hw, t: C.hookHit - .1, dur: .12, color: YEL, grow: 1, pulse: .03 }, out: HOUT, outDur: .35 }),
    behind({ id: 'hookWin', from: C.crm - .1, to: CARD1, parts: WIN.map(w => L.emerge({ t: w.t - .06, from: { y: 240, s: .7, o: 0 }, zeta: .95, f: 1.4, fade: .5,
      origin: { x: w.x + w.w / 2, y: w.y + w.h }, to: { y: 240, s: .7, o: 0 }, out: WOUT, outDur: .4, parts: [
        L.device({ kind: 'window', x: w.x, y: w.y, w: w.w, h: w.h, rot: w.rot, t: w.t - .06, build: { a: w.t + .05, b: w.t + .7 }, accent: w.acc }),
        L.logoPill({ x: w.x + (w.rot < 0 ? 64 : w.w - 64), y: w.y + (w.rot < 0 ? -2 : -16), text: w.pill, size: P({ '1x1': 28, default: 40 }), style: 'yellow', t: w.t + .12 }),
      ] })) }),

    // ===== 6.4 - 11.2 s: KART#1 — kart oturunca üstte yazılım penceresi kurulur, içinde kesik çizgili boş yuva; "bizim"de sarı yapboz parçası
    // (yuvadan farklı çıkıntılı, büyük) belirir, "işimize"de yuvaya kayar ama oturmaz (eğik kalır, geri çekilir; X yok). "genel"de parça söner,
    // pencere ve yuva griye döner (etiket yok: altyazı söylüyor). Kartla birlikte yerinde söner.
    scene({ id: 'sorun', from: CARD1 + .6, to: W1 + FADEOUT + .05, exit: { a: W1 - .05, b: W1 + .35, dy: 0 }, parts: [
      L.tone({ t: C.genel, dur: .5, gray: 1, o: .6, dim: .9, parts: [
        L.device({ kind: 'window', ...S1.win, t: CARD1 + SHRINK * .75, build: { a: CARD1 + SHRINK * .75 + .15, b: CARD1 + SHRINK + .45 } }),
        L.puzzle({ ...S1.slot, size: S1.slot.s, ghost: true, knobs: { t: 0, r: 1, b: 0, l: 1 }, t: CARD1 + SHRINK + .35 }),
      ] }),
      L.puzzle({ ...S1.pz, size: S1.pz.s, knobs: { t: 1, r: 0, b: 1, l: 0 }, t: PZ0, out: C.genel + .1, outDur: .35, moves: [
        { a: C.uymaz - .1, b: C.uymaz + .5, ...S1.mv[0] },          // yuvaya kayar, kenarında eğik takılır
        { a: C.uymaz + .62, b: C.uymaz + 1.05, ...S1.mv[1] },       // sakin geri çekilme (X yok)
      ] }),
    ] }),

    // ===== 11.2 - 16.6 s: GİZLİ#1 'EK İŞ YÜKÜ' — kart söner; belgeler ortada sırayla üst üste biner (yığın büyür: "işimizi", "kolaylaştırmak",
    // "yerine", "bir", "daha"); "ek"te kırmızı EK İŞ YÜKÜ yumuşak damgası yığının altına oturur (sarsıntı yok). Kişiye dönmeden önce söner.
    scene({ id: 'yuk', from: PAPT[0] - .05, to: REV + .12, exit: { a: REV - .32, b: REV + .06, dy: 0 }, parts: [
      ...PAPT.map((t, i) => L.paper({ x: PAP.x + PDX[i], y: PAP.y - i * PAP.dy, w: PAP.w, h: PAP.h, rot: PROT[i], t, lines: 6 })),
      L.softStamp({ text: 'EK İŞ YÜKÜ', t: C.yuk, x: PAP.st.x, y: PAP.st.y, rot: -4, size: PAP.st.size, color: 'var(--red)' }),
    ] }),

    // ===== 23.1 - 27.9 s: GİZLİ#2 (ekranın içi) — dalış biterken üstte yapay zekâ düğümü ("yapay"da yanar), altında özel yazılımın kesik çizgili
    // taslağı kendini yavaşça kurmaya başlar; "birlikte": yapay zekâdan yazılım taslağına ok; "yazılımları": gerçek uygulama taslağın yerine süzülür ve hızla
    // kurulur; "geliştirebiliyorsunuz": yeşil tik (ses: ding). Kart belirmeden önce söner. (Dalış sahnesi bunun ÜSTÜNDE: sahne sırası.)
    scene({ id: 'inside', from: DIVE + .75, to: ORN + .14, exit: { a: ORN - .32, b: ORN + .06, dy: 0 }, parts: [
      L.device({ kind: 'browser', ...IN.app, draft: true, t: HUBGO + .3, build: { a: HUBGO + .45, b: C.build - .15 }, out: C.build + .35 }),
      L.device({ kind: 'browser', ...IN.app, accent: BLUE, t: C.build - .08, build: { a: C.build + .02, b: C.done - .06 }, check: C.done }),
      // düğüm dalışın altında hazır bekler (pop + yanma halkası sahne görünmeden biter), dalış sönünce dalışın dairesiyle birebir aynı
      L.group({ origin: { x: IN.hub.x, y: IN.hub.y }, start: { x: DTO.x - IN.hub.x, y: DTO.y - IN.hub.y, s: AI.node.s * DS / IN.hub.s },
        moves: [{ a: HUBGO, b: HUBGO + .6, x: 0, y: 0, s: 1 }], parts: [
        L.flow({ size: IN.hub.s, ring: 1.2, nodes: [{ x: IN.hub.x, y: IN.hub.y, icon: 'cpu', t: DIVE + .1, on: DIVE + .12, color: 'var(--yellow)', ink: '#0B1F33', shape: 'circle' }] }),
      ] }),
      L.arrowPath({ from: { x: IN.hub.x + IN.hub.s * .55, y: IN.hub.y + 10 }, to: { x: IN.app.x + IN.app.w * .66, y: IN.app.y - 14 }, bend: -60,
        t: ws(1809), dur: .55, width: 10 }),
    ] }),

    // ===== 20.8 - 24.1 s: YAPAY ZEKÂ ANI (tam ekran, oda). "noktada": bilgisayar ekranı sağ omzunun ARKASINDAN yükselir (içinde beyaz hedef nokta);
    // "yapay": OK kişinin sol yanından başının üstünden kıvrılarak çizilir, "devreye"de ucu noktaya değer, nokta sarı yanar (ses: riser -> vuruş).
    // "Artık" (C.dive): kamera ekranın içine dalar — ekran hedef nokta etrafında büyüyüp tam ekranı kaplar ve söner, kişi ekranın önünde söner,
    // içeride gizli#2 açılır.
    behind({ id: 'aiScr', from: AIUP - .05, to: DIVE + 1.4, parts: [
      L.dive({ t: DIVE, dur: DIVED, focus: { x: AI.node.x, y: AI.node.y }, to: DTO, s: DS, fade: [.88, 1], parts: [
        L.emerge({ t: AIUP, from: { x: -30, y: 300, s: .62, o: 0 }, zeta: .95, f: 1.4, fade: .5, origin: { x: AI.scr.x + AI.scr.w / 2, y: AI.scr.y + AI.scr.h }, parts: [
          L.device({ kind: 'browser', ...AI.scr, t: AIUP, build: { a: AIUP + .1, b: AIUP + .75 } }),
          L.flow({ size: AI.node.s, nodes: [{ x: AI.node.x, y: AI.node.y, icon: 'cpu', t: AIUP + .55, on: C.aiOn, color: 'var(--yellow)', ink: '#0B1F33', shape: 'circle' }] }),
        ] }),
      ] }),
    ] }),
    L.softScene({ id: 'aiArrow', layer: 'front', from: C.ai, to: DIVE + .3, parts: [
      L.arrowPath({ ...AI.arr, t: C.ai + .04, dur: C.aiOn - C.ai - .04, width: P({ '1x1': 9, default: 12 }), dot: true, out: DIVE + .22, outDur: .25 }),
    ] }),

    // ===== 27.85 - 31.7 s: ÖRNEK (tam ekran) — kesimde kişi belirir; "müşteri"de müşteri listesi penceresi (avatar + satırlar, hazır dolu) sol omzunun
    // ARKASINDAN yükselir ve başının yanında durur. "Bu müşteri…" (C.card1 gibi cümle arasında) tam ekran -> kart: pencere kartla birlikte üst alana
    // geçip büyür (aynı pencerenin önde kopyası; arkadaki kopya o karede biter -> görünmez değişim).
    behind({ id: 'crmUp', from: C.crmApp - .1, to: CARD2, parts: [
      L.emerge({ t: C.crmApp - .05, origin: OR.o, from: { x: OR.sm.x + 40, y: OR.sm.y + 330, s: OR.sm.s * .7, o: 0 }, at: OR.sm, zeta: .95, f: 1.4, fade: .5, parts: [LIST()] }),
    ] }),
    // ===== 31.7 - 38.0 s: KART#2 — pencere üst alanda; "kendime" (OK GEÇİŞİ #2): liste sola küçülüp griye döner (genel), sağında renkli özel pencere belirir,
    // aralarına ok çizilir; "özel"de sarı halka; "konfigüre"de modüller kendi düzeninde kurulur; "yapay"da yapay zekâ rozeti, "hayata"da yeşil tik.
    // Kart büyümeden önce söner.
    L.softScene({ id: 'crmCard', layer: 'front', from: CARD2, to: EGT + .1, exit: { a: EGT - .35, b: EGT, dy: 0 }, parts: [
      L.group({ origin: OR.o, start: OR.sm, moves: [{ a: CARD2, b: CARD2 + SHRINK, x: 0, y: 0, s: 1 }, { a: C.ozel - .05, b: C.ozel + .55, ...OR.mv }], parts: [
        L.tone({ t: C.ozel + .1, dur: .45, gray: 1, o: .55, dim: .9, parts: [LIST()] }),
      ] }),
    ] }),
    scene({ id: 'ornek', from: CARD2 + .5, to: EGT + .1, exit: { a: EGT - .35, b: EGT, dy: 0 }, parts: [
      L.arrowPath({ ...OR.arr, t: C.ozel + .2, dur: .5, width: P({ '1x1': 8, default: 10 }) }),
      L.device({ kind: 'window', ...OR.ozel, accent: BLUE, t: C.ozel + .45, build: { a: ws(1335), b: ws(1336) + .25 }, lit: ws(1334) + .05, check: C.gecir }),
      L.badge({ icon: 'cpu', x: OR.ozel.x + 6, y: OR.ozel.y + 6, t: ws(1338), style: 'yellow', size: P({ '1x1': 64, default: 86 }), iconScale: P({ '1x1': 1.1, default: 1.4 }) }),
    ] }),

    // ===== 38.3 - 46.7 s: EĞİTİM (tam ekran). "bunları": özel pencere sağ omzun arkasından döner, "yapay"da köşesinde yapay zekâ rozeti;
    // "bizler"de omzun arkasına batar. "A'dan": üst bantta A ... Z yolu (koyu zemin üstünde), "Z'ye": Z; "adım adım": düğümler soldan sağa sırayla
    // sarı yanar; "öğretiyoruz": Z'de yeşil tik. Kart küçülmeden önce söner.
    behind({ id: 'egitim', from: ws(1871) - .1, to: CTA, parts: [
      L.emerge({ t: ws(1871) - .05, from: { x: -20, y: 300, s: .62, o: 0 }, zeta: .95, f: 1.4, fade: .5, origin: { x: ED.win.x + ED.win.w / 2, y: ED.win.y + ED.win.h },
        to: { y: 300, s: .62, o: 0 }, out: ws(1876) + .4, outDur: .45, parts: [
          L.device({ kind: 'window', ...ED.win, accent: BLUE, t: ws(1871) - .05, build: { a: ws(1871) + .05, b: ws(1871) + .6 } }),
          L.badge({ icon: 'cpu', x: ED.win.x + 6, y: ED.win.y + 6, t: ws(1872), style: 'yellow', size: P({ '1x1': 64, default: 80 }), iconScale: P({ '1x1': 1.1, default: 1.3 }) }),
        ] }),
      L.scrim({ x: 540, y: ED.jr.y + 10, w: 1600, h: 600, a: .68, t: C.az - .3, out: CTA - .02, fade: .35 }),
      L.journey({ ...ED.jr, from: 'A', to: 'Z', steps: 4, t: C.az, tSteps: C.az + .15, tEnd: ws(1879), lit: { t: C.adim, stagger: .12 },
        check: ws(1884), out: CTA - .02 }),
    ] }),

    // ===== 46.7 s - son: CTA (kart). Kart oturunca üstte büyük form kartı (marka avatarı + adı, yazısız alanlar, 'Formu doldur' düğmesi)
    // yerinde süzülür; "açıklamaya"da altında iri sarı ok; "Formu"da ok iki kez nazikçe zıplar, düğme hafif nabız (ses: tık); "görüşelim"de düğme nabız.
    // Son 1.13 s: yüz kartta son karede donar (hafif kararır), ekran aynı kalır; ok bir kez daha zıplar. Döngü yok, son kart yok.
    L.scene({ id: 'freeze', from: we(1552), z: 5, parts: [L.holdFace({ at: HOLD, t: END, dim: .12, blur: 0, dur: .4, frame: true })] }),
    L.scene({ id: 'zeminKal', from: END + .3, z: 2, parts: [L.backdrop({ t: END + .3, fade: .01, bg: BGHOLD })] }),
    L.softScene({ id: 'cta', from: CTA + SHRINK * .7, parts: [
      L.signupCard({ ...P({ '1x1': { x: 64, y: 178, w: 496, h: 460 }, default: { x: 210, y: 262, w: 660, h: 392 } }), t: CTA + SHRINK * .72, fields: 2,
        brand: { text: 'Örnek Marka' }, button: { text: 'Formu doldur', size: 44 }, pulse: [C.form, ws(1552)],
        arrow: { in: ws(1546) + .1, t: C.form, n: 2, per: .45, size: P({ '1x1': 110, default: 104 }), gap: P({ '1x1': 14, default: 12 }), again: END + .15 } }),
    ] }),
  ],
  };
});
