// ÖRNEK: kapak-dili — reklam dili "Kapak" (REKLAM 35+): konuşmacı %100 tam ekran, grafikler V.matte kişi maskesiyle ARKASINDA; sanal çift kamera.
// Ne zaman: kart/gizli sahne, kelime kelime sarı altyazı, flaş, damga istemeyen "temiz, dergi kapağı" reklam; kapak başlığı + dev kelime + kanıt nesneleri + büyük CTA düğmesi.
// Plan stili: kind face, density sahne, captions sade, formats ['9x16','1x1'] (9x16 reklam alanı), plan.json "matte": true,
//   libs ['kapak'] (comp/kapak.js KP.*), end_card 2.2 (KP.close: donmuş kare lacivert zemine kararır; logo, adres, slogan brand.json'dan).
// Cue'lar (C.<ad>; C.end motordan): ornek, kesim, cta, silkIn, silkOut, katbekat, fikir, hayata, manuel, yazilimini, hizlandir, davet
// Ekran metinleri yer tutucudur ('Hemen Katıl', 'Detaylar formda' vb.); KP.logo / KP.close marka logosunu ve adresini brand.json'dan alır.
// Eski dil yok: kart/gizli sahne, kelime kelime sarı altyazı, giriş zoomu, flaş, damga, küçük form kartı.
// SANAL ÇİFT KAMERA (4K kaynak, kayıpsız): cümle başlarında geniş 1.0 <-> yakın 1.3 ANINDA kesme (KP.cams). Yakında yüz yana alınır (fx),
//   karşı tarafta kanıt nesnesine yer açılır. Jump cut (C.kesim) kadraj kesmesinin karesine denk (jump zoom kapalı).
//   W1 0-4.5 kapak + ipek · C1 4.5-9.27 katbekat (yüz solda) · W2 9.27-14.27 not -> telefon · C2 14.27-21.2 kâğıt -> panel (yüz sağda)
//   · W3 21.2-25.77 (jump) 'BU DÖNEMİ KAÇIRMAYIN' · C3 25.77-28.33 marka logosu (yüz solda) · W4 28.33-son 'Hemen Katıl', CTA, kapanış.
// Oda: açılışta kararık + bulanık (koyu marka zemini), ipek anında ipeğe döner, 'kaçırmayın'da yine kararır; her dönüş çapraz geçiş.
// Altyazı sade, tek satır (anlam blokları, en az 50 px), iri; hl sarı sabit; göğüs hizasında (9x16 y 1186: yakın kadrajda ağzın altında). CTA anında düğme altyazının yerini alır.
// Dürüstlük: ekranda yalnız söylenenler ('Yazılım fikri', 'Katbekat', kapak / dev yazılar) + sitedeki ifadeler (katıl düğmesi, slogan, adres).
// Sayı, müşteri adı, kurum logosu yok. Tüm zamanlar C.<cue> ya da word(i).s / .e; kesme anları KP.cams'ten (kareye yuvarlanmış).
const END = C.end;
const ws = i => word(i).s, we = i => word(i).e;

defineVideo(F => {
  const P = F.pick, SQ = F.id === '1x1';
  const ZC = P({ '1x1': 1.15, default: 1.3 });                         // yakın kadraj
  const FL = P({ '1x1': .41, default: .38 }), FR = P({ '1x1': .59, default: .62 });   // yakında yüz solda / sağda
  const cam = KP.cams([
    { t: 0, z: 1 },                                                    // W1 kapak + ipek
    { t: ws(11) - .1, z: ZC, fx: FL },                                 // C1 "çünkü…" (ipek sönmeden 0.3 s önce; aynı kare değil)
    { t: C.ornek, z: 1 },                                              // W2 "Örnek veriyorum…"
    { t: ws(32) - .1, z: ZC, fx: FR },                                 // C2 "veya günlük…"
    { t: C.kesim, z: 1 },                                              // W3 jump cut -> tam kesim karesine
    { t: ws(68) - .1, z: ZC, fx: FL },                                 // C3 "Yapay zekâ ile… aramıza"
    { t: we(73) + .02, z: 1 },                                         // W4 "…katılın. Detaylar formda" (cümle içi 0.3 s duraklama: 28.3'te öne
                                                                       //    eğiliyor, yakında altyazı ağza binerdi -> eğilme geniş kadrajda)
  ]);
  const CUT = cam.cuts;                                                // [W1->C1, C1->W2, W2->C2, C2->W3, W3->C3, C3->W4]
  const CTA = C.cta + .1;                                              // düğme "Detaylar"ın hemen önünde belirir

  // ---------- yerleşim (9x16 reklam alanı x 65-1015, y 269-1248 · 1x1 x 60-1020, y 60-1020) ----------
  const G = P({
    '1x1': {
      cover: { base: 208, sizes: [80, 62], w: 900 },
      bul: { base: 208, sizes: [54, 84], w: 900 },
      kac: { base: 208, sizes: [52, 88], w: 900 },
      curve: { x: 690, y: 112, w: 300, h: 300 },
      phone: { x: 776, y: 150, w: 226, h: 430 },
      panel: { x: 66, y: 118, w: 290, h: 430 },                    // 1x1 yakında yüz en fazla ~620'ye kayar: panel başın solunda kalsın
      // 1x1: logo kartı + 'Hemen Katıl →' hapı başın ÜSTÜNDEKİ bantta yan yana (saç 214'e sabit; sağ yanda 32 px hap sığmıyor, saçın arkasına giriyordu)
      logo: { x: 214, y: 64, w: 220, chip: { x: 500, y: 136, size: 32 } },
      cta: { y: 878, w: 660, h: 100, size: 50, chev: { size: 40, gap: 26, dy: 4 } },   // 828-928, oklar 932-998 (+8 nabız); ağız <= ~777
      close: { logoW: 470, y: 540, urlSize: 40, sloganSize: 38 },
    },
    default: {
      cover: { base: 472, sizes: [112, 84], w: 930 },              // taban çizgisi saçın en yüksek karesinin (0-2.8 s: 471) üstünde
      bul: { base: 468, sizes: [76, 116], w: 930 },                 // küçük beyaz 'BULUNMAZ' + dev sarı 'HİNT KUMAŞI' (saç 468+)
      kac: { base: 474, sizes: [76, 122], w: 930 },                 // küçük beyaz 'BU DÖNEMİ' + dev sarı 'KAÇIRMAYIN' (saç 476+)
      curve: { x: 680, y: 300, w: 330, h: 360 },
      phone: { x: 750, y: 318, w: 252, h: 520 },
      panel: { x: 70, y: 300, w: 340, h: 500 },
      logo: { x: 676, y: 296, w: 290, pill: 30 },                    // C3 sağ üst; geniş kadraja geçince de başın sağ üstünde (saçın üstünde)
      cta: { y: 1129, w: 740, h: 98, size: 54, chev: { size: 36, gap: 26, dy: 2 } },   // seri standardı: 1080-1178 (alt dudak en kötü ~1040),
                                                                    // oklar ayrı ayrı 1180-1242 (+8 nabız); nabızda sağ kenar 925 (< 930 sütun)
      close: { logoW: 560, y: 740, urlSize: 44, sloganSize: 40 },
    },
  });

  return {
    ...KP.look(F),
    capFsMin: P({ '1x1': 44, default: 46 }),                          // anlam bloğu tek satırda ('bulunmaz bir Hint kumaşı' 51 px, 'çünkü yapay zekâ sayesinde' ~47 px)
    layout: cam.layout,
    jumpSkip: cam.jumpSkip,
    headroomFull: P({ '1x1': 214 }),                                   // 1x1: başın üstünde kapak / dev yazıya yer
    matte: KP.stage({ choke: .4, dark: [                             // choke .4: kararık açılışta saç kenarında oda sızıntısı (kare 19-21)
      { a: 0, b: C.silkIn + .75, start: .34, in: .55, out: .3 },        // kapak: oda kararık + bulanık; ipeğin altında geri gelir (görünmez)
      { a: ws(64) - .2, b: CUT[4] + .1, in: .5, out: .6 },              // "hemen bu dönemi kaçırmayın": kararır; yakın kadraja kesmeden sonra döner
    ] }),
    hideCaptions: [[0, .1], [CTA - .04, END + 1]],                        // ilk kare (reklam önizlemesi) temiz; CTA düğmesi "Detaylar formda"yı taşır

    scenes: [
      // ===== 2.6 - 5.4 s: İPEK ("bulunmaz bir Hint kumaşı"): oda ipeğe döner (lacivert/mavi, hafif altın parıltı), sonra oda geri gelir
      KP.silk({ t: C.silkIn, out: C.silkOut + .6 }),

      // ===== 0 - 2.8 s: KAPAK. Konuşmacının arkasında 'İş insanıysanız / bu dönemi kaçırmayın' (kaçırmayın sarı); t=0'da okunur; ipek gelirken söner
      KP.cover({ lines: ['İş insanıysanız', 'bu dönemi kaçırmayın'], key: ['kaçırmayın'], ...G.cover, out: ws(7) - .07, outDur: .35 }),   // 'BULUNMAZ'dan önce tamamen söner

      // ===== 2.8 - 4.5 s: DEV KELİME arkada: 'BULUNMAZ' kelimesinde, 'HİNT KUMAŞI' (sarı) kendi kelimesinde; yakına kesmeden önce söner
      // 'HİNT KUMAŞI' "bir Hint kumaşı" öbeğiyle gelir (>= 1.1 s), G1->Y1 kesmesine kadar tam opak; kesme karesinde söner
      KP.word({ id: 'bulunmaz', lines: [{ text: 'Bulunmaz', t: ws(7) - .03 }, { text: 'Hint kumaşı', t: ws(8) - .02 }], key: ['hint', 'kumaşı'],
        ...G.bul, out: CUT[0], outDur: .03 }),

      // ===== 6.9 - 9.27 s (C1, yüz solda): "katbekat" -> sağda cam kart: yükselen hız eğrisi + 'Katbekat' etiketi (sayı yok)
      L.scene({ id: 'katbekat', from: C.katbekat - .35, to: CUT[1] + .02, layer: 'behind', parts: [
        KP.curve({ ...G.curve, t: C.katbekat - .3, draw: [C.katbekat - .05, ws(17) + .6], label: { text: 'Katbekat', t: C.katbekat }, out: CUT[1], outDur: .25 }),
      ] }),

      // ===== 10.9 - 14.27 s (W2): "yazılım fikri" -> yapışkan not; "hayata geçirebilirim" -> not uygulama ikonuna dönüşür, telefonda ekran kurulur, tik
      L.scene({ id: 'fikir', from: C.fikir - .2, to: CUT[2] + .02, layer: 'behind', parts: [
        KP.noteToPhone({ ...G.phone, note: { text: 'Yazılım fikri', t: C.fikir - .12 },
          phone: { t: C.hayata - .12, build: [C.hayata + .22, ws(31) + .3], check: we(31) - .12 }, out: CUT[2], outDur: .22 }),
      ] }),

      // ===== 15.6 - 21.2 s (C2, yüz sağda): "manuel iş sistemi" -> solda kâğıt tablo, satırlar elle tiklenir (biri boş kalır);
      // "yazılımını" -> kâğıt panele dönüşür (tüm satırlar yeşil); "hızlandırabilirim" -> alttaki ilerleme çubuğu hızla dolar, tik
      L.scene({ id: 'manuel', from: C.manuel - .2, to: CUT[3] + .02, layer: 'behind', parts: [
        KP.paperToPanel({ ...G.panel, paper: { t: C.manuel - .15, ticks: [ws(36) + .12, ws(37) + .08, ws(39) - .05], rot: -3 },
          panel: { t: C.yazilimini - .12, build: [C.yazilimini + .2, ws(45) + .25] }, progress: { t: C.hizlandir, dur: .75 }, out: CUT[3], outDur: .22 }),
      ] }),

      // ===== 24.4 - 25.77 s (W3): "hemen bu dönemi kaçırmayın" -> oda kararır, arkada dev 'BU DÖNEMİ / KAÇIRMAYIN' (kapak başlığına dönüş)
      KP.word({ id: 'kacirmayin', lines: [{ text: 'Bu dönemi', t: ws(65) - .04 }, { text: 'kaçırmayın', t: ws(67) - .04 }], key: ['kaçırmayın'],
        ...G.kac, out: CUT[4], outDur: .25 }),

      // ===== 27.4 - 29.07 s (C3, yüz solda): "aramıza katılın" -> sağda cam kartta marka logosu + sitedeki katıl düğmesi
      // logo kartı CTA girmeden ÖNCE tamamen söner (aynı anda iki hareket yok); düğme davet kelimesinin sonunda
      L.scene({ id: 'davet', from: C.davet - .25, to: CTA, layer: 'behind', parts: G.logo.chip ? [
        KP.logo({ x: G.logo.x, y: G.logo.y, w: G.logo.w, t: C.davet - .2, out: CTA - .02, outDur: .28 }),
        KP.chip({ text: 'Hemen Katıl →', style: 'white', anchor: 'left', ...G.logo.chip, t: we(73) - .25, out: CTA - .02, outDur: .28 }),
      ] : [
        KP.logo({ x: G.logo.x, y: G.logo.y, w: G.logo.w, t: C.davet - .2, pill: { text: 'Hemen Katıl', t: we(73) - .25, size: G.logo.pill },
          out: CTA - .02, outDur: .28 }),
      ] }),

      // ===== 29.2 s - son (W4): CTA — göğüs hizasında büyük beyaz düğme 'Detaylar formda', altında 2 aşağı ok; "formda"da tek yumuşak nabız
      L.scene({ id: 'cta', from: CTA - .02, to: END + .5, layer: 'front', parts: [
        KP.cta({ text: 'Detaylar formda', ...G.cta, t: CTA, pulse: ws(76) - .05, out: END + .35 }),
      ] }),

      // ===== kapanış (1.4 s): donmuş kare lacivert zemine kararır; marka logosu, adres, slogan (brand.json)
      KP.close({ t: END, ...G.close }),
    ],
  };
});
