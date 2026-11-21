// ÖRNEK: emojili-3d — kısa kampanya reklamı, MİKRO yoğunluk: kalıcı kanca başlığı + yüz + göğüste altyazı; büyük 3D emoji ve 3D rozet (aynı anda en çok 1).
// Ne zaman: işletme sahibinin kendi telefon çekimi (birkaç parça birleşik), teklif/kampanya duyurusu; ~13 s konuşma + ~2.6 s son kart.
// Plan stili: kind face, density mikro, captions vurgulu (PR.capStyle; rozetin gösterdiği kelimeler altyazıdan düşer), formats ['9x16','1x1']
//   (9x16 reklam alanı y 269-1248, görüntü tam ekran), libs ['premium'] (PR.headAnchor, PR.emoji3d, PR.badge3d, PR.hookTitle, PR.adCta), end_card 2.6.
// Cue'lar (C.<ad>; C.end motordan): gelin, mesaj, ucretsiz
// Görseller projenin gorsel/ klasöründen: gorsel/logo_acik.png (filigran). Kareler work/face/NNNN.jpg. Çağrı (PR.adCta) marka bilgisini brand.json'dan alır.
// Ekran metinleri yer tutucudur: kanca, '%95' rozeti + etiketi, hap 'ÖRNEK STÜDYO · BAKIM HİZMETİ'. Rozetteki sayı/iddia videoda birebir söylenmiyorsa yazma.
// Düzen: üstte KALICI kanca başlığı (2 satır + altın 'DENEME SEANSI 🎁' + hap) -> yüz -> göğüste altyazı.
// KESİMLER (timeline.jumps): 90. kare (3.000 s; 1. çekimin içinde atlama: uzatılan bir kelime kesildi -> ölçek adımı 1.26 -> 1.33 + '%95' rozeti aynı karede 'pat'),
// 174. kare (5.800; 2. çekim) ve 233. kare (7.767; 3. çekim); oda ve duruş değişir. Her parça kendi sabit
// kadrajını alır (yüz boyu yakın, saç üstü aynı yükseklikte); kesim karesinde 1.07 -> 1 yakınlaşma vuruşu. Emoji ve altyazı cue'lara bağlı.
// Büyük öğeler (aynı anda en çok 1): 🔥 övgü cümlesi · 3D '%95' rozeti + etiketi (rozet kelimeleri altyazıda çizilmez)
// · 👀 'gelin kendiniz görün' · 💬 'Mesaj atın' · 🎁 'ücretsiz deneme seansı'. Son kart: kare 344 donar + %55 kararır, serinin çağrısı. Filtre yok.
const { E, prog, clamp } = M;
const NF = TIMELINE.frames, FR = n => `work/face/${String(n).padStart(4, '0')}.jpg`;
// KOMİK KARE: çekimlerin ilk karelerinde gözler kapalı (göz kırpma): o karelerde gözlerin açıldığı ilk kare tutulur
// (ses ve kesim zamanı aynı; 4-5 karelik sabit yüz kesim vuruşunun içinde kalır). [ilk dosya, son dosya, gösterilen dosya] (1 tabanlı)
const HOLD = [[1, 4, 5], [89, 90, 88], [91, 96, 97], [234, 238, 239]];   // açılış (kanca karesi), atlamadan önceki 2 kare (göz kırpma), atlamanın ve 3. çekimin ilk kareleri
const fileAt = t => { const n = clamp(Math.floor(t * 30 + 1e-6), 0, NF - 1) + 1, h = HOLD.find(q => n >= q[0] && n <= q[1]); return h ? h[2] : n; };
const endF = Math.round(C.end * 30) / 30, FREEZE = 344;                 // ağız kapalı, gözler açık
const CUTS = TIMELINE.jumps.map(j => Math.round(j * 30)), cutT = CUTS.map(n => n / 30);   // 90 (çekim içi atlama, 3.000 s), 174 (2. çekim, 5.800), 233 (3. çekim, 7.767); kare farkıyla doğrulandı

defineVideo(F => {
  const P = F.pick, SQ = F.id === '1x1';
  const G = P({
    '1x1': { s: [1.14, 1.2, 1.15, 1.12], x: [440, 440, 540, 540], ht: 290, hook: [78, 58, 64, 22], cap: 925, wm: [140, 996, 140], L: [176, 500, 188], R: [878, 500, 188], seal: [866, 470, 270, 38],
             cta: { logo: [150, 400], hap: [258, 36], call: [420, 118, 1], make: [625, 118], ig: [760, 42, 56], wa: [860, 56, 68] } },
    default: { s: [1.26, 1.33, 1.3, 1.28], x: [440, 440, 540, 540], ht: 528, hook: [290, 72, 80, 28], cap: 1150, wm: [160, 1216, 170], L: [186, 760, 212], R: [868, 740, 212], seal: [830, 694, 318, 40],
               cta: { logo: [341, 500], hap: [470, 44], call: [678, 150, .96], make: [925, 150], ig: [1072, 50, 66], wa: [1180, 68, 80] } },
  });
  const cutZoom = t => { let z = 1; for (const c of cutT) if (t >= c - 1e-6) z = 1 + .07 * (1 - E.outCubic(prog(t, c, c + .2))); return z; };
  const A = PR.headAnchor({ frame: fileAt, cuts: CUTS, ht: G.ht, s: G.s, x: G.x, zoom: cutZoom });   // 1. çekimde yüz biraz solda: sağda rozete yer
  const clip = o => PR.frameCard({ bare: true, float: false, layers: { a: FR, b: FR }, show: () => 'a', ...o });
  const em = (ch, at, t, out) => ({ ch, x: at[0], y: at[1], size: at[2], t, out, tilt: { y: at[0] < M.W / 2 ? 22 : -22, z: at[0] < M.W / 2 ? 6 : -6 } });

  return {
    style: 2, captions: 'vurgulu', introZoom: false, introFlash: false, slowPush: { rate: 0, max: 0 },
    fonts: ['900 40px "Avenir Next Condensed"', '800 40px "Avenir Next Condensed"', '700 40px "Avenir Next"', '40px "Apple Color Emoji"'],
    layout: [{ t: 0, mode: 'full' }],
    capY: { full: G.cap }, capMaxLines: 1, capFs: P({ '1x1': 52, default: 58 }), capFsMin: P({ '1x1': 36, default: 44 }),
    punches: [], shakes: [], flashes: [],
    scenes: [
      L.scene({ id: 'clip', z: 1, parts: [clip({ frame: fileAt, anchor: A })] }),
      L.scene({ id: 'freeze', z: 1, from: endF - .05, parts: [clip({ frame: () => FREEZE, anchor: t => A.at(FREEZE - 1, t), inT: endF, inDur: 5 / 30 })] }),
      L.scene({ id: 'shade', z: 2, parts: [PR.veil({ bg: '#000', o: 0, keys: [{ t: endF - .02, to: .55, dur: .25 }] })] }),

      L.scene({ id: 'hook', z: 5, to: endF + .3, parts: [PR.hookTitle({ y: G.hook[0], out: endF - .2, outDur: .15, lines: [
        { text: 'İLK ZİYARETE ÖZEL', size: G.hook[1] },
        { text: 'DENEME SEANSI', emoji: '🎁', size: G.hook[2], kind: 'gold' },
        { text: 'ÖRNEK STÜDYO · BAKIM HİZMETİ', size: G.hook[3], kind: 'pill', spacing: .08 },
      ] })] }),

      L.scene({ id: 'big', z: 5, to: endF, parts: [
        PR.emoji3d({ items: [
          em('🔥', G.R, word(4).s, Math.min(word(8).s + .35, cutT[0] - .22)),   // çekim içi atlamadan önce sönmüş
          em('👀', G.L, C.gelin, cutT[2] - .22),                         // 3. çekime kesimden önce sönmüş
          em('💬', G.L, C.mesaj, C.ucretsiz - .1),
          em('🎁', G.L, C.ucretsiz, endF - .3),
        ] }),
        PR.badge3d({ kind: 'seal', x: G.seal[0], y: G.seal[1], size: G.seal[2], text: '%95', label: 'ÖRNEK\nBİLGİ ETİKETİ', labelSize: G.seal[3],
                     t: cutT[0], out: cutT[1] - .28 }),                  // atlama karesinde yakınlaşma vuruşuyla birlikte 'pat' ('%95' 3 kare sonra söyleniyor); 2. çekime kesimden önce sönmüş
      ] }),

      L.scene({ id: 'wm', z: 5, to: endF + .2, parts: [PR.punch({ items: [
        { img: { src: 'gorsel/logo_acik.png', w: G.wm[2], filter: 'drop-shadow(0 3px 8px rgba(0,0,0,.6))' }, x: G.wm[0], y: G.wm[1], opacity: .85, t: -1, pop: { from: 1 },
          out: { t: endF - .1, dur: .15, s: 1 } }] })] }),

      L.scene({ id: 'cta', z: 6, from: endF - .05, parts: [PR.adCta({ t: endF, hap: 'ÖRNEK STÜDYO · BAKIM HİZMETİ', at: G.cta, maxW: SQ ? 860 : 900 })] }),
    ],
  };
});
PR.capStyle({ drop: [10, 11, 12] });                                     // rozetin gösterdiği kelimeler (indeks) altyazıdan düşer: 3D rozet + etiketi zaten gösteriyor
