// Yatay tanıtım bileşenleri (v1): eğitim/üyelik platformu tanıtımı için 16:9 yatay görsel dil. Global: window.TP.
// Kaynak: onaylı yatay tanıtım videosu dili (ornekler/yatay-tanitim) — panel kabuğu (sağ pencere
// <-> tam ekran aynı arayüz), fare imleci, süzülen kart parçaları, ince çizgi ikonlar, logo son kartı buradan GENEL bileşen olarak alındı.
// Yükleme: plan.json "libs": ["topluluk"]. engine.js / library.js'e dokunmaz (mevcut varsayılanlar korunur);
// Proje video.css'i yalnız #cap / #bg görünümünü verir (örnek: ornekler/yatay-tanitim/video.css); bileşen stilleri burada enjekte edilir.
//
// KOORDİNAT: ekran px (1920x1080). Panel içi bloklar içerik alanına göre (sol menünün sağı, adres çubuğunun altı), em ile ölçeklenir.
// ZAMAN: `out` = sönmenin BİTTİĞİ an (Infinity -> çıkmaz). Her kare t'den saf (Date / rastgele yok).
// HAREKET: sakin, premium; girişler yerinde süzülme (outCubic), çıkış inCubic; yay yalnız küçük çip / rozet / tikte.
// DÜRÜSTLÜK: bileşenler yazısızdır ya da yazıyı video.js verir (yalnız söylenenler + panelin gerçek menü / sekme / düğme adları).
(function () {
  const { clamp, lerp, prog, E, spring, css } = window.M;
  const ROOT = document.currentScript && document.currentScript.src ? new URL('..', document.currentScript.src).href : '../../';
  const B = window.BRAND || {}, BRB = B.base || '';
  const TP = {};
  TP.LOGO = BRB + ((B.logo || {}).light || 'logo-light.png'); TP.MARK = BRB + ((B.logo || {}).mark || 'logo-mark.png');   // koyu zemin için açık logo
  TP.LOGO_AR = 1535 / 3142; TP.MARK_AR = 870 / 1109;
  TP.FONTS = ['800 40px Manrope', '700 40px Manrope', '600 40px Manrope', '500 40px Manrope'];

  // ===== zaman yardımcıları =====
  const eo = (t, a, d = .5) => E.outCubic(prog(t, a, a + d));                       // giriş (ease-out)
  const ei = (t, b, d = .3) => isFinite(b) ? E.inCubic(prog(t, b - d, b)) : 0;     // çıkış (b'de biter)
  const io = (t, a, d) => E.inOutCubic(prog(t, a, a + d));
  const bump = (t, a, d) => (t > a && t < a + d) ? Math.sin(Math.PI * (t - a) / d) : 0;
  Object.assign(TP, { eo, ei, io, bump });

  // ===== stil (bir kez) =====
  const st = document.createElement('style');
  st.textContent = `
@font-face { font-family: "Manrope"; src: url("${ROOT}assets/fonts/Manrope.ttf") format("truetype"); font-weight: 200 800; }
.yz, .yz * { font-family: "Manrope", sans-serif; }
.yz { color: #F3F5FA; -webkit-font-smoothing: antialiased; }
.yz svg { display: block; flex: none; }
.yzI { will-change: transform, opacity; }
.yc { background: rgba(14, 26, 51, .94); border: 1px solid rgba(255,255,255,.09); border-radius: 18px;
      box-shadow: 0 26px 70px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.04); }
.yc.soft { background: rgba(14, 26, 51, .72); }
.yc.dark { background: rgba(7, 10, 18, .9); }
.yc.opq { background: #0E1A33; }
.yk { font-weight: 700; letter-spacing: .16em; color: #5DB3F0; white-space: nowrap; }
.yh { font-weight: 800; letter-spacing: -.025em; color: #F3F5FA; white-space: nowrap; line-height: 1.05; }
.yt { font-weight: 600; color: rgba(243,245,250,.9); }
.ym { font-weight: 500; color: rgba(243,245,250,.56); }
.ysk { background: rgba(243,245,250,.10); border-radius: 99px; }
.yrow { display: flex; align-items: center; }
.ypill { display: inline-flex; align-items: center; gap: .45em; white-space: nowrap; border-radius: 999px; font-weight: 700; }
.ypill.w { background: #F3F5FA; color: #0A1122; box-shadow: 0 10px 28px rgba(0,0,0,.35); }
.ypill.s { background: rgba(93,179,240,.13); border: 1px solid rgba(93,179,240,.38); color: #BFE3FF; }
.ypill.g { background: rgba(31,183,102,.16); border: 1px solid rgba(31,183,102,.5); color: #7FE3AE; }
.ypill.r { background: rgba(229,56,59,.16); border: 1px solid rgba(229,56,59,.55); color: #FF9A9C; }
.ypill.o { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.14); color: rgba(243,245,250,.82); }
.ydot { display: inline-block; width: .5em; height: .5em; border-radius: 50%; background: #5DB3F0; flex: none; }
.yav { display: grid; place-items: center; border-radius: 50%; font-weight: 800; color: #fff; flex: none;
       background: linear-gradient(140deg, #8B5CF6 0%, #5B6CF0 55%, #2B7FD9 100%); box-shadow: 0 0 0 2px rgba(191,227,255,.25); }
.yav.anon { background: #26324A; box-shadow: 0 0 0 1px rgba(255,255,255,.12); color: rgba(243,245,250,.7); }
.ychk { display: grid; place-items: center; border-radius: 50%; background: #1FB766; flex: none; }
.ybar { position: relative; border-radius: 99px; background: rgba(243,245,250,.10); overflow: hidden; }
.ybar > b { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 99px; background: linear-gradient(90deg, #2B7FD9, #5DB3F0); }
/* panel kabuğu: menü katmanı içeriğin üstünde (çekmece açılınca içerik kararır) */
.pn { position: absolute; border-radius: 20px; background: #0A1122; border: 1px solid rgba(255,255,255,.10); overflow: hidden;
      box-shadow: 0 34px 90px rgba(0,0,0,.55); }
.pn .pnBg { position: absolute; inset: 0; background: radial-gradient(60% 50% at 75% 0%, rgba(43,127,217,.13), rgba(43,127,217,0) 70%); }
.pn .pnBar { position: absolute; left: 0; right: 0; top: 0; border-bottom: 1px solid rgba(255,255,255,.07); background: rgba(7,10,18,.55); z-index: 4; }
.pn .pnDots { position: absolute; display: flex; gap: 8px; }
.pn .pnDots b { width: 10px; height: 10px; border-radius: 50%; background: rgba(243,245,250,.16); }
.pn .pnUrl { position: absolute; display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 16px; border-radius: 99px;
             background: rgba(243,245,250,.06); color: rgba(243,245,250,.62); font-weight: 600; font-size: 15px; white-space: nowrap; }
.pn .pnBell { position: absolute; width: 30px; height: 30px; display: grid; place-items: center; }
.pn .pnBell i { position: absolute; right: 3px; top: 3px; width: 9px; height: 9px; border-radius: 50%; background: #E5383B; box-shadow: 0 0 0 2px #0A1122; }
.pn .pnSide { position: absolute; left: 0; bottom: 0; border-right: 1px solid rgba(255,255,255,.07); background: rgba(7,10,18,.45); z-index: 3; }
.pn .pnDim { position: absolute; inset: 0; background: rgba(7,10,18,.62); z-index: 2; }
.pn .pnLogo, .pn .pnMark { position: absolute; z-index: 3; }
.pn .pnHi { position: absolute; border-radius: 12px; background: linear-gradient(90deg, rgba(43,127,217,.20), rgba(43,127,217,.05));
            box-shadow: inset 3px 0 0 #5DB3F0; z-index: 3; }
.pn .pnItem { position: absolute; display: flex; align-items: center; white-space: nowrap; font-weight: 600; z-index: 3; }
.pn .pnItem.gh { color: rgba(191,227,255,.6); }
.pn .pnItem.gh .ghb { position: absolute; inset: 5px 0; border: 1.5px dashed rgba(191,227,255,.42); border-radius: 12px; }
.pn .pnRing { position: absolute; border-radius: 12px; box-shadow: 0 0 0 2.5px #5DB3F0; z-index: 3; }
.pn .pnUser { position: absolute; display: flex; align-items: center; border-radius: 14px; background: rgba(243,245,250,.04); border: 1px solid rgba(255,255,255,.07); z-index: 3; }
.pn .pnBlk { position: absolute; z-index: 1; }
.pnCursor { position: absolute; left: 0; top: 0; width: 34px; height: 34px; pointer-events: none; }
.pnRipple { position: absolute; border-radius: 50%; border: 2px solid rgba(191,227,255,.9); }
/* dikey kısa video kartı (logosuz) */
.vcard { position: absolute; border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,.10); box-shadow: 0 16px 40px rgba(0,0,0,.45); }
.vcard .vPlay { position: absolute; left: 50%; top: 46%; width: 3em; height: 3em; margin: -1.5em 0 0 -1.5em; border-radius: 50%;
                background: rgba(7,10,18,.55); border: 1px solid rgba(255,255,255,.3); display: grid; place-items: center; }
.vcard .vBar { position: absolute; left: .7em; right: .7em; bottom: .8em; height: .28em; border-radius: 99px; background: rgba(255,255,255,.22); overflow: hidden; }
.vcard .vBar b { position: absolute; left: 0; top: 0; bottom: 0; background: #F3F5FA; border-radius: 99px; }
`;
  document.head.appendChild(st);

  // ===== ikonlar (24'lük çizgi ikonlar) =====
  const ICO = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    library: '<path d="M4 4v16M8.5 4v16M13 4v16M17 5l4 15"/>',
    users: '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75M22 21v-2a4 4 0 0 0-3-3.87"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
    tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    trend: '<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    brief: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20"/>',
    film: '<rect x="2" y="3" width="20" height="18" rx="2.5"/><path d="M7 3v18M17 3v18M2 12h20M2 7.5h5M2 16.5h5M17 7.5h5M17 16.5h5"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    text: '<path d="M4 6h16M4 10h16M4 14h11M4 18h7"/>',
    code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
    building: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h3a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowD: '<path d="M12 4v15M6 13l6 6 6-6"/>',
    arrowU: '<path d="M12 20V5M6 11l6-6 6 6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    lira: '<path d="M9 3v17a7 7 0 0 0 7-7M5 10.5l8-3M5 14.5l8-3"/>',
    layers: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>',
    refresh: '<path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
    mega: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.2"/>',
    bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    globe: '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5a14 14 0 0 1 0 19M12 2.5a14 14 0 0 0 0 19"/>',
    pin: '<path d="M12 17v5M9 3h6l-1 6 3 3H7l3-3z"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    board: '<rect x="2" y="3" width="20" height="13" rx="2"/><path d="M12 16v5M8 21h8"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
    flag: '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
    hand: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
  };
  TP.ICO = ICO;
  TP.ic = (n, s = 24, c = 'currentColor', w = 1.9) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${ICO[n]}</svg>`;
  TP.icE = (n, e = 1.2, c = 'currentColor', w = 1.9) => `<svg style="width:${e}em;height:${e}em" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${ICO[n]}</svg>`;
  const { ic, icE } = TP;
  TP.kick = (txt, icon, fs = .86) => `<div class="yk yrow" style="font-size:${fs}em;gap:.5em;letter-spacing:.1em">${icon ? icE(icon, 1.15, '#5DB3F0', 2) : '<i class="ydot"></i>'}${txt}</div>`;
  TP.chk = (s = '1.7em', o = 1) => `<span class="ychk" style="width:${s};height:${s};opacity:${o}">${icE('check', .62, '#fff', 3.2).replace('style="', 'style="flex:none;transform:scale(1.35);')}</span>`;

  // ===== genel parçalar =====
  function show(el, o, tr) { el.style.opacity = o.toFixed(4); el.style.visibility = o > .002 ? 'visible' : 'hidden'; if (tr != null) el.style.transform = tr; }
  TP.show = show;
  // giriş/çıkış: up (süzülme), pop (yay; küçük öğeler), fade, left
  function inout(t, a, out, fx = 'up', d = .5, dy = 16, od = .3) {
    if (t < a) return [0, ''];
    let o, tr = '';
    if (fx === 'pop') { const k = spring(t - a, .62, 2.6); o = clamp((t - a) / .12); tr = `scale(${lerp(.55, 1, k).toFixed(4)})`; }
    else if (fx === 'fade') o = eo(t, a, d);
    else if (fx === 'left') { const k = eo(t, a, d); o = k; tr = `translateX(${(-(1 - k) * dy).toFixed(2)}px)`; }
    else { const k = eo(t, a, d); o = k; tr = `translateY(${((1 - k) * dy).toFixed(2)}px) scale(${lerp(.975, 1, k).toFixed(4)})`; }
    const q = ei(t, out, od); o *= 1 - q;
    if (q > 0) tr += ` translateY(${(-q * 8).toFixed(2)}px)`;
    return [o, tr];
  }
  TP.inout = inout;
  // süzülen parça: kutu (x, y, w, h) + html; upd(t, el) içeriği canlandırır (yalnız görünürken)
  TP.it = ({ x, y, w, h, html, t, out = Infinity, fx = 'up', d = .5, dy = 16, od = .3, cls = '', st: sty = '', origin, upd }) => ({
    html: `<div class="abs yz yzI ${cls}" style="left:${x}px;top:${y}px;${w != null ? `width:${w}px;` : ''}${h != null ? `height:${h}px;` : ''}${origin ? `transform-origin:${origin};` : ''}${sty}">${html}</div>`,
    render(tt, r) { const el = r.firstChild, [o, tr] = inout(tt, t, out, fx, d, dy, od); show(el, o, tr); if (upd && o > 0) upd(tt, el); },
  });
  // çizilen yol (SVG kutusu yalnız yolu kapsar: box = [x, y, w, h] sahne koordinatı)
  TP.path = ({ d, box, t, dur = .6, out = Infinity, color = '#5DB3F0', w = 3, od = .3, op = 1 }) => ({
    html: `<svg class="abs" style="left:${box[0]}px;top:${box[1]}px;overflow:visible" width="${box[2]}" height="${box[3]}" viewBox="${box.join(' ')}"><path pathLength="1" d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray:1 1"/></svg>`,
    render(tt, r) { const s = r.firstChild, p = io(tt, t, dur); s.firstChild.style.strokeDashoffset = (1 - p).toFixed(4); show(s, (tt >= t ? op : 0) * (1 - ei(tt, out, od))); },
  });
  // yay girişli küçük öğe (rozet, tik) ve tik yardımcıları
  TP.popIn = (e, tt, tk) => { if (!e) return; const k = tt >= tk ? spring(tt - tk, .62, 2.6) : 0; e.style.opacity = clamp((tt - tk) / .1).toFixed(3); e.style.transform = `scale(${lerp(.5, 1, k).toFixed(3)})`; };
  TP.tickUpd = (sel, tk) => (tt, el) => { const e = el.querySelector(sel); if (!e) return; const k = tt >= tk ? spring(tt - tk, .6, 2.8) : 0; e.style.opacity = clamp((tt - tk) / .1).toFixed(3); e.style.transform = `scale(${lerp(.4, 1, k).toFixed(3)})`; };

  // ===== fare imleci (masaüstü site): keys [{t (varış), to: {x,y} | fn(t) | {menu|blk|sel}, d, click (true | t), hold}] =====
  const CURSOR_SVG = '<svg class="pnCursor" viewBox="0 0 34 34" width="34" height="34"><path d="M6 3.5v23.2l6.1-5.6 4.1 9.2 4.3-1.9-4.1-9.1 8.3-.4z" fill="#fff" stroke="#0A1122" stroke-width="2" stroke-linejoin="round"/></svg>';
  function cursorAt(tt, keys, resolve) {
    let p = resolve(keys[0].to, tt), op = 0, sc = 1, rip = null;
    keys.forEach((k, i) => {
      const d = k.d ?? .6, s = k.t - d;
      if (i > 0 && tt >= s) p = (q => ({ x: lerp(p.x, q.x, io(tt, s, d)), y: lerp(p.y, q.y, io(tt, s, d)) }))(resolve(k.to, tt));
      const nx = keys[i + 1], e = k.t + (k.hold ?? (nx && nx.t - (nx.d ?? .6) - k.t < 2.2 ? 99 : 1.1));
      op = Math.max(op, eo(tt, s - .3, .25) * (1 - ei(tt, Math.min(e, nx ? nx.t : e) + .25, .25)));
      if (k.click) { const c = k.click === true ? k.t + .1 : k.click; sc = Math.min(sc, 1 - .18 * bump(tt, c, .2)); if (tt >= c && tt < c + .5) rip = prog(tt, c, c + .5); }
    });
    return { p, op, sc, rip };
  }
  function drawCursor(el, s) {
    const { p, op, sc, rip } = s, cur = el.querySelector('.pnCursor'), rp = el.querySelector('.pnRipple');
    show(el, op, `translate(${(p.x - 6).toFixed(1)}px,${(p.y - 3.5).toFixed(1)}px)`);
    cur.style.transform = `scale(${sc.toFixed(3)})`; cur.style.transformOrigin = '6px 3.5px';
    if (rip != null) { const r = lerp(6, 34, E.outCubic(rip)); css(rp, { display: 'block', left: (6 - r) + 'px', top: (3.5 - r) + 'px', width: 2 * r + 'px', height: 2 * r + 'px', opacity: (.8 * (1 - rip)).toFixed(3) }); }
    else rp.style.display = 'none';
  }
  TP.CURSOR_SVG = CURSOR_SVG; TP.cursorAt = cursorAt; TP.drawCursor = drawCursor;
  TP.cursor = (keys) => ({
    html: `<div class="abs" style="left:0;top:0;width:34px;height:34px">${'<div class="pnRipple"></div>' + CURSOR_SVG}</div>`,
    render(tt, r) { drawCursor(r.firstChild, cursorAt(tt, keys, (to, t) => typeof to === 'function' ? to(t) : to)); },
  });

  // ===== panel blok yardımcıları (em; içerik tabanı 28 px) =====
  TP.card = (inner, pad = '1em 1.2em', cls = '') => `<div class="yc ${cls}" style="position:absolute;inset:0;padding:${pad};overflow:hidden">${inner}</div>`;
  TP.plain = inner => `<div style="position:absolute;inset:0">${inner}</div>`;
  TP.title = (txt, fs = 1.9) => `<div class="yh" style="font-size:${fs}em">${txt}</div>`;
  TP.thumbBg = i => ['linear-gradient(135deg,#17406F,#0E1A33)', 'linear-gradient(135deg,#0F4C5C,#0E1A33)', 'linear-gradient(135deg,#253A7A,#0E1A33)', 'linear-gradient(135deg,#1B3B5A,#101D38)',
    'linear-gradient(135deg,#1F4E8C,#0B1830)', 'linear-gradient(135deg,#0E5A6B,#0B1830)'][i % 6];
  TP.skel = ws_ => ws_.map((w, i) => `<div class="ysk" style="height:.4em;width:${w}%;margin-top:${i ? .45 : .7}em"></div>`).join('');
  // gönderi başlığı: avatar (anonim kişi simgesi ya da eğitmen kalkanı) + ad + rozet + alt satır (kanal adı)
  TP.postHead = (name, badge, sub, anon = true) => `<div class="yrow" style="gap:.55em"><div class="yav ${anon ? 'anon' : ''}" style="width:1.75em;height:1.75em;font-size:1em">${anon ? icE('user', .95, 'rgba(243,245,250,.7)', 1.8) : icE('shield', .95, '#fff', 1.9)}</div>
    <div style="line-height:1.2;min-width:0"><div class="yrow" style="gap:.4em"><span class="yt" style="font-weight:800;font-size:1em">${name}</span>${badge || ''}</div><div class="ym" style="font-size:.86em">${sub}</div></div></div>`;
  TP.postCard = (name, badge, lines, sub = 'Genel sohbet', anon = true, pad = '.8em 1em') => TP.card(TP.postHead(name, badge, sub, anon) + lines, pad);
  TP.eduBadge = '<span class="ypill s" style="font-size:.86em;padding:.08em .5em">' + icE('shield', .95, '#BFE3FF', 2) + 'Eğitmen</span>';

  // ===== PANEL (üye paneli) =====
  // Tek arayüz iki yerleşimde: u = 0 sağ pencere (kişi tam ekranda, yanında), u = 1 tam ekran (gizli an). Kabuk, menü ve bloklar
  // u ile yeni yerlerine akar (blok W: pencere, F: tam ekran dikdörtgeni [x, y, w, h], içerik alanına göre; yazı ölçeği iki modda aynı).
  // Parametreler:
  //   win / full: kabuk dikdörtgenleri (vars. tanıtım videosu: {1052, 66, 772, 728} / {96, 58, 1728, 742})
  //   menu: [[anahtar, etiket, ikon], ...] (gerçek panel menüsü), ghosts: {t, n, label, icon, out, wiggle} kesik çizgili kilitli boş öğeler (adsız)
  //   uKeys: [{t, to, d}] pencere <-> tam ekran (geçiş t'de başlar); drawer: [{a, b}] pencerede menü çekmecesi açılır (etiketli, içerik kararır)
  //   enter: {t, d, s (giriş ölçeği), stagger}, out, active: [{t, key}], cursor: [...], bell: {jig, dot}, url, logoT
  //   ring: [{key, a, b}] menü öğesine nabız halkası; blocks: [{id, t, out, W, F, html, upd(t, el, g), fx, d, dy, od, only: 'full'|'win', moves:[{a,b,W,F}], z, fs}]
  //   kmW / kmF: menü yazı ölçeği (taban 17 px)
  const DEF_MENU = [['home', 'Ana Sayfa', 'home'], ['egitim', 'Eğitimler', 'book'], ['kutup', 'Kütüphane', 'library'], ['topluluk', 'Topluluk', 'users'],
    ['takvim', 'Takvim', 'calendar'], ['hesap', 'Hesabım', 'user']];
  TP.MENU = DEF_MENU;
  const lr = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u) });
  const A4 = a => Array.isArray(a) ? { x: a[0], y: a[1], w: a[2], h: a[3] } : a;
  TP.panel = ({ id, from, to, win = { x: 1052, y: 66, w: 772, h: 728 }, full = { x: 96, y: 58, w: 1728, h: 742 }, kc = 1.75, kmW = 1.2, kmF = 1.45,
    u0 = 0, uKeys = [], enter, out = Infinity, active = [], menu = DEF_MENU, ghosts, drawer = [], ring = [], blocks = [], cursor = [], bell = {}, logoT = -1,
    url = (B.url ? B.url + '/panel' : 'ornekmarka.com/panel'), z = 6, user = { name: 'Ayşe Y.', sub: 'Tam erişim', initials: 'AY' } }) => {
    const items = menu.map(m => [...m]);
    const nG = ghosts ? ghosts.n ?? 2 : 0;
    const uAt = t => { let u = u0; for (const k of uKeys) { if (t < k.t) break; u = lerp(u, k.to, io(t, k.t, k.d ?? .8)); } return u; };
    const soAt = t => drawer.reduce((m, d) => Math.max(m, io(t, d.a, d.d ?? .5) * (1 - io(t, d.b - (d.d ?? .5), d.d ?? .5))), 0);
    const rectAt = (b, key, t) => { let r = A4(key === 'F' ? (b.F ?? b.W) : b.W);
      for (const m of b.moves || []) { if (t < m.a) break; const nx = key === 'F' ? (m.F ?? (b.F ? null : m.W)) : m.W; if (nx) r = lr(r, A4(nx), io(t, m.a, m.b - m.a)); } return r; };
    const html = `<div class="pn yz">
        <div class="pnBg"></div><div class="pnSide"></div><div class="pnDim"></div>
        <div class="pnBar"><div class="pnDots"><b></b><b></b><b></b></div><div class="pnUrl">${icE('lock', 1, 'currentColor', 2.2)}<span>${url}</span></div><div class="pnBell">${ic('bell', 22, 'rgba(243,245,250,.8)', 1.9)}<i></i></div></div>
        <img class="pnLogo" src="${TP.LOGO}" alt=""><img class="pnMark" src="${TP.MARK}" alt="">
        <div class="pnHi"></div><div class="pnRing"></div>
        ${items.map(m => `<div class="pnItem" data-k="${m[0]}"><span class="pi" style="position:relative">${icE(m[2], 1.2, 'currentColor', 1.9)}</span><span class="pl" style="margin-left:.75em">${m[1]}</span></div>`).join('')}
        ${[...Array(nG).keys()].map(i => `<div class="pnItem gh" data-g="${i}"><i class="ghb"></i><span class="pi gl" style="position:relative">${icE(ghosts.icon || 'lock', 1.2, 'currentColor', 1.9)}</span><span class="pl" style="margin-left:.75em">${ghosts.label || 'Yakında'}</span></div>`).join('')}
        <div class="pnUser"><div class="yav ${user.initials ? '' : 'anon'}" style="width:2.5em;height:2.5em;font-size:.85em">${user.initials || icE('user', 1.15, 'currentColor', 2)}</div><div class="pl" style="margin-left:.75em;line-height:1.25;white-space:nowrap"><div class="yt" style="font-weight:700">${user.name}</div><div style="color:#5DB3F0;font-weight:600;font-size:.86em">${user.sub}</div></div></div>
        ${blocks.map(b => `<div class="pnBlk yz" data-b="${b.id}">${b.html}</div>`).join('')}
      </div>
      <div class="abs pnCurW" style="left:0;top:0;width:34px;height:34px"><div class="pnRipple"></div>${CURSOR_SVG}</div>`;
    const part = {
      html,
      render(t, r) {
        const c = r._c || (r._c = { pn: r.querySelector('.pn'), side: r.querySelector('.pnSide'), dim: r.querySelector('.pnDim'), bar: r.querySelector('.pnBar'), dots: r.querySelector('.pnDots'),
          url: r.querySelector('.pnUrl'), bell: r.querySelector('.pnBell'), dot: r.querySelector('.pnBell i'), logo: r.querySelector('.pnLogo'), mark: r.querySelector('.pnMark'),
          hi: r.querySelector('.pnHi'), ring: r.querySelector('.pnRing'), items: [...r.querySelectorAll('.pnItem:not(.gh)')], gh: [...r.querySelectorAll('.pnItem.gh')],
          user: r.querySelector('.pnUser'), blks: [...r.querySelectorAll('.pnBlk')], cur: r.querySelector('.pnCurW') });
        const u = uAt(t), so = soAt(t), wS = Math.max(u, so);                  // wS: menü geometrisi (tam ekran ya da çekmece)
        const P = lr(win, full, u), BAR = lerp(44, 48, u), sbC = lerp(78, 270, u), sb = lerp(78, lerp(270, 300, so * (1 - u)), wS);
        const px = lerp(22, 40, u), py = lerp(18, 24, u), km = lerp(kmW, kmF, wS);
        let o = 1, sc = 1;
        if (enter) { const k = eo(t, enter.t, enter.d ?? .55); o = k; sc = lerp(enter.s ?? .97, 1, k); }
        o *= 1 - ei(t, out, .4);
        css(c.pn, { left: P.x + 'px', top: P.y + 'px', width: P.w + 'px', height: P.h + 'px', transformOrigin: '50% 50%' });
        c.pn.style.setProperty('--k', kc.toFixed(4)); c.pn.style.setProperty('--u', u.toFixed(4));
        show(c.pn, o, `scale(${sc.toFixed(4)})`);
        if (o <= .002) { show(c.cur, 0); return; }
        const stg = i => enter ? eo(t, enter.t + .15 + i * (enter.stagger ?? .05), .4) : 1;   // kabuk öğeleri sırayla
        const lab = Math.max(clamp((u - .35) / .45), clamp((so - .3) / .5));        // menü etiketleri (tam ekran / çekmece)
        css(c.bar, { height: BAR + 'px' });
        css(c.dots, { left: '18px', top: (BAR / 2 - 5) + 'px' });
        css(c.url, { left: '74px', top: (BAR / 2 - 16) + 'px', height: '32px', fontSize: '20px' });
        css(c.bell, { right: '16px', top: (BAR / 2 - 15) + 'px', transform: `rotate(${(14 * Math.sin((t - (bell.jig ?? -9)) * 28) * bump(t, bell.jig ?? -9, .7)).toFixed(2)}deg)` });
        c.dot.style.opacity = t >= (bell.dot ?? Infinity) ? eo(t, bell.dot, .2).toFixed(3) : '0';
        css(c.side, { top: BAR + 'px', width: sb + 'px', background: so > 0 && u < 1 ? `rgba(${lerp(7, 10, so).toFixed(0)},${lerp(10, 17, so).toFixed(0)},${lerp(18, 34, so).toFixed(0)},${lerp(.45, 1, so * (1 - u)).toFixed(3)})` : '',
          boxShadow: so > 0 ? `${(24 * so * (1 - u)).toFixed(1)}px 0 50px rgba(0,0,0,${(.5 * so * (1 - u)).toFixed(3)})` : '' });
        show(c.dim, so * (1 - u));
        // logo (tam ekran, 220 px) <-> işaret (ray ve çekmece: menü 9 öğeye kadar pencereye sığar)
        const lw = lerp(100, 220, u), mw = lerp(48, 140, u), lt = BAR + lerp(16, 22, u), ll = lerp(15, 25, wS);
        css(c.logo, { left: ll + 'px', top: lt + 'px', width: lw + 'px' }); show(c.logo, (t >= logoT ? 1 : 0) * clamp(u * 1.6 - .6) * stg(0));
        css(c.mark, { left: ll + 'px', top: lt + 'px', width: mw + 'px' }); show(c.mark, clamp(1 - u * 1.6) * stg(0));
        // menü
        const mTop = BAR + lerp(16, 22, u) + lerp(38, 107.5, u) + lerp(26, 30, u), rh = 58, mx = lerp(11, 18, wS), mwid = sb - 2 * mx;
        const fsz = 17 * km, icw = 1.2 * fsz;
        const yOf = key => mTop + rh * items.findIndex(m => m[0] === key);
        let ai = 0; for (let i = 0; i < active.length; i++) if (t >= active[i].t) ai = i;
        const ac = active[ai] || { key: 'home', t: -9 }, ap = ai > 0 ? active[ai - 1] : ac, am = io(t, ac.t, .32);
        const hy = lerp(yOf(ap.key), yOf(ac.key), am);
        css(c.hi, { left: mx + 'px', top: (hy + 4) + 'px', width: mwid + 'px', height: (rh - 8) + 'px' }); show(c.hi, stg(2) * (ac.key ? 1 : 0));
        const itemX = mx + lerp((mwid - icw) / 2, 14 * km, wS);
        c.items.forEach((el, j) => {
          const key = items[j][0], a = key === ac.key ? am : key === ap.key && ap !== ac ? 1 - am : 0;
          css(el, { left: itemX + 'px', top: (mTop + rh * j) + 'px', height: rh + 'px', fontSize: fsz.toFixed(2) + 'px', color: `rgba(243,245,250,${(.58 + .42 * a).toFixed(3)})` });
          el.querySelector('.pl').style.opacity = lab.toFixed(3);
          show(el, stg(j + 1), '');
        });
        // nabız halkası (menü öğesi)
        let ro = 0, rk = null;
        for (const g of ring) { const v = eo(t, g.a, .3) * (1 - ei(t, g.b, .3)); if (v > ro) { ro = v; rk = g; } }
        if (rk) { const ph = Math.max(0, t - rk.a), pul = .5 + .5 * Math.cos(ph * 5.2);
          css(c.ring, { left: mx + 'px', top: (yOf(rk.key) + 4) + 'px', width: mwid + 'px', height: (rh - 8) + 'px', boxShadow: `0 0 0 ${(2 + 2.5 * pul).toFixed(2)}px rgba(93,179,240,${(.55 + .4 * pul).toFixed(3)})` }); }
        show(c.ring, ro);
        // kilitli boş öğeler (adsız, "Yakında")
        c.gh.forEach((el, i) => {
          const gt = ghosts.t + i * (ghosts.stagger ?? .15), k = eo(t, gt, .45) * (1 - ei(t, ghosts.out ?? Infinity, .35));
          const wig = ghosts.wiggle != null ? 9 * Math.sin((t - ghosts.wiggle - i * .08) * 30) * bump(t, ghosts.wiggle + i * .08, .5) : 0;
          css(el, { left: itemX + 'px', top: (mTop + rh * (items.length + i)) + 'px', height: rh + 'px', width: (mwid - (itemX - mx)) + 'px', fontSize: fsz.toFixed(2) + 'px' });
          const gl = el.querySelector('.gl'); gl.style.transform = `rotate(${wig.toFixed(2)}deg)`;
          el.querySelector('.ghb').style.left = (-(itemX - mx) + 4) + 'px';
          el.querySelector('.pl').style.opacity = lab.toFixed(3);
          show(el, k, `translateY(${((1 - k) * 10).toFixed(1)}px)`);
        });
        const uh = lerp(56, 66, wS), ufs = 14 * km;
        css(c.user, { left: mx + 'px', width: mwid + 'px', top: (P.h - 14 - uh) + 'px', height: uh + 'px', padding: `0 ${lerp((mwid - 2.125 * ufs) / 2, 10 * km, wS)}px`, fontSize: ufs.toFixed(2) + 'px' });
        c.user.querySelector('.pl').style.opacity = lab.toFixed(3);
        show(c.user, stg(9));
        // içerik blokları (konum: içerik alanı = sol ray/menünün sağı; çekmece içeriği itmez, üstüne açılır)
        const rects = {};
        c.blks.forEach((el, i) => {
          const b = blocks[i];
          let [bo, tr] = inout(t, b.t, b.out ?? Infinity, b.fx || 'up', b.d ?? .45, b.dy ?? 12, b.od ?? .25);
          if (b.only === 'full') bo *= u; if (b.only === 'win') bo *= 1 - u;
          const R = lr(rectAt(b, 'W', t), rectAt(b, 'F', t), u);
          const L = sbC + px + R.x, T = BAR + py + R.y;
          rects[b.id] = { x: P.x + L, y: P.y + T, w: R.w, h: R.h };          // görünmese de: imleç hedefi (saf t fonksiyonu)
          if (bo <= .002) { show(el, 0); return; }
          css(el, { left: L.toFixed(2) + 'px', top: T.toFixed(2) + 'px', width: R.w.toFixed(2) + 'px', height: R.h.toFixed(2) + 'px', fontSize: ((b.fs ?? 16) * kc).toFixed(3) + 'px',
            zIndex: b.z ?? '' });
          show(el, bo, tr);
          if (b.upd) b.upd(t, el, { u, k: kc, w: R.w, h: R.h, so });
        });
        // imleç
        if (cursor.length) {
          const resolve = to => {
            if (to.menu) { const y = yOf(to.menu); return { x: P.x + itemX + icw / 2 + lab * 70, y: P.y + y + rh / 2 }; }
            if (to.blk) { const q = rects[to.blk] || { x: 0, y: 0, w: 0, h: 0 }; return { x: q.x + (to.ax ?? .5) * q.w, y: q.y + (to.ay ?? .5) * q.h }; }
            if (to.sel) { const e = r.querySelector(to.sel); const q = e ? e.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 }; return { x: q.left + (to.ax ?? .5) * q.width, y: q.top + (to.ay ?? .5) * q.height }; }
            return to;
          };
          const cs = cursorAt(t, cursor, resolve); cs.op *= o; drawCursor(c.cur, cs);
        } else show(c.cur, 0);
      },
    };
    return L.scene({ id, from, to, z, parts: [part] });
  };

  // ===== tarayıcı penceresi (panelle aynı kabuk: adres yazılır, sayfa yüklenir) =====
  // url: {a, b, text, from} -> a..b arasında harf harf yazılır (imleç yanıp söner); after: {t, text} adres değişir (ör. giriş sonrası panel)
  // page: html (içerik alanı, pencerenin adres çubuğu altı), pageT: sayfanın yüklendiği an; upd(t, el) içeriği canlandırır
  TP.browser = ({ x = 1052, y = 66, w = 772, h = 728, t, out = Infinity, od = .3, url = {}, after, page = '', pageT = Infinity, upd }) => TP.it({ x, y, w, h, t, out, od, d: .5,
    html: `<div class="pn" style="position:absolute;inset:0;opacity:1;visibility:visible">
      <div class="pnBg"></div>
      <div class="pnBar" style="height:44px"><div class="pnDots" style="left:18px;top:17px"><b></b><b></b><b></b></div>
        <div class="pnUrl bu" style="left:74px;top:6px;height:32px;font-size:20px;min-width:300px">${icE('search', 1, 'currentColor', 2.2)}<span class="ut"></span><i class="uc" style="display:inline-block;width:2px;height:22px;background:#5DB3F0;margin-left:-4px"></i></div></div>
      <div class="bpg" style="position:absolute;left:0;right:0;top:44px;bottom:0">${page}</div></div>`,
    upd(tt, el) {
      const n = Math.round(clamp((tt - (url.a ?? 0)) / Math.max(.01, (url.b ?? 0) - (url.a ?? 0))) * (url.text || '').length);
      let txt = (url.text || '').slice(0, tt < (url.a ?? Infinity) ? 0 : n);
      if (after && tt >= after.t) txt = after.text;
      el.querySelector('.ut').textContent = txt;
      const typing = tt < (url.b ?? 0) + .5 && !(after && tt >= after.t);
      el.querySelector('.uc').style.opacity = (typing ? (Math.floor(tt * 2.6) % 2 ? .15 : 1) : 0).toString();
      const pg = el.querySelector('.bpg'), k = eo(tt, pageT, .45); pg.style.opacity = k.toFixed(3);
      if (upd && k > 0) upd(tt, el);
    } });

  // ===== dikey kısa video kartı (logosuz; Reels/TikTok GİBİ ama marka yok) =====
  TP.vCard = (i, icon) => `<div class="vcard" style="background:${TP.thumbBg(i)}"><div class="vi" style="position:absolute;left:50%;top:22%;transform:translateX(-50%);opacity:.9">${icE(icon || ['zap', 'film', 'search', 'code', 'trend', 'tool', 'bulb', 'globe', 'layers', 'chat'][i % 10], 2.2, '#BFE3FF', 1.5)}</div>
    <div class="vPlay"><span class="pi">${icE('play', 1.3, '#fff')}</span><span class="pa" style="display:none">${icE('pause', 1.3, '#fff', 2.6)}</span></div>
    <div style="position:absolute;left:.8em;right:.8em;bottom:2em"><div class="ysk" style="height:.45em;width:80%;background:rgba(255,255,255,.28)"></div><div class="ysk" style="height:.45em;width:55%;margin-top:.45em;background:rgba(255,255,255,.18)"></div></div>
    <div class="vBar"><b style="width:${[30, 0, 55, 10, 0, 70, 20, 0, 40, 0][i % 10]}%"></b></div></div>`;

  // ===== sağ sahne koyuluğu (okunurluk; yalnız tam ekranda görünür, gizlide zemin örter) =====
  TP.scrim = ({ on = [[0, 1e9]], x = 820, z = 2 } = {}) => L.scene({ id: 'scrim', z, parts: [{
    html: `<div class="abs" data-safe="ignore" style="left:${x}px;top:0;width:${1920 - x}px;height:1080px;background:linear-gradient(90deg, rgba(7,10,18,0) 0%, rgba(7,10,18,.34) 26%, rgba(7,10,18,.5) 52%, rgba(7,10,18,.58) 100%)"></div>`,
    render(t, r) { let o = 0; for (const [a, b] of on) o = Math.max(o, (a <= 0 ? 1 : io(t, a, .7)) * (1 - io(t, b - .7, .7))); r.firstChild.style.opacity = o.toFixed(4); },
  }] });

  // ===== son kart: logo maskeyle açılır, arkasında yörünge izinde ince ışık noktası; adres, slogan =====
  // Logo kuralları: eşit ölçek, maske + opaklık; esnetme / döndürme / gölge / parıltı yok (ışık noktası logonun ARKASINDA, ayrı eleman).
  TP.endCard = ({ t: END, total, w: ELW = 720, y: ELY = 200, url = B.url, tagline = B.tagline, z = 9 }) => {
    const ELH = ELW * TP.LOGO_AR, ELX = 960 - ELW / 2, ES = ELW / 3142;
    const orbit = ph => { const th = -14.05 * Math.PI / 180, cx = 1571.3, cy = 774.3, rx = 1550.8, ry = 610.8, c = Math.cos(ph), sn = Math.sin(ph);   // PNG'deki yörünge elipsi (px)
      return { x: ELX + ES * (cx + rx * c * Math.cos(th) - ry * sn * Math.sin(th)), y: ELY + ES * (cy + rx * c * Math.sin(th) + ry * sn * Math.cos(th)) }; };
    return L.scene({ id: 'endc', from: END, z, parts: [{
      html: `<div class="abs yz" style="left:0;top:0;width:1920px;height:1080px"><div class="eb" data-safe="ignore" style="position:absolute;inset:0;background:radial-gradient(60% 55% at 50% 32%, rgba(43,127,217,.22), rgba(43,127,217,0) 70%), linear-gradient(180deg,#0A1122,#070A12)"></div>
        <div class="od" style="position:absolute;left:-19px;top:-19px;width:38px;height:38px;border-radius:50%;background:radial-gradient(circle, #FFFFFF 0%, #FFFFFF 18%, #BFE3FF 32%, rgba(93,179,240,.45) 54%, rgba(93,179,240,0) 74%)"></div>
        <img class="el" src="${TP.LOGO}" style="position:absolute;left:${ELX}px;top:${ELY}px;width:${ELW}px;transform-origin:50% 50%" alt="">
        <div class="eu" style="position:absolute;left:0;right:0;top:${ELY + ELH + 56}px;text-align:center;font-size:44px;font-weight:800;color:#5DB3F0">${url}</div>
        <div class="et" style="position:absolute;left:0;right:0;top:${ELY + ELH + 124}px;text-align:center;font-size:34px;font-weight:600;color:rgba(243,245,250,.88)">${tagline}</div></div>`,
      render(t, r) { const el = r.firstChild; show(el.querySelector('.eb'), io(t, END, .35));
        const a0 = END + .15, k = eo(t, a0, .9), lg = el.querySelector('.el');
        show(lg, Math.min(1, k * 1.4), `scale(${lerp(.96, 1, E.outCubic(prog(t, a0, a0 + 1.1))).toFixed(4)})`);
        lg.style.clipPath = `inset(0 ${((1 - k) * 100).toFixed(2)}% 0 0)`;
        const od = el.querySelector('.od'), ph = -2.2 + 2 * Math.PI * E.inOutCubic(prog(t, END + .5, total)) * .92, p = orbit(ph);
        show(od, eo(t, END + .55, .4), `translate(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px)`);
        [['.eu', END + 1.05], ['.et', END + 1.3]].forEach(([q, a]) => { const v = eo(t, a, .55); show(el.querySelector(q), v, `translateY(${((1 - v) * 14).toFixed(1)}px)`); }); } }] });
  };

  window.TP = TP;
})();
