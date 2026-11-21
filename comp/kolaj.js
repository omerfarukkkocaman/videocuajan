// Kolaj + sinematik bileşenleri (stok montaj, kind: montage; stok-montaj.md).
// Yükleme: plan.json "libs": ["kolaj"] -> render.mjs engine.js + library.js'ten SONRA yükler (diğer projeler etkilenmez).
// Global: window.K. Parçalar L.scene({z, parts:[...]}) içine konur: {html, render(t, root)}; her kare t'den saf.
//
// Taban görüntü: motorun yüz katmanı yerine K.plate kendi tuvalinde (canvas) çizer; maskeli kesitler (K.cutout) aynı çizim
// yolunu kullandığı için piksel piksel hizalıdır. Kare görüntüleri ve maskeler renderAt'tan ÖNCE yüklenir (K.need -> prep),
// tuvallere eşzamanlı çizilir (boş kare olmaz).
//
// Z önerisi: 2 taban (K.plate) -> 3 nesnenin arkası (yazı, pencere) -> 4 kesit (K.cutout) -> 5-6 ön (çıkartma, marker, not)
//            -> 7 film (gren, vinyet) -> 8 altyazı (motor) -> 10 flaş (motor).
// Güvenli alan: tam ekran görüntü katmanları data-safe=ignore; tuvale çizilen yazılar (K.window) için ölçülen bir 'probe' kutusu
// konur (denetim yazının gerçek kutusunu görür). Çıkartma/not/marker DOM'dadır ve denetime girer.
(function () {
  const { clamp, lerp, prog, E, spring, css, FPS, W, H } = window.M;
  const TL = window.TIMELINE, B = window.BRAND || {};
  const NF = TL.frames, VIDEO_END = TL.frames / FPS;
  const IVORY = '#F4EFE6', INK = '#1C1812', YEL = (B.colors && B.colors.yellow) || '#FFD23F', RED = '#E5383B';
  const COND = "'Avenir Next Condensed', 'Bahnschrift SemiBold Condensed', 'Mont', sans-serif", HAND = "'Marker Felt', 'Noteworthy', 'Segoe Print', 'Mont', sans-serif";
  const pad4 = n => String(n).padStart(4, '0');
  const fileAt = t => clamp(Math.floor(t * FPS + 1e-6), 0, NF - 1) + 1;       // motorla aynı: t -> 1 tabanlı kare dosyası
  const frameUrl = n => `${window.FACE_DIR || 'work/face/'}${pad4(clamp(Math.round(n), 1, NF))}.jpg`;
  const maskUrl = (dir, n) => `work/masks/${dir}/maske/${pad4(n)}.png`;
  const asset = f => (B.base || '') + f;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const fnv = v => typeof v === 'function' ? v : () => v;
  const stop = (t, fps = 12) => Math.floor(t * fps + 1e-6) / fps;                   // stop-motion zamanı
  const hash = (a, b = 0, c = 0) => {                                               // tohumlu [0,1)
    let h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x632be5ab, 0xc2b2ae35) ^ Math.imul((c | 0) + 0x27d4eb2f, 0x165667b1);
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d); h = Math.imul(h ^ (h >>> 12), 0x297a2d39); return ((h ^ (h >>> 15)) >>> 0) / 4294967296; };
  const rng = seed => { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

  // ===== kamera: ekran = R·S·(p - o) + o + (x, y) =====
  const CAM0 = { s: 1, x: 0, y: 0, r: 0, ox: W / 2, oy: H / 2 };
  const camOf = c => Object.assign({}, CAM0, c || {});
  const camM = c => { const a = c.r * Math.PI / 180, cs = Math.cos(a) * c.s, sn = Math.sin(a) * c.s;
    return [cs, sn, -sn, cs, c.ox + c.x - (cs * c.ox - sn * c.oy), c.oy + c.y - (sn * c.ox + cs * c.oy)]; };
  const camPt = (c, x, y) => { const m = camM(c); return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; };
  const camCss = c => `matrix(${camM(c).map(v => +v.toFixed(5)).join(',')})`;          // transform-origin: 0 0

  // ===== görüntü önbelleği (LRU) + kare başı ön yükleme =====
  const IMG = new Map();
  function img(url) {
    let e = IMG.get(url);
    if (e) { IMG.delete(url); IMG.set(url, e); return e; }
    const im = new Image(); e = { im, ok: false };
    im.src = url; e.p = im.decode().then(() => { e.ok = true; }, () => { e.bad = true; console.error('YÜKLENEMEDİ (kolaj): ' + url); });
    IMG.set(url, e);
    while (IMG.size > 56) IMG.delete(IMG.keys().next().value);
    return e;
  }
  // rötuş: stokta öne çıkan yazı/logo bölgesi, hemen yanındaki dokudan yumuşak kenarlı yamayla örtülür (plate + cutout aynı kaynağı çizer)
  // retouch({range:[n0,n1], box: n -> [x0,y0,x1,y1] (kaynak px), from: [dx, dy] (kaynak kaydırma), feather: px})
  const RET = [], RETC = new Map();
  const retouch = o => RET.push(o);
  function frameSrc(n) {
    const e = img(frameUrl(n)); if (!e.ok) return null;
    const rs = RET.filter(o => n >= o.range[0] && n <= o.range[1]); if (!rs.length) return e.im;
    let c = RETC.get(n); if (c) return c;
    const iw = e.im.naturalWidth, ih = e.im.naturalHeight; c = mkCanvas(iw, ih); const x = c.getContext('2d'); x.drawImage(e.im, 0, 0);
    for (const o of rs) {
      const [x0, y0, x1, y1] = o.box(n), w = Math.round(x1 - x0), h = Math.round(y1 - y0), f = o.feather ?? 24, [dx, dy] = o.from || [0, 0];
      const pc = mkCanvas(w + 2 * f, h + 2 * f), px = pc.getContext('2d');
      if (o.blur) px.filter = `blur(${o.blur}px)`;
      px.drawImage(e.im, x0 - f + dx, y0 - f + dy, w + 2 * f, h + 2 * f, 0, 0, w + 2 * f, h + 2 * f); px.filter = 'none';
      const mk = mkCanvas(w + 2 * f, h + 2 * f), mx = mk.getContext('2d'); mx.filter = `blur(${f * .45}px)`; mx.fillStyle = '#000';
      mx.beginPath(); mx.ellipse((w + 2 * f) / 2, (h + 2 * f) / 2, w / 2 + f * .35, h / 2 + f * .35, 0, 0, Math.PI * 2); mx.fill();
      px.globalCompositeOperation = 'destination-in'; px.drawImage(mk, 0, 0);
      x.drawImage(pc, x0 - f, y0 - f);
    }
    RETC.set(n, c); while (RETC.size > 6) RETC.delete(RETC.keys().next().value);
    return c;
  }
  const NEEDS = [], POST = [];
  const need = fn => NEEDS.push(fn);
  const R0 = window.renderAt;
  window.renderAt = async function (t) {
    const us = new Set(); for (const f of NEEDS) for (const u of (f(t) || [])) us.add(u);
    await Promise.all([...us].map(u => img(u).p));
    await R0(t);
    for (const f of POST) f(t);
    const pend = [...document.querySelectorAll('img.kimg')].filter(i => !i.complete);
    if (pend.length) await Promise.all(pend.map(i => i.decode().catch(() => {})));
  };
  // eşzamanlı JSON (file:// + --allow-file-access-from-files)
  const json = p => { const x = new XMLHttpRequest(); x.open('GET', p, false); x.send(); return JSON.parse(x.responseText); };

  // ===== maske: gri PNG -> alfa tuvali (beyaz + alfa), kutu ve ham alfa dizisi =====
  const ALPHA = new Map();
  function alpha(dir, n, choke = 0) {
    const key = `${dir}/${n}/${choke}`; let a = ALPHA.get(key); if (a) return a;
    const e = img(maskUrl(dir, n)); if (!e.ok) return null;
    const w = e.im.naturalWidth, h = e.im.naturalHeight, cv = mkCanvas(w, h), x = cv.getContext('2d', { willReadFrequently: true });
    x.drawImage(e.im, 0, 0); const d = x.getImageData(0, 0, w, h), p = d.data, A = new Uint8Array(w * h), k = 1 / (1 - choke);
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let i = 0, j = 0; i < p.length; i += 4, j++) {
      const v = Math.round(clamp((p[i] / 255 - choke) * k) * 255);
      p[i] = p[i + 1] = p[i + 2] = 255; p[i + 3] = v; A[j] = v;
      if (v > 100) { const xx = j % w, yy = (j / w) | 0; if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
    }
    x.putImageData(d, 0, 0);
    a = { cv, A, w, h, box: x1 < 0 ? null : { x0: x0 / w, y0: y0 / h, x1: (x1 + 1) / w, y1: (y1 + 1) / h } };
    ALPHA.set(key, a); while (ALPHA.size > 12) ALPHA.delete(ALPHA.keys().next().value);
    return a;
  }

  // ===== prosedürel kâğıt dokusu (tohumlu; bir kez üretilir) =====
  const TEX = new Map();
  const PAPERS = {
    white: { base: [242, 236, 224], blot: 16, grain: 14, fiber: [255, 255, 250], fiberA: .16, edge: [252, 249, 241] },
    kraft: { base: [206, 180, 140], blot: 22, grain: 16, fiber: [236, 214, 176], fiberA: .2, edge: [232, 214, 182] },
    dark: { base: [24, 21, 18], blot: 10, grain: 9, fiber: [70, 64, 56], fiberA: .22, edge: [196, 188, 172] },
    yellow: { base: [255, 214, 70], blot: 14, grain: 10, fiber: [255, 236, 150], fiberA: .18, edge: [255, 236, 160] },
    tape: { base: [236, 226, 196], blot: 8, grain: 8, fiber: [250, 244, 226], fiberA: .1, edge: [245, 238, 216] },
  };
  function paperTex(kind = 'white', w = 540, h = 960, seed = 7) {
    const key = `${kind}/${w}x${h}/${seed}`; if (TEX.has(key)) return TEX.get(key);
    const P = PAPERS[kind] || PAPERS.white, R = rng(seed), c = mkCanvas(w, h), x = c.getContext('2d');
    x.fillStyle = `rgb(${P.base.join(',')})`; x.fillRect(0, 0, w, h);
    // lekeler: düşük çözünürlüklü gürültü büyütülür
    for (const [div, amp] of [[90, 1], [34, .6]]) {
      const sw = Math.max(2, Math.ceil(w / div)), sh = Math.max(2, Math.ceil(h / div)), s = mkCanvas(sw, sh), sx = s.getContext('2d'), d = sx.createImageData(sw, sh);
      for (let i = 0; i < d.data.length; i += 4) { const v = R(); d.data[i] = d.data[i + 1] = d.data[i + 2] = v > .5 ? 255 : 0; d.data[i + 3] = Math.round(Math.abs(v - .5) * 2 * P.blot * amp); }
      sx.putImageData(d, 0, 0); x.imageSmoothingEnabled = true; x.drawImage(s, 0, 0, w, h);
    }
    // ince gren
    const d = x.getImageData(0, 0, w, h), p = d.data;
    for (let i = 0; i < p.length; i += 4) { const g = (R() - .5) * P.grain; p[i] += g; p[i + 1] += g; p[i + 2] += g * .9; }
    x.putImageData(d, 0, 0);
    // lifler
    x.lineCap = 'round';
    const nf = Math.round(w * h / 2600);
    for (let i = 0; i < nf; i++) {
      const fx = R() * w, fy = R() * h, a = R() * Math.PI * 2, L = 6 + R() * 22;
      x.strokeStyle = `rgba(${P.fiber.join(',')},${(P.fiberA * (.4 + R() * .6)).toFixed(3)})`; x.lineWidth = .6 + R() * .9;
      x.beginPath(); x.moveTo(fx, fy); x.quadraticCurveTo(fx + Math.cos(a + .6) * L * .5, fy + Math.sin(a + .6) * L * .5, fx + Math.cos(a) * L, fy + Math.sin(a) * L); x.stroke();
    }
    TEX.set(key, c); return c;
  }
  // yırtık kenarlı dikdörtgen: çevre boyunca çok ölçekli tohumlu sapma
  function tornRect(w, h, amp = 6, seed = 1, step = 7) {
    const R = rng(seed), pts = [], per = 2 * (w + h), n = Math.max(24, Math.round(per / step));
    let big = 0, bigT = 0;
    for (let i = 0; i < n; i++) {
      const s = i / n * per; let x, y, nx, ny;
      if (s < w) { x = s; y = 0; nx = 0; ny = -1; } else if (s < w + h) { x = w; y = s - w; nx = 1; ny = 0; }
      else if (s < 2 * w + h) { x = w - (s - w - h); y = h; nx = 0; ny = 1; } else { x = 0; y = h - (s - 2 * w - h); nx = -1; ny = 0; }
      if (i % 5 === 0) bigT = (R() - .5) * 2; big = lerp(big, bigT, .35);
      const o = amp * (.55 * big + .45 * (R() - .5) * 2) - amp * .5;
      pts.push([x + nx * o, y + ny * o]);
    }
    return pts;
  }
  const polyPath = (x, pts, dx = 0, dy = 0) => { x.beginPath(); pts.forEach(([px, py], i) => i ? x.lineTo(px + dx, py + dy) : x.moveTo(px + dx, py + dy)); x.closePath(); };

  // ===== film: canlı gren + vinyet + kalkık siyahlar (her karede; data-safe=ignore) =====
  // grain: opaklık (overlay), size: gren tanesi (px), vignette: kenar koyuluğu, lift: siyahların kalkacağı renk (lighten)
  // Not: her sahne kendi yığın bağlamıdır (z-index); karışım modu sahne öğesinin kendisine verilir ki alttaki sahnelerle karışsın.
  // K.film(...) -> sahne dizisi (defineVideo scenes içine doğrudan konur; motor diziyi düzleştirir)
  const film = ({ grain = .16, size = 2, vignette = .5, lift = 'rgb(20,16,12)', z = 7, seed = 3, from = 0, to = Infinity } = {}) => {
    const TS = 256, tiles = [];
    const grainPart = {
      html: `<canvas class="k-full k-grain" width="${Math.ceil(W / size)}" height="${Math.ceil(H / size)}" data-safe="ignore" style="width:${W}px;height:${H}px"></canvas>`,
      render(t, r) {
        r.parentElement.style.mixBlendMode = 'overlay';
        const cv = r.firstChild, x = cv.getContext('2d');
        if (!tiles.length) for (let k = 0; k < 4; k++) {                    // 4 gren karosu (tohumlu)
          const c = mkCanvas(TS, TS), cx = c.getContext('2d'), d = cx.createImageData(TS, TS), R = rng(seed * 31 + k);
          for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (R() + R() + R() - 1.5) * 120; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
          cx.putImageData(d, 0, 0); tiles.push(x.createPattern(c, 'repeat'));
        }
        const f = Math.round(t * FPS), pat = tiles[f % 4], ox = Math.floor(hash(f, 11) * TS), oy = Math.floor(hash(f, 23) * TS);
        x.setTransform(1, 0, 0, 1, -ox, -oy); x.fillStyle = pat; x.fillRect(ox, oy, cv.width, cv.height); x.setTransform(1, 0, 0, 1, 0, 0);
        cv.style.opacity = grain;
      },
    };
    const blendPart = (html, mode) => ({ html, render(t, r) { r.parentElement.style.mixBlendMode = mode; } });
    return [
      ...(lift ? [L.scene({ id: 'filmLift', z, from, to, parts: [blendPart(`<div class="k-full" data-safe="ignore" style="background:${lift}"></div>`, 'lighten')] })] : []),
      L.scene({ id: 'filmVig', z, from, to, parts: [blendPart(`<div class="k-full k-vig" data-safe="ignore" style="background:radial-gradient(120% 80% at 50% 46%, rgba(8,6,4,0) 50%, rgba(8,6,4,${vignette}) 100%)"></div>`, 'normal')] }),
      L.scene({ id: 'filmGrain', z, from, to, parts: [grainPart] }),
    ];
  };

  // ===== taban görüntü: kare + kamera + renk (filtre) + bulanık dolgu =====
  // frame: t -> kare dosyası (1 tabanlı; dondurma/stop-motion için), cam: t -> {s,x,y,r,ox,oy}, filter: t -> CSS filtre (vars. K.GRADE)
  // blur: t -> 0..1 (keskin -> bulanık geçiş, derinlik için), dim: t -> 0..1 karartma
  // fill: {s, blur, dim, feather} (kamera kaydırınca açılan kenarı aynı karenin büyütülmüş bulanık kopyası doldurur; feather: keskin katmanın kenar yumuşatması px)
  const plate = ({ a = 0, b = Infinity, frame = fileAt, cam, filter, fill, dim, blur } = {}) => {
    need(t => t >= a && t < b ? [frameUrl(frame(t))] : []);
    let x, sm, sx, tmp, tx;
    const small = im => { sm = sm || mkCanvas(W / 8, H / 8); sx = sx || sm.getContext('2d');
      sx.setTransform(1, 0, 0, 1, 0, 0); sx.clearRect(0, 0, sm.width, sm.height); sx.filter = 'blur(1.6px)'; sx.drawImage(im, 0, 0, sm.width, sm.height); sx.filter = 'none'; return sm; };
    return {
      html: `<canvas class="k-full" width="${W}" height="${H}" data-safe="ignore"></canvas>`,
      render(t, r) {
        const cv = r.firstChild, on = t >= a && t < b; cv.style.display = on ? '' : 'none'; if (!on) return;
        x = x || cv.getContext('2d');
        const e0 = img(frameUrl(frame(t))); if (!e0.ok) return;
        const e = { im: frameSrc(Math.round(frame(t))) || e0.im };
        const c = camOf(cam ? cam(t) : null), fl = typeof fill === 'function' ? fill(t) : fill, bl = blur ? clamp(fnv(blur)(t)) : 0;
        x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
        if ((fl && !fl.mirror) || bl > 0) small(e.im);
        if (fl && fl.mirror) {                                              // dikey kaydırmada açılan bant: kenara göre ayna (dikiş sürekli)
          const sxs = (TL.src ? TL.src.w : 1440) / W, sys = (TL.src ? TL.src.h : 2560) / H, cy = c.y;
          if (cy > 0) { x.setTransform(1, 0, 0, -1, 0, cy); x.drawImage(e.im, 0, 0, W * sxs, cy * sys, 0, 0, W, cy); }
          if (cy < 0) { const hh = -cy; x.setTransform(1, 0, 0, -1, 0, 2 * H + cy); x.drawImage(e.im, 0, (H - hh) * sys, W * sxs, hh * sys, 0, H - hh, W, hh); }
          x.setTransform(1, 0, 0, 1, 0, 0);
          if (fl.dim) { const g = x.createLinearGradient(0, cy > 0 ? 0 : H, 0, cy > 0 ? cy : H + cy); g.addColorStop(0, `rgba(6,5,4,${fl.dim})`); g.addColorStop(1, 'rgba(6,5,4,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
        } else if (fl) {
          x.setTransform(...camM(camOf({ s: (fl.s ?? 1.3) * c.s, ox: c.ox, oy: c.oy, x: c.x * (fl.k ?? .4), y: c.y * (fl.k ?? .4) })));
          x.drawImage(sm, 0, 0, W, H); x.setTransform(1, 0, 0, 1, 0, 0);
          if (fl.dim) { x.fillStyle = `rgba(6,5,4,${fl.dim})`; x.fillRect(0, 0, W, H); }
        }
        if (fl && fl.feather && !fl.mirror) {                                             // keskin katman kenarları yumuşak (eksen hizalı kamera)
          tmp = tmp || mkCanvas(W, H); tx = tx || tmp.getContext('2d'); tx.setTransform(1, 0, 0, 1, 0, 0); tx.clearRect(0, 0, W, H);
          tx.imageSmoothingQuality = 'high'; tx.setTransform(...camM(c)); tx.drawImage(e.im, 0, 0, W, H); tx.setTransform(1, 0, 0, 1, 0, 0);
          const [X0, Y0] = camPt(c, 0, 0), [X1, Y1] = camPt(c, W, H), f = fl.feather;
          tx.globalCompositeOperation = 'destination-in';
          let g = tx.createLinearGradient(0, Y0, 0, Y1);
          const fy = f / Math.max(1, Y1 - Y0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(clamp(fy), '#000'); g.addColorStop(clamp(1 - fy), '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
          tx.fillStyle = g; tx.fillRect(0, 0, W, H);
          if (X0 > .5 || X1 < W - .5) { g = tx.createLinearGradient(X0, 0, X1, 0); const fx = f / Math.max(1, X1 - X0);
            g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(clamp(fx), '#000'); g.addColorStop(clamp(1 - fx), '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); tx.fillStyle = g; tx.fillRect(0, 0, W, H); }
          tx.globalCompositeOperation = 'source-over'; x.drawImage(tmp, 0, 0);
        } else { x.setTransform(...camM(c)); x.drawImage(e.im, 0, 0, W, H); x.setTransform(1, 0, 0, 1, 0, 0); }
        if (bl > 0) { x.globalAlpha = bl; x.setTransform(...camM(c)); x.drawImage(sm, 0, 0, W, H); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; }
        const dv = dim ? fnv(dim)(t) : 0;
        if (dv > 0) { x.fillStyle = `rgba(8,6,4,${dv})`; x.fillRect(0, 0, W, H); }
        cv.style.filter = (filter ? fnv(filter)(t) : null) ?? K.GRADE;
      },
    };
  };

  // ===== maskeli kesit: kare x maske (yazı-arkada, çıkartma, 2.5D ön plan, seçici renk) =====
  // dir: work/masks/<dir>/maske, range: [ilk, son] maske dosyası, frame/cam: K.plate ile aynı sözleşme (aynı değerler -> piksel hizalı)
  // border: {w (px | t->px), color} beyaz kenar (çıkartma), shadow: {blur, x, y, color}, clip: t -> [x,y,w,h] (ekran) yalnız bu kutu,
  // choke: maske kenarını içeri çeker (0..1), feather: kenar yumuşatma (px), filter/opacity: t -> değer
  const cutout = ({ a = 0, b = Infinity, dir, range, frame = fileAt, cam, filter, opacity, border, shadow, clip, choke = .12, feather = 0, dilate = 0 }) => {
    const nOf = t => clamp(Math.round(frame(t)), range[0], range[1]);
    need(t => t >= a && t < b ? [frameUrl(frame(t)), maskUrl(dir, nOf(t))] : []);
    let x, wk, wx, sil, sx2, bd, bx, dm, dmx;
    const maskOf = A => { if (!dilate) return A.cv; dm = dm || mkCanvas(A.w, A.h); dmx = dmx || dm.getContext('2d');
      dmx.clearRect(0, 0, A.w, A.h); for (let k = 0; k < 8; k++) { const an = k / 8 * Math.PI * 2; dmx.drawImage(A.cv, Math.cos(an) * dilate, Math.sin(an) * dilate); } dmx.drawImage(A.cv, 0, 0); return dm; };
    return {
      html: `<canvas class="k-full" width="${W}" height="${H}" data-safe="ignore"></canvas>`,
      render(t, r) {
        const cv = r.firstChild, on = t >= a && t < b; cv.style.display = on ? '' : 'none'; if (!on) return;
        const o = opacity ? clamp(fnv(opacity)(t)) : 1; cv.style.opacity = o; if (o <= 0) return;
        x = x || cv.getContext('2d');
        const e0 = img(frameUrl(frame(t))), A = alpha(dir, nOf(t), choke); if (!e0.ok || !A) return;
        const e = { im: frameSrc(Math.round(frame(t))) || e0.im };
        const c = camOf(cam ? cam(t) : null), m = camM(c);
        wk = wk || mkCanvas(W, H); wx = wx || wk.getContext('2d');
        // çalışma alanı: maske kutusu (+pay) ekranda
        let bb = [0, 0, W, H];
        if (A.box) { const p0 = camPt(c, A.box.x0 * W, A.box.y0 * H), p1 = camPt(c, A.box.x1 * W, A.box.y1 * H), pd = 60;
          bb = [Math.max(0, Math.min(p0[0], p1[0]) - pd), Math.max(0, Math.min(p0[1], p1[1]) - pd), 0, 0];
          bb[2] = Math.min(W, Math.max(p0[0], p1[0]) + pd) - bb[0]; bb[3] = Math.min(H, Math.max(p0[1], p1[1]) + pd) - bb[1];
          // tam piksele hizala: kesirli kırpma kenarı destination-in'i yarım uygular, kesitte ince çizgi kalır
          const ex = Math.ceil(bb[0] + bb[2]), ey = Math.ceil(bb[1] + bb[3]); bb[0] = Math.floor(bb[0]); bb[1] = Math.floor(bb[1]); bb[2] = ex - bb[0]; bb[3] = ey - bb[1]; }
        const cl = clip ? fnv(clip)(t) : null;
        wx.setTransform(1, 0, 0, 1, 0, 0); wx.clearRect(0, 0, W, H); wx.save(); wx.beginPath(); wx.rect(...bb); wx.clip();
        wx.imageSmoothingEnabled = true; wx.imageSmoothingQuality = 'high';
        wx.setTransform(...m); wx.drawImage(e.im, 0, 0, W, H);
        wx.globalCompositeOperation = 'destination-in'; if (feather) wx.filter = `blur(${feather}px)`;
        wx.drawImage(maskOf(A), 0, 0, W, H); wx.filter = 'none'; wx.globalCompositeOperation = 'source-over'; wx.restore();
        x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.save();
        if (cl) { x.beginPath(); x.rect(...cl); x.clip(); }
        const bw = border ? fnv(border.w)(t) : 0;
        if (bw > .3) {
          sil = sil || mkCanvas(W, H); sx2 = sx2 || sil.getContext('2d'); bd = bd || mkCanvas(W, H); bx = bx || bd.getContext('2d');
          sx2.setTransform(1, 0, 0, 1, 0, 0); sx2.clearRect(0, 0, W, H); sx2.setTransform(...m); sx2.drawImage(A.cv, 0, 0, W, H); sx2.setTransform(1, 0, 0, 1, 0, 0);
          bx.setTransform(1, 0, 0, 1, 0, 0); bx.clearRect(0, 0, W, H); bx.save(); bx.beginPath(); bx.rect(Math.floor(bb[0] - bw), Math.floor(bb[1] - bw), Math.ceil(bb[2] + 2 * bw) + 1, Math.ceil(bb[3] + 2 * bw) + 1); bx.clip();
          const K16 = 16; for (let k = 0; k < K16; k++) { const an = k / K16 * Math.PI * 2; bx.drawImage(sil, Math.cos(an) * bw, Math.sin(an) * bw); }
          bx.globalCompositeOperation = 'source-in'; bx.fillStyle = border.color || '#FBF8F1'; bx.fillRect(0, 0, W, H); bx.restore();
          if (shadow) { x.shadowColor = shadow.color || 'rgba(0,0,0,.45)'; x.shadowBlur = shadow.blur ?? 22; x.shadowOffsetX = shadow.x ?? 0; x.shadowOffsetY = shadow.y ?? 10; }
          x.drawImage(bd, 0, 0); x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetX = x.shadowOffsetY = 0;
        } else if (shadow) { x.shadowColor = shadow.color || 'rgba(0,0,0,.45)'; x.shadowBlur = shadow.blur ?? 22; x.shadowOffsetX = shadow.x ?? 0; x.shadowOffsetY = shadow.y ?? 10; }
        x.drawImage(wk, 0, 0); x.shadowColor = 'transparent'; x.shadowBlur = 0; x.restore();
        cv.style.filter = (filter ? fnv(filter)(t) : null) ?? K.GRADE;
      },
    };
  };
  // maskenin ekrandaki kutusu (0-1 kare uzayı; yoksa null) — çizimleri nesneye yapıştırmak için
  const maskBox = (dir, n) => { const A = alpha(dir, n); return A && A.box; };

  // ===== homografi: dikdörtgen (w x h) -> dörtgen (tl, tr, br, bl), CSS matrix3d (transform-origin 0 0) =====
  function homography(w, h, q) {
    const [x0, y0] = q[0], [x1, y1] = q[1], [x2, y2] = q[2], [x3, y3] = q[3];
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1, a13 = (dx3 * dy2 - dx2 * dy3) / den, a23 = (dx1 * dy3 - dx3 * dy1) / den;
    const a11 = x1 - x0 + a13 * x1, a21 = x3 - x0 + a23 * x3, a12 = y1 - y0 + a13 * y1, a22 = y3 - y0 + a23 * y3;
    return [a11 / w, a12 / w, 0, a13 / w, a21 / h, a22 / h, 0, a23 / h, 0, 0, 1, 0, x0, y0, 0, 1];
  }
  // kare kare dörtgen izi: paralelkenar artığı büyük karelerde (ekranın önünden geçen parmak) bozuk köşe diğer üçünden kurulur,
  // sonra zamanda Gauss yumuşatma. raw: {"<kare>": {tl:[x,y],tr,br,bl}} (0-1). Döner: n -> [[x,y]x4] (0-1)
  function quadTrack(raw, { sigma = 1.6, thr = .03 } = {}) {
    const C = ['tl', 'tr', 'br', 'bl'], ns = Object.keys(raw).map(Number).sort((p, q) => p - q);
    const P = ns.map(n => C.map(c => raw[n][c].slice()));
    const res = q => [q[0][0] + q[2][0] - q[1][0] - q[3][0], q[0][1] + q[2][1] - q[1][1] - q[3][1]];
    const R = P.map(res), good = R.map(e => Math.hypot(e[0], e[1]) < thr);
    for (let i = 0; i < P.length; i++) {
      if (good[i]) continue;
      let i0 = i, i1 = i; while (i0 >= 0 && !good[i0]) i0--; while (i1 < P.length && !good[i1]) i1++;
      const A0 = i0 >= 0 ? i0 : i1, A1 = i1 < P.length ? i1 : i0; if (A0 < 0 || A0 >= P.length) continue;
      const u = A1 === A0 ? 0 : (i - A0) / (A1 - A0), Q = C.map((_, k) => [lerp(P[A0][k][0], P[A1][k][0], u), lerp(P[A0][k][1], P[A1][k][1], u)]);
      const e = [lerp(R[A0][0], R[A1][0], u), lerp(R[A0][1], R[A1][1], u)];
      let worst = 0, wd = -1; for (let k = 0; k < 4; k++) { const d = Math.hypot(P[i][k][0] - Q[k][0], P[i][k][1] - Q[k][1]); if (d > wd) { wd = d; worst = k; } }
      const [tl, tr, br, bl] = P[i];
      const fix = [[tr[0] + bl[0] - br[0] + e[0], tr[1] + bl[1] - br[1] + e[1]], [tl[0] + br[0] - bl[0] - e[0], tl[1] + br[1] - bl[1] - e[1]],
                   [tr[0] + bl[0] - tl[0] + e[0], tr[1] + bl[1] - tl[1] + e[1]], [tl[0] + br[0] - tr[0] - e[0], tl[1] + br[1] - tr[1] - e[1]]];
      P[i][worst] = fix[worst];
    }
    const S = P.map((_, i) => C.map((__, k) => [0, 1].map(d => {
      let s = 0, ws = 0; for (let j = Math.max(0, i - 6); j <= Math.min(P.length - 1, i + 6); j++) { const w = Math.exp(-((j - i) ** 2) / (2 * sigma * sigma)); s += P[j][k][d] * w; ws += w; }
      return s / ws; })));
    const idx = new Map(ns.map((n, i) => [n, i]));
    return n => S[idx.has(n) ? idx.get(n) : (n < ns[0] ? 0 : S.length - 1)];
  }

  // ===== ekrana oturan arayüz (homografi + luma key) =====
  // quad: n -> dörtgen (0-1, K.quadTrack), ui: {w, h, html, render(t, el)}; bleed: arayüz dörtgenden bu kat taşar (kenarı oklüder kapatır)
  // key: ekran beyazı eşikleri {lum:[a,b], sat:[a,b]}: beyaz olmayan pikseller (parmak, çerçeve, çentik) arayüzün önüne geri çizilir
  // cam: t -> kamera (ekranın içine dalış: taban + arayüz + oklüder aynı dönüşüm); portal: {a, b, frame} dalışta ekran içinde sonraki çekim (ekran uzayında)
  const screen = ({ a, b, quad, ui, bleed = .035, key = { lum: [.74, .86], sat: [.10, .2] }, cam, portal, uiOpacity }) => {
    need(t => t >= a && t < b ? [frameUrl(fileAt(t)), ...(portal && t >= portal.a ? [frameUrl(portal.frame)] : [])] : []);
    let oc, ox, pc, px, ow = 0, oh = 0;
    return {
      html: `<div class="k-full k-scr" data-safe="ignore"><div class="k-ui" style="position:absolute;left:0;top:0;width:${ui.w}px;height:${ui.h}px;transform-origin:0 0;overflow:hidden">${ui.html}</div>` +
            `<canvas class="k-full k-portal" width="${W}" height="${H}" data-safe="ignore"></canvas>` +
            `<canvas class="k-occ" data-safe="ignore" style="position:absolute;left:0;top:0;transform-origin:0 0"></canvas></div>`,
      render(t, r) {
        const root = r.firstChild, on = t >= a && t < b; root.style.display = on ? '' : 'none'; if (!on) return;
        const n = fileAt(t), q0 = quad(n), c = camOf(cam ? cam(t) : null);
        const P = q0.map(([u, v]) => [u * W, v * H]), cx = P.reduce((s, p) => s + p[0], 0) / 4, cy = P.reduce((s, p) => s + p[1], 0) / 4;
        const Pb = P.map(([X, Y]) => [cx + (X - cx) * (1 + bleed), cy + (Y - cy) * (1 + bleed)]);
        const uel = root.querySelector('.k-ui');
        // dalışta (kamera büyürken) tam ekran geçiş: arayüz denetim dışı (L.dive ile aynı kural)
        const diving = c.s > 1.001;
        if (root._ign !== diving) { root._ign = diving; for (const e of root.querySelectorAll('.k-ui, .k-ui *')) diving ? e.setAttribute('data-safe', 'ignore') : e.removeAttribute('data-safe'); }
        uel.style.filter = K.GRADE;
        uel.style.transform = `${camCss(c)} matrix3d(${homography(ui.w, ui.h, Pb).map(v => +v.toFixed(8)).join(',')})`;
        uel.style.opacity = uiOpacity ? clamp(fnv(uiOpacity)(t)) : 1;
        if (ui.render) ui.render(t, uel);
        // oklüder: dörtgen kutusundaki beyaz olmayan taban pikselleri
        const e = img(frameUrl(n)); if (!e.ok) return;
        const pd = 26, X0 = Math.max(0, Math.floor(Math.min(...Pb.map(p => p[0])) - pd)), Y0 = Math.max(0, Math.floor(Math.min(...Pb.map(p => p[1])) - pd));
        const X1 = Math.min(W, Math.ceil(Math.max(...Pb.map(p => p[0])) + pd)), Y1 = Math.min(H, Math.ceil(Math.max(...Pb.map(p => p[1])) + pd)), bw = X1 - X0, bh = Y1 - Y0;
        oc = oc || root.querySelector('.k-occ'); ox = ox || oc.getContext('2d', { willReadFrequently: true });
        if (bw !== ow || bh !== oh) { oc.width = bw; oc.height = bh; ow = bw; oh = bh; }
        const sxs = (TL.src ? TL.src.w : 1440) / W, sys = (TL.src ? TL.src.h : 2560) / H;
        ox.clearRect(0, 0, bw, bh); ox.imageSmoothingQuality = 'high'; ox.drawImage(e.im, X0 * sxs, Y0 * sys, bw * sxs, bh * sys, 0, 0, bw, bh);
        const d = ox.getImageData(0, 0, bw, bh), p = d.data, [l0, l1] = key.lum, [s0, s1] = key.sat;
        for (let i = 0; i < p.length; i += 4) {
          const R_ = p[i], G = p[i + 1], B_ = p[i + 2], mx = Math.max(R_, G, B_), mn = Math.min(R_, G, B_);
          const lum = (R_ * .3 + G * .59 + B_ * .11) / 255, sat = mx ? (mx - mn) / mx : 0;
          const white = sstep(l0, l1, lum) * (1 - sstep(s0, s1, sat));
          p[i + 3] = Math.round((1 - white) * 255);
        }
        ox.putImageData(d, 0, 0);
        oc.style.transform = `${camCss(c)} translate(${X0}px,${Y0}px)`;
        oc.style.filter = K.GRADE;
        // portal: ekran uzayında sonraki çekim; oklüder kutusuyla kırpılır (ekran dışındaki beyaz olmayan pikselleri oklüder örter, kenarda beyaz çizgi kalmaz)
        pc = pc || root.querySelector('.k-portal');
        const pa = portal && t >= portal.a ? E.inOutCubic(prog(t, portal.a, portal.b)) : 0;
        pc.style.display = pa > 0 ? '' : 'none';
        if (pa > 0) {
          const pe = img(frameUrl(portal.frame)); px = px || pc.getContext('2d');
          px.setTransform(1, 0, 0, 1, 0, 0); px.clearRect(0, 0, W, H);
          if (pe.ok) { px.save(); const Q = [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]].map(([X, Y]) => camPt(c, X, Y)); polyPath(px, Q); px.clip(); px.globalAlpha = pa; px.imageSmoothingQuality = 'high'; px.drawImage(pe.im, 0, 0, W, H); px.restore(); }
          pc.style.filter = K.GRADE;
        }
      },
    };
  };

  // ===== marker çizimi: çizilerek gelir (stroke-dash), 12 fps titreme (boil); şekiller ekran koordinatında nokta dizileri =====
  // shapes: [{pts, t, dur, w, color, closed}], track: t -> {x, y} (kayma; nesneyi izler), out: çıkışın bittiği an
  const smoothD = (pts, closed) => {
    if (pts.length < 2) return '';
    const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
    let d = `M${P[1][0].toFixed(1)} ${P[1][1].toFixed(1)}`;
    for (let i = 1; i < P.length - 2; i++) {
      const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
      d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  };
  const marker = ({ shapes, color = YEL, width = 12, boil = 1.6, out = Infinity, outDur = .2, track, under = 'rgba(12,8,4,.42)', id = '', box }) => {
    const all = shapes.flatMap(s => s.pts), pad = width * .75 + boil * 2 + 6;
    let bx0 = Math.min(...all.map(p => p[0])) - pad, by0 = Math.min(...all.map(p => p[1])) - pad, bx1 = Math.max(...all.map(p => p[0])) + pad, by1 = Math.max(...all.map(p => p[1])) + pad;
    if (box) [bx0, by0, bx1, by1] = box;
    const seed = Math.round(all.length * 7 + bx0 * 3 + by0);
    const paths = shapes.map((s, i) => `${under ? `<path class="mu" data-i="${i}" pathLength="1" fill="none" stroke="${under}" stroke-width="${(s.w ?? width) + 3}" stroke-linecap="round" stroke-linejoin="round" transform="translate(1.5,3.5)"/>` : ''}` +
      `<path class="mk" data-i="${i}" pathLength="1" fill="none" stroke="${s.color || color}" stroke-width="${s.w ?? width}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
    return {
      html: `<svg class="k-marker${id ? ' ' + id : ''}" style="position:absolute;left:${bx0}px;top:${by0}px;overflow:visible" width="${bx1 - bx0}" height="${by1 - by0}" viewBox="${bx0} ${by0} ${bx1 - bx0} ${by1 - by0}">${paths}</svg>`,
      render(t, r) {
        const sv = r.firstChild, t0 = Math.min(...shapes.map(s => s.t));
        const vis_ = t >= t0 && t < out; sv.style.display = vis_ ? '' : 'none'; if (!vis_) return;
        const o = isFinite(out) ? 1 - E.inCubic(prog(t, out - outDur, out)) : 1;
        const tr = track ? track(t) : null; sv.style.opacity = o;
        sv.style.transform = tr ? `translate(${(tr.x || 0).toFixed(2)}px,${(tr.y || 0).toFixed(2)}px)` : '';
        const bi = Math.floor(t * 12 + 1e-6);
        const cur = shapes.map(s => typeof s.pts === 'function' ? s.pts(t) : s.pts);
        if (shapes.some(s => typeof s.pts === 'function')) {                  // hareketli şekil: kutu her karede gerçek noktalardan (denetim gerçeği görür)
          const vs = shapes.map((s, i) => t >= s.t ? cur[i] : []).flat(); if (vs.length) {
            const X0 = Math.min(...vs.map(p => p[0])) - pad, Y0 = Math.min(...vs.map(p => p[1])) - pad, X1 = Math.max(...vs.map(p => p[0])) + pad, Y1 = Math.max(...vs.map(p => p[1])) + pad;
            sv.setAttribute('width', (X1 - X0).toFixed(1)); sv.setAttribute('height', (Y1 - Y0).toFixed(1)); sv.setAttribute('viewBox', `${X0.toFixed(1)} ${Y0.toFixed(1)} ${(X1 - X0).toFixed(1)} ${(Y1 - Y0).toFixed(1)}`);
            sv.style.left = X0.toFixed(1) + 'px'; sv.style.top = Y0.toFixed(1) + 'px'; } }
        shapes.forEach((s, i) => {
          const p = s.dur > 0 ? E.outCubic(prog(t, s.t, s.t + s.dur)) : (t >= s.t ? 1 : 0);
          const pts = cur[i].map(([px, py], k) => [px + (hash(bi, k, seed + i) - .5) * 2 * boil, py + (hash(bi, k + 999, seed + i) - .5) * 2 * boil]);
          const d = smoothD(pts, s.closed);
          for (const el of sv.querySelectorAll(`[data-i="${i}"]`)) {
            el.setAttribute('d', d);
            css(el, { strokeDasharray: '1 1', strokeDashoffset: (1 - p).toFixed(4), opacity: p > 0 ? 1 : 0 });
          }
        });
      },
    };
  };
  // şekil üreticileri (nokta dizisi; el çizimi kusurları tohumlu)
  const SH = {
    ellipse: (cx, cy, rx, ry, { rot = -8, start = -110, sweep = 395, wob = .05, seed = 1, n = 44, spiral = .06 } = {}) => {
      const R = rng(seed), ph = R() * 6.28, out = [], a = rot * Math.PI / 180;
      for (let i = 0; i <= n; i++) { const u = i / n, th = (start + sweep * u) * Math.PI / 180, k = 1 + wob * Math.sin(th * 2 + ph) + spiral * (u - .5);
        const ex = Math.cos(th) * rx * k, ey = Math.sin(th) * ry * k; out.push([cx + ex * Math.cos(a) - ey * Math.sin(a), cy + ex * Math.sin(a) + ey * Math.cos(a)]); }
      return out;
    },
    line: (p0, p1, { bend = 0, n = 10 } = {}) => {
      const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2, dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1;
      const c = [mx - dy / L * bend, my + dx / L * bend], out = [];
      for (let i = 0; i <= n; i++) { const u = i / n; out.push([(1 - u) ** 2 * p0[0] + 2 * u * (1 - u) * c[0] + u * u * p1[0], (1 - u) ** 2 * p0[1] + 2 * u * (1 - u) * c[1] + u * u * p1[1]]); }
      return out;
    },
    // ok: gövde + iki uç çizgisi (3 şekil için nokta dizileri)
    arrow: (p0, p1, { bend = 0, head = 46, spread = 28 } = {}) => {
      const sh = SH.line(p0, p1, { bend, n: 14 }), a = sh[sh.length - 1], b = sh[sh.length - 3], an = Math.atan2(a[1] - b[1], a[0] - b[0]);
      const h1 = [[a[0] - Math.cos(an - spread * Math.PI / 180) * head, a[1] - Math.sin(an - spread * Math.PI / 180) * head], a];
      const h2 = [a, [a[0] - Math.cos(an + spread * Math.PI / 180) * head, a[1] - Math.sin(an + spread * Math.PI / 180) * head]];
      return [sh, h1, h2];
    },
    x: (cx, cy, r, { seed = 1 } = {}) => { const R = rng(seed), j = () => (R() - .5) * r * .18;
      return [SH.line([cx - r + j(), cy - r * .9 + j()], [cx + r + j(), cy + r * .95 + j()], { bend: r * .08 }), SH.line([cx + r * .95 + j(), cy - r + j()], [cx - r * .9 + j(), cy + r * .9 + j()], { bend: -r * .06 })]; },
    tick: (cx, cy, s) => [[cx - s * .55, cy - s * .02], [cx - s * .32, cy + s * .2], [cx - s * .12, cy + s * .42], [cx + s * .22, cy - s * .05], [cx + s * .62, cy - s * .55]],
    underline: (x0, x1, y, { wave = 5, seed = 1, back = true } = {}) => { const R = rng(seed), out = [];
      for (let i = 0; i <= 10; i++) { const u = i / 10; out.push([lerp(x0, x1, u), y + Math.sin(u * 3.1 + R()) * wave * .5 + (R() - .5) * 2]); }
      if (back) for (let i = 9; i >= 4; i--) { const u = i / 10; out.push([lerp(x0, x1, u) - 6, y + 13 + Math.sin(u * 2.7) * wave * .4]); }
      return out; },
    rays: (cx, cy, r0, r1, angles) => angles.map(a => { const an = a * Math.PI / 180; return [[cx + Math.cos(an) * r0, cy + Math.sin(an) * r0], [cx + Math.cos(an) * r1, cy + Math.sin(an) * r1]]; }),
    // el yazısı rakam (yükseklik h, sol-üst x,y)
    digit: (ch, x, y, h) => {
      const w = h * .62, P = ([u, v]) => [x + u * w, y + v * h];
      const D = { '1': [[[.18, .26], [.42, .08], [.56, 0], [.55, .35], [.53, .7], [.52, 1]], [[.2, 1], [.86, .99]]],
                  '2': [[[.06, .22], [.22, .04], [.52, -.02], [.82, .1], [.86, .3], [.66, .55], [.32, .8], [.05, 1], [.4, .98], [.95, .97]]],
                  '3': [[[.08, .1], [.4, -.02], [.76, .05], [.82, .22], [.6, .4], [.36, .46], [.66, .5], [.9, .66], [.86, .86], [.56, 1], [.2, .98], [.02, .86]]] };
      return (D[ch] || []).map(s => s.map(P));
    },
  };

  // ===== el yazısı not: harf harf yazılır (12 fps), marker sarısı + koyu gölge =====
  const note = ({ text, x, y, size = 90, color = YEL, rot = -4, t: t0, dur, out = Infinity, outDur = .2, font = HAND, weight = 400, align = 'left', shadow = true, track, ls = 0 }) => {
    const chars = [...text], d = dur ?? Math.max(.25, chars.length * .045);
    const tx = align === 'center' ? 'translateX(-50%)' : align === 'right' ? 'translateX(-100%)' : '';
    return {
      html: `<div class="k-note" style="position:absolute;left:${x}px;top:${y}px;font-family:${font};font-weight:${weight};font-size:${size}px;line-height:1;color:${color};white-space:nowrap;letter-spacing:${ls}em;` +
            `transform-origin:${align === 'center' ? '50%' : align === 'right' ? '100%' : '0'} 50%;${shadow ? 'text-shadow:0 3px 0 rgba(15,10,5,.55),0 6px 18px rgba(0,0,0,.45);' : ''}">` +
            chars.map(ch => `<span>${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('') + `</div>`,
      render(t, r) {
        const el = r.firstChild, on = t >= t0 && t < out; el.style.display = on ? '' : 'none'; if (!on) return;
        const p = clamp(prog(stop(t), t0, t0 + d)), k = Math.ceil(p * chars.length - 1e-6);
        el.querySelectorAll('span').forEach((s, i) => { s.style.opacity = i < Math.max(1, k) ? 1 : 0; });
        const o = isFinite(out) ? 1 - E.inCubic(prog(t, out - outDur, out)) : 1, tr = track ? track(t) : { x: 0, y: 0 };
        const j = (hash(Math.floor(t * 6), 5, x | 0) - .5) * .6;
        el.style.opacity = o; el.style.transform = `translate(${tr.x || 0}px,${tr.y || 0}px) ${tx} rotate(${(rot + j).toFixed(2)}deg)`;
      },
    };
  };

  // ===== dev başlık (DOM): sıkışık kalın yazı; giriş 'none' | 'letters' (harf harf stop-motion) | 'rise' (aşağıdan, nesnenin arkasından) | 'slam' =====
  const title = ({ text, x = 540, y, size = 200, font = COND, weight = 900, color = IVORY, ls = -.005, sy = 1, lh = .82, rot = 0, t: t0 = -1, out = Infinity, outDur = .22,
                   enter = 'none', stagger = 1 / 12, rise = { dy: 260, dur: .45 }, grow, shadow = '0 10px 40px rgba(0,0,0,.35)', align = 'center', id = '', track, stroke }) => {
    const chars = [...text];
    return {
      html: `<div class="k-title${id ? ' ' + id : ''}" style="position:absolute;left:${x}px;top:${y}px;font-family:${font};font-weight:${weight};font-size:${size}px;line-height:${lh};color:${color};` +
            `letter-spacing:${ls}em;white-space:nowrap;transform-origin:50% 0;${shadow ? `text-shadow:${shadow};` : ''}${stroke ? `-webkit-text-stroke:${stroke};paint-order:stroke fill;` : ''}">` +
            `<div class="kt-in" style="transform:scaleY(${sy});transform-origin:50% 0">${chars.map(ch => `<span style="display:inline-block">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('')}</div></div>`,
      render(t, r) {
        const el = r.firstChild, on = t >= t0 && t < out; el.style.display = on ? '' : 'none'; if (!on) return;
        let ty = 0, s = 1;
        if (enter === 'rise') ty = rise.dy * (1 - E.outCubic(prog(t, t0, t0 + rise.dur)));
        if (enter === 'slam') { const k = clamp(spring(t - t0, .55, 2.6), 0, 1.2); s = lerp(1.5, 1, k); }
        if (grow) s *= lerp(grow.from ?? 1, grow.to ?? 1.05, E.inOutCubic(prog(t, grow.a, grow.b)));
        const spans = el.querySelectorAll('.kt-in span');
        if (enter === 'letters') spans.forEach((sp, i) => {
          const k = Math.floor((t - (t0 + i * stagger)) * 12 + 1e-6);
          sp.style.opacity = k < 0 ? 0 : 1;
          sp.style.transform = k <= 0 ? `scale(1.22) rotate(${((hash(i, 3) - .5) * 10).toFixed(1)}deg)` : k === 1 ? `scale(.96) rotate(${((hash(i, 4) - .5) * 4).toFixed(1)}deg)` : '';
        });
        const o = isFinite(out) ? 1 - E.inCubic(prog(t, out - outDur, out)) : 1, tr = track ? track(t) : { x: 0, y: 0 };
        el.style.opacity = o;
        el.style.transform = `translate(${(tr.x || 0).toFixed(2)}px,${(ty + (tr.y || 0)).toFixed(2)}px) ${align === 'center' ? 'translateX(-50%)' : ''} rotate(${rot}deg) scale(${s.toFixed(4)})`;
      },
    };
  };

  // ===== çıkartma / kâğıt parçası: yırtık kenar, doku, gölge ve bant tuvale bir kez pişirilir; içerik DOM; stop-motion yapışma =====
  // x,y: merkez; w,h; rot; paper: white|kraft|dark|yellow|tape; torn: kenar genliği (px); die: beyaz kesim kenarı (px; fotoğraf çıkartması)
  // tape: [{x, y (çıkartma içi, merkezden), w, h, rot}], html: içerik (w x h kutuda), t: yapışma, shake: {t, d, amp}, out
  const sticker = ({ x, y, w, h, rot = 0, paper = 'white', seed = 1, torn = 5, die = 0, tape = [], html = '', t: t0, out = Infinity, outDur = .18, shake: sk, shadow = { blur: 20, y: 10, a: .45 },
                     wobble = .35, pop = true, track, cls = '', onRender }) => {
    const pad = 40 + die, cw = w + 2 * pad, ch = h + 2 * pad;
    let baked = false;
    const bake = (cv, tv) => {
      const g = cv.getContext('2d'), pts = tornRect(w + 2 * die, h + 2 * die, torn, seed).map(([px, py]) => [px + pad - die, py + pad - die]);
      g.save(); g.shadowColor = `rgba(0,0,0,${shadow.a})`; g.shadowBlur = shadow.blur; g.shadowOffsetY = shadow.y; g.shadowOffsetX = shadow.x || 0;
      polyPath(g, pts); g.fillStyle = `rgb(${(PAPERS[paper] || PAPERS.white).edge.join(',')})`; g.fill(); g.restore();
      g.save(); const inner = tornRect(w + 2 * die - 6, h + 2 * die - 6, torn * .7, seed + 7).map(([px, py]) => [px + pad - die + 3, py + pad - die + 3]);
      polyPath(g, inner); g.clip(); g.drawImage(paperTex(paper, Math.round(cw), Math.round(ch), seed * 13 + 1), 0, 0); g.restore();
      const tg = tv.getContext('2d');
      tape.forEach((tp, i) => {
        tg.save(); tg.translate(cw / 2 + tp.x, ch / 2 + tp.y); tg.rotate((tp.rot || 0) * Math.PI / 180);
        const tw = tp.w || 150, th = tp.h || 46, R = rng(seed * 7 + i), P = [];
        for (let k = 0; k <= 6; k++) P.push([-tw / 2 + (R() - .5) * 6, -th / 2 + th * k / 6]);
        for (let k = 0; k <= 6; k++) P.push([tw / 2 + (R() - .5) * 6, th / 2 - th * k / 6]);
        tg.beginPath(); P.forEach(([a, b], k) => k ? tg.lineTo(a, b) : tg.moveTo(a, b)); tg.closePath();
        tg.shadowColor = 'rgba(0,0,0,.18)'; tg.shadowBlur = 4; tg.shadowOffsetY = 2; tg.fillStyle = tp.color || 'rgba(238,228,196,.80)'; tg.fill();
        tg.shadowColor = 'transparent'; tg.globalAlpha = .35; tg.clip(); tg.drawImage(paperTex('tape', 160, 60, seed + i), -tw / 2, -th / 2, tw, th); tg.restore();
      });
      baked = true;
    };
    return {
      html: `<div class="k-stk ${cls}" style="position:absolute;left:${x - cw / 2}px;top:${y - ch / 2}px;width:${cw}px;height:${ch}px;transform-origin:50% 50%">` +
            `<canvas class="k-stk-bg" width="${cw}" height="${ch}" style="position:absolute;left:0;top:0"></canvas>` +
            `<div class="k-stk-c" style="position:absolute;left:${pad}px;top:${pad}px;width:${w}px;height:${h}px">${html}</div>` +
            `<canvas class="k-stk-tp" width="${cw}" height="${ch}" style="position:absolute;left:0;top:0"></canvas>` +
            `<div class="k-box" style="position:absolute;left:${pad - die}px;top:${pad - die}px;width:${w + 2 * die}px;height:${h + 2 * die}px"></div></div>`,
      render(t, r) {
        const el = r.firstChild, on = t >= t0 && t < out; el.style.display = on ? '' : 'none'; if (!on) return;
        if (!baked) bake(el.querySelector('.k-stk-bg'), el.querySelector('.k-stk-tp'));
        const k = Math.floor((t - t0) * 12 + 1e-6);
        let s = 1, rr = rot, dx = 0, dy = 0;
        if (pop) { if (k === 0) { s = 1.13; rr += 5 * (hash(seed, 1) > .5 ? 1 : -1); } else if (k === 1) { s = .97; rr -= 1.6; } }
        if (wobble && k > 2) { const b = Math.floor(t * 6 + 1e-6); rr += (hash(b, seed, 2) - .5) * 2 * wobble; dx += (hash(b, seed, 3) - .5) * 1.6; dy += (hash(b, seed, 4) - .5) * 1.6; }
        if (sk && t >= sk.t && t < sk.t + sk.d) { const u = 1 - (t - sk.t) / sk.d, f = Math.floor(t * 24); dx += (hash(f, seed, 5) - .5) * 2 * sk.amp * u; dy += (hash(f, seed, 6) - .5) * 2 * sk.amp * u; rr += (hash(f, seed, 7) - .5) * 3 * u; }
        const o = isFinite(out) ? 1 - E.inCubic(prog(t, out - outDur, out)) : 1, tr = track ? track(t) : { x: 0, y: 0 };
        el.style.opacity = o;
        el.style.transform = `translate(${(dx + (tr.x || 0)).toFixed(2)}px,${(dy + (tr.y || 0)).toFixed(2)}px) rotate(${rr.toFixed(2)}deg) scale(${s})`;
        if (onRender) onRender(t, el);                                        // içerik animasyonu (ör. kronometre ibresi)
      },
    };
  };

  // ===== tam ekran kâğıt pano: yırtık kenar ekranı süpürerek kaplar (dir: 'left' sağdan sola, 'right', 'up' alttan, 'down') =====
  // t..t+dur: kaplama; outT: geri açılma başlangıcı (aynı süre), slant: kenar eğimi (px), amp: yırtık genliği
  const board = ({ t: t0, dur = .4, dir = 'left', paper = 'white', seed = 5, slant = 160, amp = 16, outT = Infinity, outDur = .35, rim = 9, ease = E.outCubic, stopMo = false }) => {
    const R = rng(seed), N = 64, J = [];
    let big = 0; for (let i = 0; i <= N; i++) { if (i % 4 === 0) big = (R() - .5) * 2; J.push(amp * (.6 * big + .4 * (R() - .5) * 2)); }
    const Jr = J.map((v, i) => v * .5 + rim * (.55 + .45 * hash(i, seed)));
    let x;
    return {
      html: `<canvas class="k-full" width="${W}" height="${H}" data-safe="ignore"></canvas>`,
      render(t, r) {
        const cv = r.firstChild, tt = stopMo ? stop(t) : t;
        let u = ease(prog(tt, t0, t0 + dur)); if (isFinite(outT)) u *= 1 - ease(prog(tt, outT, outT + outDur));
        cv.style.display = u > 0 ? '' : 'none'; if (u <= 0) return;
        x = x || cv.getContext('2d');
        const hor = dir === 'left' || dir === 'right', Lp = hor ? H : W, span = (hor ? W : H) + slant + amp * 2 + 40;
        // kenar çizgisi: s boyunca konum (kaplanan bölge kenarın arkasında)
        const pos = s => { const k = s / Lp, base = u * span - amp - 20, off = slant * (k - .5);
          return dir === 'left' ? W - base - off : dir === 'right' ? base + off : dir === 'up' ? H - base - off : base + off; };
        const edge = (jj, sh) => { const P = []; for (let i = 0; i <= N; i++) { const s = i / N * Lp, e = pos(s) + (dir === 'left' || dir === 'up' ? -1 : 1) * (jj[i] + sh);
          P.push(hor ? [e, s] : [s, e]); } return P; };
        const poly = (jj, sh) => { const P = edge(jj, sh);
          if (dir === 'left') return [...P, [W + 50, H + 50], [W + 50, -50]]; if (dir === 'right') return [...P, [-50, H + 50], [-50, -50]];
          if (dir === 'up') return [...P, [W + 50, H + 50], [-50, H + 50]]; return [...P, [W + 50, -50], [-50, -50]]; };
        x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H);
        x.save(); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 26; x.shadowOffsetX = dir === 'left' ? -8 : dir === 'right' ? 8 : 0; x.shadowOffsetY = dir === 'up' ? -8 : dir === 'down' ? 8 : 6;
        polyPath(x, poly(J, 0)); x.fillStyle = `rgb(${(PAPERS[paper] || PAPERS.white).edge.join(',')})`; x.fill(); x.restore();
        x.save(); polyPath(x, poly(Jr, 0)); x.clip(); x.drawImage(paperTex(paper, W / 2, H / 2, seed), 0, 0, W, H); x.restore();
      },
    };
  };

  // ===== kelime penceresi: koyu kâğıt ekranı kaplar, harfler oyuk (altındaki video harflerin içinde oynar); dive: bir harfin içinden geçiş =====
  // text, x (merkez), y (üst), size, sy (dikey çekme), t (açılış; stop-motion), stagger (harf harf), dive: {a, b, letter (indeks), s}
  // probe: denetim için yazının gerçek kutusu (dalış başlayınca kalkar: tam ekran geçiş)
  const windowWord = ({ text, x = 540, y, size = 260, sy = 2, font = COND, weight = 900, t: t0, out = Infinity, outDur = .2, stagger = .045, dive, paper = 'dark', seed = 9, rim = 'rgba(240,232,214,.92)', ls = 0 }) => {
    const chars = [...text]; let x2, meas = null;
    return {
      html: `<canvas class="k-full" width="${W}" height="${H}" data-safe="ignore"></canvas><div class="k-probe" style="position:absolute;left:0;top:0;width:0;height:0"></div>`,
      render(t, r) {
        const cv = r.firstChild, pr = r.lastChild, on = t >= t0 && t < out && !(dive && t >= dive.b);
        cv.style.display = on ? '' : 'none'; pr.style.display = on && !(dive && t >= dive.a) ? '' : 'none'; if (!on) return;
        x2 = x2 || cv.getContext('2d');
        const fnt = `${weight} ${size}px ${font}`;
        if (!meas) { x2.font = fnt; const ws = chars.map(c => x2.measureText(c).width), lsp = ls * size, tot = ws.reduce((a, b) => a + b, 0) + lsp * (chars.length - 1);
          const m = x2.measureText('YZ'), asc = m.actualBoundingBoxAscent; let cx = x - tot / 2; const xs = ws.map(w0 => { const v = cx; cx += w0 + lsp; return v; });
          meas = { ws, xs, tot, asc, base: y + asc * sy }; }
        const ds = dive ? 1 + (dive.s ?? 30) * E.inCubic(prog(t, dive.a, dive.b)) : 1, li = dive ? dive.letter : 0;
        const fx = meas.xs[li] + meas.ws[li] / 2, fy = y + meas.asc * sy / 2;
        const k = Math.floor((t - t0) * 12 + 1e-6), ps = k <= 0 ? 1.06 : k === 1 ? .99 : 1;
        const o = isFinite(out) ? 1 - E.inCubic(prog(t, out - outDur, out)) : 1;
        x2.setTransform(1, 0, 0, 1, 0, 0); x2.clearRect(0, 0, W, H); x2.globalAlpha = 1;
        const S = ds * ps, ox = fx, oy = fy;
        x2.setTransform(S, 0, 0, S, ox - ox * S, oy - oy * S);
        x2.drawImage(paperTex(paper, W / 2, H / 2, seed), -W, -H, 3 * W, 3 * H);
        x2.font = fnt; x2.textBaseline = 'alphabetic';
        const shown = chars.map((_, i) => t >= t0 + i * stagger);
        // harf oyukları
        x2.globalCompositeOperation = 'destination-out';
        chars.forEach((c, i) => { if (!shown[i]) return; x2.save(); x2.translate(meas.xs[i], meas.base); x2.scale(1, sy); x2.fillText(c, 0, 0); x2.restore(); });
        x2.globalCompositeOperation = 'source-over';
        // kesik kâğıt kenarı (ince açık çizgi)
        x2.strokeStyle = rim; x2.lineWidth = 3 / sy; x2.lineJoin = 'round';
        chars.forEach((c, i) => { if (!shown[i]) return; x2.save(); x2.translate(meas.xs[i], meas.base); x2.scale(1, sy); x2.strokeText(c, 0, 0); x2.restore(); });
        x2.setTransform(1, 0, 0, 1, 0, 0);
        cv.style.opacity = o;
        cv.style.filter = 'drop-shadow(6px 10px 10px rgba(0,0,0,.6))';
        css(pr, { left: `${meas.xs[0]}px`, top: `${y}px`, width: `${meas.tot}px`, height: `${meas.asc * sy}px`, background: 'rgba(0,0,0,0.002)' });
      },
    };
  };

  // ===== kontur çizgisi: maskenin dış hattı marker gibi çizilerek dolaşır (kare kare maskeden; kenara değen kısımlar çizilmez) =====
  function traceMask(A, step = 4, thr = 110) {
    const gw = Math.floor(A.w / step), gh = Math.floor(A.h / step), G = new Uint8Array(gw * gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) G[j * gw + i] = A.A[(j * step + (step >> 1)) * A.w + i * step + (step >> 1)] > thr ? 1 : 0;
    // en büyük bileşen
    const lab = new Int32Array(gw * gh); let best = 0, bestN = 0, cur = 0;
    for (let s = 0; s < G.length; s++) {
      if (!G[s] || lab[s]) continue; cur++; let cnt = 0; const st = [s]; lab[s] = cur;
      while (st.length) { const p = st.pop(); cnt++; const px = p % gw, py = (p / gw) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const qx = px + dx, qy = py + dy; if (qx < 0 || qy < 0 || qx >= gw || qy >= gh) continue; const q = qy * gw + qx; if (G[q] && !lab[q]) { lab[q] = cur; st.push(q); } } }
      if (cnt > bestN) { bestN = cnt; best = cur; }
    }
    if (!best) return { pts: [], gw, gh };
    const inb = (i, j) => i >= 0 && j >= 0 && i < gw && j < gh && lab[j * gw + i] === best;
    let s0 = -1; for (let p = 0; p < G.length; p++) if (lab[p] === best) { s0 = p; break; }
    const N8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    let cx = s0 % gw, cy = (s0 / gw) | 0, dir = 7; const sx = cx, sy0 = cy, pts = [[cx, cy]];
    for (let it = 0; it < gw * gh * 2; it++) {
      let found = false;
      for (let k = 0; k < 8; k++) { const d = (dir + 6 + k) % 8, nx = cx + N8[d][0], ny = cy + N8[d][1];
        if (inb(nx, ny)) { cx = nx; cy = ny; dir = d; found = true; break; } }
      if (!found || (cx === sx && cy === sy0 && pts.length > 2)) break;
      pts.push([cx, cy]);
    }
    return { pts, gw, gh };
  }
  const contour = ({ a = 0, b = Infinity, dir, range, frame = fileAt, cam, t: t0, dur = .6, color = YEL, width = 10, boil = 1.2, out = Infinity, outDur = .2, step = 4, smooth = 3, edge = 2, minRun = 8, under = 'rgba(12,8,4,.4)', glow, clip }) => {
    const nOf = t => clamp(Math.round(frame(t)), range[0], range[1]);
    need(t => t >= Math.max(a, t0) && t < Math.min(b, out) ? [maskUrl(dir, nOf(t))] : []);
    return {
      html: `<svg class="k-full" data-safe="ignore" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="overflow:visible">` +
            (glow ? `<path class="cg" fill="none" stroke="${glow}" stroke-width="${width * 3.2}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" style="filter:blur(10px)"/>` : '') +
            `<path class="cu" fill="none" stroke="${under}" stroke-width="${width + 3}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" transform="translate(1.5,3.5)"/>` +
            `<path class="cm" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/></svg>`,
      render(t, r) {
        const sv = r.firstChild, on = t >= Math.max(a, t0) && t < Math.min(b, out); sv.style.display = on ? '' : 'none'; if (!on) return;
        const A = alpha(dir, nOf(t)); if (!A) return;
        const { pts, gw, gh } = traceMask(A, step), c = camOf(cam ? cam(t) : null);
        // kenar noktaları ayıklanır -> parçalar
        const runs = []; let run = [], ck = clip ? fnv(clip)(t) : null;
        const outC = (i, j) => { if (!ck) return false; const X = (i + .5) * step / A.w * W, Y = (j + .5) * step / A.h * H; return X < ck[0] || Y < ck[1] || X > ck[0] + ck[2] || Y > ck[1] + ck[3]; };
        pts.forEach(([i, j]) => { const onEdge = i < edge || j < edge || i >= gw - edge || j >= gh - edge || outC(i, j);
          if (onEdge) { if (run.length) runs.push(run); run = []; } else run.push([i, j]); });
        if (run.length) runs.push(run);
        if (runs.length > 1 && pts.length && !(pts[0][0] < edge || pts[0][1] < edge || pts[0][0] >= gw - edge || pts[0][1] >= gh - edge || outC(pts[0][0], pts[0][1]))) { const f = runs.shift(); runs[runs.length - 1].push(...f); }
        const bi = Math.floor(t * 12 + 1e-6);
        let d = '';
        runs.filter(rn => rn.length >= minRun).forEach((rn, ri) => {
          const sm = rn.map((_, k) => { let sx = 0, sy = 0, n = 0; for (let q = -smooth; q <= smooth; q++) { const p = rn[clamp(k + q, 0, rn.length - 1)]; sx += p[0]; sy += p[1]; n++; } return [sx / n, sy / n]; });
          const dec = sm.filter((_, k) => k % 2 === 0 || k === sm.length - 1).map(([i, j], k) => {
            const [X, Y] = camPt(c, (i + .5) * step / A.w * W, (j + .5) * step / A.h * H);
            return [X + (hash(bi, k, ri) - .5) * 2 * boil, Y + (hash(bi, k + 500, ri) - .5) * 2 * boil]; });
          d += ' ' + smoothD(dec, false);
        });
        const p = E.inOutCubic(prog(t, t0, t0 + dur)), o = isFinite(out) ? 1 - E.inCubic(prog(t, out - outDur, out)) : 1;
        sv.style.opacity = o;
        for (const el of sv.querySelectorAll('path')) { el.setAttribute('d', d.trim()); css(el, { strokeDasharray: '1 1', strokeDashoffset: (1 - p).toFixed(4) }); }
      },
    };
  };

  // ===== ılık parlama (ampul): ekran karışımlı radyal ışık; at: t -> {x, y, r} =====
  const glow = ({ at, t: t0, out = Infinity, color = '255,196,90', a = .55, rise = .3, flicker = .06 }) => ({
    html: `<div class="k-full" data-safe="ignore"></div>`,
    render(t, r) {
      r.parentElement.style.mixBlendMode = 'screen';
      const el = r.firstChild, on = t >= t0 && t < out; el.style.display = on ? '' : 'none'; if (!on) return;
      const g = at(t), k = E.outCubic(prog(t, t0, t0 + rise)) * (isFinite(out) ? 1 - E.inCubic(prog(t, out - .25, out)) : 1) * (1 - flicker * hash(Math.floor(t * 12), 9));
      el.style.background = `radial-gradient(circle at ${g.x.toFixed(1)}px ${g.y.toFixed(1)}px, rgba(${color},${(a * k).toFixed(3)}) 0px, rgba(${color},${(a * k * .45).toFixed(3)}) ${(g.r * .45).toFixed(0)}px, rgba(${color},0) ${g.r.toFixed(0)}px)`;
    },
  });

  // ===== mürekkep çizimleri (yazısız SVG; kâğıt çıkartmaların içi) =====
  const inkS = (w, h, body, sw = 7, col = INK) => `<svg width="${w}" height="${h}" viewBox="0 0 100 ${(100 * h / w).toFixed(1)}" style="display:block;overflow:visible" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const ink = {
    code: (w = 150, col = INK) => inkS(w, w * .62, `<path d="M30 10 L6 31 L30 52"/><path d="M58 6 L44 56"/><path d="M72 10 L96 31 L72 52"/>`, 8, col),
    person: (w = 170, col = INK) => inkS(w, w * .86, `<circle cx="30" cy="24" r="12"/><path d="M8 84 C10 56 50 56 52 84"/><rect x="58" y="30" width="38" height="28" rx="4"/><path d="M77 58 V70 M66 72 H88"/><path d="M50 68 L66 62"/>`, 6, col),
    calendar: (w = 180, col = INK) => inkS(w, w * .9, `<rect x="6" y="12" width="88" height="76" rx="6"/><path d="M6 30 H94"/><path d="M28 4 V18 M72 4 V18"/>` +
      [0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<rect x="${13 + c * 20}" y="${37 + r * 16}" width="13" height="10" rx="2" ${(r * 4 + c) % 5 === 1 ? `fill="${YEL}" stroke="${col}"` : ''}/>`).join('')).join('') + `<circle cx="59.5" cy="58" r="11" stroke="${RED}" stroke-width="4"/>`, 5, col),
    receipt: (w = 150, col = INK) => inkS(w, w * 1.3, `<path d="M12 4 H88 V118 L78 126 L68 118 L58 126 L48 118 L38 126 L28 118 L18 126 L12 120 Z"/><path d="M24 24 H76 M24 40 H64 M24 56 H72 M24 72 H58"/><path d="M24 96 H76" stroke-width="8"/>`, 5, col),
    chart: (w = 180, col = INK) => inkS(w, w * .85, `<path d="M8 6 V80 H96"/><rect x="18" y="52" width="13" height="28" fill="${YEL}"/><rect x="38" y="40" width="13" height="40" fill="${YEL}"/><rect x="58" y="26" width="13" height="54" fill="${YEL}"/><rect x="78" y="12" width="13" height="68" fill="${YEL}"/><path d="M16 44 L44 30 L60 34 L88 8 M76 8 H88 V20" stroke="${RED}" stroke-width="4"/>`, 5, col),
    todo: (w = 160, col = INK) => inkS(w, w * 1.05, [0, 1, 2].map(i => `<rect x="8" y="${10 + i * 34}" width="18" height="18" rx="3"/><path d="M38 ${19 + i * 34} H${88 - i * 10}"/>` +
      (i < 2 ? `<path d="M10 ${18 + i * 34} L17 ${26 + i * 34} L30 ${6 + i * 34}" stroke="${RED}" stroke-width="5"/>` : '')).join(''), 5, col),
    stopwatch: (w = 190, col = INK) => inkS(w, w * 1.12, `<circle cx="50" cy="62" r="40"/><path d="M42 8 H58 M50 8 V22"/><path d="M80 28 L88 20"/>` +
      Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<path d="M${(50 + Math.sin(a) * 33).toFixed(1)} ${(62 - Math.cos(a) * 33).toFixed(1)} L${(50 + Math.sin(a) * (i % 3 ? 30 : 26)).toFixed(1)} ${(62 - Math.cos(a) * (i % 3 ? 30 : 26)).toFixed(1)}" stroke-width="${i % 3 ? 3 : 5}"/>`; }).join('') +
      `<g class="sw-hand"><path d="M50 62 L50 30" stroke="${RED}" stroke-width="6"/></g><circle cx="50" cy="62" r="5" fill="${col}"/>`, 6, col),
  };

  // ===== arayüz maketleri (yazısız; marka renkleri): uygulama kendini kurar / form =====
  // app: blocks [{t}] stop-motion düşer, alive t'de canlanır (çubuklar büyür, anahtarlar açılır, düğme nabız + tik)
  const appUI = ({ w = 560, h = 1200, build = [], alive, bottom = 70, accent = (B.colors && B.colors.blue) || '#2F6BFF', navy = (B.colors && B.colors.brand) || '#0B3568' }) => {
    const bars = [.42, .66, .5, .86, .72], blk = (i, st, inner) => `<div class="ab" data-b="${i}" style="position:absolute;${st}">${inner}</div>`;
    const html = `<div style="position:absolute;left:0;right:0;top:0;bottom:${bottom}px;background:#FFFFFF"></div>` +
      blk(0, `left:28px;top:70px;width:${w - 56}px;height:96px;border-radius:22px;background:${navy};display:flex;align-items:center;gap:16px;padding:0 22px`,
        `<div style="width:58px;height:58px;border-radius:50%;background:${YEL}"></div><div style="flex:1"><div style="height:14px;width:62%;border-radius:7px;background:rgba(255,255,255,.85)"></div><div style="height:10px;width:40%;margin-top:12px;border-radius:5px;background:rgba(255,255,255,.45)"></div></div>`) +
      blk(1, `left:28px;top:190px;width:${w - 56}px;height:300px;border-radius:26px;background:#fff;box-shadow:0 8px 24px rgba(20,30,60,.12);padding:26px`,
        `<div style="height:14px;width:46%;border-radius:7px;background:#D9DEE8"></div><div style="position:absolute;left:30px;right:30px;bottom:24px;height:196px;display:flex;align-items:flex-end;gap:18px">` +
        bars.map((v, i) => `<div class="abar" data-v="${v}" style="flex:1;height:${v * 100}%;border-radius:10px 10px 4px 4px;background:${i === 3 ? YEL : accent};transform-origin:50% 100%"></div>`).join('') + `</div>` +
        `<div class="atick" style="position:absolute;right:-16px;top:-16px;width:70px;height:70px;border-radius:50%;background:#1FB766;display:grid;place-items:center;box-shadow:0 6px 16px rgba(0,0,0,.2)"><svg width="40" height="40" viewBox="0 0 30 30"><path d="M6 16l6 6 12-13" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`) +
      [0, 1].map(k => blk(2 + k, `left:${28 + k * ((w - 56) / 2 + 9)}px;top:510px;width:${(w - 56) / 2 - 9}px;height:170px;border-radius:24px;background:#fff;box-shadow:0 8px 24px rgba(20,30,60,.12);padding:22px`,
        `<div style="width:62px;height:62px;border-radius:18px;background:${k ? YEL : '#DDE8FF'}"></div><div style="height:12px;width:70%;margin-top:22px;border-radius:6px;background:#D9DEE8"></div><div style="height:10px;width:46%;margin-top:12px;border-radius:5px;background:#E6E9F0"></div>`)).join('') +
      blk(4, `left:28px;top:820px;width:${w - 56}px;height:236px;border-radius:24px;background:#fff;box-shadow:0 8px 24px rgba(20,30,60,.12);padding:12px 24px`,
        [0, 1, 2].map(i => `<div style="display:flex;align-items:center;height:70px;gap:18px;border-bottom:${i < 2 ? '2px solid #EEF0F4' : '0'}"><div style="width:40px;height:40px;border-radius:50%;background:#E6E9F0"></div><div style="flex:1;height:12px;border-radius:6px;background:#D9DEE8;max-width:${54 - i * 8}%"></div><div class="atg" style="width:74px;height:40px;border-radius:20px;background:#D5DAE3;position:relative"><div style="position:absolute;left:4px;top:4px;width:32px;height:32px;border-radius:50%;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.2)"></div></div></div>`).join('')) +
      blk(5, `left:60px;top:702px;width:${w - 120}px;height:96px;border-radius:48px;background:${accent};display:grid;place-items:center;box-shadow:0 10px 24px rgba(47,107,255,.35)`,
        `<svg class="abtn" width="48" height="48" viewBox="0 0 48 48"><path d="M10 24 H36 M26 13 L37 24 L26 35" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
    return { w, h, html, render(t, el) {
      el.querySelectorAll('.ab').forEach(b => { const i = +b.dataset.b, t0 = build[i] ?? -1, k = Math.floor((t - t0) * 12 + 1e-6);
        b.style.opacity = k < 0 ? 0 : 1; b.style.transform = k <= 0 ? `translateY(-46px) rotate(${(hash(i, 2) - .5) * 6}deg) scale(1.04)` : k === 1 ? 'translateY(9px)' : ''; });
      const al = alive ?? Infinity;
      el.querySelectorAll('.abar').forEach((bar, i) => { const k = clamp(Math.floor((t - al - i * .05) * 12) / 4); bar.style.transform = `scaleY(${lerp(.18, 1, k).toFixed(3)})`; });
      el.querySelectorAll('.atg').forEach((g, i) => { const on = t >= al + .1 + i * .1; g.style.background = on ? '#1FB766' : '#D5DAE3'; g.firstChild.style.left = on ? '38px' : '4px'; });
      const tk = el.querySelector('.atick'), kk = Math.floor((t - al - .25) * 12); tk.style.opacity = kk < 0 ? 0 : 1; tk.style.transform = kk <= 0 ? 'scale(1.3)' : kk === 1 ? 'scale(.92)' : '';
      const bt = el.querySelector('[data-b="5"]'), pu = t >= al ? Math.sin(clamp((t - al) / .5) * Math.PI) : 0; if (bt && t >= (build[5] ?? -1) + .17) bt.style.transform = `scale(${(1 + .07 * pu).toFixed(3)})`;
    } };
  };
  // form: başlıkta logo; alanlar (etiket + dolan yazısız çizgi), düğme; press: dokunuş, done: tik, brand: logo vurgusu
  const formUI = ({ w = 560, h = 1240, bottom = 70, fields = ['Ad Soyad', 'Telefon'], fill = [], press, done, brand, logo = B.logo && B.logo.avatar, accent = (B.colors && B.colors.blue) || '#2F6BFF', navy = (B.colors && B.colors.brand) || '#0B3568', btnY = 470 }) => {
    const html = `<div style="position:absolute;left:0;right:0;top:0;bottom:${bottom}px;background:#FFFFFF"></div>` +
      `<div style="position:absolute;left:0;right:0;top:0;height:150px;background:${navy}"></div>` +
      `<div class="fl" style="position:absolute;left:50%;top:62px;width:126px;height:126px;margin-left:-63px;border-radius:50%;border:6px solid #fff;overflow:hidden;background:#000;box-shadow:0 10px 24px rgba(0,0,0,.25)">${logo ? `<img class="kimg" src="${asset(logo)}" style="width:100%;height:100%;object-fit:cover">` : ''}</div>` +
      fields.map((f, i) => `<div style="position:absolute;left:40px;right:40px;top:${206 + i * 104}px;font:800 32px Mont;color:#3A4458">${esc(f)}</div>` +
        `<div style="position:absolute;left:40px;right:40px;top:${246 + i * 104}px;height:54px;border-radius:14px;background:#fff;border:3px solid #D8DCE4;overflow:hidden"><div class="ff" data-i="${i}" style="position:absolute;left:18px;top:20px;height:14px;border-radius:7px;background:#B7BFCC;width:0"></div></div>`).join('') +
      `<div class="fb" style="position:absolute;left:40px;right:40px;top:${btnY}px;height:96px;border-radius:48px;background:${accent};display:grid;place-items:center;box-shadow:0 10px 24px rgba(47,107,255,.35)">` +
        `<svg class="fa" width="54" height="54" viewBox="0 0 48 48"><path d="M10 24 H36 M26 13 L37 24 L26 35" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>` +
        `<svg class="fc" width="60" height="60" viewBox="0 0 30 30" style="position:absolute;opacity:0"><path d="M6 16l6 6 12-13" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>` +
      `<div style="position:absolute;left:40px;right:40px;top:${btnY + 150}px">${[0, 1, 2, 3].map(i => `<div style="height:14px;border-radius:7px;background:#E3E6EC;margin-bottom:26px;width:${[92, 80, 86, 54][i]}%"></div>`).join('')}</div>`;
    return { w, h, html, render(t, el) {
      el.querySelectorAll('.ff').forEach((f, i) => { const f0 = fill[i] ?? Infinity, k = clamp(Math.floor((t - f0) * 12) / 5); f.style.width = `${(k * [68, 52][i % 2]).toFixed(1)}%`; });
      const b = el.querySelector('.fb'), pr = press ?? Infinity, dn = done ?? Infinity;
      const ps = t >= pr && t < pr + .22 ? .93 : 1; b.style.transform = `scale(${ps})`; b.style.filter = t >= pr && t < pr + .22 ? 'brightness(.82)' : '';
      const ok = t >= dn; b.style.background = ok ? '#1FB766' : accent; el.querySelector('.fa').style.opacity = ok ? 0 : 1;
      const k = Math.floor((t - dn) * 12), fc = el.querySelector('.fc'); fc.style.opacity = ok ? 1 : 0; fc.style.transform = k <= 0 ? 'scale(1.4)' : k === 1 ? 'scale(.9)' : '';
      const lg = el.querySelector('.fl'), bk = t >= (brand ?? Infinity) ? Math.sin(clamp((t - brand) / .45) * Math.PI) : 0; lg.style.transform = `scale(${(1 + .12 * bk).toFixed(3)})`;
    } };
  };

  // ===== altyazı stili (kolaj): sıkışık kalın kırık beyaz; hl kelimeler konuşulunca arkasında sarı marker şeridi (soldan çekilir), yazı koyu =====
  const capStyle = ({ plain = IVORY, ink = '#17120B', dur = .16 } = {}) => {
    document.body.classList.add('kcap');
    const CH = TL.chunks;
    POST.push(t => {
      let i = -1; for (let k = 0; k < CH.length; k++) if (t >= CH[k].s - .02 && t < CH[k].e) i = k;
      if (i < 0) return;
      document.querySelectorAll('#cap .cw').forEach((sp, n) => {
        const w = CH[i].w[n]; if (!w) return;
        const spoken = t >= w.s - .03;
        if (w.st === 'hl' && spoken) { const p = clamp((t - (w.s - .03)) / dur); sp.classList.add('kmk'); sp.style.setProperty('--mk', (p * 100).toFixed(1) + '%'); sp.style.color = p >= .999 ? ink : plain; }
        else { sp.classList.remove('kmk'); if (sp.style.color === 'rgb(255, 255, 255)' || sp.style.color === '#fff') sp.style.color = plain; }
      });
    });
  };
  // altyazıdaki bir kelimenin altına marker çizgisi (kelime konumu her karede altyazıdan okunur)
  const capUnderline = ({ word: wi, t: t0, dur = .3, out = Infinity, color = YEL, width = 9 }) => {
    let host = null; const seed = wi * 13 + 5;
    POST.push(t => {
      if (!host) return; const sv = host.firstChild;
      const on = t >= t0 && t < out && t < VIDEO_END; sv.style.display = 'none'; if (!on) return;
      const CH = TL.chunks; let i = -1; for (let k = 0; k < CH.length; k++) if (t >= CH[k].s - .02 && t < CH[k].e) i = k; if (i < 0) return;
      const n = CH[i].w.findIndex(w => w.i === wi); if (n < 0) return;
      const sp = document.querySelectorAll('#cap .cw')[n]; if (!sp || document.getElementById('cap').classList.contains('hide')) return;
      const R = sp.getBoundingClientRect(), y = R.bottom + 6, bi = Math.floor(t * 12);
      const pts = SH.underline(R.left - 4, R.right + 4, y, { seed, back: false }).map(([px, py], k) => [px + (hash(bi, k, seed) - .5) * 2, py + (hash(bi, k + 50, seed) - .5) * 2]);
      sv.style.display = '';
      const p = E.outCubic(prog(t, t0, t0 + dur));
      for (const el of sv.querySelectorAll('path')) { el.setAttribute('d', smoothD(pts, false)); css(el, { strokeDasharray: '1 1', strokeDashoffset: (1 - p).toFixed(4) }); }
    });
    return {
      html: `<svg class="k-capul" style="position:absolute;left:0;top:0;overflow:visible;display:none" width="1" height="1"><path pathLength="1" fill="none" stroke="rgba(12,8,4,.45)" stroke-width="${width + 3}" stroke-linecap="round" transform="translate(1.5,3)"/><path pathLength="1" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/></svg>`,
      render(t, r) { host = r; },
    };
  };

  // ===== dikey akış izi (ör. merdiven): izler.json 'merdiven' {n0, n1, band, h, dy:{n:[..]}} -> (y0 ekran, n0, n) -> y =====
  const flowY = tb => {
    const sc = H / tb.h, cache = new Map();
    const dyAt = (n, yS) => { const row = tb.dy[n]; if (!row) return 0; const yy = yS / sc, f = yy / tb.band - .5, i = clamp(Math.floor(f), 0, row.length - 1), j = clamp(i + 1, 0, row.length - 1), u = clamp(f - i);
      return lerp(row[i], row[j], u) * sc; };
    return (y0, nA, n) => { const key = `${y0}|${nA}`; let arr = cache.get(key);
      if (!arr) { arr = { [nA]: y0 }; let y = y0; for (let k = nA; k < tb.n1; k++) { y += dyAt(k, y); arr[k + 1] = y; } cache.set(key, arr); }
      return n <= nA ? y0 : (arr[Math.min(n, tb.n1)] ?? y0); };
  };

  // ===== stiller =====
  const st = document.createElement('style');
  st.textContent = `
.k-full{position:absolute;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none}
.k-box{background:rgba(0,0,0,0.002);pointer-events:none}
.k-stk-c{color:${INK};font-family:${COND};font-weight:900}
body.kcap #cap.s2{font-family:${COND};font-weight:800;letter-spacing:.2px;line-height:1.42}
body.kcap #cap.s2 .bgl{background:rgba(16,12,8,.66);padding:.06em .36em .1em;border-radius:.18em}
body.kcap #cap.s2 .cw{text-shadow:0 2px 0 rgba(0,0,0,.28);padding:0 .07em;margin:0 .02em;border-radius:.1em}
body.kcap #cap .cw.kmk{text-shadow:none;background-image:linear-gradient(${YEL},${YEL});
  background-repeat:no-repeat;background-size:var(--mk,0%) 80%;background-position:0 60%}
`;
  document.head.appendChild(st);

  window.K = {
    GRADE: 'contrast(1.05) saturate(.86) sepia(.1) brightness(.99)', IVORY, INK, YEL, RED, COND, HAND,
    fileAt, frameUrl, maskUrl, stop, retouch, hash, rng, json, img, need, post: f => POST.push(f), camOf, camPt, camCss, alpha, maskBox,
    paperTex, tornRect, homography, quadTrack, flowY, SH, ink, appUI, formUI,
    film, plate, cutout, screen, marker, note, title, sticker, board, windowWord, contour, glow, capStyle, capUnderline,
  };
})();
