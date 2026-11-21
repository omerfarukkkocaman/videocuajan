// Premium vitrin bileşenleri: güzellik / klinik ÖNCESİ-SONRASI reklamı. İki dil: zarif (krem ipek zemin, altın çerçeveli klip kartı, Didot)
// ve cesur sosyal (tam ekran klip, kalın sıkışık yazı + eğik altın kutu, 'pat' girişleri, IG/WhatsApp satırları: PR.punch, PR.veil, PR.ICON).
// Örnek: .claude/skills/reels/ornekler/oncesi-sonrasi. Yükleme: plan.json "libs": ["kolaj", "premium"] (kolaj isteğe bağlı: gren için K.film).
// library.js'e dokunmaz (mevcut varsayılanlar korunur). Global: window.PR.
// Parçalar L.scene({z, parts:[...]}) içine konur: {html, render(t, root)}; her kare t'den saf (Date/rastgele yok).
// Kare görüntüleri renderAt'tan ÖNCE yüklenir (need -> renderAt sarmalayıcısı), tuvale eşzamanlı çizilir (boş kare olmaz).
// Güvenli alan: tam ekran zemin data-safe=ignore; kart çerçevesi, yazılar, logo, ok denetime girer.
// Hareket dili (kurallar.md §4 doğal geçiş): yaysız ease (inOutCubic / outCubic), yay yalnız küçük vurgu elemanında (ok dairesi).
(function () {
  const { clamp, lerp, prog, E, spring, css, FPS, W, H } = window.M;
  const TL = window.TIMELINE, B = window.BRAND || {};
  const NF = TL.frames;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const asset = f => /^(\.|\/|work\/|https?:)/.test(f) ? f : (B.base || '') + f;
  const pad4 = n => String(n).padStart(4, '0');
  const fileAt = t => clamp(Math.floor(t * FPS + 1e-6), 0, NF - 1) + 1;          // motorla aynı: t -> 1 tabanlı kare
  const fn = v => typeof v === 'function' ? v : () => v;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const inOutSine = u => -(Math.cos(Math.PI * clamp(u)) - 1) / 2;
  const EZ = n => (n === 'inOutSine' ? inOutSine : E[n]) || E.inOutCubic;
  const hex = c => { const h = c.replace('#', ''); const v = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
    return [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16)); };
  const rgba = (c, a) => { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${(+a).toFixed(4)})`; };
  const qa = s => String(s).replace(/"/g, "'");                                   // style="" niteliği içinde çift tırnak kullanılamaz
  const fontCss = o => qa(`${o.italic ? 'italic ' : ''}${o.weight ?? 400} ${o.size}px ${o.font || "Didot, 'Bodoni 72', 'Bodoni MT', Georgia, serif"}`);
  const up = s => s.toLocaleUpperCase('tr-TR');
  const fadeOut = (t, a, d) => isFinite(a) ? 1 - E.inCubic(prog(t, a, a + d)) : 1;     // out = Infinity -> prog NaN olmasın (plan-ve-sahne.md tuzak)

  // ===== görüntü önbelleği (LRU) + kare başı ön yükleme =====
  const IMG = new Map();
  function img(url) {
    let e = IMG.get(url);
    if (e) { IMG.delete(url); IMG.set(url, e); return e; }
    const im = new Image(); e = { im, ok: false };
    im.src = url; e.p = im.decode().then(() => { e.ok = true; }, () => { e.bad = true; console.error('YÜKLENEMEDİ (premium): ' + url); });
    IMG.set(url, e);
    while (IMG.size > 40) IMG.delete(IMG.keys().next().value);
    return e;
  }
  const NEEDS = [], POST = [];                                                    // POST: motor kareyi çizdikten sonra (ör. altyazı stili)
  const R0 = window.renderAt;
  window.renderAt = async function (t) {
    const us = new Set(); for (const f of NEEDS) for (const u of (f(t) || [])) us.add(u);
    await Promise.all([...us].map(u => img(u).p));
    await R0(t);
    for (const f of POST) f(t);
    const pend = [...document.querySelectorAll('img.pr-img')].filter(i => !i.complete);
    if (pend.length) await Promise.all(pend.map(i => i.decode().catch(() => {})));
  };

  // ===== ipek / aurora zemin (tam ekran, data-safe=ignore) =====
  // Yükseklik alanı = eğik, kendi içinde bükülen birkaç yavaş dalga; yüzey normali ışıkla gölgelenir (yumuşak satin kıvrımı + parıltı).
  // Düşük çözünürlükte hesaplanır (res: büyütme katı), CSS ile büyütülür (zaten yumuşak). Her kare t'den saf; gren için K.film üstte.
  // colors: {shade, base, light, hi} (koyu kıvrım, orta, açık, parıltı) · speed: akış hızı · angle: kıvrım yönü (derece)
  // relief: kıvrım derinliği · spec/specA: parıltı keskinliği/gücü · wash: üstüne CSS katmanı (ör. kartın arkasında ışık) · seed
  const silk = ({ res = 4, colors, speed = 1, angle = -24, relief = 1, spec = 20, specA = .5, light = [-.5, -.42, .76], wash, seed = 0 } = {}) => {
    const C0 = Object.assign({ shade: '#CDB18C', base: '#E8D8C3', light: '#F7F0E6', hi: '#FFFDF8' }, colors || {});
    const [cS, cB, cL, cH] = [C0.shade, C0.base, C0.light, C0.hi].map(hex);
    const w = Math.ceil(W / res), h = Math.ceil(H / res);
    const A = angle * Math.PI / 180, ca = Math.cos(A), sa = Math.sin(A);
    const nl = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
    const Ln = nl(light), Hv = nl([Ln[0], Ln[1], Ln[2] + 1]);
    // dalgalar: [genlik, k (1000 px başına rad), faz hızı, bükülme genliği, bükülme k, bükülme hızı, faz0, bükülme0]
    const WV = [[1, 4.2, .34, 1.15, 1.35, .19, .3, 1.1], [.46, 7.4, -.27, .75, 2.2, -.26, 2.1, .4], [.2, 12.2, .46, .5, 3.3, .33, 4.2, 2.9]];
    let x, id;
    return {
      html: `<canvas class="pr-silk" width="${w}" height="${h}" data-safe="ignore" style="position:absolute;left:0;top:0;width:${W}px;height:${H}px"></canvas>` +
            (wash ? `<div data-safe="ignore" style="position:absolute;left:0;top:0;width:${W}px;height:${H}px;background:${qa(wash)}"></div>` : ''),
      render(t, r) {
        const cv = r.firstChild; x = x || cv.getContext('2d'); id = id || x.createImageData(w, h);
        const d = id.data, tau = t * speed, k1 = relief * .085;
        let o = 0;
        for (let j = 0; j < h; j++) {
          const yy = (j + .5) * res / 1000;
          for (let i = 0; i < w; i++, o += 4) {
            const xx = (i + .5) * res / 1000, p = xx * ca + yy * sa, q = -xx * sa + yy * ca;
            let hp = 0, hq = 0;
            for (let m = 0; m < 3; m++) {
              const v = WV[m], wa = v[4] * q + v[5] * tau + v[7] + seed, warp = v[3] * Math.sin(wa);
              const c = Math.cos(v[1] * p + v[2] * tau + v[6] + warp) * v[0];
              hp += c * v[1]; hq += c * v[3] * v[4] * Math.cos(wa);
            }
            let nx = -hp * k1, ny = -hq * k1, nz = 1; const il = 1 / Math.sqrt(nx * nx + ny * ny + 1); nx *= il; ny *= il; nz *= il;
            const dif = nx * Ln[0] + ny * Ln[1] + nz * Ln[2];
            const s = Math.pow(Math.max(0, nx * Hv[0] + ny * Hv[1] + nz * Hv[2]), spec) * specA;
            const u = clamp((dif - .42) / .5);
            let rr, gg, bb;
            if (u < .5) { const k = u * 2; rr = cS[0] + (cB[0] - cS[0]) * k; gg = cS[1] + (cB[1] - cS[1]) * k; bb = cS[2] + (cB[2] - cS[2]) * k; }
            else { const k = u * 2 - 1; rr = cB[0] + (cL[0] - cB[0]) * k; gg = cB[1] + (cL[1] - cB[1]) * k; bb = cB[2] + (cL[2] - cB[2]) * k; }
            d[o] = rr + (cH[0] - rr) * s; d[o + 1] = gg + (cH[1] - gg) * s; d[o + 2] = bb + (cH[2] - bb) * s; d[o + 3] = 255;
          }
        }
        x.putImageData(id, 0, 0);
      },
    };
  };

  // ===== klip kartı / tam ekran klip: iki katmanlı (öncesi a / sonrası b) kare dizisi; ışın taraması, karşılaştırma sürgüsü, buzlu cam =====
  // x,y,w,h,r: kart (ekran px) · layers: {a: n -> url, b: n -> url} (1 tabanlı kare; ikisi kare kare aynı an, piksel hizalı)
  // bare: true -> tam ekran klip (çerçeve/gölge/köşe yok, zemin data-safe=ignore; x 0, y 0, w W, h H ver) · filter: CSS tuval filtresi (ör. 'contrast(1.08) saturate(1.12)')
  // frame: t -> n (vars. motorla aynı) · crop: {x, y, zoom} kaynakta odak noktası (0..1, kart merkezine gelir; kenar boş kalmaz), sayı ya da t -> sayı
  // show: t -> 'a' | 'b' (vars. scan'den önce a, sonra b)
  // scan: {t, dur, ease, color, core, width (çekirdek px), glow (px), glowA, halo (px), haloColor, haloA, fresh} yatay ışın yukarıdan aşağı tarar; geçtiği yer b'ye döner
  // compare: {a, b, at (0..1 ya da t -> ..), inDur, outDur, line: {w, color, glow}, knob: {r, bg, ring, ink} | sayı | 0,
  //           tags: {a, b, size, font, top, inset, mode: 'corner' | 'divider' (çizginin iki yanında, son konuma göre), gap, css: {a, b} (kutu CSS'i)}}
  //           dikey çizgi soldan girer: solu a, sağı b; sonra geri çekilir
  // frost: {until, dur, blur, veil, color, zoom} buzlu cam (kanca okunurken), until'den itibaren dur sürede açılır (hafif uzaklaşmayla)
  // float: {y, rx, ry, persp, periods:[..]} | false yavaş süzülme + 3B eğim · moves: [{a, b, x, y, s}] kart merkezi/ölçeği (inOutCubic; ör. çağrıda küçülüp yukarı)
  // ring: {w, bg (CSS)} altın çerçeve · shadow (CSS) · watermark: {src, size, right, bottom, opacity, filter} kartın üstünde filigran
  // glint: {t, dur, x, y, size} tek zarif parıltı (kart içi px, çerçeve köşesi) · out/outDur: söner
  // inT, inDur: t'de belirir (üstteki ikinci klip katmanıyla çapraz geçiş) · anchor: t -> {s, ax, ay, sx, sy} serbest kadraj (yüz takibiyle konuşan kafayı reklam bölgesine taşımak için; under, fadeBottom: açılan alan)
  const frameCard = ({ x = 0, y = 0, w = W, h = H, r = 34, layers, frame = fileAt, crop = {}, show, scan, compare, frost, float, moves = [], ring = {}, shadow,
                       watermark, glint, bg = '#EDE3D6', bare = false, filter, anchor, under = '#120E0C', fadeBottom = 160, inT, inDur = .17, out = Infinity, outDur = .4 } = {}) => {
    const fx = fn(crop.x ?? .5), fy = fn(crop.y ?? .5), fz = fn(crop.zoom ?? 1);
    const RW = bare ? 0 : ring.w ?? 3, ringBg = ring.bg || 'linear-gradient(145deg,#F1DDB0 0%,#C9A46A 28%,#8F6B37 52%,#D9BC84 74%,#A88148 100%)';
    const SH = shadow ?? '0 46px 90px -26px rgba(74,50,22,.5), 0 14px 34px -10px rgba(74,50,22,.28)';
    const R_ = bare ? 0 : r, still = bare && float === false && !moves.length;
    const scanEnd = scan ? scan.t + scan.dur : Infinity;
    const showAt = t => show ? show(t) : (t >= scanEnd ? 'b' : 'a');
    const scanPos = t => scan && t >= scan.t && t < scanEnd ? EZ(scan.ease || 'inOutSine')(prog(t, scan.t, scanEnd)) : null;
    const cmpPos = t => {
      if (!compare) return 0;
      const at = fn(compare.at ?? .5)(t), i = compare.inDur ?? .4, o = compare.outDur ?? .35;
      return at * (E.inOutCubic(prog(t, compare.a, compare.a + i)) - E.inOutCubic(prog(t, compare.b - o, compare.b)));
    };
    const frostAt = t => frost ? 1 - E.inOutCubic(prog(t, frost.until, frost.until + (frost.dur ?? .6))) : 0;
    NEEDS.push(t => {
      if (t >= out + outDur) return [];
      const n = frame(t), sp = scanPos(t), cp = cmpPos(t);
      if (sp != null || cp > .0005) return [layers.a(n), layers.b(n)];
      return [layers[showAt(t)](n)];
    });
    const cx0 = x + w / 2, cy0 = y + h / 2;
    const TG = compare && compare.tags, divTags = TG && TG.mode === 'divider';
    const TAG = TG ? (side, txt) => {
      const pos = divTags ? `top:${TG.top ?? 22}px;left:0;` : `top:${TG.top ?? 22}px;${side === 'a' ? 'left' : 'right'}:${TG.inset ?? 22}px;`;
      const look = TG.css && TG.css[side] ? qa(TG.css[side]) :
        `font:600 ${TG.size ?? 21}px ${qa(TG.font || "'Avenir Next', 'Segoe UI', sans-serif")};letter-spacing:.18em;color:#161311;padding:.42em .62em .38em .8em;` +
        `border-radius:999px;background:rgba(247,240,230,.86);box-shadow:0 4px 14px rgba(40,26,10,.18);`;
      return `<div class="pr-tag pr-tag-${side}" style="position:absolute;${pos}white-space:nowrap;${look};opacity:0">${esc(txt)}</div>`; } : () => '';
    const G = glint || null, gs = G ? G.size ?? 54 : 0;
    const star = G ? `<svg class="pr-glint" width="${gs}" height="${gs}" viewBox="-1 -1 2 2" style="position:absolute;left:${(G.x ?? w) - gs / 2}px;top:${(G.y ?? 0) - gs / 2}px;opacity:0;overflow:visible">` +
      `<defs><radialGradient id="prGl"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#FFF4DA"/><stop offset="1" stop-color="#E2C27E"/></radialGradient></defs>` +
      `<path d="M0,-1 C.07,-.12 .12,-.07 1,0 C.12,.07 .07,.12 0,1 C-.07,.12 -.12,.07 -1,0 C-.12,-.07 -.07,-.12 0,-1Z" fill="url(#prGl)"/>` +
      `<circle r=".16" fill="#FFFFFF" opacity=".9"/></svg>` : '';
    const WM = watermark ? `<img class="pr-img pr-wm" src="${asset(watermark.src)}" style="position:absolute;right:${watermark.right ?? 24}px;bottom:${watermark.bottom ?? 22}px;` +
      `width:${watermark.size ?? 110}px;height:auto;opacity:${watermark.opacity ?? .3};${watermark.filter ? `filter:${qa(watermark.filter)};` : ''}">` : '';
    const RING = bare ? '' : `<div class="pr-ring" style="position:absolute;left:${-RW}px;top:${-RW}px;width:${w + 2 * RW}px;height:${h + 2 * RW}px;border-radius:${r + RW}px;background:${qa(ringBg)};box-shadow:${qa(SH)}"></div>`;
    const HAIR = bare ? '' : `<div style="position:absolute;inset:0;border-radius:${r}px;box-shadow:inset 0 0 0 1px rgba(255,248,232,.38), inset 0 -60px 80px -60px rgba(30,18,6,.18)"></div>`;
    let ctx, cv, rootEl, tagA, tagB, gl;
    return {
      html: `<div class="pr-card" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform-origin:50% 50%">${RING}` +
        `<div class="pr-clip"${bare ? ' data-safe="ignore"' : ''} style="position:absolute;left:0;top:0;width:${w}px;height:${h}px;border-radius:${R_}px;overflow:hidden;${bare ? '' : `background:${bg}`}">` +
        `<canvas width="${w}" height="${h}" style="position:absolute;left:0;top:0;width:${w}px;height:${h}px"></canvas>${WM}${TAG('a', TG?.a || '')}${TAG('b', TG?.b || '')}` +
        `${HAIR}</div>${star}</div>`,
      render(t, root) {
        if (!rootEl) { rootEl = root.firstChild; cv = rootEl.querySelector('canvas'); ctx = cv.getContext('2d'); tagA = rootEl.querySelector('.pr-tag-a'); tagB = rootEl.querySelector('.pr-tag-b'); gl = rootEl.querySelector('.pr-glint'); }
        const vo = fadeOut(t, out, outDur) * (inT == null ? 1 : clamp((t - inT) / inDur));   // inT: belirme (ör. donan kareye çapraz geçiş)
        rootEl.style.display = vo > .001 ? '' : 'none'; if (vo <= .001) return;
        // --- kart dönüşümü: hareketler + süzülme/eğim (tam ekran sabit klipte dönüşüm yok) ---
        if (still) rootEl.style.opacity = vo.toFixed(4);
        else {
          let st = { x: cx0, y: cy0, s: 1 };
          for (const m of moves) { const u = E.inOutCubic(prog(t, m.a, m.b)); st = { x: lerp(st.x, m.x ?? st.x, u), y: lerp(st.y, m.y ?? st.y, u), s: lerp(st.s, m.s ?? st.s, u) }; }
          const FL = Object.assign({ y: 5, rx: .7, ry: 1, persp: 1800, periods: [9.5, 8.3, 11.2] }, float || {});
          const tw = 2 * Math.PI, fyv = float === false ? 0 : FL.y * Math.sin(tw * t / FL.periods[0]);
          const rx = float === false ? 0 : FL.rx * Math.sin(tw * t / FL.periods[1] + 1.1), ry = float === false ? 0 : FL.ry * Math.sin(tw * t / FL.periods[2] + 2.3);
          css(rootEl, { opacity: vo.toFixed(4), transform: `translate(${(st.x - cx0).toFixed(2)}px,${(st.y - cy0 + fyv).toFixed(2)}px) scale(${st.s.toFixed(5)}) ` +
            `perspective(${FL.persp}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)` });
        }
        // --- görüntü ---
        const n = frame(t), sp = scanPos(t), cp = cmpPos(t), f = frostAt(t);
        const ea = img(layers.a(n)), eb = img(layers.b(n));
        const base = sp != null ? ea : cp > .0005 ? eb : (showAt(t) === 'a' ? ea : eb);
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h);
        // anchor (isteğe bağlı): t -> {s, ax, ay, sx, sy}: genişlik w*s, kaynaktaki (ax, ay) noktası kartta (sx, sy)'de (yatayda kenar boş kalmaz,
        // dikeyde serbest: yüz reklam bölgesine çıkarılır; alttan açılan alan 'under' rengiyle dolar, görüntünün alt kenarı fadeBottom px'te ona erir)
        const AN = anchor ? anchor(t) : null;
        const geo = im => { const iw = im.naturalWidth, ih = im.naturalHeight;
          if (AN) { const dw = w * AN.s, dh = dw * ih / iw; return [clamp(AN.sx - AN.ax * dw, w - dw, 0), AN.sy - AN.ay * dh, dw, dh]; }
          const sc = Math.max(w / iw, h / ih) * fz(t) * (1 + (frost ? frost.zoom ?? .06 : 0) * f);
          const dw = iw * sc, dh = ih * sc; return [clamp(w / 2 - fx(t) * dw, w - dw, 0), clamp(h / 2 - fy(t) * dh, h - dh, 0), dw, dh]; };
        if (AN) { ctx.fillStyle = under; ctx.fillRect(0, 0, w, h); }
        const flt = [filter || '', f > .001 ? `blur(${((frost.blur ?? 24) * f).toFixed(2)}px)` : ''].join(' ').trim() || 'none';
        const draw = (e, clipR) => { if (!e.ok) return; ctx.save(); if (clipR) { ctx.beginPath(); ctx.rect(...clipR); ctx.clip(); }
          ctx.filter = flt;
          const [ox, oy, dw, dh] = geo(e.im); ctx.drawImage(e.im, ox, oy, dw, dh); ctx.restore(); };
        draw(base);
        if (AN && base.ok) {                                                       // görüntünün alt / üst kenarı dolguya yumuşakça erir
          const [, oy, , dh] = geo(base.im), yb = oy + dh, yt = oy;
          if (yb < h) { const g = ctx.createLinearGradient(0, yb - fadeBottom, 0, yb); g.addColorStop(0, rgba(under, 0)); g.addColorStop(1, rgba(under, 1));
            ctx.fillStyle = g; ctx.fillRect(0, yb - fadeBottom, w, fadeBottom + 1); }
          if (yt > 0) { const g = ctx.createLinearGradient(0, yt, 0, yt + fadeBottom); g.addColorStop(0, rgba(under, 1)); g.addColorStop(1, rgba(under, 0));
            ctx.fillStyle = g; ctx.fillRect(0, yt - 1, w, fadeBottom + 1); }
        }
        if (sp != null) draw(eb, [0, 0, w, sp * h]);
        if (cp > .0005 && sp == null) draw(ea, [0, 0, cp * w, h]);
        if (f > .001) { ctx.fillStyle = rgba(frost.color || '#F4ECE1', (frost.veil ?? .6) * f); ctx.fillRect(0, 0, w, h); }
        // --- tarama ışını ---
        if (sp != null) {
          const ly = sp * h, a = sstep(0, .05, sp) * (1 - sstep(.95, 1, sp)), col = scan.color || '#E8C680', fresh = scan.fresh ?? 160;
          const gw = scan.glow ?? 22, cw = scan.width ?? 2.8, hw = scan.halo ?? 0;
          ctx.save(); ctx.globalCompositeOperation = 'screen';
          let g;
          if (fresh > 0) { g = ctx.createLinearGradient(0, ly - fresh, 0, ly);
            g.addColorStop(0, rgba('#FFE9C2', 0)); g.addColorStop(1, rgba('#FFE9C2', .3 * a)); ctx.fillStyle = g; ctx.fillRect(0, ly - fresh, w, fresh); }
          if (hw > 0) { g = ctx.createLinearGradient(0, ly - hw, 0, ly + hw); const hc = scan.haloColor || col;
            g.addColorStop(0, rgba(hc, 0)); g.addColorStop(.5, rgba(hc, (scan.haloA ?? .5) * a)); g.addColorStop(1, rgba(hc, 0)); ctx.fillStyle = g; ctx.fillRect(0, ly - hw, w, 2 * hw); }
          g = ctx.createLinearGradient(0, ly - gw, 0, ly + gw);
          g.addColorStop(0, rgba(col, 0)); g.addColorStop(.5, rgba(col, (scan.glowA ?? .75) * a)); g.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = g; ctx.fillRect(0, ly - gw, w, 2 * gw);
          ctx.globalCompositeOperation = 'source-over';
          g = ctx.createLinearGradient(0, 0, w, 0);
          g.addColorStop(0, rgba(scan.core || '#FFFBF0', .7 * a)); g.addColorStop(.5, rgba(scan.core || '#FFFBF0', a)); g.addColorStop(1, rgba(scan.core || '#FFFBF0', .7 * a));
          ctx.fillStyle = g; ctx.fillRect(0, ly - cw / 2, w, cw);
          ctx.restore();
        }
        // --- karşılaştırma çizgisi + tutamak ---
        if (cp > .0005 && sp == null) {
          const lx = cp * w, ky = h / 2, LN = Object.assign({ w: 3, color: '#FFFBF2', glow: 0 }, compare.line || {});
          const KN = typeof compare.knob === 'object' ? Object.assign({ r: 30, bg: '#FFFBF2', ring: '#C9A46A', ink: '#B8925A' }, compare.knob)
                   : compare.knob === 0 ? null : { r: compare.knob ?? 30, bg: '#FFFBF2', ring: '#C9A46A', ink: '#B8925A' };
          ctx.save();
          if (LN.glow) { ctx.shadowColor = LN.glowColor || '#FFD27A'; ctx.shadowBlur = LN.glow; ctx.fillStyle = LN.color; ctx.fillRect(lx - LN.w / 2, 0, LN.w, h); }
          ctx.shadowColor = 'rgba(30,18,6,.35)'; ctx.shadowBlur = 14;
          ctx.fillStyle = LN.color; ctx.fillRect(lx - LN.w / 2, 0, LN.w, h);
          if (KN) {
            ctx.beginPath(); ctx.arc(lx, ky, KN.r, 0, Math.PI * 2); ctx.fillStyle = KN.bg; ctx.fill();
            ctx.shadowBlur = 0; if (KN.ring) { ctx.lineWidth = Math.max(2, KN.r * .07); ctx.strokeStyle = KN.ring; ctx.stroke(); }
            ctx.strokeStyle = KN.ink; ctx.lineWidth = Math.max(3.2, KN.r * .11); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            const c = KN.r * .3;
            ctx.beginPath(); ctx.moveTo(lx - c * .6, ky - c); ctx.lineTo(lx - c * 1.6, ky); ctx.lineTo(lx - c * .6, ky + c); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(lx + c * .6, ky - c); ctx.lineTo(lx + c * 1.6, ky); ctx.lineTo(lx + c * .6, ky + c); ctx.stroke();
          }
          ctx.restore();
        }
        if (tagA) {
          const at = fn(compare.at ?? .5)(t), k = clamp(cp / at), o = divTags ? sstep(.6, 1, k) : sstep(.35, 1, k);
          tagA.style.opacity = o.toFixed(3); tagB.style.opacity = o.toFixed(3);
          if (divTags) { const L0 = at * w, gp = TG.gap ?? 22;      // son çizgi konumunun iki yanında sabit (okunurken kaymaz)
            tagA.style.left = (L0 - gp - tagA.offsetWidth) + 'px'; tagB.style.left = (L0 + gp) + 'px'; }
        }
        // --- tek parıltı ---
        if (gl) { const u = prog(t, G.t, G.t + (G.dur ?? .6)), b = u > 0 && u < 1 ? Math.pow(Math.sin(Math.PI * u), 1.4) : 0;
          css(gl, { opacity: b.toFixed(3), transform: `scale(${(.2 + .8 * b).toFixed(3)}) rotate(${(50 * u).toFixed(1)}deg)` }); }
      },
    };
  };

  // ===== başlık bloğu (kanca / çağrı): satırlar ortalı, isteğe bağlı altın çizgi + alt satır; yerinde belirir, taşınıp küçülebilir =====
  // x, y: blok merkezi · lines: [{text, size, font, weight, italic, color, gradient (CSS, yazı dolgusu), spacing (em), maxW (sığmazsa küçülür), gap, lh}]
  // rule: {w, h, color, gap, t, dur} ortadan çizilir · sub: {text, size, font, weight, color, spacing, gap, t, dur, dy, upper}
  // enter: {t, dur, dy, stagger} satırlar sırayla belirir (verilmezse t=0'da yerinde: kanca) · settle: {line, from, t, dur} satır hafif büyükten oturur
  // move: {a, b, x, y, s} blok taşınır/küçülür (inOutCubic); alt satır + çizgi taşınırken söner (keepSub: true -> kalır) · out/outDur
  const headline = ({ x, y, lines = [], rule, sub, enter, settle, move, keepSub, out = Infinity, outDur = .4, width = 980 } = {}) => {
    const L1 = lines.map((l, i) => `<div class="pr-hl" style="line-height:${l.lh ?? 1.08};margin-top:${i ? l.gap ?? 0 : 0}px;white-space:nowrap">` +
      `<span class="pr-hs" style="display:inline-block;font:${fontCss(l)};letter-spacing:${l.spacing ?? 0}em;padding:0 .05em 0 ${(.05 + (l.spacing ?? 0)).toFixed(3)}em;` +
      (l.gradient ? `background:${qa(l.gradient)};-webkit-background-clip:text;background-clip:text;color:transparent;` : `color:${l.color || '#161311'};`) +
      `">${esc(l.text)}</span></div>`).join('');
    const RU = rule ? `<div class="pr-rule" style="width:${rule.w ?? 120}px;height:${rule.h ?? 2}px;margin:${rule.gap ?? 20}px auto 0;background:${rule.color || 'linear-gradient(90deg,rgba(201,164,106,0),#C9A46A 30%,#C9A46A 70%,rgba(201,164,106,0))'};transform:scaleX(0)"></div>` : '';
    const SU = sub ? `<div class="pr-sub" style="margin-top:${sub.gap ?? 18}px;white-space:nowrap"><span style="display:inline-block;font:${fontCss({ size: 26, weight: 500, font: "'Avenir Next', 'Segoe UI', sans-serif", ...sub })};` +
      `letter-spacing:${sub.spacing ?? .18}em;padding-left:${sub.spacing ?? .18}em;color:${sub.color || '#6B5A45'}">${esc(sub.upper === false ? sub.text : up(sub.text))}</span></div>` : '';
    let el, hl, ru, su, hh = 0;
    return {
      html: `<div class="pr-head" style="position:absolute;left:${x - width / 2}px;top:${y}px;width:${width}px;text-align:center;transform-origin:50% 50%">${L1}${RU}${SU}</div>`,
      render(t, root) {
        if (!el) {
          el = root.firstChild; hl = [...el.querySelectorAll('.pr-hs')]; ru = el.querySelector('.pr-rule'); su = el.querySelector('.pr-sub');
          lines.forEach((l, i) => { if (!l.maxW) return; let s = l.size; while (hl[i].offsetWidth > l.maxW && s > 10) { s -= 1; hl[i].style.fontSize = s + 'px'; } });
          hh = el.offsetHeight; el.style.top = (y - hh / 2) + 'px';
        }
        let st = { x, y, s: 1 };
        if (move) { const u = E.inOutCubic(prog(t, move.a, move.b)); st = { x: lerp(x, move.x ?? x, u), y: lerp(y, move.y ?? y, u), s: lerp(1, move.s ?? 1, u) }; }
        const vo = fadeOut(t, out, outDur);
        css(el, { transform: `translate(${(st.x - x).toFixed(2)}px,${(st.y - y).toFixed(2)}px) scale(${st.s.toFixed(5)})`, opacity: vo.toFixed(4), display: vo > .001 ? '' : 'none' });
        hl.forEach((s, i) => {
          let o = 1, dy = 0, sc = 1;
          if (enter) { const a = enter.t + i * (enter.stagger ?? .1), u = E.outCubic(prog(t, a, a + (enter.dur ?? .6))); o = u; dy = (1 - u) * (enter.dy ?? 18); }
          if (settle && (settle.line ?? 0) === i) sc = lerp(settle.from ?? 1.06, 1, E.outCubic(prog(t, settle.t ?? 0, (settle.t ?? 0) + (settle.dur ?? .5))));
          css(s, { opacity: o.toFixed(4), transform: `translateY(${dy.toFixed(2)}px) scale(${sc.toFixed(4)})` });
        });
        const so = move && !keepSub ? 1 - E.inOutCubic(prog(t, move.a, move.a + .4 * (move.b - move.a))) : 1;
        if (ru) { const u = E.inOutCubic(prog(t, rule.t ?? 0, (rule.t ?? 0) + (rule.dur ?? .5))); css(ru, { transform: `scaleX(${u.toFixed(4)})`, opacity: so.toFixed(4) }); }
        if (su) { const a = sub.t ?? 0, u = E.outCubic(prog(t, a, a + (sub.dur ?? .5)));
          css(su, { opacity: (u * so).toFixed(4), transform: `translateY(${((1 - u) * (sub.dy ?? 12)).toFixed(2)}px)` }); }
      },
    };
  };

  // ===== etiket: kelime harf harf değişir (ÖNCESİ -> SONRASI); aynı yer, aynı yazı yüzü; iki yanda altın kıl çizgi =====
  // x, y: merkez · words: [{text, t}] (her kelime kendi t'sinde aşağıdan yükselerek gelir, öncekinin harfleri yukarı kayıp söner)
  // size, font, weight, color, spacing (em) · rules: {w, gap, h, color, dur} · stagger, dur, rise (em) · lag: yeni kelime eskisinin çıkışından bu kadar sonra girer · out/outDur
  const swapLabel = ({ x, y, words = [], size = 56, font, weight = 400, color = '#161311', spacing = .3, rules, stagger = .035, dur = .42, rise = .75, lag = .16,
                       out = Infinity, outDur = .35 } = {}) => {
    const F0 = fontCss({ size, font, weight }), boxH = Math.round(size * 1.5);
    const WD = words.map((wd, i) => `<div class="pr-lw" data-i="${i}" style="position:absolute;left:0;right:0;top:0;height:${boxH}px;line-height:${boxH}px;text-align:center;white-space:nowrap;font:${F0};color:${color}">` +
      [...wd.text].map(c => `<span style="display:inline-block;letter-spacing:${spacing}em">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('') + '</div>').join('');
    const RL = rules ? side => `<i class="pr-lr" style="position:absolute;top:${boxH / 2 - (rules.h ?? 1.5) / 2}px;${side}:0;width:${rules.w ?? 80}px;height:${rules.h ?? 1.5}px;` +
      `background:${rules.color || '#B8925A'};transform-origin:${side === 'left' ? 'right' : 'left'} center;transform:scaleX(0)"></i>` : () => '';
    let el, clip, wl, rl, ww = 0;
    return {
      html: `<div class="pr-label" style="position:absolute;left:${x}px;top:${y - boxH / 2}px;height:${boxH}px">${RL('left')}<div class="pr-lclip" style="position:absolute;top:0;height:${boxH}px;overflow:hidden">${WD}</div>${RL('right')}</div>`,
      render(t, root) {
        if (!el) {
          el = root.firstChild; clip = el.querySelector('.pr-lclip'); wl = [...el.querySelectorAll('.pr-lw')]; rl = [...el.querySelectorAll('.pr-lr')];
          // kelime genişliği (son harfin harf aralığı düşülür -> optik merkez)
          ww = Math.max(...wl.map(d => { const sp = [...d.children]; return sp.reduce((s, c) => s + c.offsetWidth, 0) - spacing * size; }));
          const cw = Math.ceil(ww + size * .6), gap = rules ? rules.gap ?? 30 : 0, rw = rules ? rules.w ?? 80 : 0;
          css(el, { width: (cw + 2 * (gap + rw)) + 'px', left: (x - cw / 2 - gap - rw) + 'px' });
          css(clip, { left: (gap + rw) + 'px', width: cw + 'px' });
          wl.forEach(d => { d.style.paddingLeft = (spacing * size) + 'px'; });
        }
        const vo = fadeOut(t, out, outDur), t0 = words.length ? words[0].t : 0;
        css(el, { opacity: vo.toFixed(4), display: vo > .001 && t >= t0 ? '' : 'none' });
        wl.forEach((d, i) => {
          const a = words[i].t + (i ? lag : 0), b = i + 1 < words.length ? words[i + 1].t : Infinity;
          const on = t >= a && t < b + dur + stagger * d.children.length;
          d.style.display = on ? '' : 'none'; if (!on) return;
          [...d.children].forEach((c, j) => {
            const ui = E.outCubic(prog(t, a + j * stagger, a + j * stagger + dur));
            const uo = isFinite(b) ? E.inCubic(prog(t, b + j * stagger * .5, b + j * stagger * .5 + dur * .55)) : 0;
            css(c, { opacity: (ui * (1 - uo)).toFixed(4), transform: `translateY(${(((1 - ui) - uo) * rise * size).toFixed(2)}px)` });
          });
        });
        if (rules) { const u = E.inOutCubic(prog(t, t0, t0 + (rules.dur ?? .6))); rl.forEach(r => { r.style.transform = `scaleX(${u.toFixed(4)})`; }); }
      },
    };
  };

  // ===== görsel (logo): merkezde, yerinde belirir (opaklık + kısa yükseliş) =====
  const image = ({ src, x, y, w, h, t = 0, dur = .55, dy = 14, out = Infinity, outDur = .35, opacity = 1, filter } = {}) => {
    let el;
    return {
      html: `<img class="pr-img" src="${asset(src)}" style="position:absolute;left:${x - w / 2}px;top:${h ? y - h / 2 : y}px;width:${w}px;${h ? `height:${h}px;` : 'height:auto;'}opacity:0;${filter ? `filter:${qa(filter)};` : ''}">`,
      render(tt, root) {
        if (!el) { el = root.firstChild; if (!h) el.style.top = (y - el.offsetHeight / 2) + 'px'; }
        const u = E.outCubic(prog(tt, t, t + dur)), vo = fadeOut(tt, out, outDur);
        css(el, { opacity: (u * vo * opacity).toFixed(4), transform: `translateY(${((1 - u) * dy).toFixed(2)}px)` });
      },
    };
  };

  // ===== altın daire içinde aşağı ok (IG düğmesine): küçük vurgu -> yayla belirir; bounce anlarında ok nazikçe iki kez iner =====
  const arrowDisc = ({ x, y, size = 110, color, ink = '#FFFFFF', t = 0, bounce = [], amp = .13, out = Infinity, outDur = .3 } = {}) => {
    const bgc = color || 'radial-gradient(120% 120% at 30% 25%, #E6CB94 0%, #C9A46A 45%, #A47E45 100%)';
    const s = size, aw = s * .44;
    let el, ar;
    return {
      html: `<div class="pr-arrow" style="position:absolute;left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;border-radius:50%;background:${qa(bgc)};` +
        `box-shadow:0 16px 36px -10px rgba(90,60,24,.55), inset 0 0 0 1.5px rgba(255,244,220,.55);opacity:0">` +
        `<svg width="${aw}" height="${aw}" viewBox="0 0 48 48" style="position:absolute;left:${(s - aw) / 2}px;top:${(s - aw) / 2}px;overflow:visible">` +
        `<path d="M24 7v32M11 26l13 13 13-13" stroke="${ink}" stroke-width="4.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`,
      render(tt, root) {
        if (!el) { el = root.firstChild; ar = el.firstChild; }
        const k = clamp(spring(tt - t, .62, 2.6), 0, 1.15), vo = fadeOut(tt, out, outDur);
        css(el, { opacity: (clamp((tt - t) / .18) * vo).toFixed(4), transform: `scale(${lerp(.7, 1, k).toFixed(4)})` });
        let dy = 0;
        for (const b of bounce) { const u = tt - b; if (u > 0 && u < .9) dy += Math.abs(Math.sin(u * Math.PI / .45)) * Math.exp(-u * 2.2) * amp * s; }
        ar.style.transform = `translateY(${dy.toFixed(2)}px)`;
      },
    };
  };

  // ===== iletişim ikonları (kodla çizilmiş SVG, anında tanınır): Instagram uygulama ikonu (degrade kare + kamera çizgisi), WhatsApp (yeşil daire + balon + ahize) =====
  const ICON = {
    instagram: (s = 64) => `<svg class="pr-ico" width="${s}" height="${s}" viewBox="0 0 64 64" style="display:block;flex:none">` +
      `<defs><radialGradient id="prIg" cx="28%" cy="104%" r="135%"><stop offset="0" stop-color="#FFDD55"/><stop offset=".12" stop-color="#FFDD55"/>` +
      `<stop offset=".45" stop-color="#FF543E"/><stop offset=".7" stop-color="#C837AB"/><stop offset="1" stop-color="#3D5AFE"/></radialGradient></defs>` +
      `<rect width="64" height="64" rx="15" fill="url(#prIg)"/><rect x="13" y="13" width="38" height="38" rx="11.5" fill="none" stroke="#fff" stroke-width="4.6"/>` +
      `<circle cx="32" cy="32" r="9.2" fill="none" stroke="#fff" stroke-width="4.6"/><circle cx="43.6" cy="20.4" r="3" fill="#fff"/></svg>`,
    whatsapp: (s = 64) => `<svg class="pr-ico" width="${s}" height="${s}" viewBox="0 0 64 64" style="display:block;flex:none"><circle cx="32" cy="32" r="32" fill="#25D366"/>` +
      `<path d="M32 12.5c-10.8 0-19.5 8.6-19.5 19.3 0 3.6 1 7 2.8 9.9L12.6 51.5l10.1-2.6c2.8 1.5 6 2.4 9.3 2.4 10.8 0 19.5-8.6 19.5-19.3S42.8 12.5 32 12.5z" fill="none" stroke="#fff" stroke-width="3.6" stroke-linejoin="round"/>` +
      `<path d="M25.3 22.6c-.6-.1-1.3.1-1.9.7-1.1 1.1-2 2.6-1.6 4.6.8 3.5 3.1 6.9 6.2 9.6 3.1 2.7 6.4 4.2 9.6 4.5 2 .2 3.4-.8 4.4-2 .5-.6.6-1.3.4-1.9l-.5-1c-.2-.4-.6-.6-1-.8l-3.6-1.7c-.5-.2-1.1-.1-1.4.3l-1.6 2c-.3.4-.9.5-1.4.3-1.6-.7-3.1-1.7-4.3-2.9-1.2-1.2-2.2-2.6-2.9-4.2-.2-.5-.1-1 .3-1.4l1.8-1.7c.4-.4.5-.9.3-1.4l-1.6-3.6c-.2-.5-.6-.8-1.2-.9z" fill="#fff"/></svg>`,
  };

  // ===== cesur sosyal öğeler ("pat"): kalın sıkışık yazı (kontur + sert gölge), eğik renkli kutu, çerçeveli hap, görsel (logo) ya da ikon + yazı satırı =====
  // Her öğe merkezinden (x, y) yerleşir; t'de büyükten yayla çarpar (pat), isteğe bağlı eğimden düzelir. Okunurken kıpırdamaz.
  // items: [{ x (vars. W/2), y (merkez), text ('\n' satır kırar) | img: {src, w, h, filter} | icon: 'instagram' | 'whatsapp' (+ text),
  //   size, font (vars. Avenir Next Condensed), weight (900), italic, color, spacing (em), lh, stroke ('3px #000'), shadow (CSS text-shadow), upper,
  //   html (hazır gövde; ör. satır içi altın kutu + yazı), ax (yatay çapa: 0 sol kenar x'te, .5 merkez, 1 sağ kenar),
  //   box: {bg, border, radius, pad: [dikey, yatay], w, h (sabit kutu, içerik ortalanır: kare rozet), shadow}, rot (derece), opacity, iconSize, gap, maxW (sığmazsa punto küçülür),
  //   t (giriş; <= 0 -> ilk karede görünür, pat yine t=0'dan oynar), pop: {from (ölçek), rot (ek başlangıç eğimi), zeta, f, fade},
  //   out: {t, dur, s, dy} (ease-in sönüş), hide: [{a, b, dur}] (a'da söner, b'de yaysız geri gelir),
  //   kick: [{t, amt, dur}] (yerinde kısa ölçek nabzı, ör. müzikte drop; okunurken yer değiştirmez) }]
  const punch = ({ items = [] } = {}) => {
    const COND = "'Avenir Next Condensed', 'Avenir Next', 'Bahnschrift SemiBold Condensed', 'Arial Narrow', sans-serif";
    const body = it => {
      if (it.html != null) return it.html;                                          // hazır HTML (ör. satır içi kutu + yazı); stil çift tırnaksız yazılmalı
      if (it.img) return `<img class="pr-img" src="${asset(it.img.src)}" style="display:block;width:${it.img.w}px;${it.img.h ? `height:${it.img.h}px;object-fit:contain;` : 'height:auto;'}` +
        `${it.img.filter ? `filter:${qa(it.img.filter)};` : ''}">`;
      const fs = `font:${fontCss({ size: it.size ?? 80, weight: it.weight ?? 900, font: it.font || COND, italic: it.italic })};line-height:${it.lh ?? 1};` +
        `letter-spacing:${it.spacing ?? 0}em;color:${it.color || '#fff'};` + (it.stroke ? `-webkit-text-stroke:${qa(it.stroke)};` : '') + (it.shadow ? `text-shadow:${qa(it.shadow)};` : '');
      const txt = esc(it.upper ? up(it.text) : it.text).split('\n').join('<br>');
      const span = `<span class="pr-pt" style="display:inline-block;white-space:nowrap;${fs}">${txt}</span>`;
      if (!it.icon) return span;
      return `<span style="display:inline-flex;align-items:center;gap:${it.gap ?? 18}px">${ICON[it.icon](it.iconSize ?? Math.round((it.size ?? 60) * 1.15))}${span}</span>`;
    };
    const wrap = it => { const b = it.box; if (!b) return body(it);
      const pad = b.pad || [6, 36];
      const fix = b.w || b.h ? `display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;${b.w ? `width:${b.w}px;` : ''}${b.h ? `height:${b.h}px;` : ''}padding:0;`
                             : `display:inline-block;padding:${pad[0]}px ${pad[1]}px;`;
      return `<span class="pr-pbox" style="${fix}${b.bg ? `background:${qa(b.bg)};` : ''}${b.border ? `border:${qa(b.border)};` : ''}` +
        `border-radius:${b.radius ?? 0}px;${b.shadow ? `box-shadow:${qa(b.shadow)};` : ''}">${body(it)}</span>`; };
    let els;
    return {
      html: items.map(it => `<div class="pr-pi" style="position:absolute;left:${it.x ?? W / 2}px;top:${it.y}px;text-align:center;white-space:nowrap;` +
        `transform-origin:${(it.ax ?? .5) * 100}% 50%;transform:translate(${-(it.ax ?? .5) * 100}%,-50%);opacity:0">${wrap(it)}</div>`).join(''),
      render(t, root) {
        if (!els) { els = [...root.children];
          items.forEach((it, i) => { if (!it.maxW || it.img) return; const sp = els[i].querySelector('.pr-pt'); let s = it.size ?? 80;
            while (els[i].offsetWidth > it.maxW && s > 12) { s -= 1; sp.style.fontSize = s + 'px'; } }); }
        items.forEach((it, i) => {
          const el = els[i], P = Object.assign({ from: 1.15, rot: 0, zeta: .55, f: 3, fade: .06 }, it.pop || {}), t0 = it.t ?? 0;
          let o = t0 <= 0 ? 1 : (t < t0 ? 0 : clamp((t - t0) / P.fade));
          const k = t0 <= 0 && t <= 0 ? 0 : spring(t - Math.max(0, t0), P.zeta, P.f);
          let s = lerp(P.from, 1, k), r = (it.rot ?? 0) + (P.rot ?? 0) * (1 - clamp(k, 0, 1.2)), dy = 0;
          const O = it.out;
          if (O && isFinite(O.t)) { const u = E.inCubic(prog(t, O.t, O.t + (O.dur ?? .25))); o *= 1 - u; s *= lerp(1, O.s ?? .9, u); dy -= (O.dy ?? 0) * u; }
          for (const hd of it.hide || []) { const d = hd.dur ?? .2; o *= 1 - (E.inOutCubic(prog(t, hd.a, hd.a + d)) - E.inOutCubic(prog(t, hd.b - d, hd.b))); }
          for (const kk of it.kick || []) { const u = (t - kk.t) / (kk.dur ?? .2); if (u > 0 && u < 1) s *= 1 + (kk.amt ?? .06) * 1.8 * Math.sin(Math.PI * u) * (1 - u); }
          o *= it.opacity ?? 1;
          if (o < .001) { el.style.display = 'none'; return; }
          css(el, { display: '', opacity: o.toFixed(4), transform: `translate(${-(it.ax ?? .5) * 100}%,-50%) translateY(${dy.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${s.toFixed(4)})` });
        });
      },
    };
  };

  // ===== görsel ızgarası: donmuş kareler (ör. tasarım seçkisi) kırpılmış karolarda, köşede numara rozeti; vuruşla sırayla 'pat' =====
  // x, y (sol-üst), cols, rows, w, h (karo), gap, r (köşe), border (CSS), shadow · aspect: kaynak h/w (vars. TIMELINE.src)
  // items: [{src, fx, fy (kaynakta odak 0..1, karo merkezine gelir; kenar boş kalmaz), zoom (1 = karoyu kaplar), label (rozet yazısı), t}]
  // badge: {size, bg, color, font, inset (karo köşesinden taşma px), rot} · pop: {from, rot (± sırayla), zeta, f, fade} · out: {t, dur, s}
  const tiles = ({ x = 0, y = 0, cols = 4, rows = 2, w = 200, h = 266, gap = 16, r = 14, border = '3px solid #FFFFFF', shadow = '0 12px 28px rgba(0,0,0,.5)',
                   aspect, items = [], badge = {}, pop = {}, out } = {}) => {
    const AS = aspect ?? ((TL.src && TL.src.w) ? TL.src.h / TL.src.w : 16 / 9);
    const BD = Object.assign({ size: 56, bg: '#E9C46A', color: '#111111', font: "'Avenir Next Condensed', 'Bahnschrift SemiBold Condensed', 'Arial Narrow', sans-serif", inset: 8, rot: -3 }, badge);
    const PP = Object.assign({ from: 1.25, rot: 5, zeta: .55, f: 3, fade: .05 }, pop);
    const geo = it => { const z = it.zoom ?? 1, sc = Math.max(w, h / AS) * z, IW = sc, IH = sc * AS;
      return { IW, IH, L: clamp(w / 2 - (it.fx ?? .5) * IW, w - IW, 0), T: clamp(h / 2 - (it.fy ?? .5) * IH, h - IH, 0) }; };
    let els;
    return {
      html: items.map((it, i) => { const c = i % cols, rr = Math.floor(i / cols), g = geo(it);
        const lx = x + c * (w + gap), ly = y + rr * (h + gap);
        return `<div class="pr-tile" style="position:absolute;left:${lx}px;top:${ly}px;width:${w}px;height:${h}px;opacity:0;transform-origin:50% 50%">` +
          `<div style="position:absolute;inset:0;border-radius:${r}px;overflow:hidden;border:${qa(border)};box-shadow:${qa(shadow)};background:#111">` +
          `<img class="pr-img" src="${asset(it.src)}" style="position:absolute;left:${g.L.toFixed(1)}px;top:${g.T.toFixed(1)}px;width:${g.IW.toFixed(1)}px;height:${g.IH.toFixed(1)}px;max-width:none"></div>` +
          (it.label != null ? `<div class="pr-tbadge" style="position:absolute;left:${-BD.inset}px;top:${-BD.inset}px;width:${BD.size}px;height:${BD.size}px;display:flex;align-items:center;justify-content:center;` +
            `background:${BD.bg};color:${BD.color};font:900 ${Math.round(BD.size * .78)}px ${qa(BD.font)};line-height:1;transform:rotate(${BD.rot}deg);box-shadow:0 6px 14px rgba(0,0,0,.45)">${esc(it.label)}</div>` : '') +
          `</div>`; }).join(''),
      render(t, root) {
        els = els || [...root.children];
        items.forEach((it, i) => {
          const el = els[i], t0 = it.t ?? 0;
          let o = t < t0 ? 0 : clamp((t - t0) / PP.fade);
          const k = spring(t - t0, PP.zeta, PP.f), sg = i % 2 ? 1 : -1;
          let s = lerp(PP.from, 1, k), rot = sg * (PP.rot * (1 - clamp(k, 0, 1.2)) + 1.2);
          if (out && isFinite(out.t)) { const u = E.inCubic(prog(t, out.t, out.t + (out.dur ?? .2))); o *= 1 - u; s *= lerp(1, out.s ?? .85, u); }
          if (o < .001) { el.style.display = 'none'; return; }
          css(el, { display: '', opacity: o.toFixed(4), transform: `rotate(${rot.toFixed(3)}deg) scale(${s.toFixed(4)})` });
        });
      },
    };
  };

  // ===== perde: tam ekran CSS katmanı (data-safe=ignore); opaklık anahtarları [{t, to, dur, ease}] (ör. çağrıda karartma, altta koyu geçiş) =====
  const veil = ({ bg = '#000', o = 1, keys = [] } = {}) => {
    let el;
    return {
      html: `<div data-safe="ignore" style="position:absolute;left:0;top:0;width:${W}px;height:${H}px;background:${qa(bg)};opacity:${o}"></div>`,
      render(t, root) { el = el || root.firstChild; let v = o;
        for (const k of keys) v = lerp(v, k.to, EZ(k.ease || 'inOutCubic')(prog(t, k.t, k.t + (k.dur ?? .35))));
        el.style.opacity = v.toFixed(4); },
    };
  };

  // ===== altyazı stili (motorun #cap'i): serinin kalın kontur yazısı; hl kelime altın kutu, brand altın yazı, konuşulan kelime açık altın =====
  // Motor altyazıyı çizer (cümle düzeni, yerleşim, pop); bu yalnız görünümü değiştirir (CSS + kare sonrası renk). font/size motorun ölçümünden önce yüklü olmalı (V.fonts).
  const capStyle = ({ font = "'Avenir Next Condensed', 'Bahnschrift SemiBold Condensed', 'Arial Narrow', sans-serif", weight = 900, stroke = '2.5px #000', shadow = '0 5px 0 #000', color = '#FFFFFF',
                      active = '#FFE08A', brand = '#E9C46A', hlBg = '#E9C46A', hlInk = '#111111', redBg = '#E5383B', redInk = '#FFFFFF', drop = [] } = {}) => {
    const st = document.createElement('style');
    st.textContent = `body.prcap #cap.s2{font-family:${font};font-weight:${weight};letter-spacing:.01em}
body.prcap #cap.s2 .bgl{background:none;padding:0;box-shadow:none}
body.prcap #cap.s2 .cw{-webkit-text-stroke:${stroke};text-shadow:${shadow};padding:0 .04em;border-radius:.12em}
body.prcap #cap.s2 .cw.prhl{-webkit-text-stroke:0;text-shadow:none}`;
    document.head.appendChild(st); document.body.classList.add('prcap');
    POST.push(t => {
      const cap = document.getElementById('cap'); if (!cap || cap.classList.contains('hide')) return;
      const CH = TL.chunks; let i = -1; for (let k = 0; k < CH.length; k++) if (t >= CH[k].s - .02 && t < CH[k].e) i = k; if (i < 0) return;
      const ws = CH[i].w, sps = cap.querySelectorAll('.cw');
      sps.forEach((sp, n) => { const w = ws[n]; if (!w) return;
        const nxt = ws[n + 1], on = t >= w.s - .03 && (!nxt || t < nxt.s - .03);
        sp.classList.toggle('prhl', w.st === 'hl' || w.st === 'red');
        if (drop.includes(w.i)) { sp.style.display = 'none'; return; }       // drop: bu kelimeleri büyük bir grafik gösteriyor (aynı kelime iki kez görünmez)
        // altın kutu yerleşimi değiştirmez (motor satırı ölçtükten sonra uygulanır): dolgu yerine kutu gölgesi yayılması
        if (w.st === 'hl' || w.st === 'red') { const bg = w.st === 'red' ? redBg : hlBg; sp.style.background = bg; sp.style.color = w.st === 'red' ? redInk : hlInk; sp.style.boxShadow = `0 0 0 .09em ${bg}, 0 6px 16px rgba(0,0,0,.35)`; }
        else { sp.style.background = 'transparent'; sp.style.boxShadow = 'none'; sp.style.color = w.st === 'brand' ? brand : on ? active : color; } });
    });
    return true;
  };

  // ===== ilerleme çizgisi: ince altın çizgi a..b boyunca soldan sağa dolar (zemin: soluk iz); t'de belirir, out'ta söner =====
  const progress = ({ x, y, w, h = 5, a = 0, b, color = '#E9C46A', track = 'rgba(255,255,255,.22)', t = 0, dur = .3, out = Infinity, outDur = .3, r } = {}) => {
    let el, fill;
    return {
      html: `<div class="pr-prog" style="position:absolute;left:${x}px;top:${y - h / 2}px;width:${w}px;height:${h}px;border-radius:${r ?? h / 2}px;background:${track};overflow:hidden;opacity:0">` +
        `<div style="position:absolute;left:0;top:0;width:${w}px;height:${h}px;background:${color};transform-origin:0 50%;transform:scaleX(0)"></div></div>`,
      render(tt, root) {
        if (!el) { el = root.firstChild; fill = el.firstChild; }
        const o = clamp((tt - t) / dur) * fadeOut(tt, out, outDur);
        el.style.opacity = o.toFixed(4); fill.style.transform = `scaleX(${clamp(prog(tt, a, b)).toFixed(5)})`;
      },
    };
  };

  // ===== opak kart / panel (dikdörtgen; ör. gömülü eski bandı örten kanca ya da çağrı kartı, ekran kenarından kenarına taşabilir) =====
  // Panelin kendisi data-safe=ignore (zemin gibi); üstündeki yazılar ayrı öğe olarak denetime girer. t <= 0 -> ilk karede tam opak.
  // x, y, w, h · bg (CSS) · radius · line: {color, w} üst ve alt kenarda ince çizgi · shadow · t, dur (belirme) · out, outDur
  const panel = ({ x = 0, y, w = W, h, bg = '#FFFFFF', radius = 0, line, shadow = '0 14px 36px rgba(0,0,0,.28)', t = 0, dur = .02, out = Infinity, outDur = .25 } = {}) => {
    let el;
    const ln = line ? `border-top:${line.w ?? 3}px solid ${line.color};border-bottom:${line.w ?? 3}px solid ${line.color};` : '';
    return {
      html: `<div class="pr-panel" data-safe="ignore" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;box-sizing:border-box;` +
        `background:${qa(bg)};border-radius:${radius}px;${ln}box-shadow:${qa(shadow)};opacity:0"></div>`,
      render(tt, root) { el = el || root.firstChild;
        const o = (t <= 0 ? 1 : clamp((tt - t) / dur)) * fadeOut(tt, out, outDur);
        el.style.opacity = o.toFixed(4); el.style.display = o > .001 ? '' : 'none'; },
    };
  };

  // ================= v16: emojili + 3D reklam (konuşan yüz, tam ekran; ornekler/emojili-3d) =================
  const EMOJI = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
  const CONDF = "'Avenir Next Condensed', 'Avenir Next', 'Bahnschrift SemiBold Condensed', 'Arial Narrow', sans-serif";
  const GOLD3 = { face: 'linear-gradient(155deg,#FFF3C9 0%,#F4D27E 28%,#E9C46A 55%,#C9973E 100%)', side: '#9A6B25', sideDark: '#6F4A14', ink: '#111111' };

  // ===== kadraj: konuşan yüzü tam ekranda yerleştirir (PR.frameCard anchor'ı) =====
  // Saç üstü (FACE_TRACK.top + pad) ekranda ht'de, yüz yatayda x'te; görüntü her zaman kenardan kenara dolu (siyah yok: konum sınırlanır).
  // cuts: yeni çekimin başladığı kareler (0 tabanlı) -> her çekim kendi sabit kadrajını alır (mode 'fixed': çekim içi medyan; 'follow': ±k kare yumuşatma)
  // s: ölçek, x: yüzün yatay yeri (sayı ya da çekim başına dizi; büyük öğeye yer açmak için yüz yana alınabilir) · zoom: t -> çarpan (vuruş yakınlaşması; saç üstünden büyür)
  // plain: [[f0, f1, {s, fx, fy}]] ara görüntü kareleri (yüz yok): sabit kadraj, (fx, fy) kaynakta odak (0..1) ekran merkezine
  // Dönen fonksiyon: t -> anchor; .at(n, t): n. kare (0 tabanlı) için (donmuş son kare)
  const headAnchor = ({ track = window.FACE_TRACK, frame = fileAt, cuts = [], ht, x = W / 2, s = 1, mode = 'fixed', k = 10, zoom, plain = [], pad = .035 } = {}) => {
    const AR = (TL.src && TL.src.w) ? TL.src.h / TL.src.w : 16 / 9, N = track.top.length;
    const B = [0, ...cuts, N], segOf = n => { let i = 0; while (i < B.length - 2 && n >= B[i + 1]) i++; return i; };
    const med = a => { const b = [...a].sort((p, q) => p - q); return b[Math.floor(b.length / 2)]; };
    const FIX = B.slice(0, -1).map((a, i) => { const b = B[i + 1], m = Math.min(6, Math.floor((b - a) / 4));
      return { top: med(track.top.slice(a + m, b - m)) + pad, cx: med(track.cx.slice(a + m, b - m)) }; });   // pad: takibin 'top'u gerçek saç üstünün ~%3.5 üstünde
    const smv = (arr, n, i) => { let q = 0, c = 0; for (let j = Math.max(B[i], n - k); j <= Math.min(B[i + 1] - 1, n + k); j++) { q += arr[j]; c++; } return q / c; };
    const at = (n, t) => {
      n = clamp(n, 0, N - 1);
      const pl = plain.find(p => n >= p[0] && n < p[1]);
      if (pl) { const o = pl[2] || {}, sc = (o.s ?? 1) * (zoom ? zoom(t) : 1), dh = W * sc * AR;
        return { s: sc, ax: o.fx ?? .5, ay: 0, sx: W / 2, sy: clamp(H / 2 - (o.fy ?? .5) * dh, H - dh, 0) }; }
      const i = segOf(n), sc = (Array.isArray(s) ? s[i] : s) * (zoom ? zoom(t) : 1), dh = W * sc * AR;
      const top = mode === 'follow' ? smv(track.top, n, i) + pad : FIX[i].top, cx = mode === 'follow' ? smv(track.cx, n, i) : FIX[i].cx;
      return { s: sc, ax: cx, ay: 0, sx: Array.isArray(x) ? x[i] : x, sy: clamp(ht - top * dh, H - dh, 0) };
    };
    const fnA = t => at(frame(t) - 1, t); fnA.at = at; return fnA;
  };

  // ===== kalıcı kanca başlığı (üst başlık): satırlar alt alta ortalı; ilk karede okunur, 'pat' ile oturur, out'a kadar sabit =====
  // x (merkez), y (üst kenar), gap · lines: [{text, emoji, size, kind: 'plain' (beyaz, siyah kontur) | 'gold' (altın kutu) | 'white' (beyaz kutu) | 'pill' (koyu hap, küçük alt satır), rot, spacing}]
  // maxW: satır sığmazsa punto küçülür · t (<= 0: ilk karede görünür) · out, outDur
  const hookTitle = ({ x = W / 2, y, gap = 6, lines = [], maxW = 900, t = 0, stagger = .05, out = Infinity, outDur = .25 } = {}) => {
    const em = e => e ? `<span class="pr-em" style="font-family:${EMOJI};font-weight:400;-webkit-text-stroke:0;text-shadow:none;margin-left:.16em;font-size:.92em;display:inline-block;transform:translateY(.02em)">${e}</span>` : '';
    const one = l => {
      const sz = l.size ?? 70, kind = l.kind || 'plain', sp = l.spacing ?? 0;
      const base = `display:inline-block;white-space:nowrap;font:900 ${sz}px ${CONDF};line-height:1.06;letter-spacing:${sp}em;`;
      if (kind === 'gold' || kind === 'white') return `<span class="pr-htb" style="${base}color:#111;background:${kind === 'gold' ? '#E9C46A' : '#FFFFFF'};padding:${Math.round(sz * .05)}px ${Math.round(sz * .34)}px;` +
        `border-radius:${kind === 'white' ? 14 : 4}px;box-shadow:0 12px 30px rgba(0,0,0,.42);transform:rotate(${l.rot ?? (kind === 'gold' ? -2 : 0)}deg)">${esc(l.text)}${em(l.emoji)}</span>`;
      if (kind === 'pill') return `<span class="pr-htb" style="${base}font-weight:800;color:#FFFFFF;background:rgba(14,11,9,.62);border:1.5px solid rgba(233,196,106,.6);` +
        `padding:${Math.round(sz * .2)}px ${Math.round(sz * .7)}px;border-radius:999px;box-shadow:0 8px 20px rgba(0,0,0,.3)">${esc(l.text)}${em(l.emoji)}</span>`;
      return `<span class="pr-htb" style="${base}line-height:1;color:#FFFFFF;-webkit-text-stroke:3px #000;text-shadow:0 7px 0 #000">${esc(l.text)}${em(l.emoji)}</span>`;
    };
    let el, rows;
    return {
      html: `<div class="pr-hook" style="position:absolute;left:${x - maxW / 2}px;top:${y}px;width:${maxW}px;display:flex;flex-direction:column;align-items:center;gap:${gap}px">` +
        lines.map(l => `<div class="pr-htl" style="transform-origin:50% 50%">${one(l)}</div>`).join('') + '</div>',
      render(tt, root) {
        if (!el) { el = root.firstChild; rows = [...el.children];
          rows.forEach((r, i) => { const sp = r.firstChild; let sz = lines[i].size ?? 70; while (sp.offsetWidth > maxW && sz > 14) { sz -= 1; sp.style.fontSize = sz + 'px'; } }); }
        const vo = fadeOut(tt, out, outDur);
        el.style.display = vo > .001 ? 'flex' : 'none'; if (vo <= .001) return; el.style.opacity = vo.toFixed(4);
        rows.forEach((r, i) => { const t0 = Math.max(0, t) + i * stagger, k = tt <= 0 && t <= 0 ? 0 : spring(tt - t0, .55, 3);
          const vis = t <= 0 || tt >= t0 - 1e-6;
          css(r, { opacity: vis ? 1 : 0, transform: `scale(${(lerp(1.12, 1, k) * lerp(1, .92, 1 - vo)).toFixed(4)})` }); });
      },
    };
  };

  // ===== 3D emoji: büyük emoji katmanlı kalınlıkla (koyu arka katmanlar), eğik durur; t'de dönerek 'pat', hafif salınır, out'ta söner =====
  // items: [{ch, x, y (merkez), size, t, out, tilt: {x, y, z} (derece), depth (katman), sway (derece)}]
  const emoji3d = ({ items = [] } = {}) => {
    const one = it => { const sz = it.size ?? 170, n = it.depth ?? 6, f = Math.round(sz * .86);
      const lay = (k, dark) => `<span style="position:absolute;left:0;top:0;width:${sz}px;height:${sz}px;font:${f}px ${EMOJI};line-height:${sz}px;text-align:center;` +
        `transform:translateZ(${-k * Math.max(2, sz * .018)}px);${dark ? 'filter:brightness(.32) saturate(.7)' : 'filter:drop-shadow(0 14px 18px rgba(0,0,0,.4))'}">${it.ch}</span>`;
      return `<div class="pr-e3" style="position:absolute;left:${it.x}px;top:${it.y}px;width:0;height:0;perspective:900px;opacity:0">` +
        `<div style="position:absolute;left:${-sz / 2}px;top:${-sz / 2}px;width:${sz}px;height:${sz}px;transform-style:preserve-3d">` +
        [...Array(n)].map((_, k) => lay(n - k, true)).join('') + lay(0, false) + '</div></div>'; };
    let els;
    return {
      html: items.map(one).join(''),
      render(t, root) {
        els = els || [...root.children];
        items.forEach((it, i) => {
          const el = els[i], t0 = it.t ?? 0, T = Object.assign({ x: 12, y: -24, z: -6 }, it.tilt || {});
          const o = (t < t0 ? 0 : clamp((t - t0) / .05)) * fadeOut(t, it.out ?? Infinity, .18);
          if (o < .001) { el.style.display = 'none'; return; }
          const k = spring(t - t0, .5, 2.6), kc = clamp(k, 0, 1.3), sw = (it.sway ?? 7) * Math.sin(2 * Math.PI * (t - t0) / 2.4);
          const uo = isFinite(it.out ?? Infinity) ? E.inCubic(prog(t, it.out, it.out + .18)) : 0;
          css(el, { display: '', opacity: o.toFixed(4) });
          el.firstChild.style.transform = `scale(${(lerp(.25, 1, k) * (1 - .3 * uo)).toFixed(4)}) rotateX(${T.x}deg) rotateY(${(T.y + sw - 80 * (1 - kc)).toFixed(2)}deg) rotateZ(${(T.z + 14 * (1 - kc)).toFixed(2)}deg)`;
        });
      },
    };
  };

  // ===== 3D rozet / askılı etiket: altın, katmanlı kalınlık (extrude), CSS 3D; t'de dönerek 'pat' gelir, hafif salınır =====
  // kind: 'seal' (tırtıllı yuvarlak rozet, ör. '%95') | 'tag' (askılı fiyat etiketi: delik + ip, sarkaç gibi sallanır)
  // x, y (gövde merkezi), size (genişlik px) · text (büyük), unit (yanında küçük: 'TL'), label (altında düz beyaz kutu: 'DÖKÜLME GARANTİSİ')
  // t, out · depth (px kalınlık) · tilt: {x, y} · spin (girişte tur) · sway: {y, x, period} · labelSize · string (etiket ipinin boyu / gövde yüksekliği, vars. .62)
  const badge3d = ({ kind = 'seal', x, y, size = 250, text = '', unit, label, labelSize, t = 0, out = Infinity, depth = 34, tilt = {}, spin = 1, sway = {}, colors = {}, string = .62 } = {}) => {
    const C = Object.assign({}, GOLD3, colors), TI = Object.assign({ x: 10, y: -30 }, tilt), SW = Object.assign({ y: 8, x: 2.5, period: 2.6 }, sway);
    const w = size, h = kind === 'tag' ? Math.round(size * .78) : size, nL = Math.max(4, Math.round(depth / 2.5));
    let poly, face;
    if (kind === 'tag') {
      const c = Math.round(w * .2), b = 10;
      poly = `polygon(${c}px 0, ${w - c}px 0, ${w}px ${c}px, ${w}px ${h - b}px, ${w - b}px ${h}px, ${b}px ${h}px, 0 ${h - b}px, 0 ${c}px)`;
      const fs = Math.round(w * .31), us = Math.round(fs * .5), hole = Math.round(w * .045);
      face = `<div style="position:absolute;left:50%;top:${Math.round(c * .5)}px;width:${hole * 2}px;height:${hole * 2}px;margin-left:${-hole}px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#3a2a12,#120c04);box-shadow:0 0 0 ${Math.max(3, hole * .35)}px rgba(255,246,214,.75), inset 0 2px 3px rgba(0,0,0,.6)"></div>` +
        `<div style="position:absolute;left:12px;right:12px;top:${c + 2}px;bottom:12px;border:2.5px dashed rgba(17,17,17,.32);border-radius:8px"></div>` +
        `<div class="pr-b3t" style="position:absolute;left:0;right:0;top:${Math.round(c * .95)}px;bottom:0;display:flex;align-items:center;justify-content:center;white-space:nowrap;color:${C.ink};font:900 ${fs}px ${CONDF};line-height:1">` +
        `<span>${esc(text)}</span>${unit ? `<span style="font-size:${us}px;margin-left:.22em;transform:translateY(.16em);display:inline-block">${esc(unit)}</span>` : ''}</div>`;
    } else {
      const n = 22, pts = [];
      for (let i = 0; i < n * 8; i++) { const a = 2 * Math.PI * i / (n * 8), r = .5 - .028 * (1 + Math.cos(n * a)) / 2; pts.push(`${((.5 + r * Math.cos(a)) * 100).toFixed(2)}% ${((.5 + r * Math.sin(a)) * 100).toFixed(2)}%`); }
      poly = `polygon(${pts.join(',')})`;
      const fs = Math.round(w * .4);
      face = `<div style="position:absolute;inset:${Math.round(w * .085)}px;border-radius:50%;border:${Math.max(3, Math.round(w * .014))}px solid rgba(17,17,17,.6);box-shadow:inset 0 0 0 ${Math.round(w * .012)}px rgba(255,246,214,.55)"></div>` +
        `<div class="pr-b3t" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;white-space:nowrap;color:${C.ink};font:900 ${fs}px ${CONDF};line-height:1">${esc(text)}</div>`;
    }
    const layer = k => `<div style="position:absolute;left:0;top:0;width:${w}px;height:${h}px;clip-path:${poly};background:${k > nL * .5 ? C.sideDark : C.side};transform:translateZ(${(-k * depth / nL).toFixed(1)}px)"></div>`;
    const pinY = kind === 'tag' ? -Math.round(h * string) : 0;                          // ipin asıldığı nokta (gövde üst kenarına göre)
    const str = kind === 'tag' ? `<svg class="pr-b3s" width="${w}" height="${-pinY + Math.round(w * .12)}" viewBox="0 ${pinY} ${w} ${-pinY + Math.round(w * .12)}" style="position:absolute;left:0;top:${pinY}px;overflow:visible">` +
      `<path d="M${w / 2 - 3} ${Math.round(w * .2 * .5 + w * .045)} Q ${w / 2 - 26} ${pinY * .45} ${w / 2} ${pinY + 6} Q ${w / 2 + 24} ${pinY * .4} ${w / 2 + 3} ${Math.round(w * .2 * .5 + w * .045)}" fill="none" stroke="#FFF6DC" stroke-width="5" stroke-linecap="round" style="filter:drop-shadow(0 3px 3px rgba(0,0,0,.5))"/>` +
      `<circle cx="${w / 2}" cy="${pinY + 6}" r="9" fill="#FFF6DC" stroke="#9A6B25" stroke-width="3"/></svg>` : '';
    const LB = label ? `<div class="pr-b3l" style="position:absolute;left:${w / 2}px;top:${h + 16}px;transform:translate(-50%,0);opacity:0"><span style="display:inline-block;white-space:nowrap;background:#FFFFFF;color:#111;` +
      `font:900 ${labelSize ?? Math.round(w * .135)}px ${CONDF};line-height:1.1;padding:5px 16px;border-radius:10px;box-shadow:0 10px 24px rgba(0,0,0,.4);text-align:center">${esc(label).split('\n').join('<br>')}</span></div>` : '';
    let root0, swing, body, lab, shine;
    return {
      html: `<div class="pr-b3" style="position:absolute;left:${x - w / 2}px;top:${y - h / 2}px;width:${w}px;height:${h}px;perspective:1100px;opacity:0">` +
        `<div class="pr-b3w" style="position:absolute;inset:0;transform-style:preserve-3d;transform-origin:50% ${pinY}px">${str}` +
        `<div class="pr-b3b" style="position:absolute;inset:0;transform-style:preserve-3d">` + [...Array(nL)].map((_, k) => layer(nL - k)).join('') +
        `<div style="position:absolute;left:0;top:0;width:${w}px;height:${h}px;clip-path:${poly};background:${qa(C.face)};overflow:hidden">${face}` +
        `<div class="pr-b3sh" style="position:absolute;top:-20%;left:0;width:34%;height:140%;background:linear-gradient(100deg,rgba(255,255,255,0),rgba(255,255,255,.75),rgba(255,255,255,0));transform:translateX(-160%) skewX(-18deg)"></div></div>` +
        `</div></div>${LB}</div>`,
      render(tt, root) {
        if (!root0) { root0 = root.firstChild; swing = root0.querySelector('.pr-b3w'); body = root0.querySelector('.pr-b3b'); lab = root0.querySelector('.pr-b3l'); shine = root0.querySelector('.pr-b3sh'); }
        const vo = fadeOut(tt, out, .2), o = (tt < t ? 0 : clamp((tt - t) / .05)) * vo;
        if (o < .001) { root0.style.display = 'none'; return; }
        const tau = tt - t, k = spring(tau, .62, 1.9), kc = clamp(k, 0, 1.25), kS = spring(tau, .5, 2.8);
        const uo = isFinite(out) ? E.inCubic(prog(tt, out, out + .2)) : 0;
        const ry = TI.y - 360 * spin * (1 - kc) + SW.y * Math.sin(2 * Math.PI * tau / SW.period), rx = TI.x + SW.x * Math.sin(2 * Math.PI * tau / (SW.period * 1.37) + 1);
        const pend = kind === 'tag' ? 9 * Math.exp(-tau * 1.6) * Math.cos(tau * 7.5) + 1.6 * Math.sin(2 * Math.PI * tau / 3.1) : 0;
        css(root0, { display: '', opacity: o.toFixed(4) });
        swing.style.transform = `rotateZ(${pend.toFixed(2)}deg) scale(${(lerp(.3, 1, kS) * (1 - .25 * uo)).toFixed(4)})`;
        body.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        shine.style.transform = `translateX(${(-160 + 520 * E.inOutCubic(prog(tau, .35, 1.0))).toFixed(1)}%) skewX(-18deg)`;
        if (lab) { const kl = spring(tau - .14, .58, 3); css(lab, { opacity: (clamp((tau - .14) / .05) * vo).toFixed(4), transform: `translate(-50%,0) rotate(-2deg) scale(${lerp(1.2, 1, kl).toFixed(4)})` }); }
      },
    };
  };

  // ===== serinin çağrı ekranı (kararmış kare üstünde): logo, hap, HEMEN RANDEVUNU + altın OLUŞTUR, Instagram, WhatsApp (BRAND.handle / BRAND.phone) =====
  // t: 'pat' anı (kare) · hap: 'ŞEHİR · ...' · at: {logo:[y,w], hap:[y,size], call:[y,size,lh], make:[y,size], ig:[y,size,icon], wa:[y,size,icon]} · step: öğeler arası (s)
  const adCta = ({ t, hap, at: K, step = 2 / 30, maxW = 900, handle = '@' + (B.handle || ''), phone = B.phone || '' } = {}) => {
    const HV = { weight: 900, color: '#FFFFFF', stroke: '3px #000', shadow: '0 8px 0 #000' }, RW = { font: "'Avenir Next', 'Avenir', 'Segoe UI', sans-serif", weight: 700, color: '#FFFFFF', shadow: '0 3px 0 #000, 0 0 18px rgba(0,0,0,.65)' };
    return punch({ items: [
      { img: { src: 'logo-light.png', w: K.logo[1], filter: 'drop-shadow(0 3px 10px rgba(0,0,0,.55))' }, y: K.logo[0], t: t - .01, pop: { from: 1.08, fade: .01 } },
      { text: hap, size: K.hap[1], weight: 800, spacing: .07, color: '#E9C46A', lh: 1.1, box: { border: '3px solid #E9C46A', radius: 60, pad: [Math.round(K.hap[1] * .2), Math.round(K.hap[1] * .66)] }, maxW,
        y: K.hap[0], t: t - .01, pop: { from: 1.06, fade: .01 } },
      { text: 'HEMEN\nRANDEVUNU', ...HV, size: K.call[1], lh: K.call[2] ?? 1, maxW, y: K.call[0], t: t - .01, pop: { from: 1.08, zeta: .55, f: 3, fade: .01 } },
      { text: 'OLUŞTUR', size: K.make[1], weight: 900, color: '#111111', lh: 1.05, box: { bg: '#E9C46A', pad: [4, 40], shadow: '0 12px 30px rgba(0,0,0,.45)' }, rot: -2, y: K.make[0],
        t: t + step - .01, pop: { from: 1.1, rot: -5, zeta: .5, f: 3, fade: .01 } },
      { icon: 'instagram', text: handle, ...RW, size: K.ig[1], iconSize: K.ig[2], gap: 18, maxW: maxW - 60, y: K.ig[0], t: t + 2 * step - .01, pop: { from: 1.04, fade: .01 } },
      { icon: 'whatsapp', text: phone, ...RW, size: K.wa[1], iconSize: K.wa[2], gap: 20, maxW: maxW - 60, y: K.wa[0], t: t + 3 * step - .01, pop: { from: 1.04, fade: .01 } },
    ] });
  };

  window.PR = { silk, frameCard, headline, swapLabel, image, arrowDisc, punch, veil, panel, tiles, capStyle, progress, headAnchor, hookTitle, emoji3d, badge3d, adCta, ICON, img, need: f => NEEDS.push(f), post: f => POST.push(f), fileAt, inOutSine };
})();
