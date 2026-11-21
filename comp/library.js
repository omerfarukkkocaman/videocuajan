// Bileşen kütüphanesi. Her bileşen zaman parametreleri alır, her kareyi t'den hesaplar.
//   Sahne:  L.scene({id, from, to, under, z, exit, shake, parts:[...]})  -> defineVideo({scenes:[...]})
//   Parça:  {html, render(t, root)}  (root: parçanın sarmalayıcısı; konumlar sahneye göre mutlak)
// Yeni bileşen eklerken: tüm zamanlar parametre olsun, giriş = yay (spring), çıkış = ease-in, sabit sayı yok.
(function () {
  const { clamp, lerp, prog, E, spring, shake, css, vis, T, up } = window.M;
  const B = window.BRAND || {};
  const asset = f => (B.base || '') + f;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // ===== ikonlar (renk parametreli SVG) =====
  const I = {
    lock: (c = '#64748B') => `<svg width="20" height="22" viewBox="0 0 20 22"><rect x="2" y="9" width="16" height="12" rx="3" fill="${c}"/><path d="M5 9V6a5 5 0 0 1 10 0v3" stroke="${c}" stroke-width="3" fill="none"/></svg>`,
    cart: (c = '#0B3568') => `<svg width="52" height="52" viewBox="0 0 52 52"><path d="M6 8h7l6 25h22l5-17H16" stroke="${c}" stroke-width="4.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/><circle cx="22" cy="42" r="4" fill="${c}"/><circle cx="38" cy="42" r="4" fill="${c}"/></svg>`,
    doc: () => `<svg width="34" height="40" viewBox="0 0 34 40"><path d="M3 3h19l9 9v25H3z" fill="#fff"/><path d="M22 3v9h9" fill="#5DB3F0"/><rect x="8" y="18" width="18" height="3" fill="#0B3568"/><rect x="8" y="24" width="18" height="3" fill="#0B3568"/><rect x="8" y="30" width="12" height="3" fill="#0B3568"/></svg>`,
    star: (c = '#0B1F33') => `<svg width="44" height="44" viewBox="0 0 44 44"><path d="M22 4l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="${c}"/></svg>`,
    refresh: (c = '#0B3568') => `<svg width="44" height="44" viewBox="0 0 44 44"><path d="M36 22a14 14 0 1 1-4-9.9" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M34 4v10H24" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    checkCircle: (c = '#1FB766') => `<svg width="46" height="46" viewBox="0 0 46 46"><circle cx="23" cy="23" r="21" fill="#fff"/><path d="M13 24l7 7 13-15" stroke="${c}" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    check: (c = '#fff') => `<svg width="30" height="30" viewBox="0 0 30 30"><path d="M6 16l6 6 12-13" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    clock: (c = '#fff') => `<svg width="70" height="70" viewBox="0 0 70 70"><circle cx="35" cy="38" r="26" fill="none" stroke="${c}" stroke-width="7"/><path d="M35 24v15l10 6" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M14 10l-8 8M56 10l8 8" stroke="${c}" stroke-width="7" stroke-linecap="round"/></svg>`,
    alert: (c = '#fff') => `<svg width="70" height="70" viewBox="0 0 70 70"><path d="M35 8l30 54H5z" fill="none" stroke="${c}" stroke-width="7" stroke-linejoin="round"/><path d="M35 28v16" stroke="${c}" stroke-width="7" stroke-linecap="round"/><circle cx="35" cy="53" r="4.5" fill="${c}"/></svg>`,
    search: (c = '#2F6BFF') => `<svg width="46" height="46" viewBox="0 0 46 46"><circle cx="20" cy="20" r="13" stroke="${c}" stroke-width="5" fill="none"/><path d="M30 30l10 10" stroke="${c}" stroke-width="5" stroke-linecap="round"/></svg>`,
    gavel: (c = '#fff') => `<svg width="56" height="56" viewBox="0 0 56 56"><g transform="rotate(-40 26 24)"><rect x="12" y="6" width="28" height="15" rx="4" fill="${c}"/><rect x="23" y="19" width="6" height="26" rx="3" fill="${c}"/></g><rect x="6" y="46" width="30" height="6" rx="3" fill="${c}"/></svg>`,
    bank: (c = '#0B3568') => `<svg width="64" height="64" viewBox="0 0 64 64"><path d="M32 5L5 19v3h54v-3z" fill="${c}"/><rect x="11" y="26" width="7" height="22" rx="1.5" fill="${c}"/><rect x="23" y="26" width="7" height="22" rx="1.5" fill="${c}"/><rect x="34" y="26" width="7" height="22" rx="1.5" fill="${c}"/><rect x="46" y="26" width="7" height="22" rx="1.5" fill="${c}"/><rect x="6" y="51" width="52" height="7" rx="2" fill="${c}"/></svg>`,
    x: (c = '#fff') => `<svg width="30" height="30" viewBox="0 0 30 30"><path d="M8 8l14 14M22 8L8 22" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`,
    arrowDown: (c = '#0B1F33') => `<svg width="48" height="48" viewBox="0 0 48 48"><path d="M24 6v32M11 25l13 13 13-13" stroke="${c}" stroke-width="6.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    hand: () => `<svg class="hand" viewBox="0 0 150 150"><path d="M58 30c0-8 12-8 12 0v42l6-2c0-7 11-7 11 0v4c0-6 11-6 11 1v4c0-6 11-5 11 2v28c0 16-10 30-28 30H74c-12 0-20-6-26-16L34 98c-4-7 4-13 10-8l14 12z" fill="#fff" stroke="#0B1F33" stroke-width="5" stroke-linejoin="round"/></svg>`,
  };
  const dots = '<i class="dot" style="background:#F87171"></i><i class="dot" style="background:#FBBF24"></i><i class="dot" style="background:#34D399"></i>';
  const L = { I };

  // ===== sahne: parçaları gruplar; ortak çıkış (yukarı kayıp söner) ve sarsıntı =====
  // exit: {a, b, dy}  shake: {t, d, amp, seed}
  // layer (isteğe bağlı, V.matte): 'behind' -> kişinin arkasında (z 4), 'front' -> önünde (z 6); z verilirse o geçerli
  L.scene = ({ id, from = 0, to = Infinity, under = false, z, layer, exit, shake: sh, parts: parts0 = [] }) => { const parts = parts0.flatMap(p => p.flat || [p]); return {
    id, from, to, under, z: z ?? (layer === 'behind' ? 4 : layer === 'front' ? 6 : undefined),
    html: parts.map(p => `<div class="part">${p.html}</div>`).join(''),
    init(s) { s.roots = s.qa(':scope > .part'); },
    render(t, s) {
      const out = exit ? E.inExpo(prog(t, exit.a, exit.b)) : 0;
      const [gx, gy] = sh ? shake(t, sh.t, sh.d, sh.amp, sh.seed ?? 5) : [0, 0];
      css(s.el, { transform: `translate(${gx}px,${gy - (exit?.dy ?? 0) * out}px)`, opacity: 1 - out });
      parts.forEach((p, i) => p.render && p.render(t, s.roots[i]));
    },
  }; };

  // ===== HOOK: üst çip + büyük başlık; vurgu kelimesi kırmızı kutuyla çarpar =====
  // lines: [['ÇOK','ÖNEMLİ'],['GÜNCELLEME']]  emph: {word:'ÖNEMLİ', t}  out: çıkış başlangıcı
  // pre/stagger: kelime kurulumunun öne alınması ve kelimeler arası gecikme (pre büyükse t=0'da başlık okunur)
  // size: başlık punto  deco: {after:'2', html, t} bir kelimenin yanına küçük görsel (ör. 2 belge ikonu) pop'lar
  // shadow: 'strong' -> başlığa daha koyu gölge/kontur (parlak arka planda ve açılış flaşında okunur)
  // box: {x, y, w, titleTop} -> kanca bir bölgeye yerleşir (formatlar: M.R.hook); verilmezse 9x16 eski konum
  // chipAt: {x, y} -> çip başlıktan ayrı durur (sahne koordinatı: x = çip merkezi, y = üst kenar; ör. 16x9'da yüz şeridinin öbür yanı)
  L.hook = ({ chip, lines, emph, out, z = 2, pre = .08, stagger = .07, size, deco, shadow, box, chipSize, chipAt }) => {
    let n = 0;
    const title = lines.map(ws => ws.map(w => `<span class="w" data-n="${n++}">${esc(w)}</span>` +
      (deco && w === deco.after ? `<span class="hDeco">${deco.html}</span>` : '')).join(' ')).join('<br>');
    const chipSt = (chipSize ? `font-size:${chipSize}px;` : '') +
      (chipAt ? `left:${chipAt.x - (box ? box.x : 0)}px;top:${chipAt.y - (box ? box.y : 0)}px;` : '');
    return {
      id: 'hook', from: 0, to: out + .25, z,
      html: `<div class="c-hook${shadow ? ' ' + shadow : ''}${box ? ' boxed' : ''}"${box ? ` style="left:${box.x}px;top:${box.y}px;width:${box.w}px"` : ''}><div class="chip hChip"${chipSt ? ` style="${chipSt}"` : ''}><span class="pulse"></span>${esc(chip)}</div><div class="hTitle"${size || box ? ` style="${size ? `font-size:${size}px;` : ''}${box ? `top:${box.titleTop ?? 100}px;` : ''}"` : ''}>${title}</div></div>`,
      render(t, s) {
        const ho = E.inExpo(prog(t, out, out + .2));
        css(s.el, { opacity: 1 - ho, transform: `translateY(${-60 * ho}px)` });
        const k = spring(t + .12, .55, 2.6);
        css(s.q('.hChip'), { transform: `translateX(-50%) ${T(0, (1 - k) * -30, lerp(.6, 1, k))}`, opacity: clamp(k * 3) });
        s.qa('.w').forEach((el, n) => {
          const kk = spring(t + pre - n * stagger, .5, 2.8);
          let sc = lerp(1.6, 1, kk), extra = '';
          if (emph && el.textContent === emph.word) {
            const p = spring(t - emph.t, .4, 3.5), on = t >= emph.t;
            el.style.background = on ? (emph.color || 'var(--red)') : 'transparent';
            el.style.webkitTextStroke = on ? '0px' : '';
            if (on) sc *= 1 + .35 * (1 - clamp(p, 0, 1.4));
            const [sx, sy] = shake(t, emph.t, .3, 12, 1); extra = `translate(${sx}px,${sy}px) rotate(${on ? -3 : 0}deg)`;
          }
          css(el, { transform: `translateY(${(1 - kk) * -50}px) scale(${sc}) ${extra}`, opacity: clamp(kk * 3) });
        });
        if (deco) {
          const dk = spring(t - deco.t, .5, 3);
          css(s.q('.hDeco'), { opacity: t >= deco.t ? clamp(dk * 3) : 0, transform: `scale(${t >= deco.t ? lerp(.3, 1, dk) : 0}) rotate(${lerp(-20, 0, clamp(dk))}deg)` });
        }
      },
    };
  };

  // ===== üst etiket metni ("E-TİCARET <span>SİTENİZDE</span>") =====
  // move: {a, b, dy} -> a'ya kadar dy aşağıda, a..b arasında yerine kayar
  L.label = ({ html, top = 236, t: t0, move, box }) => ({
    html: `<div class="abs c-label" style="top:${box ? box.y : top}px${box ? `;left:${box.x}px;right:auto;width:${box.w}px` : ''}">${html}</div>`,
    render(t, r) {
      const k = spring(t - t0, .6, 2.2);
      const mv = move ? move.dy * (1 - E.inOutCubic(prog(t, move.a, move.b))) : 0;
      css(r.firstChild, { opacity: clamp(k * 2), transform: `translateY(${(1 - k) * 30 + mv}px)` });
    },
  });

  // ===== mağaza tarayıcısı: ürünler sırayla gelir, alt bağlantılar konuşulunca parlar =====
  // links: [{text, t}]  move: {a, b, dy, scale}
  L.storeBrowser = ({ url = 'magazaniz.com', store = 'MAĞAZA', x = 110, y = 320, w = 860, h = 540, t: t0, links = [], move,
    products = [['#FDE7DD', 'circle', '#F59E7A', '₺449'], ['#DDEBFD', 'rect', '#5DB3F0', '₺1.299'], ['#E2F5EA', 'tri', '#4CC38A', '₺689']] }) => {
    const shape = (k, c) => k === 'circle' ? `<div class="abs" style="left:50%;top:50%;width:84px;height:84px;margin:-42px;border-radius:50%;background:${c}"></div>`
      : k === 'rect' ? `<div class="abs" style="left:50%;top:50%;width:76px;height:96px;margin:-48px -38px;border-radius:16px;background:${c}"></div>`
      : `<div class="abs" style="left:50%;top:50%;width:0;height:0;margin:-44px -46px;border-left:46px solid transparent;border-right:46px solid transparent;border-bottom:84px solid ${c}"></div>`;
    return {
      html: `<div class="card" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
        <div class="bar">${dots}<div class="url">${I.lock()}${esc(url)}</div></div>
        <div class="store"><div class="storeHead"><div class="storeLogo">${esc(store)}<i>.</i></div><div class="cart">${I.cart()}<div class="badge">2</div></div></div>
          <div class="grid">${products.map(([bg, k, c, p]) => `<div class="prod"><div class="pimg" style="background:${bg}">${shape(k, c)}</div><div class="pname"></div><div class="price">${p}</div><div class="buy">Sepete Ekle</div></div>`).join('')}</div></div>
        <div class="foot"><span>Hakkımızda</span>${links.map(l => `<b>${esc(l.text)}</b>`).join('')}</div></div>`,
      render(t, r) {
        const card = r.firstChild;
        const k = spring(t - t0, .62, 1.9);
        const mv = move ? E.inOutCubic(prog(t, move.a, move.b)) : 1;
        css(card, { transform: T(0, (1 - k) * 260 + (move?.dy ?? 0) * (1 - mv), lerp(.72, 1, k) * lerp(move?.scale ?? 1, 1, mv)), opacity: clamp(k * 3) });
        r.querySelectorAll('.prod').forEach((el, n) => {
          const kk = spring(t - (t0 + .2 + n * .1), .55, 2.6);
          css(el, { transform: T(0, (1 - kk) * 40, lerp(.8, 1, kk)), opacity: clamp(kk * 2) });
        });
        r.querySelectorAll('.foot b').forEach((el, n) => {
          const on = t >= links[n].t;
          css(el, { background: on ? '#FFF3C4' : 'transparent', color: on ? '#0B3568' : '' });
        });
      },
    };
  };

  // ===== belge kartı: kaynaktan fırlar, dönerek yerine oturur =====
  // kind: 'lines' (sözleşme, imzalı) | 'form' (kutucuklu)  from: başlangıç merkezi  to: {x, y, rot} sol-üst + açı
  L.doc = ({ title, label = 'BELGE', kind = 'lines', t: t0, from, to }) => {
    const body = kind === 'form'
      ? [80, 65, 88, 55].map(p => `<div class="field"><i class="box"></i><div class="line" style="width:${p}%;margin:0"></div></div>`).join('')
      : `<div class="line" style="width:100%"></div><div class="line" style="width:92%"></div><div class="line" style="width:97%"></div><div class="line" style="width:70%"></div>
         <svg width="170" height="50" viewBox="0 0 170 50" style="margin-top:6px"><path d="M4 38c18-30 26-30 22-6s14-20 22-8 8 14 20 2 14-18 22-6 10 10 30 0 30-6 40-8" stroke="#2F6BFF" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;
    return {
      html: `<div class="doc"><div class="docHead">${I.doc()}${esc(label)}</div><div class="docBody"><div class="docTitle">${esc(title)}</div>${body}</div></div>`,
      render(t, r) {
        const kk = spring(t - t0, .6, 1.7), on = t >= t0;
        const cx = lerp(from.x - 200, to.x, kk), cy = lerp(from.y - 220, to.y, kk);
        css(r.firstChild, { left: '0px', top: '0px', opacity: on ? clamp(kk * 4) : 0,
          transform: `translate(${cx}px,${cy}px) scale(${lerp(.15, 1, kk)}) rotate(${lerp(to.rot * 4, to.rot, kk)}deg)` });
      },
    };
  };

  // ===== damga: büyükten çarparak iner (ZORUNLU, ONAYLANDI, YASAK...) =====
  L.stamp = ({ text, t: t0, x = 540, y = 1105, rot = -11, color, size }) => ({
    html: `<div class="abs c-stamp" style="left:${x}px;top:${y}px;${color ? `color:${color};border-color:${color};` : ''}${size ? `font-size:${size}px;` : ''}">${esc(text)}</div>`,
    render(t, r) {
      const sk = t >= t0 ? E.outCubic(prog(t, t0, t0 + .1)) : 0;
      const ss = t >= t0 ? lerp(2.6, 1, sk) * (1 + .06 * (1 - clamp(spring(t - (t0 + .1), .4, 4), 0, 1.5))) : 0;
      css(r.firstChild, { opacity: t >= t0 ? clamp(sk * 1.5) : 0, transform: `translate(-50%,-50%) scale(${ss}) rotate(${rot}deg)` });
    },
  });

  // ===== takvim yaprağı: gün büyük, ay başlığı, yılın son hanesi döner =====
  L.calendar = ({ day, month, yearPrefix, rollFrom, rollTo, x = 110, y = 236, t: t0, tMonth, tRoll }) => ({
    html: `<div class="card c-cal" style="left:${x}px;top:${y}px"><div class="calHead">${esc(month)}</div><div class="day">${esc(day)}</div>
      <div class="year">${esc(yearPrefix)}<span class="roll"><div class="rollIn">${esc(rollFrom)}<br>${esc(rollTo)}</div></span></div></div>`,
    render(t, r) {
      let k = spring(t - t0, .55, 2.0);
      css(r.firstChild, { opacity: clamp(k * 3), transform: T(0, (1 - k) * 120, lerp(.5, 1, k), lerp(-14, -3, k)) });
      k = spring(t - tMonth, .6, 3);
      css(r.querySelector('.calHead'), { color: `rgba(255,255,255,${clamp(k * 2)})`, letterSpacing: lerp(30, 6, clamp(k, 0, 1)) + 'px' });
      const rk = E.inOutCubic(prog(t, tRoll, tRoll + .36));
      css(r.querySelector('.rollIn'), { transform: `translateY(${-70 * rk}px)`, color: rk > .5 ? 'var(--red)' : '#475569' });
    },
  });

  // ===== etiket yığını: sağdan kayar; stamp:true olan damga gibi çarpar =====
  // items: [{text, icon: 'star'|'refresh'|'checkCircle'|..., style: 'yellow'|'white'|'green'|'red', t, top, stamp, stampFrom}]
  // stampFrom: damga girişinin başlangıç ölçeği (varsayılan 1.9; dar alanda küçült, güvenli alan)
  L.tags = ({ x = 530, items }) => {
    const iconColor = { yellow: '#0B1F33', white: '#0B3568', green: '#1FB766', red: '#E5383B' };
    return {
      html: items.map(it => `<div class="tag ${it.style}" style="left:${x}px;top:${it.top}px">${it.icon ? I[it.icon](iconColor[it.style]) : ''}${esc(it.text)}</div>`).join(''),
      render(t, r) {
        r.querySelectorAll('.tag').forEach((el, n) => {
          const it = items[n], st = !!it.stamp;
          const kk = spring(t - it.t, st ? .45 : .6, st ? 3 : 2.4);
          const s = st ? lerp(it.stampFrom ?? 1.9, 1, clamp(kk, 0, 1.2)) : lerp(.6, 1, kk);
          css(el, { opacity: t >= it.t ? clamp(kk * 3) : 0, transform: T(st ? 0 : (1 - kk) * 80, 0, s, st ? -4 : 0) });
        });
      },
    };
  };

  // ===== aciliyet bandı: yukarıdan çarpar, sarsılır, yukarı çıkar =====
  // inPlace: true -> ekran dışından kaymaz, yerinde ölçekle çarpar ve yerinde söner (güvenli alan)  top/inset: konum
  // box: {x, y, w, h} -> bölgeye yerleşir (h verilmezse 132 px)  size: yazı puntosu
  L.banner = ({ text, icon = 'clock', t: t0, out, color, z = 6, inPlace = false, top, inset, box, size }) => ({
    id: 'banner', from: t0, to: out + .2, z,
    html: `<div class="abs c-banner" style="${color ? `background:${color};` : ''}${top != null ? `top:${top}px;` : ''}${inset != null ? `left:${inset}px;right:${inset}px;` : ''}${box ? `left:${box.x}px;top:${box.y}px;width:${box.w}px;right:auto;${box.h ? `height:${box.h}px;` : ''}` : ''}${size ? `font-size:${size}px;` : ''}">${I[icon]()}${esc(text)}</div>`,
    render(t, s) {
      const k = spring(t - t0, .5, 2.6), o = E.inExpo(prog(t, out - .12, out + .1));
      const [bx, by] = shake(t, t0, .3, 10, 7);
      if (inPlace) css(s.q('.c-banner'), { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0,
        transform: `translate(${bx}px,${by}px) scale(${lerp(.7, 1, k) * (1 - .25 * o)})` });
      else css(s.q('.c-banner'), { transform: `translate(${bx}px,${by + (1 - k) * -360 - 400 * o}px) scale(${lerp(.9, 1, k)})` });
    },
  });

  // ===== tarayıcıya adres yazılır -> sayfa açılır: logo, tikli satırlar, hap =====
  // rows: [{text, check}]  pill: {text, t}  outAt: kart küçülerek kaybolur
  // enterDy: giriş kayması (varsayılan -160 yukarıdan; 0 = yerinde ölçekle açılır, güvenli alan)
  // fs: dar kutu için ölçüler {url, inset, row, rowH, logo, logoGap, pill, pad} (verilmezse 9x16 varsayılanları)
  L.typeBrowser = ({ url, x = 90, y = 230, w = 900, h = 520, tIn, typeAt, enter, logo = B.logo && B.logo.dark, rows = [], pill, outAt = Infinity, enterDy = -160, fs }) => ({
    html: `<div class="card c-type" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
      <div class="bar">${dots}<div class="url">${I.lock('#1FB766')}<span class="typed"></span><i class="caret"></i></div></div>
      <div class="load"></div>
      <div class="bigUrl"${fs ? ` style="${fs.url ? `font-size:${fs.url}px;` : ''}${fs.inset != null ? `left:${fs.inset}px;right:${fs.inset}px;` : ''}"` : ''}>${I.search()}<span class="bigTyped"></span><i class="caret bigCaret" style="height:${fs && fs.url ? Math.round(fs.url * .94) : 62}px;width:5px"></i></div>
      <div class="content"${fs && fs.pad != null ? ` style="padding:${fs.pad}px"` : ''}>${logo ? `<img src="${asset(logo)}" style="width:${fs && fs.logo || 430}px;display:block;margin:0 auto ${fs && fs.logoGap != null ? fs.logoGap : 26}px">` : ''}
        ${rows.map(rw => `<div class="row"${fs && fs.row ? ` style="font-size:${fs.row}px;height:${fs.rowH || 76}px;line-height:1.12"` : ''}><div class="chk"></div>${esc(rw.text)}</div>`).join('')}
        ${pill ? `<div style="text-align:center"><div class="readyPill"${fs && fs.pill ? ` style="font-size:${fs.pill}px"` : ''}>${esc(pill.text)}</div></div>` : ''}</div></div>`,
    render(t, r) {
      const q = s => r.querySelector(s), card = r.firstChild;
      const brOut = isFinite(outAt) ? E.inExpo(prog(t, outAt - .2, outAt)) : 0;   // Infinity -> NaN tuzağı
      let k = spring(t - tIn, .62, 1.9);
      css(card, { opacity: clamp(k * 3) * (1 - brOut), transform: T(0, (1 - k) * enterDy, lerp(.8, 1, k) * (1 - .1 * brOut)) });
      vis(card, t < outAt);
      const per = Math.min(.067, (enter - .05 - typeAt) / url.length);
      const n = clamp(Math.floor((t - typeAt) / per) + 1, 0, url.length);
      const typed = url.slice(0, t < typeAt ? 0 : n);
      q('.typed').textContent = typed; q('.bigTyped').textContent = typed;
      const bk = spring(t - (tIn + .12), .6, 2.4), bo = E.inExpo(prog(t, enter - .05, enter + .13));
      css(q('.bigUrl'), { opacity: clamp(bk * 2) * (1 - bo), transform: `scale(${lerp(.7, 1, bk) * (1 - .15 * bo) * (1 + .04 * (t >= enter - .05 && t < enter + .05 ? 1 : 0))})` });
      vis(q('.bigCaret'), t < enter - .05 && (t > typeAt && t < enter - .1 || Math.floor(t * 4) % 2 === 0));
      vis(q('.bar .caret'), t < enter && (t < enter - .05 && t > typeAt || Math.floor(t * 4) % 2 === 0));
      const lp = E.outCubic(prog(t, enter, enter + .25));
      css(q('.load'), { width: (w * lp) + 'px', opacity: t < enter + .3 ? 1 : 1 - prog(t, enter + .3, enter + .45) });
      const ck = spring(t - (enter + .07), .65, 2.2);
      css(q('.content'), { opacity: t >= enter + .05 ? clamp(ck * 2) : 0, transform: `translateY(${(1 - ck) * 40}px)` });
      r.querySelectorAll('.row').forEach((el, i) => {
        const t0 = enter + .2 + i * .12, t1 = rows[i].check;
        const kk = spring(t - t0, .6, 2.4);
        css(el, { opacity: t >= t0 ? clamp(kk * 2) : 0, transform: `translateX(${(1 - kk) * 60}px)` });
        const on = t1 != null && t >= t1, pk = spring(t - t1, .4, 3.5), c = el.querySelector('.chk');
        c.style.background = on ? 'var(--green)' : 'transparent';
        c.style.borderColor = on ? 'var(--green)' : '#CBD5E1';
        c.style.transform = `scale(${on ? lerp(1.6, 1, clamp(pk, 0, 1.3)) : 1})`;
        c.innerHTML = on ? I.check() : '';
      });
      if (pill) {
        const pk = spring(t - pill.t, .55, 2.5);
        css(q('.readyPill'), { opacity: t >= pill.t ? clamp(pk * 2) : 0, transform: `scale(${lerp(.6, 1, pk)})` });
      }
    },
  });

  // ===== Instagram tarzı takip kartı: el gelir, "Takip Et"e basar, "Takip Ediliyor" olur =====
  // w < 800: dar kart (buton w-120'ye daralır, el ve dalga buton merkezine göre; ör. 1x1 sol sütunda .8 ölçek için w 620)
  L.followCard = ({ name = B.handle, sub = B.url, avatar = B.logo && B.logo.mark, x = 140, y = 250, w = 800, h = 470, tIn, tap }) => ({
    html: `<div class="card c-follow" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
      <div class="avatar"><div>${avatar ? `<img src="${asset(avatar)}" style="height:96px">` : ''}</div></div>
      <div class="igName">${esc(name)}</div><div class="igSub">${esc(sub)}</div>
      <div class="follow"${w !== 800 ? ` style="left:${(w - Math.min(520, w - 120)) / 2}px;width:${Math.min(520, w - 120)}px"` : ''}><span class="followTxt">Takip Et</span><div class="ripple"></div></div>${I.hand()}</div>`,
    render(t, r) {
      const q = s => r.querySelector(s), ig = r.firstChild;
      vis(ig, t >= tIn);
      if (t < tIn) return;
      let k = spring(t - tIn, .58, 2.0);
      css(ig, { opacity: clamp(k * 3), transform: T(0, (1 - k) * 120, lerp(.75, 1, k)) });
      const ak = spring(t - (tIn + .08), .5, 2.6);
      css(q('.avatar'), { transform: `scale(${lerp(.3, 1, ak)})` });
      const hk = E.outCubic(prog(t, tap - .45, tap - .07));
      const press = t >= tap - .07 && t < tap + .15 ? Math.sin(prog(t, tap - .07, tap + .15) * Math.PI) : 0;
      css(q('.hand'), { opacity: clamp(prog(t, tap - .45, tap - .35)) * (1 - prog(t, tap + .45, tap + .65)),
        transform: `translate(${lerp(900 + (w / 2 - 400), 470 + (w / 2 - 400), hk)}px,${lerp(700, 368, hk)}px) scale(${1 - .12 * press}) rotate(${-12 + 12 * hk}deg)` });   // dar kartta buton merkezine göre
      const followed = t >= tap, bp = spring(t - tap, .4, 3.5);
      css(q('.follow'), { background: followed ? '#EFEFEF' : '#0095F6', color: followed ? '#111827' : '#fff',
        transform: `scale(${1 - .06 * press + (followed ? .08 * (1 - clamp(bp, 0, 1.3)) : 0)})` });
      q('.followTxt').textContent = followed ? 'Takip Ediliyor ✓' : 'Takip Et';
      const rp = prog(t, tap, tap + .4);
      css(q('.ripple'), { opacity: rp > 0 && rp < 1 ? .6 * (1 - rp) : 0, left: (Math.min(520, w - 120) / 2 + 70 - 300 * rp) + 'px', top: (48 - 300 * rp) + 'px',
        width: 600 * rp + 'px', height: 600 * rp + 'px' });
    },
  });

  // ===== grup: içindeki parçaları birlikte taşır/ölçekler (ör. tarayıcı küçülüp üste çekilir) =====
  // start: {x, y, s, r} başlangıç durumu  moves: [{a, b, x, y, s, r}] -> a..b arasında bir önceki durumdan bu duruma geçer
  // origin: ölçek merkezi
  L.group = ({ parts = [], moves = [], start = {}, origin = { x: 540, y: 960 } }) => ({
    html: `<div class="abs c-group" style="transform-origin:${origin.x}px ${origin.y}px">${parts.map(p => `<div class="part">${p.html}</div>`).join('')}</div>`,
    render(t, r) {
      const g = r.firstChild;
      if (!g._roots) g._roots = [...g.children];
      let st = Object.assign({ x: 0, y: 0, s: 1, r: 0 }, start);
      for (const m of moves) {
        const u = E.inOutCubic(prog(t, m.a, m.b)), nx = {};
        for (const k of ['x', 'y', 's', 'r']) nx[k] = lerp(st[k], m[k] ?? st[k], u);
        st = nx;
      }
      css(g, { transform: T(st.x, st.y, st.s, st.r) });
      parts.forEach((p, i) => p.render && p.render(t, g._roots[i]));
    },
  });

  // ===== resmi düzenleme/duyuru belgesi: yukarıdan iner, satırlar sırayla çizilir, biri fosforla işaretlenir =====
  // icon: L.I anahtarı (jenerik; arma/logo değil)  lines: satır sayısı  mark: {line, t} sarı fosfor
  // enterDy: giriş kayması (alan içinde kısa iniş; güvenli alan için büyük tutma)
  L.notice = ({ title, icon = 'gavel', x = 190, y = 330, w = 700, h = 400, t: t0, lines = 5, mark, enterDy = -50 }) => {
    const ws = [100, 93, 97, 70, 88, 62];
    return {
      html: `<div class="card c-notice" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
        <div class="nHead"><div class="nIcon">${I[icon]('#fff')}</div>${title ? `<div class="nTitle">${esc(title)}</div>` : ''}</div>
        <div class="nBody">${[...Array(lines)].map((_, i) => `<div class="nLine" style="width:${ws[i % ws.length]}%"><b></b><i></i></div>`).join('')}</div></div>`,
      render(t, r) {
        const card = r.firstChild, k = spring(t - t0, .6, 1.8);
        css(card, { opacity: t >= t0 ? clamp(k * 3) : 0, transform: T(0, (1 - k) * enterDy, lerp(.85, 1, k), lerp(-9, -2, k)) });
        r.querySelectorAll('.nLine').forEach((el, i) => {
          const p = E.outCubic(prog(t, t0 + .22 + i * .08, t0 + .5 + i * .08));
          el.querySelector('i').style.transform = `scaleX(${p})`;
          const on = mark && mark.line === i, mp = on ? E.outCubic(prog(t, mark.t, mark.t + .3)) : 0;
          el.querySelector('b').style.transform = `scaleX(${mp})`;
        });
      },
    };
  };

  // ===== kontrol listesi kartı: başlık + satırlar; satır kendi anında yazılır, işareti (x/check) damga gibi çarpar =====
  // items: [{text, t, mark: 'x'|'check', tMark}]  placeholder: satırlar önceden gri iskelet olarak bekler
  // title boşsa başlık bandında yalnızca ikon durur (altyazıyı tekrar etmemek için)  icon: L.I anahtarı (varsayılan doc)
  // textSize: satır puntosu (varsayılan 42)  wrap: true -> uzun satır iki satıra kırılır (dar sütun)
  L.checklist = ({ title = '', icon = 'doc', x = 90, y = 250, w = 900, rowH = 122, t: t0, items = [], placeholder = true, textSize, wrap = false }) => ({
    html: `<div class="card c-check" style="left:${x}px;top:${y}px;width:${w}px">
      <div class="clHead">${icon === 'doc' ? I.doc() : I[icon]('#fff')}${title ? `<span>${esc(title)}</span>` : ''}</div>
      ${items.map(it => `<div class="clRow" style="height:${rowH}px"><div class="clSkel"><i style="width:62%"></i><i style="width:38%"></i></div>
        <div class="clText"${textSize || wrap ? ` style="${textSize ? `font-size:${textSize}px;` : ''}${wrap ? 'white-space:normal;line-height:1.1;' : ''}"` : ''}>${esc(it.text)}</div><div class="clMark"></div></div>`).join('')}</div>`,
    render(t, r) {
      const card = r.firstChild, k = spring(t - t0, .62, 2.0);
      css(card, { opacity: t >= t0 ? clamp(k * 3) : 0, transform: T(0, (1 - k) * 140, lerp(.85, 1, k)) });
      r.querySelectorAll('.clRow').forEach((row, i) => {
        const it = items[i], tm = it.tMark ?? it.t + .12, bad = it.mark === 'x';
        const pk = spring(t - (t0 + .18 + i * .1), .6, 2.4);
        css(row, { opacity: (placeholder || t >= it.t) ? clamp(pk * 2) : 0, transform: `translateY(${(1 - pk) * 30}px)` });
        const tk = spring(t - it.t, .6, 2.6), on = t >= it.t;
        css(row.querySelector('.clSkel'), { opacity: placeholder ? 1 - clamp(tk * 3) * (on ? 1 : 0) : 0 });
        css(row.querySelector('.clText'), { opacity: on ? clamp(tk * 2) : 0, transform: `translateX(${(1 - tk) * 50}px)` });
        const mo = t >= tm, mk = spring(t - tm, .4, 4), c = row.querySelector('.clMark');
        const col = bad ? 'var(--red)' : 'var(--green)';
        css(c, { background: mo ? col : 'transparent', borderColor: mo ? col : '#CBD5E1',
          transform: `scale(${mo ? lerp(1.9, 1, clamp(mk, 0, 1.3)) : 1}) rotate(${mo ? lerp(-25, 0, clamp(mk, 0, 1)) : 0}deg)` });
        c.innerHTML = mo ? (bad ? I.x() : I.check()) : '';
        row.style.background = mo ? (bad ? '#FDECEC' : '#E7F7EE') : 'transparent';
      });
    },
  });

  // ===== rozet: yuvarlak (text varsa hap) çıkartma; pop ile gelir, spin:true ise ikon bir tur döner =====
  // style: 'yellow'|'red'|'green'|'white'  iconScale: ikon büyütme  out: küçülerek çıkış zamanı
  L.badge = ({ icon = 'refresh', text, x, y, t: t0, style = 'yellow', size = 92, spin = false, rot = 0, iconScale = 1, out = Infinity }) => {
    const fg = { yellow: '#0B1F33', red: '#fff', green: '#fff', white: '#0B3568' }[style];
    return {
      html: `<div class="abs c-badge ${style}" style="left:${x}px;top:${y}px;height:${size}px;min-width:${size}px">
        <span class="bIcon">${I[icon](fg)}</span>${text ? `<span>${esc(text)}</span>` : ''}</div>`,
      render(t, r) {
        const k = spring(t - t0, .5, 3), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
        css(r.firstChild, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0,
          transform: `translate(-50%,-50%) scale(${t >= t0 ? lerp(.2, 1, k) * (1 - .6 * o) : 0}) rotate(${rot}deg)` });
        const sp = spin ? 360 * E.outCubic(prog(t, t0 + .05, t0 + .75)) : 0;
        r.querySelector('.bIcon').style.transform = `rotate(${sp}deg) scale(${iconScale})`;
      },
    };
  };

  // ===== işaret hapı: kelimeleri konuşuldukça koyulaşan hap + zıplayan yön oku ("DETAYLAR AÇIKLAMADA" ↓) =====
  // words: [{text, t}]  y: hap merkezi  dir: 'down'|'up'  side: 'right' (ok hapın yanında) | 'below' (altında)
  L.pointer = ({ words, t: t0, y = 1450, dir = 'down', side = 'right', out = Infinity, size = 54, box }) => ({
    html: `<div class="abs c-pointer ${side}" style="top:${y}px${box ? `;left:${box.x}px;right:auto;width:${box.w}px` : ''}"><div class="pPill" style="font-size:${size}px">${words.map(w => `<span>${esc(w.text)}</span>`).join(' ')}</div>
      <div class="pArrow ${dir}">${I.arrowDown()}</div></div>`,
    render(t, r) {
      const el = r.firstChild, k = spring(t - t0, .55, 2.6), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
      css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0 });
      css(el.querySelector('.pPill'), { transform: `translateY(${(1 - k) * 60}px) scale(${lerp(.6, 1, k)})` });
      el.querySelectorAll('.pPill span').forEach((sp, i) => {
        const on = t >= words[i].t, wk = spring(t - words[i].t, .45, 4);
        css(sp, { color: on ? 'var(--brand)' : '#B6C2D2', display: 'inline-block',
          transform: `scale(${on ? 1 + .12 * (1 - clamp(wk, 0, 1.3)) : 1})` });
      });
      const ak = spring(t - (t0 + .12), .5, 2.8), bob = Math.abs(Math.sin((t - t0) * Math.PI * 1.8)) * 14 * clamp(ak, 0, 1);
      css(el.querySelector('.pArrow'), { opacity: t >= t0 + .12 ? clamp(ak * 3) : 0,
        transform: `translateY(${(dir === 'down' ? 1 : -1) * bob}px) scale(${lerp(.3, 1, ak)}) rotate(${dir === 'down' ? 0 : 180}deg)` });
    },
  });

  // ===== son kart: bir noktadan açılan lacivert daire, beyaz logo, adres, slogan =====
  // 9x16 dışı formatlarda konumlar formats.json 'end'den gelir (logoTop, logoW, urlTop, tagTop)
  L.endCard = ({ t: t0, at, logo = B.logo && B.logo.light, url = B.url, tagline = B.tagline, z = 9 }) => {
   const FE = M.F && M.F.end; at = at || (FE ? { x: FE.x, y: FE.y } : { x: 540, y: 638 });
   const lst = FE ? ` style="top:${FE.logoTop}px;width:${FE.logoW}px;margin-left:${-FE.logoW / 2}px"` : '';
   return {
    id: 'endcard', from: t0, z,
    html: `<div class="c-end" data-safe="ignore">${logo ? `<img class="endLogo" src="${asset(logo)}"${lst}>` : ''}<div class="endUrl"${FE ? ` style="top:${FE.urlTop}px"` : ''}>${esc(url || '')}</div><div class="endTag"${FE ? ` style="top:${FE.tagTop}px"` : ''}>${esc(tagline || '')}</div></div>`,
    render(t, s) {
      const p = E.inOutQuart(prog(t, t0, t0 + .42));
      css(s.q('.c-end'), { clipPath: p < 1 ? `circle(${2300 * p}px at ${at.x}px ${at.y}px)` : 'none' });
      let k = spring(t - (t0 + .2), .6, 2.0);
      if (s.q('.endLogo')) css(s.q('.endLogo'), { opacity: clamp(k * 2), transform: `scale(${lerp(.85, 1, k)})` });
      k = spring(t - (t0 + .35), .7, 2.2);
      css(s.q('.endUrl'), { opacity: clamp(k * 2), transform: `translateY(${(1 - k) * 30}px)` });
      k = spring(t - (t0 + .5), .7, 2.2);
      css(s.q('.endTag'), { opacity: clamp(k * 2), transform: `translateY(${(1 - k) * 24}px)` });
    },
   };
  };

  // ===== çerçeve: 9x16'da tasarlanmış alt kompozisyonu başka bir bölgeye ölçekleyip taşır (formatlar için) =====
  // design: [x,y,w,h] tasarım bölgesi (9x16 koordinatı), into: hedef bölge ([x,y,w,h] veya M.R[...]), max: en fazla ölçek
  L.frame = ({ design, into, ax = .5, ay = .5, max = 1, parts = [] }) => {
    const f = M.fit(design, into, { ax, ay, max });
    if (f.s === 1 && Math.abs(f.x) < .01 && Math.abs(f.y) < .01) return { flat: parts };   // kimlik: DOM değişmez
    return L.group({ origin: { x: 0, y: 0 }, start: { x: f.x, y: f.y, s: f.s }, parts });
  };

  // ===== MİKRO ANİMASYONLAR: yüz ekrandayken yanında beliren küçük dikkat elemanları =====
  // Yerleşim otomatik (M.slot): güvenli alan içinde, kafa/altyazı/yasak kutu ve aynı anda görünen diğer mikrolarla
  // çakışmadan. Konumlar sayfa açılışında zaman sırasıyla bir kez çözülür (işçiler arası deterministik).
  // Ortak: {t, out (vars. t+1.4), prefer:['right','left','above','below'], at:{x,y} (elle konum)}
  let microN = 0;
  const micro = ({ t: t0, out, prefer, at, html, cls = '', render }) => {
    out = out ?? t0 + 1.4;
    const id = `micro-${microN++}`, m = { id, a: t0, b: out, prefer, at, pos: undefined };
    (M._micro = M._micro || []).push(m);
    return {
      html: `<div class="abs micro ${cls}" id="${id}">${html}</div>`,
      render(t, r) {
        const el = r.firstChild;
        if (!m.pos || t < t0 || t >= out + .25) { css(el, { opacity: 0 }); return; }
        css(el, { left: m.pos.ox + 'px', top: m.pos.oy + 'px' });
        const k = spring(t - t0, .5, 3), o = E.inExpo(prog(t, out - .05, out + .2));
        css(el, { opacity: clamp(k * 3) * (1 - o), transform: `scale(${m.pos.s * lerp(.4, 1, clamp(k, 0, 1.15)) * (1 - .15 * o)})` });
        if (render) render(t, el, k);
      },
    };
  };
  // motor çağırır: tüm mikroların yerini zaman sırasıyla çöz (ölçüler DOM'dan)
  M.resolveMicro = () => {
    for (const m of (M._micro || []).slice().sort((x, y) => x.a - y.a)) {
      const el = document.getElementById(m.id); if (!el) continue;
      m.pos = M.slot({ a: m.a, b: m.b, w: el.offsetWidth, h: el.offsetHeight, prefer: m.prefer, at: m.at });
    }
  };
  // ikon + kısa yazı çipi (ör. 🏋 yerine 'dumbbell' ikonu + "Antrenman")
  L.sticker = ({ icon = 'star', text, color = '#fff', ink = 'var(--navy)', ...o }) => micro({ ...o, cls: 'm-sticker',
    html: `<div class="mIn" style="background:${color};color:${ink}">${I[icon] ? I[icon](ink === 'var(--navy)' ? '#0B1F33' : ink) : ''}<span>${esc(text)}</span></div>` });
  // tek anahtar kelime (büyük, renkli)
  L.keyword = ({ text, color = 'var(--yellow)', ink = 'var(--navy)', ...o }) => micro({ ...o, cls: 'm-keyword',
    html: `<div class="mIn" style="background:${color};color:${ink}">${esc(text)}</div>` });
  // telefon bildirimi balonu (uygulama adı + başlık + kısa metin)
  L.notif = ({ app = 'Bildirim', title, body = '', icon = 'bell', ...o }) => micro({ ...o, cls: 'm-notif', prefer: o.prefer || ['above', 'below'],
    html: `<div class="mIn"><div class="nfIcon">${I[icon] ? I[icon]('#fff') : ''}</div><div class="nfTxt"><div class="nfApp">${esc(app)} · şimdi</div>
      <div class="nfTitle">${esc(title)}</div>${body ? `<div class="nfBody">${esc(body)}</div>` : ''}</div></div>` });
  // sayaç: from -> to (dur saniyede), önek/sonek, alt etiket
  L.counter = ({ from = 0, to, prefix = '', suffix = '', dur = .8, label = '', decimals = 0, grouping = true, ...o }) => micro({ ...o, cls: 'm-counter',
    html: `<div class="mIn"><div class="cNum">${esc(prefix)}${to.toFixed(decimals)}${esc(suffix)}</div>${label ? `<div class="cLbl">${esc(label)}</div>` : ''}</div>`,
    render(t, el) {
      const v = lerp(from, to, E.outCubic(prog(t, o.t, o.t + dur)));
      el.querySelector('.cNum').textContent = `${prefix}${v.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: grouping })}${suffix}`;
    } });
  // daire vurgusu: videodaki bir noktayı çevreler (elle konum at:{x,y,r}; yüze konmaz)
  L.ring = ({ at, t: t0, out, color = 'var(--yellow)', width = 10 }) => ({
    html: `<svg class="abs m-ring" style="left:${at.x - at.r - 20}px;top:${at.y - at.r - 20}px" width="${2 * at.r + 40}" height="${2 * at.r + 40}">
      <circle cx="${at.r + 20}" cy="${at.r + 20}" r="${at.r}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" pathLength="100" stroke-dasharray="100" /></svg>`,
    render(t, r) {
      const el = r.firstChild, e = out ?? t0 + 1.4, k = E.outCubic(prog(t, t0, t0 + .45)), o = E.inExpo(prog(t, e - .05, e + .2));
      css(el, { opacity: t >= t0 ? 1 - o : 0 });
      el.querySelector('circle').style.strokeDashoffset = 100 - 100 * k;
    },
  });
  // ince ilerleme çubuğu (güvenli alanın üst kenarında; videonun neresinde olduğunu gösterir)
  L.progress = ({ a = 0, b, color = 'var(--yellow)' }) => ({
    html: `<div class="abs m-progress"><i></i></div>`,
    render(t, r) {
      const el = r.firstChild, S = M.SAFE;
      css(el, { left: S.x0 + 'px', top: (S.y0 - 2) + 'px', width: (S.x1 - S.x0) + 'px', opacity: t < (b ?? M.TOTAL_END) ? 1 : 0 });
      css(el.firstChild, { width: (100 * clamp((t - a) / ((b ?? M.TOTAL_END) - a))) + '%', background: color });
    },
  });
  I.bell = (c = '#fff') => `<svg width="40" height="40" viewBox="0 0 40 40"><path d="M20 5a10 10 0 0 0-10 10v7l-4 6h28l-4-6v-7A10 10 0 0 0 20 5z" fill="${c}"/><circle cx="20" cy="33" r="3.5" fill="${c}"/></svg>`;
  I.dumbbell = (c = '#0B1F33') => `<svg width="44" height="44" viewBox="0 0 44 44"><rect x="4" y="15" width="6" height="14" rx="2" fill="${c}"/><rect x="10" y="11" width="6" height="22" rx="2" fill="${c}"/><rect x="28" y="11" width="6" height="22" rx="2" fill="${c}"/><rect x="34" y="15" width="6" height="14" rx="2" fill="${c}"/><rect x="16" y="20" width="12" height="4" fill="${c}"/></svg>`;
  I.spark = (c = '#0B1F33') => `<svg width="44" height="44" viewBox="0 0 44 44"><path d="M22 3l4 13 13 4-13 4-4 13-4-13-13-4 13-4z" fill="${c}"/></svg>`;
  I.bolt = (c = '#0B1F33') => `<svg width="44" height="44" viewBox="0 0 44 44"><path d="M25 3L8 25h12l-3 16 17-23H22z" fill="${c}"/></svg>`;
  I.heart = (c = '#E5383B') => `<svg width="44" height="44" viewBox="0 0 44 44"><path d="M22 38S5 27 5 15a8.5 8.5 0 0 1 17-2 8.5 8.5 0 0 1 17 2c0 12-17 23-17 23z" fill="${c}"/></svg>`;
  I.chat = (c = '#0B1F33') => `<svg width="44" height="44" viewBox="0 0 44 44"><path d="M6 8h32v22H18l-8 7v-7H6z" fill="${c}"/></svg>`;
  I.time = (c = '#0B1F33') => `<svg width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="17" fill="none" stroke="${c}" stroke-width="5"/><path d="M22 12v11l7 4" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;

  // ===================== v4 bileşenleri: büyük tipografi, site duvarı, kâğıt, kalkan, balon, tutar, gösterge =====================
  // Yalnızca yeni adlar eklenir; mevcut bileşen ve stiller değişmez (mevcut varsayılanlar korunur).
  I.user = (c = '#fff') => `<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="18" r="11" fill="${c}"/><path d="M7 51c0-12 9.4-20 21-20s21 8 21 20z" fill="${c}"/></svg>`;
  I.store = (c = '#fff') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M5 22L10 7h36l5 15z" fill="${c}"/><path d="M10 26v23h36V26" stroke="${c}" stroke-width="5" fill="none" stroke-linejoin="round"/><rect x="22" y="33" width="12" height="16" rx="2" fill="${c}"/></svg>`;
  I.scale = (c = '#0B3568') => `<svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="9" r="4.5" fill="${c}"/><rect x="30" y="9" width="4" height="44" rx="2" fill="${c}"/><rect x="17" y="52" width="30" height="6" rx="3" fill="${c}"/><rect x="7" y="15" width="50" height="4.5" rx="2.25" fill="${c}"/><path d="M12 19L4 35M12 19l8 16M52 19l-8 16M52 19l8 16" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/><path d="M2 35h20a10 6 0 0 1-20 0zM42 35h20a10 6 0 0 1-20 0z" fill="${c}"/></svg>`;
  I.copy = (c = '#0B3568') => `<svg width="44" height="44" viewBox="0 0 44 44"><rect x="15" y="4" width="24" height="28" rx="4" fill="none" stroke="${c}" stroke-width="4"/><rect x="5" y="12" width="24" height="28" rx="4" fill="${c}"/></svg>`;
  const fmtNum = (v, d = 0) => v.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });

  // ===== büyük tipografi (ör. yıl '2026'): karakterler tGhost'ta kontur olarak belirir, t'de sırayla dolarak çarpar =====
  // x: merkez  y: üst kenar  size: punto  stagger: karakter aralığı  color, accent: {i:[indeksler], color}  out: küçülerek çıkış
  L.bigType = ({ text, x = 540, y = 600, size = 280, t: t0, tGhost, stagger = .07, color = '#fff', accent, out = Infinity }) => {
    const ch = [...String(text)];
    const col = i => accent && accent.i.includes(i) ? accent.color : color;
    return {
      html: `<div class="abs c-big" style="left:${x}px;top:${y}px;font-size:${size}px">${ch.map((c, i) =>
        `<span class="bgCh"><i>${esc(c)}</i><b style="color:${col(i)}">${esc(c)}</b></span>`).join('')}</div>`,
      render(t, r) {
        const el = r.firstChild, g0 = tGhost ?? t0, o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
        css(el, { opacity: t >= g0 ? 1 - o : 0, transform: `translateX(-50%) scale(${1 - .35 * o})` });
        el.querySelectorAll('.bgCh').forEach((sp, i) => {
          const gk = spring(t - (g0 + i * stagger * .5), .7, 2.6), tf = t0 + i * stagger, on = t >= tf, fk = spring(t - tf, .45, 3.2);
          css(sp, { transform: `translateY(${on ? (1 - clamp(fk, 0, 1.3)) * -.12 * size : (1 - gk) * .08 * size}px) scale(${on ? 1 + .22 * (1 - clamp(fk, 0, 1.3)) : lerp(.9, 1, gk)})` });
          css(sp.firstChild, { opacity: t >= g0 ? clamp(gk * 2) * (on ? 1 - clamp(fk * 3) : 1) : 0 });
          css(sp.lastChild, { opacity: on ? clamp(fk * 3) : 0 });
        });
      },
    };
  };

  // ===== site duvarı: bir mağaza penceresi açılır; tMulti'de küçülüp ızgaradaki hücresine geçer, çevresinde başka siteler belirir =====
  // ("her web sitesi")  x,y,w,h: ızgara alanı  cols, rows  hero: büyük pencerenin hücresi  heroW: ilk genişlik (alanın ortasında)
  // t: büyük pencere  tMulti: çoğalma  out: hepsi küçülerek çıkar (out'ta bitmiş)  themes: [[ana, açık], ...]
  // Pencereler yazısızdır (400x300 tasarım, ölçeklenir).
  const SITE_THEMES = [['#2F6BFF', '#DDEBFD'], ['#E5383B', '#FDE7DD'], ['#1FB766', '#E2F5EA'], ['#F59E0B', '#FEF3C7'],
                       ['#0B3568', '#E0E7F1'], ['#0EA5E9', '#E0F2FE'], ['#DB2777', '#FCE7F3'], ['#0F766E', '#CCFBF1'], ['#64748B', '#F1F5F9']];
  L.siteGrid = ({ x = 90, y = 470, w = 900, h = 560, cols = 3, rows = 2, hero = 1, heroW, t: t0, tMulti = Infinity, out = Infinity, gap = 24, themes = SITE_THEMES }) => {
    const DW = 400, DH = 300, n = cols * rows;
    const cw = (w - gap * (cols - 1)) / cols, rh = (h - gap * (rows - 1)) / rows, cs = Math.min(cw / DW, rh / DH);
    const cell = i => ({ x: x + (i % cols) * (cw + gap) + (cw - DW * cs) / 2, y: y + Math.floor(i / cols) * (rh + gap) + (rh - DH * cs) / 2 });
    const hs = (heroW || w * .9) / DW, H0 = { x: x + (w - DW * hs) / 2, y: y + (h - DH * hs) / 2 };
    const hc = cell(hero), dist = i => { const c = cell(i); return Math.hypot(c.x - hc.x, c.y - hc.y); };
    const order = [...Array(n).keys()].filter(i => i !== hero).sort((a, b) => dist(a) - dist(b) || a - b);
    const win = (th, k) => `<div class="sw"><div class="swBar"><i></i><i></i><i></i><b></b></div>
      <div class="swHead"><span class="swLogo" style="background:${th[0]}"></span><span class="swNav"></span><span class="swNav"></span><span class="swCart" style="border-color:${th[0]}"></span></div>
      <div class="swBan" style="background:${th[1]}"><span style="background:${th[0]}"></span><em></em></div>
      <div class="swProds">${[0, 1, 2].map(j => `<div class="swP"><div class="swImg" style="background:${th[1]}"><i class="sh${(j + k) % 3}" style="background:${th[0]}"></i></div><div class="swPr"></div><div class="swBuy" style="background:${th[0]}"></div></div>`).join('')}</div></div>`;
    return {
      html: `<div class="abs c-sites">${[...Array(n).keys()].map(i => win(themes[i % themes.length], i)).join('')}</div>`,
      render(t, r) {
        const ws = r.firstChild.children;
        for (let i = 0; i < n; i++) {
          const el = ws[i], c = cell(i), rank = i === hero ? 0 : order.indexOf(i) + 1;
          let px, py, s, s1, op;
          if (i === hero) {
            const k = spring(t - t0, .62, 1.9), m = clamp(spring(t - tMulti, .74, 1.8), 0, 1.04);
            s1 = lerp(hs, cs, m); s = s1 * lerp(.8, 1, k);
            px = lerp(H0.x, c.x, m); py = lerp(H0.y, c.y, m);
            op = t >= t0 ? clamp(k * 3) : 0;
          } else {
            const ta = tMulti + .1 + (rank - 1) * .06, k = spring(t - ta, .55, 2.6);
            s1 = cs; s = cs * lerp(.3, 1, k); px = c.x; py = c.y;
            op = t >= ta ? clamp(k * 3) : 0;
          }
          const od = .02 * rank, o = isFinite(out) ? E.inExpo(prog(t, out - .22 - od, out - od)) : 0, s2 = s * (1 - .6 * o);
          px += DW * (s1 - s2) / 2; py += DH * (s1 - s2) / 2;                       // ölçek pencere merkezinden
          css(el, { opacity: op * (1 - o), transform: `translate(${px}px,${py}px) scale(${s2})` });
        }
        ws[hero].querySelectorAll('.swP').forEach((p, j) => {
          const kk = spring(t - (t0 + .18 + j * .08), .55, 2.6);
          css(p, { opacity: t >= t0 + .18 + j * .08 ? clamp(kk * 2) : 0, transform: `translateY(${(1 - kk) * 20}px) scale(${lerp(.8, 1, kk)})` });
        });
      },
    };
  };

  // ===== belge kâğıdı: yerinde pop ile gelir; köşe numarası, başlık (kendi anında soldan yazılır), iskelet satırlar =====
  // x,y: sol-üst  w,h  rot  num: köşe rozeti ('1')  title + tTitle  lines: satır sayısı  (ölçüler w'ye göre; tasarım w 330)
  // copyAt: arkasından iki kopya kâğıt yelpazelenir  ageAt: kâğıt sararır (eski metin)  mark: {t, kind:'x'|'check'} damga gibi çarpar
  // tag: {text, t, style:'red'|'yellow'|'green'|'white', size} alt kenarda hap  out: küçülerek çıkış
  L.paper = ({ x, y, w = 330, h = 420, rot = 0, t: t0, num, title = '', tTitle, lines = 5, copyAt, ageAt, mark, tag, out = Infinity }) => {
    const u = w / 330, px = v => `${(v * u).toFixed(1)}px`, LW = [92, 100, 84, 96, 70, 88, 60];
    return {
      html: `<div class="abs c-paper" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
        ${copyAt != null ? '<div class="pCopy"></div><div class="pCopy"></div>' : ''}
        <div class="pSheetW"><div class="pSheet" style="--fold:${px(52)};padding:${px(34)} ${px(30)};border-radius:${px(14)}">
          ${title ? `<div class="pTitle" style="font-size:${px(36)};margin:${num != null ? px(38) : 0} 0 ${px(8)}">${esc(title)}</div>` : ''}
          <div class="pLines">${[...Array(lines)].map((_, i) => `<i style="width:${LW[i % LW.length]}%;height:${px(13)};margin-top:${px(19)};border-radius:${px(7)}"></i>`).join('')}</div>
          ${ageAt != null ? '<div class="pAge"></div>' : ''}</div></div>
        ${num != null ? `<div class="pNum" style="width:${px(86)};height:${px(86)};left:${px(-24)};top:${px(-24)};font-size:${px(50)};border-width:${px(6)}">${esc(num)}</div>` : ''}
        ${mark ? `<div class="pMark ${mark.kind === 'check' ? 'ok' : 'bad'}" style="width:${px(128)};height:${px(128)};right:${px(-20)};bottom:${px(46)};border-width:${px(7)}">${mark.kind === 'check' ? I.check() : I.x()}</div>` : ''}
        ${tag ? `<div class="pTag ${tag.style || 'red'}" style="font-size:${px(tag.size || 44)};bottom:${px(-30)}">${esc(tag.text)}</div>` : ''}
      </div>`,
      render(t, r) {
        const el = r.firstChild, q = s => el.querySelector(s);
        const k = spring(t - t0, .55, 2.4), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
        const ag = ageAt != null ? E.inOutCubic(prog(t, ageAt, ageAt + .5)) : 0;
        css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0,
          transform: `scale(${t >= t0 ? lerp(.55, 1, k) * (1 - .35 * o) : 0}) rotate(${lerp(rot - 9, rot, clamp(k, 0, 1.1)) + 3 * Math.sign(rot || 1) * ag}deg)` });
        el.querySelectorAll('.pLines i').forEach((ln, i) => {
          ln.style.transform = `scaleX(${E.outCubic(prog(t, t0 + .15 + i * .05, t0 + .45 + i * .05))})`;
        });
        if (title) {
          const tt = tTitle ?? t0, p = t >= tt ? E.outCubic(prog(t, tt, tt + .4)) : 0;
          css(q('.pTitle'), { clipPath: `inset(-10% ${(100 * (1 - p)).toFixed(2)}% -10% 0)`, transform: `translateX(${(1 - p) * -10}px)` });
        }
        if (ageAt != null) q('.pAge').style.opacity = ag;
        if (copyAt != null) el.querySelectorAll('.pCopy').forEach((c, j) => {
          const ck = t >= copyAt ? spring(t - (copyAt + j * .07), .55, 2.4) : 0, sg = j ? 1 : -1;
          css(c, { opacity: t >= copyAt ? clamp(ck * 3) : 0, transform: `translate(${sg * .14 * w * ck}px,${(j ? -.04 : .05) * h * ck}px) rotate(${sg * 7 * ck}deg)` });
        });
        if (num != null) {
          const nk = spring(t - (t0 + .12), .5, 3);
          css(q('.pNum'), { opacity: t >= t0 + .12 ? clamp(nk * 3) : 0, transform: `scale(${lerp(.2, 1, nk)})` });
        }
        if (mark) {
          const on = t >= mark.t, mk = spring(t - mark.t, .4, 4);
          css(q('.pMark'), { opacity: on ? clamp(mk * 4) : 0, transform: `scale(${on ? lerp(2, 1, clamp(mk, 0, 1.3)) : 0}) rotate(${on ? lerp(-25, 0, clamp(mk, 0, 1)) : 0}deg)` });
        }
        if (tag) {
          const on = t >= tag.t, tk = spring(t - tag.t, .5, 3);
          css(q('.pTag'), { opacity: on ? clamp(tk * 3) : 0, transform: `translateX(-50%) scale(${on ? lerp(.4, 1, tk) : 0})` });
        }
      },
    };
  };

  // ===== kalkan rozeti (taraflar / koruma: ör. Tüketici, Satıcı): pop ile gelir; tPulse'ta koruma halkası yayılır, yeşil tik belirir =====
  // x,y: kalkan merkezi  size: genişlik  icon: L.I anahtarı (user, store…)  label: alt hap  color: dolgu  out: küçülerek çıkış
  L.shield = ({ x, y, size = 200, icon = 'user', label, t: t0, tPulse, color = 'var(--brand)', out = Infinity }) => {
    const hh = size * 1.16, P = tPulse != null && isFinite(tPulse);
    return {
      html: `<div class="abs c-shield" style="left:${x - size / 2}px;top:${y - hh / 2}px;width:${size}px;height:${hh}px">
        <div class="shRing" style="width:${size * 1.2}px;height:${size * 1.2}px;border-width:${Math.max(4, size * .03)}px"></div>
        <svg class="shBody" viewBox="0 0 100 116" width="${size}" height="${hh}"><path d="M50 4L93 18v35c0 30-19 51-43 59C26 104 7 83 7 53V18z" style="fill:${color}" stroke="#fff" stroke-width="5" stroke-linejoin="round"/></svg>
        <div class="shIcon">${I[icon] ? I[icon]('#fff') : ''}</div>
        ${P ? `<div class="shOk" style="width:${size * .36}px;height:${size * .36}px">${I.check()}</div>` : ''}
        ${label ? `<div class="shLabel" style="font-size:${Math.round(size * .19)}px">${esc(label)}</div>` : ''}
      </div>`,
      render(t, r) {
        const el = r.firstChild, q = s => el.querySelector(s);
        const k = spring(t - t0, .5, 2.8), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
        const pu = P && t >= tPulse ? Math.sin(Math.PI * prog(t, tPulse, tPulse + .35)) : 0;
        css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0, transform: `scale(${t >= t0 ? lerp(.3, 1, k) * (1 + .08 * pu) * (1 - .4 * o) : 0})` });
        const rp = P ? prog(t, tPulse, tPulse + .7) : 0;
        css(q('.shRing'), { opacity: rp > 0 && rp < 1 ? .9 * (1 - rp) : 0, transform: `translate(-50%,-50%) scale(${lerp(.85, 1.45, E.outCubic(rp))})` });
        if (P) {
          const on = t >= tPulse + .1, ok = spring(t - (tPulse + .1), .45, 3.5);
          css(q('.shOk'), { opacity: on ? clamp(ok * 3) : 0, transform: `scale(${on ? lerp(1.8, 1, clamp(ok, 0, 1.3)) : 0})` });
        }
        if (label) {
          const on = t >= t0 + .12, lk = spring(t - (t0 + .12), .55, 2.6);
          css(q('.shLabel'), { opacity: on ? clamp(lk * 3) : 0, transform: `translateX(-50%) scale(${lerp(.5, 1, lk)})` });
        }
      },
    };
  };

  // ===== konuşma balonu (alıntı / itiraz): kuyruk ucundan pop ile açılır; strike anında metnin üstü kırmızı çizilir, =====
  // balon solar ve köşesine kırmızı X çarpar.  x,y: sol-üst  size: punto  tail: {side:'bottom'|'top', at: 0..1}  quote: tırnak
  // strike: {t}  out: kuyruğa doğru küçülerek çıkış
  L.bubble = ({ text, x, y, size = 56, t: t0, tail = { side: 'bottom', at: .5 }, quote = true, strike, out = Infinity }) => ({
    html: `<div class="abs c-bubble" style="left:${x}px;top:${y}px;font-size:${size}px;transform-origin:${tail.at * 100}% ${tail.side === 'top' ? '-20%' : '120%'}">
      <div class="bbTail ${tail.side}" style="left:${tail.at * 100}%"></div>
      <div class="bbBox"><span class="bbTxt">${quote ? '“' : ''}${esc(text)}${quote ? '”' : ''}<i class="bbStrike"></i></span></div>
      ${strike ? `<div class="bbX">${I.x()}</div>` : ''}</div>`,
    render(t, r) {
      const el = r.firstChild, q = s => el.querySelector(s);
      const k = spring(t - t0, .5, 2.6), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
      const sp = strike ? E.outCubic(prog(t, strike.t, strike.t + .24)) : 0;
      css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0,
        transform: `scale(${t >= t0 ? lerp(.2, 1, k) * (1 - .5 * o) : 0}) rotate(${lerp(-6, 0, clamp(k, 0, 1)) - 2.5 * sp}deg)` });
      q('.bbStrike').style.transform = `scaleX(${sp})`;
      q('.bbTxt').style.color = `rgb(${lerp(17, 120, sp)},${lerp(24, 134, sp)},${lerp(39, 150, sp)})`;
      if (strike) {
        const on = t >= strike.t + .15, xk = spring(t - (strike.t + .15), .42, 3.5);
        css(q('.bbX'), { opacity: on ? clamp(xk * 4) : 0, transform: `scale(${on ? lerp(2, 1, clamp(xk, 0, 1.3)) : 0}) rotate(${on ? lerp(-30, 0, clamp(xk, 0, 1)) : 0}deg)` });
      }
    },
  });

  // ===== büyük tutar kartı (ör. '3.973 TL'): damga gibi çarpar (2.4x -> 1x, 0.1 s + sekme); count verilirse rakam sayar =====
  // value: metin  count: {from, to, dur, decimals}  unit  label: alt hap (tLabel'de)  x,y: merkez  size  rot  color  out: içe küçülerek
  L.figure = ({ value = '', count, unit = '', label = '', t: t0, tLabel, x = 540, y = 400, size = 150, rot = -3, color = 'var(--red)', out = Infinity }) => ({
    html: `<div class="abs c-fig" style="left:${x}px;top:${y}px"><div class="fgCard">
      <div class="fgNum" style="font-size:${size}px;color:${color}"><span class="fgVal">${esc(count ? fmtNum(count.to, count.decimals) : value)}</span>${unit ? `<span class="fgUnit">${esc(unit)}</span>` : ''}</div>
      ${label ? `<div class="fgLbl" style="font-size:${Math.round(size * .29)}px">${esc(label)}</div>` : ''}</div></div>`,
    render(t, r) {
      const el = r.firstChild, on = t >= t0;
      const sk = on ? E.outCubic(prog(t, t0, t0 + .1)) : 0, o = isFinite(out) ? E.inExpo(prog(t, out - .16, out)) : 0;
      const ss = on ? lerp(2.4, 1, sk) * (1 + .06 * (1 - clamp(spring(t - (t0 + .1), .4, 4), 0, 1.5))) : 0;
      css(el, { opacity: on ? clamp(sk * 1.5) * (1 - o) : 0, transform: `translate(-50%,-50%) scale(${ss * (1 - .5 * o)}) rotate(${rot}deg)` });
      if (count) el.querySelector('.fgVal').textContent = fmtNum(lerp(count.from ?? 0, count.to, E.outCubic(prog(t, t0, t0 + (count.dur ?? .8)))), count.decimals);
      if (label) {
        const tl = tLabel ?? t0 + .2, lk = spring(t - tl, .55, 2.8);
        css(el.querySelector('.fgLbl'), { opacity: t >= tl ? clamp(lk * 3) : 0, transform: `scale(${t >= tl ? lerp(.6, 1, lk) : .6})` });
      }
    },
  });

  // ===== gösterge (ör. risk): yarım daire kadran yeşil -> sarı -> kırmızı; ibre girişte from'a tırmanır, tMove'da to'ya yay ile döner =====
  // x,y: ibre merkezi (pivot)  r: yarıçap  from,to: 0 (sol, düşük) .. 1 (sağ, yüksek)  t: giriş  tMove  label: pivot altı  out
  L.gauge = ({ x = 540, y = 640, r = 250, from = .85, to = .12, t: t0, tMove = Infinity, label = '', out = Infinity }) => {
    const sw = r * .2, R = r - sw / 2, W = 2 * r + 20, cy = r + 10, cx = W / 2;
    const pt = a => [cx + R * Math.cos(Math.PI * (1 - a)), cy - R * Math.sin(Math.PI * (1 - a))];
    const arc = (a, b, c) => { const [x0, y0] = pt(a), [x1, y1] = pt(b);
      return `<path class="gArc" d="M${x0.toFixed(1)} ${y0.toFixed(1)}A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${c}" stroke-width="${sw}" fill="none" pathLength="100" stroke-dasharray="100"/>`; };
    const zc = v => v > .66 ? 'var(--red)' : v > .33 ? 'var(--yellow)' : 'var(--green)';
    return {
      html: `<div class="abs c-gauge" style="left:${x - cx}px;top:${y - cy}px;width:${W}px;transform-origin:${cx}px ${cy}px">
        <svg width="${W}" height="${cy + 30}" viewBox="0 0 ${W} ${cy + 30}" style="overflow:visible">${arc(0, .325, '#1FB766')}${arc(.338, .662, '#FFD23F')}${arc(.675, 1, '#E5383B')}
          <g class="gNeedle"><path d="M${cx - 13} ${cy}L${cx} ${cy - R * .86}L${cx + 13} ${cy}z" fill="#fff" stroke="#0B1F33" stroke-width="3" stroke-linejoin="round"/></g>
          <circle cx="${cx}" cy="${cy}" r="${r * .09}" fill="#fff" stroke="#0B1F33" stroke-width="4"/></svg>
        ${label ? `<div class="gLabel" style="top:${cy + r * .14}px;font-size:${Math.round(r * .19)}px">${esc(label)}</div>` : ''}</div>`,
      render(t, rt) {
        const el = rt.firstChild, k = spring(t - t0, .6, 2.2), o = isFinite(out) ? E.inExpo(prog(t, out - .22, out)) : 0;
        css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0, transform: `scale(${t >= t0 ? lerp(.6, 1, k) * (1 - .4 * o) : 0})` });
        el.querySelectorAll('.gArc').forEach((p, i) => { p.style.strokeDashoffset = 100 - 100 * E.outCubic(prog(t, t0 + .05 + i * .08, t0 + .4 + i * .08)); });
        const v0 = from * clamp(spring(t - (t0 + .15), .5, 2.2), 0, 1.15);
        const v = clamp(lerp(v0, to, spring(t - tMove, .42, 1.5)), -.03, 1.03);
        el.querySelector('.gNeedle').setAttribute('transform', `rotate(${(lerp(-90, 90, v)).toFixed(2)} ${cx} ${cy})`);
        if (label) el.querySelector('.gLabel').style.color = zc(v);
      },
    };
  };

  // ===================== v5 bileşenleri: kinetik başlık, kurgu zaman çizelgesi, kod penceresi, akış şeması, =====================
  // ajan figürü, bina (temel + katlar), çip listesi, klasör, "yazıyor" balonu. Yalnızca yeni adlar eklenir; mevcut bileşen,
  // ikon ve stiller değişmez (mevcut varsayılanlar korunur).
  I.code = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M18 15L5 28l13 13M38 15l13 13-13 13" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 9l-8 38" stroke="${c}" stroke-width="5.5" stroke-linecap="round"/></svg>`;
  I.puzzle = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M9 19h9.5a5.5 5.5 0 1 1 11 0H40v9.5a5.5 5.5 0 1 1 0 11V49H9z" fill="${c}"/></svg>`;
  I.layers = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M28 7l22 11-22 11L6 18z" fill="${c}"/><path d="M8 28l20 10 20-10M8 38l20 10 20-10" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  I.folder = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M5 15a4 4 0 0 1 4-4h12l5 6h21a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="${c}"/></svg>`;
  I.book = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M26 15C20 10 12 10 5 12v31c7-2 15-2 21 3zM30 15c6-5 14-5 21-3v31c-7-2-15-2-21 3z" fill="${c}"/></svg>`;
  I.list = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="10" cy="15" r="4.5" fill="${c}"/><circle cx="10" cy="28" r="4.5" fill="${c}"/><circle cx="10" cy="41" r="4.5" fill="${c}"/><rect x="20" y="12" width="30" height="6" rx="3" fill="${c}"/><rect x="20" y="25" width="30" height="6" rx="3" fill="${c}"/><rect x="20" y="38" width="22" height="6" rx="3" fill="${c}"/></svg>`;
  I.megaphone = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M6 22h9l22-12v35L15 33H6z" fill="${c}"/><path d="M15 33l4 13h7l-3-13" fill="${c}"/><path d="M43 20a9 9 0 0 1 0 15" stroke="${c}" stroke-width="4.5" fill="none" stroke-linecap="round"/></svg>`;
  I.eye = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M4 28C10 17 18 12 28 12s18 5 24 16c-6 11-14 16-24 16S10 39 4 28z" fill="none" stroke="${c}" stroke-width="5" stroke-linejoin="round"/><circle cx="28" cy="28" r="9.5" fill="${c}"/></svg>`;
  I.commit = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M3 28h13M40 28h13" stroke="${c}" stroke-width="5.5" stroke-linecap="round"/><circle cx="28" cy="28" r="10.5" fill="none" stroke="${c}" stroke-width="5.5"/></svg>`;
  I.rocket = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M28 4c9 6 13 16 11 30H17C15 20 19 10 28 4z" fill="${c}"/><path d="M17 25l-7 9v8l9-5zM39 25l7 9v8l-9-5z" fill="${c}"/><path d="M22 38h12l-6 13z" fill="#FFD23F"/></svg>`;
  I.gear = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="17" fill="none" stroke="${c}" stroke-width="8" stroke-dasharray="6.68 6.67"/><circle cx="28" cy="28" r="12" fill="none" stroke="${c}" stroke-width="6.5"/></svg>`;
  I.question = (c = '#0B1F33') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M18 19a10 10 0 1 1 14 9.2c-3 1.6-4 3.4-4 7.3" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="28" cy="46" r="4.6" fill="${c}"/></svg>`;
  I.target = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="21" fill="none" stroke="${c}" stroke-width="5"/><circle cx="28" cy="28" r="12" fill="none" stroke="${c}" stroke-width="5"/><circle cx="28" cy="28" r="4.5" fill="${c}"/></svg>`;
  I.scope = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M6 18V8h10M40 8h10v10M50 38v10H40M16 48H6V38" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="17" y="19" width="22" height="18" rx="4" fill="${c}"/></svg>`;
  I.flask = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M20 6h16M24 6v15L11 44a4 4 0 0 0 3.5 6h27a4 4 0 0 0 3.5-6L32 21V6" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.5 36h23l5.5 9.5a3 3 0 0 1-2.6 4.5H13.6a3 3 0 0 1-2.6-4.5z" fill="${c}"/></svg>`;
  I.trend = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M6 43l14-14 9 9 20-21" stroke="${c}" stroke-width="6.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M35 15h15v15" stroke="${c}" stroke-width="6.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  I.burst = (c = '#0B1F33') => `<svg width="44" height="44" viewBox="0 0 44 44"><path d="M22 4v36M6.4 13l31.2 18M6.4 31l31.2-18" stroke="${c}" stroke-width="6.5" stroke-linecap="round"/></svg>`;
  I.sparkles = (c = '#0B1F33') => `<svg width="44" height="44" viewBox="0 0 44 44"><path d="M18 5l3.6 11.4L33 20l-11.4 3.6L18 35l-3.6-11.4L3 20l11.4-3.6z" fill="${c}"/><path d="M34 27l1.9 5.1L41 34l-5.1 1.9L34 41l-1.9-5.1L27 34l5.1-1.9z" fill="${c}"/></svg>`;
  const rng = seed => { let s = Math.max(1, Math.floor(seed) % 2147483647); return () => (s = s * 16807 % 2147483647, (s - 1) / 2147483646); };   // tohumlu

  // ===== kinetik başlık (kanca): satırlar kelime kelime kurulur; vurgu satırı kendi anında renk + ölçekle çarpar =====
  // lines: [['Kurgusu','da'], ['yapay zekâ']]  sizes: satır puntoları (dizi ya da tek sayı)  top: ilk satırın üstü  cx: yatay merkez
  // pre/stagger: kurulum (pre .4 -> t=0'da tüm başlık okunur)  hit: {line, t, color, from} -> o satır baştan beri yerinde (beyaz) durur,
  // t'de renge döner ve 'from' ölçeğinden damga gibi çarpar (sarsıntı + hafif eğim)  gap: satır arası  out: çıkış başlangıcı (yukarı kayıp söner)
  // (L.hook'tan farkı: çip yok, satır vurgusu)
  // t: kurulumun başlangıcı (vars. 0 = kanca; ör. kapanışta başlık geri gelir)  enter: {s, dy} kelime girişi (vars. 1.5x ölçek, 40 px yukarıdan;
  // üst bantta güvenli alan için kapanışta küçült)
  // v12 (isteğe bağlı): hit.words: [kelime sırası (0'dan, tüm satırlar boyunca)] -> satır yerine yalnız bu kelimeler çarpar;
  //   hit.bg: vurgu kelimesinin arkasında renkli kutu (ör. '#E5383B' + color '#fff': haber manşeti); kutu payı t=0'dan vardır (yerleşim sabit, döngü)
  L.headline = ({ lines, sizes = 96, top = 260, cx = 540, gap = 6, pre = .4, stagger = .06, hit, out = Infinity, z = 6, id = 'hook', t: t0 = 0,
    enter = { s: 1.5, dy: 40 } }) => {
    const sz = i => Array.isArray(sizes) ? (sizes[i] ?? sizes[sizes.length - 1]) : sizes;
    const HW = hit && hit.words ? hit.words : null, isHit = (li, k) => HW ? HW.includes(k) : [].concat(hit.line).includes(li);
    let n = 0;
    return {
      id, from: Math.max(0, t0 - pre), to: isFinite(out) ? out + .25 : Infinity, z,
      html: `<div class="c-head" style="left:${cx}px;top:${top}px">${lines.map((ws, li) =>
        `<div class="hlLine" style="font-size:${sz(li)}px;margin-top:${li ? gap : 0}px">${ws.map(w => `<span class="w${hit && hit.bg && isHit(li, n) ? ' hlBox' : ''}" data-l="${li}" data-n="${n++}">${esc(w)}</span>`).join(' ')}</div>`).join('')}</div>`,
      render(t, s) {
        const ho = isFinite(out) ? E.inExpo(prog(t, out, out + .2)) : 0;
        css(s.q('.c-head'), { opacity: 1 - ho, transform: `translate(-50%,${-50 * ho}px)` });
        s.qa('.w').forEach((el, k) => {
          const kk = spring(t - t0 + pre - k * stagger, .5, 2.8);
          let sc = lerp(enter.s, 1, kk), extra = '', col = '';
          const on = hit && isHit(+el.dataset.l, k) && t >= hit.t;           // hit.line: sayı ya da dizi (birden çok satır); hit.words: kelimeler
          if (on) {
            const u = E.outCubic(prog(t, hit.t, hit.t + .12)), b = spring(t - (hit.t + .12), .4, 4);
            const [sx, sy] = shake(t, hit.t + .05, .3, 10, 2);
            sc *= lerp(hit.from ?? 1.5, 1, u) * (1 + .06 * (1 - clamp(b, 0, 1.5)));
            extra = ` translate(${sx}px,${sy}px) rotate(${lerp(-5, -1.5, u)}deg)`; col = hit.color || 'var(--yellow)';
          }
          if (hit && hit.bg && el.classList.contains('hlBox'))
            css(el, { background: on ? hit.bg : 'transparent', webkitTextStroke: on ? '0px' : '', boxShadow: on ? '0 .1em .34em rgba(0,0,0,.4)' : 'none' });
          css(el, { opacity: clamp(kk * 3), color: col, transform: `translateY(${(1 - kk) * -enter.dy}px) scale(${sc})${extra}` });
        });
      },
    };
  };

  // ===== kurgu zaman çizelgesi (süs, yazısız): koyu panel, cetvel, renkli klip blokları + ses dalgası, kayan oynatma imleci =====
  // x,y,w,h  t: giriş (yerinde pop, bloklar soldan sağa dolar)  tracks: klip izi sayısı (+ altta ses izi)  seed: blok dizilişi (aynı tohum = aynı kurgu)
  // play: {a, b, from, to} imleç a..b arasında from->to (0..1, yumuşak)  out: küçülerek çıkış
  // done: "kurgu bitti" anı -> panel kısa parlar ve sekerek durur, imleç sarıya döner
  L.editTimeline = ({ x = 120, y = 450, w = 840, h = 80, t: t0, tracks = 2, seed = 7, play = {}, out = Infinity, done,
    colors = [['#2F6BFF', '#5DB3F0'], ['#FFD23F', '#1FB766', '#F59E7A']] }) => {
    const R = rng(seed), padX = 14, iw = w - 2 * padX, ru = Math.max(6, Math.round(h * .12)), gp = Math.max(4, Math.round(h * .07));
    const au = Math.round(h * .2), th = (h - ru - au - gp * (tracks + 2)) / tracks, clips = [];
    for (let k = 0; k < tracks; k++) {
      const pal = colors[Math.min(k, colors.length - 1)];
      let cx = k ? iw * .04 * R() : 0, j = 0;
      while (cx < iw - 24) {
        const cw = Math.min(iw - cx, iw * (k ? .07 + .12 * R() : .09 + .14 * R()));
        clips.push({ k, x: cx, w: cw, c: pal[(j++ + (k ? Math.floor(R() * 3) : 0)) % pal.length] });
        cx += cw + (k ? iw * (.04 + .12 * R()) : 4);
      }
    }
    const nb = Math.floor(iw / 7), bars = [...Array(nb)].map((_, i) => .25 + .75 * Math.abs(Math.sin(i * .37 + seed) * Math.sin(i * .11 + 1.3 * seed)) * (.6 + .4 * R()));
    const ay = ru + gp * (tracks + 1) + th * tracks;
    const wave = `<svg class="etWave" style="left:${padX}px;top:${ay}px" width="${iw}" height="${au}" viewBox="0 0 ${iw} ${au}">${bars.map((v, i) =>
      `<rect x="${i * 7}" y="${((1 - v) * au / 2).toFixed(1)}" width="4" height="${(v * au).toFixed(1)}" rx="2"/>`).join('')}</svg>`;
    const P = Object.assign({ a: t0, b: t0 + 3, from: .03, to: .97 }, play);
    return {
      html: `<div class="abs c-etl" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
        <div class="etRuler" style="top:${gp}px;height:${ru}px"></div><div class="etPlayed" style="top:${gp}px;height:${ru}px"></div>
        ${clips.map(c => `<i class="etClip" style="left:${(padX + c.x).toFixed(1)}px;top:${(ru + gp * (c.k + 2) + th * c.k).toFixed(1)}px;width:${c.w.toFixed(1)}px;height:${th.toFixed(1)}px;background:${c.c}"></i>`).join('')}
        ${wave}<div class="etHead"></div></div>`,
      render(t, r) {
        const el = r.firstChild, k = spring(t - t0, .62, 2.2), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
        const dn = done != null && t >= done, fl = dn ? 1 - prog(t, done, done + .4) : 0, db = dn ? .05 * (1 - clamp(spring(t - done, .4, 3.5), 0, 1.4)) : 0;
        css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0, transform: `scale(${t >= t0 ? lerp(.9, 1, k) * (1 - .15 * o) * (1 + db) : 0})`,
          borderColor: dn ? `rgba(255,210,63,${(.35 + .65 * fl).toFixed(3)})` : '',
          boxShadow: dn ? `0 16px 40px rgba(0,0,0,.45), 0 0 0 ${(8 * fl).toFixed(1)}px rgba(255,210,63,${(.6 * fl).toFixed(3)})` : '' });
        el.querySelector('.etHead').style.background = dn ? 'var(--yellow)' : '';
        el.querySelectorAll('.etClip').forEach((c, i) => {
          const d = t0 + .08 + .45 * clips[i].x / iw, ck = spring(t - d, .7, 2.6);
          css(c, { opacity: t >= d ? clamp(ck * 3) : 0, transform: `scaleX(${clamp(ck, 0, 1.05)})` });
        });
        css(el.querySelector('.etWave'), { opacity: clamp(prog(t, t0 + .2, t0 + .5)) });
        const pos = lerp(P.from, P.to, E.inOutCubic(prog(t, P.a, P.b)));
        css(el.querySelector('.etHead'), { left: (padX + iw * pos) + 'px', opacity: clamp(prog(t, t0 + .15, t0 + .3)) });
        css(el.querySelector('.etPlayed'), { left: padX + 'px', width: (iw * pos) + 'px', opacity: clamp(prog(t, t0 + .15, t0 + .3)) });
      },
    };
  };

  // ===== kod editörü penceresi (yazısız): koyu tema, satır numaraları, renkli soyut kod satırları sırayla yazılır, imleç yanıp söner =====
  // x,y,w,h  t: giriş (yerinde pop)  lines: satır sayısı  typeA..typeB: yazılma aralığı  seed: satır dizilişi  out: küçülerek çıkış
  L.codeWindow = ({ x, y, w = 640, h = 420, t: t0, lines = 9, typeA, typeB, seed = 3, out = Infinity }) => {
    const R = rng(seed), bar = 58, lh = (h - bar - 36) / lines, ind = 30, G = 12;
    const pal = ['#5DB3F0', '#FFD23F', '#7EE2A8', '#F59E7A', '#C3CEDB', '#8FB4FF'];
    const maxW = w - 84 - 30;
    const rows = [...Array(lines)].map(() => {
      const lv = [0, 1, 1, 2, 2, 1, 0][Math.floor(R() * 7)], n = 1 + Math.floor(R() * 4), segs = [];
      let sum = lv * ind;
      for (let i = 0; i < n; i++) { const sw = Math.round(30 + R() * 120); if (sum + sw > maxW) break; segs.push({ w: sw, c: pal[Math.floor(R() * pal.length)] }); sum += sw + G; }
      if (!segs.length) segs.push({ w: 40, c: pal[0] });
      return { lv, segs, len: lv * ind + segs.reduce((a, s) => a + s.w, 0) + G * (segs.length - 1) };
    });
    const ta = typeA ?? t0 + .3, tb = typeB ?? ta + lines * .3, per = (tb - ta) / lines;
    return {
      html: `<div class="abs c-code" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
        <div class="cdBar" style="height:${bar}px">${dots}<i class="cdTab"></i></div>
        <div class="cdBody" style="top:${bar + 18}px">${rows.map((rw, i) => `<div class="cdRow" style="height:${lh.toFixed(1)}px"><span class="cdNum">${i + 1}</span>
          <span class="cdCode" style="padding-left:${rw.lv * ind}px">${rw.segs.map(s => `<i style="width:${s.w}px;background:${s.c}"></i>`).join('')}</span></div>`).join('')}</div>
        <i class="cdCaret" style="height:${Math.round(lh * .55)}px"></i></div>`,
      render(t, r) {
        const el = r.firstChild, k = spring(t - t0, .62, 2.0), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
        css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0, transform: `scale(${t >= t0 ? lerp(.85, 1, k) * (1 - .15 * o) : 0})` });
        let cur = -1, cp = 0;
        el.querySelectorAll('.cdRow').forEach((row, i) => {
          const p = Math.floor(prog(t, ta + i * per, ta + (i + .8) * per) * 8) / 8;         // parça parça "yazılır"
          css(row.querySelector('.cdCode'), { clipPath: `inset(-20% ${(100 * (1 - p)).toFixed(1)}% -20% 0)` });
          row.querySelector('.cdNum').style.opacity = p > 0 ? 1 : .35;
          if (p > 0) { cur = i; cp = p; }
        });
        const c = el.querySelector('.cdCaret'), i = Math.max(0, cur), rw = rows[i], typing = t >= ta && t < tb;
        css(c, { left: (84 + rw.lv * ind + rw.len * (cur < 0 ? 0 : cp) + 6) + 'px', top: (bar + 18 + lh * i + lh * .22) + 'px',
          opacity: t >= t0 + .2 && (typing || Math.floor(t * 3) % 2 === 0) ? 1 : 0 });
      },
    };
  };

  // ===== akış şeması / pipeline: düğümler (ikon ya da kısa yazı + etiket) çizgilerle bağlanır, kelimesinde yanar, üzerinden jeton akar =====
  // nodes: [{x, y (merkez), icon | text, label, tLabel, t (pop), ghost (t'den önce kesik çizgili boş yer), on (renklenir), color,
  //          check (yeşil tik), size, shape:'round'|'circle'|'hex', anim:'spin'|'lift', ink (yanınca ikon/yazı rengi, vars. beyaz)}]
  // links: [{from, to, t, dur, curve (px, yay)}]  tokens: [{a, b, path:[düğüm indeksleri]}] (her ara kendi içinde yumuşak; düğümde durur)
  // size: varsayılan düğüm boyu  labelSize  color: yanınca dolgu  out: hepsi küçülerek söner
  // Bağlantı SVG'si yalnızca çizimleri kapsar (tam sahne SVG'si güvenli alan denetimini bozar).
  // ring (isteğe bağlı, v11): yanma halkasının en büyük ölçeği (vars. 1.45; düğümde n.ring ile ayrı) -> büyük düğüm kenara yakınsa halka güvenli alanı aşmasın
  // ghostStrong (isteğe bağlı, v11): true -> kesik çizgili boş yerler daha belirgin (kalın, açık, hafif dolgulu)
  // linkWidth (isteğe bağlı, v12): bağlantı çizgisi kalınlığı (px, vars. CSS 6); ok ucu orantılı büyür
  L.flow = ({ nodes = [], links = [], tokens = [], size = 140, labelSize, color = 'var(--blue)', out = Infinity, ring, ghostStrong = false, linkWidth }) => {
    const S = n => n.size ?? size, lk = linkWidth ? linkWidth / 6 : 1, A1 = 10 * lk, A2 = 12 * lk;
    const geo = links.map(l => {
      const A = nodes[l.from], B = nodes[l.to], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, cv = l.curve || 0;
      const p0 = [A.x + ux * (S(A) / 2 + 8), A.y + uy * (S(A) / 2 + 8)], p2 = [B.x - ux * (S(B) / 2 + 14), B.y - uy * (S(B) / 2 + 14)];
      const p1 = [(p0[0] + p2[0]) / 2 - uy * cv, (p0[1] + p2[1]) / 2 + ux * cv];
      const tx = p2[0] - p1[0], ty = p2[1] - p1[1], tl = Math.hypot(tx, ty) || 1;
      return { l, p0, p1, p2, ax: tx / tl, ay: ty / tl, apex: [(p0[0] + 2 * p1[0] + p2[0]) / 4, (p0[1] + 2 * p1[1] + p2[1]) / 4] };
    });
    const pts = geo.flatMap(g => [g.p0, g.p2, g.apex]).concat(nodes.map(n => [n.x, n.y]));
    const PAD = 22, bx = Math.min(...pts.map(p => p[0])) - PAD, by = Math.min(...pts.map(p => p[1])) - PAD;
    const bw = Math.max(...pts.map(p => p[0])) + PAD - bx, bh = Math.max(...pts.map(p => p[1])) + PAD - by;
    const L2 = (p, q = [0, 0]) => `${(p[0] - bx + q[0]).toFixed(1)} ${(p[1] - by + q[1]).toFixed(1)}`;
    const arrow = g => { const nx = -g.ay, ny = g.ax;
      return `M${L2(g.p2, [g.ax * A1, g.ay * A1])}L${L2(g.p2, [-g.ax * A1 + nx * A2, -g.ay * A1 + ny * A2])}L${L2(g.p2, [-g.ax * A1 - nx * A2, -g.ay * A1 - ny * A2])}z`; };
    const bez = (g, u) => [0, 1].map(i => (1 - u) * (1 - u) * g.p0[i] + 2 * (1 - u) * u * g.p1[i] + u * u * g.p2[i]);
    const seg = (i, j) => { const g = geo.find(g => g.l.from === i && g.l.to === j); if (g) return u => bez(g, u);
      const h = geo.find(g => g.l.from === j && g.l.to === i); if (h) return u => bez(h, 1 - u);
      return u => [lerp(nodes[i].x, nodes[j].x, u), lerp(nodes[i].y, nodes[j].y, u)]; };
    const svg = geo.length || tokens.length ? `<svg class="fLinks" style="left:${bx}px;top:${by}px" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" viewBox="0 0 ${bw.toFixed(0)} ${bh.toFixed(0)}">
      ${geo.map(g => `<path class="fLn"${linkWidth ? ` style="stroke-width:${linkWidth}px"` : ''} d="M${L2(g.p0)}Q${L2(g.p1)} ${L2(g.p2)}" pathLength="100" stroke-dasharray="100"/><path class="fAr" d="${arrow(g)}"/>`).join('')}
      ${tokens.map(tk => `<circle class="fTok"${tk.icon ? ' style="display:none"' : ''} r="11"/>`).join('')}</svg>` : '';
    // v12 (isteğe bağlı): ikonlu jeton (ör. zarf: 'bilgilendirdik') -> tokens: [{a, b, path, icon, size (px, vars. 84), bg, ink}]
    const itok = tokens.map((tk, i) => tk.icon ? `<div class="fTokI" data-i="${i}" style="width:${tk.size ?? 84}px;height:${tk.size ?? 84}px;background:${tk.bg || 'var(--yellow)'}">${I[tk.icon](tk.ink || '#0B1F33')}</div>` : '').join('');
    const node = n => { const s = S(n), sh = n.shape || 'round', ls = n.labelSize ?? labelSize ?? Math.round(s * .26);
      return `<div class="fNode" style="left:${n.x - s / 2}px;top:${n.y - s / 2}px;width:${s}px;height:${s}px">
        ${n.ghost != null ? `<div class="fGhost ${sh}${ghostStrong ? ' strong' : ''}"></div>` : ''}<div class="fRing ${sh}"></div>
        <div class="fBox ${sh}">${n.text != null ? `<span class="fTx" style="font-size:${Math.round(s * .3)}px">${esc(n.text)}</span>`
          : `<span class="fIc fIcD">${I[n.icon]('#0B3568')}</span><span class="fIc fIcL">${I[n.icon](n.ink || '#fff')}</span>`}</div>
        ${n.check != null ? `<div class="fOk">${I.check()}</div>` : ''}
        ${n.label ? `<div class="fLbl" style="font-size:${ls}px">${esc(n.label)}</div>` : ''}</div>`; };
    return {
      html: `<div class="abs c-flow">${svg}${nodes.map(node).join('')}${itok}</div>`,
      render(t, r) {
        const el = r.firstChild, o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
        css(el, { opacity: 1 - o, transform: `scale(${1 - .12 * o})`, transformOrigin: `${bx + bw / 2}px ${by + bh / 2}px` });
        el.querySelectorAll('.fLn').forEach((p, i) => {
          const g = geo[i], d = g.l.dur ?? .35, u = E.outCubic(prog(t, g.l.t, g.l.t + d));
          p.style.strokeDashoffset = 100 - 100 * u; p.style.opacity = t >= g.l.t ? 1 : 0;
          el.querySelectorAll('.fAr')[i].style.opacity = u > .85 ? 1 : 0;
        });
        el.querySelectorAll('.fTok').forEach((c, i) => {
          const tk = tokens[i], m = tk.path.length - 1, q = clamp((t - tk.a) / (tk.b - tk.a)) * m, sI = Math.min(m - 1, Math.floor(q)), u = E.inOutCubic(q - sI);
          const [px, py] = seg(tk.path[sI], tk.path[sI + 1])(u), on = t >= tk.a && t <= tk.b;
          c.setAttribute('cx', (px - bx).toFixed(1)); c.setAttribute('cy', (py - by).toFixed(1));
          c.style.opacity = on ? clamp(u * 10) * clamp((1 - u) * 10) : 0;
          if (tk.icon) { const d = el.querySelector(`.fTokI[data-i="${i}"]`), sz = tk.size ?? 84, v = on ? clamp(q * 8) * clamp((m - q) * 8) : 0;
            css(d, { left: (px - sz / 2).toFixed(1) + 'px', top: (py - sz / 2).toFixed(1) + 'px', opacity: v.toFixed(3), transform: `scale(${lerp(.4, 1, v).toFixed(4)})` }); }
        });
        el.querySelectorAll('.fNode').forEach((ne, i) => {
          const n = nodes[i], q = s => ne.querySelector(s), k = spring(t - n.t, .5, 2.8), shown = t >= n.t;
          if (n.ghost != null) css(q('.fGhost'), { opacity: t >= n.ghost ? clamp(spring(t - n.ghost, .7, 2.4) * 2) * (shown ? 1 - clamp(k * 3) : 1) : 0 });
          const lit = n.on != null && t >= n.on, pk = lit ? spring(t - n.on, .45, 3.2) : 0;
          css(q('.fBox'), { opacity: shown ? clamp(k * 3) : 0, background: lit ? (n.color || color) : '#fff',
            transform: `scale(${shown ? lerp(.3, 1, k) * (1 + (lit ? .16 * (1 - clamp(pk, 0, 1.3)) : 0)) : 0})` });
          if (n.text == null) {
            css(q('.fIcD'), { opacity: lit ? 0 : 1 }); css(q('.fIcL'), { opacity: lit ? 1 : 0 });
            const an = lit && n.anim === 'spin' ? `rotate(${(300 * E.outCubic(prog(t, n.on, n.on + 1.4))).toFixed(1)}deg)`
              : lit && n.anim === 'lift' ? `translateY(${(-.08 * S(n) * clamp(spring(t - n.on, .45, 2.6), 0, 1.3)).toFixed(1)}px)` : 'none';
            q('.fIcL').style.transform = an;
          } else q('.fTx').style.color = lit ? (n.ink || '#fff') : '';
          const rp = lit ? prog(t, n.on, n.on + .6) : 0;
          css(q('.fRing'), { opacity: rp > 0 && rp < 1 ? .9 * (1 - rp) : 0, transform: `scale(${lerp(1, n.ring ?? ring ?? 1.45, E.outCubic(rp))})` });
          if (n.check != null) { const on = t >= n.check, ck = spring(t - n.check, .45, 3.5);
            css(q('.fOk'), { opacity: on ? clamp(ck * 3) : 0, transform: `scale(${on ? lerp(1.8, 1, clamp(ck, 0, 1.3)) : 0})` }); }
          if (n.label) { const tl = n.tLabel ?? n.t, on = t >= tl, lk = spring(t - tl, .55, 2.6);
            css(q('.fLbl'), { opacity: on ? clamp(lk * 3) : 0, transform: `translateX(-50%) scale(${on ? lerp(.5, 1, lk) : .5})` }); }
        });
      },
    };
  };

  // ===== ajan figürü (subagent / uzman): yuvarlak hatlı robot silüeti; grow.t'de küçükten büyür; göğsüne ikon rozeti çarpar =====
  // x,y: merkez  size: genişlik (yükseklik 1.2x)  t: giriş  color: gövde  grow: {t, from}  badge: {icon, t}  label: {text, t}  out
  L.agent = ({ x, y, size = 160, t: t0, color = 'var(--sky)', grow, badge, label, out = Infinity }) => {
    const h = size * 1.2;
    return {
      html: `<div class="abs c-agent" style="left:${x - size / 2}px;top:${y - h / 2}px;width:${size}px;height:${h}px">
        <svg viewBox="0 0 100 120" width="${size}" height="${h}"><path d="M50 6v12" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="6" r="5.5" fill="#FFD23F" stroke="#fff" stroke-width="2"/>
          <rect x="8" y="74" width="12" height="30" rx="6" style="fill:${color}" stroke="#fff" stroke-width="3"/><rect x="80" y="74" width="12" height="30" rx="6" style="fill:${color}" stroke="#fff" stroke-width="3"/>
          <rect x="40" y="60" width="20" height="10" rx="3" fill="#fff"/><rect x="21" y="67" width="58" height="49" rx="16" style="fill:${color}" stroke="#fff" stroke-width="4"/>
          <rect x="16" y="18" width="68" height="46" rx="18" style="fill:${color}" stroke="#fff" stroke-width="4"/><rect x="25" y="28" width="50" height="26" rx="12" fill="#0B1F33"/>
          <ellipse class="agEye" cx="40" cy="41" rx="5" ry="5" fill="#fff"/><ellipse class="agEye" cx="60" cy="41" rx="5" ry="5" fill="#fff"/></svg>
        ${badge ? `<div class="agBadge" style="left:${size * .56}px;top:${h * .6}px;width:${size * .4}px;height:${size * .4}px">${I[badge.icon]('#0B3568')}</div>` : ''}
        ${label ? `<div class="agLbl" style="font-size:${Math.round(size * .17)}px">${esc(label.text)}</div>` : ''}</div>`,
      render(t, r) {
        const el = r.firstChild, k = spring(t - t0, .5, 2.8), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
        const g = grow ? lerp(grow.from ?? .55, 1, clamp(spring(t - grow.t, .55, 2.4), 0, 1.15)) : 1;
        css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0, transform: `scale(${t >= t0 ? lerp(.3, 1, k) * g * (1 - .4 * o) : 0})` });
        const bl = t > t0 + .6 && ((t - t0) % 2.7) < .12;                                   // ara sıra göz kırpar (t'nin saf fonksiyonu)
        el.querySelectorAll('.agEye').forEach(e => e.setAttribute('ry', bl ? 1 : 5));
        if (badge) { const on = t >= badge.t, bk = spring(t - badge.t, .45, 3.4);
          css(el.querySelector('.agBadge'), { opacity: on ? clamp(bk * 3) : 0, transform: `scale(${on ? lerp(2, 1, clamp(bk, 0, 1.3)) : 0}) rotate(${on ? lerp(-25, 0, clamp(bk)) : 0}deg)` }); }
        if (label) { const on = t >= label.t, lk = spring(t - label.t, .55, 2.6);
          css(el.querySelector('.agLbl'), { opacity: on ? clamp(lk * 3) : 0, transform: `translateX(-50%) scale(${on ? lerp(.5, 1, lk) : .5})` }); }
      },
    };
  };

  // ===== bina (temel + katlar): kesik çizgili taslak belirir, temel blokları sırayla oturur, temel tamamlanınca yeşil tik, katlar alttan yükselir =====
  // x: merkez  y: zemin çizgisi  cols  bw, bh: temel bloğu  gap  floorH  ghost: taslak zamanı  base: [blok zamanları]  floors: [kat zamanları]
  // done: {t} temel tamam (tik)  out
  L.building = ({ x = 540, y = 720, cols = 3, bw = 160, bh = 66, gap = 10, floorH = 74, ghost, base = [], floors = [], done, out = Infinity }) => {
    const W = cols * bw + (cols - 1) * gap, H = bh + floors.length * (floorH + gap), FL = floors.length;
    return {
      html: `<div class="abs c-bld" style="left:${x - W / 2}px;top:${y - H}px;width:${W}px;height:${H}px">
        <div class="bdGhost"></div><div class="bdGround" style="left:-40px;right:-40px;top:${H + 6}px"></div>
        ${[...Array(FL)].map((_, j) => `<div class="bdFl" style="top:${H - bh - (j + 1) * (floorH + gap)}px;height:${floorH}px">${[...Array(cols * 2)].map(() => '<i></i>').join('')}</div>`).join('')}
        ${base.map((_, i) => `<div class="bdBlk" style="left:${i * (bw + gap)}px;top:${H - bh}px;width:${bw}px;height:${bh}px"></div>`).join('')}
        ${done ? `<div class="bdOk" style="left:${W + 22}px;top:${H - bh / 2 - 34}px">${I.check()}</div>` : ''}</div>`,
      render(t, r) {
        const el = r.firstChild, q = s => el.querySelector(s), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
        const g0 = ghost ?? (base[0] ?? 0);
        css(el, { opacity: t >= g0 ? 1 - o : 0 });
        const gk = spring(t - g0, .7, 2.2);
        css(q('.bdGhost'), { opacity: t >= g0 ? clamp(gk * 2) * .9 : 0, transform: `scale(${lerp(.94, 1, clamp(gk))})` });
        css(q('.bdGround'), { opacity: t >= g0 ? clamp(gk * 2) : 0, transform: `scaleX(${clamp(gk, 0, 1)})` });
        const ok = done && t >= done.t, dk = done ? spring(t - done.t, .45, 3.4) : 0;
        el.querySelectorAll('.bdBlk').forEach((b, i) => {
          const tb = base[i], kb = spring(t - tb, .55, 2.4);
          css(b, { opacity: t >= tb ? clamp(kb * 3) : 0, transform: `translateY(${(1 - clamp(kb, 0, 1.2)) * -70}px) scale(${lerp(.85, 1, clamp(kb))})`,
            outline: ok ? '5px solid var(--green)' : 'none', outlineOffset: '-5px' });
        });
        if (done) css(q('.bdOk'), { opacity: ok ? clamp(dk * 3) : 0, transform: `scale(${ok ? lerp(1.9, 1, clamp(dk, 0, 1.3)) : 0})` });
        el.querySelectorAll('.bdFl').forEach((f, j) => {
          const tf = floors[j], kf = spring(t - tf, .6, 2.2);
          css(f, { opacity: t >= tf ? clamp(kf * 3) : 0, transform: `scaleY(${t >= tf ? clamp(kf, 0, 1.08) : 0})` });
          f.querySelectorAll('i').forEach((w, m) => { w.style.background = t >= tf + .25 + ((m * 7 + j * 3) % 5) * .06 && (m + j) % 3 !== 1 ? '#FFD23F' : '#BFD9F2'; });
        });
      },
    };
  };

  // ===== çip listesi: dikey yığın; her çip (ikon dairesi + kısa etiket) kendi anında yerinde pop'lar; ghost'ta kesik çizgili boş yerler; =====
  // tik zamanında ikon dairesi yeşil tike döner.  x,y: sol-üst (anchor:'center' -> x yatay merkez)  items: [{text, icon, t, check}]
  // size: punto (çip yüksekliği 2x)  gap  ghost + ghostW: boş yer zamanı/genişliği  check: {t, stagger} (ya da item.check)  iconBg  out
  L.chips = ({ x, y, items = [], size = 42, gap = 18, anchor = 'left', ghost, ghostW, check, iconBg = 'var(--brand)', out = Infinity }) => {
    const h = Math.round(size * 2), ic = Math.round(size * 1.5), m = (h - ic) / 2;
    const tc = (it, i) => it.check ?? (check ? check.t + i * (check.stagger ?? .12) : null);
    return {
      html: `<div class="abs c-chips ${anchor}" style="left:${x}px;top:${y}px">${items.map((it, i) => `<div class="chRow" style="top:${i * (h + gap)}px;height:${h}px">
        ${ghost != null ? `<div class="chGhost" style="width:${ghostW || size * 7}px;height:${h}px"></div>` : ''}
        <div class="chChip" style="height:${h}px;font-size:${size}px;padding:0 ${Math.round(size * .75)}px 0 ${m}px;gap:${Math.round(size * .38)}px">
          <span class="chIc" style="width:${ic}px;height:${ic}px;background:${iconBg}">${it.icon ? I[it.icon]('#fff') : ''}</span>
          ${tc(it, i) != null ? `<span class="chOk" style="left:${m}px;top:${m}px;width:${ic}px;height:${ic}px">${I.check()}</span>` : ''}
          <span class="chTx">${esc(it.text)}</span></div></div>`).join('')}</div>`,
      render(t, r) {
        const el = r.firstChild, o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
        css(el, { opacity: 1 - o });
        el.querySelectorAll('.chRow').forEach((row, i) => {
          const it = items[i], k = spring(t - it.t, .5, 2.8), shown = t >= it.t;
          css(row.querySelector('.chChip'), { opacity: shown ? clamp(k * 3) : 0, transform: `scale(${shown ? lerp(.4, 1, k) * (1 - .3 * o) : 0})` });
          if (ghost != null) css(row.querySelector('.chGhost'), { opacity: t >= ghost + i * .08 ? clamp(spring(t - ghost - i * .08, .7, 2.4) * 2) * (shown ? 1 - clamp(k * 3) : 1) : 0 });
          const c = tc(it, i);
          if (c != null) { const on = t >= c, ck = spring(t - c, .45, 3.5);
            css(row.querySelector('.chOk'), { opacity: on ? clamp(ck * 3) : 0, transform: `scale(${on ? lerp(1.8, 1, clamp(ck, 0, 1.3)) : 0}) rotate(${on ? lerp(-25, 0, clamp(ck)) : 0}deg)` });
            css(row.querySelector('.chIc'), { opacity: on ? 1 - clamp(ck * 3) : 1 }); }
        });
      },
    };
  };

  // ===== klasör / boş çalışma alanı: sekmeli klasör yerinde açılır, içinde kesik çizgili boş yerler; sekmede etiket; köşede adım numarası =====
  // x,y,w,h  t  label + tLabel (soldan yazılır)  num: {text, t} (sarı daire; klasörden önce gelebilir)  slots: [sütun, satır]  out
  L.folder = ({ x, y, w = 640, h = 460, t: t0, label = '', tLabel, num, slots = [3, 2], out = Infinity }) => {
    const tab = Math.round(h * .13), nd = Math.round(h * .22), tx = num ? Math.round(nd * .85) : 0;   // numara varsa sekme sağa kayar (etiketi örtmez)
    return {
      html: `<div class="abs c-folder" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
        <div class="fdW"><div class="fdTab" style="left:${tx}px;width:${Math.round(w * .46)}px;height:${tab + 30}px"><span style="font-size:${Math.round(tab * .5)}px;margin-top:${Math.round(tab * .26)}px">${esc(label)}</span></div>
          <div class="fdBody" style="top:${tab}px${tx ? ';border-radius:26px' : ''}"><div class="fdGrid" style="grid-template-columns:repeat(${slots[0]},1fr)">${[...Array(slots[0] * slots[1])].map(() => '<i></i>').join('')}</div></div></div>
        ${num ? `<div class="fdNum" style="left:${-nd * .3}px;top:${-nd * .3}px;width:${nd}px;height:${nd}px;font-size:${Math.round(nd * .56)}px">${esc(num.text)}</div>` : ''}</div>`,
      render(t, r) {
        const el = r.firstChild, q = s => el.querySelector(s), k = spring(t - t0, .55, 2.2), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
        css(q('.fdW'), { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0, transform: `scale(${t >= t0 ? lerp(.6, 1, k) * (1 - .2 * o) : 0})` });
        el.querySelectorAll('.fdGrid i').forEach((s, i) => { const sk = spring(t - (t0 + .2 + i * .06), .6, 2.6);
          css(s, { opacity: t >= t0 + .2 + i * .06 ? clamp(sk * 2) : 0, transform: `scale(${lerp(.6, 1, clamp(sk))})` }); });
        const tl = tLabel ?? t0, lp = t >= tl ? E.outCubic(prog(t, tl, tl + .4)) : 0;
        css(q('.fdTab span'), { clipPath: `inset(-20% ${(100 * (1 - lp)).toFixed(1)}% -20% 0)` });
        if (num) { const on = t >= num.t, nk = spring(t - num.t, .5, 3);
          css(q('.fdNum'), { opacity: on ? clamp(nk * 3) * (1 - o) : 0, transform: `scale(${on ? lerp(.2, 1, nk) : 0})` }); }
      },
    };
  };

  // ===== "yazıyor..." balonu (yorum bekleniyor): kuyruk ucundan pop ile açılır, üç nokta sırayla zıplar =====
  // x,y: sol-üst  size: yükseklik (genişlik 2x)  tail: 'left'|'right'  t  out
  L.typingBubble = ({ x, y, size = 110, t: t0, tail = 'left', out = Infinity }) => ({
    html: `<div class="abs c-typing ${tail}" style="left:${x}px;top:${y}px;width:${size * 2}px;height:${size}px;border-radius:${size / 2}px;gap:${Math.round(size * .16)}px">
      <i class="tyTail" style="width:${Math.round(size * .34)}px;height:${Math.round(size * .34)}px"></i>${[0, 1, 2].map(() => `<b style="width:${Math.round(size * .2)}px;height:${Math.round(size * .2)}px"></b>`).join('')}</div>`,
    render(t, r) {
      const el = r.firstChild, k = spring(t - t0, .5, 2.8), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
      css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0, transform: `scale(${t >= t0 ? lerp(.2, 1, k) * (1 - .4 * o) : 0})` });
      el.querySelectorAll('b').forEach((d, i) => {
        const ph = Math.sin((t - t0 - .25) * Math.PI * 2 * 1.4 - i * .9);
        d.style.transform = `translateY(${(t > t0 + .25 ? -Math.max(0, ph) * size * .13 : 0).toFixed(1)}px)`;
        d.style.opacity = t > t0 + .25 ? .45 + .55 * Math.max(0, ph) : .45;
      });
    },
  });

  // ===== monogram (logosu olmayan marka): halkalı daire içinde baş harf(ler); yerinde pop (ör. son kartta adresin üstünde) =====
  // x,y: merkez  size: çap  text: 1-2 harf  t  out
  L.monogram = ({ x, y, size = 160, text = 'A', t: t0, out = Infinity }) => ({
    html: `<div class="abs c-mono" style="left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;padding:${Math.round(size * .045)}px"><div style="font-size:${Math.round(size * .56)}px">${esc(text)}</div></div>`,
    render(t, r) {
      const el = r.firstChild, k = spring(t - t0, .5, 2.8), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
      css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0, transform: `scale(${t >= t0 ? lerp(.3, 1, k) * (1 - .4 * o) : 0})` });
    },
  });

  // işlemci çipi (yapay zekâ için nötr simge; marka logosu çağrıştırmaz)
  I.cpu = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><rect x="13" y="13" width="30" height="30" rx="6" fill="none" stroke="${c}" stroke-width="5"/><rect x="21.5" y="21.5" width="13" height="13" rx="2.5" fill="${c}"/><path d="M21 5v7M28 5v7M35 5v7M21 44v7M28 44v7M35 44v7M5 21h7M5 28h7M5 35h7M44 21h7M44 28h7M44 35h7" stroke="${c}" stroke-width="4" stroke-linecap="round"/></svg>`;

  // ===== adım numarası (1, 2, 3…): sarı daire, beyaz çerçeve; konuşmadaki sıra kelimesinde yerinde pop, küçülerek çıkış =====
  // x,y: merkez  size: çap  text  t  out
  L.stepNum = ({ x, y, size = 110, text, t: t0, out = Infinity }) => ({
    html: `<div class="abs c-step" style="left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;font-size:${Math.round(size * .56)}px">${esc(text)}</div>`,
    render(t, r) {
      const el = r.firstChild, k = spring(t - t0, .5, 3), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
      css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0, transform: `scale(${t >= t0 ? lerp(.2, 1, k) * (1 - .4 * o) : 0})` });
    },
  });

  // ===== dokunma göstergesi (dikey telefon videosu; fare imleci yerine): parmak ucu dairesi belirir, t'de basar, halka yayılır, söner =====
  // x,y: dokunma noktası  size: parmak ucu çapı  t: dokunma anı
  L.touch = ({ x, y, size = 96, t: t0 }) => ({
    html: `<div class="abs c-touch" style="left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px"><i class="tcRing"></i><b class="tcDot"></b></div>`,
    render(t, r) {
      const el = r.firstChild, a = t0 - .3;
      const ink = clamp(prog(t, a, a + .1)) * (1 - prog(t, t0 + .25, t0 + .45));
      const press = t >= t0 - .05 && t < t0 + .2 ? Math.sin(prog(t, t0 - .05, t0 + .2) * Math.PI) : 0;
      css(el.querySelector('.tcDot'), { opacity: ink, transform: `scale(${(lerp(1.3, 1, E.outCubic(prog(t, a, t0 - .05))) * (1 - .2 * press)).toFixed(3)})` });
      const rp = prog(t, t0, t0 + .55);
      css(el.querySelector('.tcRing'), { opacity: rp > 0 && rp < 1 ? .9 * (1 - rp) : 0, transform: `scale(${lerp(.7, 2.1, E.outCubic(rp)).toFixed(3)})` });
    },
  });

  // ===== video sonu donmuş kare (son kart yerine): yüz videosunun son karesi motorun kadrajıyla aynı yerde kalır =====
  // (motor yüzü video sonundan ~0.45 s sonra gizler). t'den itibaren hafif kararma + bulanıklık + çok hafif yakınlaşma; yüz görünür kalır.
  // Kadraj her karede motorun #faceWrap/#face stillerinden kopyalanır (aynı renderAt içinde hesaplanmış; saf t fonksiyonu).
  // t: başlangıç (genelde C.end)  dim: kararma 0..1  blur: px  dur: geçiş  frame: kare no (vars. son kare)
  L.freezeFace = ({ t: t0, dim = .3, blur = 4, dur = .35, frame }) => {
    const n = frame ?? window.TIMELINE.frames, src = `${window.FACE_DIR}${String(n).padStart(4, '0')}.jpg`;
    return {
      html: `<div class="abs c-freeze" data-safe="ignore"><img data-safe="ignore" src="${src}" alt=""></div>`,
      render(t, r) {
        const el = r.firstChild, img = el.firstChild;
        if (t < t0) { el.style.opacity = 0; return; }
        const fs = document.getElementById('faceWrap').style, is = document.getElementById('face').style;
        css(el, { opacity: 1, left: fs.left, top: fs.top, width: fs.width, height: fs.height, borderRadius: fs.borderRadius, transform: fs.transform });
        const k = E.inOutCubic(prog(t, t0, t0 + dur));
        css(img, { width: is.width, height: is.height, transform: `${is.transform} scale(${(1 + .03 * k).toFixed(4)})`,
          filter: `blur(${(blur * k).toFixed(2)}px) brightness(${(1 - dim * k).toFixed(3)})` });
      },
    };
  };

  // ===================== v6 bileşenleri (sakin tempo / 45+ kitle): sakin kanca, cihaz penceresi, logo avatarı, merdiven, =====================
  // yumuşak damga, form CTA'sı, hüküm listesi. Yumuşak yaylar, sarsıntısız vurgu. Yalnızca yeni adlar eklenir; mevcut bileşen, ikon ve stiller
  // değişmez (mevcut varsayılanlar korunur).
  I.bulb = (c = '#0B1F33') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M28 12a12.5 12.5 0 0 0-7.4 22.6c1.2.9 1.9 2.3 1.9 3.8V40h11v-1.6c0-1.5.7-2.9 1.9-3.8A12.5 12.5 0 0 0 28 12z" fill="${c}"/><rect x="22.5" y="42.5" width="11" height="4" rx="2" fill="${c}"/><rect x="24.5" y="48.5" width="7" height="3.5" rx="1.75" fill="${c}"/><path d="M28 2.5v5M11.5 9l3.5 3.5M44.5 9L41 12.5M5 24.5h5M46 24.5h5" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/></svg>`;
  I.play = (c = '#fff') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M19 11.5v33a2.5 2.5 0 0 0 3.8 2.1l26-16.5a2.5 2.5 0 0 0 0-4.2l-26-16.5A2.5 2.5 0 0 0 19 11.5z" fill="${c}"/></svg>`;
  const hexRgb = h => { const m = String(h).replace('#', ''), v = parseInt(m.length === 3 ? m.replace(/./g, c => c + c) : m, 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; };
  const mixRgb = (a, b, u) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], u))).join(',')})`;

  // ===== sakin sahne: L.scene ile aynı, ama çıkış yumuşak (E.inCubic: yavaşça söner ve kayar; L.scene'in inExpo çıkışı son karelerde birden kaybolur) =====
  // exit: {a, b, dy}  (diğer alanlar L.scene ile aynı; shake desteklenmez)
  L.softScene = ({ exit, ...o }) => { const sc = L.scene(o), r0 = sc.render;
    return Object.assign(sc, { render(t, s) { r0(t, s);
      if (exit) { const u = E.inCubic(prog(t, exit.a, exit.b)); css(s.el, { transform: `translate(0px,${(-(exit.dy ?? 0) * u).toFixed(2)}px)`, opacity: 1 - u }); } } }); };

  // ===== sakin kanca (çip + satırlar): t0'da tamamen yerinde (pre büyük -> t=0'da okunur, döngü için ilk kare = son hâl); =====
  // vurgu satırı hit.t'de yumuşakça renge döner ve hafifçe büyür (sarsıntı / eğim yok); çıkış yumuşak (yukarı kayarak söner).
  // t ile sonradan da kurulur (döngü kapanışı: aynı top/cx/sizes -> aynı yer ve boyut).
  // chip, chipSize, chipGap (çip-başlık arası)  lines: [['Yazılım','bilmeden'],['hayata','geçirin']]  sizes: satır puntoları  top: bloğun üstü  cx: merkez
  // gap: satır arası  hit: {line, t, color (hex), grow (kalıcı ölçek, vars. 1.05), pulse (geçici ek, vars. .05), dur (renk geçişi, vars. .45),
  //      off + offDur (isteğe bağlı: renk ve ölçek beyaza / 1x'e döner; döngü kapanışında son kare = ilk kare),
  //      words (isteğe bağlı, v11: [kelime sırası, 0'dan, tüm satırlar boyunca] -> satır yerine yalnız bu kelimeler renge döner ve büyür)}
  // pre (vars. .8)  stagger  enter: {s, dy} kelime girişi  out + outDur: çıkış  id  z
  L.softHook = ({ chip, chipSize = 40, chipGap = 14, lines, sizes = 88, top = 254, cx = 540, gap = 2, hit, pre = .8, stagger = .06,
    enter = { s: 1.2, dy: 24 }, out = Infinity, outDur = .4, id = 'hook', z = 6, t: t0 = 0 }) => {
    const sz = i => Array.isArray(sizes) ? (sizes[i] ?? sizes[sizes.length - 1]) : sizes;
    const HC = hexRgb(hit && hit.color || '#FFD23F'), WH = [255, 255, 255];
    let n = 0;
    return {
      id, from: Math.max(0, t0 - pre), to: isFinite(out) ? out + outDur + .05 : Infinity, z,
      html: `<div class="c-shook" style="left:${cx}px;top:${top}px">${chip ? `<div class="shChipW" style="margin-bottom:${chipGap}px"><div class="shChip" style="font-size:${chipSize}px"><i class="shDot"></i><span>${esc(chip)}</span></div></div>` : ''}${lines.map((ws, li) =>
        `<div class="shLine" style="font-size:${sz(li)}px;margin-top:${li ? gap : 0}px">${ws.map(w => `<span class="w" data-n="${n++}">${esc(w)}</span>`).join(' ')}</div>`).join('')}</div>`,
      render(t, s) {
        const ho = isFinite(out) ? E.inCubic(prog(t, out, out + outDur)) : 0;
        css(s.q('.c-shook'), { opacity: 1 - ho, transform: `translate(-50%,${(-36 * ho).toFixed(2)}px)` });
        if (chip) { const ck = spring(t - t0 + pre + .05, .7, 1.8); css(s.q('.shChip'), { opacity: clamp(ck * 3), transform: `scale(${lerp(.8, 1, ck)})` }); }
        const HW = hit && hit.words ? hit.words : null;                       // hit.words (isteğe bağlı): yalnız bu kelimeler (data-n) vurgulanır
        s.qa('.w').forEach((el, k) => {
          const kk = spring(t - t0 + pre - k * stagger, .7, 1.8);
          if (HW) {
            let sc = lerp(enter.s, 1, kk), col = '';
            if (HW.includes(k) && t >= hit.t) {
              const back = hit.off != null ? E.inOutCubic(prog(t, hit.off, hit.off + (hit.offDur ?? .3))) : 0;
              const u = E.inOutCubic(prog(t, hit.t, hit.t + (hit.dur ?? .45))) * (1 - back);
              const g = clamp(spring(t - hit.t, .7, 1.4), 0, 1.1) * (1 - back), pu = Math.sin(Math.PI * prog(t, hit.t, hit.t + .7));
              col = mixRgb(WH, HC, u); sc *= lerp(1, hit.grow ?? 1.05, g) * (1 + (hit.pulse ?? .05) * pu);
            }
            css(el, { opacity: clamp(kk * 3), color: col, transform: `translateY(${((1 - kk) * -enter.dy).toFixed(2)}px) scale(${sc.toFixed(4)})` });
            return;
          }
          css(el, { opacity: clamp(kk * 3), transform: `translateY(${((1 - kk) * -enter.dy).toFixed(2)}px) scale(${lerp(enter.s, 1, kk)})` });
        });
        s.qa('.shLine').forEach((ln, li) => {
          const on = hit && !HW && hit.line === li && t >= hit.t;
          if (!on) { ln.style.color = ''; ln.style.transform = ''; return; }
          const back = hit.off != null ? E.inOutCubic(prog(t, hit.off, hit.off + (hit.offDur ?? .3))) : 0;   // döngü: beyaza / 1x'e döner
          const u = E.inOutCubic(prog(t, hit.t, hit.t + (hit.dur ?? .45))) * (1 - back);
          const g = clamp(spring(t - hit.t, .7, 1.4), 0, 1.1) * (1 - back), pu = Math.sin(Math.PI * prog(t, hit.t, hit.t + .7));
          ln.style.color = mixRgb(WH, HC, u);
          ln.style.transform = `scale(${(lerp(1, hit.grow ?? 1.05, g) * (1 + (hit.pulse ?? .05) * pu)).toFixed(4)})`;
        });
      },
    };
  };

  // ===== cihaz penceresi (yazısız, genel): 'browser' web sitesi · 'phone' mobil uygulama · 'window' masaüstü programı · 'video' ders / oynatıcı kartı =====
  // x,y,w,h  t: yerinde yumuşak pop  build: {a, b} iskelet blokları sırayla dolar (vars. t+.15 .. t+.9; "kuruluyor" hissi)  accent: tema rengi (hex)
  // check: t -> sağ üst köşeye yeşil tik (köşeden ~.3 rozet taşar)  lit: t -> sarı halka yayılır (vurgu; kenardan ~8 px + %5 taşar)
  // play: {a, b} (video: ilerleme çubuğu dolar, oynat düğmesi nabız)  out: küçülerek söner  rot: hafif açı.
  // İçerik yazısızdır (altyazıyı tekrar etmez); ölçüler w/h'ye oranlı. Güvenli alan: kutuyu kenarlardan ~30 px içeride tut.
  const DV = {
    browser: [[5, 7, 13, 9, 'a'], [55, 8.5, 11, 5, 'g'], [69, 8.5, 11, 5, 'g'], [83, 8.5, 11, 5, 'g'], [5, 23, 90, 33, 'l'],
              [11, 31, 46, 7, 'd'], [11, 42, 30, 4.5, 'g'], [62, 28, 26, 23, 'a2'], [5, 63, 27.5, 30, 'c'], [36.25, 63, 27.5, 30, 'c'], [67.5, 63, 27.5, 30, 'c']],
    phone: [[0, 0, 100, 12, 'a'], [8, 17, 56, 4.5, 'd'], [8, 25, 84, 21, 'l'], [8, 51, 14, 7, 'a2c'], [27, 52, 56, 3, 'g'], [27, 56, 38, 2.4, 'g'],
            [8, 63, 14, 7, 'a2c'], [27, 64, 56, 3, 'g'], [27, 68, 38, 2.4, 'g'], [8, 75, 14, 7, 'a2c'], [27, 76, 56, 3, 'g'], [27, 80, 38, 2.4, 'g'], [0, 90, 100, 10, 'n']],
    window: [[0, 0, 24, 100, 'sb'], [4, 8, 16, 5, 'sw'], [4, 17, 14, 4, 'sg'], [4, 25, 15, 4, 'sg'], [4, 33, 12, 4, 'sg'], [29, 7, 20.5, 20, 'l'],
             [52.5, 7, 20.5, 20, 'l'], [76, 7, 20.5, 20, 'l'], [29, 32, 67.5, 61, 'p']],
    video: [[0, 0, 100, 63, 'v'], [6, 70, 62, 6.5, 'd'], [6, 81, 82, 4, 'g'], [6, 89, 56, 4, 'g']],
    // v13 'list': kayıt listesi (müşteri / kişi listesi, CRM): başlık + düğme, satırlarda renkli avatar dairesi + iki gri çizgi + durum hapı
    // ('av': [x, satır merkezi y, genişlik %, -, 'av'] -> yükseklik kutunun en/boy oranından: tam daire)
    list: [[5, 7, 30, 6.5, 'd'], [72, 5.5, 23, 9.5, 'pl'],
      ...[0, 1, 2, 3].flatMap(i => { const y = 22 + i * 19.5;
        return [[4, y, 92, 16, 'c'], [7.5, y + 8, 7.5, 0, 'av'], [18, y + 3.6, 38, 3.8, 'g'], [18, y + 9.6, 24, 3, 'g'], [74, y + 5, 17, 6, 'pl2']]; })],
    // v13 'calendar': rezervasyon takvimi (ay başlığı + iki gezinme hapı, gün başlıkları, 5x7 gün hücresi; dolu günler marka renginde).
    // Bloklar sırayla oturur -> build süresince takvim satır satır "dolar"
    calendar: [[5, 5, 30, 7, 'd'], [74, 5, 9, 7, 'pl2'], [86, 5, 9, 7, 'pl2'], ...[0, 1, 2, 3, 4, 5, 6].map(c => [5 + c * 13.1, 16.5, 9, 3.2, 'g']),
      ...[...Array(35)].map((_, i) => { const r = Math.floor(i / 7), c = i % 7, k = (i * 5 + r * 3) % 9;
        return [5 + c * 13.1, 24 + r * 14.6, 11.6, 12.6, k < 2 ? 'a' : k < 4 ? 'a2' : 'c']; })],
  };
  const AVC = ['#5DB3F0', '#F59E7A', '#1FB766', '#FFD23F'];
  // draft (isteğe bağlı, v11): true -> kesik çizgili taslak (plan hâlinde, dolgusuz çerçeve + boş blok yerleri); L.tone ile griye döndürülebilir
  L.device = ({ kind = 'browser', x, y, w, h, t: t0, build, accent = '#2F6BFF', check, lit, play, out = Infinity, rot = 0, draft = false }) => {
    const bars = kind === 'window' ? [.45, .7, .55, .9, .65, 1] : null, md = Math.min(w, h);
    const bh = kind === 'browser' || kind === 'window' || kind === 'list' || kind === 'calendar' ? Math.round(Math.max(34, h * .11)) : 0;
    const blk = DV[kind] || DV.browser, A = hexRgb(accent), soft = `rgba(${A.join(',')},.16)`, mid = `rgba(${A.join(',')},.55)`;
    const fill = { a: accent, a2: mid, a2c: mid, g: '#DCE3EC', d: '#0B3568', l: soft, c: '#EEF2F7', n: '#EEF2F7', sb: '#0E2236', sw: accent, sg: 'rgba(255,255,255,.28)', p: '#F4F7FB', v: '#0E2236',
      pl: accent, pl2: soft };
    const ck = Math.round(Math.max(56, Math.min(104, md * .2)));
    let avN = 0;                                                             // 'av' (liste avatarı): tam daire, sırayla renkli
    const avBox = (by, bw2) => { const hp = bw2 * w / Math.max(1, h - bh); return [by - hp / 2, hp]; };
    const inner = blk.map(([bx, by0, bw2, bh0, k], i) => { const [by, bh2] = k === 'av' ? avBox(by0, bw2) : [by0, bh0];
      return `<i class="dvB dv-${k}" data-i="${i}" style="left:${bx}%;top:${by}%;width:${bw2}%;height:${bh2}%;background:${k === 'av' ? AVC[avN++ % AVC.length] : fill[k]}">${
      k === 'p' ? `<span class="dvBars">${bars.map(v => `<b style="height:${v * 82}%;background:${accent}"></b>`).join('')}</span>` : ''}${
      k === 'v' ? `<span class="dvPlay" style="width:${Math.round(md * .26)}px;height:${Math.round(md * .26)}px">${I.play('#0B1F33')}</span><span class="dvProg"><b style="background:${accent}"></b></span>` : ''}</i>`; }).join('');
    const bar = bh ? `<div class="dvBar${kind === 'window' ? ' dk' : ''}" style="height:${bh}px">${dots}${kind === 'browser' ? '<i class="dvUrl"></i>' : ''}</div>` : '';
    return {
      html: `<div class="abs c-dev ${kind}${draft ? ' draft' : ''}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;${kind === 'phone' ? `border-radius:${Math.round(w * .14)}px;padding:${Math.round(w * .045)}px` : ''}">
        <div class="dvRing"></div>${bar}<div class="dvScr" style="${bh ? `top:${bh}px;` : ''}${kind === 'phone' ? `border-radius:${Math.round(w * .1)}px` : ''}">${inner}</div>
        ${kind === 'phone' ? `<i class="dvNotch" style="width:${Math.round(w * .3)}px;height:${Math.round(w * .07)}px;top:${Math.round(w * .045)}px"></i>` : ''}
        ${check != null ? `<div class="dvOk" style="width:${ck}px;height:${ck}px;right:${-Math.round(ck * .35)}px;top:${-Math.round(ck * .35)}px">${I.check()}</div>` : ''}</div>`,
      render(t, r) {
        const el = r.firstChild, q = s => el.querySelector(s);
        const k = spring(t - t0, .66, 1.7), o = isFinite(out) ? E.inCubic(prog(t, out - .38, out)) : 0;
        const lp = lit != null && t >= lit ? prog(t, lit, lit + .8) : 0;
        css(el, { opacity: t >= t0 ? clamp(k * 2.5) * (1 - o) : 0,
          transform: `scale(${t >= t0 ? (lerp(.82, 1, k) * (1 - .12 * o) * (1 + .03 * Math.sin(Math.PI * lp))).toFixed(4) : 0}) rotate(${rot}deg)` });
        const ba = build ? build.a : t0 + .15, bb = build ? build.b : t0 + .9, nb = blk.length;
        el.querySelectorAll('.dvB').forEach((b, i) => {
          const ti = ba + (bb - ba) * i / Math.max(1, nb - 1), kb = spring(t - ti, .7, 2);
          css(b, { opacity: t >= ti ? clamp(kb * 2.5) : 0, transform: `scale(${t >= ti ? lerp(.7, 1, clamp(kb, 0, 1.05)).toFixed(4) : .7})` });
        });
        if (bars) el.querySelectorAll('.dvBars b').forEach((b, i) => {
          const tb = bb + .1 + i * .08; b.style.transform = `scaleY(${clamp(spring(t - tb, .7, 1.8), 0, 1.05).toFixed(4)})`; });
        if (kind === 'video') {
          const pa = play ? play.a : Infinity, pb = play ? play.b : Infinity;
          q('.dvProg b').style.transform = `scaleX(${isFinite(pa) ? E.inOutCubic(prog(t, pa, pb)).toFixed(4) : 0})`;
          const pk = isFinite(pa) && t >= pa ? Math.sin(Math.PI * prog(t, pa, pa + .5)) : 0;
          q('.dvPlay').style.transform = `translate(-50%,-50%) scale(${(1 + .12 * pk).toFixed(4)})`;
        }
        css(q('.dvRing'), { opacity: lp > 0 && lp < 1 ? .95 * (1 - lp) : 0, transform: `scale(${lerp(1, 1.05, E.outCubic(lp)).toFixed(4)})` });
        if (check != null) { const on = t >= check, cs = spring(t - check, .6, 2);
          css(q('.dvOk'), { opacity: on ? clamp(cs * 3) : 0, transform: `scale(${on ? lerp(1.35, 1, clamp(cs, 0, 1.2)).toFixed(4) : 0})` }); }
      },
    };
  };

  // ===== logo avatarı: tam daire, görsel object-fit cover (kırpılmadan sığan kare logo), beyaz halka; yerinde yumuşak pop =====
  // src (vars. marka logo.avatar)  x,y: merkez  size: çap  ring: halka rengi  t  out
  L.avatar = ({ src = B.logo && B.logo.avatar, x, y, size = 220, ring = '#fff', t: t0, out = Infinity }) => ({
    html: `<div class="abs c-avatar" style="left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;border-color:${ring};border-width:${Math.max(4, Math.round(size * .03))}px"><img src="${asset(src)}" alt=""></div>`,
    render(t, r) {
      const el = r.firstChild, k = spring(t - t0, .62, 1.7), o = isFinite(out) ? E.inCubic(prog(t, out - .38, out)) : 0;
      css(el, { opacity: t >= t0 ? clamp(k * 2.5) * (1 - o) : 0, transform: `scale(${t >= t0 ? (lerp(.5, 1, k) * (1 - .3 * o)).toFixed(4) : 0})` });
    },
  });

  // ===== merdiven (sıfırdan, adım adım): basamaklar soldan sağa yükselir; numaralar alt hizada; lit zamanlarında sırayla sarıya yanar =====
  // x: sol  y: zemin  w,h  steps  t: kurulum (basamaklar sırayla, yumuşak)  lit: [t..] basamak yanma anları  label: {text, icon, t, size} en alt basamağın üstünde hap
  // gap: basamak arası  out
  L.stairs = ({ x, y, w = 760, h = 400, steps = 3, gap = 14, t: t0, lit = [], label, out = Infinity }) => {
    const sw = (w - gap * (steps - 1)) / steps, nd = Math.round(Math.min(sw * .42, h / steps * .62));
    const lf = label ? (label.size || Math.round(Math.max(40, nd * .62))) : 0;
    return {
      html: `<div class="abs c-stairs" style="left:${x}px;top:${y - h}px;width:${w}px;height:${h}px">${[...Array(steps)].map((_, i) => {
        const sh = h * (i + 1) / steps;
        return `<div class="stB" style="left:${i * (sw + gap)}px;top:${h - sh}px;width:${sw}px;height:${sh}px"><span class="stN" style="width:${nd}px;height:${nd}px;font-size:${Math.round(nd * .56)}px;top:${Math.round(sh - h / steps * .5 - nd / 2)}px">${i + 1}</span></div>`; }).join('')}
        ${label ? `<div class="stLbl" style="left:${Math.round(sw / 2)}px;bottom:${Math.round(h / steps + 18)}px;font-size:${lf}px">${label.icon ? `<span class="stIc">${I[label.icon]('#fff')}</span>` : ''}<span>${esc(label.text)}</span></div>` : ''}
        <div class="stGround" style="top:${h + 4}px"></div></div>`,
      render(t, r) {
        const el = r.firstChild, o = isFinite(out) ? E.inCubic(prog(t, out - .38, out)) : 0;
        css(el, { opacity: t >= t0 ? 1 - o : 0, transform: `scale(${(1 - .1 * o).toFixed(4)})` });
        css(el.querySelector('.stGround'), { opacity: t >= t0 ? clamp(spring(t - t0, .7, 1.8) * 2) : 0, transform: `scaleX(${clamp(spring(t - t0, .7, 1.8), 0, 1).toFixed(4)})` });
        el.querySelectorAll('.stB').forEach((b, i) => {
          const tb = t0 + .1 + i * .2, kb = spring(t - tb, .7, 1.7), tl = lit[i], on = tl != null && t >= tl, lk = on ? spring(t - tl, .6, 2) : 0;
          css(b, { opacity: t >= tb ? clamp(kb * 2.5) : 0, transform: `scaleY(${t >= tb ? clamp(kb, 0, 1.04).toFixed(4) : 0})`,
            background: on ? 'var(--yellow)' : '#fff' });
          css(b.querySelector('.stN'), { transform: `translateX(-50%) scale(${(on ? 1 + .25 * (1 - clamp(lk, 0, 1.2)) : 1).toFixed(4)})`,
            background: on ? 'var(--navy)' : 'var(--brand)' });
        });
        if (label) { const on = t >= label.t, lk = spring(t - label.t, .62, 1.8);
          css(el.querySelector('.stLbl'), { opacity: on ? clamp(lk * 2.5) : 0, transform: `translateX(-50%) scale(${on ? lerp(.6, 1, lk).toFixed(4) : .6})` }); }
      },
    };
  };

  // ===== yumuşak damga (45+ / sakin tempo): L.stamp görünümü, ama büyükten yay ile süzülerek oturur; sarsıntı ve sert çarpma yok =====
  // text  t  x,y: merkez  rot  color (çerçeve + yazı)  ink (yazı rengi ayrı; ör. yeşil çerçeve + koyu yeşil yazı, kontrast)  size  from: başlangıç ölçeği (vars. 1.35)  out
  L.softStamp = ({ text, t: t0, x = 540, y = 400, rot = -4, color, ink, size = 80, from = 1.35, out = Infinity }) => ({
    html: `<div class="abs c-stamp c-sstamp" style="left:${x}px;top:${y}px;font-size:${size}px;${color ? `color:${color};border-color:${color};` : ''}${ink ? `color:${ink};` : ''}">${esc(text)}</div>`,
    render(t, r) {
      const k = spring(t - t0, .66, 1.6), o = isFinite(out) ? E.inCubic(prog(t, out - .38, out)) : 0;
      css(r.firstChild, { opacity: t >= t0 ? clamp(k * 2.2) * (1 - o) : 0,
        transform: `translate(-50%,-50%) scale(${t >= t0 ? (lerp(from, 1, clamp(k, 0, 1.1)) * (1 - .15 * o)).toFixed(4) : 0}) rotate(${rot}deg)` });
    },
  });

  // ===== form CTA'sı (reklam formu): yazısız form kartı (alanlar + gönder düğmesi) yerinde açılır; altında kısa etiket hapı; =====
  // altında sarı daire içinde aşağı ok arrow.t'de n kez nazikçe zıplar ("açıklamadaki formda")
  // x,y: kartın sol-üstü  w (yükseklik 1.1 w)  t  fields: alan sayısı  label: {text, t, size}  arrow: {t (zıplama), in (giriş, vars. t-.5), n, per (sekme süresi), size}  out
  // button (isteğe bağlı): düğmenin üstündeki kısa yazı (ör. 'Formu doldur'), buttonSize: punto (vars. .08 w)  arrow.again (isteğe bağlı): t ya da [t..] -> ok o anlarda yine n kez zıplar
  // pulse (isteğe bağlı, v11): t ya da [t..] -> gönder düğmesi o anlarda hafif nabız (ör. 'eğitimde görüşelim')
  L.formCard = ({ x, y, w = 340, t: t0, fields = 3, label, arrow, out = Infinity, accent = 'var(--green)', button, buttonSize, pulse }) => {
    const h = Math.round(w * 1.1), ls = label ? (label.size || 46) : 0, as = arrow ? (arrow.size || 96) : 0;
    const lh = Math.round(ls * 1.9), ly = h + 26, ay = ly + (label ? lh + 22 : 0);
    return {
      html: `<div class="abs c-form" style="left:${x}px;top:${y}px;width:${w}px">
        <div class="fmCard" style="height:${h}px"><i class="fmHead"></i>${[...Array(fields)].map(() => '<div class="fmF"><i class="fmL"></i><i class="fmBox"></i></div>').join('')}
          <i class="fmBtn" style="background:${accent}${button ? `;display:grid;place-items:center;font-style:normal;color:#fff;font-weight:900;white-space:nowrap;font-size:${buttonSize || Math.round(w * .08)}px` : ''}">${button ? esc(button) : ''}</i></div>
        ${label ? `<div class="fmLbl" style="top:${ly}px;font-size:${ls}px;height:${lh}px">${esc(label.text)}</div>` : ''}
        ${arrow ? `<div class="fmArr" style="top:${ay}px;width:${as}px;height:${as}px;margin-left:${-as / 2}px">${I.arrowDown()}</div>` : ''}</div>`,
      render(t, r) {
        const el = r.firstChild, q = s => el.querySelector(s), o = isFinite(out) ? E.inCubic(prog(t, out - .38, out)) : 0;
        css(el, { opacity: 1 - o });
        const k = spring(t - t0, .66, 1.7);
        css(q('.fmCard'), { opacity: t >= t0 ? clamp(k * 2.5) : 0, transform: `scale(${t >= t0 ? lerp(.8, 1, k).toFixed(4) : 0})` });
        el.querySelectorAll('.fmF').forEach((f, i) => { const tf = t0 + .25 + i * .18, kf = spring(t - tf, .7, 2);
          css(f, { opacity: t >= tf ? clamp(kf * 2.5) : 0, transform: `translateY(${((1 - clamp(kf, 0, 1)) * 14).toFixed(2)}px)` }); });
        const tb = t0 + .25 + fields * .18, kb = spring(t - tb, .6, 2);
        if (pulse == null) css(q('.fmBtn'), { opacity: t >= tb ? clamp(kb * 2.5) : 0, transform: `scale(${t >= tb ? lerp(.6, 1, clamp(kb, 0, 1.1)).toFixed(4) : 0})` });
        else {                                                                // pulse (isteğe bağlı, v11): t ya da [t..] -> düğme ~.55 s'de bir kez hafifçe büyüyüp döner
          let pk = 0; for (const tp of [].concat(pulse)) pk = Math.max(pk, Math.sin(Math.PI * prog(t, tp, tp + .55)));
          css(q('.fmBtn'), { opacity: t >= tb ? clamp(kb * 2.5) : 0, transform: `scale(${t >= tb ? (lerp(.6, 1, clamp(kb, 0, 1.1)) * (1 + .09 * pk)).toFixed(4) : 0})` });
        }
        if (label) { const on = t >= label.t, lk = spring(t - label.t, .62, 1.8);
          css(q('.fmLbl'), { opacity: on ? clamp(lk * 2.5) : 0, transform: `translateX(-50%) scale(${on ? lerp(.7, 1, lk).toFixed(4) : .7})` }); }
        if (arrow) {
          const ta = arrow.in ?? arrow.t - .5, on = t >= ta, ak = spring(t - ta, .62, 1.8), n = arrow.n ?? 2;
          let bob = 0;
          for (const tb of [arrow.t, ...[].concat(arrow.again ?? [])]) {
            const bp = prog(t, tb, tb + (arrow.per ?? .55) * n); if (bp > 0 && bp < 1) bob = Math.max(bob, Math.abs(Math.sin(Math.PI * n * bp)) * as * .2); }
          css(q('.fmArr'), { opacity: on ? clamp(ak * 2.5) : 0, transform: `translateY(${bob.toFixed(2)}px) scale(${on ? lerp(.5, 1, ak).toFixed(4) : 0})` });
        }
      },
    };
  };

  // ===== hüküm listesi: satırlar (ikon + kısa etiket) kendi anında gelir; verdict.t'de her satıra sırayla renkli hüküm hapı ('Gerek yok') oturur =====
  // x,y: sol-üst  w: satır genişliği (verilmezse içerik kadar)  size: punto (satır yüksekliği 2x)  gap  rows: [{icon, text, t}]
  // verdict: {text, icon, style:'green'|'red'|'yellow', t, stagger, size, at:'right' (satır içinde sağda) | 'below' (satırın altında, dar sütun;
  //          gap >= hap yüksekliği) | 'corner' (sağ alt köşeye çıkartma)}  out
  L.verdictList = ({ x, y, w, size = 50, gap = 26, rows = [], verdict, out = Infinity }) => {
    const rh = Math.round(size * 2), ic = Math.round(size * 1.5), m = (rh - ic) / 2, vs = verdict ? (verdict.size || Math.round(size * .86)) : 0;
    const vh = Math.round(vs * 1.85), at = verdict && verdict.at || 'right';
    return {
      html: `<div class="abs c-verdict" style="left:${x}px;top:${y}px">${rows.map((it, i) => `<div class="vdRow" style="top:${i * (rh + gap)}px;height:${rh}px;${w ? `width:${w}px;` : ''}font-size:${size}px;padding:0 ${Math.round(size * .7)}px 0 ${m}px;gap:${Math.round(size * .38)}px">
        <span class="vdIc" style="width:${ic}px;height:${ic}px">${it.icon ? I[it.icon]('#fff') : ''}</span><span class="vdTx">${esc(it.text)}</span>
        ${verdict ? `<span class="vdPill ${verdict.style || 'green'} ${at}" style="font-size:${vs}px;height:${vh}px;${at === 'right' ? `right:${Math.round(m)}px;top:${Math.round((rh - vh) / 2)}px` : at === 'below' ? `left:${Math.round(m + ic * .55)}px;top:${rh - 6}px` : `right:${-Math.round(size * .3)}px;top:${Math.round(rh * .62)}px`}">${verdict.icon ? `<span class="vdPI">${I[verdict.icon]()}</span>` : ''}<span>${esc(verdict.text)}</span></span>` : ''}</div>`).join('')}</div>`,
      render(t, r) {
        const el = r.firstChild, o = isFinite(out) ? E.inCubic(prog(t, out - .38, out)) : 0;
        css(el, { opacity: 1 - o, transform: `translateY(${(-24 * o).toFixed(2)}px)` });
        el.querySelectorAll('.vdRow').forEach((row, i) => {
          const it = rows[i], k = spring(t - it.t, .66, 1.7), shown = t >= it.t;
          css(row, { opacity: shown ? clamp(k * 2.5) : 0, transform: `scale(${shown ? lerp(.7, 1, k).toFixed(4) : 0})` });
          if (verdict) { const tv = verdict.t + i * (verdict.stagger ?? .2), on = t >= tv, vk = spring(t - tv, .6, 1.9);
            css(row.querySelector('.vdPill'), { opacity: on ? clamp(vk * 2.5) : 0,
              transform: `scale(${on ? lerp(1.4, 1, clamp(vk, 0, 1.1)).toFixed(4) : 0}) rotate(${at === 'corner' ? -3 : 0}deg)`,
              transformOrigin: at === 'below' ? '20% 0' : at === 'right' ? '100% 50%' : '' }); }   // 'right': sola doğru büyür (satırdan taşmaz)
        });
      },
    };
  };

  // ===== yüzü belirli bir anda dondur (görüntü + kadraj): kayıt sonunda konuşmacı başını çeviriyorsa son iyi kareyi tutar =====
  // (L.freezeFace canlı kadrajı kopyalar; takip başın dönüşünü izlerse donmuş kare kayar. Bu bileşen 'at' anının kadrajını M.face + yüz takibinden
  // geri hesaplar ve sabit tutar.) at: dondurulan an (o anki kare + kadraj; canlıyla birebir aynı -> sıçrama yok)  t: kararma başlangıcı (vars. at)
  // dim, blur, dur: kararma / bulanıklık / geçiş  undo: {t, dur} kararma ve bulanıklık geri alınır (döngü: son kare t=0 kadar net/parlak).
  // Yüz o anda görünür olmalı (tam ekran veya kart); değilse canlı kadrajı kopyalar.
  // filter (isteğe bağlı, v7): donan kareye önce uygulanacak CSS filtresi (ör. V.faceFilter ile aynı renk; verilmezse davranış aynı)
  // frame (isteğe bağlı, v11): true -> kartın çerçevesi (beyaz halka + gölge) donan kareye de kopyalanır (kapanış kartta: motor yüzü gizleyince halka kaybolmasın)
  L.holdFace = ({ at, t: t0 = at, dim = .3, blur = 2, dur = .45, undo, filter, frame = false }) => {
    const n = Math.max(0, Math.min(window.TIMELINE.frames - 1, Math.floor(at * M.FPS + 1e-6)));
    const src = `${window.FACE_DIR}${String(n + 1).padStart(4, '0')}.jpg`, SR = window.TIMELINE.src || { w: 1440, h: 2560 };
    return {
      html: `<div class="abs c-freeze" data-safe="ignore"><img data-safe="ignore" src="${src}" alt=""></div>`,
      render(t, r) {
        const el = r.firstChild, img = el.firstChild;
        if (t < at) { el.style.opacity = 0; return; }
        const k = E.inOutCubic(prog(t, t0, t0 + dur)) * (undo ? 1 - E.inOutCubic(prog(t, undo.t, undo.t + (undo.dur ?? .3))) : 1);
        const fs = document.getElementById('faceWrap').style, is = document.getElementById('face').style;
        const f = M.face(at), TR = window.FACE_TRACK;
        const ok = f.ok && TR && TR.x0 && f.face.x0 > f.clip.x0 + 1 && f.face.y0 > f.clip.y0 + 1;   // yüz kutusu kırpılmamış -> geri hesap güvenilir
        let box, iw, ih, tx, ty;
        if (ok) {
          iw = f.scale; ih = iw * SR.h / SR.w;
          const ox = f.face.x0 - TR.x0[n] * iw, oy = f.face.y0 - TR.y0[n] * ih;
          box = { left: f.clip.x0 + 'px', top: f.clip.y0 + 'px', width: (f.clip.x1 - f.clip.x0) + 'px', height: (f.clip.y1 - f.clip.y0) + 'px' };
          tx = ox - f.clip.x0; ty = oy - f.clip.y0;
        }
        css(el, Object.assign({ opacity: 1, borderRadius: fs.borderRadius, transform: 'none' }, frame ? { boxShadow: fs.boxShadow } : {},
          ok ? box : { left: fs.left, top: fs.top, width: fs.width, height: fs.height, transform: fs.transform }));
        css(img, { width: ok ? iw + 'px' : is.width, height: ok ? ih + 'px' : is.height,
          transform: `${ok ? `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px)` : is.transform} scale(${(1 + .03 * k).toFixed(4)})`,
          filter: `${filter ? filter + ' ' : ''}blur(${(blur * k).toFixed(2)}px) brightness(${(1 - dim * k).toFixed(3)})` });
      },
    };
  };

  // ===================== v7 EDİTORYAL PREMİUM bileşenleri (ornekler/editoryal-premium): ince çizgiler, altın vurgu, kırık beyaz yazı, sakin giriş =====================
  // Girişler: fade + kısa kayma (8-16 px) ya da çizginin çizilmesi, .5-.8 s ease-out (E.outCubic); çıkışlar .4 s E.inCubic ('out' = çıkışın BİTTİĞİ an).
  // Renkler CSS değişkenlerinden: --gold (vars. #C9A45C), --ivory (vars. #F4F1EA), --ink0 (vars. #070C15). Damga, flaş, sarsıntı, sekme yok.
  // Yalnızca yeni adlar eklenir; mevcut bileşen, ikon ve stiller değişmez (mevcut varsayılanlar korunur). İtalik: 'MontI' yazı ailesi (base.css).
  const GOLD = 'var(--gold, #C9A45C)', IVORY = 'var(--ivory, #F4F1EA)';
  const eIn = (t, a, d = .6) => E.outCubic(prog(t, a, a + d));                       // giriş ilerlemesi (ease-out)
  const eOut = (t, out, d = .4) => isFinite(out) ? E.inCubic(prog(t, out - d, out)) : 0;   // çıkış (out'ta biter)
  // ince çizgi ikonlar (48x48, stroke; her yol ayrı çizilir -> çizgi çizimi animasyonu)
  const IL = {
    hotel: ['M9 42V9h21v33', 'M30 19h9v23', 'M5 42h38', 'M14 15h4M21 15h4M14 22h4M21 22h4M14 29h4M21 29h4', 'M17 42v-6h5v6', 'M34 25h1M34 31h1'],
    ledger: ['M12 5h17l8 8v30H12z', 'M29 5v8h8', 'M17 21h15M17 27h15M17 33h9', 'M30 33h3'],
    pitch: ['M5 10h38v28H5z', 'M24 10v28', 'M30 24a6 6 0 1 1-12 0a6 6 0 1 1 12 0', 'M5 16.5h7v15H5', 'M43 16.5h-7v15h7', 'M5 20.5H2v7h3', 'M43 20.5h3v7h-3', 'M24.6 24a.6 .6 0 1 1-1.2 0a.6 .6 0 1 1 1.2 0'],
    bulb: ['M24 7a11 11 0 0 0-6.6 19.8c1.3 1 2.1 2.4 2.1 4V33h9v-2.2c0-1.6.8-3 2.1-4A11 11 0 0 0 24 7z', 'M20 37.5h8', 'M21.5 42h5'],
    gear: ['M33 24a9 9 0 1 1-18 0a9 9 0 1 1 18 0', 'M28 24a4 4 0 1 1-8 0a4 4 0 1 1 8 0', 'M24 6v6M24 36v6M6 24h6M36 24h6M11.3 11.3l4.2 4.2M32.5 32.5l4.2 4.2M11.3 36.7l4.2-4.2M32.5 15.5l4.2-4.2'],
    trend: ['M6 41h37', 'M7 34l11-11 8 7 15-16', 'M31 14h10v10'],
    docs: ['M9 17h19v26H9z', 'M14 12h19v26', 'M19 7h19v26', 'M13 25h11M13 31h11M13 37h7'],
    clock: ['M24 7a17 17 0 1 1 0 34a17 17 0 1 1 0-34z', 'M24 14v10l7 4'],
    check: ['M10 25l9 9 19-20'],
    user: ['M24 23a7.5 7.5 0 1 0 0-15a7.5 7.5 0 0 0 0 15z', 'M10 41c1.6-8.4 7.4-12.5 14-12.5S36.4 32.6 38 41'],
    arrowDown: ['M24 7v32', 'M14 29l10 10 10-10'],
    arrowRight: ['M7 24h32', 'M29 14l10 10-10 10'],
    chevL: ['M28 14l-10 10 10 10'], chevR: ['M20 14l10 10-10 10'],
  };
  const ilSvg = (name, size, color = IVORY, px = 2.4, cls = 'il') => `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" style="stroke:${color}" stroke-width="${(px * 48 / size).toFixed(3)}" stroke-linecap="round" stroke-linejoin="round">${(IL[name] || []).map(d => `<path pathLength="1" d="${d}"/>`).join('')}</svg>`;
  // çizgi çizimi: pathLength=1 olan yollar p (0..1) kadar çizilir; p=0'da gizli (yuvarlak uç noktası görünmesin)
  const drawP = (el, p) => { css(el, { strokeDasharray: '1 1', strokeDashoffset: (1 - clamp(p)).toFixed(4), opacity: p > 0 ? '' : 0 }); };
  const drawSeq = (els, t, a, b, ov = .35) => { const n = els.length, d = (b - a) / (n - (n - 1) * ov || 1);   // sırayla, ov kadar örtüşerek
    els.forEach((el, i) => { const s = a + i * d * (1 - ov); drawP(el, E.outCubic(prog(t, s, s + d))); }); };
  L.IL = IL; L.ilSvg = ilSvg;

  // ===== bölüm başlığı (editoryal imza): '01' (altın) + ince çizgi çizilir + 'BAŞLIK' (geniş harf aralıklı) =====
  // num, title, x, y (sol-üst; stack'te merkez x, üst y), size (vars. 32), t, out, line (çizgi px), upper (vars. true)
  // stack: true -> bölüm açılışı (gizli sahnede): büyük ince numara üstte, çizgi, başlık altta; ortalı
  L.chapter = ({ num, title, x = 70, y = 268, size = 32, t: t0, out = Infinity, line, upper = true, stack = false }) => {
    const lw = Math.round(line ?? size * (stack ? 3.6 : 2.2)), tt = esc(upper ? up(title) : title);
    return {
      html: stack
        ? `<div class="abs c-chap stack" style="left:${x}px;top:${y}px;font-size:${size}px"><span class="chN">${esc(num)}</span><i class="chRule" style="width:${lw}px"></i><span class="chT">${tt}</span></div>`
        : `<div class="abs c-chap" style="left:${x}px;top:${y}px;font-size:${size}px"><span class="chN">${esc(num)}</span><i class="chRule" style="width:${lw}px"></i><span class="chT">${tt}</span></div>`,
      render(t, r) {
        const el = r.firstChild, o = eOut(t, out);
        if (t < t0 || o >= 1) { el.style.opacity = 0; return; }
        css(el, { opacity: 1 - o, transform: `${stack ? 'translateX(-50%) ' : ''}translateY(${(-8 * o).toFixed(2)}px)` });
        const kn = eIn(t, t0, .65), kr = eIn(t, t0 + .15, .75), kt = eIn(t, t0 + .3, .7);
        css(el.querySelector('.chN'), { opacity: kn, transform: `translateY(${((1 - kn) * 10).toFixed(2)}px)` });
        css(el.querySelector('.chRule'), { transform: `scaleX(${kr.toFixed(4)})` });
        css(el.querySelector('.chT'), { opacity: kt, transform: stack ? `translateY(${((1 - kt) * 10).toFixed(2)}px)` : `translateX(${((1 - kt) * -12).toFixed(2)}px)` });
      },
    };
  };

  // ===== editoryal kanca (dergi kapağı, sahne): üst etiket (altın, geniş aralık, iki yanında ince çizgi) + ince başlık satırları; =====
  // answer.t'de cevap satırının üstündeki altın çizgi ortadan çizilir, cevap (italik, altın) yumuşakça belirir.
  // kicker, kickerSize, lines: ['Bu videoyu', 'kim kurguladı?'], sizes, top, cx, gap, t (vars. 0), pre (vars. .8 -> t=0'da tamamen yerinde = ilk kare okunur)
  // answer: {text, t, y (üst), size, line (çizgi px), out, lift (px), scale}  lift/scale: cevap gelirken üst etiket söner, soru bloğu lift px yukarı
  //   kalkıp scale'e küçülür (üst bantta cevaba yer açar; dar alanda soru + cevap birlikte)  out: soru bloğunun çıkışı (bittiği an)  id, z
  L.coverHook = ({ kicker, kickerSize = 26, lines = [], sizes = 84, top = 262, cx = 540, gap = 0, t: t0 = 0, pre = .8, answer, out = Infinity, id = 'hook', z = 6 }) => {
    const sz = i => Array.isArray(sizes) ? (sizes[i] ?? sizes[sizes.length - 1]) : sizes, A = answer;
    const end = Math.max(out, A ? (A.out ?? Infinity) : -Infinity);
    return {
      id, z, from: Math.max(0, t0 - pre), to: isFinite(end) ? end + .05 : Infinity,
      html: `<div class="c-cover"><div class="cvQ" style="left:${cx}px;top:${top}px">${kicker ? `<div class="cvK" style="font-size:${kickerSize}px"><i></i><span>${esc(kicker)}</span><i></i></div>` : ''}${
        lines.map((l, i) => `<div class="cvL" style="font-size:${sz(i)}px;margin-top:${i ? gap : 0}px">${esc(l)}</div>`).join('')}</div>${
        A ? `<div class="cvA" style="left:${cx}px;top:${A.y}px"><i class="cvRule" style="width:${A.line ?? 220}px"></i><div class="cvAT" style="font-size:${A.size ?? 72}px">${esc(A.text)}</div></div>` : ''}</div>`,
      render(t, s) {
        const oq = eOut(t, out), kq = eIn(t, t0 - pre, .7);
        const lf = A && (A.lift || A.scale) ? E.inOutCubic(prog(t, A.t - .1, A.t + .6)) : 0;   // cevaba yer: soru yukarı kalkar / küçülür, üst etiket söner
        css(s.q('.cvQ'), { opacity: (kq * (1 - oq)).toFixed(4),
          transform: `translate(-50%,${((1 - kq) * 12 - 10 * oq - (A && A.lift || 0) * lf).toFixed(2)}px) scale(${lerp(1, A && A.scale || 1, lf).toFixed(4)})` });
        if (s.q('.cvK')) s.q('.cvK').style.opacity = (1 - lf).toFixed(4);
        if (!A) return;
        const oa = eOut(t, A.out ?? Infinity), on = t >= A.t, kr = eIn(t, A.t, .75), ka = eIn(t, A.t + .2, .75);
        css(s.q('.cvA'), { opacity: on && oa < 1 ? (1 - oa).toFixed(4) : 0, transform: `translate(-50%,${(-8 * oa).toFixed(2)}px)` });
        css(s.q('.cvRule'), { transform: `scaleX(${kr.toFixed(4)})` });
        css(s.q('.cvAT'), { opacity: ka.toFixed(4), transform: `translateY(${((1 - ka) * 14).toFixed(2)}px)` });
      },
    };
  };

  // ===== alt bant (lower third): solda daire (logo avatarı ya da numara; ince altın halka çizilir) + isim + altın çizgi + alt satır =====
  // x, y (sol-üst), size (daire çapı), avatar (görsel; vars. marka avatarı) | num ('01'), name, sub, t (daire), nameT (vars. t), subT (vars. nameT+.45)
  // nameSize, subSize, out (bittiği an), plate (true: arkasında soldan sağa sönen koyu plaka; hareketli/karışık zeminde okunurluk). Yazı yoksa yalnızca daire.
  L.lowerThird = ({ x = 70, y = 1160, size = 96, avatar, num, name = '', sub = '', t: t0, nameT, subT, nameSize = 44, subSize = 28, out = Infinity, plate = false }) => {
    const nt = nameT ?? t0, st = subT ?? nt + .45, R = size / 2, pad = Math.round(size * .075), im = size - 2 * pad;
    const circ = num != null ? `<span class="ltNum" style="font-size:${Math.round(size * .34)}px">${esc(num)}</span>`
      : `<img class="ltImg" src="${asset(avatar || (B.logo && B.logo.avatar))}" alt="" style="left:${pad}px;top:${pad}px;width:${im}px;height:${im}px">`;
    return {
      html: `<div class="abs c-lt" style="left:${x}px;top:${y}px;height:${size}px">${plate ? `<i class="ltPlate" style="right:-${Math.round(size * .9)}px;border-radius:${size / 2 + 14}px 0 0 ${size / 2 + 14}px"></i>` : ''}
        <div class="ltC" style="width:${size}px;height:${size}px">${circ}<svg class="ltRing" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle pathLength="1" cx="${R}" cy="${R}" r="${R - 1.5}" fill="none" stroke-width="2" transform="rotate(-90 ${R} ${R})"/></svg></div>
        ${name || sub ? `<div class="ltTx" style="margin-left:${Math.round(size * .28)}px">${name ? `<div class="ltName" style="font-size:${nameSize}px">${esc(name)}</div>` : ''}<i class="ltRule"></i>${sub ? `<div class="ltSub" style="font-size:${subSize}px">${esc(sub)}</div>` : ''}</div>` : ''}</div>`,
      render(t, r) {
        const el = r.firstChild, o = eOut(t, out), q = s => el.querySelector(s);
        if (t < t0 || o >= 1) { el.style.opacity = 0; return; }
        css(el, { opacity: (1 - o).toFixed(4), transform: `translateY(${(8 * o).toFixed(2)}px)` });
        const kc = eIn(t, t0, .7);
        if (plate) css(q('.ltPlate'), { opacity: kc.toFixed(4), clipPath: `inset(0 ${(100 * (1 - eIn(t, t0 + .1, .9))).toFixed(2)}% 0 0)` });
        css(q('.ltC'), { opacity: kc.toFixed(4), transform: `scale(${lerp(.92, 1, kc).toFixed(4)})` });
        drawP(q('.ltRing circle'), E.inOutCubic(prog(t, t0 + .1, t0 + 1.1)));
        if (q('.ltName')) { const k = eIn(t, nt + .15, .7); css(q('.ltName'), { opacity: k.toFixed(4), transform: `translateX(${((1 - k) * -14).toFixed(2)}px)` }); }
        if (q('.ltRule')) css(q('.ltRule'), { transform: `scaleX(${eIn(t, nt + .3, .8).toFixed(4)})` });
        if (q('.ltSub')) { const k = eIn(t, st, .7); css(q('.ltSub'), { opacity: k.toFixed(4), transform: `translateY(${((1 - k) * 10).toFixed(2)}px)` }); }
      },
    };
  };

  // ===== ince hap (etiket): ince altın çerçeve, kırık beyaz yazı; yerinde fade + kısa kayma =====
  // text, x, y (sol-üst; anchor 'center' -> x merkez), size, t, out, icon (IL anahtarı, isteğe bağlı)
  L.pill = ({ text, x, y, size = 34, t: t0, out = Infinity, anchor = 'left', icon }) => ({
    html: `<div class="abs c-epill" style="left:${x}px;top:${y}px;font-size:${size}px">${icon ? ilSvg(icon, Math.round(size * 1.1), GOLD, 2.2) : ''}<span>${esc(text)}</span></div>`,
    render(t, r) {
      const el = r.firstChild, k = eIn(t, t0, .7), o = eOut(t, out);
      css(el, { opacity: t >= t0 ? (k * (1 - o)).toFixed(4) : 0, transform: `${anchor === 'center' ? 'translateX(-50%) ' : ''}translateY(${((1 - k) * 12 - 6 * o).toFixed(2)}px)` });
      el.querySelectorAll('path[pathLength]').forEach(p => drawP(p, eIn(t, t0 + .1, .8)));
    },
  });

  // ===== sıfırdan adım adım (çizgi grafik): ince taban çizgisi; büyük ince '0' başlangıç noktası; basamaklar lit anlarında altınla çizilir, =====
  // köşelerde küçük düğümler (son düğüm altın). x, y (sol-üst), w, h, steps, t (taban çizgisi), zero: {t, text, size}, lit: [t..], out
  L.stepChart = ({ x, y, w = 820, h = 380, steps = 3, t: t0, zero = {}, lit = [], out = Infinity }) => {
    const zs = zero.size ?? 150, ox = Math.round(zs * .55), by = h - 6, top = 26, run = (w - ox - 40) / steps, rise = (by - top) / steps;
    const P = i => [ox + i * run, by - i * rise];
    const stepD = i => { const [x0, y0] = P(i), [x1, y1] = P(i + 1); return `M${x0.toFixed(1)} ${y0.toFixed(1)}H${x1.toFixed(1)}V${y1.toFixed(1)}`; };
    return {
      html: `<div class="abs c-stepc" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
        <svg class="stSvg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
          <path class="stBase" pathLength="1" d="M0 ${by}H${w}"/>
          ${[...Array(steps)].map((_, i) => `<path class="stGhost" d="${stepD(i)}"/>`).join('')}
          ${[...Array(steps)].map((_, i) => `<path class="stLine" pathLength="1" d="${stepD(i)}"/>`).join('')}
          <circle class="stO" cx="${ox}" cy="${by}" r="9"/>
          ${[...Array(steps)].map((_, i) => `<circle class="stNode${i === steps - 1 ? ' last' : ''}" cx="${P(i + 1)[0].toFixed(1)}" cy="${P(i + 1)[1].toFixed(1)}" r="${i === steps - 1 ? 11 : 8}"/>`).join('')}
        </svg>
        <div class="stZero" style="left:${ox}px;bottom:${h - by + 22}px;font-size:${zs}px">${esc(zero.text ?? '0')}</div></div>`,
      render(t, r) {
        const el = r.firstChild, o = eOut(t, out), q = s => el.querySelector(s);
        css(el, { opacity: t >= t0 ? (1 - o).toFixed(4) : 0 });
        drawP(q('.stBase'), E.inOutCubic(prog(t, t0, t0 + .9)));
        el.querySelectorAll('.stGhost').forEach(g => { g.style.opacity = (.9 * eIn(t, t0 + .4, .8)).toFixed(3); });
        const zt = zero.t ?? t0, kz = eIn(t, zt, .8);
        css(q('.stZero'), { opacity: kz.toFixed(4), transform: `translateX(-50%) translateY(${((1 - kz) * 14).toFixed(2)}px)` });
        css(q('.stO'), { opacity: kz.toFixed(4) });
        el.querySelectorAll('.stLine').forEach((p, i) => drawP(p, lit[i] != null ? E.inOutCubic(prog(t, lit[i], lit[i] + .7)) : 0));
        el.querySelectorAll('.stNode').forEach((c, i) => { const k = lit[i] != null ? eIn(t, lit[i] + .55, .5) : 0;
          css(c, { opacity: k.toFixed(4), transform: `scale(${lerp(.4, 1, k).toFixed(4)})`, transformBox: 'fill-box', transformOrigin: '50% 50%' }); });
      },
    };
  };

  // ===== Romen rakamlı liste (editoryal): satır = rakam (altın, ince) + ince çizgi ikon (çizilir) + metin; altta ince ayırıcı çizgi; =====
  // check.t'de her satırın sağında sırayla ince altın halka + tik çizilir. x, y, w, rowH, size (metin), items: [{num, icon, text, t}], check: {t, stagger}, out
  L.romanList = ({ x, y, w = 860, rowH = 118, size = 42, items = [], check, out = Infinity }) => {
    const ic = Math.round(size * 1.45), ck = Math.round(size * 1.25);
    return {
      html: `<div class="abs c-roman" style="left:${x}px;top:${y}px;width:${w}px">${items.map((it, i) => `<div class="rlRow" style="top:${i * rowH}px;height:${rowH}px;font-size:${size}px">
        <span class="rlN" style="width:${Math.round(size * 1.6)}px">${esc(it.num)}</span>${it.icon ? `<span class="rlI">${ilSvg(it.icon, ic, GOLD, 2.2)}</span>` : ''}<span class="rlT">${esc(it.text)}</span>
        ${check ? `<span class="rlK">${ilSvg('check', ck, GOLD, 2.6, 'il rlKc')}<svg class="rlKr" width="${ck}" height="${ck}" viewBox="0 0 48 48" fill="none"><circle pathLength="1" cx="24" cy="24" r="22.5" stroke-width="${(1.8 * 48 / ck).toFixed(3)}" transform="rotate(-90 24 24)"/></svg></span>` : ''}
        <i class="rlSep"></i></div>`).join('')}</div>`,
      render(t, r) {
        const el = r.firstChild, o = eOut(t, out);
        css(el, { opacity: (1 - o).toFixed(4), transform: `translateY(${(-10 * o).toFixed(2)}px)` });
        el.querySelectorAll('.rlRow').forEach((row, i) => {
          const it = items[i], q = s => row.querySelector(s), on = t >= it.t;
          row.style.visibility = on ? '' : 'hidden';
          if (!on) return;
          const kn = eIn(t, it.t, .6), kt = eIn(t, it.t + .2, .7);
          css(q('.rlN'), { opacity: kn.toFixed(4), transform: `translateY(${((1 - kn) * 10).toFixed(2)}px)` });
          css(q('.rlT'), { opacity: kt.toFixed(4), transform: `translateX(${((1 - kt) * -14).toFixed(2)}px)` });
          if (q('.rlI')) drawSeq([...q('.rlI').querySelectorAll('path')], t, it.t + .1, it.t + 1.0);
          css(q('.rlSep'), { transform: `scaleX(${E.inOutCubic(prog(t, it.t, it.t + .9)).toFixed(4)})` });
          if (check) { const tc = check.t + i * (check.stagger ?? .18);
            drawP(q('.rlKr circle'), E.inOutCubic(prog(t, tc, tc + .5)));
            q('.rlKc').querySelectorAll('path').forEach(p => drawP(p, E.outCubic(prog(t, tc + .3, tc + .65)))); }
        });
      },
    };
  };

  // ===== çizgi cihaz maketi (yazısız, koyu tema): 'browser' site · 'phone' mobil uygulama; çerçeve çizgiyle çizilir, iskelet blokları sırayla belirir =====
  // x, y, w, h, t (çerçeve çizimi), build: {a, b} (iskelet), accent (altın), out
  const LDV = {
    browser: [[6, 19, 88, 30, 'hero'], [10, 26, 44, 5, 'ttl'], [10, 35, 30, 3.2, 'txt'], [10, 41, 16, 5, 'btn'], [62, 23, 28, 22, 'img'],
              [6, 56, 27, 34, 'card'], [36.5, 56, 27, 34, 'card'], [67, 56, 27, 34, 'card']],
    phone: [[8, 12, 52, 4.5, 'ttl'], [8, 21, 84, 22, 'hero'], [8, 49, 13, 6.5, 'dot'], [26, 50, 58, 2.6, 'txt'], [26, 54.5, 38, 2.2, 'txt2'],
            [8, 61, 13, 6.5, 'dot'], [26, 62, 58, 2.6, 'txt'], [26, 66.5, 38, 2.2, 'txt2'], [8, 73, 13, 6.5, 'dot'], [26, 74, 58, 2.6, 'txt'], [26, 78.5, 38, 2.2, 'txt2'],
            [30, 88, 40, 6, 'btn']],
  };
  L.lineDevice = ({ kind = 'browser', x, y, w, h, t: t0, build, out = Infinity }) => {
    const ph = kind === 'phone', rr = ph ? Math.round(w * .13) : 18, bar = ph ? 0 : Math.round(Math.max(38, h * .1));
    const frame = `M${rr} 1H${w - rr}A${rr - 1} ${rr - 1} 0 0 1 ${w - 1} ${rr}V${h - rr}A${rr - 1} ${rr - 1} 0 0 1 ${w - rr} ${h - 1}H${rr}A${rr - 1} ${rr - 1} 0 0 1 1 ${h - rr}V${rr}A${rr - 1} ${rr - 1} 0 0 1 ${rr} 1Z`;
    const blk = (LDV[kind] || LDV.browser).map(([bx, by, bw, bh, k]) => `<i class="ldB ld-${k}" style="left:${bx}%;top:${by}%;width:${bw}%;height:${bh}%"></i>`).join('');
    return {
      html: `<div class="abs c-ldev ${kind}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
        <svg class="ldF" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none"><path pathLength="1" d="${frame}"/>${bar ? `<path pathLength="1" d="M1 ${bar}H${w - 1}"/>` : ''}</svg>
        ${bar ? `<div class="ldBar" style="height:${bar}px"><i></i><i></i><i></i><b></b></div>` : `<i class="ldNotch" style="width:${Math.round(w * .28)}px;height:${Math.round(w * .055)}px;top:${Math.round(w * .045)}px"></i>`}
        <div class="ldScr" style="top:${bar}px">${blk}</div></div>`,
      render(t, r) {
        const el = r.firstChild, o = eOut(t, out), k = eIn(t, t0, .8);
        css(el, { opacity: t >= t0 ? (Math.min(1, k * 1.6) * (1 - o)).toFixed(4) : 0, transform: `translateY(${((1 - k) * 14).toFixed(2)}px)` });
        el.querySelectorAll('.ldF path').forEach((p, i) => drawP(p, E.inOutCubic(prog(t, t0 + i * .25, t0 + .9 + i * .25))));
        const ba = build ? build.a : t0 + .4, bb = build ? build.b : t0 + 1.2, bs = el.querySelectorAll('.ldB'), n = bs.length;
        bs.forEach((b, i) => { const ti = ba + (bb - ba) * i / Math.max(1, n - 1), kb = eIn(t, ti, .5);
          css(b, { opacity: kb.toFixed(4), transform: `translateY(${((1 - kb) * 8).toFixed(2)}px)` }); });
        const kb = eIn(t, t0 + .5, .6);
        el.querySelectorAll('.ldBar, .ldNotch').forEach(b => { b.style.opacity = kb.toFixed(4); });
      },
    };
  };

  // ===== gerçek kurgu şeridi ("bu video"): kesim sınırlarından klip blokları; içlerinde önceden üretilmiş küçük resim şeridi (x ekseni zamana doğrusal), =====
  // altında gerçek ses dalgası (görsel); oynatma imleci play.a..b'de baştan play.to'ya (saniye) kayar, sonra (follow) gerçek zamanı izler;
  // imlecin altındaki klip ince altın çerçeveyle yanar. Üstte küçük altın etiket.
  // x, y, w (panel), cuts: [0, ...kesimler, süre] (çıkış saniyesi), strip, wave (proje klasörüne göre yol), vh (video izi), ah (ses izi), pad,
  // t (panel girişi), build: {a, b} (bloklar soldan sağa), play: {a, b, to}, follow (vars. true), label: {text, t}, out
  // ru / g (isteğe bağlı, vars. 22 / 12): cetvel yüksekliği / izler arası boşluk (dar alanda kompakt şerit)
  L.cutStrip = ({ x, y, w = 920, cuts = [0, 1], strip, wave, vh = 150, ah = 56, pad = 20, t: t0, build, play, follow = true, label, out = Infinity, ru = 22, g = 12 }) => {
    const dur = cuts[cuts.length - 1], iw = w - 2 * pad, h = pad + ru + g + vh + g + ah + pad, X = s => s / dur * iw;
    const vy = pad + ru + g, ay = vy + vh + g;
    const ticks = []; for (let s = 0; s <= dur + 1e-6; s += 2.5) ticks.push(s);
    const P = Object.assign({ a: t0 + .6, b: t0 + 1.8, to: t0 + 1.8 }, play || {}), Bd = Object.assign({ a: t0 + .2, b: t0 + 1.0 }, build || {});
    return {
      html: `<div class="abs c-cut" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
        ${label ? `<div class="cuLbl"><i></i><span>${esc(label.text)}</span></div>` : ''}
        <div class="cuRuler" style="left:${pad}px;top:${pad}px;width:${iw}px;height:${ru}px">${ticks.map((s, i) => `<i style="left:${X(s).toFixed(1)}px;height:${i % 6 === 0 ? 100 : i % 2 === 0 ? 55 : 32}%"></i>`).join('')}<b class="cuPlayed"></b></div>
        ${cuts.slice(0, -1).map((a, i) => { const b = cuts[i + 1], l = X(a);
          return `<i class="cuClip" style="left:${(pad + l).toFixed(1)}px;top:${vy}px;width:${Math.max(2, X(b) - l - 2).toFixed(1)}px;height:${vh}px;background-image:url('${strip}');background-size:${iw}px ${vh}px;background-position:${(-l).toFixed(1)}px 0"></i>`; }).join('')}
        <div class="cuWave" style="left:${pad}px;top:${ay}px;width:${iw}px;height:${ah}px;background-image:url('${wave}');background-size:${iw}px ${ah}px"></div>
        <div class="cuHead" style="top:${pad - 6}px;height:${ay + ah - pad + 10}px"><i></i></div></div>`,
      render(t, r) {
        const el = r.firstChild, o = eOut(t, out), k = eIn(t, t0, .7), q = s => el.querySelector(s);
        css(el, { opacity: t >= t0 ? (k * (1 - o)).toFixed(4) : 0, transform: `translateY(${((1 - k) * 14 - 8 * o).toFixed(2)}px)` });
        if (label) { const kl = eIn(t, label.t ?? t0, .7); css(q('.cuLbl'), { opacity: kl.toFixed(4), transform: `translateX(${((1 - kl) * -12).toFixed(2)}px)` });
          css(q('.cuLbl i'), { transform: `scaleX(${eIn(t, (label.t ?? t0) + .15, .8).toFixed(4)})` }); }
        css(q('.cuRuler'), { opacity: eIn(t, t0 + .1, .6).toFixed(4) });
        const pos = t < P.a ? 0 : t < P.b ? P.to * E.inOutCubic(prog(t, P.a, P.b)) : follow ? Math.min(dur, P.to + (t - P.b)) : P.to;
        const hx = X(pos), kh = eIn(t, P.a - .2, .4);
        el.querySelectorAll('.cuClip').forEach((c, i) => {
          const a = cuts[i], ti = Bd.a + (Bd.b - Bd.a) * a / dur, kc = eIn(t, ti, .5), cur = t >= P.a && pos >= a && pos < cuts[i + 1];
          css(c, { opacity: kc.toFixed(4), transform: `scaleY(${lerp(.7, 1, kc).toFixed(4)})`, boxShadow: cur ? `inset 0 0 0 2px ${GOLD}` : '' });
        });
        css(q('.cuWave'), { clipPath: `inset(0 ${(100 * (1 - E.inOutCubic(prog(t, Bd.a + .1, Bd.b + .3)))).toFixed(2)}% 0 0)` });
        css(q('.cuHead'), { left: (pad + hx).toFixed(1) + 'px', opacity: kh.toFixed(4) });
        css(q('.cuPlayed'), { width: hx.toFixed(1) + 'px', opacity: kh.toFixed(4) });
      },
    };
  };

  // ===== rezervasyon takvimi (yazısız): ince çerçeve; üst şeritte iki ok + soyut başlık çizgisi; cols x rows ızgara çizgileri çizilir; =====
  // bookings: dolu günler (altın / kırık beyaz şeritler) sırayla soldan oturur. Gün numarası/ay adı yazmaz.
  // x, y, w, h, cols, rows, t, bookings: [{r, c0, c1, t, tone:'gold'|'ivory'}], out
  L.calendarGrid = ({ x, y, w = 840, h = 360, cols = 7, rows = 4, t: t0, bookings = [], out = Infinity }) => {
    const hd = Math.round(h * .17), bh = h - hd, cw = w / cols, rh = bh / rows;
    return {
      html: `<div class="abs c-cal2" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
        <div class="cgHead" style="height:${hd}px">${ilSvg('chevL', Math.round(hd * .6), IVORY, 2.2)}<b></b>${ilSvg('chevR', Math.round(hd * .6), IVORY, 2.2)}</div>
        ${[...Array(rows)].map((_, i) => `<i class="cgH" style="top:${(hd + i * rh).toFixed(1)}px"></i>`).join('')}
        ${[...Array(cols - 1)].map((_, i) => `<i class="cgV" style="left:${((i + 1) * cw).toFixed(1)}px;top:${hd}px;height:${bh}px"></i>`).join('')}
        ${bookings.map(b => `<i class="cgBk ${b.tone || 'gold'}" style="left:${(b.c0 * cw + 8).toFixed(1)}px;top:${(hd + b.r * rh + rh * .3).toFixed(1)}px;width:${((b.c1 - b.c0 + 1) * cw - 16).toFixed(1)}px;height:${(rh * .4).toFixed(1)}px"></i>`).join('')}</div>`,
      render(t, r) {
        const el = r.firstChild, o = eOut(t, out), k = eIn(t, t0, .7);
        css(el, { opacity: t >= t0 ? (k * (1 - o)).toFixed(4) : 0, transform: `translateY(${((1 - k) * 12 - 8 * o).toFixed(2)}px)` });
        el.querySelectorAll('.cgH').forEach((l, i) => { l.style.transform = `scaleX(${E.inOutCubic(prog(t, t0 + .15 + i * .08, t0 + .85 + i * .08)).toFixed(4)})`; });
        el.querySelectorAll('.cgV').forEach((l, i) => { l.style.transform = `scaleY(${E.inOutCubic(prog(t, t0 + .3 + i * .06, t0 + .95 + i * .06)).toFixed(4)})`; });
        el.querySelectorAll('.cgHead path').forEach(p => drawP(p, eIn(t, t0 + .3, .6)));
        css(el.querySelector('.cgHead b'), { transform: `scaleX(${eIn(t, t0 + .35, .7).toFixed(4)})` });
        el.querySelectorAll('.cgBk').forEach((b, i) => { const kb = eIn(t, bookings[i].t, .6);
          css(b, { opacity: kb.toFixed(4), transform: `scaleX(${lerp(.2, 1, kb).toFixed(4)})` }); });
      },
    };
  };

  // ===== saha (üstten, ince çizgiler): dış çizgi, orta çizgi, orta yuvarlak, ceza ve kale alanları sırayla çizilir; orta nokta altın =====
  // x, y, w (h = w*.648), t, dur (çizim süresi, vars. 1.4), ghost (isteğe bağlı t: daha önce soluk kesik çizgili dış çerçeve + zemin), out
  L.pitch = ({ x, y, w = 680, t: t0, dur = 1.4, ghost, out = Infinity }) => {
    const h = Math.round(w * 68 / 105), sw = (2.2 * 105 / w).toFixed(3);
    const D = ['M1 1H104V67H1Z', 'M52.5 1V67', 'M52.5 24.85A9.15 9.15 0 1 1 52.5 43.15A9.15 9.15 0 1 1 52.5 24.85', 'M1 13.84H17.5V54.16H1', 'M104 13.84H87.5V54.16H104',
      'M1 24.84H6.5V43.16H1', 'M104 24.84H98.5V43.16H104', 'M17.5 27.56A9.15 9.15 0 0 1 17.5 40.44', 'M87.5 27.56A9.15 9.15 0 0 0 87.5 40.44'];
    return {
      html: `<div class="abs c-pitch" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><svg width="${w}" height="${h}" viewBox="0 0 105 68" fill="none" stroke-width="${sw}" stroke-linecap="round">
        <rect class="pcFill" x="1" y="1" width="103" height="66"/>${ghost != null ? `<rect class="pcGhost" x="1" y="1" width="103" height="66" stroke-dasharray="${(4 * 105 / w).toFixed(2)} ${(10 * 105 / w).toFixed(2)}"/>` : ''}${D.map(d => `<path pathLength="1" d="${d}"/>`).join('')}<circle class="pcSpot" cx="52.5" cy="34" r="1.3"/></svg></div>`,
      render(t, r) {
        const el = r.firstChild, o = eOut(t, out), t1 = ghost != null ? Math.min(ghost, t0) : t0, k = eIn(t, t1, .6);
        css(el, { opacity: t >= t1 ? (Math.min(1, k * 1.5) * (1 - o)).toFixed(4) : 0, transform: `translateY(${((1 - k) * 10 - 8 * o).toFixed(2)}px)` });
        drawSeq([...el.querySelectorAll('path')], t, t0, t0 + dur, .55);
        el.querySelector('.pcFill').style.opacity = (eIn(t, ghost != null ? ghost : t0 + .3, 1)).toFixed(4);
        if (ghost != null) el.querySelector('.pcGhost').style.opacity = (eIn(t, ghost, .8) * (1 - eIn(t, t0 + .2, .6))).toFixed(4);
        el.querySelector('.pcSpot').style.opacity = eIn(t, t0 + dur * .7, .4).toFixed(4);
      },
    };
  };

  // ===== ödeme kartı (yazısız): ince çerçeveli kart, altın çip, soyut numara çizgileri; tick'te köşede ince altın halka + tik çizilir =====
  // x, y, w (h = w/1.586), t, tick (t), out
  L.payCard = ({ x, y, w = 360, t: t0, tick, out = Infinity }) => {
    const h = Math.round(w / 1.586), ck = Math.round(w * .24);
    return {
      html: `<div class="abs c-pay" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
        <i class="pyChip" style="left:${Math.round(w * .09)}px;top:${Math.round(h * .3)}px;width:${Math.round(w * .15)}px;height:${Math.round(w * .115)}px"></i>
        <i class="pyLn" style="left:${Math.round(w * .09)}px;top:${Math.round(h * .62)}px;width:${Math.round(w * .6)}px"></i>
        <i class="pyLn s" style="left:${Math.round(w * .09)}px;top:${Math.round(h * .77)}px;width:${Math.round(w * .3)}px"></i>
        ${tick != null ? `<span class="pyOk" style="right:${-Math.round(ck * .3)}px;top:${-Math.round(ck * .3)}px;width:${ck}px;height:${ck}px">${ilSvg('check', Math.round(ck * .62), GOLD, 2.6, 'il pyC')}<svg class="pyR" width="${ck}" height="${ck}" viewBox="0 0 48 48" fill="none"><circle pathLength="1" cx="24" cy="24" r="22.5" stroke-width="${(2 * 48 / ck).toFixed(3)}" transform="rotate(-90 24 24)"/></svg></span>` : ''}</div>`,
      render(t, r) {
        const el = r.firstChild, o = eOut(t, out), k = eIn(t, t0, .7);
        css(el, { opacity: t >= t0 ? (k * (1 - o)).toFixed(4) : 0, transform: `translateY(${((1 - k) * 14 - 8 * o).toFixed(2)}px)` });
        el.querySelectorAll('.pyChip, .pyLn').forEach((b, i) => { const kb = eIn(t, t0 + .25 + i * .12, .5); css(b, { opacity: kb.toFixed(4), transform: `scaleX(${lerp(.3, 1, kb).toFixed(4)})` }); });
        if (tick != null) { drawP(el.querySelector('.pyR circle'), E.inOutCubic(prog(t, tick, tick + .55)));
          el.querySelectorAll('.pyC path').forEach(p => drawP(p, E.outCubic(prog(t, tick + .35, tick + .75))));
          el.querySelector('.pyOk').style.background = t >= tick + .3 ? `rgba(7,12,21,${(.85 * eIn(t, tick + .3, .4)).toFixed(3)})` : 'transparent'; }
      },
    };
  };

  // ===== randevu ızgarası (yazısız): başlıkta ince saat ikonu + soyut başlık çizgisi; cols x rows saat dilimi hapları; fill hücreleri sırayla altınla dolar =====
  // x, y, w, h, cols, rows, t, fillT, fill: [[r, c], ...], stagger, out
  L.slotGrid = ({ x, y, w = 360, h = 230, cols = 3, rows = 3, t: t0, fillT, fill = [], stagger = .16, out = Infinity }) => {
    const hd = Math.round(h * .24), gx = 12, gy = 12, sw = (w - gx * (cols - 1)) / cols, sh = (h - hd - gy * (rows - 1)) / rows;
    const fi = new Map(fill.map(([r0, c0], i) => [r0 * cols + c0, i]));
    return {
      html: `<div class="abs c-slots" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
        <div class="slHead" style="height:${hd}px">${ilSvg('clock', Math.round(hd * .72), GOLD, 2.2)}<b></b></div>
        ${[...Array(rows * cols)].map((_, n) => `<i class="slS" data-n="${n}" style="left:${((n % cols) * (sw + gx)).toFixed(1)}px;top:${(hd + Math.floor(n / cols) * (sh + gy)).toFixed(1)}px;width:${sw.toFixed(1)}px;height:${sh.toFixed(1)}px"></i>`).join('')}</div>`,
      render(t, r) {
        const el = r.firstChild, o = eOut(t, out), k = eIn(t, t0, .7);
        css(el, { opacity: t >= t0 ? (k * (1 - o)).toFixed(4) : 0, transform: `translateY(${((1 - k) * 14 - 8 * o).toFixed(2)}px)` });
        el.querySelectorAll('.slHead path').forEach(p => drawP(p, eIn(t, t0 + .1, .7)));
        css(el.querySelector('.slHead b'), { transform: `scaleX(${eIn(t, t0 + .2, .7).toFixed(4)})` });
        el.querySelectorAll('.slS').forEach((s, n) => { const ks = eIn(t, t0 + .2 + n * .04, .45), j = fi.get(n);
          const kf = j != null && fillT != null ? eIn(t, fillT + j * stagger, .5) : 0;
          css(s, { opacity: ks.toFixed(4), background: `rgba(201,164,92,${(.85 * kf).toFixed(3)})`, borderColor: kf > 0 ? `rgba(201,164,92,${(.4 + .6 * kf).toFixed(3)})` : '' }); });
      },
    };
  };

  // ===== kalabalık (sayısız): cols x rows küçük daire avatar; fill.a..b arasında tohumlu rastgele sırayla dolar; lit.a..b'de soldan sağa altın halka + altın figür =====
  // (parıltı). Rakam yazmaz. x, y (sol-üst), cols, rows, size, gap, t (soluk daireler), fill: {a, b}, lit: {a, b}, seed, out
  L.avatarField = ({ x, y, cols = 10, rows = 4, size = 66, gap = 18, t: t0, fill = {}, lit, seed = 11, out = Infinity }) => {
    const n = cols * rows, R = rng(seed), ord = [...Array(n).keys()].map(i => [R(), i]).sort((a, b) => a[0] - b[0]).map(p => p[1]);
    const rank = []; ord.forEach((c, k) => { rank[c] = k; });
    const fa = fill.a ?? t0, fb = fill.b ?? t0 + 2;
    return {
      html: `<div class="abs c-afield" style="left:${x}px;top:${y}px;width:${cols * size + (cols - 1) * gap}px;height:${rows * size + (rows - 1) * gap}px">${[...Array(n)].map((_, i) =>
        `<div class="afC" style="left:${(i % cols) * (size + gap)}px;top:${Math.floor(i / cols) * (size + gap)}px;width:${size}px;height:${size}px">${ilSvg('user', Math.round(size * .7), 'currentColor', 2, 'il afU')}</div>`).join('')}</div>`,
      render(t, r) {
        const el = r.firstChild, o = eOut(t, out);
        css(el, { opacity: t >= t0 ? (1 - o).toFixed(4) : 0 });
        el.querySelectorAll('.afC').forEach((c, i) => {
          const k0 = eIn(t, t0 + (i % cols) * .03, .6), tf = fa + (fb - fa) * rank[i] / Math.max(1, n - 1), kf = eIn(t, tf, .6);
          const tl = lit ? lit.a + (lit.b - lit.a) * ((i % cols) + Math.floor(i / cols) * .35) / (cols - 1 + (rows - 1) * .35) : Infinity, kl = eIn(t, tl, .5);
          const glow = t >= tl ? Math.sin(Math.PI * prog(t, tl, tl + .8)) : 0;
          css(c, { opacity: (.35 + .65 * k0 * Math.max(.45, kf)).toFixed(3) * (t >= t0 ? 1 : 0),
            background: `rgba(244,241,234,${(.1 * kf).toFixed(3)})`,
            borderColor: kl > 0 ? mixRgb([120, 120, 120], [201, 164, 92], kl) : `rgba(244,241,234,${(.22 + .3 * kf).toFixed(3)})`,
            color: kl > 0 ? mixRgb([244, 241, 234], [201, 164, 92], kl) : `rgba(244,241,234,${(.18 + .8 * kf).toFixed(3)})`,
            boxShadow: glow > 0 ? `0 0 ${(18 * glow).toFixed(1)}px rgba(201,164,92,${(.55 * glow).toFixed(3)})` : '',
            transform: `scale(${(lerp(.9, 1, k0) * (1 + .05 * glow)).toFixed(4)})` });
        });
      },
    };
  };

  // ===== yol / rota: ince altın çizgi noktalardan geçerek (yumuşak eğri) çizilir; her adım noktası çizgi ulaşınca belirir; glow'da son nokta =====
  // parlar (halka yayılır + dört kollu ince parıltı). x, y, w, h (kutu), pts: [[0..1, 0..1], ...] (kutuya oranlı, y aşağı), t (soluk kılavuz),
  // draw: {a, b}, glow (t), out
  L.route = ({ x, y, w = 800, h = 360, pts = [[0, 1], [.3, .7], [.55, .55], [.78, .3], [1, 0]], t: t0, draw = {}, glow, out = Infinity }) => {
    const m = 18, P = pts.map(([u, v]) => [m + u * (w - 2 * m), m + v * (h - 2 * m)]);
    let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
    for (let i = 0; i < P.length - 1; i++) {                                 // Catmull-Rom -> Bezier
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    const seg = P.slice(1).map((p, i) => Math.hypot(p[0] - P[i][0], p[1] - P[i][1])), L0 = seg.reduce((a, b) => a + b, 0);
    const frac = [0]; seg.forEach(s => frac.push(frac[frac.length - 1] + s / L0));
    const da = draw.a ?? t0 + .3, db = draw.b ?? da + 1.6, [lx, ly] = P[P.length - 1];
    return {
      html: `<div class="abs c-route" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
        <path class="rtGuide" d="${d}"/><path class="rtLine" pathLength="1" d="${d}"/>
        ${P.map(([px, py], i) => `<circle class="rtDot${i === P.length - 1 ? ' last' : ''}" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${i === P.length - 1 ? 10 : 7}"/>`).join('')}
        <circle class="rtPulse" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="12"/>
        <path class="rtSpark" d="M${lx} ${ly - 30}V${ly - 18}M${lx} ${ly + 18}V${ly + 30}M${lx - 30} ${ly}H${lx - 18}M${lx + 18} ${ly}H${lx + 30}"/></svg></div>`,
      render(t, r) {
        const el = r.firstChild, o = eOut(t, out), q = s => el.querySelector(s);
        css(el, { opacity: t >= t0 ? (1 - o).toFixed(4) : 0 });
        q('.rtGuide').style.opacity = (.9 * eIn(t, t0, .8)).toFixed(3);
        const p = E.inOutCubic(prog(t, da, db));
        drawP(q('.rtLine'), p);
        el.querySelectorAll('.rtDot').forEach((c, i) => { const td = da + (db - da) * frac[i], k = eIn(t, td - .05, .45);
          css(c, { opacity: (p >= frac[i] - 1e-3 || t >= td ? k : 0).toFixed(4), transform: `scale(${lerp(.3, 1, k).toFixed(4)})`, transformBox: 'fill-box', transformOrigin: '50% 50%' }); });
        const gp = glow != null ? prog(t, glow, glow + 1.1) : 0, on = glow != null && t >= glow;
        css(q('.rtPulse'), { opacity: on && gp < 1 ? (.9 * (1 - gp)).toFixed(3) : 0, transform: `scale(${lerp(1, 3.4, E.outCubic(gp)).toFixed(4)})`, transformBox: 'fill-box', transformOrigin: '50% 50%' });
        const sk = on ? Math.sin(Math.PI * clamp(prog(t, glow + .05, glow + 1.2))) : 0;
        css(q('.rtSpark'), { opacity: sk.toFixed(3), transform: `scale(${lerp(.6, 1, sk).toFixed(4)})`, transformBox: 'fill-box', transformOrigin: '50% 50%' });
        q('.rtDot.last').style.filter = on ? `drop-shadow(0 0 ${(10 * eIn(t, glow, .5)).toFixed(1)}px rgba(201,164,92,.9))` : '';
      },
    };
  };

  // ===== ince çizgi ikon dizisi (yazısız): ikonlar sırayla çizilir; aralarında ince dikey ayırıcılar =====
  // x (merkez), y (üst), icons: ['hotel', 'ledger', 'pitch'], size, gap, t, stagger, color, out
  L.iconRow = ({ x = 540, y, icons = [], size = 110, gap = 90, t: t0, stagger = .22, color = IVORY, out = Infinity }) => {
    const W0 = icons.length * size + (icons.length - 1) * gap;
    return {
      html: `<div class="abs c-irow" style="left:${x - W0 / 2}px;top:${y}px;width:${W0}px;height:${size}px">${icons.map((ic, i) =>
        `${i ? `<i class="irSep" style="left:${i * (size + gap) - gap / 2}px;height:${Math.round(size * .6)}px;top:${Math.round(size * .2)}px"></i>` : ''}<span class="irI" style="left:${i * (size + gap)}px">${ilSvg(ic, size, color, 2.4)}</span>`).join('')}</div>`,
      render(t, r) {
        const el = r.firstChild, o = eOut(t, out);
        css(el, { opacity: t >= t0 ? (1 - o).toFixed(4) : 0, transform: `translateY(${(-8 * o).toFixed(2)}px)` });
        el.querySelectorAll('.irI').forEach((s, i) => { const ti = t0 + i * stagger; drawSeq([...s.querySelectorAll('path')], t, ti, ti + 1.0); });
        el.querySelectorAll('.irSep').forEach((s, i) => { s.style.transform = `scaleY(${eIn(t, t0 + (i + 1) * stagger - .1, .6).toFixed(4)})`; });
      },
    };
  };

  // ===== küçük dönüşüm kartı (yazısız): ince çerçeveli koyu kart; A ikonu, ok çizilir, B ikonu (ör. belge yığını -> dişli = otomasyon); =====
  // spin: B yavaşça döner. x, y, w, h, from, to (IL anahtarları), dir: 'down'|'right', t, tArrow, tTo, spin, out
  L.iconFlow = ({ x, y, w = 230, h = 360, from = 'docs', to = 'gear', dir = 'down', t: t0, tArrow, tTo, spin = true, out = Infinity }) => {
    const s = Math.round(Math.min(w, h) * .42), ta = tArrow ?? t0 + .5, tb = tTo ?? ta + .4, ar = Math.round(s * .62);
    return {
      html: `<div class="abs c-iflow ${dir}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><span class="ifA">${ilSvg(from, s, IVORY, 2.4)}</span><span class="ifR">${ilSvg(dir === 'down' ? 'arrowDown' : 'arrowRight', ar, GOLD, 2.2)}</span><span class="ifB">${ilSvg(to, s, GOLD, 2.4)}</span></div>`,
      render(t, r) {
        const el = r.firstChild, o = eOut(t, out), k = eIn(t, t0, .7);
        css(el, { opacity: t >= t0 ? (k * (1 - o)).toFixed(4) : 0, transform: `translateY(${((1 - k) * 12 - 8 * o).toFixed(2)}px)` });
        drawSeq([...el.querySelectorAll('.ifA path')], t, t0 + .1, t0 + .9);
        drawSeq([...el.querySelectorAll('.ifR path')], t, ta, ta + .5, .2);
        drawSeq([...el.querySelectorAll('.ifB path')], t, tb, tb + .9);
        if (spin) el.querySelector('.ifB svg').style.transform = `rotate(${(t >= tb ? 22 * (t - tb) : 0).toFixed(2)}deg)`;
      },
    };
  };

  // ===== yumuşak koyu zemin (scrim): yazının arkasında kenarları sönen eliptik koyuluk (açık/karışık görüntüde okunurluk; 40+ kontrast) =====
  // x, y (merkez), w, h (elips), a (merkez koyuluğu 0..1), t (giriş; <= 0 -> t=0'da tam), out (bittiği an), fade, ink ('r,g,b'). data-safe=ignore.
  L.scrim = ({ x = 540, y, w = 1300, h = 520, a = .6, t: t0 = 0, out = Infinity, fade = .5, ink = '5,8,14' }) => ({
    html: `<div class="abs c-scrim" data-safe="ignore" style="left:${x - w / 2}px;top:${y - h / 2}px;width:${w}px;height:${h}px;background:radial-gradient(closest-side, rgba(${ink},${a}) 0%, rgba(${ink},${(a * .82).toFixed(3)}) 42%, rgba(${ink},${(a * .4).toFixed(3)}) 72%, rgba(${ink},0) 100%)"></div>`,
    render(t, r) { r.firstChild.style.opacity = ((t0 <= 0 ? 1 : eIn(t, t0, fade)) * (1 - eOut(t, out, fade))).toFixed(4); },
  });

  // ===== logo kapanışı (sahne parçası): kare koyu zemine yumuşakça kararır (t..t+dur), ortada logo avatarı belirir, çevresinde ince altın halka çizilir =====
  // t (kararma başlangıcı), dur, logoT (vars. t + dur*.6), logoDur (logo girişi, vars. .9), ring: {a, b} halka çizimi (vars. logoT+.15 .. +1.15),
  // x, y (merkez), size, src (vars. marka avatarı)
  L.logoClose = ({ t: t0, dur = .6, logoT, logoDur = .9, ring, x = 540, y = 860, size = 300, src }) => {
    const lt = logoT ?? t0 + dur * .6, pad = Math.round(size * .06), R = size / 2;
    return {
      html: `<div class="abs c-close"><div class="clDim" data-safe="ignore"></div><div class="clGlow" data-safe="ignore" style="left:${x - size * 1.3}px;top:${y - size * 1.3}px;width:${size * 2.6}px;height:${size * 2.6}px"></div>
        <div class="clLogo" style="left:${x - R}px;top:${y - R}px;width:${size}px;height:${size}px"><img src="${asset(src || (B.logo && B.logo.avatar))}" alt="" style="left:${pad}px;top:${pad}px;width:${size - 2 * pad}px;height:${size - 2 * pad}px">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle pathLength="1" cx="${R}" cy="${R}" r="${R - 1.5}" fill="none" stroke-width="2.5" transform="rotate(-90 ${R} ${R})"/></svg></div></div>`,
      render(t, r) {
        const el = r.firstChild, q = s => el.querySelector(s);
        q('.clDim').style.opacity = E.inOutCubic(prog(t, t0, t0 + dur)).toFixed(4);
        const k = eIn(t, lt, logoDur), ra = ring ? ring.a : lt + .15, rb = ring ? ring.b : lt + 1.15;
        css(q('.clLogo'), { opacity: (t >= lt ? k : 0).toFixed(4), transform: `scale(${lerp(.94, 1, k).toFixed(4)})` });
        q('.clGlow').style.opacity = (.9 * eIn(t, lt + .2, 1.2)).toFixed(3);
        drawP(q('.clLogo circle'), E.inOutCubic(prog(t, ra, rb)));
      },
    };
  };

  // ===================== v8 bileşenleri (viral sahne yoğunluğu: yazılım + pazarlama, yazilimpazarlama) =====================
  // Halka grafiği, lejant, video duvarı, dünya noktaları, uygulama telefonu; döngü kapanışı için başlık ve donma sarmalayıcıları.
  // Yalnızca yeni adlar eklenir; mevcut bileşen, ikon ve stiller değişmez (mevcut varsayılanlar korunur).
  I.coin = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="23" fill="none" stroke="${c}" stroke-width="5"/><path d="M25 15v24c7 0 12-4 12-11" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 26l13-5M19 32l13-5" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/></svg>`;
  I.tag = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path fill-rule="evenodd" d="M6 10v16l24 24 20-20L26 6H10a4 4 0 0 0-4 4zM17 12.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9z" fill="${c}"/></svg>`;
  I.home = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M11 27L28 13l17 14v21H33V36H23v12H11z" fill="${c}"/><path d="M5 28L28 8l23 20" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  I.glass = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M13 16h30l-4 31a4 4 0 0 1-4 3.5H21a4 4 0 0 1-4-3.5z" fill="${c}"/><path d="M31 16l5-11h7" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  I.mug = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M8 23h30v15a10 10 0 0 1-10 10H18A10 10 0 0 1 8 38z" fill="${c}"/><path d="M38 27h3a6 6 0 0 1 0 12h-3" stroke="${c}" stroke-width="4.5" fill="none"/><path d="M17 6c-3 3 3 6 0 11M27 6c-3 3 3 6 0 11" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>`;
  I.bottle = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path fill-rule="evenodd" d="M23 4h10v8l5 8v28a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V20l5-8zM22 27v11h12V27z" fill="${c}"/></svg>`;
  I.globe = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="21" fill="none" stroke="${c}" stroke-width="4.5"/><ellipse cx="28" cy="28" rx="9" ry="21" fill="none" stroke="${c}" stroke-width="4"/><path d="M8 21h40M8 35h40" stroke="${c}" stroke-width="4"/></svg>`;
  I.pin = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path fill-rule="evenodd" d="M28 52s-16-17-16-29a16 16 0 0 1 32 0c0 12-16 29-16 29zM28 16.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13z" fill="${c}"/></svg>`;
  I.arrowRight = (c = '#0B1F33') => `<svg width="48" height="48" viewBox="0 0 48 48"><path d="M8 24h30M25 11l13 13-13 13" stroke="${c}" stroke-width="6.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  I.phone = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><rect x="15" y="4" width="26" height="48" rx="6" fill="none" stroke="${c}" stroke-width="5"/><path d="M24 44h8" stroke="${c}" stroke-width="4" stroke-linecap="round"/></svg>`;

  // ===== halka / pasta grafiği: boş halka çizilir; dilimler kendi anında saat yönünde dolar; ortadaki değer damga gibi çarpar =====
  // Sayı yalnızca center.text'te (videoda söylenen değer); dilimlerin yüzdesi yazılmaz.
  // x,y: merkez  r: halka orta yarıçapı  w: kalınlık  t: halka çizimi (dur)  track: boş halka rengi  gap: dilim arası (halkanın %'si)
  // segs: [{a, b (0..1, tepeden saat yönünde), color, t, dur, ghost (t: dilimin kesik çizgili gölgesi önceden belirir, dolarken söner)}]
  // marks: [{text, at (0..1, halka üstünde), t, out, size, color}]
  // center: {text, t, size, color, from (giriş ölçeği), count: {from, to, dur, prefix, suffix} (söylenen değere sayar; text yerine)}
  // lit: t (dış halka nabzı, "tamamlandı")  out (çıkışın bittiği an)
  L.donut = ({ x, y, r = 260, w = 110, t: t0, dur = .7, track = 'rgba(255,255,255,.16)', gap = .6, segs = [], marks = [], center, lit, out = Infinity }) => {
    const R0 = r + w / 2, S = Math.ceil(2 * (R0 + 24)), c = S / 2;
    const ring = (cls, col) => `<circle class="${cls}" cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${col}" stroke-width="${w}" pathLength="100"/>`;
    const pos = a => { const th = 2 * Math.PI * a - Math.PI / 2; return [c + r * Math.cos(th), c + r * Math.sin(th)]; };
    const dashes = L0 => { const n = Math.max(2, Math.round(L0 / 2.2)), d = L0 / n; return `${Array(n).fill(`${(d * .58).toFixed(3)} ${(d * .42).toFixed(3)}`).join(' ')} 0 200`; };
    const ghost = s => { const L0 = (s.b - s.a) * 100, off = (-(s.a * 100)).toFixed(2), col = s.color, ri = r - w / 2 + 3, ro = r + w / 2 - 3;
      const edge = a => { const th = 2 * Math.PI * a; return `<line x1="${(c + ri * Math.cos(th)).toFixed(1)}" y1="${(c + ri * Math.sin(th)).toFixed(1)}" x2="${(c + ro * Math.cos(th)).toFixed(1)}" y2="${(c + ro * Math.sin(th)).toFixed(1)}" stroke="${col}" stroke-width="5" stroke-dasharray="9 7" stroke-linecap="round"/>`; };
      return `<g class="dnGh"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${col}" stroke-opacity=".2" stroke-width="${w - 6}" pathLength="100" stroke-dasharray="${L0.toFixed(2)} 200" stroke-dashoffset="${off}"/>
        ${[ri, ro].map(rr => `<circle cx="${c}" cy="${c}" r="${rr}" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round" pathLength="100" stroke-dasharray="${dashes(L0)}" stroke-dashoffset="${off}"/>`).join('')}${edge(s.a)}${edge(s.b)}</g>`; };
    return {
      html: `<div class="abs c-donut" style="left:${x - c}px;top:${y - c}px;width:${S}px;height:${S}px">
        <svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><g transform="rotate(-90 ${c} ${c})">${ring('dnTrack', track)}${segs.map(s => s.ghost != null ? ghost(s) : '<g class="dnGh"></g>').join('')}${segs.map(s => ring('dnSeg', s.color)).join('')}</g>
          <circle class="dnLit" cx="${c}" cy="${c}" r="${R0 + 8}" fill="none" stroke="#FFD23F" stroke-width="7"/></svg>
        ${marks.map(m => { const [mx, my] = pos(m.at); return `<div class="dnMark" style="left:${mx.toFixed(1)}px;top:${my.toFixed(1)}px;font-size:${m.size || Math.round(w * .6)}px;color:${m.color || '#fff'}">${esc(m.text)}</div>`; }).join('')}
        ${center ? `<div class="dnC" style="font-size:${center.size || Math.round(r * .55)}px;color:${center.color || '#fff'}">${esc(center.text)}</div>` : ''}</div>`,
      render(tt, rt) {
        const el = rt.firstChild, q = s => el.querySelector(s), k = spring(tt - t0, .62, 2.0), o = isFinite(out) ? E.inExpo(prog(tt, out - .2, out)) : 0;
        css(el, { opacity: tt >= t0 ? clamp(k * 3) * (1 - o) : 0, transform: `scale(${tt >= t0 ? (lerp(.82, 1, k) * (1 - .15 * o)).toFixed(4) : 0})` });
        css(q('.dnTrack'), { strokeDasharray: `${(100 * E.outCubic(prog(tt, t0 + .05, t0 + .05 + dur))).toFixed(2)} 200` });
        el.querySelectorAll('.dnSeg').forEach((sg, i) => {
          const s = segs[i], p = E.inOutCubic(prog(tt, s.t, s.t + (s.dur ?? .45))), len = Math.max(0, (s.b - s.a) * 100 * p - gap);
          css(sg, { strokeDasharray: `${len.toFixed(2)} 200`, strokeDashoffset: (-(s.a * 100 + gap / 2)).toFixed(2), opacity: p > 0 ? 1 : 0 });
          if (s.ghost != null) { const gk = spring(tt - s.ghost, .7, 2.2), gp = Math.sin(Math.PI * clamp((tt - s.ghost) / 1.1));
            el.querySelectorAll('.dnGh')[i].style.opacity = tt >= s.ghost ? (clamp(gk * 2) * (1 - clamp(p * 1.4)) * (.85 + .15 * gp)).toFixed(3) : 0; }
        });
        const lp = lit != null && tt >= lit ? prog(tt, lit, lit + .7) : 0, lc = q('.dnLit');
        lc.setAttribute('r', (R0 + 4 + 14 * E.outCubic(lp)).toFixed(1)); lc.style.opacity = lp > 0 && lp < 1 ? (.95 * (1 - lp)).toFixed(3) : 0;
        el.querySelectorAll('.dnMark').forEach((mk, i) => {
          const m = marks[i], on = tt >= m.t, mkk = spring(tt - m.t, .5, 3), mo = m.out != null && isFinite(m.out) ? E.inExpo(prog(tt, m.out - .2, m.out)) : 0;
          css(mk, { opacity: on ? clamp(mkk * 3) * (1 - mo) : 0, transform: `translate(-50%,-50%) scale(${on ? (lerp(.3, 1, mkk) * (1 - .5 * mo)).toFixed(4) : 0})` });
        });
        if (center) {
          const ct = center.t ?? t0, on = tt >= ct, sk = E.outCubic(prog(tt, ct, ct + .12)), b = spring(tt - (ct + .12), .4, 4);
          css(q('.dnC'), { opacity: on ? clamp(sk * 2) : 0,
            transform: `translate(-50%,-50%) scale(${on ? (lerp(center.from ?? 1.8, 1, sk) * (1 + .07 * (1 - clamp(b, 0, 1.5)))).toFixed(4) : 0})` });
          const cn = center.count;
          if (cn) q('.dnC').textContent = `${cn.prefix ?? ''}${Math.round(lerp(cn.from ?? 0, cn.to, E.outCubic(prog(tt, ct, ct + (cn.dur ?? .45)))))}${cn.suffix ?? ''}`;
        }
      },
    };
  };

  // ===== lejant: renkli nokta + kısa etiket hapları (grafik açıklaması); her satır kendi anında yerinde pop =====
  // x,y: sol-üst  items: [{text, color, t, out}]  size: punto (satır yüksekliği 1.9x)  gap  out
  L.legend = ({ x, y, items = [], size = 40, gap = 16, out = Infinity }) => {
    const h = Math.round(size * 1.9), d = Math.round(size * .62);
    return {
      html: `<div class="abs c-legend" style="left:${x}px;top:${y}px">${items.map((it, i) => `<div class="lgRow" style="top:${i * (h + gap)}px;height:${h}px;font-size:${size}px;padding:0 ${Math.round(size * .72)}px 0 ${Math.round(size * .5)}px;gap:${Math.round(size * .36)}px"><i style="width:${d}px;height:${d}px;background:${it.color}"></i><span>${esc(it.text)}</span></div>`).join('')}</div>`,
      render(t, r) {
        const el = r.firstChild, o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
        css(el, { opacity: 1 - o });
        el.querySelectorAll('.lgRow').forEach((row, i) => {
          const it = items[i], on = t >= it.t, k = spring(t - it.t, .62, 2.4), io = it.out != null && isFinite(it.out) ? E.inExpo(prog(t, it.out - .2, it.out)) : 0;
          css(row, { opacity: on ? clamp(k * 3) * (1 - io) : 0, transform: `scale(${on ? (lerp(.4, 1, k) * (1 - .3 * io)).toFixed(4) : 0})` });
        });
      },
    };
  };

  // ===== video duvarı ("onlarca video"; sayı yazmaz): dikey video karoları (oynat simgesi, ilerleme çubuğu oynar) =====
  // t'de tek büyük karo (hero) alanın ortasında açılır; tMulti'de küçülüp kendi hücresine geçer, diğerleri ondan dışa doğru hızla çoğalır.
  // people: [{cells: [hücre..], t, stagger, ring}] -> o karolarda içerik üretici silüeti belirir (oynat simgesi söner), karo çerçevesi 'ring' rengine döner.
  // x,y,w,h: alan  cols, rows, gap  hero: hücre (vars. orta)  heroW: ilk genişlik  multDur: çoğalma süresi  seed  out (çıkışın bittiği an)
  // heroPlay: t -> tek karo "oynar" (hafif nefes alır, oynat düğmesi nabız atar, ilerleme çubuğu hızlanır; çoğalırken söner)
  const VW_THEMES = [['#2F6BFF', '#5DB3F0'], ['#E5383B', '#F59E7A'], ['#1FB766', '#7EE2A8'], ['#F59E0B', '#FFD23F'], ['#0EA5E9', '#7DD3FC'], ['#0B3568', '#2F6BFF'], ['#0F766E', '#5EEAD4']];
  const PERSON = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet"><circle cx="50" cy="38" r="19" fill="#fff"/><path d="M13 100c0-23 16-39 37-39s37 16 37 39z" fill="#fff"/></svg>`;
  L.videoWall = ({ x, y, w, h, cols = 5, rows = 3, gap = 18, t: t0, hero, heroW, tMulti = Infinity, multDur = .9, seed = 5, people = [], out = Infinity, themes = VW_THEMES, heroPlay }) => {
    const n = cols * rows, cw = (w - gap * (cols - 1)) / cols, ch = (h - gap * (rows - 1)) / rows;
    const tw = Math.min(cw, ch * 9 / 16), th = tw * 16 / 9, H0 = hero ?? (Math.floor(rows / 2) * cols + Math.floor(cols / 2));
    const R = rng(seed), cells = [...Array(n)].map((_, i) => {
      const cx = x + (i % cols) * (cw + gap) + cw / 2, cy = y + Math.floor(i / cols) * (ch + gap) + ch / 2;
      return { cx, cy, th: themes[(i * 3 + Math.floor(R() * 3)) % themes.length], ph: R() };
    });
    const hc = cells[H0], ax = x + w / 2, ay = y + h / 2, HS = (heroW ?? Math.min(w * .42, h * .6 * 9 / 16)) / tw;
    const others = cells.map((c, i) => [Math.hypot((c.cx - hc.cx) / cw, (c.cy - hc.cy) / ch) + .35 * R(), i]).filter(p => p[1] !== H0).sort((a, b) => a[0] - b[0]);
    const rank = []; others.forEach(([, i], k) => { rank[i] = k; });
    const pt = [], ring = [];
    people.forEach(g => (g.cells || []).forEach((ci, k) => { pt[ci] = g.t + k * (g.stagger ?? .07); ring[ci] = g.ring; }));
    return {
      html: `<div class="abs c-vwall">${cells.map((c, i) => `<div class="vwT" style="left:${(c.cx - tw / 2).toFixed(1)}px;top:${(c.cy - th / 2).toFixed(1)}px;width:${tw.toFixed(1)}px;height:${th.toFixed(1)}px;border-radius:${Math.round(tw * .12)}px;background:linear-gradient(165deg, ${c.th[1]}, ${c.th[0]})">
        <i class="vwTop" style="left:${Math.round(tw * .1)}px;top:${Math.round(tw * .1)}px;width:${Math.round(tw * .4)}px;height:${Math.round(tw * .07)}px"></i>
        ${pt[i] != null ? `<span class="vwP">${PERSON}</span>` : ''}
        <span class="vwPl" style="width:${Math.round(tw * .36)}px;height:${Math.round(tw * .36)}px">${I.play('#fff')}</span>
        <i class="vwPr" style="left:${Math.round(tw * .1)}px;right:${Math.round(tw * .1)}px;bottom:${Math.round(tw * .1)}px;height:${Math.max(4, Math.round(tw * .04))}px"><b></b></i></div>`).join('')}</div>`,
      render(t, r) {
        const el = r.firstChild, o = isFinite(out) ? E.inExpo(prog(t, out - .25, out)) : 0, mu = E.inOutCubic(prog(t, tMulti, tMulti + .45));
        css(el, { opacity: t >= t0 ? (1 - o).toFixed(4) : 0, transform: `scale(${(1 - .1 * o).toFixed(4)})`, transformOrigin: `${ax}px ${ay}px` });
        el.querySelectorAll('.vwT').forEach((tile, i) => {
          const c = cells[i];
          const hp = i === H0 && heroPlay != null && t >= heroPlay ? clamp((t - heroPlay) / .4) * (1 - mu) : 0;
          if (i === H0) {
            const br = 1 + .028 * hp * Math.sin(2 * Math.PI * 1.15 * (t - (heroPlay ?? 0)));
            const k = spring(t - t0, .6, 2.0), s = lerp(HS, 1, mu) * (t >= t0 ? lerp(.7, 1, clamp(k, 0, 1.1)) : 0) * br;
            css(tile, { opacity: t >= t0 ? clamp(k * 3) : 0, transform: `translate(${lerp(ax - c.cx, 0, mu).toFixed(1)}px,${lerp(ay - c.cy, 0, mu).toFixed(1)}px) scale(${s.toFixed(4)})` });
          } else {
            const ti = tMulti + .12 + multDur * rank[i] / Math.max(1, n - 2), k = spring(t - ti, .5, 3), on = t >= ti;
            css(tile, { opacity: on ? clamp(k * 3) : 0, transform: `scale(${on ? lerp(.3, 1, k).toFixed(4) : 0})` });
          }
          const pr = i === H0 && heroPlay != null && t >= heroPlay ? (heroPlay * .23 + c.ph + (t - heroPlay) * .55) : (t * .23 + c.ph);
          tile.querySelector('.vwPr b').style.transform = `scaleX(${(pr % 1).toFixed(4)})`;
          if (i === H0 && heroPlay != null) tile.querySelector('.vwPl').style.transform = `translate(-50%,-50%) scale(${(1 + .14 * hp * Math.max(0, Math.sin(2 * Math.PI * 1.15 * (t - heroPlay)))).toFixed(4)})`;
          if (pt[i] != null) {
            const on = t >= pt[i], pk = spring(t - pt[i], .55, 2.6);
            css(tile.querySelector('.vwP'), { opacity: on ? clamp(pk * 3) : 0, transform: `translateY(${on ? ((1 - clamp(pk, 0, 1.1)) * 30).toFixed(1) : 30}px) scale(${on ? lerp(.6, 1, clamp(pk, 0, 1.1)).toFixed(4) : .6})` });
            css(tile.querySelector('.vwPl'), { opacity: on ? (1 - clamp(pk * 2)).toFixed(3) : 1 });
            tile.style.boxShadow = on && ring[i] ? `0 14px 30px rgba(0,0,0,.4), 0 0 0 ${(6 * clamp(pk, 0, 1)).toFixed(1)}px ${ring[i]}` : '';
          }
        });
      },
    };
  };

  // ===== dünya noktaları (jenerik nokta haritası; ülke adı, bayrak, sayı yok): kıtalar kaba nokta ızgarası =====
  // t'de noktalar soldan sağa belirir; origin {c, r}: çıkış noktası (sarı, nabız); lit {a, b}: origin'den dışa dalgayla noktalar yanar;
  // marks: [{c, r, t}] -> o noktada yeşil tik rozeti çarpar, halka yayılır. x,y: sol-üst  w: genişlik (h = w * 21/48)  dot: nokta/aralık  markSize  out
  // Harita: 48 sütun (7.5° boylam) x 21 satır (~77K..51G); satır başına kara hücresi aralıkları.
  const WORLD = [[[8, 12], [15, 21], [37, 38]], [[2, 15], [16, 21], [26, 47]], [[2, 10], [14, 15], [17, 19], [21, 21], [24, 47]],
    [[3, 10], [14, 15], [18, 18], [23, 41], [45, 45]], [[7, 16], [23, 42], [44, 44]], [[7, 15], [24, 42]], [[8, 13], [22, 23], [25, 42]],
    [[8, 13], [22, 41]], [[9, 11], [13, 13], [22, 40]], [[10, 13], [21, 31], [33, 38], [40, 40]], [[12, 12], [21, 30], [34, 34], [37, 38], [40, 40]],
    [[13, 17], [22, 30], [34, 34], [37, 40]], [[13, 17], [25, 29], [37, 40]], [[13, 19], [25, 29], [38, 39], [41, 43]], [[13, 19], [25, 30], [41, 43]],
    [[14, 18], [25, 28], [30, 30], [40, 43]], [[14, 17], [26, 28], [39, 44]], [[14, 17], [26, 27], [39, 39], [42, 44]], [[14, 16], [42, 43], [47, 47]],
    [[14, 15], [46, 46]], [[14, 14]]];
  L.worldDots = ({ x, y, w = 880, t: t0, dot = .64, origin, lit, marks = [], markSize, out = Infinity, map = WORLD }) => {
    const NC = 48, p = w / NC, h = map.length * p, ms = markSize || Math.round(p * 2.7), pts = [];
    map.forEach((rg, r) => rg.forEach(([a, b]) => { for (let c = a; c <= b; c++) pts.push({ c, r }); }));
    const dist = q => origin ? Math.hypot(q.c - origin.c, (q.r - origin.r) * 1.15) : q.c;
    const maxD = Math.max(...pts.map(dist), 1);
    const P = q => [((q.c + .5) * p).toFixed(1), ((q.r + .5) * p).toFixed(1)];
    return {
      html: `<div class="abs c-world" style="left:${x}px;top:${y}px;width:${w}px;height:${h.toFixed(0)}px">
        <svg width="${w}" height="${h.toFixed(0)}" viewBox="0 0 ${w} ${h.toFixed(1)}">${pts.map(q => { const [px, py] = P(q); return `<circle class="wdD" cx="${px}" cy="${py}" r="${(p * dot / 2).toFixed(2)}"/>`; }).join('')}
          ${origin ? (() => { const [px, py] = P(origin); return `<circle class="wdO" cx="${px}" cy="${py}" r="${(p * .62).toFixed(1)}"/><circle class="wdOR" cx="${px}" cy="${py}" r="${p}"/>`; })() : ''}</svg>
        ${marks.map(m => { const [px, py] = P(m); return `<div class="wdM" style="left:${px}px;top:${py}px;width:${ms}px;height:${ms}px"><i class="wdMR"></i>${I.check()}</div>`; }).join('')}</div>`,
      render(t, r) {
        const el = r.firstChild, o = isFinite(out) ? E.inExpo(prog(t, out - .22, out)) : 0, k = spring(t - t0, .62, 2.0);
        css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0, transform: `scale(${t >= t0 ? (lerp(.92, 1, k) * (1 - .1 * o)).toFixed(4) : 0})` });
        const r0 = p * dot / 2;
        el.querySelectorAll('.wdD').forEach((d, i) => {
          const q = pts[i], ta = t0 + .55 * q.c / NC, ap = clamp((t - ta) / .22);
          const tl = lit ? lit.a + (lit.b - lit.a) * dist(q) / maxD : Infinity, lp = t >= tl ? clamp((t - tl) / .25) : 0, pulse = t >= tl ? Math.sin(Math.PI * prog(t, tl, tl + .45)) : 0;
          d.style.opacity = (ap * (.42 + .58 * lp)).toFixed(3);
          d.style.fill = lp > 0 ? mixRgb([255, 255, 255], [143, 208, 255], lp) : '#fff';
          d.setAttribute('r', (r0 * (1 + .55 * pulse)).toFixed(2));
        });
        if (origin) {
          const ot = origin.t ?? t0 + .35, ok = spring(t - ot, .5, 3), on = t >= ot, rp = on ? ((t - ot) % 1.1) / 1.1 : 0;
          const oc = el.querySelector('.wdO'), orr = el.querySelector('.wdOR');
          oc.style.opacity = on ? clamp(ok * 3) : 0; oc.setAttribute('r', (p * .62 * (on ? lerp(.3, 1, clamp(ok, 0, 1.2)) : 0)).toFixed(2));
          orr.setAttribute('r', (p * (.7 + 1.6 * E.outCubic(rp))).toFixed(2)); orr.style.opacity = on ? (.9 * (1 - rp)).toFixed(3) : 0;
        }
        el.querySelectorAll('.wdM').forEach((mk, i) => {
          const m = marks[i], on = t >= m.t, mk2 = spring(t - m.t, .45, 3.5), rp = on ? prog(t, m.t, m.t + .6) : 0;
          css(mk, { opacity: on ? clamp(mk2 * 3) : 0, transform: `translate(-50%,-50%) scale(${on ? lerp(1.8, 1, clamp(mk2, 0, 1.3)).toFixed(4) : 0})` });
          css(mk.querySelector('.wdMR'), { opacity: rp > 0 && rp < 1 ? (.9 * (1 - rp)).toFixed(3) : 0, transform: `scale(${lerp(1, 1.9, E.outCubic(rp)).toFixed(4)})` });
        });
      },
    };
  };

  // ===== uygulama telefonu (jenerik maket; gerçek logo / arayüz taklidi değil): koyu çerçeve, beyaz ekran, ekranda yalnız uygulama adı (yazı) =====
  // ad tTitle'da soldan yazılır; altında ikon kutucukları kendi anında pop. x,y,w,h  t (yerinde pop)  title  tTitle  titleSize  accent (hex)
  // tiles: [{icon, t, color}]  cols  lit (t: sarı halka)  out (çıkışın bittiği an)  rot
  L.phoneApp = ({ x, y, w, h, t: t0, title = '', tTitle, titleSize, accent = '#2F6BFF', tiles = [], cols = 2, lit, out = Infinity, rot = 0 }) => {
    const bz = Math.round(w * .045), R = Math.round(w * .14), fs = titleSize || Math.round(w * .14), iw = w - 2 * bz, ih = h - 2 * bz;
    const rowsN = Math.max(1, Math.ceil(tiles.length / cols)), gy0 = ih * .46, gh = ih * .48, g = Math.round(iw * .06);
    const ts = Math.floor(Math.min((iw * .78 - g * (cols - 1)) / cols, (gh - g * (rowsN - 1)) / rowsN)), gw = cols * ts + (cols - 1) * g;
    return {
      html: `<div class="abs c-papp" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${R}px">
        <div class="paScr" style="left:${bz}px;top:${bz}px;width:${iw}px;height:${ih}px;border-radius:${R - bz}px">
          <i class="paBar" style="height:${Math.round(ih * .075)}px;background:${accent}"></i>
          <div class="paTitle" style="top:${Math.round(ih * .2)}px;font-size:${fs}px"><span>${esc(title)}</span></div>
          <i class="paLine" style="top:${Math.round(ih * .2 + fs * 1.25)}px;width:${Math.round(iw * .3)}px;margin-left:${-Math.round(iw * .15)}px;background:${accent}"></i>
          ${tiles.map((tl, i) => `<span class="paTile" style="left:${((iw - gw) / 2 + (i % cols) * (ts + g)).toFixed(1)}px;top:${(gy0 + Math.floor(i / cols) * (ts + g)).toFixed(1)}px;width:${ts}px;height:${ts}px;border-radius:${Math.round(ts * .24)}px;background:${tl.color || accent}">${I[tl.icon] ? I[tl.icon]('#fff') : ''}</span>`).join('')}</div>
        <i class="paNotch" style="width:${Math.round(w * .3)}px;height:${Math.round(w * .07)}px;top:${bz + Math.round(w * .02)}px"></i><div class="paRing" style="border-radius:${R}px"></div></div>`,
      render(t, r) {
        const el = r.firstChild, q = s => el.querySelector(s), k = spring(t - t0, .6, 1.9), o = isFinite(out) ? E.inExpo(prog(t, out - .22, out)) : 0;
        const lp = lit != null && t >= lit ? prog(t, lit, lit + .8) : 0;
        css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0,
          transform: `scale(${t >= t0 ? (lerp(.8, 1, k) * (1 - .15 * o) * (1 + .03 * Math.sin(Math.PI * lp))).toFixed(4) : 0}) rotate(${rot}deg)` });
        const tl = tTitle ?? t0, tp = t >= tl ? E.outCubic(prog(t, tl, tl + .45)) : 0, tk = spring(t - tl, .5, 3);
        css(q('.paTitle span'), { clipPath: `inset(-30% ${(100 * (1 - tp)).toFixed(1)}% -30% 0)`, transform: `scale(${t >= tl ? lerp(1.15, 1, clamp(tk, 0, 1.2)).toFixed(4) : 1})` });
        css(q('.paLine'), { transform: `scaleX(${E.outCubic(prog(t, tl + .3, tl + .7)).toFixed(4)})` });
        el.querySelectorAll('.paTile').forEach((s, i) => { const ti = tiles[i].t, on = t >= ti, kk = spring(t - ti, .5, 3);
          css(s, { opacity: on ? clamp(kk * 3) : 0, transform: `scale(${on ? lerp(.3, 1, kk).toFixed(4) : 0})` }); });
        css(q('.paRing'), { opacity: lp > 0 && lp < 1 ? (.95 * (1 - lp)).toFixed(3) : 0, transform: `scale(${lerp(1, 1.06, E.outCubic(lp)).toFixed(4)})` });
      },
    };
  };

  // ===== döngü başlığı: L.headline + off -> vurgu satırı off'ta yumuşakça beyaza ve düz duruşa döner =====
  // (kapanışta başlık t=0'daki yerine döner, vurgu çarpar, sonra beyaza döner: son kare = ilk kare). hit.color hex olmalı (vars. sarı).
  // L.headline alanlarının hepsi + off, offDur
  // pulses: [{t, amt (vars. .04), dur (vars. .5), line (vars. hit.line)}] -> vuruştan önce satıra hafif ölçek nabzı (t=0 karesi değişmez; açılışta hareket)
  // underline: {t, y (başlık üstünden px), w, h, dur, color, hitColor} -> satırın altına ince çizgi ortadan çizilir; hit.t'de vurgu rengine döner
  L.loopHeadline = ({ off, offDur = .3, pulses = [], underline, ...o }) => {
    const h = L.headline(o), r0 = h.render, hit = o.hit, HC = hexRgb(hit && /^#/.test(hit.color || '') ? hit.color : '#FFD23F');
    const U = underline;
    if (U) h.html = h.html.replace(/<\/div>$/, `<i class="hlUl" style="top:${U.y}px;width:${U.w}px;height:${U.h ?? 10}px;margin-left:${-U.w / 2}px"></i></div>`);
    return Object.assign(h, { render(t, s) {
      r0(t, s);
      for (const p of pulses) {
        if (t < p.t || t >= p.t + (p.dur ?? .5) || (hit && t >= hit.t)) continue;
        const k = 1 + (p.amt ?? .04) * Math.sin(Math.PI * prog(t, p.t, p.t + (p.dur ?? .5))), ln = p.line ?? (hit ? hit.line : 0);
        s.qa('.w').forEach(el => { if (+el.dataset.l === ln) el.style.transform += ` scale(${k.toFixed(4)})`; });
      }
      if (U) {
        const ul = s.q('.hlUl'), dp = E.outCubic(prog(t, U.t, U.t + (U.dur ?? .4))), hc = hit && t >= hit.t ? E.outCubic(prog(t, hit.t, hit.t + .12)) : 0;
        css(ul, { opacity: t >= U.t ? 1 : 0, transform: `scaleX(${dp.toFixed(4)})`,
          background: mixRgb(hexRgb(U.color || '#FFFFFF'), hexRgb(U.hitColor || (hit && /^#/.test(hit.color || '') ? hit.color : '#FFD23F')), hc) });
      }
      if (!hit || off == null || t < off) return;
      const u = E.inOutCubic(prog(t, off, off + offDur));
      s.qa('.w').forEach((el, k) => { if (hit.words ? !hit.words.includes(k) : +el.dataset.l !== hit.line) return;   // v12: hit.words
        el.style.color = mixRgb(HC, [255, 255, 255], u);
        el.style.transform = `translateY(0px) scale(1) rotate(${lerp(-1.5, 0, u).toFixed(3)}deg)`;
        if (hit.bg && el.classList.contains('hlBox')) {                        // v12: kutu da söner (son kare = ilk kare)
          const bc = /^#/.test(hit.bg) ? hexRgb(hit.bg) : null;
          css(el, { background: bc ? `rgba(${bc.join(',')},${(1 - u).toFixed(3)})` : u < .5 ? hit.bg : 'transparent',
            boxShadow: u < 1 ? `0 .1em .34em rgba(0,0,0,${(.4 * (1 - u)).toFixed(3)})` : 'none',
            webkitTextStroke: u < 1 ? `${(4 * u).toFixed(2)}px rgba(11,31,51,.85)` : '' }); }   // kontur yumuşakça geri gelir (.c-head .w: 4px)
      });
    } });
  };

  // ===== yorum balonu (CTA, "yorum yazın"): beyaz konuşma balonu "yazıyor…" üç noktasıyla açılır; tText'te noktalar söner, =====
  // balon genişler, metin (videoda söylenen soru) soldan yazılır. x,y: sol-üst  size: balon yüksekliği  text  t  tText  tail: 'left'|'right'
  // fs: punto (vars. size * .42)  out (çıkışın bittiği an)
  L.commentBubble = ({ x, y, size = 100, text = '', t: t0, tText, tail = 'left', fs, out = Infinity }) => {
    const f = fs || Math.round(size * .42), dw = Math.round(size * 1.9), dot = Math.round(size * .17), pad = Math.round(size * .42);
    return {
      html: `<div class="abs c-cbub ${tail}" style="left:${x}px;top:${y}px;height:${size}px;border-radius:${Math.round(size / 2)}px">
        <i class="cbTail" style="width:${Math.round(size * .32)}px;height:${Math.round(size * .32)}px"></i>
        <span class="cbDots" style="width:${dw}px;gap:${Math.round(size * .15)}px">${[0, 1, 2].map(() => `<b style="width:${dot}px;height:${dot}px"></b>`).join('')}</span>
        <span class="cbTx" style="font-size:${f}px;padding:0 ${pad}px">${esc(text)}</span></div>`,
      render(t, r) {
        const el = r.firstChild, tx = el.querySelector('.cbTx'), k = spring(t - t0, .55, 2.6), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
        const tt = tText ?? t0 + .8, wp = E.outCubic(prog(t, tt, tt + .32)), tw = tx.offsetWidth;
        css(el, { width: `${lerp(dw, Math.max(dw, tw), wp).toFixed(1)}px`, opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0,
          transform: `scale(${t >= t0 ? (lerp(.3, 1, k) * (1 - .3 * o)).toFixed(4) : 0})` });
        css(el.querySelector('.cbDots'), { opacity: (1 - clamp((t - tt) / .15)).toFixed(3) });
        el.querySelectorAll('.cbDots b').forEach((d, i) => { const ph = Math.sin((t - t0 - .2) * Math.PI * 2 * 1.5 - i * .9);
          d.style.transform = `translateY(${(t > t0 + .2 ? -Math.max(0, ph) * size * .1 : 0).toFixed(1)}px)`; d.style.opacity = (t > t0 + .2 ? .45 + .55 * Math.max(0, ph) : .45).toFixed(3); });
        css(tx, { clipPath: `inset(-20% ${(100 * (1 - E.outCubic(prog(t, tt + .12, tt + .62)))).toFixed(1)}% -20% 0)` });
      },
    };
  };

  // ===== döngü donması: L.freezeFace + undo -> kararma, bulanıklık ve yakınlaşma sonda geri alınır (son kare t=0 kadar net) =====
  // L.freezeFace alanlarının hepsi + undo: {t, dur}. Kadraj canlı motordan kopyalanır (kapanışta kart -> tam ekran geçişi de izlenir).
  L.freezeLoop = ({ undo, ...o }) => {
    const f = L.freezeFace(o), r0 = f.render, { t: t0, dim = .3, blur = 4, dur = .35 } = o;
    return Object.assign(f, { render(t, r) {
      r0(t, r);
      if (!undo || t < t0) return;
      const k = E.inOutCubic(prog(t, t0, t0 + dur)) * (1 - E.inOutCubic(prog(t, undo.t, undo.t + (undo.dur ?? .3))));
      css(r.firstChild.firstChild, { transform: `${document.getElementById('face').style.transform} scale(${(1 + .03 * k).toFixed(4)})`,
        filter: `blur(${(blur * k).toFixed(2)}px) brightness(${(1 - dim * k).toFixed(3)})` });
    } });
  };

  // ===================== v9: DERİNLİK / STÜDYO bileşenleri (V.matte, kişi kesiti; ornekler/derinlik-studyo) =====================
  // Grafikler kişinin ARKASINDAN çıkar: L.scene({layer:'behind'}) + L.emerge (kafanın/omzun arkasından kayarak/yükselerek gelir, geri batarak çıkar).
  // Logolar resmî SVG dosyalarıdır (src: proje sayfasına göre yol, ör. '../../assets/logos/gemini.svg'); yalnızca modeli tanıtır (onay/sponsor değil).
  // Yalnızca yeni adlar eklenir; mevcut bileşen, ikon ve stiller değişmez (mevcut varsayılanlar korunur).
  // src: yol ya da {src, bg, pad} (ör. koyu daire + beyaz simge); o.pad / o.bg verilirse onlar geçerli
  const lgDisc = (src, size, o = {}) => { const L0 = typeof src === 'object' && src ? src : { src }, pad = o.pad ?? L0.pad ?? .2, bg = o.bg ?? L0.bg, iw = Math.round(size * (1 - 2 * pad));
    return `<span class="lgDisc" style="width:${size}px;height:${size}px;${bg ? `background:${bg};` : ''}${o.ring ? `box-shadow:0 0 0 ${o.ring}px rgba(255,255,255,.9),0 10px 26px rgba(0,0,0,.35);` : ''}"><img src="${L0.src}" alt="" style="width:${iw}px;height:${iw}px"></span>`; };
  L.lgDisc = lgDisc;

  // ===== arkasından çıkış sarmalayıcısı: içindeki parçalar t'de 'from' konumundan (kişinin arkası: kafa/omuz) yayla yerine gelir; =====
  // out'ta (çıkışın bittiği an) 'to' konumuna (vars. from: geri batar) ease-in ile döner ve kaybolur.
  // from/to: {x, y (kayma px), s (ölçek), r (derece), o (opaklık)}  origin: ölçek merkezi  zeta, f: yay  outDur  fade: girişte opaklık süresi (yay oranı)
  // at: girişten sonraki durum (vars. yerinde); steps: [{t, x, y, s, r, o, zeta, f}] sonraki yay hareketleri (ör. önce omzun üstünde küçük bekler, sonra yükselir)
  L.emerge = ({ parts = [], t: t0, from = {}, at, steps = [], to, zeta = .74, f = 1.7, out = Infinity, outDur = .35, origin = { x: 540, y: 960 }, fade = .34 }) => ({
    html: `<div class="abs c-emerge" style="transform-origin:${origin.x}px ${origin.y}px">${parts.map(p => `<div class="part">${p.html}</div>`).join('')}</div>`,
    render(t, r) {
      const g = r.firstChild; if (!g._roots) g._roots = [...g.children];
      const on = t >= t0 && !(isFinite(out) && t >= out);
      vis(g, on); if (!on) return;
      const F = Object.assign({ x: 0, y: 0, s: 1, r: 0, o: 1 }, from), A = Object.assign({ x: 0, y: 0, s: 1, r: 0, o: 1 }, at || {}), k = spring(t - t0, zeta, f);
      let st = { x: lerp(F.x, A.x, k), y: lerp(F.y, A.y, k), s: lerp(F.s, A.s, k), r: lerp(F.r, A.r, k), o: lerp(F.o, A.o, clamp(k / Math.max(.01, fade))) };
      for (const S of steps) { if (t < S.t) break; const u = spring(t - S.t, S.zeta ?? zeta, S.f ?? f);
        for (const q of ['x', 'y', 's', 'r', 'o']) if (S[q] != null) st[q] = lerp(st[q], S[q], q === 'o' ? clamp(u) : u); }
      if (isFinite(out)) {
        const u = E.inCubic(prog(t, out - outDur, out)), Tt = Object.assign({}, F, to || {});
        st = { x: lerp(st.x, Tt.x, u), y: lerp(st.y, Tt.y, u), s: lerp(st.s, Tt.s, u), r: lerp(st.r, Tt.r, u), o: lerp(st.o, Tt.o ?? 1, u) };
      }
      css(g, { opacity: clamp(st.o).toFixed(4), transform: T(st.x, st.y, st.s, st.r) });
      parts.forEach((p, i) => p.render && p.render(t, g._roots[i]));
    },
  });

  // ===== logolu kart (model kartı): koyu cam kart, solda logo dairesi (ya da L.I ikon), ad + alt satır; isteğe bağlı üst etiket =====
  // x,y,w,h  logo (src) | icon  name  sub  kicker (küçük üst etiket)  nameSize  subSize  accent (sol kenar çizgisi rengi)  lit: t (kenar sarı yanar)
  // iconBg: ikon dairesinin rengi ('green'|'red'|'blue' ya da CSS; verilirse ikon beyaz çizilir, vars. sarı daire + koyu ikon)
  L.logoCard = ({ x, y, w = 460, h = 150, logo, icon, iconBg, name = '', sub = '', kicker = '', nameSize, subSize, accent, lit, logoPad }) => {
    const d = Math.round(h * .66), ns = nameSize || Math.round(h * .3), ss = subSize || Math.round(h * .2);
    const ib = iconBg ? ({ green: 'var(--green)', red: 'var(--red)', blue: 'var(--blue)' }[iconBg] || iconBg) : null;
    return {
      html: `<div class="abs c-lcard" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${Math.round(h * .22)}px;padding:0 ${Math.round(h * .2)}px;gap:${Math.round(h * .16)}px">
        ${accent ? `<i class="lcAcc" style="background:${accent}"></i>` : ''}
        ${logo ? lgDisc(logo, d, { pad: logoPad }) : icon ? `<span class="lgDisc lcIc" style="width:${d}px;height:${d}px${ib ? `;background:${ib}` : ''}">${I[icon](ib ? '#fff' : '#0B1F33')}</span>` : ''}
        <span class="lcTx">${kicker ? `<b class="lcK" style="font-size:${Math.round(ss * .82)}px">${esc(kicker)}</b>` : ''}<b class="lcN" style="font-size:${ns}px">${esc(name)}</b>${sub ? `<b class="lcS" style="font-size:${ss}px">${esc(sub)}</b>` : ''}</span>
        ${lit != null ? '<i class="lcLit"></i>' : ''}</div>`,
      render(t, r) { if (lit != null) { const k = t >= lit ? spring(t - lit, .6, 2.4) : 0; css(r.querySelector('.lcLit'), { opacity: clamp(k * 2).toFixed(3) }); } },
    };
  };

  // ===== sütun grafik (puan karşılaştırma): sütunlar taban çizgisinden yükselir (kişinin omzunun arkasından), tepede logo + değer =====
  // x (ilk sütunun solu), base (taban y), w, gap, scale (px / birim; 0'dan başlar, dürüst ölçek)  bars: [{value, text (gösterilen değer), name, logo, color, t}]
  // dur: yükselme  labelSize  logoSize  nameSize (sütun içinde dikey ad)  out (çıkışın bittiği an: sütunlar tabana iner)
  L.columns = ({ x, base, w = 130, gap = 26, scale, bars = [], dur = .8, labelSize = 50, logoSize = 72, nameSize = 28, out = Infinity, outDur = .35 }) => ({
    html: `<div class="abs c-cols">${bars.map((b, i) => `<div class="colB" style="left:${x + i * (w + gap)}px;width:${w}px;background:${b.color || 'var(--sky)'}">
        ${b.name ? `<span class="colN" style="font-size:${nameSize}px">${esc(b.name)}</span>` : ''}</div>
      <div class="colL" style="left:${x + i * (w + gap)}px;width:${w}px">${b.logo ? lgDisc(b.logo, logoSize, { pad: b.logoPad }) : ''}<b style="font-size:${labelSize}px">${esc(b.text ?? String(b.value))}</b></div>`).join('')}</div>`,
    render(t, r) {
      const cols = r.querySelectorAll('.colB'), labs = r.querySelectorAll('.colL');
      const o = isFinite(out) ? E.inCubic(prog(t, out - outDur, out)) : 0;
      bars.forEach((b, i) => {
        const on = t >= b.t, k = on ? clamp(spring(t - b.t, .86, 1.5 / dur), 0, 1.02) * (1 - o) : 0, H = b.value * scale * k;
        css(cols[i], { opacity: on && k > .001 ? 1 : 0, top: (base - H).toFixed(1) + 'px', height: H.toFixed(1) + 'px' });
        const lk = on ? spring(t - b.t - dur * .55, .55, 2.8) : 0;
        css(labs[i], { opacity: (clamp(lk * 3) * (1 - o)).toFixed(3), transform: `translateY(${(base - H - 12).toFixed(1)}px) translateY(-100%) scale(${lerp(.5, 1, clamp(lk, 0, 1.2)).toFixed(4)})` });
      });
    },
  });

  // ===== segmentli seçici / kaydırıcı ('Efor: ORTA'): koyu hap; solda etiket, sağda seçenekler; sarı topuz t'de baştan tPick'te 'pick'e kayar =====
  // x,y (sol-üst), w  label  options:['Düşük','Orta','Yüksek']  pick (indeks)  t  tPick  size  out
  L.segmented = ({ x, y, w = 820, label = '', icon, options = [], pick = 0, t: t0, tPick, size = 36, out = Infinity }) => {
    const h = Math.round(size * 2.6), lw = label ? Math.round(size * (label.length * .62 + 1.6)) + (icon ? size * 1.3 : 0) : 0, pad = Math.round(size * .3);
    const tw = w - lw - pad * 2, ow = tw / Math.max(1, options.length);
    return {
      html: `<div class="abs c-seg" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${h / 2}px">
        ${label ? `<span class="sgL" style="width:${lw}px;font-size:${size}px">${icon ? I[icon]('#FFD23F') : ''}${esc(label)}</span>` : ''}
        <span class="sgT" style="left:${lw + pad}px;top:${pad}px;width:${tw}px;height:${h - pad * 2}px;border-radius:${(h - pad * 2) / 2}px">
          <i class="sgK" style="width:${ow}px;border-radius:${(h - pad * 2) / 2}px"></i>
          ${options.map((op, i) => `<b class="sgO" style="left:${i * ow}px;width:${ow}px;font-size:${Math.round(size * .9)}px">${esc(op)}</b>`).join('')}</span></div>`,
      render(t, r) {
        const el = r.firstChild, k = spring(t - t0, .62, 2.2), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
        css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0, transform: `scale(${t >= t0 ? lerp(.7, 1, k) : 0})` });
        const pk = tPick != null && t >= tPick ? spring(t - tPick, .7, 2.2) : 0;
        css(el.querySelector('.sgK'), { opacity: clamp(pk * 4).toFixed(3), transform: `translateX(${(lerp(0, pick * ow, pk)).toFixed(1)}px)` });
        el.querySelectorAll('.sgO').forEach((b, i) => { b.classList.toggle('on', i === pick && pk > .6); });
      },
    };
  };

  // ===== prompt penceresi: koyu sohbet penceresi; başlık + alıcı logoları (tLogos'ta sırayla), kullanıcı balonuna metin harf harf yazılır =====
  // (typeA..typeB, yanıp sönen imleç); marks: [{text, t}] metnin bir parçası konuşulunca sarı fosforla işaretlenir;
  // rows: [{icon:'check'|'x'|'file', text, tag, t}] şart satırları kendi anında yerinde pop (yeşil tik / kırmızı çarpı / dosya)
  // x,y (sol-üst), w  title  logos:[src]  textSize  rowSize  t  out
  L.promptBox = ({ x, y, w = 900, title = 'Prompt', logos = [], tLogos, logoSize = 64, text = '', typeA, typeB, marks = [], rows = [], textSize = 46, rowSize = 40, t: t0, out = Infinity }) => {
    let html = esc(text); const mk = [];
    marks.forEach((m, i) => { const at = html.indexOf(esc(m.text)); if (at >= 0) { mk.push(m); html = html.slice(0, at) + `<span class="pbM" data-m="${mk.length - 1}">` + esc(m.text) + '</span>' + html.slice(at + esc(m.text).length); } });
    // harf harf: metin düğümlerini <i> karakterlerine böl (işaret span'ları korunur)
    const chars = h => h.replace(/(<[^>]+>)|(&amp;|&lt;|[^<])/g, (all, tag, ch) => tag ? tag : `<i class="pbC">${ch}</i>`);
    const RI = { check: ['#1FB766', I.check('#fff')], x: ['#E5383B', I.x('#fff')], file: ['#2F6BFF', I.code('#fff')] };
    return {
      html: `<div class="abs c-pbox" style="left:${x}px;top:${y}px;width:${w}px">
        <div class="pbBar">${dots}<b class="pbTi">${esc(title)}</b><span class="pbLg">${logos.map(l => `<span class="pbL">${lgDisc(l, logoSize, { pad: .18 })}</span>`).join('')}</span></div>
        <div class="pbBody"><div class="pbBub" style="font-size:${textSize}px">${chars(html)}<i class="pbCar"></i></div>
        ${rows.map(rw => `<div class="pbRow" style="font-size:${rowSize}px"><span class="pbIc" style="width:${Math.round(rowSize * 1.55)}px;height:${Math.round(rowSize * 1.55)}px;background:${(RI[rw.icon] || RI.check)[0]}">${(RI[rw.icon] || RI.check)[1]}</span><b>${esc(rw.text)}</b>${rw.tag ? `<code style="font-size:${Math.round(rowSize * .78)}px">${esc(rw.tag)}</code>` : ''}</div>`).join('')}</div></div>`,
      render(t, r) {
        const el = r.firstChild, k = spring(t - t0, .66, 2.0), o = isFinite(out) ? E.inExpo(prog(t, out - .22, out)) : 0;
        css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0, transform: `scale(${t >= t0 ? lerp(.82, 1, k) * (1 - .1 * o) : 0})` });
        el.querySelectorAll('.pbL').forEach((l, i) => { const tl = (tLogos ?? t0) + i * .1, lk = spring(t - tl, .5, 3);
          css(l, { opacity: t >= tl ? clamp(lk * 3) : 0, transform: `scale(${t >= tl ? lerp(.3, 1, lk) : 0})` }); });
        // balon yazım başlarken açılır ve yazıldıkça büyür (yazılmamış harfler yer kaplamaz); imleç son harfin hemen ardında
        const cs = el.querySelectorAll('.pbC'), n = cs.length, a = typeA ?? t0, b = typeB ?? a + n * .04;
        const shown = Math.floor(n * clamp(prog(t, a, b)) + 1e-6);
        cs.forEach((c, i) => { c.style.display = i < shown ? '' : 'none'; });
        const bub = el.querySelector('.pbBub'), bk = spring(t - (a - .12), .6, 2.6);
        css(bub, { opacity: t >= a - .12 ? clamp(bk * 3) : 0, transform: `scale(${t >= a - .12 ? lerp(.6, 1, clamp(bk, 0, 1.15)).toFixed(4) : .6})`,
          display: t >= a - .12 ? '' : 'none' });
        const car = el.querySelector('.pbCar'), typing = t >= a - .12 && t < b + .6;
        car.style.opacity = typing && (t < b || Math.floor((t - b) * 2.5) % 2 === 0) ? 1 : 0;
        el.querySelectorAll('.pbM').forEach(m => { const mm = mk[+m.dataset.m], u = t >= mm.t ? E.outCubic(prog(t, mm.t, mm.t + .35)) : 0;
          m.style.backgroundSize = `${(100 * u).toFixed(1)}% 100%`; });
        el.querySelectorAll('.pbRow').forEach((rw, i) => { const tr = rows[i].t, rk = spring(t - tr, .55, 2.8);
          css(rw, { opacity: t >= tr ? clamp(rk * 3) : 0, transform: `translateX(${t >= tr ? ((1 - clamp(rk, 0, 1.2)) * -30).toFixed(1) : 0}px) scale(${t >= tr ? lerp(.85, 1, clamp(rk, 0, 1.2)).toFixed(4) : 0})` });
          const ic = rw.querySelector('.pbIc'), ik = spring(t - tr - .08, .45, 3.4);
          css(ic, { transform: `scale(${t >= tr + .08 ? lerp(1.7, 1, clamp(ik, 0, 1.3)).toFixed(4) : .6}) rotate(${t >= tr + .08 ? lerp(-20, 0, clamp(ik)).toFixed(2) : -20}deg)` }); });
      },
    };
  };

  // ===== site penceresi: tarayıcı çerçevesinde gerçek site görüntüsü (tam sayfa PNG) yumuşakça kayar; sekmede logo + ad =====
  // x,y,w,h  src, imgW, imgH (doğal boyut)  logo  tab  t (yerinde pop)  scroll: [{a, b, to (px, ölçeklenmiş görüntüde)}]  out  enter: {s, dy}
  // moves (isteğe bağlı): [{a, b, x, y, w, h, s, o, ease}] -> pencere dikdörtgeni / ölçeği / opaklığı a..b arasında yumuşakça değişir
  // (ör. yığından öne çıkıp büyür; diğerleri geri çekilip söner). İçerik genişliği pencereyle birlikte ölçeklenir, kaydırma oranı korunur.
  L.siteWindow = ({ x, y, w, h, src, imgW = 1440, imgH = 900, logo, logoPad, tab = '', t: t0, scroll = [], out = Infinity, enter = { s: .7, dy: 0 }, barH, moves = [] }) => {
    const bh = barH || Math.max(44, Math.round(w * .075)), sh = imgH * w / imgW;
    return {
      html: `<div class="abs c-swin" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
        <div class="swBar" style="height:${bh}px">${dots}<span class="swTab" style="height:${Math.round(bh * .74)}px;font-size:${Math.round(bh * .38)}px">${logo ? lgDisc(logo, Math.round(bh * .56), { pad: logoPad ?? .14 }) : ''}<b>${esc(tab)}</b></span></div>
        <div class="swView" style="top:${bh}px"><img data-safe="ignore" src="${src}" alt="" style="width:${w}px;height:${sh.toFixed(1)}px"></div></div>`,
      render(t, r) {
        const el = r.firstChild, k = spring(t - t0, .62, 2.0), o = isFinite(out) ? E.inExpo(prog(t, out - .22, out)) : 0;
        let st = { x, y, w, h, s: 1, o: 1 };
        for (const m of moves) { const u = (E[m.ease] || E.inOutCubic)(prog(t, m.a, m.b)), nx = {};
          for (const q in st) nx[q] = m[q] == null ? st[q] : lerp(st[q], m[q], u); st = nx; }
        if (moves.length) { css(el, { left: st.x.toFixed(1) + 'px', top: st.y.toFixed(1) + 'px', width: st.w.toFixed(1) + 'px', height: st.h.toFixed(1) + 'px' });
          el.querySelector('.swView img').style.width = st.w.toFixed(1) + 'px'; el.querySelector('.swView img').style.height = (imgH * st.w / imgW).toFixed(1) + 'px'; }
        css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) * clamp(st.o) : 0, transform: `translateY(${t >= t0 ? ((1 - clamp(k, 0, 1.2)) * (enter.dy || 0)).toFixed(1) : 0}px) scale(${t >= t0 ? (lerp(enter.s ?? .7, 1, k) * (1 - .15 * o) * st.s).toFixed(4) : 0})` });
        let yy = 0; for (const sc of scroll) yy = lerp(yy, sc.to, E.inOutCubic(prog(t, sc.a, sc.b)));
        el.querySelector('.swView img').style.transform = `translateY(${(-yy * st.w / w).toFixed(1)}px)`;
      },
    };
  };

  // ===== tam ekran site (arka plan): gerçek site görüntüsü ekranı kaplar ve kayar; girişte alttan silme (yerinde açılır) =====
  // src, imgW, imgH  t (giriş), dur  scroll: [{a, b, to (px), ease}]  dim (0..1 kararma)  out (çıkışın bittiği an; yerinde söner), outDur
  // görüntü zemin sayılır (data-safe=ignore); üstündeki yazılar ayrı bileşenlerle güvenli alanda kalır
  L.fullSite = ({ src, imgW = 860, imgH, t: t0, dur = .32, scroll = [], dim = 0, out = Infinity, outDur = .25, W: Wd = 1080, H: Hd = 1920 }) => {
    const sh = imgH * Wd / imgW;
    return {
      html: `<div class="abs c-fsite" data-safe="ignore" style="left:0;top:0;width:${Wd}px;height:${Hd}px"><img data-safe="ignore" src="${src}" alt="" style="width:${Wd}px;height:${sh.toFixed(1)}px"><i class="fsDim" data-safe="ignore" style="opacity:${dim}"></i></div>`,
      render(t, r) {
        const el = r.firstChild, on = t >= t0 && !(isFinite(out) && t >= out);
        vis(el, on); if (!on) return;
        const w = E.outCubic(prog(t, t0, t0 + dur)), o = isFinite(out) ? E.inCubic(prog(t, out - outDur, out)) : 0;
        css(el, { clipPath: `inset(${(100 * (1 - w)).toFixed(2)}% 0 0 0)`, opacity: (1 - o).toFixed(4) });
        let yy = 0; for (const sc of scroll) yy = lerp(yy, sc.to, (E[sc.ease] || E.inOutCubic)(prog(t, sc.a, sc.b)));
        el.firstChild.style.transform = `translateY(${(-Math.min(yy, sh - Hd)).toFixed(1)}px)`;
      },
    };
  };

  // ===== logolu hap: [logo dairesi] metin [ikon]; yerinde pop (t < 0: t=0'da hazır), isteğe bağlı nabız =====
  // x,y (anchor'a göre), logo, icon (L.I, sağda), text, size, style: 'white'|'dark'|'yellow', anchor: 'center'|'left', t, out, pulse: {t, amt}
  L.logoPill = ({ x, y, logo, logoPad, icon, iconLeft, text = '', size = 40, style = 'white', anchor = 'center', t: t0 = -1, out = Infinity, pulse, from = .4 }) => {
    const h = Math.round(size * 2.1), ink = style === 'dark' ? '#fff' : '#0B1F33';
    return {
      html: `<div class="abs c-lpill ${style} ${anchor}" style="left:${x}px;top:${y}px;height:${h}px;font-size:${size}px;padding:0 ${Math.round(size * .7)}px 0 ${logo || iconLeft ? Math.round(h * .12) : Math.round(size * .7)}px;gap:${Math.round(size * .32)}px">
        ${logo ? lgDisc(logo, Math.round(h * .76), { pad: logoPad ?? .16 }) : ''}${iconLeft ? `<span class="lpI">${I[iconLeft](ink)}</span>` : ''}<b>${esc(text)}</b>${icon ? `<span class="lpI">${I[icon](ink)}</span>` : ''}</div>`,
      render(t, r) {
        const el = r.firstChild, k = t0 < 0 ? 1 : spring(t - t0, .5, 3), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
        let s = t >= t0 ? lerp(from, 1, k) * (1 - .5 * o) : 0;
        if (pulse && t >= pulse.t && t < pulse.t + (pulse.dur ?? .5)) s *= 1 + (pulse.amt ?? .08) * Math.sin(Math.PI * prog(t, pulse.t, pulse.t + (pulse.dur ?? .5)));
        css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0, transform: `${anchor === 'center' ? 'translate(-50%,-50%) ' : 'translateY(-50%) '}scale(${s.toFixed(4)})` });
      },
    };
  };

  // ===== anket kartı (yorumlardaki ankete çağrı): beyaz kart, başlık, logolu seçenekler (boş seçim dairesi; sonuç/sayı YOK), =====
  // altta sarı hap + zıplayan aşağı ok. x,y (sol-üst), w  title  options: [{logo, text, t}]  foot: {text, t}  size  t  out
  L.pollCard = ({ x, y, w = 820, title = '', options = [], foot, size = 40, t: t0, out = Infinity }) => {
    const rh = Math.round(size * 2.3);
    return {
      html: `<div class="abs c-poll" style="left:${x}px;top:${y}px;width:${w}px;padding:${Math.round(size * .8)}px ${Math.round(size * .7)}px">
        <div class="poT" style="font-size:${Math.round(size * 1.2)}px">${esc(title)}</div>
        ${options.map(op => `<div class="poO" style="height:${rh}px;font-size:${size}px;border-radius:${Math.round(rh * .3)}px;padding:0 ${Math.round(size * .5)}px 0 ${Math.round(rh * .14)}px">${lgDisc(op.logo, Math.round(rh * .74), { pad: op.logoPad ?? .16 })}<b>${esc(op.text)}</b><i class="poR" style="width:${Math.round(size * .9)}px;height:${Math.round(size * .9)}px"></i></div>`).join('')}
        ${foot ? `<div class="poF" style="font-size:${Math.round(size * .9)}px"><span>${esc(foot.text)}</span><i class="poA">${I.arrowDown('#0B1F33')}</i></div>` : ''}</div>`,
      render(t, r) {
        const el = r.firstChild, k = spring(t - t0, .62, 2.0), o = isFinite(out) ? E.inExpo(prog(t, out - .22, out)) : 0;
        css(el, { opacity: t >= t0 ? clamp(k * 3) * (1 - o) : 0 });
        el.querySelectorAll('.poO').forEach((rw, i) => { const tr = options[i].t ?? t0, rk = spring(t - tr, .55, 2.8);
          css(rw, { opacity: t >= tr ? clamp(rk * 3) : 0, transform: `scale(${t >= tr ? lerp(.7, 1, clamp(rk, 0, 1.2)).toFixed(4) : 0})` }); });
        if (foot) { const f = el.querySelector('.poF'), fk = spring(t - foot.t, .5, 3), fh = Math.round(size * .9 * 1.25 + 28);
          // hap yeri kendi anında açılır (kart aşağı doğru uzar); öncesinde kartın altında boşluk kalmaz
          css(f, { opacity: t >= foot.t ? clamp(fk * 3) : 0, transform: `scale(${t >= foot.t ? lerp(.4, 1, fk).toFixed(4) : 0})`,
            height: `${(fh * E.outCubic(prog(t, foot.t - .12, foot.t + .14))).toFixed(1)}px`, marginTop: `${(8 * E.outCubic(prog(t, foot.t - .12, foot.t + .14)) - 18 * (1 - E.outCubic(prog(t, foot.t - .12, foot.t + .14)))).toFixed(1)}px` });
          const b = t >= foot.t + .3 ? Math.abs(Math.sin((t - foot.t - .3) * Math.PI * 2.2)) * Math.max(0, 1 - (t - foot.t - .3) / 2.4) : 0;
          f.querySelector('.poA').style.transform = `translateY(${(b * size * .3).toFixed(1)}px)`; }
      },
    };
  };

  // ===== boş yer (yer tutucu): kesik çizgili yuvarlak dikdörtgen t'de belirir, 'out'ta (kartı gelince) söner; gelecek kartların yerini gösterir =====
  L.slot = ({ x, y, w, h, r = 30, t: t0, out = Infinity, color = 'rgba(255,255,255,.32)' }) => ({
    html: `<div class="abs c-slot" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${r}px;border-color:${color}"></div>`,
    render(t, el) { const k = spring(t - t0, .7, 2.2), o = isFinite(out) ? E.inCubic(prog(t, out - .15, out)) : 0;
      css(el.firstChild, { opacity: t >= t0 ? (clamp(k * 2) * (1 - o)).toFixed(3) : 0, transform: `scale(${t >= t0 ? lerp(.92, 1, clamp(k)).toFixed(4) : 1})` }); },
  });

  // ===== ışık süpürmesi: yumuşak çapraz ışık bandı ekranı t..t+dur arasında soldan sağa geçer (geçiş / kesim örtüsü; flaş değil) =====
  // angle (derece), width (bant genişliği, ekran oranı), a (tepe opaklık), color (rgb)
  L.lightSweep = ({ t: t0, dur = .5, angle = 18, width = .38, a = .2, color = '255,255,255' }) => ({
    html: `<div class="abs c-sweep" data-safe="ignore" style="left:0;top:0;width:var(--W,1080px);height:var(--H,1920px);overflow:hidden"><i data-safe="ignore" style="position:absolute;left:-50%;top:-25%;width:${(width * 100).toFixed(1)}%;height:150%;transform-origin:50% 50%;background:linear-gradient(90deg, rgba(${color},0) 0%, rgba(${color},1) 50%, rgba(${color},0) 100%)"></i></div>`,
    render(t, r) {
      const el = r.firstChild, on = t >= t0 && t < t0 + dur; vis(el, on); if (!on) return;
      const u = E.inOutCubic(prog(t, t0, t0 + dur)), band = el.firstChild;
      css(band, { opacity: (a * Math.sin(Math.PI * prog(t, t0, t0 + dur))).toFixed(4), transform: `translateX(${lerp(-30, 290, u).toFixed(1)}%) rotate(${angle}deg)` });
    },
  });

  // ===== çerçeve halkası (vurgu): bir pencerenin / kartın çevresinde ince renkli çerçeve + yumuşak parıltı; t'de çizilir gibi belirir =====
  // x,y,w,h (çerçevenin dış kutusu), r (köşe), width (çizgi), color, glow (parıltı yarıçapı px), t, out
  // from: giriş ölçeği (vars. 1.025; kenar güvenli alana yakınsa 1)
  L.frameRing = ({ x, y, w, h, r = 26, width = 4, color = '#E8C25A', glow = 26, t: t0, out = Infinity, from = 1.025 }) => ({
    html: `<div class="abs c-fring" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${r}px;border:${width}px solid ${color};box-shadow:0 0 ${glow}px ${color}88, inset 0 0 ${Math.round(glow * .6)}px ${color}44"></div>`,
    render(t, el) { const k = E.outCubic(prog(t, t0, t0 + .45)), o = isFinite(out) ? E.inCubic(prog(t, out - .25, out)) : 0;
      css(el.firstChild, { opacity: t >= t0 ? (k * (1 - o)).toFixed(3) : 0, transform: `scale(${(lerp(from, 1, k)).toFixed(4)})` }); },
  });

  // ===== koyu perde (tam ekran zemin): sahne arkası kararma / vurgu anı; yerinde söner. bg: CSS arka plan =====
  L.backdrop = ({ t: t0, out = Infinity, fade = .15, outDur = .3, bg = 'radial-gradient(90% 60% at 50% 42%, #142238 0%, #070B14 70%)' }) => ({
    html: `<div class="abs c-bdrop" data-safe="ignore" style="left:0;top:0;width:var(--W,1080px);height:var(--H,1920px);background:${bg}"></div>`,
    render(t, r) { const o = isFinite(out) ? E.inCubic(prog(t, out - outDur, out)) : 0;
      r.firstChild.style.opacity = (t >= t0 ? E.outCubic(prog(t, t0, t0 + fade)) * (1 - o) : 0).toFixed(4); },
  });

  // ===================== v10: doğal geçişli reklam — yalnızca yeni adlar; mevcut bileşenler aynı =====================
  // Girişler yerinde süzülür (opaklık + kısa kayma, ease); yay yalnız küçük vurgu parçalarında. V.natural ile birlikte kullanılır.
  I.camera = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path fill-rule="evenodd" d="M11 15h22a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H11a6 6 0 0 1-6-6V21a6 6 0 0 1 6-6zM13 21.5a3.5 3.5 0 1 0 0 .01z" fill="${c}"/><path d="M41 25l11-6.5v19L41 31z" fill="${c}"/></svg>`;
  I.scissors = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="15" cy="41" r="7.5" fill="none" stroke="${c}" stroke-width="5"/><circle cx="41" cy="41" r="7.5" fill="none" stroke="${c}" stroke-width="5"/><path d="M20 35.5L41 6M36 35.5L15 6" stroke="${c}" stroke-width="5.5" stroke-linecap="round"/></svg>`;
  I.image = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><rect x="5.5" y="9.5" width="45" height="37" rx="6" fill="none" stroke="${c}" stroke-width="5"/><circle cx="19" cy="22" r="4.8" fill="${c}"/><path d="M8 44l13.5-14.5 9 9 6.5-6.5 11 12z" fill="${c}"/></svg>`;
  I.video = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path fill-rule="evenodd" d="M11 9h34a6 6 0 0 1 6 6v26a6 6 0 0 1-6 6H11a6 6 0 0 1-6-6V15a6 6 0 0 1 6-6zM23 19.5v17l14.5-8.5z" fill="${c}"/></svg>`;
  I.slides = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><rect x="5.5" y="7.5" width="45" height="31" rx="4" fill="none" stroke="${c}" stroke-width="5"/><path d="M28 39v8M18.5 51l9.5-6 9.5 6" stroke="${c}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="15" y="24" width="6.5" height="9" rx="1.5" fill="${c}"/><rect x="25" y="18" width="6.5" height="15" rx="1.5" fill="${c}"/><rect x="35" y="14" width="6.5" height="19" rx="1.5" fill="${c}"/></svg>`;
  I.mail = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><rect x="5.5" y="11.5" width="45" height="33" rx="5" fill="none" stroke="${c}" stroke-width="5"/><path d="M9 15.5l19 14.5 19-14.5" stroke="${c}" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  I.calendar = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><rect x="6.5" y="10.5" width="43" height="40" rx="6" fill="none" stroke="${c}" stroke-width="5"/><path d="M6.5 22h43" stroke="${c}" stroke-width="5"/><path d="M18 5v11M38 5v11" stroke="${c}" stroke-width="5" stroke-linecap="round"/><rect x="14" y="29" width="7.5" height="7.5" rx="1.6" fill="${c}"/><rect x="24.3" y="29" width="7.5" height="7.5" rx="1.6" fill="${c}"/><rect x="34.5" y="29" width="7.5" height="7.5" rx="1.6" fill="${c}"/><rect x="14" y="39" width="7.5" height="7.5" rx="1.6" fill="${c}"/></svg>`;

  // ===== ton sarmalayıcısı (geçmiş / pasif durum): içindeki parçalar t'de dur sürede griye döner ve soluklaşır ("eskiden böyleydi") =====
  // parts, t, dur (vars. .5), gray (0..1, vars. 1), o (hedef opaklık, vars. .45), dim (parlaklık, vars. .85). Hareket yok (yerinde).
  // out + outDur (isteğe bağlı): out'ta biten yumuşak sönüş (E.inCubic)
  L.tone = ({ parts = [], t: t0 = Infinity, dur = .5, gray = 1, o = .45, dim = .85, out = Infinity, outDur = .4 }) => ({
    html: `<div class="abs c-tone">${parts.map(p => `<div class="part">${p.html}</div>`).join('')}</div>`,
    render(t, r) {
      const g = r.firstChild; if (!g._roots) g._roots = [...g.children];
      const k = isFinite(t0) ? E.inOutCubic(prog(t, t0, t0 + dur)) : 0;
      const ko = isFinite(out) ? E.inCubic(prog(t, out - outDur, out)) : 0;
      css(g, { filter: k > 0 ? `grayscale(${(gray * k).toFixed(3)}) brightness(${lerp(1, dim, k).toFixed(3)})` : '', opacity: (lerp(1, o, k) * (1 - ko)).toFixed(4) });
      parts.forEach((p, i) => p.render && p.render(t, g._roots[i]));
    },
  });

  // ===== saat kadranı (süre: '4 saat'): kadran yerinde süzülür (opaklık + kayma); fill'den itibaren saat dilimleri tick aralıkla tek tek dolar =====
  // (12'den saat yönünde), akrep her dilimle ilerler; altında kısa etiket hapı. Kadranda rakam yok (söylenen değer yalnız etikette).
  // x,y: kadran merkezi  r  hours (dolacak dilim, vars. 4)  t: giriş  fill (vars. t)  tick (dilim aralığı, vars. .12; ses: flip_ticks)
  // color: dilim rengi  label: {text, t (vars. son dilim), size}  out (çıkışın bittiği an)
  L.clock = ({ x, y, r = 130, hours = 4, t: t0, fill, tick = .12, color = 'var(--yellow)', label, out = Infinity }) => {
    const f0 = fill ?? t0, S = 2 * r + 24, c = S / 2, rr = r - 15, TO = `transform-origin:${c}px ${c}px`;
    const pt = (a, q) => `${(c + q * Math.sin(a)).toFixed(1)} ${(c - q * Math.cos(a)).toFixed(1)}`;
    const sector = i => `M${c} ${c}L${pt(i / 12 * 2 * Math.PI, rr)}A${rr} ${rr} 0 0 1 ${pt((i + 1) / 12 * 2 * Math.PI, rr)}Z`;
    const ticks = [...Array(12)].map((_, i) => `<path d="M${pt(i / 12 * 2 * Math.PI, r - (i % 3 ? 15 : 26))}L${pt(i / 12 * 2 * Math.PI, r - 7)}"/>`).join('');
    const ls = label ? (label.size || Math.round(r * .4)) : 0;
    return {
      html: `<div class="abs c-clock" style="left:${x - c}px;top:${y - c}px;width:${S}px;height:${S}px">
        <svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><circle class="ckFace" cx="${c}" cy="${c}" r="${r}"/>
          ${[...Array(hours)].map((_, i) => `<path class="ckSec" d="${sector(i)}" style="fill:${color};${TO}"/>`).join('')}
          <g class="ckTicks">${ticks}</g><path class="ckHand" d="M${c} ${c}V${(c - r * .6).toFixed(1)}" style="${TO}"/><circle class="ckHub" cx="${c}" cy="${c}" r="${Math.round(r * .09)}"/></svg>
        ${label ? `<div class="ckLbl" style="top:${S + 6}px;font-size:${ls}px">${esc(label.text)}</div>` : ''}</div>`,
      render(t, r0) {
        const el = r0.firstChild, k = E.outCubic(prog(t, t0, t0 + .55)), o = isFinite(out) ? E.inCubic(prog(t, out - .38, out)) : 0;
        css(el, { opacity: t >= t0 ? (k * (1 - o)).toFixed(4) : 0, transform: `translateY(${((1 - k) * 26 - 14 * o).toFixed(2)}px)` });
        let ang = 0;
        el.querySelectorAll('.ckSec').forEach((s, i) => { const ti = f0 + i * tick, ks = E.outCubic(prog(t, ti, ti + Math.max(.08, tick * .9)));
          css(s, { opacity: ks.toFixed(4), transform: `scale(${lerp(.9, 1, ks).toFixed(4)})` }); ang += 30 * ks; });
        el.querySelector('.ckHand').style.transform = `rotate(${ang.toFixed(2)}deg)`;
        if (label) { const tl = label.t ?? f0 + hours * tick, lk = E.outCubic(prog(t, tl, tl + .45));
          css(el.querySelector('.ckLbl'), { opacity: t >= tl ? lk.toFixed(4) : 0, transform: `translateX(-50%) translateY(${((1 - lk) * 14).toFixed(2)}px)` }); }
      },
    };
  };

  // ===== v11: net reklam (30+ kitle): tek fikir, büyük yazısız ikon, yaysız (ease) hareket. Yalnızca yeni adlar =====
  I.dev = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="10" r="7" fill="${c}"/><path d="M13.5 26.5c0-6.6 6.5-10 14.5-10s14.5 3.4 14.5 10z" fill="${c}"/><rect x="9.5" y="28.5" width="37" height="18" rx="3" fill="none" stroke="${c}" stroke-width="4.5"/><path d="M23.5 33.2l-4.3 4.3 4.3 4.3M32.5 33.2l4.3 4.3-4.3 4.3" stroke="${c}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 50.5h47" stroke="${c}" stroke-width="5" stroke-linecap="round"/></svg>`;
  I.gradCap = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M28 9L53 20.5 28 32 3 20.5z" fill="${c}"/><path d="M14 26.5v9.5c0 4.4 6.3 7.5 14 7.5s14-3.1 14-7.5v-9.5L28 33z" fill="${c}"/><path d="M47 22.5v14" stroke="${c}" stroke-width="3" stroke-linecap="round"/><rect x="44" y="35.5" width="6" height="8.5" rx="2" fill="${c}"/></svg>`;

  // ===== fiş / fatura (maliyet; yazısız ve rakamsız): kâğıt yerinde belirir, aşağı doğru "basılarak" uzar; satırlar (gri çubuk + sağda tutar çubuğu)
  // toplam satırının üstünde sırayla belirir; total.t'de toplam satırı kırmızıya döner; more.t'de fiş biraz daha uzar (yeni satırlar, toplam aşağı kayar) =====
  // x,y: sol-üst  w  rows: ilk basımdaki satır sayısı  rowH (vars. .125 w)  t: giriş (opaklık + 24 px kayma)  print: {a, b} ilk basım (vars. t+.15 .. t+.9)
  // total: {t, color}  more: {t, rows, dur}  out: çıkışın bittiği an  seed: satır uzunlukları. Rakam / para birimi yazılmaz (söylenmeyen değer yok).
  L.receipt = ({ x, y, w = 440, rows = 4, rowH, t: t0, print, total, more, out = Infinity, seed = 4 }) => {
    const R = rng(seed), rh = rowH ?? Math.round(w * .125), head = Math.round(rh * 1.6), th = Math.round(rh * 1.5), zz = Math.round(w * .04), pad = Math.round(w * .09);
    const nMax = rows + (more ? more.rows || 0 : 0), items = [...Array(nMax)].map(() => ({ a: 34 + 26 * R(), b: 13 + 8 * R() }));
    const TC = (total && total.color) || 'var(--red)';
    return {
      html: `<div class="abs c-receipt" style="left:${x}px;top:${y}px;width:${w}px"><div class="rcPaper" style="padding:0 ${pad}px">
        <div class="rcHead" style="height:${head}px"><i class="rcLogo" style="width:${Math.round(rh * .78)}px;height:${Math.round(rh * .78)}px"></i><i class="rcHl" style="height:${Math.round(rh * .26)}px"></i></div>
        ${items.map((it, i) => `<div class="rcRow" style="top:${head + i * rh}px;left:${pad}px;right:${pad}px;height:${rh}px"><i class="rcL" style="width:${it.a.toFixed(1)}%;height:${Math.round(rh * .24)}px"></i><i class="rcR" style="width:${it.b.toFixed(1)}%;height:${Math.round(rh * .24)}px"></i></div>`).join('')}
        <div class="rcTot" style="left:0;right:0;height:${th}px;padding:0 ${pad}px"><i class="rcSep" style="left:${pad}px;right:${pad}px"></i><i class="rcTL" style="width:30%;height:${Math.round(rh * .34)}px"></i><i class="rcTR" style="width:28%;height:${Math.round(rh * .4)}px"></i></div>
      </div></div>`,
      render(t, r) {
        const el = r.firstChild, pp = el.firstChild, q = s => el.querySelector(s);
        const k = E.outCubic(prog(t, t0, t0 + .45)), o = isFinite(out) ? E.inCubic(prog(t, out - .38, out)) : 0;
        css(el, { opacity: t >= t0 ? (k * (1 - o)).toFixed(4) : 0, transform: `translateY(${((1 - k) * 24 - 14 * o).toFixed(2)}px)` });
        const pa = print ? print.a : t0 + .15, pb = print ? print.b : t0 + .9;
        const n = rows * E.inOutCubic(prog(t, pa, pb)) + (more ? (more.rows || 0) * E.inOutCubic(prog(t, more.t, more.t + (more.dur ?? .6))) : 0);
        const H = head + n * rh + th + zz, zn = Math.max(6, Math.round(w / (zz * 1.6))), pts = [];
        for (let i = 0; i <= zn; i++) pts.push(`${(100 * i / zn).toFixed(2)}% ${(i % 2 ? H : H - zz).toFixed(1)}px`);
        css(pp, { height: H.toFixed(1) + 'px', clipPath: `polygon(0 0, 100% 0, ${pts.reverse().join(', ')})` });
        el.querySelectorAll('.rcRow').forEach((row, i) => { row.style.opacity = clamp((n - i) * 1.6).toFixed(3); });
        const tot = q('.rcTot'); tot.style.top = (head + n * rh).toFixed(1) + 'px';
        const red = total && t >= total.t ? E.inOutCubic(prog(t, total.t, total.t + .35)) : 0;
        tot.style.background = red > 0 ? `rgba(229,56,59,${(.12 * red).toFixed(3)})` : '';
        for (const c of [q('.rcTL'), q('.rcTR')]) c.style.background = red > .5 ? TC : '';
        if (red > 0) q('.rcTR').style.transform = `scale(${(1 + .12 * Math.sin(Math.PI * prog(t, total.t, total.t + .5))).toFixed(4)})`;
      },
    };
  };

  // ===== jeton yığını (para / maliyet; rakamsız): jetonlar sırayla yukarıdan yerine iner (ease, sekmesiz), yığın yükselir; jeton yüzünde ₺ işareti =====
  // x: yığının merkezi  y: taban (en alttaki jetonun alt kenarı)  w: jeton genişliği  times: [t..] her jetonun iniş anı  drop: iniş mesafesi (px)  out
  L.coinStack = ({ x, y, w = 200, times = [], drop = 60, out = Infinity }) => {
    const ch = Math.round(w * .32), st = Math.round(w * .15), n = times.length, H = ch + st * n, sw = 1.05 * ch / 28;
    const coin = `<svg width="${w}" height="${ch + st}" viewBox="0 0 ${w} ${ch + st}"><ellipse cx="${w / 2}" cy="${ch / 2 + st}" rx="${w / 2 - 1}" ry="${ch / 2 - 1}" fill="#D99A00"/>
      <rect x="1" y="${ch / 2}" width="${w - 2}" height="${st}" fill="#E5A800"/><path d="M1 ${ch / 2 + st * .55}h${w - 2}" stroke="#C98A00" stroke-width="2"/>
      <ellipse cx="${w / 2}" cy="${ch / 2}" rx="${w / 2 - 1}" ry="${ch / 2 - 1}" fill="#FFD23F" stroke="#C98A00" stroke-width="2"/>
      <ellipse cx="${w / 2}" cy="${ch / 2}" rx="${w * .37}" ry="${ch * .36}" fill="none" stroke="#E5A800" stroke-width="3"/>
      <g transform="translate(${(w / 2 - 28 * sw).toFixed(1)} ${(ch / 2 - 27 * sw * .5).toFixed(1)}) scale(${sw.toFixed(3)} ${(sw * .5).toFixed(3)})" fill="none" stroke="#B87A00" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M25 15v24c7 0 12-4 12-11"/><path d="M19 26l13-5M19 32l13-5"/></g></svg>`;
    return {
      html: `<div class="abs c-coins" style="left:${x - w / 2}px;top:${y - H}px;width:${w}px;height:${H}px"><i class="cnShadow" style="left:${-w * .08}px;right:${-w * .08}px;height:${ch}px;top:${H - ch * .6}px"></i>${times.map((_, i) =>
        `<div class="cnC" style="top:${H - ch - st - i * st}px">${coin}</div>`).join('')}</div>`,
      render(t, r) {
        const el = r.firstChild, o = isFinite(out) ? E.inCubic(prog(t, out - .38, out)) : 0, t1 = times[0] ?? Infinity;
        css(el, { opacity: (1 - o).toFixed(4) });
        el.querySelector('.cnShadow').style.opacity = (t >= t1 ? .5 * E.outCubic(prog(t, t1, t1 + .3)) : 0).toFixed(3);
        el.querySelectorAll('.cnC').forEach((c, i) => { const ti = times[i], k = E.outCubic(prog(t, ti, ti + .32));
          css(c, { opacity: t >= ti ? clamp(k * 2).toFixed(3) : 0, transform: `translateY(${(-(1 - k) * drop).toFixed(2)}px)` }); });
      },
    };
  };

  // ===== yol (A'dan Z'ye, adım adım): yatay iz; solda başlangıç, sağda bitiş düğümü (kısa yazı, ör. 'A' / 'Z'), arada boş adım düğümleri;
  // lit.t'den itibaren düğümler soldan sağa stagger aralıkla sarıya yanar, iz yanan düğüme kadar sarı dolar (ease); bitişte yeşil tik =====
  // x0, x1: başlangıç / bitiş düğümü merkezi  y: iz merkezi  from, to: uç yazıları  steps: ara düğüm sayısı  size: uç düğüm çapı  stepSize
  // t: başlangıç düğümü (yerinde pop)  tSteps: ara düğümler (sırayla, vars. t+.15)  tEnd: bitiş düğümü (vars. t+.4)  lit: {t, stagger}  check: t  out
  L.journey = ({ x0, x1, y, from = 'A', to = 'Z', steps = 4, size = 150, stepSize, t: t0, tSteps, tEnd, lit, check, out = Infinity }) => {
    const ss = stepSize ?? Math.round(size * .6), n = steps + 2, X = i => x0 + (x1 - x0) * i / (n - 1), S = i => i === 0 || i === n - 1 ? size : ss;
    const th = Math.round(size * .1), ck = Math.round(size * .52);
    const node = i => `<div class="jnN${i === 0 || i === n - 1 ? ' end' : ''}" style="left:${X(i) - S(i) / 2}px;top:${y - S(i) / 2}px;width:${S(i)}px;height:${S(i)}px;font-size:${Math.round(S(i) * .5)}px">${
      i === 0 ? esc(from) : i === n - 1 ? esc(to) : ''}${i === n - 1 && check != null ? `<b class="jnOk" style="width:${ck}px;height:${ck}px">${I.check()}</b>` : ''}</div>`;
    const tN = i => i === 0 ? t0 : i === n - 1 ? (tEnd ?? t0 + .4) : (tSteps ?? t0 + .15) + (i - 1) * .08;
    const tL = i => lit ? lit.t + i * (lit.stagger ?? .12) : Infinity;
    return {
      html: `<div class="abs c-journey"><i class="jnTrack" style="left:${x0}px;width:${x1 - x0}px;top:${y - th / 2}px;height:${th}px"></i>
        <i class="jnFill" style="left:${x0}px;width:${x1 - x0}px;top:${y - th / 2}px;height:${th}px"></i>${[...Array(n)].map((_, i) => node(i)).join('')}</div>`,
      render(t, r) {
        const el = r.firstChild, o = isFinite(out) ? E.inCubic(prog(t, out - .38, out)) : 0;
        css(el, { opacity: (1 - o).toFixed(4) });
        css(el.querySelector('.jnTrack'), { opacity: t >= t0 ? E.outCubic(prog(t, t0, t0 + .5)).toFixed(3) : 0, transform: `scaleX(${E.outCubic(prog(t, t0, t0 + .6)).toFixed(4)})` });
        let fp = 0; for (let i = 1; i < n; i++) fp += E.inOutCubic(prog(t, tL(i - 1), tL(i)));
        css(el.querySelector('.jnFill'), { transform: `scaleX(${(fp / (n - 1)).toFixed(4)})`, opacity: fp > 0 ? 1 : 0 });
        el.querySelectorAll('.jnN').forEach((nd, i) => {
          const ti = tN(i), k = spring(t - ti, .62, 2.4), on = t >= tL(i), lk = on ? E.outCubic(prog(t, tL(i), tL(i) + .2)) : 0;
          const pu = on ? Math.sin(Math.PI * prog(t, tL(i), tL(i) + .35)) : 0;
          css(nd, { opacity: t >= ti ? clamp(k * 2.5).toFixed(3) : 0, transform: `scale(${t >= ti ? (lerp(.4, 1, clamp(k, 0, 1.1)) * (1 + .14 * pu)).toFixed(4) : 0})`,
            background: lk > .5 ? 'var(--yellow)' : '', color: lk > .5 ? 'var(--navy)' : '' });
        });
        if (check != null) { const c = el.querySelector('.jnOk'), on = t >= check, cs = spring(t - check, .6, 2.2);
          css(c, { opacity: on ? clamp(cs * 3).toFixed(3) : 0, transform: `scale(${on ? lerp(1.4, 1, clamp(cs, 0, 1.2)).toFixed(4) : 0})` }); }
      },
    };
  };

  // ===== kayıt formu CTA'sı (geniş, markalı; v11): başlıkta logo avatarı + marka adı, yazısız alanlar, yazılı büyük gönder düğmesi, altında iri aşağı ok =====
  // (L.formCard'dan farkı: serbest en/boy, marka başlığı, iri düğme yazısı; kartın üstündeki geniş alanı doldurur.)
  // x,y: sol-üst  w,h  t: giriş (yerinde süzülür: opaklık + dy, ease; yay yok)  brand: {src (vars. marka logo.avatar), text}  fields: alan sayısı
  // button: {text, size (punto, vars. .11 h), color, t (düğmenin oturduğu an; vars. alanlardan sonra)}  pulse: t | [t..] düğme hafif nabız  arrow: {in, t (zıplama), n, per, size, gap, again: t | [t..]}  out
  L.signupCard = ({ x, y, w = 660, h = 400, t: t0, brand = {}, fields = 2, button = {}, pulse, arrow, out = Infinity, dy = 30 }) => {
    const hh = Math.round(h * .26), av = Math.round(hh * .78), pad = Math.round(w * .07), bs = button.size || Math.round(h * .11);
    const bh = Math.round(bs * 1.9), bb = Math.round(pad * .7), fh = Math.round(h * .13), lh = Math.max(10, Math.round(h * .032)), fg = Math.round(lh * .7);
    const top0 = hh + Math.round(h * .05), bot0 = h - bb - bh - Math.round(h * .04), per = lh + fg + fh;
    const gap = fields > 1 ? Math.max(0, (bot0 - top0 - fields * per) / (fields - 1)) : 0;
    const as = arrow ? (arrow.size || 100) : 0, ag = arrow ? (arrow.gap ?? 12) : 0, src = brand.src || (B.logo && B.logo.avatar);
    return {
      html: `<div class="abs c-signup" style="left:${x}px;top:${y}px;width:${w}px">
        <div class="suCard" style="height:${h}px">
          <div class="suHead" style="height:${hh}px;padding:0 ${pad}px;gap:${Math.round(hh * .2)}px">${src ? `<span class="suAv" style="width:${av}px;height:${av}px"><img src="${asset(src)}" alt=""></span>` : ''}${brand.text ? `<span class="suName" style="font-size:${Math.round(hh * .42)}px">${esc(brand.text)}</span>` : ''}</div>
          ${[...Array(fields)].map((_, i) => { const fy = Math.round(top0 + i * (per + gap));
            return `<div class="suF"><i class="suL" style="left:${pad}px;top:${fy}px;width:${Math.round((w - 2 * pad) * .34)}px;height:${lh}px"></i><i class="suBox" style="left:${pad}px;right:${pad}px;top:${fy + lh + fg}px;height:${fh}px"></i></div>`; }).join('')}
          <div class="suBtn" style="left:${pad}px;right:${pad}px;bottom:${bb}px;height:${bh}px;font-size:${bs}px${button.color ? `;background:${button.color}` : ''}">${esc(button.text || '')}</div>
        </div>
        ${arrow ? `<div class="suArr" style="top:${h + ag}px;width:${as}px;height:${as}px;margin-left:${-as / 2}px">${I.arrowDown()}</div>` : ''}</div>`,
      render(t, r) {
        const el = r.firstChild, q = s => el.querySelector(s), o = isFinite(out) ? E.inCubic(prog(t, out - .38, out)) : 0;
        const k = E.outCubic(prog(t, t0, t0 + .6));
        css(el, { opacity: t >= t0 ? (k * (1 - o)).toFixed(4) : 0 });
        q('.suCard').style.transform = `translateY(${((1 - k) * dy).toFixed(2)}px)`;
        el.querySelectorAll('.suF').forEach((f, i) => { const tf = t0 + .25 + i * .15, kf = E.outCubic(prog(t, tf, tf + .35));
          css(f, { opacity: kf.toFixed(4), transform: `translateY(${((1 - kf) * 12 + (1 - k) * dy).toFixed(2)}px)` }); });
        const tb = button.t ?? t0 + .3 + fields * .15, kb = spring(t - tb, .62, 2.2);
        let pk = 0; for (const tp of [].concat(pulse ?? [])) pk = Math.max(pk, Math.sin(Math.PI * prog(t, tp, tp + .55)));
        css(q('.suBtn'), { opacity: t >= tb ? clamp(kb * 2.5).toFixed(4) : 0,
          transform: `translateY(${((1 - k) * dy).toFixed(2)}px) scale(${t >= tb ? (lerp(.7, 1, clamp(kb, 0, 1.08)) * (1 + .07 * pk)).toFixed(4) : 0})` });
        if (arrow) {
          const ta = arrow.in ?? arrow.t - .5, on = t >= ta, ak = spring(t - ta, .62, 1.8), n = arrow.n ?? 2;
          let bob = 0;
          for (const tz of [arrow.t, ...[].concat(arrow.again ?? [])]) {
            const bp = prog(t, tz, tz + (arrow.per ?? .5) * n); if (bp > 0 && bp < 1) bob = Math.max(bob, Math.abs(Math.sin(Math.PI * n * bp)) * as * .2); }
          css(q('.suArr'), { opacity: on ? clamp(ak * 2.5).toFixed(4) : 0, transform: `translateY(${bob.toFixed(2)}px) scale(${on ? lerp(.5, 1, clamp(ak, 0, 1.08)).toFixed(4) : 0})` });
        }
      },
    };
  };

  // ===================== v12: haber / son dakika — yalnızca yeni adlar + mevcutlarda isteğe bağlı parametreler =====================
  // Canlı yayın rozeti, gerçek ekran görüntüsü kartı (fosfor / çerçeve vurgusu), gönderi yelpazesi (çokluk), sunucu ikonu.
  I.server = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><rect x="8" y="6" width="40" height="13" rx="3.5" fill="none" stroke="${c}" stroke-width="4.2"/><rect x="8" y="21.5" width="40" height="13" rx="3.5" fill="none" stroke="${c}" stroke-width="4.2"/><rect x="8" y="37" width="40" height="13" rx="3.5" fill="none" stroke="${c}" stroke-width="4.2"/><circle cx="16" cy="12.5" r="2.6" fill="${c}"/><circle cx="16" cy="28" r="2.6" fill="${c}"/><circle cx="16" cy="43.5" r="2.6" fill="${c}"/><path d="M27 12.5h13M27 28h13M27 43.5h13" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/></svg>`;

  // ===== canlı yayın rozeti ('ANLIK GELİŞME', 'CANLI'): renkli hap + yanıp sönen nokta ve yayılan halka; her karede sabit yerde durur =====
  // x, y: anchor 'right' -> sağ üst köşe (sağ kenar x), 'left' -> sol üst  size: punto  t: giriş (< 0: t=0'da hazır)  color / ink: zemin / yazı
  // blink: nokta periyodu (s)  loop: video toplam süresi verilirse periyot buna tam bölünecek şekilde ayarlanır (t=0 karesi = döngüdeki ilk kare)
  // pulse: t | [t..] -> hap hafifçe büyüyüp küçülür (pulseAmt, pulseDur)  out
  L.liveBadge = ({ text = 'CANLI', x, y, anchor = 'right', size = 30, t: t0 = -1, color = 'var(--red)', ink = '#fff', blink = 1, loop,
    pulse, pulseAmt = .08, pulseDur = .5, out = Infinity }) => {
    const per = loop ? loop / Math.max(1, Math.round(loop / blink)) : blink, P = [].concat(pulse ?? []);
    return {
      html: `<div class="abs c-live ${anchor}" style="left:${x}px;top:${y}px;font-size:${size}px;background:${color};color:${ink}"><i class="lvDot"><b class="lvRing"></b><b class="lvCore"></b></i><span>${esc(text)}</span></div>`,
      render(t, r) {
        const el = r.firstChild, k = t0 < 0 ? 1 : spring(t - t0, .55, 3), o = isFinite(out) ? E.inExpo(prog(t, out - .2, out)) : 0;
        let s = t >= t0 ? lerp(.5, 1, k) * (1 - .3 * o) : 0;
        for (const p of P) if (t >= p && t < p + pulseDur) s *= 1 + pulseAmt * Math.sin(Math.PI * prog(t, p, p + pulseDur));
        css(el, { opacity: t >= t0 ? (clamp(k * 3) * (1 - o)).toFixed(4) : 0, transform: `${anchor === 'right' ? 'translateX(-100%) ' : ''}scale(${s.toFixed(4)})` });
        const ph = (((t % per) + per) % per) / per;                         // t'den saf: nokta yanıp söner, halka dışa yayılır
        el.querySelector('.lvCore').style.opacity = (.45 + .55 * (.5 + .5 * Math.cos(2 * Math.PI * ph))).toFixed(3);
        css(el.querySelector('.lvRing'), { opacity: (.75 * Math.pow(1 - ph, 1.6)).toFixed(3), transform: `scale(${lerp(1, 2.4, E.outCubic(ph)).toFixed(3)})` });
      },
    };
  };

  // ===== ekran görüntüsü kartı (gerçek gönderi / sayfa görüntüsü): beyaz yuvarlak köşeli kart içinde görsel; yerinde süzülür ya da pop =====
  // src, imgW, imgH (doğal boyut)  x, y, w (görünen yükseklik = crop * w / imgW)  r: köşe  t: giriş
  // enter: {s, dy, dur} (ease, vars. .96 / 26 px / .5 s) | {s, dy, zeta, f} (yay: küçük vurgu kartı gibi pop)
  // crop: görselin üstten gösterilen yüksekliği (görsel px; vars. imgH)  fade: {from: 0..1} alt kenar solması (kesik görsel; kart yüksekliğinin oranı)
  // marks: [{x, y, w, h (görsel px), t, kind: 'hl' (fosfor, soldan çizilir) | 'box' (çerçeve), color, fill, dur, pad, width, r, glow, out}]
  // moves: [{a, b, x, y (kayma px), s (ölçek), o (opaklık), ease}] (origin: kart içi nokta {x, y} px, vars. merkez)  out, outDur  shadow
  // pan: [{a, b, s, x, y, ease}] -> çerçeve SABİT, içerik yaklaşır: s içerik ölçeği (1 = kart genişliğine sığan), x, y görünen pencerenin sol-üstü (görsel px);
  //   telefonda okunurluk için metin bloğuna yaklaşma (ör. s 1.13). İşaretler içerikle birlikte ölçeklenir.
  // marks kind 'cover': görseldeki bir kusuru (ör. kesik başlık) örten yama; color = CSS arka planı (ör. koyu -> saydam gradyan), t verilmezse hep açık
  // Görselin üstüne yazı / etiket konmaz (vurgu yalnız fosfor / çerçeve). Kartın görünen kutusu güvenli alan denetimine girer.
  L.shotCard = ({ src, imgW, imgH, x, y, w, r = 28, t: t0, enter = {}, crop, fade, marks = [], moves = [], pan = [], origin, out = Infinity, outDur = .3, shadow = true }) => {
    const sc = w / imgW, ch = (crop ?? imgH) * sc, O = origin || { x: w / 2, y: ch / 2 };
    const en = Object.assign({ s: .96, dy: 26, dur: .5 }, enter);
    const mk = m => { const p = m.pad ?? (m.kind === 'box' ? 10 : 3), X = m.x * sc - p, Y = m.y * sc - p, W = m.w * sc + 2 * p, H = m.h * sc + 2 * p;
      return `<i class="shM ${m.kind || 'hl'}" style="left:${X.toFixed(1)}px;top:${Y.toFixed(1)}px;width:${W.toFixed(1)}px;height:${H.toFixed(1)}px;${m.kind === 'box'
        ? `border:${m.width ?? 5}px solid ${m.color || 'var(--red)'};background:${m.fill || 'transparent'};border-radius:${m.r ?? 12}px;${m.glow ? `box-shadow:0 0 ${m.glow}px ${m.color || 'var(--red)'};` : ''}`
        : m.kind === 'cover' ? `background:${m.color || '#0A0F18'};` : `background:${m.color || 'rgba(255,210,63,.62)'};border-radius:${m.r ?? 6}px;`}"></i>`; };
    const mask = fade ? (g => `-webkit-mask-image:${g};mask-image:${g};`)(`linear-gradient(180deg,#000 ${(fade.from * 100).toFixed(1)}%,transparent 100%)`) : '';
    return {
      html: `<div class="abs c-shot${shadow ? ' sh' : ''}" style="left:${x}px;top:${y}px;width:${w}px;height:${ch.toFixed(1)}px;transform-origin:${O.x}px ${O.y}px">
        <div class="shIn" style="border-radius:${r}px;${mask}"><div class="shC"><img src="${src}" alt="" style="width:${w}px;height:${(imgH * sc).toFixed(1)}px">${marks.map(mk).join('')}</div></div></div>`,
      render(t, rt) {
        const el = rt.firstChild, k = en.zeta ? spring(t - t0, en.zeta, en.f ?? 2.2) : E.outCubic(prog(t, t0, t0 + en.dur));
        const st = { x: 0, y: 0, s: 1, o: 1 };
        for (const m of moves) { const u = (E[m.ease] || E.inOutCubic)(prog(t, m.a, m.b)); for (const q in st) if (m[q] != null) st[q] = lerp(st[q], m[q], u); }
        const o = isFinite(out) ? E.inCubic(prog(t, out - outDur, out)) : 0;
        css(el, { opacity: t >= t0 ? (clamp(k * 2) * (1 - o) * st.o).toFixed(4) : 0,
          transform: `translate(${st.x.toFixed(1)}px,${(st.y + (1 - clamp(k, 0, 1.2)) * en.dy).toFixed(1)}px) scale(${(lerp(en.s, 1, k) * st.s).toFixed(4)})` });
        const pz = { s: 1, x: 0, y: 0 };                                       // pan: çerçeve sabit, içerik yaklaşır
        for (const m of pan) { const u = (E[m.ease] || E.inOutCubic)(prog(t, m.a, m.b)); for (const q in pz) if (m[q] != null) pz[q] = lerp(pz[q], m[q], u); }
        if (pan.length) css(el.querySelector('.shC'), { transform: `translate(${(-pz.x * sc * pz.s).toFixed(2)}px,${(-pz.y * sc * pz.s).toFixed(2)}px) scale(${pz.s.toFixed(4)})` });
        el.querySelectorAll('.shM').forEach((e, i) => {
          const m = marks[i], u = E.outCubic(prog(t, m.t, m.t + (m.dur ?? (m.kind === 'box' ? .28 : .32)))), mo = isFinite(m.out ?? Infinity) ? E.inCubic(prog(t, m.out - .25, m.out)) : 0;
          if (m.kind === 'cover') e.style.opacity = m.t == null || t >= m.t ? (1 - mo).toFixed(3) : 0;
          else if (m.kind === 'box') css(e, { opacity: t >= m.t ? (u * (1 - mo)).toFixed(3) : 0, transform: `scale(${lerp(1.12, 1, u).toFixed(4)})` });
          else css(e, { opacity: t >= m.t ? (1 - mo).toFixed(3) : 0, transform: `scaleX(${u.toFixed(4)})` });
        });
      },
    };
  };

  // ===== gönderi yelpazesi (çokluk: "birçok ülke", "herkes paylaştı"): yazısız gönderi iskeletleri (avatar dairesi + gri satırlar) =====
  // bir kartın arkasından yelpaze gibi açılır. x, y, w, h: arkasında durduğu kartın kutusu (iskeletler aynı boyda)  n: iskelet sayısı
  // t: açılış  dur  stagger  spread: uçtaki kartın yana açılması (px)  rot: uçtaki açı (derece)  lift: ortadakinin yukarı kalkması (px)
  // r: köşe  seed: satır uzunlukları / avatar renkleri  out (çıkışın bittiği an). Kartın ARKASINDA kalsın diye sahnede kartlardan önce yazılır.
  L.postFan = ({ x, y, w, h, n = 3, t: t0, dur = .5, stagger = .06, spread = 90, rot = 7, lift = 18, r = 28, seed = 5, out = Infinity,
    colors = ['#5DB3F0', '#FFD23F', '#1FB766', '#F59E7A', '#2F6BFF'] }) => {
    const R = rng(seed), f = i => n === 1 ? 0 : -1 + 2 * i / (n - 1), pad = Math.round(w * .06), av = Math.round(h * .2);
    const ord = [...Array(n).keys()].sort((a, b) => Math.abs(f(a)) - Math.abs(f(b)));    // ortadaki en arkada, uçlar önde
    const card = i => { const c = colors[Math.floor(R() * colors.length)], lw = [0, 1, 2].map(() => 62 + 30 * R());
      return `<div class="pfC" data-i="${i}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${r}px">
        <i class="pfAv" style="left:${pad}px;top:${pad}px;width:${av}px;height:${av}px;background:${c}"></i>
        <i class="pfN" style="left:${pad + av + pad * .6}px;top:${pad + av * .18}px;width:${(30 + 14 * R()).toFixed(1)}%;height:${Math.round(h * .055)}px"></i>
        <i style="left:${pad + av + pad * .6}px;top:${pad + av * .62}px;width:${(20 + 8 * R()).toFixed(1)}%;height:${Math.round(h * .042)}px"></i>
        ${lw.map((p, j) => `<i style="left:${pad}px;top:${Math.round(pad + av + h * (.12 + j * .15))}px;width:${p.toFixed(1)}%;height:${Math.round(h * .058)}px"></i>`).join('')}</div>`; };
    return {
      html: `<div class="abs c-pfan">${ord.map(card).join('')}</div>`,
      render(t, rt) {
        const el = rt.firstChild, o = isFinite(out) ? E.inCubic(prog(t, out - .3, out)) : 0;
        css(el, { opacity: (1 - o).toFixed(4) });
        el.querySelectorAll('.pfC').forEach((c, j) => {
          const i = +c.dataset.i, fi = f(i), ti = t0 + j * stagger, u = E.outCubic(prog(t, ti, ti + dur));
          css(c, { opacity: t >= ti ? clamp(u * 4).toFixed(3) : 0,
            transform: `translate(${(u * fi * spread).toFixed(1)}px,${(-u * lift * (1 - .5 * Math.abs(fi))).toFixed(1)}px) rotate(${(u * fi * rot).toFixed(3)}deg)` });
        });
      },
    };
  };

  // ===================== v13: ok geçişi + dalış (ornekler/ok-gecis-dalis) — yalnızca yeni adlar + L.device 'list' türü =====================
  // Konuşurken ekran girer, kıvrımlı ok çizilerek bir noktaya gider, sonra o ekranın içine dalınır (anlatım derinleşir).

  // ikonlar (v13, jenerik): ekip (üç kişi), ofis binası (dış şirket; kurum logosu/arma değil)
  I.team = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><g fill="${c}" opacity=".72"><circle cx="12.5" cy="20.5" r="6.3"/><path d="M1.5 44c0-8 4.8-12.6 11-12.6 2.9 0 5.4.9 7.3 2.5-2.3 2.8-3.7 6.3-3.9 10.1z"/><circle cx="43.5" cy="20.5" r="6.3"/><path d="M54.5 44c0-8-4.8-12.6-11-12.6-2.9 0-5.4.9-7.3 2.5 2.3 2.8 3.7 6.3 3.9 10.1z"/></g><circle cx="28" cy="18" r="8.6" fill="${c}"/><path d="M13.5 50c0-10.4 6.5-16.4 14.5-16.4S42.5 39.6 42.5 50z" fill="${c}"/></svg>`;
  I.office = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><path d="M12.5 50.5V9.5a3 3 0 0 1 3-3h19a3 3 0 0 1 3 3v41" fill="none" stroke="${c}" stroke-width="4.5" stroke-linejoin="round"/><path d="M37.5 21.5h6a3 3 0 0 1 3 3v26" fill="none" stroke="${c}" stroke-width="4.5" stroke-linejoin="round"/><path d="M5 50.5h46" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/><g fill="${c}"><rect x="18.5" y="13" width="5" height="5" rx="1"/><rect x="26.5" y="13" width="5" height="5" rx="1"/><rect x="18.5" y="22" width="5" height="5" rx="1"/><rect x="26.5" y="22" width="5" height="5" rx="1"/><rect x="18.5" y="31" width="5" height="5" rx="1"/><rect x="26.5" y="31" width="5" height="5" rx="1"/><rect x="21.5" y="40.5" width="7" height="10" rx="1"/></g></svg>`;

  I.hotel = (c = '#0B3568') => `<svg width="56" height="56" viewBox="0 0 56 56"><rect x="19" y="2" width="18" height="12" rx="3" fill="${c}"/><path d="M24.5 5v6M31.5 5v6M24.5 8h7" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M10.5 51V20a3 3 0 0 1 3-3h29a3 3 0 0 1 3 3v31" fill="none" stroke="${c}" stroke-width="4.5" stroke-linejoin="round"/><path d="M4 51h48" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/><g fill="${c}"><rect x="17" y="23" width="6" height="5" rx="1"/><rect x="25" y="23" width="6" height="5" rx="1"/><rect x="33" y="23" width="6" height="5" rx="1"/><rect x="17" y="31" width="6" height="5" rx="1"/><rect x="25" y="31" width="6" height="5" rx="1"/><rect x="33" y="31" width="6" height="5" rx="1"/><path d="M22 51v-7a6 6 0 0 1 12 0v7z"/></g></svg>`;

  // ===== kalabalık (çokluk: "binlerce örnek"; sayı yok): renkli dolgu avatar daireleri (beyaz kişi simgesi + beyaz halka) tohumlu sırayla, =====
  // 'center' noktasından dışa doğru çoğalır (önce az, sonra hızlanarak); lit'te soldan sağa sarı halka parıltısı süpürür. Açık/karışık zeminde de okunur
  // (L.avatarField'in koyu tema dolgusuz sürümü değil). x,y: sol-üst  cols, rows  size  gap  t  fill:{a,b}  accel (vars. 1.6: >1 hızlanarak çoğalır)
  // lit:{a,b}  center:{x,y} (ekran koordinatı, vars. alan ortası)  colors  seed  out (çıkışın bittiği an), outDur
  L.crowd = ({ x, y, cols = 12, rows = 8, size = 64, gap = 14, t: t0, fill = {}, accel = 1.6, lit, center, colors = ['#5DB3F0', '#F59E7A', '#1FB766', '#FFD23F', '#2F6BFF', '#A78BFA'],
    seed = 7, out = Infinity, outDur = .4 }) => {
    const n = cols * rows, R = rng(seed), W = cols * size + (cols - 1) * gap, H = rows * size + (rows - 1) * gap;
    const cx = center ? center.x - x : W / 2, cy = center ? center.y - y : H / 2;
    const cells = [...Array(n)].map((_, i) => { const px = (i % cols) * (size + gap), py = Math.floor(i / cols) * (size + gap);
      return { px, py, d: Math.hypot(px + size / 2 - cx, py + size / 2 - cy) + R() * size * 1.6, col: colors[Math.floor(R() * colors.length)] }; });
    const rank = []; cells.map((c, i) => [c.d, i]).sort((a, b) => a[0] - b[0]).forEach(([, i], k) => { rank[i] = k; });
    const fa = fill.a ?? t0, fb = fill.b ?? t0 + 1.5;
    return {
      html: `<div class="abs c-crowd" style="left:${x}px;top:${y}px;width:${W}px;height:${H}px">${cells.map(c =>
        `<div class="crC" style="left:${c.px}px;top:${c.py}px;width:${size}px;height:${size}px;background:${c.col};border-width:${Math.max(3, Math.round(size * .06))}px">${I.user('#fff')}</div>`).join('')}</div>`,
      render(t, r) {
        const el = r.firstChild, o = isFinite(out) ? E.inCubic(prog(t, out - outDur, out)) : 0;
        css(el, { opacity: t >= t0 ? (1 - o).toFixed(4) : 0 });
        el.querySelectorAll('.crC').forEach((c, i) => {
          const tf = fa + (fb - fa) * Math.pow(rank[i] / Math.max(1, n - 1), accel), k = t >= tf ? spring(t - tf, .6, 2.6) : 0;
          const tl = lit ? lit.a + (lit.b - lit.a) * (i % cols) / Math.max(1, cols - 1) : Infinity, g = t >= tl ? Math.sin(Math.PI * prog(t, tl, tl + .6)) : 0;
          css(c, { opacity: clamp(k * 3).toFixed(3), transform: `scale(${(lerp(.3, 1, clamp(k, 0, 1.1)) * (1 + .1 * g)).toFixed(4)})`,
            boxShadow: g > 0 ? `0 0 0 ${(7 * g).toFixed(1)}px rgba(255,210,63,${(.9 * g).toFixed(3)}), 0 6px 14px rgba(0,0,0,.3)` : '' });
        });
      },
    };
  };

  // ===== çizilen kıvrımlı ok: from'dan to'ya bezier yol t..t+dur'da çizilir (stroke-dashoffset), ok başı çizginin ucunu izler =====
  // from, to: {x, y}  c1, c2 (isteğe bağlı kübik kontrol noktaları; verilmezse bend: orta noktadan dik sapma px, + gidiş yönünün solu)
  // t, dur (vars. .8), ease (E adı, vars. 'inOutCubic')  width (px, vars. 10)  color (vars. sarı)  head (ok başı boyu px, 0 = yok; vars. 3.2 x width)
  // dot: true -> başlangıçta küçük daire (t'de pop)  dash: [çizgi, boşluk] (px) kesik çizgi  out (çıkışın bittiği an), outDur  shadow (vars. true)
  // Ok başının ucu 'to' noktasındadır. SVG kutusu yalnızca yolu (+ ok başı payı) kapsar: güvenli alan denetiminde kutu = yolun çevresi.
  let arrN = 0;
  L.arrowPath = ({ from, to, c1, c2, bend = 0, t: t0, dur = .8, ease = 'inOutCubic', width = 10, color = 'var(--yellow)', head, dot = false, dash,
    out = Infinity, outDur = .3, shadow = true }) => {
    const id = `arM${arrN++}`, hs = head ?? Math.round(width * 3.2);
    let P1 = c1, P2 = c2;
    if (!P1 || !P2) {                                                         // tek kontrol noktalı yay (kübik eşdeğeri)
      const dx = to.x - from.x, dy = to.y - from.y, d = Math.hypot(dx, dy) || 1, q = { x: (from.x + to.x) / 2 + dy / d * bend, y: (from.y + to.y) / 2 - dx / d * bend };
      P1 = P1 || { x: from.x + (q.x - from.x) * 2 / 3, y: from.y + (q.y - from.y) * 2 / 3 };
      P2 = P2 || { x: to.x + (q.x - to.x) * 2 / 3, y: to.y + (q.y - to.y) * 2 / 3 };
    }
    const bz = u => { const v = 1 - u; return { x: v * v * v * from.x + 3 * v * v * u * P1.x + 3 * v * u * u * P2.x + u * u * u * to.x,
      y: v * v * v * from.y + 3 * v * v * u * P1.y + 3 * v * u * u * P2.y + u * u * u * to.y }; };
    const NS = 96, cum = [0], pts = [bz(0)];                                  // yay uzunluğu tablosu (ok başı = çizginin ucu)
    for (let i = 1; i <= NS; i++) { const p = bz(i / NS); pts.push(p); cum.push(cum[i - 1] + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y)); }
    const LEN = cum[NS] || 1;
    const uAt = f => { const L0 = clamp(f) * LEN; let i = 1; while (i < NS && cum[i] < L0) i++;
      return (i - 1 + (L0 - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1])) / NS; };
    const tip = f => { const u = uAt(f), a = bz(Math.max(0, u - .004)), b = bz(Math.min(1, u + .004)), p = bz(u); return { p, ang: Math.atan2(b.y - a.y, b.x - a.x) }; };
    const pad = hs + width + 6, bx = Math.min(...pts.map(p => p.x)) - pad, by = Math.min(...pts.map(p => p.y)) - pad;
    const bw = Math.max(...pts.map(p => p.x)) + pad - bx, bh = Math.max(...pts.map(p => p.y)) + pad - by;
    const X = p => (p.x - bx).toFixed(1), Y = p => (p.y - by).toFixed(1);
    const D = `M${X(from)} ${Y(from)}C${X(P1)} ${Y(P1)} ${X(P2)} ${Y(P2)} ${X(to)} ${Y(to)}`;
    const line = dash
      ? `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}"><path class="arRev" d="${D}" pathLength="1000" stroke-dasharray="1000" fill="none" stroke="#fff" stroke-width="${width + 6}" stroke-linecap="round"/></mask>
         <path d="${D}" mask="url(#${id})" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-dasharray="${dash.join(' ')}"/>`
      : `<path class="arRev" d="${D}" pathLength="1000" stroke-dasharray="1000" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
    return {
      html: `<svg class="abs c-arrow${shadow ? ' sh' : ''}" style="left:${bx.toFixed(1)}px;top:${by.toFixed(1)}px" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" viewBox="0 0 ${bw.toFixed(0)} ${bh.toFixed(0)}">
        ${line}${dot ? `<circle class="arDot" cx="${X(from)}" cy="${Y(from)}" r="${(width * 1.1).toFixed(1)}" fill="${color}"/>` : ''}
        ${hs ? `<path class="arHd" d="M0 0L${-hs} ${(-hs * .62).toFixed(1)}L${(-hs * .72).toFixed(1)} 0L${-hs} ${(hs * .62).toFixed(1)}z" fill="${color}" stroke="${color}" stroke-width="${Math.max(2, width * .35).toFixed(1)}" stroke-linejoin="round"/>` : ''}</svg>`,
      render(t, r) {
        const el = r.firstChild, on = t >= t0, k = (E[ease] || E.inOutCubic)(prog(t, t0, t0 + dur)), o = isFinite(out) ? E.inCubic(prog(t, out - outDur, out)) : 0;
        el.style.opacity = on ? (1 - o).toFixed(4) : 0;
        if (!on) return;
        // ok başı uca yerleşir: çizgi, ok başının tabanında biter (uç sivri kalır)
        const hk = clamp(k * LEN / Math.max(1, hs * 1.4)), back = hs * .72 * hk / LEN;
        el.querySelector('.arRev').style.strokeDashoffset = (1000 * (1 - Math.max(0, k - back))).toFixed(2);
        if (hs) { const { p, ang } = tip(k);
          el.querySelector('.arHd').setAttribute('transform', `translate(${X(p)} ${Y(p)}) rotate(${(ang * 180 / Math.PI).toFixed(2)}) scale(${hk.toFixed(4)})`); }
        if (dot) { const dk = spring(t - t0, .5, 3); el.querySelector('.arDot').setAttribute('r', (width * 1.1 * clamp(dk, 0, 1.2)).toFixed(2)); }
      },
    };
  };

  // ===== yapboz parçası (uyum / uyumsuzluk: "işimize göre değil"): tek SVG; kenarlarda çıkıntı / girinti; ghost -> boş yuva =====
  // x, y: gövde merkezi  size: gövde kenarı (px)  knobs: {t, r, b, l} 1 çıkıntı, -1 girinti, 0 düz  color (dolgu)  ink + icon (L.I, isteğe bağlı, ortada)
  // ghost: true -> yuva: opak açık zemin (fill) + kesik çizgili kenar (stroke); altındaki içeriği örter  t: yerinde pop (yay)
  // moves: [{a, b, x, y (kayma px), r (açı), s (ölçek), ease}] sıralı (vars. inOutCubic)  rot: başlangıç açısı  out (çıkışın bittiği an), outDur  shadow
  // Uymayan parça: yuvayla farklı çıkıntılar + biraz büyük; yuvaya kayar, kenarında eğik durur, sakin geri çekilir (X yok).
  L.puzzle = ({ x, y, size = 160, knobs = { t: 1, r: 1, b: 0, l: 0 }, color = 'var(--yellow)', ink = '#0B1F33', icon, ghost = false, fill = '#EEF2F7', stroke = '#7C8DA4',
    t: t0, moves = [], rot = 0, out = Infinity, outDur = .3, shadow = true }) => {
    const s = size, kr = s * .15, kc = s * .12, pad = Math.round(s * .3 + 8), W = Math.round(s + 2 * pad), f = v => v.toFixed(1);
    const edge = (ax, ay, bx, by, k) => { if (!k) return `L${f(bx)} ${f(by)}`;             // saat yönünde kenar: sweep 1 -> dışa çıkıntı, 0 -> içe girinti
      const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = (bx - ax) / s, dy = (by - ay) / s;
      return `L${f(mx - dx * kc)} ${f(my - dy * kc)}A${f(kr)} ${f(kr)} 0 1 ${k > 0 ? 1 : 0} ${f(mx + dx * kc)} ${f(my + dy * kc)}L${f(bx)} ${f(by)}`; };
    const a = pad, b = pad + s;
    const D = `M${a} ${a}` + edge(a, a, b, a, knobs.t) + edge(b, a, b, b, knobs.r) + edge(b, b, a, b, knobs.b) + edge(a, b, a, a, knobs.l) + 'Z';
    const is = Math.round(s * .46), ic = icon ? I[icon](ink) : '', vb = (ic.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 56 56';
    const sw = Math.max(3, s * .035);
    return {
      html: `<svg class="abs c-puzzle${shadow && !ghost ? ' sh' : ''}" style="left:${f(x - W / 2)}px;top:${f(y - W / 2)}px" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}">
        <path d="${D}" fill="${ghost ? fill : color}" stroke="${ghost ? stroke : '#fff'}" stroke-width="${f(ghost ? sw * 1.2 : sw)}" stroke-linejoin="round"${ghost ? ` stroke-dasharray="${f(s * .09)} ${f(s * .06)}"` : ''}/>
        ${ic ? `<svg x="${f(W / 2 - is / 2)}" y="${f(W / 2 - is / 2)}" width="${is}" height="${is}" viewBox="${vb}">${ic}</svg>` : ''}</svg>`,
      render(t, r) {
        const el = r.firstChild, on = t >= t0, k = spring(t - t0, .62, 2.2), o = isFinite(out) ? E.inCubic(prog(t, out - outDur, out)) : 0;
        const st = { x: 0, y: 0, r: rot, s: 1 };
        for (const m of moves) { const u = (E[m.ease] || E.inOutCubic)(prog(t, m.a, m.b)); for (const q in st) if (m[q] != null) st[q] = lerp(st[q], m[q], u); }
        css(el, { opacity: on ? (clamp(k * 2.5) * (1 - o)).toFixed(4) : 0,
          transform: `translate(${f(st.x)}px,${f(st.y)}px) rotate(${st.r.toFixed(2)}deg) scale(${on ? (st.s * lerp(.6, 1, clamp(k, 0, 1.08)) * (1 - .1 * o)).toFixed(4) : 0})` });
      },
    };
  };

  // ===== ekranın içine dalış (sarmalayıcı): içindeki parçalar t'de 'focus' noktası etrafında büyür (s), focus 'to'ya kayar (ease), sonda söner =====
  // -> kamera ekranın / nesnenin içine dalar, yeni sahne (gizli mod) içeride açılır. parts  t  dur (vars. .9)  focus {x, y}  to {x, y} (vars. ekran merkezi)
  // s (son ölçek, vars. 6)  fade: [a, b] dalış ilerlemesi oranında opaklık 1 -> 0 (vars. [.55, 1])  ease (vars. 'inOutCubic')
  // Dalış başladığı andan itibaren sarmalayıcı ve tüm içerik data-safe=ignore olur (tam ekranı kaplayan geçiş zemini; öncesinde normal denetlenir).
  L.dive = ({ parts = [], t: t0, dur = .9, focus, to, s = 6, fade = [.55, 1], ease = 'inOutCubic' }) => ({
    html: `<div class="abs c-dive" style="transform-origin:${focus.x}px ${focus.y}px">${parts.map(p => `<div class="part">${p.html}</div>`).join('')}</div>`,
    render(t, r) {
      const g = r.firstChild; if (!g._roots) { g._roots = [...g.children]; g._own = new Set([...g.querySelectorAll('[data-safe]')]); }
      const on = isFinite(t0) && t >= t0;
      if (g._ign !== on) { g._ign = on;                                       // dalışta tam ekran geçiş: denetim dışı (kendi data-safe'i olanlara dokunulmaz)
        for (const e of [g, ...g.querySelectorAll('*')]) if (!g._own.has(e)) on ? e.setAttribute('data-safe', 'ignore') : e.removeAttribute('data-safe'); }
      const p = on ? prog(t, t0, t0 + dur) : 0, u = (E[ease] || E.inOutCubic)(p), T0 = to || { x: M.W / 2, y: M.H / 2 };
      const o = 1 - prog(p, fade[0], fade[1]);
      css(g, { opacity: o.toFixed(4), transform: `translate(${((T0.x - focus.x) * u).toFixed(2)}px,${((T0.y - focus.y) * u).toFixed(2)}px) scale(${lerp(1, s, u).toFixed(4)})` });
      vis(g, o > .001);
      parts.forEach((q, i) => q.render && q.render(t, g._roots[i]));
    },
  });

  window.L = L;
})();
