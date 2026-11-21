// "Kapak" reklam dili bileşenleri.
// Örnek: .claude/skills/reels/ornekler/kapak-dili. Yükleme: plan.json "libs": ["kapak"] (premium gerekmez; varsa sorun yok). Global: window.KP.
// library.js ve engine.js'e dokunmaz (mevcut varsayılanlar korunur). Her kare t'den saf (Date/rastgele yok; ölçüm ilk karede bir kez).
// Dil: konuşmacı hep tam ekranda (card/hidden yok), grafikler V.matte kişi maskesiyle ARKASINDA (L.scene layer 'behind', z 4), ipek z 3, CTA önde,
// kapanış z 7. Büyük geçişler yaysız (inOutCubic / outCubic); yay yalnız küçük yeşil tik rozetinde. Flaş, sarsıntı, damga, ışık süpürmesi yok.
// Zaman kuralı: her parametre bir cue'dan (C.x) ya da kelimeden (word(i).s) gelir. out = sönmenin BİTTİĞİ an, outDur = sönme süresi.
//
// ===== API (diğer videolar metin / zaman / konum vererek kullanır) =====
// Motor ayarları (defineVideo dönüşüne yayılır):
//   ...KP.look(F, {..üstüne yaz})      stil 2, sade + iri tek satır altyazı (hl sarı sabit), sinematik renk + vinyet, introZoom/flaş yok,
//                                      itme yok (sabit kamera), Manrope yüklemesi. 9x16 capY 1186 (reklam alanı, göğüs), 1x1 capY 965.
//                                      Bloklar plan.chunks'ta <= ~20 harf olsun (tek satır; capMaxLines 1).
//   KP.cams([{t, z, fx}], {snap})     SANAL ÇİFT KAMERA -> {layout, jumpSkip}. t: kesme anı (kareye yuvarlanır), z: 1 geniş / ~1.3 yakın,
//                                      fx: yakında yüzün yatay yeri (.38 sola, .62 sağa: karşı tarafta nesneye yer). Kesme ANINDA (d 1e-4).
//                                      t'nin snap (.45) s yakınında timeline kesimi (jump) varsa kesme tam o kareye alınır, jump zoom'u kapanır.
//   KP.stage({dark: [{a, b, v, in, out}], blur, choke})   V.matte: oda a'da kararır (v: kalan oda .16, in s), b'de geri gelir (out s);
//                                      a <= 0 -> açılıştan kararık (kapak). Koyu marka zemini (#studio), derinlik bulanıklığı, son kare donar (hold).
// Sahneler (scenes dizisine doğrudan):
//   KP.cover({lines, key, x, base | top, sizes, w, t: 0, pre, out})   KAPAK BAŞLIĞI (sahne, 'behind'): t=0'da okunur (pre .3), yerinde ölçek+opaklık
//   KP.word({id, lines, key, x, base | top, sizes, w, t, out})        DEV ARKA KELİME (sahne, 'behind', büyük harf): satırlar kendi t'sinde belirir
//        base: SON satırın taban çizgisi (saçın en yüksek karesinin hemen üstü; ör. 9x16 geniş ~468) -> satırlar yukarı dizilir;
//        top: İLK satırın glif (içerik) kutusu üstü (denetimin ölçtüğü; 9x16 >= 266). Manrope'ta glif kutusu büyük harfin ~.35 em üstünden başlar:
//        geniş kadrajda başın üstü ~200 px -> 9x16: 1.153*s1 + gap + .853*s2 <= ~205 (ör. kapak [112, 84] base 472; dev kelime [76, 116] base 468:
//        küçük beyaz + dev sarı). base'i o aralıktaki saç üstünün en küçük değerine koy (work/face_track.json top * 1920; 1x1'de headroomFull).
//        lines: ['metin', ..] ya da [{text, t, size, x, top, align}]; key: sarı kelimeler ['kaçırmayın'] (noktalamasız, büyük/küçük harf duyarsız)
//        sizes: satır puntoları; w: satır bu genişliği aşarsa küçülür (justify: true -> tam w'ye ölçeklenir); lh, gap, upper, color, keyColor
//   KP.silk({t, out, fade, outDur, colors, fold, speed, angle})       İPEK ZEMİN ANI (PR.silk algoritması + kıvrım sıklığı fold; lacivert/mavi,
//                                      parıltı hafif altın; neon/mor/parçacık yok), z 3: arka sahnelerin ve kişinin altında
//   KP.close({t, dur, logoW, y, url, slogan})                         KAPANIŞ: donmuş kare lacivert zemine kararır, logo >= 220 px, adres, slogan (z 7)
// Parçalar (L.scene({id, from, to, layer: 'behind' | 'front', parts: [...]}) içine):
//   KP.glass({x, y, w, h, t, out, html, r})                           CAM KART kabuğu (#0E1A33, ince gök mavisi çizgi, yumuşak gölge)
//   KP.curve({x, y, w, h, t, draw: [a, b], label: {text, t}, tone: 'speed' | 'revenue', branches: [{t, at, rise}], out})
//                                      yükselen HIZ EĞRİSİ / GELİR EĞRİSİ (sayısız); branches: eğriden yeni dallar ('yeni yöntemler')
//   KP.noteToPhone({x, y, w, h, note: {text, t, rot, size}, phone: {t, build: [a, b], check}, out})
//                                      YAPIŞKAN NOT -> TELEFON UYGULAMA EKRANI (not uygulama ikonuna dönüşür, ekran kurulur, yeşil tik)
//   KP.phone({x, y, w, h, t, build, check, out})                      tek başına telefon uygulama ekranı (yazısız)
//   KP.paperToPanel({x, y, w, h, paper: {t, ticks: [t..], rot}, panel: {t, build}, progress: {t, dur}, out})
//                                      KÂĞIT/TABLO (elle tikler) -> PANEL (dashboard), altta İLERLEME ÇUBUĞU hızla dolar + tik
//   KP.progress({x, y, w, h, t, fill: [a, b], label, out})           tek başına ilerleme çubuğu (cam hap, şimşek ikonu, sonda tik)
//   KP.clock({x, y, size, t, spin: [a, b], turns, label: {text, t}, out})   SAAT KARTI (rakamsız; akrep/yelkovan hızla döner, yay dolar)
//   KP.browser({x, y, w, h, t, build, out}) · KP.browserPhone({browser: {...}, phone: {...}, out})   TARAYICI + TELEFON (yazısız iskelet)
//   KP.crowd({x, y, w, h, cols, rows, t, fill: [a, b], lit: [a, b], seed, out})   AVATAR KALABALIĞI (yüzsüz, marka renkleri, sayısız)
//   KP.chip({text, icon, x, y, size, anchor, t, strike: {t}, out})    cam çip (isteğe bağlı sarı üstü çizgi) · KP.link({from, to, t, dur, out})
//   KP.code({x, y, w, h, t, strike: {t}, dim, out})                   küçük kod penceresi kartı (üstü çizilir / söner)
//   KP.logo({x, y, w, t, out, card, pill: {text, t, size}})           Marka logosu (brand.json logo.light) cam kartta + 'Hemen Katıl →' düğmesi
//                                      düğmesi (karta sığdırılır). card: false -> yalnız logo: YALNIZ oda kararıkken / koyu zeminde
//   KP.cta({text, x, y, w, h, size, t, pulse, chev: {t, gap, size}, out})   CTA: büyük beyaz düğme + 2 aşağı ok, tek yumuşak nabız (önde)
// Yardımcılar: KP.C (renkler), KP.FONT, KP.fonts, KP.icon(ad, px, renk), KP.ws(i)/KP.we(i) (kelime başı/sonu)
// Güvenli alan: tam ekran zeminler data-safe=ignore; kartlar, yazılar, logo, düğme denetime girer (9x16 reklam: x 65-1015, y 269-1248;
// sağ sütun x > 930 iken y 1000-1720 yasak). Girişte ölçek <= 1.06 (kenar elemanlar sınırı aşmasın).
(function () {
  const { clamp, lerp, prog, E, spring, css, W, H, FPS } = window.M;
  const B = window.BRAND || {};
  const TL = window.TIMELINE;
  const ROOT = (B.base || '../../brands/x/').replace(/brands\/.*$/, '');            // proje -> depo kökü (../../)
  const asset = f => /^(\.|\/|work\/|https?:)/.test(f) ? f : (B.base || '') + f;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const upTR = s => s.toLocaleUpperCase('tr-TR'), lowTR = s => s.toLocaleLowerCase('tr-TR');
  const fin = x => typeof x === 'number' && isFinite(x);
  const inK = (t, a, d = .5) => fin(a) ? E.outCubic(prog(t, a, a + d)) : 0;            // giriş 0..1 (a'da başlar)
  const outK = (t, b, d = .35) => fin(b) ? E.inCubic(prog(t, b - d, b)) : 0;            // çıkış 0..1 (b'de biter)
  const io = (t, a, d) => fin(a) ? E.inOutCubic(prog(t, a, a + d)) : 0;
  const f2 = v => (+v).toFixed(2), f4 = v => (+v).toFixed(4);
  const word = i => window.word(i);

  const C = { navy: '#070A12', brand: '#0A1122', card: '#0E1A33', blue: '#2B7FD9', sky: '#5DB3F0', ice: '#BFE3FF', yellow: '#FFD23F',
              green: '#1FB766', off: '#F3F5FA', gold: '#F1D58F', ink: '#0A1122' };
  Object.assign(C, B.colors ? { blue: B.colors.blue || C.blue, sky: B.colors.sky || C.sky, yellow: B.colors.yellow || C.yellow } : {});
  const FONT = "'Manrope', sans-serif";

  // ===== stil (bir kez) =====
  const CSS = `
@font-face { font-family: 'Manrope'; src: url('${ROOT}assets/fonts/Manrope.ttf') format('truetype'); font-weight: 200 800; }
.kp, .kp * { font-family: 'Manrope', sans-serif; -webkit-font-smoothing: antialiased; box-sizing: border-box; }
.kp { position: absolute; left: 0; top: 0; }
.kp-type { position: absolute; left: 0; top: 0; width: 0; height: 0; }
.kp-line { position: absolute; white-space: nowrap; font-weight: 800; line-height: 1; }
.kp-w { display: inline-block; transform-origin: 50% 60%; }
.kp-glass { position: absolute; overflow: hidden; background: linear-gradient(180deg, rgba(22,38,70,.95) 0%, rgba(14,26,51,.95) 100%);
  border: 1.5px solid rgba(93,179,240,.42); box-shadow: 0 28px 70px rgba(0,0,0,.42), 0 6px 18px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.06); }
.kp-pill { position: absolute; display: inline-flex; align-items: center; gap: .4em; white-space: nowrap; border-radius: 999px; font-weight: 800;
  line-height: 1; letter-spacing: -.01em; }
.kp-pill.y { background: #FFD23F; color: #0A1122; }
.kp-pill.w { background: #F3F5FA; color: #0A1122; box-shadow: 0 10px 26px rgba(0,0,0,.35); }
.kp-pill.s { background: rgba(93,179,240,.14); border: 1.5px solid rgba(93,179,240,.45); color: #BFE3FF; }
.kp-sk { position: absolute; border-radius: 999px; background: rgba(243,245,250,.16); }
.kp-note { position: absolute; transform-origin: 50% 50%; }
.kp-note .np { position: absolute; inset: 0; border-radius: 6px; background: linear-gradient(170deg, #FFE27A 0%, #FFD23F 55%, #F4C430 100%);
  box-shadow: 0 22px 46px rgba(0,0,0,.42), 0 3px 8px rgba(0,0,0,.25); }
.kp-note .np::after { content: ""; position: absolute; right: 0; bottom: 0; width: 22%; height: 22%; border-radius: 0 0 6px 0;
  background: linear-gradient(135deg, rgba(0,0,0,0) 50%, rgba(120,84,0,.22) 50%, rgba(255,240,180,.75) 100%); }
.kp-note .tape { position: absolute; left: 32%; top: -5%; width: 36%; height: 12%; background: rgba(255,255,255,.55); transform: rotate(-3deg);
  box-shadow: 0 1px 3px rgba(0,0,0,.12); }
.kp-note .nt { position: absolute; left: 11%; right: 9%; bottom: 11%; color: #0A1122; font-weight: 800; line-height: 1.02; letter-spacing: -.02em; white-space: normal; }
.kp-note .ai { position: absolute; inset: 0; display: grid; place-items: center; background: linear-gradient(160deg, #FFE27A, #FFD23F 60%, #F2BE22);
  box-shadow: 0 6px 16px rgba(0,0,0,.35); }
.kp-phone { position: absolute; background: #0A1122; border: 2px solid rgba(191,227,255,.38); transform-origin: 50% 50%;
  box-shadow: 0 30px 70px rgba(0,0,0,.5), 0 0 0 1px rgba(0,0,0,.3); }
.kp-phone .scr { position: absolute; overflow: hidden; background: linear-gradient(180deg, #13244A 0%, #0E1A33 45%, #0B1529 100%); }
.kp-phone .it { position: absolute; }
.kp-paper { position: absolute; background: linear-gradient(180deg, #FBFAF6 0%, #F1EEE6 100%); border-radius: 8px; transform-origin: 50% 50%;
  box-shadow: 0 24px 50px rgba(0,0,0,.42), 0 3px 8px rgba(0,0,0,.25); overflow: hidden; }
.kp-chk { position: absolute; display: grid; place-items: center; border-radius: 50%; background: #1FB766; box-shadow: 0 6px 16px rgba(0,0,0,.35), 0 0 0 4px rgba(10,17,34,.9); }
.kp-btn { position: absolute; display: flex; align-items: center; justify-content: center; white-space: nowrap; border-radius: 999px;
  background: #FFFFFF; color: #0A1122; font-weight: 800; letter-spacing: -.02em; transform-origin: 50% 50%;
  box-shadow: 0 18px 44px rgba(0,0,0,.4), 0 4px 10px rgba(0,0,0,.25); }
.kp-close { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; }
.kp-close .ov { position: absolute; inset: 0; background: radial-gradient(90% 60% at 50% 40%, #13244A 0%, #0A1122 55%, #070A12 100%); }
.kp-close .u { position: absolute; left: 0; width: ${W}px; text-align: center; white-space: nowrap; }
`;
  const st = document.createElement('style'); st.id = 'kapakCss'; st.textContent = CSS; document.head.appendChild(st);

  // ===== ikonlar (çizgi, 24'lük) =====
  const ICP = {
    bulb: '<path d="M9 18h6M10 21.5h4"/><path d="M12 2.5a6.8 6.8 0 0 0-3.9 12.4c.6.4.9 1.1.9 1.8V17h6v-.3c0-.7.3-1.4.9-1.8A6.8 6.8 0 0 0 12 2.5z"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="currentColor" stroke="none"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1.5v3M15 1.5v3M9 19.5v3M15 19.5v3M19.5 9h3M19.5 15h3M1.5 9h3M1.5 15h3"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  };
  const icon = (n, px = 24, c = 'currentColor', sw = 2.2) =>
    `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="display:block;color:${c}">${ICP[n] || ''}</svg>`;

  // kart girişi / çıkışı (yerinde süzülür: opaklık + kısa kayma + çok hafif ölçek; yaysız)
  const cardK = (t, t0, out, outDur, dur = .55) => { const a = inK(t, t0, dur), b = outK(t, out, outDur); return { a, b, o: a * (1 - b) }; };
  const cardT = (k, dy = 26, s0 = .97) => `translate(0px,${f2(dy * (1 - k.a))}px) scale(${f4(lerp(s0, 1, k.a) * lerp(1, .985, k.b))})`;

  // ===================== motor ayarları =====================
  const fonts = ['800 40px Manrope', '700 40px Manrope', '600 40px Manrope'];
  const look = (F, o = {}) => Object.assign({
    style: 2, captions: 'sade', frameShift: true, jumpEps: 1e-3,
    introZoom: false, introFlash: false,                             // ilk kare = kapak (net, flaşsız)
    slowPush: { rate: 0, max: 1 },                                   // sabit kamera (çift kamera hissi; testere itme yok)
    faceFilter: 'contrast(1.05) saturate(.95) sepia(.05)',           // hafif sinematik, çok hafif sıcak
    vignette: { edge: .3 },
    capColors: { hl: C.yellow }, capMaxLines: 1,                     // sade, tek satır (yakın kadrajda ağza binmez)
    capFs: F.pick({ '1x1': 54, default: 66 }), capFsMin: F.pick({ '1x1': 44, default: 52 }),
    capY: { full: F.pick({ '1x1': 965, default: 1186 }) },             // 9x16: glif altı ~1226 (reklam alanı 1248)
    shakes: [], flashes: [], punches: [],
    fonts: fonts.slice(),
  }, o);

  // ===================== sanal çift kamera =====================
  const cams = (shots, { snap = .45, warn = true } = {}) => {
    const J = (TL.jumps || []).slice(), skip = [], cuts = [];
    const layout = shots.map((s, i) => {
      let t = i === 0 ? 0 : s.t;
      if (i > 0) {
        const j = J.reduce((b, q) => Math.abs(q - t) < Math.abs(b - t) ? q : b, Infinity);
        if (Math.abs(j - t) <= snap) { t = j; skip.push(j); }
        t = Math.round(t * FPS) / FPS;                               // kesme karesi
        cuts.push(t);
      }
      const k = { t: i === 0 ? 0 : t - .002, mode: 'full', zoom: s.z ?? 1, fx: s.fx ?? .5 };
      if (i > 0) k.d = 1e-4;                                         // anında: zoom/fx animasyonu yok
      return k;
    });
    if (warn) J.forEach(j => { if (!skip.includes(j)) console.warn(`KP.cams: ${j.toFixed(2)} s kesimi kadraj kesmesiyle örtülmüyor`); });
    return { layout, jumpSkip: skip, cuts };
  };

  // ===================== oda karartma + koyu marka zemini (V.matte) =====================
  const STUDIO = ['radial-gradient(calc(640px * var(--ls, 1)) calc(720px * var(--ls, 1)) at var(--lx, 540px) var(--ly, 720px), rgba(43,127,217,.30) 0%, rgba(43,127,217,.11) 46%, rgba(10,17,34,0) 100%)',
    'radial-gradient(140% 60% at 50% 112%, rgba(43,127,217,.20) 0%, rgba(7,10,18,0) 60%)',
    'linear-gradient(180deg, #0C1730 0%, #0A1122 52%, #070A12 100%)'].join(', ');
  const stage = ({ dark = [], v = .16, blur = 14, choke = .3, blurK, hold = true, ref, studio = STUDIO, start } = {}) => {
    const room = []; let room0 = 1;
    for (const d of dark) {
      const vv = d.v ?? v;
      if (!(d.a > 0)) { room0 = d.start ?? start ?? Math.min(1, vv + .18); room.push({ t: 0, v: vv, d: d.in ?? .5, ease: 'outCubic' }); }
      else room.push({ t: d.a, v: vv, d: d.in ?? .5 });
      if (fin(d.b)) room.push({ t: d.b, v: 1, d: d.out ?? .6 });
    }
    room.sort((a, b) => a.t - b.t);
    const m = { hold, choke, roomBlur: blur, studio, room0, room, ref: ref || { x: W / 2, y: Math.round(H * .37) } };
    if (blurK != null) m.blurK = blurK;
    return m;
  };

  // ===================== tipografi bloğu: kapak başlığı / dev arka kelime =====================
  const typeScene = (o, kind) => {
    const { id = kind === 'cover' ? 'kpCover' : 'kpWord' + (typeScene.n = (typeScene.n || 0) + 1), x = W / 2, top, sizes = [], w = W - 150, justify = false,
      gap = kind === 'word' ? 12 : 6, lh = .94, upper = kind === 'word', key = [], color = C.off, keyColor = C.yellow, track = kind === 'word' ? -.02 : -.035,
      t = 0, pre = kind === 'cover' ? .3 : 0, stagger = kind === 'cover' ? .02 : .05, dur = kind === 'cover' ? .38 : .34, from = kind === 'cover' ? 1.05 : 1.06,
      out = Infinity, outDur = .45, shadow = '0 10px 44px rgba(0,0,0,.42), 0 2px 10px rgba(0,0,0,.25)', layer = 'behind', z } = o;
    const keys = new Set(key.map(k => lowTR(k).replace(/[.,!?;:'"’]/g, '')));
    const L0 = o.lines.map((l, i) => typeof l === 'string' ? { text: l } : Object.assign({}, l)).map((l, i) => ({
      ...l, text: upper ? upTR(l.text) : l.text, size: l.size ?? sizes[i] ?? sizes[sizes.length - 1] ?? 100, t: l.t ?? t }));
    let n = 0;
    const html = `<div class="kp kp-type" style="z-index:1">` + L0.map((l, i) => `<div class="kp-line" data-l="${i}" style="font-weight:${l.weight ?? 800};letter-spacing:${l.track ?? track}em;text-shadow:${shadow}">` +
      l.text.split(/\s+/).map(wd => { const k = keys.has(lowTR(wd).replace(/[.,!?;:'"’]/g, ''));
        return `<span class="kp-w" data-n="${n++}" style="color:${k ? keyColor : color}">${esc(wd)}</span>`; }).join(' ') + `</div>`).join('') + `</div>`;
    // Manrope metrikleri (em): yükselen 1.066, inen .3, büyük harf .72. Satır kutusu lh; içerik kutusu (güvenli alan denetiminin ölçtüğü glif kutusu)
    // satır kutusunun AB em üstünden başlar; taban çizgisi satır kutusu üstünden BL em aşağıda.
    const AB = (1.366 - lh) / 2, BL = lh / 2 + .383;
    let geo = null;
    const measure = r => {                                         // ilk karede bir kez: punto sığdırma + satır yerleri (fontlar yüklü)
      const lines = [...r.querySelectorAll('.kp-line')]; geo = [];
      const fit = lines.map((el, i) => {
        const l = L0[i]; el.style.fontSize = l.size + 'px';
        const nw = el.scrollWidth, lw = l.w ?? w;
        let fs = l.size; if (nw > lw || justify) fs = Math.min(l.max ?? (justify ? l.size * 1.6 : l.size), l.size * lw / nw);
        fs = Math.floor(fs * 10) / 10; el.style.fontSize = fs + 'px';
        return { el, fs, ww: el.scrollWidth };
      });
      // satır kutusu üstleri: top -> ilk satırın İÇERİK kutusu üstü (güvenli alan çizgisi); base -> son satırın taban çizgisi (ör. saçın hemen üstü)
      const tops = []; const n = fit.length;
      if (o.base != null) { tops[n - 1] = o.base - BL * fit[n - 1].fs; for (let i = n - 2; i >= 0; i--) tops[i] = tops[i + 1] - gap - lh * fit[i].fs; }
      else { tops[0] = top + AB * fit[0].fs; for (let i = 1; i < n; i++) tops[i] = tops[i - 1] + lh * fit[i - 1].fs + gap; }
      fit.forEach(({ el, fs, ww }, i) => {
        const l = L0[i], ly = l.top != null ? l.top + AB * fs : tops[i], al = l.align || 'center', lx = l.x ?? x;
        const left = al === 'left' ? lx : al === 'right' ? lx - ww : lx - ww / 2;
        css(el, { left: f2(left) + 'px', top: f2(ly) + 'px', lineHeight: lh, transformOrigin: `${al === 'left' ? 0 : al === 'right' ? 100 : 50}% 60%` });
        geo.push({ fs, top: ly, content: ly - AB * fs, cap: ly + (BL - .72) * fs, base: ly + BL * fs });
      });
      part.geo = geo;                                               // QA: satırların içerik üstü / büyük harf üstü / taban çizgisi
    };
    const part = {
      html,
      render(T, r) {
        if (!geo) measure(r);
        const box = r.firstChild, ok = 1 - outK(T, out, outDur);
        css(box, { opacity: f4(ok), transform: `scale(${f4(lerp(.985, 1, ok))})`, transformOrigin: `${x}px ${top ?? o.base}px` });
        const ws = [...box.querySelectorAll('.kp-w')]; let k = 0;
        L0.forEach((l, i) => {
          const nw = l.text.split(/\s+/).length;
          for (let j = 0; j < nw; j++, k++) {
            const a = l.t - pre + (kind === 'cover' ? k : j) * stagger, u = E.outCubic(prog(T, a, a + dur));
            css(ws[k], { opacity: f4(u), transform: `scale(${f4(lerp(l.from ?? from, 1, u))})` });
          }
        });
      },
    };
    const t0 = Math.min(...L0.map(l => l.t)) - pre - .05;
    return L.scene({ id, from: kind === 'cover' ? 0 : t0, to: fin(out) ? out + .02 : Infinity, layer, z, parts: [part] });
  };
  const cover = o => typeScene(o, 'cover');
  const bigWord = o => typeScene(o, 'word');

  // ===================== ipek zemin anı =====================
  // PR.silk (premium.js) algoritması: eğik, kendi içinde bükülen dalgalardan yükseklik alanı, ışıkla gölgelenir. Kapak sürümü: kıvrım sıklığı
  // (fold: PR.silk'te 1), keskin satin parıltı ve parıltı rengi altın (hi); düşük çözünürlükte hesaplanır, CSS ile büyütülür. t'den saf.
  const silkLayer = ({ res = 4, colors, speed = .5, angle = -28, relief = 1.6, spec = 30, specA = .78, sheen = .28, fold = 1.9, seed = 0,
                       light = [-.45, -.5, .74], wash } = {}) => {
    const C0 = Object.assign({ shade: '#02050D', base: '#0A1A3A', light: '#2D63B2', hi: '#EFC66C' }, colors || {});
    const hx = c => { const v = c.replace('#', ''); return [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16)); };
    const [cS, cB, cL, cH] = [C0.shade, C0.base, C0.light, C0.hi].map(hx);
    const w = Math.ceil(W / res), h = Math.ceil(H / res), A = angle * Math.PI / 180, ca = Math.cos(A), sa = Math.sin(A);
    const nl = v => { const l = Math.hypot(...v); return v.map(x => x / l); }, Ln = nl(light), Hv = nl([Ln[0], Ln[1], Ln[2] + 1]);
    const WV = [[1, 4.2, .34, 1.15, 1.35, .19, .3, 1.1], [.46, 7.4, -.27, .75, 2.2, -.26, 2.1, .4], [.2, 12.2, .46, .5, 3.3, .33, 4.2, 2.9], [.09, 19.5, -.4, .4, 4.1, .22, 1.3, 3.7]]
      .map(v => [v[0], v[1] * fold, v[2], v[3], v[4] * Math.sqrt(fold), v[5], v[6], v[7]]);
    let x, id;
    return {
      html: `<canvas width="${w}" height="${h}" data-safe="ignore" style="position:absolute;left:0;top:0;width:${W}px;height:${H}px"></canvas>` +
            (wash ? `<div data-safe="ignore" style="position:absolute;left:0;top:0;width:${W}px;height:${H}px;background:${wash.replace(/"/g, "'")}"></div>` : ''),
      render(t, el) {
        const cv = el.firstChild; x = x || cv.getContext('2d'); id = id || x.createImageData(w, h);
        const d = id.data, tau = t * speed, k1 = relief * .085 / fold; let o = 0;
        for (let j = 0; j < h; j++) { const yy = (j + .5) * res / 1000;
          for (let i = 0; i < w; i++, o += 4) {
            const xx = (i + .5) * res / 1000, p = xx * ca + yy * sa, q = -xx * sa + yy * ca; let hp = 0, hq = 0;
            for (let m = 0; m < WV.length; m++) { const v = WV[m], wa = v[4] * q + v[5] * tau + v[7] + seed, warp = v[3] * Math.sin(wa);
              const c = Math.cos(v[1] * p + v[2] * tau + v[6] + warp) * v[0]; hp += c * v[1]; hq += c * v[3] * v[4] * Math.cos(wa); }
            let nx = -hp * k1, ny = -hq * k1, nz = 1; const il = 1 / Math.sqrt(nx * nx + ny * ny + 1); nx *= il; ny *= il; nz *= il;
            const dif = nx * Ln[0] + ny * Ln[1] + nz * Ln[2], hd = Math.max(0, nx * Hv[0] + ny * Hv[1] + nz * Hv[2]);
            const s = Math.pow(hd, spec) * specA, sh = Math.pow(hd, spec * .25) * sheen;           // keskin parıltı (altın) + geniş satin ışıltısı
            const u = clamp((dif - .38) / .55); let rr, gg, bb;
            if (u < .5) { const k = u * 2; rr = cS[0] + (cB[0] - cS[0]) * k; gg = cS[1] + (cB[1] - cS[1]) * k; bb = cS[2] + (cB[2] - cS[2]) * k; }
            else { const k = u * 2 - 1; rr = cB[0] + (cL[0] - cB[0]) * k; gg = cB[1] + (cL[1] - cB[1]) * k; bb = cB[2] + (cL[2] - cB[2]) * k; }
            rr += (cL[0] - rr) * sh; gg += (cL[1] - gg) * sh; bb += (cL[2] - bb) * sh;
            d[o] = rr + (cH[0] - rr) * s; d[o + 1] = gg + (cH[1] - gg) * s; d[o + 2] = bb + (cH[2] - bb) * s; d[o + 3] = 255; } }
        x.putImageData(id, 0, 0);
      },
    };
  };
  const silk = ({ t, out = Infinity, fade = .6, outDur = .6, z = 3, id = 'kpSilk', wash, ...o } = {}) => {
    const sk = silkLayer({ ...o, wash: wash ?? 'radial-gradient(75% 50% at 50% 34%, rgba(7,10,18,0) 0%, rgba(7,10,18,.22) 70%, rgba(7,10,18,.5) 100%)' });
    return L.scene({ id, z, from: t - .02, to: fin(out) ? out + .02 : Infinity, parts: [{
      html: `<div class="kp" style="width:${W}px;height:${H}px">${sk.html}</div>`,
      render(T, r) { const el = r.firstChild, o = io(T, t, fade) * (1 - (fin(out) ? E.inOutCubic(prog(T, out - outDur, out)) : 0));
        el.style.opacity = f4(o); if (o > .001) sk.render(T, el); },
    }] });
  };

  // ===================== cam kart kabuğu =====================
  const glass = ({ x, y, w, h, r = 28, t, out = Infinity, outDur = .35, dur = .55, dy = 26, html = '', render }) => ({
    html: `<div class="kp kp-glass" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${r}px;transform-origin:50% 50%">${html}</div>`,
    render(T, root) { const el = root.firstChild, k = cardK(T, t, out, outDur, dur);
      css(el, { opacity: f4(k.o), transform: cardT(k, dy) }); if (render && k.o > .001) render(T, el); },
  });

  // ===================== yükselen hız / gelir eğrisi =====================
  let UID = 0;
  const curve = ({ x, y, w = 300, h = 300, t, draw, label, tone = 'speed', branches = [], out = Infinity, outDur = .35, r = 28 }) => {
    const id = 'kpc' + (++UID), pad = Math.round(w * .085);
    const ls = label ? Math.round(w * .118) : 0, lh = label ? ls * 1.9 : 0;
    const gx = pad, gy = pad + (label ? lh + pad * .55 : 0), gw = w - 2 * pad, gh = h - gy - pad;
    const ex = tone === 'revenue' ? 2.1 : 3.3;
    const fY = u => tone === 'revenue'
      ? 1 - (Math.pow(u, 1.55) * .86 + .06 * Math.sin(u * 10.5) * u * (1 - u) * 2.2 + .04)
      : 1 - ((Math.exp(ex * u) - 1) / (Math.exp(ex) - 1) * .86 + .05);
    const P = u => [gx + u * gw, gy + gh * fY(u)];
    const N = 48, pts = [...Array(N + 1)].map((_, i) => P(i / N));
    const d = 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L');
    const area = d + ` L${(gx + gw).toFixed(1)} ${(gy + gh).toFixed(1)} L${gx} ${(gy + gh).toFixed(1)} Z`;
    const [da, db] = draw || [t + .25, t + 1.25];
    const BR = branches.map((b, i) => { const u0 = b.at ?? .55, p0 = P(u0), rise = b.rise ?? (.5 + i * .18);
      const p1 = [gx + gw * Math.min(1, u0 + .42), gy + gh * Math.max(.02, fY(u0) - rise)];
      return { ...b, d: `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} C${(p0[0] + gw * .18).toFixed(1)} ${p0[1].toFixed(1)} ${(p1[0] - gw * .14).toFixed(1)} ${(p1[1] + gh * .12).toFixed(1)} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`, p1 }; });
    const grid = [0, 1, 2, 3].map(i => `<line x1="${gx}" x2="${gx + gw}" y1="${(gy + gh * i / 3).toFixed(1)}" y2="${(gy + gh * i / 3).toFixed(1)}" stroke="rgba(191,227,255,.10)" stroke-width="1.5"/>`).join('');
    const inner = `<svg class="cv" width="${w}" height="${h}" style="position:absolute;left:0;top:0;overflow:visible">
      <defs><linearGradient id="${id}s" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${C.sky}"/><stop offset="1" stop-color="${C.yellow}"/></linearGradient>
      <linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(93,179,240,.34)"/><stop offset="1" stop-color="rgba(93,179,240,0)"/></linearGradient>
      <clipPath id="${id}k"><rect class="ck" x="${gx}" y="0" width="0" height="${h}"/></clipPath></defs>
      ${grid}<line x1="${gx}" x2="${gx + gw}" y1="${gy + gh}" y2="${gy + gh}" stroke="rgba(191,227,255,.32)" stroke-width="2"/>
      <path d="${area}" fill="url(#${id}a)" clip-path="url(#${id}k)"/>
      ${BR.map((b, i) => `<path class="br" data-i="${i}" d="${b.d}" fill="none" stroke="${C.ice}" stroke-width="${Math.max(3, w * .014).toFixed(1)}" stroke-linecap="round" opacity=".9"/>`).join('')}
      <path class="ln" d="${d}" fill="none" stroke="url(#${id}s)" stroke-width="${Math.max(5, w * .024).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>
      ${BR.map((b, i) => `<circle class="bd" data-i="${i}" r="${(w * .022).toFixed(1)}" fill="${C.ice}" cx="${b.p1[0].toFixed(1)}" cy="${b.p1[1].toFixed(1)}"/>`).join('')}
      <circle class="hg" r="${(w * .07).toFixed(1)}" fill="rgba(255,210,63,.22)"/><circle class="hd" r="${(w * .032).toFixed(1)}" fill="${C.yellow}"/></svg>` +
      (label ? `<div class="kp-pill y lb" style="left:${pad}px;top:${pad}px;font-size:${ls}px;padding:${Math.round(ls * .42)}px ${Math.round(ls * .62)}px">${esc(label.text)}</div>` : '');
    let Lm = 0, bl = [];
    return glass({ x, y, w, h, r, t, out, outDur, html: inner, render(T, el) {
      const svg = el.querySelector('.cv'), ln = svg.querySelector('.ln');
      if (!Lm) { Lm = ln.getTotalLength(); bl = [...svg.querySelectorAll('.br')].map(p => p.getTotalLength()); }
      const u = E.inOutCubic(prog(T, da, db));
      css(ln, { strokeDasharray: `${Lm} ${Lm}`, strokeDashoffset: f2(Lm * (1 - u)) });
      svg.querySelector('.ck').setAttribute('width', f2(gw * u));
      const p = ln.getPointAtLength(Lm * u), on = u > .002 ? 1 : 0;
      for (const c of [svg.querySelector('.hd'), svg.querySelector('.hg')]) { c.setAttribute('cx', f2(p.x)); c.setAttribute('cy', f2(p.y)); c.style.opacity = on; }
      svg.querySelector('.hg').setAttribute('r', f2(w * .07 * (1 + .25 * Math.sin(Math.max(0, T - db) * 4) * (T > db ? 1 : 0))));
      [...svg.querySelectorAll('.br')].forEach((b, i) => { const bu = E.inOutCubic(prog(T, BR[i].t, BR[i].t + (BR[i].dur ?? .6)));
        css(b, { strokeDasharray: `${bl[i]} ${bl[i]}`, strokeDashoffset: f2(bl[i] * (1 - bu)), opacity: bu > 0 ? .9 : 0 });
        svg.querySelectorAll('.bd')[i].style.opacity = f2(clamp((bu - .9) * 10)); });
      if (label) { const lb = el.querySelector('.lb'), lk = inK(T, label.t ?? t, .35); css(lb, { opacity: f4(lk), transform: `scale(${f4(lerp(.9, 1, lk))})`, transformOrigin: '0 50%' }); }
    } });
  };

  // ===================== telefon uygulama ekranı (yazısız iskelet) =====================
  // geometri telefon kutusuna göre; build sırası: başlık, kahraman kartı, 3 satır, düğme, sekme çubuğu
  const phoneGeo = (w, h) => { const s = Math.max(6, Math.round(w * .042)), R = Math.round(w * .15), ic = Math.round(w * .2), m = Math.round(w * .075);
    return { s, R, ic, m, icx: s + m, icy: s + Math.round(h * .06) }; };
  const phoneInner = (w, h, { icon: ic0 = true } = {}) => {
    const g = phoneGeo(w, h), sw = w - 2 * g.s, sh = h - 2 * g.s, m = g.m;
    const it = (cls, st, inner = '') => `<div class="it ${cls}" style="${st}">${inner}</div>`;
    const rows = [0, 1, 2].map(i => { const yy = Math.round(sh * (.44 + i * .1)), dd = Math.round(w * .11), col = [C.sky, C.yellow, C.green][i];
      return it('b', `left:${m}px;top:${yy}px;width:${sw - 2 * m}px;height:${dd}px`,
        `<div style="position:absolute;left:0;top:0;width:${dd}px;height:${dd}px;border-radius:50%;background:${col};opacity:.9"></div>` +
        `<div class="kp-sk" style="left:${dd + 12}px;top:${Math.round(dd * .14)}px;width:${Math.round(w * .42)}px;height:${Math.round(h * .019)}px;background:rgba(243,245,250,.7)"></div>` +
        `<div class="kp-sk" style="left:${dd + 12}px;top:${Math.round(dd * .62)}px;width:${Math.round(w * .26)}px;height:${Math.round(h * .014)}px"></div>`); }).join('');
    return `<div class="scr" style="left:${g.s}px;top:${g.s}px;width:${sw}px;height:${sh}px;border-radius:${g.R - g.s}px">
      <div style="position:absolute;left:${Math.round(sw * .35)}px;top:${Math.round(sh * .014)}px;width:${Math.round(sw * .3)}px;height:${Math.round(h * .024)}px;border-radius:99px;background:#060A14"></div>
      ${ic0 ? it('b', `left:${m}px;top:${g.icy - g.s}px;width:${g.ic}px;height:${g.ic}px;border-radius:${Math.round(g.ic * .26)}px;background:linear-gradient(160deg,#FFE27A,#FFD23F 60%,#F2BE22);display:grid;place-items:center`, icon('bulb', Math.round(g.ic * .62), '#0A1122', 2.3)) : ''}
      ${it('b', `left:${m + g.ic + Math.round(w * .05)}px;top:${g.icy - g.s + Math.round(g.ic * .14)}px;width:${Math.round(w * .4)}px;height:${g.ic}px`,
        `<div class="kp-sk" style="left:0;top:0;width:100%;height:${Math.round(h * .024)}px;background:rgba(243,245,250,.85)"></div><div class="kp-sk" style="left:0;top:${Math.round(g.ic * .5)}px;width:62%;height:${Math.round(h * .017)}px"></div>`)}
      ${it('b', `left:${m}px;top:${Math.round(sh * .2)}px;width:${sw - 2 * m}px;height:${Math.round(sh * .2)}px;border-radius:${Math.round(w * .07)}px;background:linear-gradient(135deg,${C.blue} 0%,${C.sky} 100%);box-shadow:0 10px 24px rgba(0,0,0,.3)`,
        `<div class="kp-sk" style="left:${Math.round(w * .07)}px;top:${Math.round(sh * .045)}px;width:${Math.round(w * .38)}px;height:${Math.round(h * .022)}px;background:rgba(255,255,255,.92)"></div>` +
        `<div class="kp-sk" style="left:${Math.round(w * .07)}px;top:${Math.round(sh * .09)}px;width:${Math.round(w * .26)}px;height:${Math.round(h * .015)}px;background:rgba(255,255,255,.55)"></div>` +
        `<div class="kp-sk" style="left:${Math.round(w * .07)}px;top:${Math.round(sh * .135)}px;width:${Math.round(w * .2)}px;height:${Math.round(h * .03)}px;background:${C.yellow}"></div>`)}
      ${rows}
      ${it('b', `left:${Math.round(sw * .2)}px;top:${Math.round(sh * .76)}px;width:${Math.round(sw * .6)}px;height:${Math.round(sh * .065)}px;border-radius:999px;background:${C.yellow};box-shadow:0 8px 18px rgba(0,0,0,.3)`)}
      ${it('b', `left:${m}px;top:${Math.round(sh * .885)}px;width:${sw - 2 * m}px;height:${Math.round(sh * .05)}px;display:flex;justify-content:space-around;align-items:center`,
        [0, 1, 2, 3].map(i => `<i style="display:block;width:${Math.round(w * .07)}px;height:${Math.round(w * .07)}px;border-radius:${i ? '50%' : '30%'};background:${i ? 'rgba(243,245,250,.22)' : C.sky}"></i>`).join(''))}
    </div>`;
  };
  const buildItems = (T, el, a, b, rise = 12) => { const its = el.querySelectorAll('.it.b'), n = its.length;
    its.forEach((e, i) => { const t0 = lerp(a, b, n > 1 ? i / (n - 1) : 0) - .12, k = inK(T, t0, .32);
      css(e, { opacity: f4(k), transform: `translate(0px,${f2(rise * (1 - k))}px)` }); }); };
  const checkHtml = (d, cls = 'ck') => `<div class="kp-chk ${cls}" style="width:${d}px;height:${d}px">${icon('check', Math.round(d * .62), '#fff', 3.2)}</div>`;
  const popCheck = (el, T, t0) => { const k = fin(t0) ? clamp(spring(T - t0, .6, 2.6), 0, 1.15) : 0;
    css(el, { opacity: f4(clamp(k * 3)), transform: `scale(${f4(k)})` }); };

  const phone = ({ x, y, w = 250, h = 500, t, build, check, out = Infinity, outDur = .35, icon: ic = true, rot = 0 }) => {
    const g = phoneGeo(w, h), [ba, bb] = build || [t + .15, t + .95], cd = Math.round(w * .2);
    return {
      html: `<div class="kp kp-phone" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${g.R}px">${phoneInner(w, h, { icon: ic })}</div>` +
            `<div class="kp" style="left:${x + w - cd * .8}px;top:${y - cd * .3}px">${checkHtml(cd)}</div>`,
      render(T, r) { const el = r.firstChild, k = cardK(T, t, out, outDur);
        css(el, { opacity: f4(k.o), transform: `${cardT(k, 26)} rotate(${rot}deg)` }); buildItems(T, el, ba, bb);
        const ck = r.children[1]; popCheck(ck.firstChild, T, check); ck.style.opacity = f4(1 - k.b); },
    };
  };

  // ===================== yapışkan not -> telefon uygulama ekranı =====================
  const noteToPhone = ({ x, y, w = 250, h = 500, note = {}, phone: ph = {}, out = Infinity, outDur = .35 }) => {
    const g = phoneGeo(w, h), n = note.size ?? Math.round(w * .92), rot = note.rot ?? -4;
    const ncx = note.cx ?? x + w / 2, ncy = note.cy ?? y + h * .44;               // not merkezi (telefonun ortası)
    const icx = x + g.icx + g.ic / 2, icy = y + g.icy + g.ic / 2, sc = g.ic / n;  // uygulama ikonu merkezi + ölçek
    const MT = ph.t, MD = ph.dur ?? .7, [ba, bb] = ph.build || [MT + MD * .55, MT + MD + .75], cd = Math.round(w * .2);
    const fs = note.fs ?? Math.round(n * .19);
    return {
      html: `<div class="kp kp-phone" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${g.R}px">${phoneInner(w, h, { icon: false })}</div>` +
        `<div class="kp kp-note" style="left:${ncx - n / 2}px;top:${ncy - n / 2}px;width:${n}px;height:${n}px">
           <div class="np"><div style="position:absolute;left:11%;top:12%">${icon('bulb', Math.round(n * .2), '#0A1122', 2.2)}</div>
             <div class="nt" style="font-size:${fs}px">${esc(note.text || '')}</div></div><div class="tape"></div>
           <div class="ai" style="opacity:0;border-radius:${Math.round(n * .26)}px">${icon('bulb', Math.round(n * .62), '#0A1122', 2.0)}</div></div>` +
        `<div class="kp" style="left:${x + w - cd * .8}px;top:${y - cd * .3}px">${checkHtml(cd)}</div>`,
      render(T, r) {
        const [pe, ne, ce] = r.children, ko = 1 - outK(T, out, outDur);
        // not: yerinde belirir (opaklık + kısa yükseliş + hafif dönme), sonra uygulama ikonuna küçülüp telefonun başlığına gider
        const nk = inK(T, note.t, .5), mu = io(T, MT, MD);
        const tx = lerp(0, icx - ncx, mu), ty = lerp(18 * (1 - nk), icy - ncy, mu);
        const s = lerp(lerp(1.04, 1, nk), sc, mu), rr = lerp(rot - 3 * (1 - nk), 0, mu);
        css(ne, { opacity: f4(nk * ko), transform: `translate(${f2(tx)}px,${f2(ty)}px) rotate(${f2(rr)}deg) scale(${f4(s)})` });
        ne.querySelector('.np').style.opacity = f4(1 - clamp((mu - .08) / .27));      // kâğıt + yazı önce söner, ikon sonra belirir (çift görüntü yok)
        ne.querySelector('.tape').style.opacity = f4(1 - clamp(mu / .2));
        ne.querySelector('.ai').style.opacity = f4(clamp((mu - .3) / .3));
        // telefon: notun çevresinde yerinde belirir (ölçek .92 -> 1), ekran kurulur
        const pk = io(T, MT, MD * .8);
        css(pe, { opacity: f4(pk * ko), transform: `scale(${f4(lerp(.9, 1, pk))})` });
        buildItems(T, pe, ba, bb);
        popCheck(ce.firstChild, T, ph.check); ce.style.opacity = f4(ko);
      },
    };
  };

  // ===================== kâğıt / tablo -> panel (dashboard) + ilerleme çubuğu =====================
  const paperToPanel = ({ x, y, w = 330, h = 470, paper: pp = {}, panel: pn = {}, progress: pg, out = Infinity, outDur = .35, rows = 4 }) => {
    const pw = Math.round(pp.w ?? w * .9), ph = Math.round(pp.h ?? h * .74), px = Math.round(x + (w - pw) / 2), py = Math.round(y + (pp.dy ?? h * .05)), rot = pp.rot ?? -3;
    const MT = pn.t, MD = pn.dur ?? .7, [ba, bb] = pn.build || [MT + .35, MT + 1.1];
    const rowY = i => Math.round(ph * (.24 + i * (.66 / rows)));                    // satırlar (kâğıt içi)
    const cb = Math.round(pw * .1), ticks = pp.ticks || [];
    const paperHtml = `<div class="kp kp-paper" style="left:${px}px;top:${py}px;width:${pw}px;height:${ph}px">
      <div style="position:absolute;left:${Math.round(pw * .1)}px;top:${Math.round(ph * .08)}px;width:${Math.round(pw * .46)}px;height:${Math.round(ph * .04)}px;border-radius:4px;background:#2B3446;opacity:.82"></div>
      <div style="position:absolute;left:${Math.round(pw * .1)}px;top:${Math.round(ph * .14)}px;width:${Math.round(pw * .3)}px;height:${Math.round(ph * .022)}px;border-radius:4px;background:#8A93A3;opacity:.6"></div>
      <svg width="${pw}" height="${ph}" style="position:absolute;left:0;top:0">
      ${[...Array(rows)].map((_, i) => { const yy = rowY(i), bx = Math.round(pw * .1), x1 = Math.round(pw * .27);
        const wav = (x0, x2, y0) => `M${x0} ${y0} Q${(x0 + x2) * .5} ${y0 - 3} ${x2} ${y0 + 1}`;
        return `<line x1="${Math.round(pw * .06)}" x2="${Math.round(pw * .94)}" y1="${yy + cb + Math.round(ph * .035)}" y2="${yy + cb + Math.round(ph * .035)}" stroke="#D9D3C6" stroke-width="2"/>
          <rect x="${bx}" y="${yy}" width="${cb}" height="${cb}" rx="3" fill="none" stroke="#5B6474" stroke-width="2.6"/>
          <path d="${wav(x1, Math.round(pw * (.86 - (i % 2) * .12)), yy + Math.round(cb * .3))}" stroke="#7D8696" stroke-width="${Math.max(3, pw * .014).toFixed(1)}" fill="none" stroke-linecap="round"/>
          <path d="${wav(x1, Math.round(pw * (.62 + (i % 3) * .06)), yy + Math.round(cb * .82))}" stroke="#A7AEBB" stroke-width="${Math.max(2.5, pw * .011).toFixed(1)}" fill="none" stroke-linecap="round"/>
          <path class="tk" d="M${bx + cb * .15} ${yy + cb * .5} L${bx + cb * .42} ${yy + cb * .82} L${bx + cb * 1.05} ${yy - cb * .18}" stroke="#2546C8" stroke-width="${Math.max(4, pw * .018).toFixed(1)}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>`; }).join('')}
      </svg></div>`;
    // panel (cam): üst çubuk, kenar menü, satırlar (yeşil durum), küçük grafik, ilerleme alanı
    const sb = Math.round(w * .17), tb = Math.round(h * .085), cx0 = sb + Math.round(w * .06), cwid = w - cx0 - Math.round(w * .06);
    const prY = Math.round(h * .86), prH = Math.round(h * .045), prX = cx0 + Math.round(w * .1), prW = cwid - Math.round(w * .1);
    const it = (st, inner = '') => `<div class="it b" style="position:absolute;${st}">${inner}</div>`;
    const panelHtml = `<div class="kp kp-glass pn" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:24px;transform-origin:50% 40%">
      <div style="position:absolute;left:0;top:0;right:0;height:${tb}px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(7,10,18,.45)"></div>
      <div style="position:absolute;left:${Math.round(w * .05)}px;top:${Math.round(tb / 2 - 5)}px;display:flex;gap:7px">${'<b style="display:block;width:10px;height:10px;border-radius:50%;background:rgba(243,245,250,.2)"></b>'.repeat(3)}</div>
      <div style="position:absolute;left:0;top:${tb}px;width:${sb}px;bottom:0;border-right:1px solid rgba(255,255,255,.07);background:rgba(7,10,18,.3)"></div>
      ${[0, 1, 2, 3].map(i => it(`left:${Math.round(sb * .27)}px;top:${tb + Math.round(h * .05) + i * Math.round(h * .085)}px;width:${Math.round(sb * .46)}px;height:${Math.round(sb * .46)}px;border-radius:30%;background:${i ? 'rgba(243,245,250,.16)' : C.sky}`)).join('')}
      ${[...Array(rows)].map((_, i) => { const yy = Math.round(py - y + rowY(i) * 1), d = Math.round(w * .075);
        return it(`left:${cx0}px;top:${yy}px;width:${cwid}px;height:${d}px`,
          `<div style="position:absolute;left:0;top:0;width:${d}px;height:${d}px;border-radius:50%;background:${C.green};display:grid;place-items:center">${icon('check', Math.round(d * .66), '#fff', 3.4)}</div>` +
          `<div class="kp-sk" style="left:${d + 10}px;top:${Math.round(d * .18)}px;width:${Math.round(cwid * .52)}px;height:${Math.round(d * .26)}px;background:rgba(243,245,250,.62)"></div>` +
          `<div class="kp-sk" style="left:${d + 10}px;top:${Math.round(d * .62)}px;width:${Math.round(cwid * .32)}px;height:${Math.round(d * .2)}px"></div>` +
          `<div class="kp-sk" style="right:0;top:${Math.round(d * .2)}px;width:${Math.round(cwid * .18)}px;height:${Math.round(d * .6)}px;background:rgba(31,183,102,.25);border:1.5px solid rgba(31,183,102,.6)"></div>`); }).join('')}
      ${it(`left:${cx0}px;top:${Math.round(h * .66)}px;width:${cwid}px;height:${Math.round(h * .13)}px;display:flex;align-items:flex-end;gap:${Math.round(cwid * .05)}px`,
        [.35, .55, .45, .75, .95].map((v, i) => `<i style="display:block;flex:1;height:${Math.round(v * 100)}%;border-radius:5px 5px 2px 2px;background:${i === 4 ? C.yellow : 'rgba(93,179,240,.55)'}"></i>`).join(''))}
      ${pg ? `<div class="pr" style="position:absolute;left:${cx0}px;top:${prY - Math.round(prH * .6)}px;width:${Math.round(w * .085)}px;height:${Math.round(w * .085)}px;color:${C.yellow}">${icon('bolt', Math.round(w * .085), C.yellow)}</div>
        <div class="pr" style="position:absolute;left:${prX}px;top:${prY}px;width:${prW}px;height:${prH}px;border-radius:99px;background:rgba(243,245,250,.12);overflow:hidden">
          <b class="pf" style="position:absolute;left:0;top:0;bottom:0;width:0;border-radius:99px;background:linear-gradient(90deg,${C.blue},${C.sky} 60%,${C.yellow})"></b></div>` : ''}
    </div>`;
    const cd = Math.round(w * .17);
    return {
      html: panelHtml + paperHtml + `<div class="kp" style="left:${x + w - cd * .7}px;top:${y + h - cd * .75}px">${checkHtml(cd)}</div>`,
      render(T, r) {
        const [pe, pa, ce] = r.children, ko = 1 - outK(T, out, outDur);
        // kâğıt: yerinde belirir; elle tikler sırayla çizilir; panel anında söner (yassılaşıp düzleşerek)
        const ak = inK(T, pp.t, .5), mu = io(T, MT, MD);
        css(pa, { opacity: f4(ak * (1 - clamp(mu / .6)) * ko), transform: `translate(0px,${f2(18 * (1 - ak))}px) rotate(${f2(lerp(rot - 2 * (1 - ak), 0, mu))}deg) scale(${f4(lerp(lerp(1.03, 1, ak), w / pw, mu))})` });
        pa.querySelectorAll('.tk').forEach((p, i) => { const tt = ticks[i]; const L0 = 60, u = fin(tt) ? E.outCubic(prog(T, tt, tt + .28)) : 0;
          css(p, { strokeDasharray: `${L0} ${L0}`, strokeDashoffset: f2(L0 * (1 - u)), opacity: u > 0 ? 1 : 0 }); });
        // panel: kâğıdın dikdörtgeninden büyür (opaklık + ölçek), içi kurulur
        const pk = io(T, MT + MD * .15, MD * .85);
        css(pe, { opacity: f4(pk * ko), transform: `scale(${f4(lerp(pw / w * .98, 1, pk))})` });
        buildItems(T, pe, ba, bb, 10);
        if (pg) { const fu = fin(pg.t) ? E.inOutCubic(prog(T, pg.t, pg.t + (pg.dur ?? .8))) : 0;
          pe.querySelector('.pf').style.width = f2(prW * fu) + 'px';
          pe.querySelectorAll('.pr').forEach(e => e.style.opacity = f4(inK(T, (pg.show ?? bb - .1), .3))); }
        popCheck(ce.firstChild, T, pg ? (pg.check ?? pg.t + (pg.dur ?? .8) + .05) : pn.check); ce.style.opacity = f4(ko);
      },
    };
  };

  // ===================== tek başına ilerleme çubuğu =====================
  const progress = ({ x, y, w = 420, h = 96, t, fill, label, out = Infinity, outDur = .35, check }) => {
    const [fa, fb] = fill || [t + .3, t + 1.1], ic = Math.round(h * .5), tx = Math.round(h * .3 + ic + h * .2), tw = w - tx - Math.round(h * .32), th = Math.round(h * .2);
    const cd = Math.round(h * .62);
    const inner = `<div style="position:absolute;left:${Math.round(h * .3)}px;top:${Math.round((h - ic) / 2)}px">${icon('bolt', ic, C.yellow)}</div>` +
      (label ? `<div style="position:absolute;left:${tx}px;top:${Math.round(h * .16)}px;font-size:${Math.round(h * .24)}px;font-weight:700;color:${C.ice};white-space:nowrap">${esc(label)}</div>` : '') +
      `<div style="position:absolute;left:${tx}px;top:${label ? Math.round(h * .58) : Math.round((h - th) / 2)}px;width:${tw}px;height:${th}px;border-radius:99px;background:rgba(243,245,250,.12);overflow:hidden">
        <b class="pf" style="position:absolute;left:0;top:0;bottom:0;width:0;border-radius:99px;background:linear-gradient(90deg,${C.blue},${C.sky} 60%,${C.yellow})"></b></div>`;
    const gl = glass({ x, y, w, h, r: Math.round(h / 2), t, out, outDur, html: inner, render(T, el) {
      el.querySelector('.pf').style.width = f2(tw * E.inOutCubic(prog(T, fa, fb))) + 'px'; } });
    return { html: gl.html + `<div class="kp" style="left:${x + w - cd * .55}px;top:${y - cd * .4}px">${checkHtml(cd)}</div>`,
      render(T, r) { gl.render(T, r); popCheck(r.children[1].firstChild, T, check ?? fb + .05); r.children[1].style.opacity = f4(1 - outK(T, out, outDur)); } };
  };

  // ===================== saat kartı (rakamsız) =====================
  const clock = ({ x, y, size = 300, t, spin, turns = 6, label, out = Infinity, outDur = .35 }) => {
    const id = 'kpk' + (++UID), R = size * .34, cx = size / 2, cy = label ? size * .42 : size / 2, [sa, sb] = spin || [t + .3, t + 1.8];
    const lh = label ? Math.round(size * .11) : 0, H2 = label ? Math.round(size * 1.08) : size;
    const ticks = [...Array(12)].map((_, i) => { const a = i * Math.PI / 6, r0 = R * (i % 3 ? .86 : .78);
      return `<line x1="${(cx + Math.sin(a) * r0).toFixed(1)}" y1="${(cy - Math.cos(a) * r0).toFixed(1)}" x2="${(cx + Math.sin(a) * R * .95).toFixed(1)}" y2="${(cy - Math.cos(a) * R * .95).toFixed(1)}" stroke="rgba(191,227,255,${i % 3 ? .35 : .7})" stroke-width="${i % 3 ? 2.5 : 4}" stroke-linecap="round"/>`; }).join('');
    const inner = `<svg width="${size}" height="${H2}" style="position:absolute;left:0;top:0"><circle cx="${cx}" cy="${cy}" r="${R}" fill="rgba(7,10,18,.45)" stroke="rgba(191,227,255,.25)" stroke-width="2"/>
      <path class="arc" fill="none" stroke="${C.sky}" stroke-width="${(size * .03).toFixed(1)}" stroke-linecap="round" opacity=".85"/>${ticks}
      <line class="hh" x1="${cx}" y1="${cy}" x2="${cx}" y2="${(cy - R * .5).toFixed(1)}" stroke="${C.off}" stroke-width="${(size * .03).toFixed(1)}" stroke-linecap="round"/>
      <line class="mh" x1="${cx}" y1="${cy}" x2="${cx}" y2="${(cy - R * .78).toFixed(1)}" stroke="${C.yellow}" stroke-width="${(size * .02).toFixed(1)}" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="${(size * .028).toFixed(1)}" fill="${C.yellow}"/></svg>` +
      (label ? `<div class="kp-pill y lb" style="left:50%;top:${Math.round(cy + R + size * .07)}px;transform:translateX(-50%);font-size:${lh}px;padding:${Math.round(lh * .4)}px ${Math.round(lh * .65)}px">${esc(label.text)}</div>` : '');
    return glass({ x, y, w: size, h: H2, r: Math.round(size * .12), t, out, outDur, html: inner, render(T, el) {
      const u = E.inOutCubic(prog(T, sa, sb)), ma = u * turns * 360, ha = ma / 12;
      el.querySelector('.mh').setAttribute('transform', `rotate(${f2(ma)} ${cx} ${cy})`);
      el.querySelector('.hh').setAttribute('transform', `rotate(${f2(ha + 300)} ${cx} ${cy})`);
      const a1 = Math.min(359.9, u * 359.9) * Math.PI / 180, rr = R * 1.13, big = a1 > Math.PI ? 1 : 0;
      el.querySelector('.arc').setAttribute('d', u > .001 ? `M${cx} ${f2(cy - rr)} A${f2(rr)} ${f2(rr)} 0 ${big} 1 ${f2(cx + Math.sin(a1) * rr)} ${f2(cy - Math.cos(a1) * rr)}` : '');
      if (label) { const lb = el.querySelector('.lb'), lk = inK(T, label.t ?? t, .35); lb.style.opacity = f4(lk); }
    } });
  };

  // ===================== tarayıcı penceresi (yazısız site iskeleti) + telefon =====================
  const browser = ({ x, y, w = 520, h = 380, t, build, out = Infinity, outDur = .35, rot = 0 }) => {
    const [ba, bb] = build || [t + .15, t + .95], bar = Math.round(h * .11), m = Math.round(w * .06);
    const it = (st, inner = '') => `<div class="it b" style="position:absolute;${st}">${inner}</div>`;
    const cw = Math.round((w - 2 * m - 2 * m * .6) / 3);
    const inner = `<div style="position:absolute;left:0;top:0;right:0;height:${bar}px;background:rgba(7,10,18,.55);border-bottom:1px solid rgba(255,255,255,.08)"></div>
      <div style="position:absolute;left:${m}px;top:${Math.round(bar / 2 - 6)}px;display:flex;gap:8px">${['#F87171', '#FBBF24', '#34D399'].map(c => `<b style="display:block;width:12px;height:12px;border-radius:50%;background:${c};opacity:.85"></b>`).join('')}</div>
      <div style="position:absolute;left:${Math.round(w * .26)}px;top:${Math.round(bar * .22)}px;width:${Math.round(w * .5)}px;height:${Math.round(bar * .56)}px;border-radius:99px;background:rgba(243,245,250,.08)"></div>
      ${it(`left:${m}px;top:${bar + m * .7}px;width:${w - 2 * m}px;height:${Math.round(h * .07)}px;display:flex;justify-content:space-between;align-items:center`,
        `<i style="display:block;width:${Math.round(w * .16)}px;height:${Math.round(h * .045)}px;border-radius:99px;background:${C.sky}"></i><span style="display:flex;gap:${Math.round(w * .03)}px">${`<i style="display:block;width:${Math.round(w * .08)}px;height:${Math.round(h * .025)}px;border-radius:99px;background:rgba(243,245,250,.25)"></i>`.repeat(3)}</span>`)}
      ${it(`left:${m}px;top:${bar + Math.round(h * .2)}px;width:${w - 2 * m}px;height:${Math.round(h * .34)}px;border-radius:${Math.round(w * .03)}px;background:linear-gradient(120deg,${C.blue},${C.sky})`,
        `<div class="kp-sk" style="left:${m}px;top:${Math.round(h * .07)}px;width:${Math.round(w * .44)}px;height:${Math.round(h * .045)}px;background:rgba(255,255,255,.92)"></div><div class="kp-sk" style="left:${m}px;top:${Math.round(h * .15)}px;width:${Math.round(w * .3)}px;height:${Math.round(h * .03)}px;background:rgba(255,255,255,.55)"></div><div class="kp-sk" style="left:${m}px;top:${Math.round(h * .22)}px;width:${Math.round(w * .16)}px;height:${Math.round(h * .055)}px;background:${C.yellow}"></div>`)}
      ${[0, 1, 2].map(i => it(`left:${m + i * (cw + Math.round(m * .6))}px;top:${bar + Math.round(h * .6)}px;width:${cw}px;height:${Math.round(h * .24)}px;border-radius:${Math.round(w * .025)}px;background:rgba(243,245,250,.07);border:1px solid rgba(255,255,255,.08)`,
        `<div style="position:absolute;left:12%;top:16%;width:${Math.round(cw * .22)}px;height:${Math.round(cw * .22)}px;border-radius:30%;background:${[C.sky, C.yellow, C.green][i]};opacity:.9"></div><div class="kp-sk" style="left:12%;top:58%;width:70%;height:${Math.round(h * .025)}px"></div>`)).join('')}`;
    const gl = glass({ x, y, w, h, r: Math.round(w * .035), t, out, outDur, html: inner, render(T, el) { buildItems(T, el, ba, bb); } });
    return rot ? { html: `<div class="kp" style="transform:rotate(${rot}deg);transform-origin:${x + w / 2}px ${y + h / 2}px">${gl.html}</div>`, render(T, r) { gl.render(T, r.firstChild); } } : gl;
  };
  const browserPhone = ({ browser: bo, phone: po, out = Infinity, outDur = .35 }) => {
    const a = browser({ out, outDur, ...bo }), b = phone({ out, outDur, ...po });
    return { html: `<div class="kp">${a.html}</div><div class="kp">${b.html}</div>`, render(T, r) { a.render(T, r.children[0]); b.render(T, r.children[1]); } };
  };

  // ===================== avatar kalabalığı (yüzsüz, sayısız) =====================
  const crowd = ({ x, y, w = 900, h = 500, cols = 9, rows = 5, t, fill, lit, seed = 3, out = Infinity, outDur = .45, gap = .16, center }) => {
    const cw = w / cols, chh = h / rows, d = Math.min(cw, chh) * (1 - gap), [fa, fb] = fill || [t, t + 1.2];
    const cx0 = center ? center.x - x : w / 2, cy0 = center ? center.y - y : h / 2;
    const rnd = i => { const s = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453; return s - Math.floor(s); };
    const tones = [['#2B7FD9', '#BFE3FF'], ['#1E4F95', '#7FC0F2'], ['#5DB3F0', '#0E1A33'], ['#16305C', '#5DB3F0'], ['#BFE3FF', '#1E4F95'], ['#FFD23F', '#0A1122']];
    const cells = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, ox = (r % 2 ? cw * .5 : 0) * (cols > 1 ? .0 : 0), px = c * cw + cw / 2 + ox + (rnd(i) - .5) * cw * .16, py = r * chh + chh / 2 + (rnd(i + 99) - .5) * chh * .12;
      const dist = Math.hypot((px - cx0) / w, (py - cy0) / h) + rnd(i + 7) * .08;
      const tn = rnd(i + 31) < .07 ? tones[5] : tones[Math.floor(rnd(i + 5) * 5)];
      cells.push({ px, py, dist, tn, sc: .84 + rnd(i + 3) * .2 });
    }
    const maxD = Math.max(...cells.map(c => c.dist)) || 1;
    const av = (c, i) => { const dd = d * c.sc;
      return `<div class="av" data-i="${i}" style="position:absolute;left:${f2(c.px - dd / 2)}px;top:${f2(c.py - dd / 2)}px;width:${f2(dd)}px;height:${f2(dd)}px">
        <svg width="${f2(dd)}" height="${f2(dd)}" viewBox="0 0 100 100" style="display:block;overflow:visible"><defs><clipPath id="kpa${UID}_${i}"><circle cx="50" cy="50" r="48"/></clipPath></defs>
        <circle cx="50" cy="50" r="48" fill="${c.tn[0]}"/><g clip-path="url(#kpa${UID}_${i})"><circle cx="50" cy="40" r="17" fill="${c.tn[1]}"/><ellipse cx="50" cy="94" rx="32" ry="28" fill="${c.tn[1]}"/></g>
        <circle class="ring" cx="50" cy="50" r="49" fill="none" stroke="${C.yellow}" stroke-width="5" opacity="0"/></svg></div>`; };
    UID++;
    return {
      html: `<div class="kp" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${cells.map(av).join('')}</div>`,
      render(T, r) { const el = r.firstChild, ko = 1 - outK(T, out, outDur);
        el.style.opacity = f4(ko);
        el.querySelectorAll('.av').forEach((a, i) => { const c = cells[i], q = Math.pow(c.dist / maxD, 1.35), t0 = lerp(fa, fb, q), k = inK(T, t0, .32);
          css(a, { opacity: f4(k), transform: `scale(${f4(lerp(.6, 1, k))})` });
          if (lit) { const lu = prog(T, lit[0], lit[1]), xi = c.px / w, g = Math.max(0, 1 - Math.abs(lu * 1.3 - .15 - xi) * 6);
            a.querySelector('.ring').setAttribute('opacity', f2(lu > 0 && lu < 1 ? g : 0)); } });
      },
    };
  };

  // ===================== cam çip (+ sarı üstü çizgi) · bağ çizgisi · kod penceresi =====================
  const chip = ({ text, icon: ic, x, y, size = 40, anchor = 'center', t, strike, out = Infinity, outDur = .3, style = 'glass' }) => {
    const pad = Math.round(size * .55), dd = Math.round(size * 1.3);
    const html = `<div class="kp kpchip" style="left:${x}px;top:${y}px"><div class="kp-pill ${style === 'yellow' ? 'y' : style === 'white' ? 'w' : 's'}" style="position:relative;font-size:${size}px;padding:${Math.round(size * .32)}px ${pad}px ${Math.round(size * .32)}px ${ic ? Math.round(size * .32) : pad}px;${style === 'glass' ? 'background:rgba(14,26,51,.94);color:#F3F5FA;box-shadow:0 18px 40px rgba(0,0,0,.4)' : ''}">` +
      (ic ? `<span style="display:grid;place-items:center;width:${dd}px;height:${dd}px;border-radius:50%;background:${style === 'yellow' ? '#0A1122' : C.yellow}">${icon(ic, Math.round(dd * .56), style === 'yellow' ? C.yellow : '#0A1122', 2.4)}</span>` : '') +
      `<span>${esc(text)}</span><svg class="sk" style="position:absolute;left:0;top:0;overflow:visible" width="10" height="10"><line class="sl" stroke="${C.yellow}" stroke-width="${Math.round(size * .16)}" stroke-linecap="round"/></svg></div></div>`;
    let geo = null;
    return { html, render(T, r) {
      const wrap = r.firstChild, pill = wrap.firstChild, k = cardK(T, t, out, outDur, .45);
      if (!geo) { const bw = pill.offsetWidth, bh = pill.offsetHeight; geo = { bw, bh };
        const ln = pill.querySelector('.sl'); ln.setAttribute('x1', ic ? dd + size * .5 : size * .35); ln.setAttribute('x2', bw - size * .35); ln.setAttribute('y1', bh * .53); ln.setAttribute('y2', bh * .47); }
      const ax = anchor === 'left' ? 0 : anchor === 'right' ? -geo.bw : -geo.bw / 2;
      css(wrap, { opacity: f4(k.o), transform: `translate(${f2(ax)}px,${f2(-geo.bh / 2 + 16 * (1 - k.a))}px) scale(${f4(lerp(.96, 1, k.a))})`, transformOrigin: `${-ax}px ${geo.bh / 2}px` });
      const ln = pill.querySelector('.sl'), Lx = Math.max(1, geo.bw - (ic ? dd + size * .85 : size * .7)), su = strike && fin(strike.t) ? E.inOutCubic(prog(T, strike.t, strike.t + (strike.dur ?? .35))) : 0;
      css(ln, { strokeDasharray: `${Lx} ${Lx}`, strokeDashoffset: f2(Lx * (1 - su)), opacity: su > 0 ? 1 : 0 });
      pill.querySelectorAll(':scope > span').forEach(s => s.style.opacity = f4(lerp(1, strike?.dim ?? .55, su)));
    } };
  };
  const link = ({ from, to, t, dur = .45, out = Infinity, outDur = .3, width = 4, color = C.sky, dash }) => {
    const x0 = Math.min(from.x, to.x) - 10, y0 = Math.min(from.y, to.y) - 10, Lx = Math.hypot(to.x - from.x, to.y - from.y);
    return { html: `<svg class="kp" style="left:${x0}px;top:${y0}px;overflow:visible" width="${Math.abs(to.x - from.x) + 20}" height="${Math.abs(to.y - from.y) + 20}">
        <line class="lk" x1="${from.x - x0}" y1="${from.y - y0}" x2="${to.x - x0}" y2="${to.y - y0}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/></svg>`,
      render(T, r) { const u = E.inOutCubic(prog(T, t, t + dur)), ln = r.firstChild.firstElementChild;
        css(ln, { strokeDasharray: dash ? dash.join(' ') : `${Lx} ${Lx}`, strokeDashoffset: dash ? 0 : f2(Lx * (1 - u)), opacity: f4((dash ? u : u > 0 ? 1 : 0) * (1 - outK(T, out, outDur))) }); } };
  };
  const code = ({ x, y, w = 360, h = 240, t, strike, dim = .45, out = Infinity, outDur = .35, lines = 6, seed = 2 }) => {
    const bar = Math.round(h * .14), m = Math.round(w * .07), lh = (h - bar - m * 1.4) / lines;
    const rnd = i => { const s = Math.sin(i * 91.7 + seed * 13.1) * 9137.13; return s - Math.floor(s); };
    const cols = [C.sky, '#C792EA', C.yellow, '#7FE3AE', 'rgba(243,245,250,.55)'];
    const rowsH = [...Array(lines)].map((_, i) => { const ind = (i % 3 === 1 || i % 3 === 2) ? 1 : 0; let xx = m + ind * w * .07, s = '';
      for (let k = 0; k < 3; k++) { const ww = w * (.08 + rnd(i * 5 + k) * .2); if (xx + ww > w - m) break;
        s += `<i style="position:absolute;left:${f2(xx)}px;top:${f2(bar + m * .7 + i * lh + lh * .3)}px;width:${f2(ww)}px;height:${f2(lh * .38)}px;border-radius:99px;background:${cols[Math.floor(rnd(i * 7 + k) * cols.length)]};opacity:.85"></i>`; xx += ww + w * .03; }
      return s; }).join('');
    const inner = `<div style="position:absolute;left:0;top:0;right:0;height:${bar}px;background:rgba(7,10,18,.55)"></div><div style="position:absolute;left:${m}px;top:${Math.round(bar / 2 - 5)}px;display:flex;gap:7px">${'<b style="display:block;width:10px;height:10px;border-radius:50%;background:rgba(243,245,250,.22)"></b>'.repeat(3)}</div>
      <div style="position:absolute;right:${m}px;top:${Math.round(bar * .18)}px;color:${C.sky}">${icon('code', Math.round(bar * .64), C.sky, 2.4)}</div><div class="cd">${rowsH}</div>
      <svg width="${w}" height="${h}" style="position:absolute;left:0;top:0"><line class="sl" x1="${m * .6}" y1="${h * .78}" x2="${w - m * .6}" y2="${h * .28}" stroke="${C.yellow}" stroke-width="${Math.round(w * .022)}" stroke-linecap="round"/></svg>`;
    const Lx = Math.hypot(w - m * 1.2, h * .5);
    return glass({ x, y, w, h, r: Math.round(w * .05), t, out, outDur, html: inner, render(T, el) {
      const su = strike && fin(strike.t) ? E.inOutCubic(prog(T, strike.t, strike.t + (strike.dur ?? .4))) : 0;
      css(el.querySelector('.sl'), { strokeDasharray: `${Lx} ${Lx}`, strokeDashoffset: f2(Lx * (1 - su)), opacity: su > 0 ? 1 : 0 });
      el.querySelector('.cd').style.opacity = f4(lerp(1, dim, su));
    } });
  };

  // ===================== Marka logosu (+ 'Hemen Katıl' düğme dili) =====================
  const LOGO = (B.logo || {}).light || 'logo-light.png', LOGO_AR = B.logo_ar || .3;   // logo_ar: yükseklik/genişlik (brand.py yazar)
  const logo = ({ x, y, w = 300, t, out = Infinity, outDur = .35, card = true, pad, pill, src = LOGO, ar = LOGO_AR }) => {
    const lh = Math.round(w * ar), p = pad ?? Math.round(w * .08), ps = pill ? Math.round(pill.size ?? w * .105) : 0, pH = pill ? Math.round(ps * 2.2) : 0;
    const cw = w + 2 * p, chh = lh + 2 * p + (pill ? pH + Math.round(p * .5) : 0);
    const inner = `<img src="${asset(src)}" alt="" style="position:absolute;left:${p}px;top:${p}px;width:${w}px;height:${lh}px">` +
      (pill ? `<div class="kp-pill w lp" style="left:50%;top:${p + lh + Math.round(p * .35)}px;font-size:${ps}px;padding:${Math.round(ps * .55)}px ${Math.round(ps * .9)}px;transform-origin:50% 50%">${esc(pill.text)} ${icon('arrowR', Math.round(ps * 1.05), '#0A1122', 2.6)}</div>` : '');
    if (!card) return { html: `<div class="kp" style="left:${x}px;top:${y}px;width:${w}px;height:${lh}px"><img src="${asset(src)}" alt="" style="width:${w}px;height:${lh}px;display:block"></div>`,
      render(T, r) { const k = cardK(T, t, out, outDur, .6); css(r.firstChild, { opacity: f4(k.o), transform: `translate(0px,${f2(14 * (1 - k.a))}px) scale(${f4(lerp(.96, 1, k.a))})` }); } };
    let fitted = false;
    return glass({ x, y, w: cw, h: chh, r: 30, t, out, outDur, html: inner, render(T, el) {
      if (!pill) return;
      const lp = el.querySelector('.lp'), k = inK(T, pill.t ?? t + .3, .4);
      if (!fitted) { fitted = true; const pw = lp.offsetWidth, mx = cw - p; if (pw > mx) lp.style.fontSize = (ps * mx / pw).toFixed(1) + 'px'; }   // kartın içine sığdır
      css(lp, { opacity: f4(k), transform: `translateX(-50%) scale(${f4(lerp(.94, 1, k))})` });
    } });
  };

  // ===================== CTA: büyük beyaz düğme + 2 aşağı ok, tek yumuşak nabız =====================
  const cta = ({ text, x = W / 2, y, w = 640, h = 108, size, t, pulse, chev = {}, out = Infinity, outDur = .3 }) => {
    const fs = size ?? Math.round(h * .46), cs = chev.size ?? Math.round(h * .5), cg = chev.gap ?? Math.round(cs * .5), cy0 = y + h / 2 + (chev.dy ?? Math.round(h * .16));
    const chv = i => `<svg class="cv" style="position:absolute;left:${x - cs}px;top:${cy0 + i * cg}px;overflow:visible" width="${cs * 2}" height="${cs}" viewBox="0 0 120 60">
      <path d="M14 10 L60 48 L106 10" fill="none" stroke="${chev.color || C.sky}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 4px 8px rgba(0,0,0,.45))"/></svg>`;
    return {
      html: `<div class="kp"><div class="kp-btn" style="left:${x - w / 2}px;top:${y - h / 2}px;width:${w}px;height:${h}px;font-size:${fs}px">${esc(text)}</div>${chv(0)}${chv(1)}</div>`,
      render(T, r) {
        const el = r.firstChild, b = el.firstChild, ko = 1 - outK(T, out, outDur), k = inK(T, t, .45);
        const pu = fin(pulse) && T > pulse && T < pulse + .55 ? Math.sin(Math.PI * (T - pulse) / .55) : 0;
        css(b, { opacity: f4(k * ko), transform: `translate(0px,${f2(14 * (1 - k))}px) scale(${f4(lerp(.96, 1, k) * (1 + .04 * pu))})` });
        el.querySelectorAll('.cv').forEach((c, i) => { const ct = (chev.t ?? t + .22) + i * .12, ck = inK(T, ct, .4);
          const nudge = fin(pulse) ? Math.sin(Math.PI * clamp((T - pulse - .08 * i) / .55)) * 8 : 0;
          css(c, { opacity: f4(ck * ko * (i ? .7 : 1)), transform: `translate(0px,${f2(-10 * (1 - ck) + nudge)}px)` }); });
      },
    };
  };

  // ===================== kapanış: donmuş kare kararır, logo + adres + slogan =====================
  const close = ({ t, dur = .5, logoW, y, url = B.url || '', slogan = B.tagline || '', id = 'kpClose', z = 7, dim = .94,
                   urlSize, sloganSize, src = LOGO, ar = LOGO_AR } = {}) => {
    const lw = logoW ?? Math.round(Math.min(W, H) * .5), lh = Math.round(lw * ar), us = urlSize ?? Math.round(lw * .075), ss = sloganSize ?? Math.round(lw * .068);
    const total = lh + us * 1.7 + ss * 1.6, cy = y ?? (H > W ? 760 : H / 2), top = Math.round(cy - total / 2);
    const html = `<div class="kp kp-close"><div class="ov" data-safe="ignore"></div>
      <img class="lg" src="${asset(src)}" alt="" style="position:absolute;left:${(W - lw) / 2}px;top:${top}px;width:${lw}px;height:${lh}px;transform-origin:50% 50%">
      <div class="u ur" style="top:${Math.round(top + lh + us * .5)}px;font-size:${us}px;font-weight:700;color:${C.sky};letter-spacing:.01em">${esc(url)}</div>
      <div class="u sg" style="top:${Math.round(top + lh + us * 1.75)}px;font-size:${ss}px;font-weight:600;color:rgba(243,245,250,.9)">${esc(slogan)}</div></div>`;
    return L.scene({ id, z, from: t - .02, parts: [{ html, render(T, r) {
      const el = r.firstChild, ov = el.querySelector('.ov'), o = io(T, t, dur) * dim;
      ov.style.opacity = f4(o);
      const lk = io(T, t + dur * .45, .6); css(el.querySelector('.lg'), { opacity: f4(lk), transform: `scale(${f4(lerp(.94, 1, lk))})` });
      const uk = inK(T, t + dur * .45 + .25, .45), sk = inK(T, t + dur * .45 + .4, .45);
      css(el.querySelector('.ur'), { opacity: f4(uk), transform: `translate(0px,${f2(10 * (1 - uk))}px)` });
      css(el.querySelector('.sg'), { opacity: f4(sk), transform: `translate(0px,${f2(10 * (1 - sk))}px)` });
    } }] });
  };

  window.KP = { C, FONT, fonts, icon, look, cams, stage, STUDIO, cover, word: bigWord, silk, glass, curve, phone, noteToPhone, paperToPanel, progress, clock,
    browser, browserPhone, crowd, chip, link, code, logo, cta, close, LOGO, LOGO_AR,
    ws: i => word(i).s, we: i => word(i).e };
})();
