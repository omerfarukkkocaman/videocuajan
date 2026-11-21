// ÖRNEK: secki-reklami — konuşmasız MONTAJ reklamı: "Hangisi senin tarzın?" seçkisi (4 tasarım, rozet 1/4..4/4), 2x2 kolaj, çağrı ekranı.
// Ne zaman: ürün / tasarım / model çeşitliliği gösteren 12-15 s müzikli reklam; kesimler müziğin vuruşuna oturur, altyazı yok.
// Plan stili: kind montage, density sahne, captions yok, formats ['9x16','1x1'] (9x16 reklam güvenli alanı y 269-1248), libs ['premium'] (PR.*),
//   son kart yok (end_card 0). plan.json "looks": [{ n, clip, ad }] alanını okur (tasarım adları kullanıcının düzeltebileceği metin).
// Cue'lar (C.<ad>): t1ad, drop, cta
// Görseller projenin gorsel/ klasöründen: gorsel/logo_acik.png (beyaz logo). Kareler work/face/NNNN.jpg (montaj tabanının kare dökümü).
// Ekran metinleri yer tutucudur: 'Örnek Stüdyo', '@ornekstudyo', telefon '0-5XX-XXX-XXXX'; tasarım adları plan.json looks[].ad'dan.
// İlk sürüm (8 tasarım, 128 BPM) çok hızlı bulundu: bu sürümde kaliteli 4 tasarım, her biri ~2.3 s; sonda 'BUNLAR GİBİ DAHA FAZLASI' + marka + çağrı.
// 15.0 s, konuşma yok (lisanslı hazır müzik, 105 BPM; ses ajanı), altyazı yok. Formatlar: 9x16 (reklam güvenli alanı y 269-1248) ve 1x1.
// Dil: oncesi-sonrasi örneğiyle aynı ('cesur sosyal'): tam ekran video, Avenir Next Condensed 900 beyaz siyah konturlu yazı, eğik altın kutular,
// 'pat' girişleri, aynı çağrı ekranı. Bileşenler comp/premium.js (PR.frameCard bare, PR.punch, PR.tiles, PR.veil, PR.ICON).
// Görüntüler Real-ESRGAN ile büyütülmüş: filtre / keskinleştirme yok, flaş yok; kesimde 4-5 karelik hafif yakınlaşma vuruşu.
//
// Akış (cue'lar plan.json; kesim anları TIMELINE.base.clips kare sınırından):
//   hook 0        1. tasarım tam ekran; ortada 'HANGİ TASARIM / SENİN' + altın kutuda 'TARZIN?' ilk karede okunur ('pat')
//   drop 1.143    müzikte drop (kare 34): kanca yazısına kısa nabız + zemine yakınlaşma vuruşu (flaş yok)
//   t1ad 1.714    kanca küçülüp söner; '1' rozet + '/4' + ad
//   t2 / t3 / t4  2-4. tasarım (sıra plan.looks): kesim karesinde rozet + /4 + ad 'pat'
//                 rozet satırı her tasarımda ürünün odak bölgesinden uzakta (kareler + renk maskesi incelendi):
//                 1 sağ üst, 2 sol üst, 3 alt-orta (odak üst yarıda), 4 sol üst
//   fazla 10.284  zemin kararır; 'BUNLAR GİBİ / DAHA FAZLASI' + altın kutuda marka adı; altında 4 tasarımın 2x2 kolajı çeyrek vuruşla
//   cta 11.998    kolaj + başlık kare 359'da sönmüş; kare 360'ta (müzikteki stop) logo + hap + HEMEN RANDEVUNU 'pat', sonra 2'şer kare arayla
//                 oncesi-sonrasi ile aynı çağrı: logo, HEMEN RANDEVUNU + OLUŞTUR, Instagram + WhatsApp
//                 (numara kare 366'da = 12.2 s, ~2.8 s okunur). Döngü yok.
const { E, prog } = M;
const TLB = TIMELINE.base.clips;
const LOOKS = PLAN_LOOKS();
const GOLD = '#E9C46A', INK = '#111111';
const COND = "'Avenir Next Condensed', 'Avenir Next', 'Bahnschrift SemiBold Condensed', 'Arial Narrow', sans-serif", AVE = "'Avenir Next', 'Avenir', 'Segoe UI', sans-serif";
const HEAVY = { weight: 900, color: '#FFFFFF', stroke: '3px #000', shadow: '0 8px 0 #000', lh: 1 };
const BOX = (bg, pad) => ({ bg, pad, shadow: '0 12px 30px rgba(0,0,0,.45)' });
const ROW = { font: AVE, weight: 700, color: '#FFFFFF', shadow: '0 3px 0 #000, 0 0 18px rgba(0,0,0,.65)' };
const FR = n => `work/face/${String(n).padStart(4, '0')}.jpg`;
// plan.looks (n, clip, ad): adlar kullanıcının düzeltebileceği metin -> plan.json'dan okunur (klip kimliğiyle timeline'a eşlenir)
function PLAN_LOOKS() {
  const x = new XMLHttpRequest(); x.open('GET', 'plan.json', false); x.send();
  return JSON.parse(x.responseText).looks.slice().sort((a, b) => a.n - b.n);
}
const clipOf = id => TLB.find(c => c.clip === id);
const cutT = c => c.f0 / 30;                                         // kesimin ilk karesi
const CUTS = TLB.slice(1).map(cutT);                                 // vuruştaki kesimler (103, 171, 240, 309)
const NL = LOOKS.length;
// tasarım n'nin rozet anı: 1. tasarım kancanın altında başlar -> rozeti 't1ad'de; diğerleri kendi kesimlerinde
const lookT = LOOKS.map((l, i) => i === 0 ? C.t1ad : cutT(clipOf(l.clip)));
const moreT = cutT(TLB[TLB.length - 1]);                              // son kesim ('fazla')
const frameT = t => Math.floor(t * 30 + 1e-6) / 30;                  // cue'nun düştüğü kare (drop 1.143 -> kare 34)
const dropF = frameT(C.drop), ctaF = Math.round(C.cta * 30) / 30;    // çağrı 'pat'ı kare 360 (müzikteki kısa stop)
const midFrame = l => { const c = clipOf(l.clip), a = l === LOOKS[0] ? Math.round(C.t1ad * 30) : c.f0; return Math.floor((a + c.f1) / 2); };

defineVideo(F => {
  const P = F.pick, SQ = F.id === '1x1';
  const G = P({
    '1x1': {
      cropY: .42,
      hook: { y1: 330, s1: 104, y2: 560, s2: 124 },
      row: { sq: 96, num: 80, sl: 42, name: 56 },
      // [x (sol kenar) | null -> sağa yaslı, merkez y, sağ kenar (sağa yaslıda; vars. RIGHT)] (1x1 kırpımında odak bölgesinden uzak)
      at: [[null, 142], [72, 142], [330, 834], [72, 142]],
      wm: { x: 196, y: 985, w: 246 },
      more: { s1: 84, y1: 172, s2: 62, y2: 342, gx: 290, gy: 410, gw: 240, gh: 284, gap: 16 },
      cta: { logo: [150, 400], hap: [258, 36], call: [420, 118, 1], make: [625, 118], ig: [760, 42, 56], wa: [860, 56, 68] },
    },
    default: {
      cropY: .5,
      hook: { y1: 620, s1: 150, y2: 880, s2: 170 },
      row: { sq: 110, num: 94, sl: 48, name: 64 },
      at: [[null, 360], [85, 360], [300, 1100], [85, 360]],                // 3: satır sağ ucu ~886, pop'ta ~921 (y>1000'de sağ sütun yasağı)
      wm: { x: 230, y: 1205, w: 290 },
      more: { s1: 112, y1: 418, s2: 80, y2: 612, gx: 300, gy: 690, gw: 232, gh: 260, gap: 16 },
      cta: { logo: [341, 500], hap: [470, 44], call: [678, 150, .96], make: [925, 150], ig: [1072, 50, 66], wa: [1180, 68, 80] },
    },
  });
  const R = G.row, RIGHT = P({ '1x1': 1005, default: 998 });
  // 1x1: kırpım odağı (9x16 kadrajları reklam bölgesine göre kb ile yukarı alınmış); 9x16 tam kare
  // kesimlerde + müzikteki drop'ta + çağrı girişinde hafif yakınlaşma vuruşu (~5 kare, flaş yok)
  const ZP = [dropF, ...CUTS, ctaF].sort((a, b) => a - b);
  const punchZoom = t => { let z = 1; for (const c of ZP) if (t >= c - 1e-6) z = 1 + .06 * (1 - E.outCubic(prog(t, c, c + .16))); return z; };
  // satır: [rozet][/4][ad]; sağa yaslıysa (x null) ad sağ kenarda, rozet ve /4 adın soluna yerleşir (ad genişliği ölçülür -> ilk karede)
  const lookItems = LOOKS.flatMap((l, i) => {
    const [x0, y, re] = G.at[i], t0 = lookT[i], t1 = i + 1 < NL ? lookT[i + 1] : moreT, RE = re ?? RIGHT;
    const out = { t: t1 - .1, dur: .05, s: .85 };                    // kesimden ~3 kare önce tamamen sönmüş
    const pop = (from, rot) => ({ from, rot, zeta: .55, f: 3.4, fade: .02 });
    // sağa yaslı satır (x0 null): ad sağ kenara çapalı (ax 1; pop'ta sağ kenar sabit), rozet ve /4 tahmini ad genişliğinin soluna
    const nameW = Math.round(l.ad.length * R.name * .62 + 2 * 24), right = x0 == null;
    const bx = right ? RE - nameW - 14 - Math.round(R.sl * 1.2) - 12 - R.sq : x0;
    const slx = bx + R.sq + 12, nx = right ? RE : slx + Math.round(R.sl * 1.2) + 14;
    return [
      { text: String(l.n), size: R.num, weight: 900, color: INK, lh: 1, box: { bg: GOLD, w: R.sq, h: R.sq, shadow: '0 12px 30px rgba(0,0,0,.45)' }, rot: -3,
        x: bx, ax: 0, y, t: t0 - .02, pop: pop(1.2, -6), out },
      { text: `/${NL}`, ...HEAVY, size: R.sl, x: slx, ax: 0, y: y + R.sq / 2 - R.sl * .55, t: t0 - .02, pop: pop(1.15, 0), out },
      { text: l.ad, size: R.name, weight: 900, color: INK, lh: 1.1, box: BOX('#FFFFFF', [6, 24]), rot: -2,
        x: nx, ax: right ? 1 : 0, y, t: t0 - .02, pop: pop(1.1, -3), out },
    ];
  });
  const Mo = G.more;
  // kolaj karolarında ürünün dikey odağı (klip başına; 3. klipte odak üst yarıda)
  const TFY = { 'klip-1': .42, 'klip-2': .45, 'klip-3': .3, 'klip-4': .5 };

  return {
    style: 2,
    captions: 'yok',
    introZoom: false, introFlash: false, slowPush: { rate: 0, max: 0 },
    fonts: ['900 40px "Avenir Next Condensed"', '800 40px "Avenir Next Condensed"', '700 40px "Avenir Next"'],
    layout: [{ t: 0, mode: 'full' }],
    punches: [], shakes: [], flashes: [],
    scenes: [
      // ===== taban: tam ekran (9x16 kırpımsız, 1x1 kare), kesimde hafif yakınlaşma vuruşu =====
      L.scene({ id: 'clip', z: 1, parts: [PR.frameCard({
        bare: true, float: false, layers: { a: FR, b: FR }, show: () => 'a', crop: { x: .5, y: G.cropY, zoom: punchZoom },
      })] }),

      // ===== alt koyu geçiş (filigran) + 'fazla' ve çağrıda karartma =====
      L.scene({ id: 'shade', z: 2, parts: [
        PR.veil({ bg: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 62%, rgba(0,0,0,.55) 100%)' }),
        PR.veil({ bg: '#000', o: 0, keys: [{ t: moreT - .02, to: .6, dur: .25 }] }),
      ] }),

      // ===== kanca: ilk tasarımın üstünde ilk karede okunur, 'pat'; t1ad'de küçülerek söner =====
      L.scene({ id: 'hook', z: 5, to: C.t1ad + .2, parts: [PR.punch({ items: [
        { text: 'HANGİ TASARIM\nSENİN', ...HEAVY, size: G.hook.s1, maxW: SQ ? 860 : 840, y: G.hook.y1, t: 0, pop: { from: 1.1, zeta: .55, f: 3.2 }, kick: [{ t: dropF, amt: .06, dur: .2 }],
          out: { t: C.t1ad - .14, dur: .12, s: .85, dy: 20 } },
        { text: 'TARZIN?', size: G.hook.s2, weight: 900, color: INK, lh: 1.05, box: BOX(GOLD, [4, SQ ? 28 : 36]), rot: -3, y: G.hook.y2,
          t: 0, pop: { from: 1.1, rot: -6, zeta: .5, f: 2.8 }, kick: [{ t: dropF + 1 / 30, amt: .08, dur: .22 }], out: { t: C.t1ad - .14, dur: .12, s: .85, dy: 20 } },
      ] })] }),

      // ===== 4 tasarım: rozet + /4 + ad, kesim karesinde birlikte 'pat' =====
      L.scene({ id: 'looks', z: 5, from: lookT[0] - .05, to: moreT + .1, parts: [PR.punch({ items: lookItems })] }),

      // ===== filigran: yarı saydam beyaz logo, sol altta (reklam alanında); 'fazla'da söner =====
      L.scene({ id: 'wm', z: 5, to: moreT + .2, parts: [PR.punch({ items: [
        { img: { src: 'gorsel/logo_acik.png', w: G.wm.w, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,.55))' }, x: G.wm.x, y: G.wm.y, opacity: .88,
          t: -1, pop: { from: 1 }, out: { t: moreT - .1, dur: .15, s: 1 } },
      ] })] }),

      // ===== fazla: BUNLAR GİBİ / DAHA FAZLASI + marka adı; altında 4 tasarımın 2x2 kolajı (çeyrek vuruş arayla) =====
      L.scene({ id: 'more', z: 5, from: moreT - .05, to: C.cta + .3, parts: [
        PR.punch({ items: [
          { text: 'BUNLAR GİBİ\nDAHA FAZLASI', ...HEAVY, size: Mo.s1, lh: .98, maxW: SQ ? 900 : 920, y: Mo.y1, t: moreT - .02,
            pop: { from: 1.12, zeta: .55, f: 3, fade: .02 }, out: { t: ctaF - .14, dur: .1, s: .85, dy: -20 } },
          { text: 'ÖRNEK STÜDYO’DA', size: Mo.s2, weight: 900, color: INK, lh: 1.05, box: BOX(GOLD, [4, SQ ? 24 : 30]), rot: -2, maxW: SQ ? 900 : 920,
            y: Mo.y2, t: moreT + 60 / 105 * .75, pop: { from: 1.08, rot: -5, zeta: .5, f: 3 }, out: { t: ctaF - .14, dur: .1, s: .85 } },
        ] }),
        PR.tiles({ x: Mo.gx, y: Mo.gy, cols: 2, rows: 2, w: Mo.gw, h: Mo.gh, gap: Mo.gap, badge: { size: SQ ? 48 : 54 },
          pop: { from: 1.06, rot: 3 }, out: { t: ctaF - .14, dur: .1, s: .85 },
          items: LOOKS.map((l, i) => ({ src: FR(midFrame(l)), fx: .5, fy: TFY[l.clip] ?? .45, zoom: 1.25, label: String(l.n),
                                        t: moreT + .15 + i * (60 / 105 / 4) })) }),        // çeyrek vuruş = 0.143 s
      ] }),

      // ===== çağrı: oncesi-sonrasi ile aynı (hap: marka · hizmet); son kareye kadar durur =====
      L.scene({ id: 'cta', z: 6, from: C.cta - .05, parts: [PR.punch({ items: (K => [
        { img: { src: 'gorsel/logo_acik.png', w: K.logo[1], filter: 'drop-shadow(0 3px 10px rgba(0,0,0,.55))' }, y: K.logo[0], t: ctaF - .01, pop: { from: 1.1, fade: .01 } },
        { text: 'ÖRNEK STÜDYO · TASARIM', size: K.hap[1], weight: 800, spacing: .07, color: GOLD, lh: 1.1,
          box: { border: `3px solid ${GOLD}`, radius: 60, pad: [Math.round(K.hap[1] * .2), Math.round(K.hap[1] * .66)] }, maxW: SQ ? 900 : 920,
          y: K.hap[0], t: ctaF - .01, pop: { from: 1.08, fade: .01 } },
        { text: 'HEMEN\nRANDEVUNU', ...HEAVY, size: K.call[1], lh: K.call[2], maxW: SQ ? 860 : 900, y: K.call[0], t: ctaF - .01, pop: { from: 1.1, zeta: .55, f: 3, fade: .01 } },
        { text: 'OLUŞTUR', size: K.make[1], weight: 900, color: INK, lh: 1.05, box: BOX(GOLD, [4, 40]), rot: -2, y: K.make[0],
          t: ctaF + 2 / 30 - .01, pop: { from: 1.12, rot: -6, zeta: .5, f: 3, fade: .01 } },
        { icon: 'instagram', text: '@ornekstudyo', ...ROW, size: K.ig[1], iconSize: K.ig[2], gap: 18, maxW: SQ ? 900 : 840,
          y: K.ig[0], t: ctaF + 4 / 30 - .01, pop: { from: 1.05, fade: .01 } },
        { icon: 'whatsapp', text: '0-5XX-XXX-XXXX', ...ROW, size: K.wa[1], iconSize: K.wa[2], gap: 20, maxW: SQ ? 900 : 840,
          y: K.wa[0], t: ctaF + 6 / 30 - .01, pop: { from: 1.05, fade: .01 } },
      ])(G.cta) })] }),
    ],
  };
});
