// ÖRNEK: oncesi-sonrasi — konuşmasız MONTAJ reklamı: ÖNCESİ / SONRASI (ışın taraması + kıyas sürgüsü), cesur sosyal dil, çağrı ekranı.
// Ne zaman: hizmet / bakım / temizlik / yenileme gibi "fark" gösteren 10-15 s reklam; müzik + efekt (ayrı), altyazı yok.
// Plan stili: kind montage, density sahne, captions yok, formats ['9x16','1x1'] (9x16 reklam güvenli alanı: plan.yerlesim 'reklam'),
//   libs ['premium'] (comp/premium.js PR.*), son kart yok (end_card 0).
// Cue'lar (C.<ad>): oncesi, sonrasi, tarama, kiyas, kiyasSon, cta, hook
// Görseller projenin gorsel/ klasöründen: gorsel/logo_acik.png (beyaz logo; filigran + çağrı). Kareler work/ikiz/oncesi|sonrasi/NNNN.jpg:
//   aynı kamera hareketinin iki sürümü (öncesi / sonrası) kare kare hizalı çıkarılmış (yardımcı betikle; ham görüntü kullanıcıdan).
// Ekran metinleri yer tutucudur: 'Örnek Stüdyo', '@ornekstudyo', telefon '0-5XX-XXX-XXXX'. Gerçek iddia/sonuç yazma; yalnız görüntü konuşsun.
// TASARIM 'Cesur sosyal': video ilk kareden TAM EKRAN, canlı renk (kontrast 1.08, doygunluk 1.12), kalın sıkışık beyaz yazı
//   (siyah kontur + sert gölge), eğik altın kutular, kısa 'pat' girişleri.
// Bileşenler comp/premium.js: PR.frameCard (bare: tam ekran iki katmanlı klip work/ikiz/oncesi|sonrasi, kare kare aynı an -> ışın taraması ve
// kıyas sürgüsü kamera hareketini kesmez), PR.punch (yazı/kutu/logo/ikon satırı), PR.veil (alt koyu geçiş, çağrıda karartma), PR.ICON (IG, WhatsApp SVG).
// Motorun yüz katmanı video.css'te gizli (klip PR.frameCard'da çizilir).
//
// Akış (cue'lar plan.json):
//   hook 0        'SONUCU / GÖRENLER' + eğik altın kutuda 'ŞOK OLDU' ilk karede okunur, büyükten 'pat' diye oturur; +.35 s altta ÖNCESİ (beyaz kutu)
//   oncesi 1.9    kanca küçülüp yukarı çekilerek söner: öncesi görüntüsü tam ekran, yalnız ÖNCESİ etiketi
//   tarama 5.4    beyaz-altın ışın yukarıdan aşağı tarar (9x16 ~0.75 s, 1x1 ~0.58 s): üstü sonrası, altı öncesi
//   sonrasi 5.8   ışın etikete değdiği an aynı yerde, aynı yazı yüzüyle altın kutuda SONRASI (pat); tarama süresi etiketin yerinden hesaplanır
//   kiyas 7.2     sürgü görüntünün ortasına gelir: solu öncesi / sağı sonrası, çizginin iki yanında küçük kutu etiketler; kiyasSon 8.6'da geri çekilmiş
//   cta 9.0       görüntü %55 kararır; beyaz logo, altın hap, 'HEMEN / RANDEVUNU', altın kutuda 'OLUŞTUR',
//                 Instagram ikonu + hesap, WhatsApp ikonu + telefon (9.2'de girer, ~2.7 s okunur). Döngü yok.
// 9x16 reklam güvenli alanında (plan.yerlesim 'reklam': y 269-1248; alttaki %35 reklam açıklaması + CTA düğmesi).
// 1x1: aynı dil, tam kare kadraj (konu bölgesine kırpılmış), puntolar ölçekli; çağrıda tüm satırlar karede.
const IK = d => n => `work/ikiz/${d}/${String(n).padStart(4, '0')}.jpg`;
const GOLD = '#E9C46A', INK = '#111111';
const AVE = "'Avenir Next', 'Avenir', 'Segoe UI', sans-serif";
const HEAVY = { weight: 900, color: '#FFFFFF', stroke: '3px #000', shadow: '0 8px 0 #000', lh: 1 };     // kalın sıkışık beyaz, siyah kontur + sert gölge
const BOX = (bg, pad) => ({ bg, pad, shadow: '0 12px 30px rgba(0,0,0,.45)' });
const ROW = { font: AVE, weight: 700, color: '#FFFFFF', shadow: '0 3px 0 #000, 0 0 18px rgba(0,0,0,.65)' };

defineVideo(F => {
  const P = F.pick, SQ = F.id === '1x1';
  // format başına yerleşim (merkez y, punto); 9x16 maketteki ölçüler, 1x1 kareye ölçekli
  const G = P({
    '1x1': {
      cropY: .52, shadeH: 45,
      hook: { y1: 200, s1: 88, y2: 382, s2: 132 },
      label: { y: 905, s: 96 }, wm: { x: 200, y: 790, w: 246 },                       // filigran etiketin üstünde, solda
      tags: { top: 86, s: 44 }, knob: 32,
      cta: { logo: [150, 400], hap: [258, 36], call: [420, 118, 1], make: [625, 118], ig: [760, 42, 56], wa: [860, 56, 68] },
    },
    default: {
      cropY: .5, shadeH: 36.5,
      hook: { y1: 418, s1: 112, y2: 661, s2: 170 },
      // reklam güvenli alanı (plan.yerlesim 'reklam'): y 269-1248 -> etiket kutusunun altı ~1221, çağrının son satırı ~1228
      label: { y: 1130, s: 120 }, wm: { x: 222, y: 975, w: 290 },                      // filigran etiketin üstünde, solda
      tags: { top: 300, s: 56 }, knob: 38,
      cta: { logo: [341, 500], hap: [470, 44], call: [678, 150, .96], make: [925, 150], ig: [1072, 50, 66], wa: [1180, 68, 80] },
    },
  });
  const K = G.cta, hookOut = { t: C.oncesi - .05, dur: .3, s: .86, dy: 36 };
  // tarama ışını etikete tam 'sonrasi'da değsin: etiket kutusunun üst kenarı (yükseklik size*1.1 + 12, -2° eğimin yükselttiği köşe ~ size*.06)
  // -> inOutSine ilerlemesinin tersiyle tarama süresi (format başına; 9x16 ~0.75 s, 1x1 ~0.58 s). Işın sonra aşağı doğru sürer.
  const labTop = G.label.y - (G.label.s * 1.1 + 12) / 2 - G.label.s * .06;
  const scanDur = (C.sonrasi - C.tarama) / (Math.acos(1 - 2 * labTop / M.H) / Math.PI);
  const tagCss = bg => `font:900 ${G.tags.s}px 'Avenir Next Condensed';line-height:1.12;color:${INK};background:${bg};padding:2px ${Math.round(G.tags.s * .4)}px;` +
    `transform:rotate(-2deg);box-shadow:0 8px 20px rgba(0,0,0,.45)`;

  return {
    style: 2,
    captions: 'yok',
    introZoom: false, introFlash: false,
    fonts: ['900 40px "Avenir Next Condensed"', '800 40px "Avenir Next Condensed"', '700 40px "Avenir Next"'],
    layout: [{ t: 0, mode: 'full' }],
    punches: [], shakes: [], flashes: [],
    scenes: [
      // ===== klip: ilk kareden tam ekran; ışın taraması + kıyas sürgüsü =====
      L.scene({ id: 'clip', z: 1, parts: [PR.frameCard({
        bare: true, float: false, layers: { a: IK('oncesi'), b: IK('sonrasi') }, crop: { x: .5, y: G.cropY },
        filter: 'contrast(1.08) saturate(1.12)',
        scan: { t: C.tarama, dur: scanDur, core: '#FFFFFF', width: 8, color: '#FFD27A', glow: 26, glowA: .95,
                halo: 84, haloColor: GOLD, haloA: .6, fresh: 120 },
        compare: { a: C.kiyas, b: C.kiyasSon, at: .42, inDur: .4, outDur: .36,
                   line: { w: 6, color: '#FFFFFF', glow: 24, glowColor: '#FFD27A' },
                   knob: { r: G.knob, bg: GOLD, ring: INK, ink: INK },
                   tags: { mode: 'divider', top: G.tags.top, gap: 24, a: 'ÖNCESİ', b: 'SONRASI', css: { a: tagCss('#FFFFFF'), b: tagCss(GOLD) } } },
      })] }),

      // ===== alt koyu geçiş (etiket + filigran okunur) ve çağrıda %55 karartma =====
      L.scene({ id: 'shade', z: 2, parts: [
        PR.veil({ bg: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) ${100 - G.shadeH}%, rgba(0,0,0,.6) 100%)` }),
        PR.veil({ bg: '#000', o: 0, keys: [{ t: C.cta - .05, to: .55, dur: .35 }] }),
      ] }),

      // ===== kanca: ilk karede okunur, 'pat' diye oturur; 'oncesi'de küçülüp yukarı çekilerek söner =====
      L.scene({ id: 'hook', z: 5, to: C.oncesi + .4, parts: [PR.punch({ items: [
        { text: 'SONUCU\nGÖRENLER', ...HEAVY, size: G.hook.s1, y: G.hook.y1, t: 0, pop: { from: 1.1, zeta: .55, f: 3.2 }, out: hookOut },
        { text: 'ŞOK OLDU', size: G.hook.s2, weight: 900, color: INK, lh: 1.05, box: BOX(GOLD, [4, SQ ? 28 : 36]), rot: -3, y: G.hook.y2,
          t: 0, pop: { from: 1.1, rot: -6, zeta: .5, f: 2.8 }, out: hookOut },
      ] })] }),

      // ===== etiket: ÖNCESİ (beyaz kutu) -> aynı yer, aynı yazı yüzü SONRASI (altın kutu); kıyas sırasında kenara çekilir =====
      L.scene({ id: 'label', z: 5, to: C.cta + .2, parts: [PR.punch({ items: [
        { text: 'ÖNCESİ', size: G.label.s, weight: 900, color: INK, lh: 1.1, box: BOX('#FFFFFF', [6, 40]), rot: -2, y: G.label.y,
          t: C.hook + .35, pop: { from: 1.14, rot: -5, zeta: .55, f: 3 }, out: { t: C.sonrasi - .02, dur: .05, s: .85 } },
        { text: 'SONRASI', size: G.label.s, weight: 900, color: INK, lh: 1.1, box: BOX(GOLD, [6, 40]), rot: -2, y: G.label.y,
          t: C.sonrasi, pop: { from: 1.16, rot: -7, zeta: .5, f: 3, fade: .02 }, hide: [{ a: C.kiyas, b: C.kiyasSon, dur: .2 }],
          out: { t: C.cta - .1, dur: .2, s: .9 } },
      ] })] }),

      // ===== filigran: yarı saydam beyaz logo, etiketin üstünde solda (reklam alanı içinde, sağdaki IG sütunundan uzak); çağrıda söner =====
      L.scene({ id: 'wm', z: 5, to: C.cta + .2, parts: [PR.punch({ items: [
        { img: { src: 'gorsel/logo_acik.png', w: G.wm.w, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,.55))' }, x: G.wm.x, y: G.wm.y, opacity: .88,
          t: -1, pop: { from: 1 }, out: { t: C.cta - .1, dur: .2, s: 1 } },
      ] })] }),

      // ===== çağrı: logo, hap, HEMEN RANDEVUNU + OLUŞTUR, Instagram ve WhatsApp satırları (hızlı sırayla pat; numara 9.2'de, ~2.7 s okunur; son kareye kadar durur) =====
      L.scene({ id: 'cta', z: 6, from: C.cta - .05, parts: [PR.punch({ items: [
        { img: { src: 'gorsel/logo_acik.png', w: K.logo[1], filter: 'drop-shadow(0 3px 10px rgba(0,0,0,.55))' }, y: K.logo[0], t: C.cta, pop: { from: 1.1, fade: .1 } },
        { text: 'ÖRNEK STÜDYO · BAKIM HİZMETİ', size: K.hap[1], weight: 800, spacing: .07, color: GOLD, lh: 1.1,
          box: { border: `3px solid ${GOLD}`, radius: 60, pad: [Math.round(K.hap[1] * .2), Math.round(K.hap[1] * .66)] }, maxW: SQ ? 900 : 920,
          y: K.hap[0], t: C.cta + .03, pop: { from: 1.08 } },
        { text: 'HEMEN\nRANDEVUNU', ...HEAVY, size: K.call[1], lh: K.call[2], maxW: SQ ? 860 : 900, y: K.call[0], t: C.cta + .06, pop: { from: 1.1, zeta: .55, f: 3 } },
        { text: 'OLUŞTUR', size: K.make[1], weight: 900, color: INK, lh: 1.05, box: BOX(GOLD, [4, 40]), rot: -2, y: K.make[0],
          t: C.cta + .1, pop: { from: 1.12, rot: -6, zeta: .5, f: 3 } },
        { icon: 'instagram', text: '@ornekstudyo', ...ROW, size: K.ig[1], iconSize: K.ig[2], gap: 18, maxW: SQ ? 900 : 840,
          y: K.ig[0], t: C.cta + .14, pop: { from: 1.05 } },
        { icon: 'whatsapp', text: '0-5XX-XXX-XXXX', ...ROW, size: K.wa[1], iconSize: K.wa[2], gap: 20, maxW: SQ ? 900 : 840,
          y: K.wa[0], t: C.cta + .2, pop: { from: 1.05 } },
      ] })] }),
    ],
  };
});
