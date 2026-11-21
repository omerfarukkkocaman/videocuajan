// Ders bileşenleri (v1): slayt anlatımı / ekran kaydı dersleri (yüzsüz, 16:9). Global: window.D.
// Yükleme: plan.json "libs": ["ders"]. engine.js ve library.js'e dokunmaz (mevcut varsayılanlar korunur).
// Parçalar L.scene({id, z, parts:[...]}) içine konur: {html, render(t, root)}; her kare t'den saf (Date/rastgele yok).
//
// KAYNAK KOORDİNATI: taban görüntünün (slayt / ekran kaydı) pikseli, TIMELINE.src ölçüsünde (ör. 1920x1080). Ölçüm: stills al,
//   kareyi aç, piksel oku. V.focus yakınlaşması hesaba katılır: D.pt / D.rect motorun o karede #face'e yazdığı geometriyi okur
//   (focusAt + kenar kırpması birebir); D.mark / D.blur / D.callout / D.hold yakınlaşmayla birlikte hareket eder.
//   EKRAN KOORDİNATI: notlar, terimler, çipler (D.note, D.term, D.topic, D.speed, D.steps) ekranda sabit durur.
// GÜVENLİ ALAN (16x9: x 96-1824, y 54-960): kart, çip, çerçeve, fosfor ve oklar içinde kalır. Tam ekran perde (D.veil,
//   D.mark spot), D.hold ve D.blur taban görüntünün parçasıdır (data-safe=ignore). Alt kenardaki (y > 960) slayt öğesini
//   çerçeveyle değil spot (soluklaştırma) ile vurgula.
// KATMAN: fosfor (D.mark kind 'hl') çarpma (multiply) ister -> kendi sahnesinde: D.layer({blend: 'multiply', parts}).
//   Önerilen z: D.hold 2 · fosfor 5 · çerçeve/spot 6 · not/terim/çip 7 · altyazı 8 (motor).
// HAREKET: sakin, öğretici; girişler yerinde süzülme (opaklık + kısa kayma, outCubic), çıkış inCubic; yay yalnız küçük rozette.
// ZAMAN: `out` = sönmenin BİTTİĞİ an (çıkış out - fade .. out). Infinity -> hiç çıkmaz.
(function () {
  const { clamp, lerp, prog, E, spring, css, W, H, up } = window.M;
  const TL = window.TIMELINE, SRC = TL.src || { w: W, h: H };
  const ROOT = document.currentScript && document.currentScript.src ? new URL('..', document.currentScript.src).href : '../../';
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fin = x => typeof x === 'number' && isFinite(x);
  const fIn = (t, a, d = .45) => E.outCubic(prog(t, a, a + d));
  const fOut = (t, b, d = .35) => fin(b) ? 1 - E.inCubic(prog(t, b - d, b)) : 1;
  const io = (t, a, d) => E.inOutCubic(prog(t, a, a + d));
  const show = (el, o) => { if (!(o > .002)) { if (el.style.display !== 'none') el.style.display = 'none'; return false; }
    if (el.style.display === 'none') el.style.display = ''; el.style.opacity = o.toFixed(4); return true; };
  const FONT = "'Manrope', 'Mont', sans-serif";
  const FONTS = ['500 40px Manrope', '600 40px Manrope', '700 40px Manrope', '800 40px Manrope'];
  const D = {};

  // ===== stil (bir kez) =====
  const st = document.createElement('style');
  st.textContent = `
@font-face { font-family: 'Manrope'; src: url('${ROOT}assets/fonts/Manrope.ttf') format('truetype'); font-weight: 200 800; }
.d-f, .d-f * { font-family: ${FONT}; -webkit-font-smoothing: antialiased; box-sizing: border-box; }
.d-a { position: absolute; }
.d-card { position: absolute; color: #F3F5FA; background: rgba(10,17,34,.95); border: 1px solid rgba(255,255,255,.10);
  border-radius: 16px; box-shadow: 0 18px 44px rgba(7,10,18,.32), 0 3px 8px rgba(7,10,18,.18); overflow: hidden; }
.d-card.light { color: #0A1122; background: rgba(255,255,255,.97); border: 1.5px solid rgba(43,127,217,.35); box-shadow: 0 16px 40px rgba(10,17,34,.18); }
.d-kick { display: flex; align-items: center; gap: .5em; font-weight: 800; letter-spacing: .13em; color: #5DB3F0; white-space: nowrap; }
.d-card.light .d-kick { color: #2B7FD9; }
.d-kick svg { flex: none; }
.d-ttl { font-weight: 800; letter-spacing: -.01em; line-height: 1.2; }
.d-it { position: relative; overflow: hidden; }
.d-itc { display: flex; align-items: flex-start; gap: .55em; line-height: 1.32; font-weight: 600; }
.d-num { flex: none; display: grid; place-items: center; width: 1.3em; height: 1.3em; margin-top: .3em; border-radius: 50%;
  background: rgba(93,179,240,.16); border: 1.5px solid rgba(93,179,240,.55); color: #BFE3FF; font-size: .72em; font-weight: 800; }
.d-card.light .d-num { background: rgba(43,127,217,.10); border-color: rgba(43,127,217,.5); color: #2B7FD9; }
.d-dot { flex: none; width: .42em; height: .42em; margin-top: .48em; border-radius: 50%; background: #5DB3F0; }
.d-chip { display: inline-flex; align-items: center; gap: .5em; padding: .32em .8em .36em .55em; border-radius: 999px; white-space: nowrap;
  background: rgba(93,179,240,.14); border: 1.5px solid rgba(93,179,240,.45); color: #F3F5FA; font-weight: 700; line-height: 1.1; }
.d-chip i { flex: none; width: .5em; height: .5em; border-radius: 50%; background: #5DB3F0; }
.d-pill { position: absolute; display: inline-flex; align-items: center; white-space: nowrap; border-radius: 999px; font-weight: 700;
  color: #F3F5FA; background: rgba(10,17,34,.9); border: 1px solid rgba(255,255,255,.12); box-shadow: 0 8px 22px rgba(7,10,18,.28); }
.d-pill.light { color: #0A1122; background: rgba(255,255,255,.96); border: 1.5px solid rgba(43,127,217,.4); }
.d-mute { color: #BFE3FF; font-weight: 600; }
.d-pill.light .d-mute { color: #2B7FD9; }
.d-sep { opacity: .55; font-weight: 600; }
.d-slot { position: relative; display: inline-block; height: 1.25em; overflow: hidden; vertical-align: top; }
.d-slot > span { position: absolute; left: 0; top: 0; white-space: nowrap; }
.d-veil { position: absolute; pointer-events: none; }
.d-hl { position: absolute; transform-origin: 0 50%; }
#dMeasure { position: absolute; left: -10000px; top: 0; visibility: hidden; }
`;
  document.head.appendChild(st);

  // ===== ikonlar (24'lük çizgi, currentColor) =====
  const ICO = {
    note: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="3.5" cy="6" r="1.2"/><circle cx="3.5" cy="12" r="1.2"/><circle cx="3.5" cy="18" r="1.2"/>',
    book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    info: '<circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7.5v.5"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    layers: '<path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
    flag: '<path d="M5 22V3M5 4h12l-2 4 2 4H5"/>',
    help: '<circle cx="12" cy="12" r="9.5"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.9M12 17v.4"/>',
    ff: '<path d="M3 5.5v13L11.5 12zM12.5 5.5v13L21 12z" fill="currentColor" stroke="none"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>', arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowU: '<path d="M12 19V5M6 11l6-6 6 6"/>', arrowD: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  };
  const IC_C = { x: '#FF6B6E', check: '#3DD68C' }, IC_L = { x: '#E5383B', check: '#1FB766' };
  const ic = (n, s = '1em', w = 2.2) => ICO[n] ? `<svg style="width:${s};height:${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${ICO[n]}</svg>` : '';

  // ===== kaynak -> ekran (V.focus dahil): motorun bu karede yazdığı #face geometrisi =====
  const TRX = /translate\(\s*([-+\d.eE]+)px\s*,\s*([-+\d.eE]+)px\s*\)/;
  const num = s => { const v = parseFloat(s); return isFinite(v) ? v : 0; };
  function cam() {
    const f = document.getElementById('face'), fw = document.getElementById('faceWrap');
    if (!f || !f.style.width) return { s: W / SRC.w, x: 0, y: 0 };
    const m = TRX.exec(f.style.transform) || [0, 0, 0], m2 = TRX.exec(fw.style.transform) || [0, 0, 0];
    return { s: num(f.style.width) / SRC.w, x: num(fw.style.left) + num(m2[1]) + num(m[1]), y: num(fw.style.top) + num(m2[2]) + num(m[2]) };
  }
  const pt = (x, y, c = cam()) => [c.x + x * c.s, c.y + y * c.s];
  const rect = (r, c = cam()) => ({ x: c.x + r[0] * c.s, y: c.y + r[1] * c.s, w: r[2] * c.s, h: r[3] * c.s });

  // ===== ölçüm (yazı tipleri yüklendikten sonra, ekran dışı kopya) =====
  function measure(html, width) {
    let host = document.getElementById('dMeasure');
    if (!host) { host = document.createElement('div'); host.id = 'dMeasure'; document.body.appendChild(host); }
    const d = document.createElement('div'); d.className = 'd-f'; d.style.position = 'absolute';
    if (width) d.style.width = width + 'px';
    d.innerHTML = html; host.appendChild(d);
    const r = d.firstElementChild || d; const out = { w: r.offsetWidth, h: r.offsetHeight, el: d };
    return out;
  }
  const unmeasure = m => m.el.remove();

  // ===== renderAt sarmalayıcısı: önce yazı tipleri (bir kez), PRE kancaları (altyazı yeri), sonra motor =====
  const PRE = [], POST = [];
  let fontsOk = false;
  const R0 = window.renderAt;
  window.renderAt = async function (t) {
    if (!fontsOk) { await Promise.all(FONTS.map(f => document.fonts.load(f).catch(() => {}))); fontsOk = true; }
    for (const f of PRE) f(t);
    await R0(t);
    for (const f of POST) f(t);
  };

  // ===== D.capStyle: ders altyazısı (motorun 'sade' altyazısına görünüm + yer) =====
  // Manrope, beyaz, koyu yarı saydam TEK yuvarlatılmış kutu, en fazla 2 satır. Döner: V alanları (defineVideo içine yay: ...D.capStyle({...})).
  // y: blok merkezi · cx: yatay merkez · box: satır genişliği (≤ 1400 önerilir) · fs / fsMin: punto (uzun blok küçülür, en az fsMin)
  // place: [{a, b, y, cx, box, maxLines}] a..b arasında altyazı başka yerde (ör. slaydın altı anlatılırken üst banda ya da boş sütuna);
  //   sınırları blok başına koy (D.blockAt(i) - .02) -> blok değişince yeni yerde belirir. Motor V.capAt'ını üretir; cx/box motorun
  //   format profiline (M.F.cap) her kareden önce yazılır (motor değişmeden).
  D.capStyle = function ({ weight = 600, fs = 42, fsMin = 38, lh = 1.32, bg = 'rgba(7,10,18,.82)', color = '#FFFFFF', radius = .36,
    pad = [.14, .55], y = 902, cx = W / 2, box = 1360, place = [] } = {}) {
    const s = document.createElement('style');
    s.textContent = `#cap.s2 { font-family: ${FONT}; font-weight: ${weight}; line-height: ${lh}; letter-spacing: 0; }
#cap.s2 .bgl { display: inline-block; background: ${bg}; color: ${color}; padding: ${pad[0]}em ${pad[1]}em ${pad[0] + .04}em; border-radius: ${radius}em;
  box-shadow: 0 6px 18px rgba(0,0,0,.18); text-wrap: balance; }
#cap.s2 .cw { text-shadow: none; margin: 0 .05em; }`;
    document.head.appendChild(s);
    const F = M.F, base = Object.assign({}, F.cap || {}, { cx, y, yCard: y, box, fs, fsMin });
    F.cap = Object.assign({}, base);
    PRE.push(t => { const w = place.find(o => t >= o.a && t < o.b);
      F.cap.cx = w && w.cx != null ? w.cx : cx; F.cap.box = w && w.box != null ? w.box : box; });
    // kutu en uzun satıra daralır (dengeli kırılım: satırlar eşit uzunlukta; tek kutu tam genişliğe yayılmaz). Satırlar aynı kalır.
    POST.push(() => { const g = document.querySelector('#cap .bgl'); if (!g || g._dw || !g.offsetParent) return;
      const ws = [...g.querySelectorAll('.cw')], rows = new Map();
      for (const w of ws) { const r = rows.get(w.offsetTop) || [Infinity, -Infinity]; r[0] = Math.min(r[0], w.offsetLeft); r[1] = Math.max(r[1], w.offsetLeft + w.offsetWidth); rows.set(w.offsetTop, r); }
      const m = Math.max(...[...rows.values()].map(r => r[1] - r[0])), px = parseFloat(getComputedStyle(g).paddingLeft) || 0;
      const mg = ws.length ? (parseFloat(getComputedStyle(ws[0]).marginLeft) || 0) * 2 : 0;   // ilk/son kelimenin dış payı
      if (isFinite(m)) { g.style.width = Math.ceil(m + mg + 2 * px + 6) + 'px'; g._dw = 1; } });
    return { capAt: place.map(o => ({ a: o.a, b: o.b, y: o.y ?? y, maxLines: o.maxLines })), fonts: FONTS.slice() };
  };
  // kelime i'nin bulunduğu altyazı bloğunun başlangıcı (place sınırları için)
  D.blockAt = i => { const c = TL.chunks.find(c => c.w.some(w => w.i === i)); return c ? c.s : NaN; };

  // ===== D.layer: sahne + karışım modu (fosfor için 'multiply'; sahneler ayrı yığın bağlamı olduğundan sahneye verilir) =====
  D.layer = ({ blend, ...o }) => { const s = L.scene(o); const i0 = s.init;
    s.init = sc => { i0(sc); if (blend) sc.el.style.mixBlendMode = blend; }; return s; };

  // ===== D.veil: tam ekran perde (not anında slaydı soluklaştırır; data-safe=ignore) =====
  // t (belirme), out (bittiği an), a (koyuluk), color ('r,g,b'; vars. kırık beyaz -> soluklaşma; '7,10,18' -> karartma), fade
  D.veil = ({ t, out = Infinity, a = .72, color = '243,245,250', fade = .4 }) => ({
    html: `<div class="d-veil" data-safe="ignore" style="left:0;top:0;width:${W}px;height:${H}px;background:rgba(${color},${a});display:none"></div>`,
    render(tt, r) { show(r.firstChild, (tt >= t ? fIn(tt, t, fade) : 0) * fOut(tt, out, fade)); },
  });

  // ===== D.mark: slayttaki bölgeye vurgu (kaynak koordinatı, V.focus ile birlikte hareket eder) =====
  // rect: [x, y, w, h] kaynak px  |  seq: [{t, rect, frame}] -> vurgu bölgeden bölgeye kayar (move s, inOutCubic); frame: false -> o adımda çerçeve söner
  // kind: 'box' (yuvarlatılmış çerçeve, çizilerek gelir) | 'hl' (fosfor; D.layer multiply sahnesinde) | 'under' (marker alt çizgi) |
  //       'spot' (yalnız soluklaştırma) | 'pulse' (çerçeve halkası yayılıp söner; times: [t..] her biri bir nabız)
  // spot: 0..1 -> bölge dışı kırık beyaz perdeyle soluklaşır (odak; data-safe=ignore) · veil: perde rengi 'r,g,b'
  // t, out, pad (px, kaynak), r (köşe), color, width (çizgi), draw (çizim s), sweep: [a, b] (hl/under: konuşmayla soldan sağa dolar)
  // hl: fosfor rengi · fade (çıkış s)
  D.mark = ({ rect: r0, seq, kind = 'box', t, out = Infinity, pad = 8, r = 14, color = '#2B7FD9', width = 4, spot = 0, veil = '243,245,250',
    draw = .55, move = .5, sweep, hl = 'rgba(255,214,70,.62)', fade = .35, times, glow = true } = {}) => {
    const K = (seq || [{ t, rect: r0 }]).map(s => ({ t: s.t, rect: s.rect, frame: s.frame ?? true }));
    const T0 = K[0].t, kinds = kind.split(/[ +]/);
    const has = k => kinds.includes(k);
    const at = tt => { let k = 0; for (let i = 0; i < K.length; i++) if (tt >= K[i].t) k = i;
      if (k === 0) return { b: K[0].rect, fr: K[0].frame ? 1 : 0 };
      const u = io(tt, K[k].t, move), a = K[k - 1].rect, b = K[k].rect, f0 = K[k - 1].frame ? 1 : 0, f1 = K[k].frame ? 1 : 0;
      // çerçeve yalnız çerçeveli uca yakın görünür (çerçevesiz geniş bölgeye / bölgeden kayarken güvenli alanı aşmasın)
      const fr = f0 === f1 ? f0 : f0 ? 1 - clamp(u / .35) : clamp((u - .65) / .35);
      return { b: a.map((v, j) => lerp(v, b[j], u)), fr }; };
    const sw = glow ? `filter:drop-shadow(0 0 6px ${color}66);` : '';
    let veilEl, frEl, frRect, hlEl, unEl, plEl;
    return {
      html: `<div class="d-a" style="left:0;top:0">` +
        (spot > 0 ? `<div class="d-veil" data-safe="ignore" style="display:none;box-shadow:0 0 0 4000px rgba(${veil},${spot})"></div>` : '') +
        (has('hl') ? `<div class="d-hl" style="display:none;background:${hl};border-radius:6px"></div>` : '') +
        (has('under') ? `<div class="d-hl" style="display:none;background:${color};border-radius:${width}px"></div>` : '') +
        (has('box') || has('pulse') ? `<svg class="d-a" style="display:none;overflow:visible;${sw}"><rect pathLength="1" fill="none" stroke="${color}" stroke-width="${width}"/></svg>` : '') +
        `</div>`,
      render(tt, root) {
        if (!root._i) { root._i = 1; const q = root.firstChild; veilEl = q.querySelector('.d-veil'); const hs = q.querySelectorAll('.d-hl');
          hlEl = has('hl') ? hs[0] : null; unEl = has('under') ? hs[hs.length - 1] : null; frEl = q.querySelector('svg'); frRect = frEl && frEl.firstChild; }
        const live = tt >= T0 && (!fin(out) || tt < out);
        if (!live) { for (const e of [veilEl, hlEl, unEl, frEl]) if (e) e.style.display = 'none'; return; }
        const c = cam(), A = at(tt), p = pad, R = rect([A.b[0] - p, A.b[1] - p, A.b[2] + 2 * p, A.b[3] + 2 * p], c), o = fOut(tt, out, fade);
        const rr = r * c.s;
        if (veilEl && show(veilEl, fIn(tt, T0, .45) * o)) css(veilEl, { left: R.x + 'px', top: R.y + 'px', width: R.w + 'px', height: R.h + 'px', borderRadius: rr + 'px' });
        if (hlEl || unEl) {
          const u = sweep ? E.inOutCubic(prog(tt, sweep[0], sweep[1])) : E.outCubic(prog(tt, T0, T0 + draw));
          if (hlEl && show(hlEl, o)) css(hlEl, { left: R.x + 'px', top: R.y + 'px', width: R.w + 'px', height: R.h + 'px', transform: `scaleX(${u.toFixed(4)})` });
          if (unEl && show(unEl, o)) { const h = width * 1.6 * c.s;
            css(unEl, { left: R.x + 'px', top: (R.y + R.h - h / 2) + 'px', width: R.w + 'px', height: h + 'px', transform: `scaleX(${u.toFixed(4)})` }); }
        }
        if (frEl) {
          let fo = o * A.fr, sc = 1, d = 1;
          if (has('pulse')) {                                   // nabız: halka hafifçe büyür, söner
            const ts = times || K.map(k => k.t); let best = 0, bs = 1;
            for (const p0 of ts) { const u = prog(tt, p0, p0 + .9); if (tt >= p0 && u < 1) { const v = 1 - E.inCubic(u); if (v > best) { best = v; bs = 1 + .035 * E.outCubic(u); } } }
            fo = best * o; sc = bs;
          } else d = E.inOutCubic(prog(tt, T0, T0 + draw));
          if (show(frEl, fo)) {
            const m = width;
            css(frEl, { left: (R.x - m) + 'px', top: (R.y - m) + 'px', width: (R.w + 2 * m) + 'px', height: (R.h + 2 * m) + 'px',
              transformOrigin: '50% 50%', transform: `scale(${sc.toFixed(4)})` });
            frRect.setAttribute('x', m); frRect.setAttribute('y', m); frRect.setAttribute('width', Math.max(0, R.w).toFixed(1)); frRect.setAttribute('height', Math.max(0, R.h).toFixed(1));
            frRect.setAttribute('rx', rr.toFixed(1)); frRect.setAttribute('stroke-width', width);
            frRect.style.strokeDasharray = '1 1'; frRect.style.strokeDashoffset = (1 - d).toFixed(4);
          }
        }
      },
    };
  };

  // ===== D.note: sabit not kartı (ekran koordinatı). Başlık + maddeler; madde kendi anında gelir, kart içeriğiyle uzar =====
  // x, y (sol-üst; anchor 'bottom' -> y alt kenar, kart yukarı uzar), w, kicker (üst etiket, büyük harfe çevrilir), icon (note|book|bulb|info|map|layers|check|flag|help),
  // title, items: [{text, t, icon ('check' | 'x' | ICO adı), accent (vurgu rengi)}] (1-4 önerilir), numbered (1,2,3 daireleri; vars. nokta), chips (maddeler hap biçiminde), t, out, size (madde punto, ≥ 24),
  // theme 'dark' | 'light', arrow: 'left'|'right'|'up'|'down' (kartın yanında odak tarafını gösteren ok), pad, gap
  // kickerSize (isteğe bağlı, px): üst etiket punto (vars. max(18, size·.76)); okunurluk hedefi (960 px oynatıcı): madde ≥ 30, etiket/başlık ≥ 22
  D.note = ({ x, y, w = 560, kicker, icon = 'note', title, items = [], numbered = false, chips = false, t, out = Infinity, size = 25,
    theme = 'dark', anchor = 'top', arrow, pad = 22, gap = 10, kickerSize }) => {
    const head = (kicker ? `<div class="d-kick" style="font-size:${kickerSize ?? Math.max(18, Math.round(size * .76))}px">${ic(icon, '1.25em', 2.4)}${esc(up(kicker))}</div>` : '') +
      (title ? `<div class="d-ttl" style="font-size:${Math.round(size * 1.16)}px;margin-top:${kicker ? 8 : 0}px">${esc(title)}</div>` : '');
    const itemHtml = (it, i) => chips
      ? `<div class="d-itc" style="font-size:${size}px"><span class="d-chip"><i></i>${esc(it.text)}</span></div>`
      : `<div class="d-itc" style="font-size:${size}px">${it.icon ? `<span style="flex:none;display:flex;margin-top:.12em;color:${(theme === 'light' ? IC_L : IC_C)[it.icon] || '#5DB3F0'}">${ic(it.icon, '1.05em', 3)}</span>`
        : numbered ? `<span class="d-num">${i + 1}</span>` : '<span class="d-dot"></span>'}<span${it.accent ? ` style="color:${theme === 'light' ? '#2B7FD9' : '#FFD23F'};font-weight:800"` : ''}>${esc(it.text)}</span></div>`;
    const AR = { left: 'arrowL', right: 'arrowR', up: 'arrowU', down: 'arrowD' }[arrow];
    let el, hd, its, H0 = 0, HS = [];
    return {
      html: `<div class="d-f d-card ${theme === 'light' ? 'light' : ''}" style="left:${x}px;top:${y}px;width:${w}px;display:none">` +
        `<div class="d-nh" style="padding:${pad}px ${pad}px 0">${head}</div>` +
        items.map((it, i) => `<div class="d-it" style="padding:0 ${pad}px"><div class="d-iti" style="padding-top:${gap}px">${itemHtml(it, i)}</div></div>`).join('') +
        `<div style="height:${pad}px"></div></div>` +
        (AR ? `<div class="d-f d-a" style="display:none;color:#2B7FD9">${ic(AR, '46px', 2.6)}</div>` : ''),
      render(tt, root) {
        if (!el) { el = root.firstChild; hd = el.firstChild; its = [...el.querySelectorAll('.d-it')];
          const m = measure(el.outerHTML.replace('display:none', ''), null); const mel = m.el.firstChild;
          H0 = mel.firstChild.offsetHeight + pad; HS = [...mel.querySelectorAll('.d-iti')].map(e => e.offsetHeight); unmeasure(m); }
        const o = (tt >= t ? fIn(tt, t, .5) : 0) * fOut(tt, out, .4);
        const ar = AR ? root.children[1] : null;
        if (!show(el, o)) { if (ar) ar.style.display = 'none'; return; }
        let hsum = H0;
        its.forEach((e, i) => { const ti = items[i].t ?? t, gu = io(tt, ti - .08, .4), k = fIn(tt, ti, .45);
          const h = HS[i] * gu; hsum += h; e.style.height = h.toFixed(2) + 'px';
          const inn = e.firstChild; inn.style.opacity = k.toFixed(4); inn.style.transform = `translateY(${((1 - k) * 10).toFixed(2)}px)`; });
        const ty = (1 - fIn(tt, t, .5)) * 14;
        css(el, { height: hsum.toFixed(2) + 'px', top: (anchor === 'bottom' ? y - hsum : y) + 'px', transform: `translateY(${ty.toFixed(2)}px)` });
        if (ar && show(ar, o)) {                                      // ok: kartın yan kenarının ortasında, odak tarafına
          const cy = (anchor === 'bottom' ? y - hsum : y) + hsum / 2, nud = 6 * Math.sin(Math.max(0, tt - t) * 2.4);
          const px = arrow === 'left' ? x - 58 - nud : arrow === 'right' ? x + w + 12 + nud : x + w / 2 - 23;
          const py = arrow === 'up' ? (anchor === 'bottom' ? y - hsum : y) - 58 - nud : arrow === 'down' ? (anchor === 'bottom' ? y : y + hsum) + 12 + nud : cy - 23;
          css(ar, { left: px.toFixed(1) + 'px', top: py.toFixed(1) + 'px' });
        }
      },
    };
  };

  // ===== D.term: terim kartı (terim + karşılık + kısa açıklama; ekran koordinatı) =====
  // x, y, w, term ('Frontend'), tr (karşılık: 'ön yüz'), def (kısa açıklama), kicker ('Terim'), t, out, size (açıklama punto),
  // theme, inline: true -> tek satır hap (dar boşluk için: [TERİM] terim · karşılık — açıklama), anchor 'bottom'
  // kickerSize (isteğe bağlı, px): 'TERİM' etiketi punto (vars. max(18, size·.76))
  D.term = ({ x, y, w = 560, term, tr, def, kicker = 'Terim', t, out = Infinity, size = 25, theme = 'dark', inline = false, anchor = 'top', pad = 22, kickerSize }) => {
    const K = `<div class="d-kick" style="font-size:${kickerSize ?? Math.max(18, Math.round(size * .76))}px">${ic('book', '1.25em', 2.4)}${esc(up(kicker))}</div>`;
    const html = inline
      ? `<div class="d-f d-card ${theme === 'light' ? 'light' : ''}" style="left:${x}px;top:${y}px;display:none;padding:${Math.round(pad * .55)}px ${pad}px;` +
        `display:none;white-space:nowrap"><div style="display:flex;align-items:center;gap:${Math.round(size * .7)}px;font-size:${size}px">${K}` +
        `<span class="d-ttl" style="font-size:${Math.round(size * 1.12)}px">${esc(term)}</span>${tr ? `<span class="d-mute">${esc(tr)}</span>` : ''}` +
        `${def ? `<span style="font-weight:600;opacity:.9">${esc(def)}</span>` : ''}</div></div>`
      : `<div class="d-f d-card ${theme === 'light' ? 'light' : ''}" style="left:${x}px;top:${y}px;width:${w}px;padding:${pad}px;display:none">${K}` +
        `<div style="margin-top:8px;line-height:1.15"><span class="d-ttl" style="font-size:${Math.round(size * 1.5)}px">${esc(term)}</span>` +
        (tr ? `<span class="d-mute" style="font-size:${Math.round(size * 1.04)}px;margin-left:.5em">${esc(tr)}</span>` : '') + `</div>` +
        (def ? `<div style="margin-top:10px;font-size:${size}px;font-weight:600;line-height:1.34;opacity:.92">${esc(def)}</div>` : '') + `</div>`;
    let el, hh = 0;
    return {
      html,
      render(tt, root) {
        if (!el) { el = root.firstChild; if (anchor === 'bottom') { const m = measure(html.replace(/display:none;?/g, ''), null); hh = m.h; unmeasure(m); } }
        const o = (tt >= t ? fIn(tt, t, .5) : 0) * fOut(tt, out, .4);
        if (!show(el, o)) return;
        css(el, { top: (anchor === 'bottom' ? y - hh : y) + 'px', transform: `translateY(${((1 - fIn(tt, t, .5)) * 12).toFixed(2)}px)` });
      },
    };
  };

  // ===== ortak: yerinde değişen yazı yuvası (konu çipi, adım izleyici) — genişlik ölçülür, eskisi söner yenisi belirir =====
  function swapSlot(texts, fsz, weight) {
    const html = `<span class="d-slot" style="width:0px">` + texts.map(s => `<span style="opacity:0;font-weight:${weight}">${esc(s)}</span>`).join('') + `</span>`;
    let ws = null;
    return {
      html,
      widths(rootEl) { if (ws) return ws;
        ws = texts.map(s => { const m = measure(`<span style="font-size:${fsz}px;font-weight:${weight};white-space:nowrap">${esc(s)}</span>`); const v = m.w; unmeasure(m); return v; });
        return ws; },
      set(slot, k, tt, tk, prevK) {                                   // k: aktif indeks, tk: değişim anı
        const ws0 = this.widths(); const u = io(tt, tk, .45);
        const wv = prevK >= 0 ? lerp(ws0[prevK], ws0[k], u) : ws0[k];
        slot.style.width = wv.toFixed(1) + 'px';
        [...slot.children].forEach((s, i) => {
          let o = 0, dy = 0;
          if (i === k) { o = prevK >= 0 ? fIn(tt, tk + .12, .35) : 1; dy = (1 - o) * 8; }
          else if (i === prevK) { const q = E.inCubic(prog(tt, tk, tk + .2)); o = 1 - q; dy = -q * 8; }
          s.style.opacity = o.toFixed(4); s.style.transform = `translateY(${dy.toFixed(2)}px)`;
        });
      },
    };
  }
  const idxAt = (items, tt) => { let k = -1; for (let i = 0; i < items.length; i++) if (tt >= items[i].t) k = i; return k; };

  // ===== D.topic: küçük sabit konu çipi "Bölüm 1 · Temeller › <konu>" (konu değişince yerinde değişir) =====
  // items: [{t, text}], prefix, x, y, anchor ('left' | 'right': x sağ kenar), size, t (ilk belirme), out, hide: [[a, b]] (slayt başlığına
  // binen anlarda söner), theme ('dark' | 'light'), icon
  // lh, pad (isteğe bağlı): ince hap — satır yüksekliği (em; yazı yuvası da bu yükseklikte) ve CSS padding (vars. '.34em .9em .38em .7em').
  //   İri punto + slayt başlığına yakın üst şerit için: {size: 24, lh: 1.12, pad: '.07em .8em .07em .6em'} -> ~32 px yükseklik
  D.topic = ({ prefix = 'Bölüm 1 · Temeller', items, x = 96, y = 54, anchor = 'left', size = 20, t = 0, out = Infinity, hide = [], theme = 'dark', icon = 'layers', lh, pad }) => {
    const slot = swapSlot(items.map(i => i.text), size, 700);
    if (lh != null) slot.html = slot.html.replace('style="width:0px"', `style="width:0px;height:${lh}em;line-height:${lh}"`);
    let el, sl;
    return {
      html: `<div class="d-f d-pill ${theme === 'light' ? 'light' : ''}" style="left:${x}px;top:${y}px;font-size:${size}px;gap:.5em;padding:${pad ?? '.34em .9em .38em .7em'};${lh != null ? `line-height:${lh};` : ''}display:none;` +
        `${anchor === 'right' ? 'transform:translateX(-100%)' : ''}"><span class="d-mute" style="display:flex;color:#5DB3F0">${ic(icon, '1.05em', 2.4)}</span>` +
        `<span class="d-mute">${esc(prefix)}</span><span class="d-sep">›</span>${slot.html}</div>`,
      render(tt, root) {
        if (!el) { el = root.firstChild; sl = el.querySelector('.d-slot'); }
        const k = idxAt(items, tt);
        let o = k < 0 ? 0 : (tt >= t ? fIn(tt, t, .5) : 0) * fOut(tt, out, .4);
        for (const [a, b] of hide) o *= 1 - Math.min(E.inOutCubic(prog(tt, a - .3, a)), 1 - E.inOutCubic(prog(tt, b, b + .4)));
        if (!show(el, o)) return;
        slot.set(sl, k, tt, items[k].t, k > 0 && tt < items[k].t + .5 ? k - 1 : -1);
      },
    };
  };

  // ===== D.steps: adım izleyici hap "Adım 2/6 · Kurulum" + nokta dizisi (ekran koordinatı) =====
  // items: [{t, text}] (sıra = adım), total (vars. items.length), label ('Adım'), x, y, anchor ('left' | 'right'), size, t (belirme; vars. ilk adım), out, dots
  D.steps = ({ items, total, label = 'Adım', x, y, anchor = 'left', size = 22, t, out = Infinity, dots = true, theme = 'dark' }) => {
    const N = total || items.length, T0 = t ?? items[0].t;
    const nums = swapSlot(items.map((_, i) => `${i + 1}/${N}`), size, 800), txt = swapSlot(items.map(i => i.text), size, 700);
    let el, s1, s2, ds;
    return {
      html: `<div class="d-f d-pill ${theme === 'light' ? 'light' : ''}" style="left:${x}px;top:${y}px;font-size:${size}px;gap:.45em;padding:.36em .95em .4em .8em;display:none;` +
        `${anchor === 'right' ? 'transform:translateX(-100%)' : ''}"><span class="d-mute">${esc(label)}</span>${nums.html}<span class="d-sep">·</span>${txt.html}` +
        (dots ? `<span style="display:inline-flex;gap:.3em;margin-left:.4em">${Array.from({ length: N }, () => '<i style="display:block;width:.42em;height:.42em;border-radius:50%;background:rgba(191,227,255,.28)"></i>').join('')}</span>` : '') + `</div>`,
      render(tt, root) {
        if (!el) { el = root.firstChild; [s1, s2] = el.querySelectorAll('.d-slot'); ds = [...el.querySelectorAll('i')]; }
        const k = idxAt(items, tt), o = k < 0 ? 0 : (tt >= T0 ? fIn(tt, T0, .45) : 0) * fOut(tt, out, .4);
        if (!show(el, o)) return;
        const pk = k > 0 && tt < items[k].t + .5 ? k - 1 : -1;
        nums.set(s1, k, tt, items[k].t, pk); txt.set(s2, k, tt, items[k].t, pk);
        ds.forEach((d, i) => { const on = i < k ? 1 : i === k ? fIn(tt, items[k].t, .35) : 0;
          d.style.background = on > .5 ? '#5DB3F0' : 'rgba(191,227,255,.28)'; d.style.transform = `scale(${(1 + .35 * on * (i === k ? 1 : 0)).toFixed(3)})`; });
      },
    };
  };

  // ===== D.callout: ok + etiket (ör. İngilizce arayüz öğesine Türkçe karşılık). Hedef KAYNAK koordinatı (yakınlaşmayla gider) =====
  // to: [x, y] kaynak px · text (Türkçe), sub (özgün ad, ör. 'Settings') · side: 'right'|'left'|'top'|'bottom' (etiketin hedefe göre yeri)
  // dist (px, ekran) · t, out, size, color (ok), theme, arrow: false -> oksuz etiket (hedef noktasına yaslanır; ör. tablo hücresine '+ Flutter')
  D.callout = ({ to, text, sub, side = 'right', dist = 110, t, out = Infinity, size = 24, color = '#FFD23F', theme = 'dark', arrow = true }) => {
    const lab = `<div class="d-f d-pill ${theme === 'light' ? 'light' : ''}" style="font-size:${size}px;gap:.5em;padding:.38em .9em .42em;display:none">` +
      `<span style="font-weight:800">${esc(text)}</span>${sub ? `<span class="d-mute" style="font-size:.8em">${esc(sub)}</span>` : ''}</div>`;
    let lb, sv, ln, hd, dot;
    return {
      html: `<div class="d-a" style="left:0;top:0"><svg class="d-a" style="left:0;top:0;overflow:visible;display:none;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))" width="1" height="1">` +
        `<path fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/><path fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<circle r="9" fill="none" stroke="${color}" stroke-width="4"/></svg>${lab}</div>`,
      render(tt, root) {
        if (!lb) { const q = root.firstChild; sv = q.firstChild; [ln, hd] = sv.querySelectorAll('path'); dot = sv.querySelector('circle'); lb = q.children[1]; }
        const o = (tt >= t ? fIn(tt, t, .4) : 0) * fOut(tt, out, .35);
        if (!show(lb, o)) { sv.style.display = 'none'; return; }
        show(sv, arrow ? o : 0);
        const [px, py] = pt(to[0], to[1]);
        const dx = side === 'right' ? 1 : side === 'left' ? -1 : 0, dy = side === 'bottom' ? 1 : side === 'top' ? -1 : 0;
        const lx = px + dx * dist, ly = py + dy * dist;
        const tr = side === 'right' ? 'translate(0,-50%)' : side === 'left' ? 'translate(-100%,-50%)' : side === 'top' ? 'translate(-50%,-100%)' : 'translate(-50%,0)';
        css(lb, { left: lx.toFixed(1) + 'px', top: ly.toFixed(1) + 'px', transform: `${tr} translate(${(dx * (1 - fIn(tt, t, .4)) * 10).toFixed(1)}px,${(dy * (1 - fIn(tt, t, .4)) * 10).toFixed(1)}px)` });
        const sx = lx - dx * 8, sy = ly - dy * 8, ex = px + dx * 16, ey = py + dy * 16, u = io(tt, t + .1, .35);
        const cx = lerp(sx, ex, u), cy = lerp(sy, ey, u);
        ln.setAttribute('d', `M${sx.toFixed(1)} ${sy.toFixed(1)}L${cx.toFixed(1)} ${cy.toFixed(1)}`);
        const ang = Math.atan2(ey - sy, ex - sx), hl = 14 * u;
        const h1 = [cx - hl * Math.cos(ang - .5), cy - hl * Math.sin(ang - .5)], h2 = [cx - hl * Math.cos(ang + .5), cy - hl * Math.sin(ang + .5)];
        hd.setAttribute('d', `M${h1[0].toFixed(1)} ${h1[1].toFixed(1)}L${cx.toFixed(1)} ${cy.toFixed(1)}L${h2[0].toFixed(1)} ${h2[1].toFixed(1)}`);
        dot.setAttribute('cx', px.toFixed(1)); dot.setAttribute('cy', py.toFixed(1)); dot.style.opacity = u.toFixed(3);
      },
    };
  };

  // ===== D.speed: hızlandırma rozeti "×4 hızlandırıldı" (SVG ileri ikonu, oklar sırayla yanar) =====
  // x, y, anchor ('left' | 'right': x sağ kenar), n (kat), text, t, out, size, theme
  D.speed = ({ x, y, anchor = 'right', n = 2, text = 'hızlandırıldı', t, out = Infinity, size = 22, theme = 'dark' }) => {
    let el, ch;
    return {
      html: `<div class="d-f d-pill ${theme === 'light' ? 'light' : ''}" style="left:${x}px;top:${y}px;font-size:${size}px;gap:.45em;padding:.36em .9em .4em .7em;display:none;` +
        `${anchor === 'right' ? 'transform:translateX(-100%)' : ''}"><svg style="width:1.3em;height:1em" viewBox="0 0 30 22">` +
        `<path d="M2 3v16l11-8z" fill="#5DB3F0"/><path d="M15 3v16l11-8z" fill="#5DB3F0"/></svg>` +
        `<span style="font-weight:800">×${esc(n)}</span><span class="d-mute">${esc(text)}</span></div>`,
      render(tt, root) {
        if (!el) { el = root.firstChild; ch = el.querySelectorAll('svg path'); }
        const o = (tt >= t ? fIn(tt, t, .35) : 0) * fOut(tt, out, .3);
        if (!show(el, o)) return;
        const ph = Math.max(0, tt - t) * 2.2;                          // 0.45 s'de bir: önce sol, sonra sağ ok parlar
        ch.forEach((p, i) => p.setAttribute('opacity', (.45 + .55 * (.5 + .5 * Math.cos(2 * Math.PI * (ph - i * .35)))).toFixed(3)));
      },
    };
  };

  // ===== D.blur: gizlilik bulanıklığı (kaynak koordinatı, yakınlaşmayla gider; data-safe=ignore) =====
  // rect [x, y, w, h] kaynak px, t, out, px (bulanıklık), r (köşe), tint (üst renk), fade
  D.blur = ({ rect: rr, t, out = Infinity, px = 16, r = 10, tint = 'rgba(243,245,250,.12)', fade = .15 }) => ({
    html: `<div class="d-a" data-safe="ignore" style="display:none;backdrop-filter:blur(${px}px);-webkit-backdrop-filter:blur(${px}px);background:${tint}"></div>`,
    render(tt, root) {
      const el = root.firstChild, o = (tt >= t ? fIn(tt, t, fade) : 0) * fOut(tt, out, fade);
      if (!show(el, o)) return;
      const c = cam(), R = rect(rr, c);
      css(el, { left: R.x + 'px', top: R.y + 'px', width: R.w + 'px', height: R.h + 'px', borderRadius: (r * c.s) + 'px' });
    },
  });

  // ===== D.hold: taban görüntünün istenmeyen anını sabit bir kareyle örter (a..b; V.focus geometrisiyle aynı yerde) =====
  // src (proje köküne göre, ör. 'work/ders_kare_427.jpg'), a, b, fade (s; 0 -> sert, kesimle aynı)  · sahne: L.scene({z: 2, ...})
  D.hold = ({ src, a, b, fade = 0 }) => ({
    html: `<img class="d-a" data-safe="ignore" alt="" src="${esc(src)}" style="display:none;left:0;top:0">`,
    render(tt, root) {
      const el = root.firstChild, o = tt >= a && tt < b ? (fade ? fIn(tt, a, fade) * fOut(tt, b, fade) : 1) : 0;
      if (!show(el, o)) return;
      const c = cam(); css(el, { left: c.x + 'px', top: c.y + 'px', width: (SRC.w * c.s) + 'px', height: (SRC.h * c.s) + 'px' });
    },
  });

  D.pt = pt; D.rect = rect; D.cam = cam; D.ic = ic; D.fonts = FONTS; D.pre = f => PRE.push(f);
  window.D = D;
})();
