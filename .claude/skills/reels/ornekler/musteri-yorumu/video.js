// ÖRNEK: musteri-yorumu — gerçek müşteri yorumu (testimonial) reklamı, MİKRO yoğunluk: müşterinin yüzü hep ekranda, kanca kartı + marka çubuğu + çağrı kartı.
// Ne zaman: müşteriden gelen hazır, dikey telefon videosu (eski altyazısı kırpılmış / gömülü bant var) reklama çevrilecekse; ~12 s konuşma + ~3 s son kart.
// Plan stili: kind face, density mikro, captions vurgulu (PR.capStyle görünümü), formats ['9x16','1x1'] (9x16 reklam alanı), libs ['premium'] (PR.*),
//   son kart end_card 2.8 (donmuş + kararmış kare üstünde çağrı). Kadraj motorda değil: PR.frameCard + FACE_TRACK ile yüz takipli.
// Cue'lar (C.<ad>; C.end motordan): isim
// Görseller projenin gorsel/ klasöründen: gorsel/logo_koyu.png (beyaz kart üstündeki logo); marka çubuğundaki işaret BRAND.base + logo-mark.png
//   (brand.json klasörü). Kareler work/face/NNNN.jpg.
// Ekran metinleri yer tutucudur: 'ÖRNEK HİZMET', müşteri sözü, 'Örnek Stüdyo · ŞEHİR', '@ornekstudyo', telefon '0-5XX-XXX-XXXX'.
//   Müşteri sözü ekranda yalnız videoda gerçekten söylenen cümleden alınır; uydurma yorum yazma. C.isim: müşterinin adının söylendiği an.
// Yoğunluk mikro: müşterinin yüzü hep ekranda; seri dili comp/premium.js. Kaynak: müşteriden gelen hazır video (eski altyazı
// kırpılmış, Real-ESRGAN): filtre / keskinleştirme yok. Cutaway / cihaz görüntüsü YOK.
//
// KADRAJ (kural: siyah şerit/dolgu yok): görüntü baştan sona kenardan kenara dolar (dikey konum [H - 1920·s, 0] aralığında kalır).
//   9x16: 1.25, alttan hizalı (yüz kaynağın alt yarısında; ağız ~1217 < 1248, saç ~660); çağrı kartı sırasında 1.15 (bant kartın altında kalır).
//   1x1: 1.05, saç ~260. Yüz yatayda takipli; vurgu kelimelerinde ve kesimlerde 1.06 (saçtan aşağı büyür).
//   9x16'da altyazı başın üstündeki duvar boşluğunda (y 440; marka çubuğunun altı), çağrı kartı gelince kartın altında (716); 1x1'de çenenin altında.
// ESKİ GÖMÜLÜ BANT: kaynakta 291. kareden (9.67 s) sonuna kadar tam genişlik, y .258-.41 (eski yazılı bant).
//   9.6 s'de kademeli çağrı başlar: opak beyaz çağrı kartı (logo, hap, Instagram, WhatsApp) bandın üstüne oturur ve son karta kadar kalır; son kartta
//   kare 296 (yüz net, dudaklar kapalı) 5 karelik çapraz geçişle donar; bant hiçbir karede görünmez.
//
// Akış: hook 0 kanca kartı (MÜŞTERİMİZ ANLATIYOR + konu çipi + söz) -> isim 1.94 marka çubuğu + ilerleme çizgisi -> 9.6 çağrı kartı
//       (çubuk çekilir, çizgi tamamlanır; altyazı kartın üstünde sürer) -> end 12.17 son kare donar ve kararır, HEMEN RANDEVUNU + OLUŞTUR. Döngü yok.
const { E, prog, clamp, lerp } = M;
const FT = window.FACE_TRACK, NF = TIMELINE.frames, H = M.H, W = M.W;
const GOLD = '#E9C46A', INK = '#111111', INK2 = '#161311', GOLD_D = '#8A6A3E';
const COND = "'Avenir Next Condensed', 'Avenir Next', 'Bahnschrift SemiBold Condensed', 'Arial Narrow', sans-serif", AVE = "'Avenir Next', 'Avenir', 'Segoe UI', sans-serif";
const HEAVY = { weight: 900, color: '#FFFFFF', stroke: '3px #000', shadow: '0 8px 0 #000', lh: 1 };
const BOX = (bg, pad) => ({ bg, pad, shadow: '0 12px 30px rgba(0,0,0,.35)' });
const ROWD = { font: AVE, weight: 700, color: INK2 };                        // kart üstünde koyu iletişim satırı
const FR = n => `work/face/${String(n).padStart(4, '0')}.jpg`;
const TOPIC = 'ÖRNEK HİZMET', QUOTE = '“Örnek bir müşteri\nyorumu burada…”', HAP = 'ÖRNEK STÜDYO · BAKIM HİZMETİ';
const fileAt = t => clamp(Math.floor(t * 30 + 1e-6), 0, NF - 1) + 1;
const frameOf = t => t >= C.end ? NF : fileAt(t);
// son kart: konuşmanın son karesinde (365) müşteri elini ağzına götürüyor -> yüzü net, dudakları kapalı, hafif gülümseyen kare 296 (9.83 s) donar;
// 365'ten 296'ya karartmanın içinde 5 karelik çapraz geçiş (üst katman). İki karede de eski bant çağrı kartının altında.
const FREEZE = 296;
const sm = (arr, i, k = 8) => { let s = 0, c = 0; for (let j = Math.max(0, i - k); j <= Math.min(NF - 1, i + k); j++) { s += arr[j]; c++; } return s / c; };
const hookOut = C.isim - .35, barIn = C.isim;                        // kanca müşterinin adından önce çekilir, marka çubuğu adın söylendiği anda gelir
const ctaA = 9.6;                                                      // çağrı kartı: bant 291. karede (9.667 s) başlamadan opak
const endF = Math.round(C.end * 30) / 30;
const PUNCH = [word(51).s, word(61).s];                                // iki vurgu kelimesi (kelime indeksleri)
const bump = (t, k, d = 8 / 30) => { const u = (t - k) / d; return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0; };

defineVideo(F => {
  const P = F.pick, SQ = F.id === '1x1';
  const G = P({
    '1x1': {
      hook: { s: 1.0, oy: -470 }, body: { s: 1.05, ht: 140 }, cta: { s: 1.0, oy: -440 },
      card: { y: -10, h: 435, g: [105, 52], tp: [172, 30], q: [290, 50] },
      ccard: { y: -10, h: 392, logo: [100, 300], hap: [168, 32], ig: [224, 38, 50], wa: [290, 50, 62] },   // bant ekranda 55-361
      bar: { y: 96, w: 560, s: 26, mark: 40 }, line: 140,
      cap: 948, capHook: 985, capCta: 985, end: { call: [442, 84], make: [548, 84] },          // donan yüzün gözleri ~685, ağzı ~873 açıkta
    },
    default: {
      hook: { s: 1.25, oy: -458 }, body: { s: 1.25, ht: 500 }, cta: { s: 1.15, oy: -288 },   // gövde alttan hizalı: ağız ~1217 (< 1248)
      card: { y: 360, h: 300, g: [412, 60], tp: [478, 32], q: [576, 56] },                 // bant yok: başın üstünde (saç ~680)
      ccard: { y: 266, h: 412, logo: [330, 400], hap: [420, 40], ig: [490, 46, 60], wa: [568, 60, 72] },   // bant ekranda 282-655
      bar: { y: 320, w: 640, s: 32, mark: 48 }, line: 372,
      cap: 440, capHook: 318, capCta: 716, end: { call: [742, 96], make: [862, 96] },         // donan yüzün gözleri ~1006, ağzı ~1222 açıkta
    },
  });
  // ---- kadraj: kenardan kenara dolu; kanca / gövde / çağrı durumları arasında yumuşak geçiş ----
  const zoomAt = t => { let k = 0; for (const j of TIMELINE.jumps) if (t >= j - 1e-3) k++;
    let z = G.body.s * (k % 2 ? 1.06 : 1); for (const p of PUNCH) z *= 1 + .06 * bump(t, p); return z; };
  const fillOy = (oy, s) => clamp(oy, H - 1920 * s, 0);
  const frameAt = t => {
    const i = frameOf(t) - 1, sb = zoomAt(t), ob = fillOy(G.body.ht - (sm(FT.top, i) + .03) * 1920 * sb, sb);
    const w1 = E.inOutCubic(prog(t, hookOut, hookOut + .45)), w2 = E.inOutCubic(prog(t, ctaA - .45, ctaA - .05));
    const s = lerp(lerp(G.hook.s, sb, w1), G.cta.s, w2), oy = lerp(lerp(G.hook.oy, ob, w1), G.cta.oy, w2);
    return { s, oy: fillOy(oy, s), i };
  };
  const anchor = t => { const f = frameAt(t); return { s: f.s, ax: sm(FT.cx, f.i), ay: 0, sx: W / 2, sy: f.oy }; };
  const B = G.bar, Cd = G.card, Cc = G.ccard;
  const barHtml = `<span style="display:inline-flex;align-items:center;justify-content:center;gap:${Math.round(B.s * .45)}px;width:${B.w}px;height:${Math.round(B.s * 2)}px;` +
    `box-sizing:border-box;border-radius:999px;background:rgba(14,11,9,.55);border:1.5px solid rgba(233,196,106,.55);box-shadow:0 8px 24px rgba(0,0,0,.35);` +
    `font:800 ${B.s}px ${COND};letter-spacing:.09em;color:#FFFFFF;white-space:nowrap">` +
    `<img class="pr-img" src="${BRAND.base}logo-mark.png" style="width:${B.mark}px;height:${B.mark}px;filter:invert(1)">` +
    `<span>ÖRNEK STÜDYO <span style="color:${GOLD}">· ŞEHİR</span></span></span>`;
  const hookO = { t: hookOut, dur: .25, s: .92, dy: 0 };

  return {
    style: 2,
    captions: 'vurgulu',
    introZoom: false, introFlash: false, slowPush: { rate: 0, max: 0 },
    fonts: ['900 40px "Avenir Next Condensed"', '800 40px "Avenir Next Condensed"', '700 40px "Avenir Next"'],
    layout: [{ t: 0, mode: 'full' }],
    capY: { full: G.cap }, capMaxLines: 1,
    // altyazı: kanca sırasında kartın üstünde; çağrı kartı gelince (9.6) kartın altında (9x16) / çenenin altında (1x1)
    capAt: [{ a: 0, b: C.isim - .01, y: G.capHook, maxLines: 1 }, { a: SQ ? word(65).s - .02 : ctaA - .01, b: 99, y: G.capCta, maxLines: 1 }],
    capFs: P({ '1x1': 52, default: 58 }), capFsMin: P({ '1x1': 36, default: 44 }),
    punches: [], shakes: [], flashes: [],
    scenes: [
      // ===== konuşan kafa: tam ekran, yüz takipli =====
      L.scene({ id: 'clip', z: 1, parts: [PR.frameCard({ bare: true, float: false, layers: { a: FR, b: FR }, show: () => 'a', frame: frameOf, anchor })] }),
      L.scene({ id: 'freeze', z: 1, from: endF - .05, parts: [PR.frameCard({ bare: true, float: false, layers: { a: FR, b: FR }, show: () => 'a',
        frame: () => FREEZE, anchor: t => ({ ...anchor(t), ax: sm(FT.cx, FREEZE - 1) }), inT: endF, inDur: 5 / 30 })] }),

      // ===== son kartta karartma (donmuş kare) =====
      L.scene({ id: 'shade', z: 2, parts: [PR.veil({ bg: '#000', o: 0, keys: [{ t: endF - .03, to: .55, dur: .25 }] })] }),

      // ===== kanca kartı: kenardan kenara beyaz kart + altın kutu + koyu konu çipi + söz (ilk karede tam) =====
      L.scene({ id: 'hook', z: 5, to: hookOut + .4, parts: [
        PR.panel({ y: Cd.y, h: Cd.h, t: 0, line: { color: GOLD, w: 4 }, out: hookOut, outDur: .25 }),
        PR.punch({ items: [
          { text: 'MÜŞTERİMİZ ANLATIYOR', size: Cd.g[1], weight: 900, color: INK, lh: 1.05, box: BOX(GOLD, [4, 30]), rot: -2, maxW: 900,
            y: Cd.g[0], t: 0, pop: { from: 1.05, rot: -2, zeta: .55, f: 3 }, out: hookO },
          { text: TOPIC, size: Cd.tp[1], weight: 900, color: '#FFFFFF', lh: 1.1, spacing: .05, box: { bg: INK2, pad: [4, 18], radius: 8 },
            y: Cd.tp[0], t: 0, pop: { from: 1.06 }, out: hookO },
          { text: QUOTE, size: Cd.q[1], weight: 900, color: INK, lh: 1.08, maxW: 900, y: Cd.q[0], t: 0, pop: { from: 1.04, zeta: .6, f: 2.8 }, out: hookO },
        ] }),
      ] }),

      // ===== marka çubuğu + ilerleme çizgisi (kancadan çağrı kartına; çizgi çağrıda tamamlanır) =====
      L.scene({ id: 'bar', z: 5, from: barIn - .05, to: ctaA + .4, parts: [
        PR.punch({ items: [{ html: barHtml, y: B.y, t: barIn, pop: { from: 1.06, zeta: .62, f: 2.6, fade: .1 }, out: { t: ctaA - .02, dur: .25, s: .95 } }] }),
        PR.progress({ x: W / 2 - B.w / 2, y: G.line, w: B.w, h: 5, a: 0, b: ctaA, t: barIn, dur: .3, out: ctaA + .05, outDur: .25 }),
      ] }),

      // ===== çağrı kartı (9.6 s -> son): eski gömülü bandın üstünde opak beyaz kart; logo, hap, Instagram, WhatsApp =====
      L.scene({ id: 'cta1', z: 6, from: ctaA - .05, parts: [
        PR.panel({ y: Cc.y, h: Cc.h, t: ctaA, dur: .02, line: { color: GOLD, w: 4 } }),
        PR.punch({ items: [
          { img: { src: 'gorsel/logo_koyu.png', w: Cc.logo[1] }, y: Cc.logo[0], t: ctaA, pop: { from: 1.06, fade: .02 } },
          { text: HAP, size: Cc.hap[1], weight: 800, spacing: .07, color: GOLD_D, lh: 1.1,
            box: { border: `3px solid ${GOLD}`, radius: 60, pad: [Math.round(Cc.hap[1] * .18), Math.round(Cc.hap[1] * .6)] }, maxW: 900,
            y: Cc.hap[0], t: ctaA + 2 / 30, pop: { from: 1.06, fade: .02 } },
          { icon: 'instagram', text: '@ornekstudyo', ...ROWD, size: Cc.ig[1], iconSize: Cc.ig[2], gap: 16, maxW: 900,
            y: Cc.ig[0], t: ctaA + 4 / 30, pop: { from: 1.04, fade: .02 } },
          { icon: 'whatsapp', text: '0-5XX-XXX-XXXX', ...ROWD, size: Cc.wa[1], iconSize: Cc.wa[2], gap: 18, maxW: 900,
            y: Cc.wa[0], t: ctaA + 6 / 30, pop: { from: 1.04, fade: .02 } },
        ] }),
      ] }),

      // ===== son kart (12.17): donmuş ve kararmış kare; HEMEN RANDEVUNU + OLUŞTUR (kart üstte kalır) =====
      L.scene({ id: 'cta2', z: 6, from: endF - .05, parts: [PR.punch({ items: [
        { text: 'HEMEN RANDEVUNU', ...HEAVY, size: G.end.call[1], lh: 1, maxW: 900, y: G.end.call[0], t: endF - .01, pop: { from: 1.08, zeta: .55, f: 3, fade: .01 } },
        { text: 'OLUŞTUR', size: G.end.make[1], weight: 900, color: INK, lh: 1.05, box: BOX(GOLD, [4, 40]), rot: -2, y: G.end.make[0],
          t: endF + 2 / 30 - .01, pop: { from: 1.1, rot: -5, zeta: .5, f: 3, fade: .01 } },
      ] })] }),
    ],
  };
});
PR.capStyle();
