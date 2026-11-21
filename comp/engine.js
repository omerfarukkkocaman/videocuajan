// Reels motoru: her kare saf bir t fonksiyonu. window.renderAt(t) kareyi çizer.
// Video dosyası (projects/<slug>/video.js) defineVideo({...}) ile sahneleri ve yerleşimi tanımlar.
(function () {
  const FPS = 30;
  // ===== format profili (comp/formats.json, ?fmt=9x16|1x1|16x9). 9x16 = stil 2 sabitleri, birebir =====
  const FMTS = window.FORMATS || {};
  const FMT = new URLSearchParams(location.search).get('fmt') || '9x16';
  const F = Object.assign({ id: FMT }, FMTS[FMT] || FMTS['9x16'] || { W: 1080, H: 1920 });
  const W = F.W, H = F.H;

  // ===== zaman yardımcıları =====
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    outExpo: u => u >= 1 ? 1 : 1 - Math.pow(2, -10 * u),
    outQuint: u => 1 - Math.pow(1 - u, 5),
    outCubic: u => 1 - Math.pow(1 - u, 3),
    inCubic: u => u * u * u,
    inExpo: u => u <= 0 ? 0 : Math.pow(2, 10 * u - 10),
    inOutQuart: u => u < .5 ? 8 * u ** 4 : 1 - Math.pow(-2 * u + 2, 4) / 2,
    inOutCubic: u => u < .5 ? 4 * u ** 3 : 1 - Math.pow(-2 * u + 2, 3) / 2,
  };
  // sönümlü yay 0 -> 1, simülasyonsuz (zeta 1: sekmez, .7 premium, .5 oyuncu; f: Hz)
  function spring(t, zeta = .7, f = 2) {
    if (t <= 0) return 0;
    const w = 2 * Math.PI * f;
    if (zeta >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
    const wd = w * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + (zeta * w / wd) * Math.sin(wd * t));
  }
  // tohumlu, sönen sarsıntı -> [dx, dy]
  function shake(t, t0, dur, amp, seed = 1) {
    const p = prog(t, t0, t0 + dur);
    if (p <= 0 || p >= 1) return [0, 0];
    const a = amp * (1 - p) * (1 - p), x = (t - t0) * 60;
    return [a * Math.sin(x * 2.1 + seed) * Math.cos(x * .7), a * Math.sin(x * 1.7 + seed * 2.3)];
  }
  const css = (el, o) => { for (const k in o) el.style[k] = o[k]; };
  const vis = (el, on) => el.classList.toggle('hide', !on);
  const T = (x = 0, y = 0, s = 1, r = 0) => `translate(${x}px,${y}px) scale(${s}) rotate(${r}deg)`;
  const up = s => s.toLocaleUpperCase('tr-TR');
  // güvenli alan (9x16: Instagram Reels üst bar, alt açıklama, sağ buton sütunu = no[0])
  const SF = F.safe || { x0: 70, x1: 1010, y0: 250, y1: 1500, no: [{ x0: 930, y0: 1000, x1: 1080, y1: 1720 }] };
  const no0 = (SF.no || [])[0];
  const SAFE = { x0: SF.x0, x1: SF.x1, y0: SF.y0, y1: SF.y1, railX: no0 ? no0.x0 : Infinity, railY0: no0 ? no0.y0 : 0, railY1: no0 ? no0.y1 : 0, no: SF.no || [] };
  // bölgeler: M.R['gfx.card'] = {x,y,w,h}; M.place(bölge,{w,h,ax,ay}); M.fit(tasarım[x,y,w,h], bölge) -> {x,y,s}
  const box = a => Array.isArray(a) ? { x: a[0], y: a[1], w: a[2], h: a[3] } : a;
  const R_ = {}; for (const [k, v] of Object.entries(F.regions || {})) R_[k] = box(v);
  const place = (r, { w, h, ax = .5, ay = .5, dx = 0, dy = 0 }) => { r = box(r); return { x: r.x + (r.w - w) * ax + dx, y: r.y + (r.h - h) * ay + dy, w, h }; };
  const fit = (d, r, { ax = .5, ay = .5, max = 1 } = {}) => { d = box(d); r = box(r);
    const s = Math.min(r.w / d.w, r.h / d.h, max); return { x: r.x + (r.w - d.w * s) * ax - d.x * s, y: r.y + (r.h - d.h * s) * ay - d.y * s, s }; };
  F.pick = map => map[F.id] ?? map.default;
  F.R = R_;
  window.M = { FPS, W, H, clamp, lerp, prog, E, spring, shake, css, vis, T, up, SAFE, F, R: R_, place, fit, box };

  const TL = window.TIMELINE, B = window.BRAND || {};
  const C = TL.cues || {};
  window.C = C;
  window.word = i => TL.words.find(w => w.i === i);
  const VIDEO_END = TL.frames / FPS, TOTAL = TL.total || TL.duration;   // kare sayısından: yuvarlama hatası yok

  let V = null;
  // defineVideo({...}) veya defineVideo(F => ({...})): fonksiyon biçimi formatlara göre yerleşim seçer
  window.defineVideo = cfg => { V = typeof cfg === 'function' ? cfg(F) : cfg; M.STYLE = V.style || 1;
    if (M.STYLE !== 2 && F.id !== '9x16') throw new Error('stil 1 yalnızca 9x16'); };
  const st2 = () => V.style === 2;
  // altyazı modu: 'vurgulu' (varsayılan) | 'sade' (beyaz, vurgusuz, pop yok) | 'yok'; video.js > plan.json
  const capMode = () => V.captions || TL.captions || 'vurgulu';   // stil 2: kafa-güvenli kadraj, sade altyazı, güvenli alan (stil 1 = eski varsayılan)
  const TRACK = window.FACE_TRACK && window.FACE_TRACK.cx ? window.FACE_TRACK : null;

  // ===== yüz yerleşimi =====
  // V.layout: [{t, mode: 'full'|'card'|'hidden', zoom}] — geçişler moda göre otomatik:
  //   full->hidden: çapraz lacivert silme + dalış   hidden->full: silme geri açılır
  //   hidden->card: kart alttan yükselir            full<->card: kart küçülür / genişler
  //   card->hidden: kart aşağı düşer
  // kaynak görüntü oranı (dikey 1440x2560 varsayılan) ve formatın 'full' dikdörtgeni (dikey kaynak 16x9'da şerit)
  const SRC = TL.src || { w: 1440, h: 2560, orient: 'v' };
  const gcd = (a, b) => b ? gcd(b, a % b) : a, G_ = gcd(SRC.w, SRC.h), SW = SRC.w / G_, SH = SRC.h / G_;
  const fullSpec = (F.full || {})[SRC.orient] || 'stage';
  const FULL = fullSpec === 'stage' ? { x: 0, y: 0, w: W, h: H, r: 0 } : Object.assign({}, fullSpec);
  const PILLAR = fullSpec !== 'stage';
  const CARD = { x: 40, y: 800, w: 1000, h: 1200, r: 52, ay: 300 };
  const CARD2 = F.card ? Object.assign({}, F.card) : { x: 120, y: 780, w: 840, h: 1140, r: 44, ay: 300 };   // stil 2: kafa tam görünür
  // V.cardR (isteğe bağlı, stil 2): kartın köşe yarıçapı (vars. format profili, 9x16: 44)
  // V.card (isteğe bağlı, stil 2): kart dikdörtgeninin alanlarını değiştirir ({x, y, w, h, r, corners}). Çok yakın selfie'de dar kart yüzü
  //   küçültür (yüz ölçeği = kart genişliği), ağız altyazının üstünde kalır. h, görüntünün saçtan aşağı kapladığı yükseklikten büyük olmasın
  //   (yoksa frameShift kadrajı aşağı iter): h <= headroomCard + (1 - saç) * w * 16/9. Verilmezse format profili (regresyon).
  const cardRect = () => st2() ? (V.card || V.cardR != null ? Object.assign({}, CARD2, V.card || {}, V.cardR != null ? { r: V.cardR } : {}) : CARD2) : CARD;
  const FX = (TL.face && TL.face.fx) ?? .5, FY = (TL.face && TL.face.fy) ?? .52;
  if (FULL.ay == null) FULL.ay = FY * FULL.h;

  function kfAt(t) {
    const L = V.layout || [{ t: 0, mode: 'full' }];
    let k = 0;
    for (let i = 0; i < L.length; i++) if (t >= L[i].t) k = i;
    const cur = L[k], prev = k > 0 ? L[k - 1] : null;
    // V.transScale (isteğe bağlı, vars. 1): mod geçişleri (küçülme/genişleme, yükseliş, düşüş, silme, dalış) bu kat yavaşlar (ör. 1.3; 45+ kitle)
    return { cur, prev, p: prev ? prev.mode : null, c: cur.mode, dt: (t - cur.t) / (V.transScale ?? 1), k };
  }
  // V.natural (isteğe bağlı; true ya da {d, fade, out, dy}): "doğal geçiş" (onaylı tercih). Mod geçişleri yaysız:
  //   full<->card: kart inOutCubic ile d sürede küçülür/genişler (zıplama yok)
  //   full<->hidden: lacivert zemin çapraz geçişle (opaklık, fade sürede) belirir/söner; dalış zoom'u ve çapraz silme yok;
  //                  hidden->full'de zeminin üstündeki (under) sahneler zeminle birlikte söner
  //   hidden->card: kart yerinde belirir (opaklık + dy px kayma, fade sürede; alttan yükselme yok)
  //   card->hidden: kart yerinde söner (opaklık + dy px aşağı, out sürede; aşağı düşme yok); altyazı gizlenmez
  // Süreler V.transScale ile ölçeklenir. Verilmezse motor birebir eski davranışta (mevcut varsayılanlar korunur).
  let NATC;
  const nat = () => NATC !== undefined ? NATC
    : (NATC = V.natural ? Object.assign({ d: .6, fade: .5, out: .4, dy: 30 }, V.natural === true ? {} : V.natural) : null);
  const defZoom = m => m === 'card' && !st2() ? 1.25 : 1;
  // V.slowPush (isteğe bağlı; sayı = hız/sn ya da {rate, max}): varsayılan testere itmenin (6 s'de bir %3.6 geri sıçrar) yerine
  // her tam ekran bölümünde baştan başlayan, sıçramasız yavaş yakınlaşma: max * (1 - e^(-rate*dt/max)) (başta 'rate' hızında, max'a yumuşakça yaklaşır).
  // Tam ekrandan karta/gizliye geçerken birikmiş itme geçiş boyunca (.8 s x transScale) yumuşakça sıfırlanır. Kart/gizli bölümlerde itme yok.
  function pushAt(t) {
    const sp = typeof V.slowPush === 'number' ? { rate: V.slowPush } : V.slowPush, rate = sp.rate ?? .004, max = sp.max ?? .06;
    const Ls = V.layout || [{ t: 0, mode: 'full' }], { k } = kfAt(t), ts = V.transScale ?? 1;
    // sp.span (isteğe bağlı): art arda gelen tam ekran anahtarları (ör. V.layout[].fx kadraj kaydırması) tek bölüm sayılır, itme sıfırlanmaz
    const st0 = i => { if (sp.span) while (i > 0 && Ls[i].mode === 'full' && Ls[i - 1].mode === 'full') i--; return Ls[i].t; };
    const seg = (i, tt) => Ls[i].mode === 'full' ? max * (1 - Math.exp(-rate * Math.max(0, tt - st0(i)) / max)) : 0;
    if (Ls[k].mode !== 'full' && k > 0 && Ls[k - 1].mode === 'full')
      return seg(k - 1, Ls[k].t) * (1 - E.inOutCubic(prog(t, Ls[k].t, Ls[k].t + .8 * ts)));
    return seg(k, t);
  }
  function cardness(t) {
    const { p, c, dt } = kfAt(t), N = nat();
    if (N) {                                                                  // V.natural: yaysız (ease), kart yerinde belirir/söner
      if (c === 'card') return p === 'full' ? E.inOutCubic(prog(dt, 0, N.d)) : 1;
      if (c === 'full') return p === 'card' ? 1 - E.inOutCubic(prog(dt, 0, N.d)) : 0;
      return c === 'hidden' && p === 'card' ? 1 : 0;
    }
    if (c === 'card') return p === 'hidden' ? clamp(spring(dt, .78, 1.7), 0, 1.04)
                              : p === 'full' ? clamp(spring(dt, .8, 1.8), 0, 1.04) : 1;
    if (c === 'full') return p === 'card' ? 1 - clamp(spring(dt, .9, 2.0), 0, 1) : 0;
    if (c === 'hidden' && p === 'card') return 1 - E.inCubic(prog(dt, 0, .3));
    return 0;
  }
  const firstCard = () => { const f = (V.layout || []).find(l => l.mode === 'card'); return f ? f.t : Infinity; };
  const firstNonFull = () => { const f = (V.layout || []).find(l => l.mode !== 'full'); return f ? f.t : Infinity; };

  // V.layout[].d (isteğe bağlı): o anahtara geçişte zoom ve fx yaysız inOutCubic d sürede değişir (ör. tam ekranda kadraj kaydırma);
  // verilmezse eski yay (spring .9 / 2) -> birebir aynı
  const layU = (cur, dt) => cur.d != null ? E.inOutCubic(prog(dt, 0, cur.d)) : clamp(spring(dt, .9, 2));
  // V.layout[].fx (isteğe bağlı, yatay kaynak 16x9): tam ekranda yüz merkezinin ekrandaki yatay yeri (0..1, vars. .5 = ortada).
  // Ör. {mode:'full', zoom: 1.2, fx: .36}: yüz sola kayar, sağda grafiklere geniş alan açılır (zoom ver ki kenar boş kalmasın;
  // kadraj kenarı yine clamp ile korunur). Gizliden çıkışta animasyonsuz; kartta yüz kart ortasında. Hiç fx yoksa kod yolu eski.
  let HASFX;
  const hasFx = () => HASFX ?? (HASFX = (V.layout || []).some(l => l.fx != null));
  function fxAt(t) {
    const { cur, prev, dt } = kfAt(t);
    let f1 = cur.fx ?? .5, f0 = prev ? (prev.fx ?? .5) : f1;
    if (cur.mode === 'hidden') f1 = f0;
    if (prev && prev.mode === 'hidden') f0 = f1;
    return lerp(f0, f1, layU(cur, dt));
  }

  function faceZoom(t) {
    const { cur, prev, dt } = kfAt(t);
    // gizli moddayken yüz görünmez: oradan çıkarken zoom animasyonu yok, girerken önceki zoom korunur
    let z1 = cur.zoom ?? defZoom(cur.mode), z0 = prev ? (prev.zoom ?? defZoom(prev.mode)) : z1;
    if (cur.mode === 'hidden') z1 = z0;
    if (prev && prev.mode === 'hidden') z0 = z1;
    let z = lerp(z0, z1, layU(cur, dt));
    // V.jumpSkip (isteğe bağlı): bu kesimlerde jump zoom değişmez (iki taraf aynı kadraj; ör. yumuşak geçişle örtülen kesim)
    // V.jumpEps (isteğe bağlı, ör. 1e-3): timeline kesim zamanlarını 4 haneye yukarı yuvarlar (3.2667 > 98/30); eps verilirse zoom kesim karesinde değişir
    // (vars. 0: bir kare geç, eski davranış)
    const jE = V.jumpEps ?? 0;
    let k = 0; for (const j of TL.jumps) if (t >= j - jE && !(V.jumpSkip && V.jumpSkip.some(q => Math.abs(q - j) < 1e-3))) k++;
    z *= 1 + (k % 2 ? .09 : 0);                                   // jump cut'ı saklayan zoom değişimi
    if (V.slowPush != null) z *= 1 + pushAt(t);                   // V.slowPush: tam ekranda sürekli, kesintisiz yavaş yakınlaşma
    else z *= 1 + .012 * ((t * .5) % 3);                          // canlı tutan yavaş itme
    if (V.introZoom !== false) z *= 1 + .18 * (1 - E.outExpo(prog(t, 0, .7)));
    for (const p of V.punches || [])                              // vurgu kelimesinde punch-in
      z *= 1 + p.amt * clamp(spring(t - p.t, p.z ?? .5, p.f ?? 3), 0, 2) *
        (st2() ? 1 - E.inOutCubic(prog(t, (p.until ?? Infinity) - .3, p.until ?? Infinity))   // stil 2: sıçramasız, yumuşak bitiş
               : (t < (p.until ?? Infinity) ? 1 : 0));
    for (const l of V.layout || [])                               // gizlenirken yüze dalış (V.natural: yok, çapraz geçiş)
      if (l.mode === 'hidden' && !nat()) {
        const pv = (V.layout || [])[(V.layout || []).indexOf(l) - 1];
        const ts = V.transScale ?? 1;
        if (pv && pv.mode === 'full' && t >= l.t - .05 * ts && t < l.t + .3 * ts) z *= 1 + .25 * E.inExpo(prog(t, l.t - .05 * ts, l.t + .22 * ts));
      }
    return z;
  }

  // ===== altyazı =====
  const CH = TL.chunks;
  let capBuilt = -1, capOvBuilt = -1;
  // V.capAt (isteğe bağlı): [{a, b, y, maxLines}] -> a..b arasında altyazı merkezi y'de, en fazla maxLines satır (ör. ekranın altı içerikle
  // dolu sahnede üst bant). Geçişi cümle aralarına koy (blok değişince yeni yerde belirir). Verilmezse davranış aynı.
  const capOvAt = t => (V.capAt || []).findIndex(o => t >= o.a && t < o.b);
  function buildCap(i, ov) {
    const cap = $('cap'); cap.innerHTML = '';
    const s2 = st2(), host = s2 ? document.createElement('span') : cap;
    if (s2) { host.className = 'bgl'; cap.appendChild(host); cap.classList.add('s2'); }
    CH[i].w.forEach(w => {
      const sp = document.createElement('span');
      sp.className = 'cw' + (w.st === 'red' && !s2 ? ' pill' : '');
      sp.textContent = w.st === 'brand' || s2 ? w.t : up(w.t);        // stil 2: konuşulduğu gibi (cümle düzeni)
      host.appendChild(sp); host.appendChild(document.createTextNode(' '));
    });
    // capFit: satırlar kutuya dizilir ki aktif kelimenin pop'u güvenli alanda kalsın (stil 2'de her zaman açık)
    const FC = F.cap || {}, CX = s2 ? (FC.cx ?? 540) : 540;
    const fitOn = V.capFit || s2, BOX = s2 ? (FC.box ?? 780) : V.capFit ? 880 : 940, LH = s2 ? 1.5 : 1.12;
    if (fitOn) css(cap, { left: (CX - BOX / 2) + 'px', right: (W - CX - BOX / 2) + 'px' });
    // V.capFs / V.capFsMin (isteğe bağlı, stil 2): iri altyazı (ör. 70 / 54; F.pick ile formata göre); verilmezse format profili
    let fs = s2 ? (V.capFs ?? FC.fs ?? 58) : 82; cap.style.fontSize = fs + 'px';   // en fazla 2 satır
    // V.capMaxLines (isteğe bağlı, vars. 2): en fazla satır; 1 -> uzun blok satıra kırılmaz, punto capFsMin'e kadar küçülür (ör. 1x1'de altyazı aşağıda)
    const fits = () => cap.scrollWidth <= BOX && cap.getBoundingClientRect().height <= fs * LH * ((ov && ov.maxLines) ?? V.capMaxLines ?? 2) + 8;
    while (!fits() && fs > (s2 ? (V.capFsMin ?? FC.fsMin ?? 42) : 50)) { fs -= 2; cap.style.fontSize = fs + 'px'; }
    if (fitOn) {                                               // kelime başına izinli en büyük pop ölçeği
      const sps = [...cap.querySelectorAll('.cw')], G = .3 * fs, x0 = CX - BOX / 2;
      sps.forEach((sp, n) => {
        const L = x0 + sp.offsetLeft, R = L + sp.offsetWidth, top = sp.offsetTop;
        const eL = sps[n - 1] && sps[n - 1].offsetTop === top ? G : L - SAFE.x0;
        const eR = sps[n + 1] && sps[n + 1].offsetTop === top ? G : SAFE.x1 - R;
        sp._smax = Math.min(s2 ? 1.08 : 1.2, 1 + 2 * Math.max(0, Math.min(eL, eR)) / sp.offsetWidth);
      });
    }
    capBuilt = i;
  }
  // card->hidden: kart altyazının altından geçip ekrandan çıkana kadar altyazı gizlenir (yüzün üstünden kaymaz)
  function capDropHidden(t) { const { p, c, dt } = kfAt(t);
    if (nat()) return false;                                              // V.natural: kart yerinde belirir/söner, altyazının altından geçmez
    if (st2() && c === 'card' && p === 'hidden' && dt < .3) return true;   // hidden->card: kart altyazının altından yükselirken yüzün üstünden kaymasın
    return c === 'hidden' && p === 'card' && dt < .34; }
  const CAPC = Object.assign({ hl: '#FFD23F', active: '#FFD23F', red: '#E5383B', brand: '#7CC8FF' }, (B.caption || {}));
  const CAPC2 = { hl: '#FFD23F', active: '#FFD23F', red: '#FF7A7A', brand: '#8FD0FF' };   // stil 2: kutu yok, renkli metin
  function renderCap(t) {
    const cap = $('cap');
    let i = -1;
    for (let k = 0; k < CH.length; k++) if (t >= CH[k].s - .02 && t < CH[k].e) i = k;
    if (capMode() === 'yok' || t >= VIDEO_END || i < 0 || capDropHidden(t) || (V.hideCaptions || []).some(([a, b]) => t >= a && t < b)) { vis(cap, false); return; }
    vis(cap, true);
    const oi = capOvAt(t), ov = oi >= 0 ? V.capAt[oi] : null;
    if (capBuilt !== i || capOvBuilt !== oi) { capOvBuilt = oi; buildCap(i, ov); }
    const c = CH[i];
    const sade = st2() && capMode() === 'sade';
    const k = sade ? spring(t - (c.s - .02), .8, 2.6) : spring(t - (c.s - .02), .55, 3.2);   // sade: sakin giriş
    const cy = V.capY || {};
    const yFull = (kfAt(t).c === 'hidden' && cy.hidden != null) ? cy.hidden : (cy.full ?? (F.cap ? F.cap.y : 1395));   // capY.hidden: animasyon sahnesinde ayrı konum
    let y = st2() ? lerp(yFull, cy.card ?? (F.cap ? F.cap.yCard : 1395), clamp(cardness(t), 0, 1))
                  : lerp(cy.full ?? 1430, cy.card ?? 1515, clamp(cardness(t), 0, 1));
    if (ov && ov.y != null) y = ov.y;
    const h = cap.getBoundingClientRect().height / (cap._s || 1);
    cap._s = sade ? lerp(.97, 1, k) : st2() ? lerp(.92, 1, k) : lerp(.82, 1, k);
    css(cap, { transform: `translate(0px,${y - h / 2 + (1 - k) * (sade ? 12 : 26)}px) scale(${cap._s})`, opacity: clamp(k * 2.5) });
    [...cap.querySelectorAll('.cw')].forEach((sp, n) => {
      const w = c.w[n], spoken = t >= w.s - .03, nxt = c.w[n + 1], active = spoken && (!nxt || t < nxt.s - .03);
      const pk = spring(t - (w.s - .03), .45, 4);
      let color = '#fff', bg = 'transparent', sc = 1, rot = 0;
      // sade: vurgu/renk/pop yok. V.capColors (isteğe bağlı, ör. {hl: '#D8B46A'}): o stildeki kelimeler bloğun başından itibaren
      // sabit renkte (okunurken renk/ölçek değişmez); verilmezse hepsi beyaz
      if (sade) { sp.style.color = (V.capColors && V.capColors[w.st]) || '#fff'; sp.style.transform = 'scale(1)'; return; }
      if (st2()) {                                                    // stil 2: sade, renk + hafif pop
        if (w.st === 'brand') color = CAPC2.brand;
        if (spoken && w.st === 'hl') color = CAPC2.hl;
        if (spoken && w.st === 'red') color = CAPC2.red;
        if (active) { sc = 1 + .08 * (1 - clamp(pk, 0, 1.3)); if (w.st === '') color = CAPC2.active; }
        sc = 1 + (sc - 1) * clamp((sp._smax - 1) / .08);
        sp.style.color = color; sp.style.transform = `scale(${Math.max(1, sc)})`;
        return;
      }
      if (w.st === 'brand') color = CAPC.brand;
      if (spoken) {
        if (w.st === 'hl') color = CAPC.hl;
        if (w.st === 'red') { bg = CAPC.red; rot = -2; }
        if (active) { sc = 1.06 + .14 * (1 - clamp(pk, 0, 1.3)); if (w.st === '' || w.st === 'brand') color = w.st === 'brand' ? CAPC.brand : CAPC.active; }
      }
      if (V.capFit && sc > 1) sc = 1 + (sc - 1) * clamp((sp._smax - 1) / .2);
      sp.style.color = color; sp.style.background = bg;
      sp.style.transform = `scale(${sc}) rotate(${rot}deg)`;
    });
  }

  // ===== DOM kurulumu =====
  const $ = id => document.getElementById(id);
  let scenes = [];
  function build() {
    const st = document.createElement('div'); st.id = 'stage';
    st.innerHTML = '<div id="bg"></div><div id="faceWrap"><img id="face" alt=""></div><div id="cap"></div><div id="flash"></div>';
    document.body.appendChild(st);
    if (PILLAR && F.backdrop) {
      const bd = document.createElement('div'); bd.id = 'backdrop'; bd.innerHTML = '<img alt="">';
      st.insertBefore(bd, $('faceWrap'));
    }
    // V.matte (isteğe bağlı): stüdyo zemini (odanın altında) + kişi katmanı (maskeli kesit; 'arkasında' sahnelerin üstünde)
    if (V.matte) {
      const sd = document.createElement('div'); sd.id = 'studio';
      if (V.matte.studio) sd.style.background = V.matte.studio;
      st.insertBefore(sd, $('faceWrap'));
      const pw = document.createElement('div'); pw.id = 'personWrap';
      pw.innerHTML = '<div id="personFeather"><img id="person" alt=""></div>';
      st.insertBefore(pw, $('faceWrap').nextSibling);
      const fd = document.createElement('div'); fd.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
      // V.matte.choke (0..1, isteğe bağlı): maske kenarını içeri çeker (alfa < choke -> 0); saç çevresindeki açık oda halesini keser
      const ck = V.matte.choke ? Math.min(.9, V.matte.choke) : 0;
      fd.innerHTML = '<svg width="0" height="0"><filter id="pmBlur" x="-60%" y="-30%" width="220%" height="160%" color-interpolation-filters="sRGB">' +
        '<feGaussianBlur id="pmBlurG" stdDeviation="0 0"/></filter>' +
        (ck ? `<filter id="pmChoke" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="linear" slope="${(1 / (1 - ck)).toFixed(4)}" intercept="${(-ck / (1 - ck)).toFixed(4)}"/></feComponentTransfer></filter>` : '') + '</svg>';
      st.appendChild(fd);
      if (ck) $('personFeather').style.filter = 'url(#pmChoke)';
      if (V.faceFilter) $('person').style.filter = V.faceFilter;
    }
    // V.faceFilter (isteğe bağlı): yüz görüntüsüne CSS filtresi (ör. sinematik renk: 'contrast(1.08) saturate(.86) sepia(.08)')
    if (V.faceFilter) $('face').style.filter = V.faceFilter;
    // V.vignette (isteğe bağlı; sayı = kenar koyuluğu ya da {edge, top, topH, bottom, bottomH}): yüz çerçevesinin içinde hafif vinyet;
    // top/bottom: üst/alt koyu geçiş (üst yazıların okunması için), yalnızca tam ekranda (kartta söner). Denetime girmez (sahne değil).
    if (V.vignette) {
      const vg = typeof V.vignette === 'number' ? { edge: V.vignette } : V.vignette, ink = vg.ink || '5,8,14';
      const mk = (id, bgi) => { const d = document.createElement('div'); d.id = id;
        css(d, { position: 'absolute', inset: '0', pointerEvents: 'none', backgroundImage: bgi }); $('faceWrap').appendChild(d); };
      if (vg.edge) mk('vig', `radial-gradient(125% 85% at 50% 44%, rgba(${ink},0) 52%, rgba(${ink},${vg.edge}) 100%)`);
      const g = [];
      if (vg.top) { const h = (vg.topH ?? .32) * 100; g.push(`linear-gradient(180deg, rgba(${ink},${vg.top}) 0%, rgba(${ink},${(vg.top * .5).toFixed(3)}) ${(h * .45).toFixed(1)}%, rgba(${ink},0) ${h.toFixed(1)}%)`); }
      if (vg.bottom) { const h = (vg.bottomH ?? .3) * 100; g.push(`linear-gradient(0deg, rgba(${ink},${vg.bottom}) 0%, rgba(${ink},${(vg.bottom * .5).toFixed(3)}) ${(h * .45).toFixed(1)}%, rgba(${ink},0) ${h.toFixed(1)}%)`); }
      if (g.length) mk('vigFull', g.join(','));
    }
    const root = document.documentElement.style;
    if (F.id !== '9x16') { root.setProperty('--W', W + 'px'); root.setProperty('--H', H + 'px'); }
    for (const [k, v] of Object.entries(B.colors || {})) root.setProperty('--' + k, v);
    scenes = (V.scenes || []).flat().map((s, i) => {
      const el = document.createElement('div');
      el.className = 'scene ' + (s.cls || ''); el.id = s.id || 'scene' + i;
      el.innerHTML = s.html || '';
      el.style.zIndex = s.z ?? (s.under ? 4 : 6);
      st.insertBefore(el, $('cap'));
      s.el = el; s.q = sel => el.querySelector(sel); s.qa = sel => [...el.querySelectorAll(sel)];
      if (s.init) s.init(s);
      return s;
    });
  }

  const faceImg = () => $('face');
  let lastSrc = '', lastMatteN = -1, matteImg = null;
  // V.matte.hold = {t, frame} (isteğe bağlı): t'den sonra kaynak karesi 'frame' (1 tabanlı) gösterilir (yüz, kesit ve kadraj takibi);
  // döngü kapanışında son kare = ilk kare (frame: 1). hold: true -> yalnızca son kare kalır.
  const holdN = t => { const h = V && V.matte && V.matte.hold;
    return h && typeof h === 'object' && h.frame != null && t >= (h.t ?? VIDEO_END) ? clamp(h.frame - 1, 0, TL.frames - 1) : null; };
  const srcN = t => holdN(t) ?? clamp(Math.floor(t * FPS + 1e-6), 0, TL.frames - 1);
  async function setFace(t) {
    const n = (V.matte ? srcN(t) : clamp(Math.floor(t * FPS + 1e-6), 0, TL.frames - 1)) + 1;
    const src = window.FACE_STILL || `${window.FACE_DIR}${String(n).padStart(4, '0')}.jpg`;   // FACE_STILL: saf animasyonda sabit taban kare
    if (src !== lastSrc) {
      faceImg().src = src; lastSrc = src;
      const bd = $('backdrop');                                             // şerit formatında bulanık dolgu da aynı kare
      if (bd) { bd.firstChild.src = src; await bd.firstChild.decode().catch(() => {}); }
      await faceImg().decode().catch(() => {});
    }
    if (V.matte && n !== lastMatteN) {                                      // kişi katmanı: aynı kare + aynı numaralı maske
      const pi = $('person'), ms = `${V.matte.dir || 'work/matte/'}${String(n).padStart(4, '0')}.png`;
      pi.src = src; await pi.decode().catch(() => {});
      matteImg = new Image(); matteImg.src = ms; await matteImg.decode().catch(() => {});   // önce bellekte çözülür, sonra CSS maskesi
      pi.style.maskImage = `url("${ms}")`; lastMatteN = n;
    }
  }

  // V.focus (isteğe bağlı, v18; ders / ekran kaydı): [{t, z, cx, cy, d}] taban görüntüde bölgeye yakınlaşma. t anından itibaren d s (vars. .7)
  // inOutCubic ile z kata ve (cx, cy) kaynak oranındaki noktaya geçer; ilk anahtardan önce z 1, merkez. Verilirse yüz kadrajı, jump/slowPush/
  // punch zoom'u yok sayılır (ekran kaydında yüz yok). Kenar kırpılır: nokta kenara yakınsa görüntü kenarı ekran kenarında kalır.
  function focusAt(t) {
    const K = V.focus; let i = -1;
    for (let k = 0; k < K.length; k++) if (K[k].t <= t) i = k;
    const P0 = { z: 1, cx: .5, cy: .5 };
    if (i < 0) return P0;
    const c = K[i], p = i > 0 ? K[i - 1] : P0;
    const u = E.inOutCubic(prog(t, c.t, c.t + (c.d ?? .7)));
    return { z: lerp(p.z ?? 1, c.z ?? 1, u), cx: lerp(p.cx ?? .5, c.cx ?? .5, u), cy: lerp(p.cy ?? .5, c.cy ?? .5, u) };
  }
  // ===== kadraj geometrisi: saf t fonksiyonu (renderAt ve M.face ortak kullanır) =====
  const isCut = n => (TL.cutaways || []).some(([a, b]) => n >= a && n < b);     // karışık: ara görüntü karesi
  const MONT = ['montage', 'anim'].includes((TL.base || {}).kind);   // anim: saf animasyon (yüz yok)
  const gcache = new Map();
  function geom(t) {
    if (gcache.has(t)) return gcache.get(t);
    const { p, c, dt } = kfAt(t);
    const u = cardness(t), uc = clamp(u, 0, 1), CD = cardRect();
    const R = {}; for (const k of ['x', 'y', 'w', 'h', 'r', 'ay']) R[k] = lerp(FULL[k], CD[k], u);
    const N = nat();
    let fo = 1;                                                             // V.natural: yüz katmanının opaklığı (kart yerinde belirir/söner)
    if (N) {
      if (c === 'card' && p === 'hidden') { const k = E.outCubic(prog(dt, 0, N.fade)); Object.assign(R, CD); R.y = CD.y + N.dy * (1 - k); fo = k; }
      if (c === 'hidden' && p === 'card') { const k = E.inOutCubic(prog(dt, 0, N.out)); Object.assign(R, CD); R.y = CD.y + N.dy * k; fo = 1 - k; }
    } else {
      if (c === 'card' && p === 'hidden' && dt < 1.2) {                     // alttan yükseliş
        Object.assign(R, CD); R.y = lerp(F.rise ?? 1960, CD.y, spring(dt, .72, 1.6));
      }
      if (c === 'hidden' && p === 'card') { Object.assign(R, CD); R.y = lerp(CD.y, F.rise ?? 1960, E.inCubic(prog(dt, 0, .35))); }
    }
    const hiddenNow = c === 'hidden' && (p === 'full' ? dt > (N ? N.fade : .25) : p === 'card' ? dt > (N ? N.out : .35) : true);
    const z = faceZoom(t);
    let iw = R.w * z, ih = iw * SH / SW;
    let ix = R.w / 2 - FX * iw, iy = R.ay - FY * ih;
    const n = V.matte ? srcN(t) : clamp(Math.floor(t * FPS + 1e-6), 0, TL.frames - 1);
    const plain = MONT || isCut(n);                                         // stok klip: yüz yok, ortalanmış kaplama
    if (st2() && plain) {
      ih = Math.max(ih, R.h); iw = ih * SW / SH;
      if (iw < R.w) { iw = R.w; ih = iw * SH / SW; }
      ix = (R.w - iw) / 2; iy = (R.h - ih) / 2;
    } else if (st2()) {
      // kafa-güvenli kadraj: yüz takibine göre; saç üstü asla kesilmez, gerekirse yakınlaşma yerine yer açılır
      const fcx = TRACK ? TRACK.cx[n] : FX, fcy = TRACK ? (TRACK.y0[n] + TRACK.y1[n]) / 2 : FY;
      const top = TRACK ? TRACK.top[n] : FY - .22;
      const mTop = lerp(V.headroomFull ?? 40, V.headroomCard ?? 46, uc);   // saç üstü ile kenar arası boşluk (px)
      ih = Math.max(ih, R.h); iw = ih * SW / SH;
      if (iw < R.w) { iw = R.w; ih = iw * SH / SW; }
      iy = lerp(fcy * (R.h - ih), mTop - top * ih, uc);                    // tam ekranda yüz yerinde, kartta saç üstü kenarda
      if (iy + top * ih < mTop) iy = mTop - top * ih;                       // saç kesilecekse kadrajı aşağı kaydır
      if (iy > 0) iy = 0;
      if (iy + ih < R.h) {
        // V.frameShift (isteğe bağlı): altta boşluk varsa ve saç yine mTop'ta kalıyorsa önce kadrajı yukarı
        // kaydır; yoksa kart<->tam ekran geçişinde bu dal birkaç kare açılıp kapanır, yüz ~%35 büyüyüp geri sıçrar.
        // Varsayılan kapalı: eski projelerin kart kadrajı bu yakınlaşmaya dayanır.
        if (V.frameShift && R.h - (1 - top) * ih >= mTop) iy = R.h - ih;
        else { ih = (R.h - mTop) / (1 - top); iw = ih * SW / SH; iy = Math.min(0, mTop - top * ih); }
      }
      ix = (hasFx() ? lerp(fxAt(t) * R.w, R.w / 2, uc) : R.w / 2) - fcx * iw;   // V.layout[].fx: tam ekranda yüzün yatay yeri
    }
    if (V.focus) {                                                          // v18 (ders/ekran kaydı): bölgeye yakınlaşma; yoksa kod yolu aynı
      const f = focusAt(t);
      iw = R.w * f.z; ih = iw * SH / SW;
      if (ih < R.h) { ih = R.h; iw = ih * SW / SH; }
      ix = R.w / 2 - f.cx * iw; iy = R.h / 2 - f.cy * ih;
    }
    ix = clamp(ix, R.w - iw, 0); iy = clamp(iy, R.h - ih, 0);
    let sx = 0, sy = 0;
    for (const s of V.shakes || []) if (s.target === 'face') { const [a, b] = shake(t, s.t, s.d, s.amp, s.seed ?? 3); sx += a; sy += b; }
    const reveal = c === 'full' && p === 'hidden' && dt < (N ? N.fade + .02 : .4);
    // kart aşağı düşerken (card->hidden) yüz zeminin ve gizli sahnenin üstünde kalır, yoksa düşüş görünmez
    const under = (c === 'hidden' && p !== 'card') || reveal || t < firstCard();
    const g = { p, c, dt, u, uc, CD, R, hiddenNow, iw, ih, ix, iy, sx, sy, reveal, under, n, plain, fo };
    if (gcache.size > 64) gcache.clear();
    gcache.set(t, g);
    return g;
  }

  // ===== yüzün ekrandaki konumu (mikro animasyon yerleşimi için) =====
  // M.face(t) -> {ok, clip, face:{x0,y0,x1,y1,cx,cy}, head:{x0,y0,x1,y1}, scale}; ok=false: yüz yok/gizli/ara görüntü/montaj
  function face(t) {
    const g = geom(t);
    if (!TRACK || g.hiddenNow || g.plain || t >= VIDEO_END) return { ok: false, mode: g.c, u: g.u };
    const n = g.n, fw = TRACK.x1 ? TRACK.x1[n] - TRACK.x0[n] : (TRACK.y1[n] - TRACK.y0[n]) * .78 * SH / SW;
    const fx0 = TRACK.x0 ? TRACK.x0[n] : TRACK.cx[n] - fw / 2, fx1 = fx0 + fw, fh = TRACK.y1[n] - TRACK.y0[n];
    const ox = g.R.x + g.sx + g.ix, oy = g.R.y + g.sy + g.iy;
    const X = v => ox + v * g.iw, Y = v => oy + v * g.ih;
    const clip = { x0: g.R.x + g.sx, y0: g.R.y + g.sy, x1: g.R.x + g.sx + g.R.w, y1: g.R.y + g.sy + g.R.h };
    const cl = b => ({ x0: Math.max(b.x0, clip.x0), y0: Math.max(b.y0, clip.y0), x1: Math.min(b.x1, clip.x1), y1: Math.min(b.y1, clip.y1) });
    const fb = cl({ x0: X(fx0), y0: Y(TRACK.y0[n]), x1: X(fx1), y1: Y(TRACK.y1[n]) });
    const head = cl({ x0: X(fx0 - .25 * fw), y0: Y(TRACK.top[n]), x1: X(fx1 + .25 * fw), y1: Y(TRACK.y1[n] + .15 * fh) });
    // avoid: mikro elemanların giremeyeceği kutu (yüz + %8 yan pay, üstte saç, altta sakal)
    const avoid = cl({ x0: X(fx0 - .08 * fw), y0: Y(TRACK.top[n]), x1: X(fx1 + .08 * fw), y1: Y(TRACK.y1[n] + .1 * fh) });
    return { ok: true, mode: g.c, u: g.u, clip, face: { ...fb, cx: (fb.x0 + fb.x1) / 2, cy: (fb.y0 + fb.y1) / 2 }, head, avoid, scale: g.iw };
  }
  // [a,b] boyunca kafanın kapladığı birleşik kutu (punch-in, sarsıntı, kesim zoom'u dahil)
  function headSpan(a, b) {
    let u = null;
    for (let t = a; t <= b + 1e-6; t += 1 / FPS) {
      const f = face(t); if (!f.ok) continue;
      const h = f.avoid;
      u = u ? { x0: Math.min(u.x0, h.x0), y0: Math.min(u.y0, h.y0), x1: Math.max(u.x1, h.x1), y1: Math.max(u.y1, h.y1) } : { ...h };
    }
    return u;
  }
  // mikro eleman için boş yer: güvenli alan içinde, kafa/altyazı/yasak kutu ve aynı anda görünen diğer mikrolarla çakışmadan
  const ledger = [];
  const hit = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  function slot({ a, b, w, h, prefer, gap = 28, at }) {
    const hs = headSpan(a, b), capR = R_.cap ? { x0: R_.cap.x, y0: R_.cap.y, x1: R_.cap.x + R_.cap.w, y1: R_.cap.y + R_.cap.h } : null;
    const S = SAFE, cands = [];
    const cx = hs ? (hs.x0 + hs.x1) / 2 : W / 2, cy = hs ? (hs.y0 + hs.y1) / 2 : H / 2;
    for (const side of (prefer || (hs ? F.micro : ['above', 'below']) || ['below', 'above', 'right', 'left'])) {   // yüz yoksa önce üst bant
      if (!hs) {                                                            // yüz bilgisi yok (montaj/ara görüntü): orta alanı boş bırak
        if (side === 'above' || side === 'right' || side === 'left') cands.push(['above', W / 2 - w / 2, S.y0 + 30]);
        else cands.push(['below', W / 2 - w / 2, (capR ? capR.y0 : S.y1) - gap - h]);
        continue;
      }
      if (side === 'below') cands.push([side, cx - w / 2, hs.y1 + gap]);
      if (side === 'above') cands.push([side, cx - w / 2, hs.y0 - gap - h]);
      if (side === 'right') cands.push([side, hs.x1 + gap, cy - h / 2], [side, hs.x1 + gap, hs.y0]);
      if (side === 'left') cands.push([side, hs.x0 - gap - w, cy - h / 2], [side, hs.x0 - gap - w, hs.y0]);
    }
    if (at) cands.unshift(['at', at.x, at.y]);
    const W0 = w, H0 = h;
    for (const sc of [1, .85, .72, .65]) {                                  // sığmazsa küçülterek dene (en az %65)
      const w = W0 * sc, h = H0 * sc;
      for (let [side, x, y] of cands) {
        if (side === 'right') x = hs ? hs.x1 + gap : x;
        if (side === 'left') x = hs ? hs.x0 - gap - w : x;
        if (side === 'below' || side === 'above') x = cx - w / 2;
        if (side === 'above' && hs) y = hs.y0 - gap - h;
        if (side !== 'below' && side !== 'above' && side !== 'at') y = y + (H0 - h) / 2;
        x = clamp(x, S.x0, S.x1 - w); y = clamp(y, S.y0, S.y1 - h);       // güvenli alana it
        const px = .06 * w, py = .06 * h;                                  // pop esnemesi için pay
        x = clamp(x, S.x0 + px, S.x1 - w - px); y = clamp(y, S.y0 + py, S.y1 - h - py);
        const r = { x0: x - px, y0: y - py, x1: x + w + px, y1: y + h + py };
        if (r.x0 < S.x0 || r.x1 > S.x1 || r.y0 < S.y0 || r.y1 > S.y1) continue;
        if (S.no.some(z => hit(r, z))) continue;
        if (hs && hit(r, hs)) continue;
        if (capR && hit(r, capR)) continue;
        if (ledger.some(l => l.a < b && l.b > a && hit(l.r, r))) continue;
        ledger.push({ a, b, r });
        return { x, y, side, s: sc, ox: x - (W0 - w) / 2, oy: y - (H0 - h) / 2 };   // ox/oy: ölçeksiz kutunun sol-üstü
      }
    }
    console.error(`MİKRO YER YOK: ${w}x${h} @ ${a.toFixed(2)}-${b.toFixed(2)} s`);
    return null;
  }

  // ===== V.matte (isteğe bağlı): 'derinlik / stüdyo' — kişi katmanı =====
  // Yüz karesinin maskeyle (dir/NNNN.png, gri, beyaz = kişi) kesilmiş kopyası; yüzle AYNI geometri (geom: zoom, kadraj, punch, jump, sarsıntı).
  // Z-sırası: oda (#faceWrap, 1) altında stüdyo zemini (#studio) -> 'arkasında' sahneler (under / layer:'behind', z 4) -> kişi (z, vars. 5)
  //           -> önde sahneler (z 6) -> altyazı (8) -> flaş (10).
  // V.matte = { dir, z, studio (CSS background), hold (video bitince son kare oda + kişi olarak kalır: döngü kapanışı),
  //   room0 (vars. 1), room: [{t, v (1 oda, 0 stüdyo), d, ease}],
  //   origin: {x, y} (kesit dönüşüm merkezi, vars. alt orta), ref: {x, y} (ışık/hız referans noktası, kare koordinatı),
  //   start: {...durum}, moves: [{t, d, x, y, s, r, o, feather:{l,r,t,b} (px, kenar yumuşatma), ease ('spring' | E adı), zeta, f, blur (hareket bulanıklığı)}] }
  // Hareketler sıralı uygulanır: her biri o anki durumdan hedefe geçer (d 0 -> anında). Saf t fonksiyonu.
  const PS0 = { x: 0, y: 0, s: 1, r: 0, o: 1, fl: 0, fr: 0, ft: 0, fb: 0 };
  let MOVES = null;
  const mvU = (m, dt) => {                                   // yay (vars.; d 0 -> anında) ya da E eğrisi d sürede
    const ez = m.ease || 'spring';
    if (ez === 'spring') return m.d === 0 ? (dt >= 0 ? 1 : 0) : spring(dt, m.zeta ?? .78, m.f ?? 1.7);
    if (!(m.d > 0)) return dt >= 0 ? 1 : 0;
    return (E[ez] || E.inOutCubic)(prog(dt, 0, m.d));
  };
  function personAt(t) {
    if (!MOVES) MOVES = (V.matte.moves || []).map(m => Object.assign({}, m, m.feather ? { fl: m.feather.l, fr: m.feather.r, ft: m.feather.t, fb: m.feather.b } : {}))
      .sort((a, b) => a.t - b.t);
    let st = Object.assign({}, PS0, V.matte.start || {});
    for (const m of MOVES) {
      if (t < m.t) break;
      const u = mvU(m, t - m.t), nx = {};
      for (const k in st) {
        if (m[k] == null) { nx[k] = st[k]; continue; }
        // feather artarken önden (kare kenarı ekrana girmeden yumuşar), azalırken geriden (kenar ekrandan çıkana kadar yumuşak kalır)
        const c = clamp(u), fu = m[k] > st[k] ? 1 - Math.pow(1 - c, 4) : Math.pow(c, 4);
        nx[k] = lerp(st[k], m[k], k === 'o' ? c : k[0] === 'f' ? fu : u);
      }
      st = nx;
    }
    return st;
  }
  function roomAt(t) {
    let v = V.matte.room0 ?? 1;
    for (const k of V.matte.room || []) { if (t < k.t) break; v = lerp(v, k.v, (E[k.ease] || E.inOutCubic)(prog(t, k.t, k.t + (k.d ?? .35)))); }
    return clamp(v);
  }
  // kesit durumunda bir kare noktasının ekrandaki yeri (ışık ve hız için)
  const pPoint = (ps, p) => { const O = V.matte.origin || { x: W / 2, y: H }, a = ps.r * Math.PI / 180;
    const dx = (p.x - O.x) * ps.s, dy = (p.y - O.y) * ps.s;
    return { x: O.x + dx * Math.cos(a) - dy * Math.sin(a) + ps.x, y: O.y + dx * Math.sin(a) + dy * Math.cos(a) + ps.y }; };
  function renderMatte(t, g, fwOn) {
    const { R, iw, ih, ix, iy, sx, sy, hiddenNow } = g, MV = V.matte;
    // V.natural ile: kartın yerinde belirme/sönme opaklığı (g.fo) oda ile çarpılır (yoksa oda opaklığı onu ezer; natural yokken fo = 1 -> birebir eski)
    const rv = roomAt(t); $('faceWrap').style.opacity = (rv * (g.fo ?? 1)).toFixed(4);
    // V.matte.roomBlur (px, isteğe bağlı): oda sönerken / gelirken derinlik bulanıklığı (tam görünürken net)
    if (MV.roomBlur) $('face').style.filter = rv < .999 ? `${V.faceFilter ? V.faceFilter + ' ' : ''}blur(${(MV.roomBlur * (1 - rv)).toFixed(2)}px)` : (V.faceFilter || '');
    const ps = personAt(t), pw = $('personWrap'), on = fwOn && !hiddenNow && ps.o > .002;
    vis(pw, on);
    const ref = MV.ref || { x: W / 2, y: H * .4 }, lp = pPoint(ps, ref), sd = $('studio');
    sd.style.setProperty('--lx', lp.x.toFixed(1) + 'px'); sd.style.setProperty('--ly', lp.y.toFixed(1) + 'px');
    sd.style.setProperty('--ls', ps.s.toFixed(4));
    if (!on) return;
    const O = MV.origin || { x: W / 2, y: H };
    css(pw, { left: R.x + 'px', top: R.y + 'px', width: R.w + 'px', height: R.h + 'px', zIndex: MV.z ?? 5, opacity: clamp(ps.o * (g.fo ?? 1)).toFixed(4),
      transformOrigin: `${O.x - R.x}px ${O.y - R.y}px`,
      transform: `translate(${(sx + ps.x).toFixed(2)}px,${(sy + ps.y).toFixed(2)}px) rotate(${ps.r.toFixed(3)}deg) scale(${ps.s.toFixed(5)})` });
    css($('person'), { width: iw + 'px', height: ih + 'px', transform: `translate(${ix}px,${iy}px)` });
    const fh = ps.fl > .5 || ps.fr > .5, fv = ps.ft > .5 || ps.fb > .5;
    pw.style.maskImage = fh ? `linear-gradient(90deg, transparent 0px, #000 ${ps.fl.toFixed(1)}px, #000 calc(100% - ${ps.fr.toFixed(1)}px), transparent 100%)` : 'none';
    $('personFeather').style.maskImage = fv ? `linear-gradient(180deg, transparent 0px, #000 ${ps.ft.toFixed(1)}px, #000 calc(100% - ${ps.fb.toFixed(1)}px), transparent 100%)` : 'none';
    // hareket bulanıklığı: etkin hareket blur:true ise, referans noktasının kare başına hızıyla yönlü Gauss bulanıklığı
    const act = MOVES.find(m => m.blur && t >= m.t && t < m.t + (m.d || 1));
    let bx = 0, by = 0;
    if (act) {
      const p0 = pPoint(personAt(t - 1 / FPS), ref), k = (MV.blurK ?? .45) / Math.max(.2, ps.s);
      bx = Math.min(90, Math.abs(lp.x - p0.x) * k); by = Math.min(90, Math.abs(lp.y - p0.y) * k);
    }
    if (bx + by > .3) { $('pmBlurG').setAttribute('stdDeviation', `${bx.toFixed(2)} ${by.toFixed(2)}`); pw.style.filter = 'url(#pmBlur)'; }
    else pw.style.filter = 'none';
  }

  // V.cardRing (isteğe bağlı, {w, color}): kart çerçevesi (vars. 6 px beyaz halka; ör. editoryal ince altın çizgi {w: 2, color: '#C9A45C'})
  let RING = null;
  window.renderAt = async function (t) {
    RING = RING || V.cardRing || { w: 6, color: 'rgba(255,255,255,.95)' };
    await setFace(t);
    const { p, c, dt, cur } = kfAt(t);

    // --- yüz ---
    const { u, uc, CD, R, hiddenNow, iw, ih, ix, iy, sx, sy, reveal, under, fo } = geom(t);
    const fw = $('faceWrap');
    const fwOn = !hiddenNow && (t < VIDEO_END + .45 || !!(V.matte && V.matte.hold));   // V.matte.hold: son kare döngü kapanışında kalır
    vis(fw, fwOn);
    const allC = (u < .5 ? FULL : CD).corners === 'all';
    // V.matte.roomZ (isteğe bağlı, ör. 4; ornekler/ok-gecis-dalis): ilk karttan SONRA da tam ekranda (kart geçişi bitmiş, u = 0) oda bu z'de -> 'behind' sahneler
    // (z 4, DOM'da odadan sonra) odanın üstünde, kişinin (z 5) arkasında kalır. Kartta ve geçişlerde 5 (eski). Verilmezse birebir eski davranış.
    const roomZ = V.matte && V.matte.roomZ != null && c === 'full' && u <= 0 ? V.matte.roomZ : 5;
    css(fw, { left: R.x + 'px', top: R.y + 'px', width: R.w + 'px', height: R.h + 'px', borderRadius: allC ? `${R.r}px` : `${R.r}px ${R.r}px 0 0`,
      transform: `translate(${sx}px,${sy}px)`, zIndex: under ? 1 : roomZ,
      boxShadow: uc > .01 ? `0 -10px 60px rgba(0,0,0,${.5 * uc}), 0 0 0 ${RING.w * uc}px ${RING.color}` : 'none' });
    if (nat()) fw.style.opacity = fo.toFixed(4);                             // V.natural: kart yerinde belirir/söner
    css(faceImg(), { width: iw + 'px', height: ih + 'px', transform: `translate(${ix}px,${iy}px)` });
    const vf = $('vigFull'); if (vf) vf.style.opacity = (1 - uc).toFixed(3);   // V.vignette üst/alt geçişi: kartta söner
    if (V.matte) renderMatte(t, geom(t), fwOn);
    if (PILLAR && $('backdrop')) {                                          // dikey kaynak yatay formatta: bulanık yan dolgu
      const bd = $('backdrop'), bi = bd.firstChild;
      vis(bd, !hiddenNow && t < VIDEO_END + .45);
      const bw = W, bh = bw * SH / SW;
      // z tamsayı olmalı: DOM'da faceWrap'ten önce -> eşit z'de yüzün altında; z 4'te 'under' sahnelerin altında, zeminin (3) üstünde
      css(bd, { zIndex: under ? 1 : 4, opacity: kfAt(t).c === 'hidden' ? 0 : 1 - uc });
      css(bi, { width: bw + 'px', height: bh + 'px', transform: `translate(0px,${(H - bh) / 2}px)` });
    }

    // --- lacivert zemin: gizlenirken çapraz silme, açılırken geri silme ---
    const bg = $('bg');
    const bgOn = t >= firstNonFull() && t < VIDEO_END + .5;
    vis(bg, bgOn);
    let clip = 'none', nf = 1;                                              // nf: V.natural'da hidden->full sönüşü (under sahneler de)
    if (bgOn && nat()) {                                                    // V.natural: zemin çapraz geçişle belirir / söner (silme yok)
      const N = nat();
      let bo = 1;
      if (c === 'hidden' && p === 'full') bo = E.inOutCubic(prog(dt, 0, N.fade));
      else if (reveal) bo = nf = 1 - E.inOutCubic(prog(dt, 0, N.fade));
      else if (c === 'full' && p === 'full' && hasFx()) bo = 0;           // V.layout[].fx: art arda tam ekran anahtarları (kadraj kaydırma) -> zemin yok
      else if (c === 'full' && p === 'hidden') bo = 0;                    // geri açılış bitti: zemin görünmez (ilk karttan ÖNCE oda zeminin altında
                                                                          // (z 1) kalır, yoksa opak zemin yüzü örterdi; ilk karttan sonra fark yok)
      css(bg, { zIndex: 3, clipPath: 'none', opacity: bo.toFixed(4) });
    } else if (bgOn) {
      if (c === 'hidden' && p === 'full' && dt < .26) {
        const wp = E.inOutQuart(prog(dt, 0, .26));
        clip = `polygon(0 ${lerp(125, -25, wp)}%, 100% ${lerp(140, -10, wp)}%, 100% 100%, 0 100%)`;
      } else if (reveal) {
        const wp = E.inOutQuart(prog(dt, 0, .3));
        clip = `polygon(0 ${lerp(-25, 125, wp)}%, 100% ${lerp(-10, 140, wp)}%, 100% 100%, 0 100%)`;
      }
      css(bg, { zIndex: 3, clipPath: clip });
    }

    // --- sahneler ---
    for (const s of scenes) {
      const on = t >= (s.from ?? 0) && t < (s.to ?? Infinity);
      vis(s.el, on);
      if (on && s.render) s.render(t, s);
      // hidden->full: zeminle birlikte zeminin üstündeki (under) sahneler de silinir; yüzün üstünde hayalet kalmaz
      if (on && s.under) {
        if (nat()) s.el.style.filter = reveal && nf < 1 ? `opacity(${nf.toFixed(4)})` : '';   // V.natural: zeminle birlikte söner
        else s.el.style.clipPath = reveal ? clip : '';
      }
    }

    // --- altyazı ---
    $('cap').style.zIndex = 8;
    renderCap(t);

    // --- beyaz flaş (vuruşlarda 2-3 kare) ---
    let fl = V.introFlash === false ? 0 : (st2() ? .28 : .5) * (1 - prog(t, 0, .12));   // stil 2: ilk karede kanca okunsun
    for (const f of V.flashes || []) fl = Math.max(fl, f.a * (1 - prog(t, f.t, f.t + f.d)) * (t >= f.t ? 1 : 0));
    css($('flash'), { zIndex: 10, opacity: fl });
  };

  Object.assign(M, { face, headSpan, slot });
  window.TOTAL = TOTAL;
  window.__ready = (async () => {
    await new Promise(r => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', r) : r());
    if (!V) throw new Error('video.js defineVideo çağırmadı');
    build();
    for (const w of [600, 700, 800, 900]) await document.fonts.load(`${w} 40px Mont`);
    for (const f of V.fonts || []) await document.fonts.load(f);           // V.fonts (isteğe bağlı): ek yazı yüzleri, ör. ['300 40px Mont', '500 40px MontI']
    M.TOTAL_END = VIDEO_END;
    if (M._micro && M.resolveMicro) M.resolveMicro();                     // mikro yerleşimleri (fontlar yüklendikten sonra ölç)
    await Promise.all([...document.images].filter(i => i.src).map(i => i.decode().catch(() => {})));
    const q = new URLSearchParams(location.search);
    await window.renderAt(q.has('t') ? parseFloat(q.get('t')) : 0);
    return true;
  })();
})();
