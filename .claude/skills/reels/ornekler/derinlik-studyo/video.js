// ÖRNEK: derinlik-studyo — DERİNLİK / STÜDYO: kişi maskesi (V.matte) ile konuşmacı ayrı katman; grafikler onun ARKASINDAN çıkar.
// Ne zaman: karşılaştırma / test / "3 aracı denedim" videosu; oda söner -> stüdyo zemini, kesit PIP'e küçülür, ekrandan fırlar, geri döner.
//   Klasik yüz-alta kart düzeni yok. Sonuç ekranında üç site penceresi alt alta kayar.
// Plan stili: kind face, density sahne, captions vurgulu, formats ['9x16'], plan.json "matte": true (work/matte maskesi gerekir),
//   libs yok (L.* v9 bileşenleri), son kart yok (döngü: son kare = ilk kare).
// Cue'lar (C.<ad>; C.end/C.total motordan): studio1, sites, poll, sonuc, exit, real1, follow, prompt, logos, models, bench, aracA, aracB, aracC, efor, orta,
//   css, harici, html, favori, icerik, tasarim, anket, seri, takip
// Görseller projenin gorsel/ klasöründen: gorsel/logo_arac_a.svg, logo_arac_b.svg, logo_arac_c_beyaz.svg (karşılaştırılan araçların logoları;
//   yalnız modeli tanıtmak için), gorsel/site_a|b|c_masaustu_tam.png (her aracın ürettiği sitenin tam sayfa ekran görüntüsü, 1440 px genişlik).
// Ekran metinleri yer tutucudur: araç adları 'Araç A/B/C', model adları 'Model 1/2/3', puanlar örnek; hesap '@ornekmarka'.
// Kişi maskesi (work/matte) ile konuşmacının kesiti ayrı katmandır: grafikler onun ARKASINDAN çıkar (kafanın/omzun arkasından kayarak,
// yükselerek), oda sahne bazında söner (stüdyo zemini), kesit küçülür (PIP, kutusuz), ekrandan fırlar ve geri döner.
// Z-sırası: oda (1) / stüdyo -> arkada grafikler (layer 'behind', 4) -> kişi (5) -> önde küçük çipler + alt gölge (6) -> altyazı (8) -> flaş (10).
// Akış: oda + kanca (hero 'YAPAY ZEKÂ TESTİ' arkada kelime kelime gelir; logolar omuz üstünde küçük bekler, "Sizce"de yükselir, hero o anda
//   çekilir) -> yumuşak geçiş (oda çözülür, kadraj sıçramaz) -> stüdyo: ölçüt sütunları omzun arkasından -> model kartları kafanın arkasından
//   yana kayar, Efor: Orta -> PIP sağ alt: prompt yazılır, "Ve bunu yaparken" pencere üste toplanır, şart kartları PIP'in arkasından çıkar,
//   "JavaScript"te kamera yaklaşır -> oda, tam boy 'Şimdi gelsin sonuçlar' -> C.exit: kesit fırlar, oda kararır, SONUÇLAR (dramatik boşluk)
//   -> sonuç ekranı C.sites -> C.poll: üç site alt alta (masaüstü; konuşmacı yok): ana sayfalar sabit, hızlı iniş, yumuşak dönüş;
//   favori söylenince altın çerçeve + 'Editörün favorisi ★'; İçerik / Tasarım çipleri -> stüdyo: anket kartı başının arkasından
//   -> oda: "Sırada: üst modeller?" -> stüdyo: takip kartı -> döngü (son kare = ilk kare: kaynak karesi 1'e döner).
// Dürüstlük: sayılar kaynağından birebir (kaynak + tarih başlıkta); anket sonucu/sayı yok; logolar yalnızca modeli tanıtır; siteler modellerin gerçek çıktıları.
// Geçişler ('doğal olsun' geri bildirimiyle): kesit hareketleri yay yerine ease (zıplama yok), oda <-> stüdyo yumuşak çapraz geçiş
// (kesit önce yerine oturur, oda sonra gelir; çift görüntü olmaz), kartlar yerinde süzülür (küçükten fırlama yok). Tek istisna: C.exit fırlaması.
// Tüm zamanlar plan.json cues'tan (C.xxx) ya da kelime başlangıcından (word(i).s) gelir; elle saniye yok.
const END = C.end, TOTAL = C.total;
const ws = i => word(i).s, we = i => word(i).e;
const YEL = '#FFD23F';
// Araç C: beyaz logo koyu dairede (bg + pad: açık zeminli diğer logolarla aynı daire boyunda okunur)
const LG = { a: 'gorsel/logo_arac_a.svg', b: 'gorsel/logo_arac_b.svg', c: { src: 'gorsel/logo_arac_c_beyaz.svg', bg: '#0B0F17', pad: .22 } };
const SITE = n => `gorsel/${n}.png`;
const MODEL = {
  a: { logo: LG.a, name: 'Araç A', sub: 'Model 1', full: 'Araç A Model 1', color: '#4C8DF6' },
  b: { logo: LG.b, name: 'Araç B', sub: 'Model 2', full: 'Araç B Model 2', color: '#D97757' },
  c: { logo: LG.c, name: 'Araç C', sub: 'Model 3', full: 'Araç C Model 3', color: '#10A37F', pad: .22 },
};
// "Sizce hangisi kazandı?" -> stüdyo: 1. videodan 3. videoya kesim. Bu kesimde jump zoom değişmez (iki taraf aynı kadraj, V.jumpSkip);
// oda yumuşakça çözülür (derinlik bulanıklığı), kesit ease ile sola kayar.
const J1 = window.TIMELINE.jumps.find(j => Math.abs(j - C.studio1) < .4) ?? C.studio1 + .1;
// kapanış kadrajı t=0 ile aynı olsun: C.end'e kadar tek sayıda jump zoom değişimi varsa motorun x1.09'u telafi edilir
const JK = window.TIMELINE.jumps.filter(j => j <= END && Math.abs(j - J1) > 1e-3).length % 2 ? 1.09 : 1;

// ---------- kişi kesitinin durumları (origin: alt orta 540,1920; feather: kare kenarı yumuşatma, kare px) ----------
const FULL = { x: 0, y: 0, s: 1, r: 0, o: 1, feather: { l: 0, r: 0, t: 0, b: 0 } };
const LEFT = { x: -170, y: 0, s: .9, r: 0, o: 1, feather: { l: 0, r: 170, t: 0, b: 0 } };            // stüdyo: sağ sütun grafiklere
const PIPR = { x: 275, y: -170, s: .55, r: 0, o: 1, feather: { l: 150, r: 0, t: 0, b: 160 } };       // PIP sağ alt (yüz sağ buton sütunundan uzak)
const PIPR2 = { x: 262, y: -160, s: .6, r: 0, o: 1, feather: { l: 150, r: 0, t: 0, b: 160 } };       // "JavaScript": kamera yaklaşır
const PIPL = { x: -265, y: -170, s: .55, r: 0, o: 1, feather: { l: 0, r: 150, t: 0, b: 120 } };      // PIP sol alt (kare sol kenarı ekran dışında)
const MID = { x: 40, y: 0, s: .78, r: 0, o: 1, feather: { l: 130, r: 130, t: 0, b: 0 } };             // stüdyo: başın üstü grafiklere
const mv = (t, st, o = {}) => Object.assign({ t }, st, o);
const EASE = d => ({ ease: 'inOutCubic', d });                    // kesit: zıplamasız geçiş
const SOFT = { from: { y: 34, s: .97, o: 0 }, to: { y: 18, s: .98, o: 0 }, zeta: .95, f: 1.4, fade: .6 };   // kart: yerinde süzülür

// hero (kanca başlığı): konuşmacının ARKASINDA, başının üstünde (TESTİ'nin altı ile saç arası ≥ 20 px); kelime kelime ölçekle gelir (~0.8 s),
// "zekâya"da TESTİ sarı çarpar. Açılışta ve kapanışta aynı yer / boyut. Satır yüksekliği .9 (video.css): kutu harfe oturur.
const HOOK = { lines: [['YAPAY', 'ZEKÂ'], ['TESTİ']], sizes: [118, 156], top: 268, gap: 12, stagger: .22, z: 4, pre: 0, enter: { s: 1.25, dy: -24 } };
const HIT = ws(494) + .05;                                  // TESTİ vuruşu (kurulumdan sonra; t0'a göre)
// giriş logoları: [model, x, y, gecikme, omuz arkası x kayması] (sağdaki logo sola eğik yükselir: sağ buton sütununa girmez)
const LOGOS = [['a', 182, 850, 0, 0], ['b', 760, 680, .12, 0], ['c', 830, 880, .24, -70]];
// sonuç yığını (C.sites -> C.poll): üstte altyazı bandı (y ~256-344, V.capAt), altında üç pencere y 356-1498, aralarında 22 px;
// sola yaslı, sağ kenar x 928 (sağ buton sütunu boş; giriş sekmesi payı dahil)
const SW = { x: 72, y: 356, w: 856, h: 366, gap: 22 };
// kaydırma ritmi: ilk ~1.7 s ana sayfalar sabit, sonra hızlı iniş (~3.7 s), sonra C.poll'a kadar yumuşak dönüş
const SCR = { fastA: C.sites + 1.7, fastB: C.sites + 5.4 };
// stüdyo bölümlerinde ekranın altına hafif koyu gölge (önde): kesitin alt köşesindeki sandalye kolu / maske kalıntıları görünmez
const SHADE = 'linear-gradient(0deg, rgba(5,9,17,.9) 0%, rgba(5,9,17,.55) 11%, rgba(5,9,17,0) 23%)';
const shade = (id, a, b) => L.scene({ id, from: a, to: b + .35, layer: 'front', parts: [L.backdrop({ t: a, fade: .3, out: b + .3, outDur: .3, bg: SHADE })] });

defineVideo({
  style: 2,
  frameShift: true,
  introZoom: false, introFlash: false,                      // döngü: ilk kare = son kare (kanca t=0'da okunur)
  slowPush: { rate: 0, max: 1 },                            // testere itme yok (kesit + oda aynı geometri; döngüde kadraj sabit)
  jumpSkip: [J1],                                           // 1.->3. video kesiminde kadraj sıçramaz
  layout: [
    { t: 0, mode: 'full' },
    { t: END - .25, mode: 'full', zoom: 1 / JK },           // kapanış: jump cut zoom'u telafi (kadraj t=0 ile aynı)
  ],
  matte: {
    hold: { t: END, frame: 1 },                             // video bitince kaynak karesi 1 (kanca karesi): son kare = ilk kare
    ref: { x: 440, y: 800 },                                // stüdyo ışığı başın arkasını izler
    roomBlur: 14,                                           // oda sönerken / gelirken derinlik bulanıklığı
    choke: .3,                                              // maske kenarı içeri: saç üstündeki açık oda halesi kesilir
    room: [
      { t: J1 - .5, v: 0, d: .8 },                          // oda yumuşakça çözülür (kesim ortada; derinlik bulanıklığı): stüdyo
      { t: C.sonuc + .45, v: 1, d: .45 },                   // tam boy 'Şimdi gelsin sonuçlar' (kesit yerine oturduktan sonra)
      { t: C.exit - .03, v: 0, d: .12, ease: 'outCubic' },  // 'sonuçlar' biter bitmez oda kararır (flaşın altında)
      { t: C.real1 + .28, v: 1, d: .45 },                   // gerçek odaya dönüş ("Ama en üst modelleri…"; kesit oturduktan sonra)
      { t: C.follow - .15, v: 0, d: .45 },                  // takip: stüdyo (oda önce söner, kesit sonra küçülür)
      { t: END - .12, v: 1, d: .3 },                        // döngü: oda geri gelir (kesit yerine oturunca)
    ],
    moves: [
      mv(J1, LEFT, EASE(1)),                                // kesimde (oda neredeyse sönmüş) kesit ease ile sola kayar, küçülür
      mv(C.prompt + .08, PIPR, EASE(.75)),
      mv(ws(1398) - .12, PIPR2, EASE(.5)),                  // "JavaScript": PIP yaklaşır (pencere + kartlar da yaklaşır)
      mv(C.sonuc - .05, FULL, EASE(.55)),
      // C.exit: kısa geri çekilme, sonra ekranın sağından fırlar (hareket bulanıklığı) ve yok olur
      { t: C.exit, d: .1, x: -34, s: 1.015, ease: 'outCubic' },
      { t: C.exit + .1, d: .3, x: 1480, y: -50, r: 13, s: 1.08, ease: 'inCubic', blur: true },
      { t: C.exit + .4, d: 0, o: 0 },
      // C.sites -> C.poll: konuşmacı ekranda yok (sonuç yığını). C.poll'da siteler sönerken yerinde belirir (çapraz geçiş; alttan yükselme yok)
      mv(C.poll - .02, MID, { d: 0, o: 0, s: MID.s * .97 }),
      mv(C.poll + .05, MID, EASE(.5)),
      mv(C.real1 - .3, FULL, EASE(.55)),                    // gerçek oda
      mv(C.follow + .25, MID, EASE(.6)),
      mv(END - .6, FULL, EASE(.48)),                        // döngü: kanca kadrajına döner
    ],
  },
  punches: [
    { t: ws(834), amt: .06, z: .5, f: 3, until: C.exit + .1 },        // "sonuçlar"
    { t: ws(267), amt: .05, z: .55, f: 2.6, until: C.follow - .1 },   // "üst" modeller
  ],
  flashes: [{ t: C.exit, a: .45, d: .1 }],
  hideCaptions: [[C.exit + .12, C.sites]],                  // SONUÇLAR anı: büyük yazı tek başına (dramatik boşluk)
  // sonuç ekranında altyazı üst bantta (tek satır): üç pencere tamamen görünür. C.sites'ta altyazı yok; dönüş "Tabii" cümlesinin başında
  capAt: [{ a: C.sites, b: ws(1073) - .03, y: 300, maxLines: 1 }],

  scenes: [
    // ===== 0 - 2.9 s: KANCA (oda). Hero 'YAPAY ZEKÂ / TESTİ' konuşmacının ARKASINDA, başının üstünde; kelime kelime ölçekle gelir (~0.8 s),
    // TESTİ sarı çarpar; "Sizce"den önce çekilir (öne eğildiğinde başı yazıyı örtmez).
    // Logolar "yapay"da omuzlarının üstünde küçük belirir, "Sizce"de omuz arkasından yükselir.
    L.loopHeadline({ ...HOOK, t: 0, hit: { line: 1, t: HIT, color: YEL, from: 1.12 }, out: C.logos - .3 }),
    L.scene({ id: 'hookLogos', from: ws(493) - .05, to: C.studio1 + .5, layer: 'behind', parts: [
      // sağdaki logo omzun arkasından sola eğik yükselir/batar: sağ buton sütununa (x > 930, y > 1000) girmez
      LOGOS.map(([k, x, y, d, dx]) =>
        L.emerge({ t: ws(493) - .02 + d * .4, from: { x: dx, y: 400, s: .55 }, at: { x: dx, y: 170, s: .7 }, zeta: .62, f: 2.2, origin: { x, y },
          steps: [{ t: C.logos + d, x: 0, y: 0, s: 1, zeta: .6, f: 1.8 }],
          to: { x: dx, y: 400, s: .7, o: 1 }, out: C.studio1 + .45, outDur: .4,
          parts: [{ html: `<div class="abs" style="left:${x - 95}px;top:${y - 95}px">${L.lgDisc(MODEL[k].logo, 190, { pad: MODEL[k].pad ?? .2, ring: 6 })}</div>` }] })),
    ].flat() }),

    // ===== 4.3 - 9.6 s: STÜDYO + ÖLÇÜT GRAFİĞİ. Oda söner, kesit sola kayar. Başlık üstte; "benchmark"ta üç sütun omzunun arkasından yükselir
    // (0'dan başlayan dürüst ölçek: puanlar birbirine çok yakın). Sıra: puana göre.
    shade('shadeA', J1 - .2, C.sonuc),
    L.scene({ id: 'bench', from: C.studio1 + .3, to: C.models + .1, layer: 'behind', parts: [
      L.emerge({ t: C.studio1 + .55, from: { y: -16, o: 0 }, to: { y: -16, o: 0 }, out: C.models, outDur: .3, parts: [
        { html: `<div class="abs yzHead" style="left:90px;top:268px;width:900px"><b>Örnek ölçüt puanı · örnek tarih</b><span>birçok testin birleşik skoru</span></div>` },
      ] }),
      L.columns({ x: 497, base: 1290, w: 124, gap: 30, scale: 10.6, dur: .8, labelSize: 52, logoSize: 74, nameSize: 30, out: C.models - .02, outDur: .4,
        bars: [
          { value: 71.5, text: '71.5', name: MODEL.b.full, logo: LG.b, color: MODEL.b.color, t: C.bench },
          { value: 69.1, text: '69.1', name: MODEL.a.full, logo: LG.a, color: MODEL.a.color, t: C.bench + .14 },
          { value: 66.6, text: '66.6', name: MODEL.c.full, logo: LG.c, color: MODEL.c.color, t: C.bench + .28 },
        ] }),
    ] }),

    // ===== 9.6 - 21.5 s: MODELLER. Kartların yerleri belirir; kartlar konuşmacının kafasının arkasından yana kayarak çıkar (adı söylendiği an).
    // "efor"da üstte Efor kaydırıcısı belirir, "orta"da topuz Orta'ya kayar. Doğrudan prompt sahnesine geçilir.
    L.scene({ id: 'models', from: C.models, to: C.prompt + .2, layer: 'behind', parts: [
      // "Bunlardan": kartların yerleri kesik çizgiyle belirir (sırayla), her biri kendi kartı gelince söner
      [[404, C.aracA], [594, C.aracB], [784, C.aracC]].map(([y, t1], i) => L.slot({ x: 495, y, w: 490, h: 172, r: 38, t: ws(1329) + i * .1, out: t1 + .1 })),
      [['a', C.aracA, 404], ['b', C.aracB, 594], ['c', C.aracC, 784]].map(([k, t0, y]) =>
        L.emerge({ t: t0 - .06, from: { x: 300 - 740, y: 850 - (y + 86), s: .4 }, to: { x: -90, y: 0, s: .9, o: 0 }, zeta: .74, f: 1.6,
          origin: { x: 740, y: y + 86 }, out: C.prompt - .02, outDur: .3,
          parts: [L.logoCard({ x: 495, y, w: 490, h: 172, logo: MODEL[k].logo, logoPad: MODEL[k].pad, name: MODEL[k].name, sub: MODEL[k].sub,
            nameSize: 54, subSize: 36, accent: MODEL[k].color })] })),
      L.segmented({ x: 90, y: 268, w: 900, label: 'Efor', icon: 'gear', options: ['Düşük', 'Orta', 'Yüksek'], pick: 1,
        t: C.efor, tPick: C.orta, size: 40, out: C.prompt }),
    ].flat() }),

    // ===== 21.5 - 37.3 s: PROMPT. Kesit sağ alta küçülür (PIP). Prompt penceresi açılır, istek "Ardından"dan itibaren harf harf yazılır,
    // alıcı logoları "onlardan"da, "ana sayfası" fosforlanır. "Ve bunu yaparken" pencere üste toplanır; şart kartları PIP konuşmacının başının
    // arkasından sola kayarak çıkar: dahili CSS + JS (tik), harici hiçbir şey (çarpı), tek HTML dosyası (index.html).
    // "JavaScript"te kamera yaklaşır: pencere + kartlar hafif büyür, PIP konuşmacı yaklaşır (16 s'lik bölümde düzen değişimi).
    L.scene({ id: 'prompt', from: C.prompt + .05, to: C.sonuc + .15, layer: 'behind', parts: [
      L.group({ origin: { x: 90, y: 600 }, moves: [{ a: ws(1398) - .12, b: ws(1398) + .38, s: 1.05 }], parts: [
        L.group({ origin: { x: 540, y: 280 }, moves: [{ a: ws(1392) - .1, b: ws(1392) + .35, s: .84, y: -12 }], parts: [
          L.promptBox({ x: 90, y: 280, w: 900, title: 'Prompt', logos: [LG.a, LG.b, LG.c], tLogos: ws(1367), logoSize: 60,
            text: 'Örnek bir yerel kafenin tanıtım sitesi ana sayfası', typeA: C.prompt + .3, typeB: we(1390) - .25,
            marks: [{ text: 'ana sayfası', t: ws(1389) }], textSize: 50, t: C.prompt + .12, out: C.sonuc + .02 }),
        ] }),
        [['check', 'Dahili CSS + JavaScript', '', C.css, 'green'], ['x', 'Harici hiçbir şey', '', C.harici, 'red'], ['code', 'Tek HTML dosyası', 'index.html', C.html, 'blue']]
          .map(([ic, tx, sub, t0, col], i) => { const y = 628 + i * 146, hx = i ? 734 : 750, hy = i ? 1150 : 1190;   // PIP başının merkezi (yaklaşma öncesi/sonrası)
            return L.emerge({ t: t0 - .05, from: { x: hx - 460, y: hy - (y + 63), s: .26 }, to: { x: 40, y: 0, o: 0, s: .9 }, zeta: .74, f: 1.7,
              origin: { x: 460, y: y + 63 }, out: C.sonuc + .02, outDur: .25,
              parts: [L.logoCard({ x: 90, y, w: 740, h: 126, icon: ic, iconBg: col, name: tx, sub, nameSize: 42, subSize: 30 })] }); }),
      ].flat() }),
    ] }),

    // ===== 37.3 - 39.0 s: konuşmacı tam boy, gerçek oda: "Şimdi gelsin sonuçlar" (punch).
    // ===== C.exit: kesit sağdan fırlar, oda kararır, SONUÇLAR çarpar (çok hafif sarsıntı); ~1.2 s boş sahne (dramatik duraklama).
    L.scene({ id: 'sonuc', from: C.exit - .04, to: C.sites + .3, layer: 'behind', shake: { t: C.exit + .1, d: .3, amp: 6, seed: 4 }, parts: [
      L.backdrop({ t: C.exit - .03, fade: .14, out: C.sites + .28, outDur: .3 }),
      L.bigType({ text: 'SONUÇLAR', x: 540, y: 820, size: 150, t: C.exit + .08, tGhost: C.exit + .02, stagger: .03, color: '#fff',
        accent: { i: [4], color: YEL }, out: C.sites + .02 }),
    ] }),
    shade('shadeB', C.exit, C.real1),

    // ===== 40.6 - 56.4 s: SONUÇLAR (C.sites -> C.poll). Konuşmacı ekranda yok. Üç site masaüstü görünümünde ALT ALTA, sürekli ekranda:
    // en üstte Araç A, altında Araç C, en altta Araç B (tarayıcı çerçevesi, sekmede logo + ad, aralarında 26 px; yığın sola yaslı: sağ kenar
    // x 928 -> sağ buton sütunu boş). İlk ~1.7 s ana sayfalar (hero) sabit, sonra üçü birlikte hızlıca aşağı kayar (~3.7 s, sayfanın
    // büyük kısmı), ardından C.poll'a kadar yumuşakça yukarı döner. favori söylenince Araç A yıldız alır: ince altın çerçeve + 'Editörün favorisi ★'
    // (pencere başlık çubuğunun sağında; sekme yazısını örtmez), C.poll'a kadar. "içerik"/"tasarım"da sekme çubuklarının sağında küçük çipler.
    // Altyazı bu aralıkta üst bantta (V.capAt); üç pencere tamamen görünür.
    L.scene({ id: 'sites', from: C.sites - .05, to: C.poll + .4, layer: 'behind', parts: [
      [['a', 'site_a', 0, 0], ['c', 'site_c', 1, .12], ['b', 'site_b', 2, .24]].map(([k, f, i, d]) => {
        const imgH = { site_c: 2668, site_b: 5232, site_a: 7272 }[f], max = imgH * SW.w / 1440 - (SW.h - 60);   // pencerede kaydırılabilir yükseklik
        return L.siteWindow({ x: SW.x, y: SW.y + i * (SW.h + SW.gap), w: SW.w, h: SW.h, barH: 60, src: SITE(`${f}_masaustu_tam`), imgW: 1440, imgH,
          logo: MODEL[k].logo, logoPad: MODEL[k].pad, tab: MODEL[k].name, t: C.sites + .02 + d, enter: { s: .86 },
          scroll: [{ a: SCR.fastA, b: SCR.fastB, to: Math.round(max * .8) }, { a: SCR.fastB + .35, b: C.poll - .25, to: 0 }],
          moves: [{ a: C.poll - .1, b: C.poll + .4, o: 0 }], out: C.poll + .45 }); }),
      L.frameRing({ x: SW.x - 6, y: SW.y - 6, w: SW.w + 12, h: SW.h + 12, r: 26, width: 4, color: '#E8C25A', glow: 24, t: C.favori, out: C.poll + .05, from: 1 }),
    ].flat() }),
    L.scene({ id: 'favBadge', from: C.favori, to: C.poll + .3, layer: 'front', parts: [
      L.logoPill({ x: SW.x + SW.w - 238, y: SW.y + 31, logo: LG.a, text: 'Editörün favorisi', icon: 'star', style: 'yellow', size: 28, t: C.favori + .05, out: C.poll + .05 }),
    ] }),
    // ölçüt çipleri: Araç C ve Araç B pencerelerinin sekme çubuğunun sağında (sekme yazısını ve altyazıyı örtmez; en fazla 2 çip)
    L.scene({ id: 'criteria', from: C.icerik - .05, to: C.poll + .3, layer: 'front', parts: [
      L.logoPill({ x: SW.x + SW.w - 168, y: SW.y + (SW.h + SW.gap) + 30, iconLeft: 'list', text: 'İçerik', size: 24, style: 'yellow', anchor: 'left', t: C.icerik, out: C.poll + .05 }),
      L.logoPill({ x: SW.x + SW.w - 188, y: SW.y + 2 * (SW.h + SW.gap) + 30, iconLeft: 'layers', text: 'Tasarım', size: 24, style: 'yellow', anchor: 'left', t: C.tasarim, out: C.poll + .05 }),
    ] }),

    // ===== 55.9 - 63.6 s: ANKET. Stüdyo; konuşmacı önde (biraz küçük), anket kartı yerinde süzülür (logolu seçenekler, sayı yok);
    // "anket"te kartın altında sarı 'Yorumlarda anket' hapı + zıplayan aşağı ok.
    L.scene({ id: 'poll', from: C.poll + .1, to: C.real1 + .3, layer: 'behind', parts: [
      L.emerge({ ...SOFT, t: C.poll + .3, origin: { x: 540, y: 490 },
        out: C.real1 + .1, outDur: .4, parts: [
          L.pollCard({ x: 130, y: 268, w: 820, title: 'Hangisi kazandı?', size: 40, t: C.poll + .3, foot: { text: 'Yorumlarda anket', t: C.anket }, options: [
            { logo: LG.a, text: MODEL.a.full, t: C.poll + .55 },
            { logo: LG.b, text: MODEL.b.full, t: C.poll + .65 },
            { logo: LG.c, text: `Araç C · ${MODEL.c.sub}`, t: C.poll + .75 },
          ] }),
        ] }),
    ] }),

    // ===== 63.6 - 68.9 s: GERÇEK ODA. Kesit yerine döner, oda geri gelir ("üst"te hafif punch); "serilerde" kart yerinde süzülür.
    // Konuşmacı "belki" diyor: kesin vaat yok -> 'Sırada: üst modeller?'
    L.scene({ id: 'seri', from: C.seri - .2, to: C.follow + .3, layer: 'behind', parts: [
      L.emerge({ ...SOFT, t: C.seri - .12, origin: { x: 540, y: 365 },
        out: C.follow + .1, outDur: .35, parts: [
          L.logoCard({ x: 190, y: 300, w: 700, h: 130, icon: 'trend', name: 'Sırada: üst modeller?', nameSize: 40 }),
        ] }),
    ] }),

    // ===== 68.9 - 72.3 s: TAKİP. Stüdyo; takip kartı yerinde süzülür (profil logosu tam daire; sahte sayı/rozet yok),
    // "takip"te dokunma; kapanıştan önce (END - 0.9) yerinde yumuşakça söner.
    shade('shadeC', C.follow, END - .15),
    L.scene({ id: 'follow', from: C.follow, to: END, layer: 'behind', parts: [
      L.emerge({ ...SOFT, t: C.follow + .4, to: { x: 0, y: 0, s: .97, o: 0 }, origin: { x: 540, y: 480 },
        out: END - .6, outDur: .35, parts: [
          L.followCard({ name: '@ornekmarka', sub: '', avatar: BRAND.logo.avatar, x: 220, y: 280, w: 640, h: 470, tIn: C.follow + .4, tap: C.takip }),
          L.touch({ x: 540, y: 668, size: 96, t: C.takip }),                      // takip butonu merkezi (kart 220,280 + (320,388))
        ] }),
    ] }),

    // ===== döngü kapanışı (1.0 s; son kart yok): kesit kanca kadrajına döner, oda geri gelir; C.end'de kaynak karesi 1'e (kanca karesi) döner;
    // hero t=0'daki yerine aynı kinetikle döner ve tamamlanmış hâlde kalır (TESTİ sarı).
    L.loopHeadline({ ...HOOK, id: 'outro', t: END - .08, hit: { line: 1, t: END - .08 + HIT, color: YEL, from: 1.12 } }),   // tamamlanmış hâlde kalır
    // logolar da açılıştaki gibi omuzların üstünde küçük belirir -> son kare = açılış görünümü
    L.scene({ id: 'outroLogos', from: END - .05, layer: 'behind', parts: LOGOS.map(([k, x, y, d, dx]) =>
      L.emerge({ t: END + .05 + d * .4, from: { x: dx, y: 400, s: .55 }, at: { x: dx, y: 170, s: .7 }, zeta: .62, f: 2.2, origin: { x, y },
        parts: [{ html: `<div class="abs" style="left:${x - 95}px;top:${y - 95}px">${L.lgDisc(MODEL[k].logo, 190, { pad: MODEL[k].pad ?? .2, ring: 6 })}</div>` }] })) }),
  ],
});
