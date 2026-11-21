// ÖRNEK: yatay-tanitim — YATAY (16x9) hoş geldin / platform tanıtım videosu: konuşmacı tam ekranda solda, animasyonlar SAĞDAKİ alanda.
// Ne zaman: yeni üyenin ilk izleyeceği uzun (~4-5 dk) tanıtım; eğitmen kartı, "bu videoda" listesi, hedef rayı, tarayıcı -> giriş -> panel turu
//   (sağ pencere <-> tam ekran aynı panel), kontrol listesi, logo son kartı. Kart / PIP yok.
// Plan stili: kind face, density sahne, captions vurgulu, formats ['16x9'] (yatay kaynak), libs ['topluluk'] (comp/topluluk.js TP.*),
//   end_card 3.0 (TP.endCard). Logo / işaret görselleri TP.LOGO / TP.MARK: brand.json klasöründen (logo-koyu-zemin.png, logo-isaret-koyu-zemin.png).
// Cue'lar (C.<ad>; C.end/C.total motordan): h1In, h1Out, h2In, h2Out, h3In, h3Out, h4In, h4Out, aramiza, bv, hedefIn, browserIn, panelIn, yapman, dersIn,
//   hapClick, takvimClick, toplulukClick, katilma, link, alanlar, qaClick, etkinlik, kanallar
// Ekran metinleri yer tutucudur: eğitmen adı/unvanları 'Örnek ...', adres 'ornekmarka.com/uye', gönderi sahibi 'Ayşe Y.'; menü / sekme adları örnek panelden.
// KURAL: kart / PIP yok. Konuşmacı tam ekranda (zoom 1.2, yüz ekranın %36'sında); animasyonlar SAĞDAKİ alanda (x ~1060-1824).
// Panel turu tek arayüz: sağ pencere <-> tam ekran (aynı panelin büyüyüp küçülmesi). Dört kısa tam ekran an (toplam ~46.5 s):
// Eğitimler, Soru-Cevap, Hap Bilgiler rafı, Topluluk. Girişte önce konuşmacı söner (.5 s), panel .4 s sonra büyür (yüzün üstünden geçmez);
// dönüşte panel küçülür, kişi sonra belirir.
// DÜRÜSTLÜK: ekranda yalnız söylenenler + panelin gerçek menü / sekme / düğme adları ve sitedeki ifadeler. Uydurma sayı, isim, yıl,
// ders adı yok (modül / ders yalnız sıra numarası; takvimde ay / yıl yok); katılımcılar anonim ("Katılımcı"); Instagram / TikTok logosu
// yok (logosuz dikey video kartları); kurum logosu yok (kurum adı yalnız metin).
// Okunurluk (960 px gömülü oynatıcı): kart maddeleri >= 30 px, çipler >= 26 px, başlıklar >= 34 px, panel içerik tabanı 28 px.
// Tüm zamanlar plan.json cue'larından (C.x) ya da kelime başlangıcından (ws(i)) gelir; elle saniye yok.
const END = C.end, TOTAL = C.total, TLD = window.TIMELINE;
const ws = i => word(i).s;
const JUMP = t => TLD.jumps.reduce((b, j) => Math.abs(j - t) < Math.abs(b - t) ? j : b, Infinity);
const { clamp, lerp, prog, E, spring, css } = M;
const { eo, ei, io, bump, ic, icE, kick, chk, it, popIn, tickUpd, card, plain, title, postHead, postCard, skel, thumbBg, eduBadge, show } = TP;
const LOGO = TP.LOGO, MARK = TP.MARK, LOGO_AR = TP.LOGO_AR;

// ---------- kadraj: tam ekranda yüz solda, sağda sahne ----------
const SH = { mode: 'full', zoom: 1.2, fx: .36 };
const HID = [[C.h1In, C.h1Out], [C.h2In, C.h2Out], [C.h3In, C.h3Out], [C.h4In, C.h4Out]];   // gizli (tam ekran panel) anlar
const GROW = .4, SHRINK = .75;                                      // panel büyümesi: kişi söndükten sonra; küçülme: kişi belirmeden önce

// ---------- küçük yardımcılar ----------
const sky = '#5DB3F0';
const tile = (icon, s = 64, c = sky, bg = 'rgba(93,179,240,.12)', r = 14) => `<div style="width:${s}px;height:${s}px;border-radius:${r}px;background:${bg};display:grid;place-items:center;flex:none">${ic(icon, Math.round(s * .53), c, 1.9)}</div>`;
const pill = (cls, txt, icon, fs = 26, pad = '8px 20px 8px 14px', iconColor) => `<span class="ypill ${cls}" style="font-size:${fs}px;padding:${pad}">${icon ? ic(icon, Math.round(fs * 1.2), iconColor || 'currentColor', 2.1) : ''}${txt}</span>`;
// kutu içeriğiyle büyür (boş kutu yok): yükseklik anahtarları [[t, h], ...]
const grow = (keys, d = .45) => t => { let h = keys[0][1]; for (let i = 1; i < keys.length; i++) h = lerp(h, keys[i][1], io(t, keys[i][0], d)); return h; };

defineVideo(F => {
  const layout = [{ t: 0, ...SH }];
  for (const [a, b] of HID) layout.push({ t: a, mode: 'hidden' }, { t: b, ...SH });

  // ---------- sağ sahne koyuluğu (okunurluk; tam ekranda, gizlide zemin örter) ----------
  const scrim = TP.scrim({ on: [[0, END + 1]] });

  // ================= HOŞ GELDİN kartı (0-10.9 açılış; 258.5-261.8 "Aramıza hoş geldin") =================
  // Açılışta t=0'da okunur (kanca): logo + "Platforma hoş geldin!"; çipler kendi kelimesinde, kart çiplerle birlikte uzar.
  const WC = { x: 1086, y: 132, w: 728 };
  const welcome = ({ id, from, to, t0, out, lines, chips = [] }) => {
    const hKeys = [[-9, 450], ...chips.map((c, i) => [c.t, 450 + 82 * (i + 1)])], hAt = grow(hKeys);
    return L.scene({ id, from, to, z: 6, parts: [{
      html: `<div class="abs yz" style="left:${WC.x}px;top:${WC.y}px;width:${WC.w}px">
        <div class="wbg yc" style="position:absolute;left:0;top:0;width:100%;border-radius:24px"></div>
        <img class="wlg" src="${LOGO}" style="position:absolute;left:44px;top:42px;width:300px" alt="">
        ${lines.map((l, i) => `<div class="wl yh" data-i="${i}" style="position:absolute;left:44px;top:${222 + i * 86}px;font-size:82px;color:${i ? sky : '#F3F5FA'}">${l}</div>`).join('')}
        <div class="wr" style="position:absolute;left:46px;top:408px;width:140px;height:5px;border-radius:4px;background:${sky};transform-origin:left"></div>
        ${chips.map((c, i) => `<div class="wc" data-i="${i}" style="position:absolute;left:44px;top:${450 + i * 82}px;transform-origin:left center">${pill('s', c.text, c.icon, 30, '10px 24px 10px 14px', sky)}</div>`).join('')}
      </div>`,
      render(t, r) {
        const el = r.firstChild, a = t0, k = eo(t, a - .35, .5), q = ei(t, out, .32);
        show(el, k * (1 - q), `translateY(${((1 - k) * 14 - q * 10).toFixed(2)}px)`);
        el.querySelector('.wbg').style.height = hAt(t).toFixed(1) + 'px';
        el.querySelectorAll('.wl').forEach(w => { const i = +w.dataset.i, kk = eo(t, a - .3 + .06 * i, .45); w.style.opacity = kk.toFixed(3); w.style.transform = `translateY(${((1 - kk) * 16).toFixed(1)}px)`; });
        el.querySelector('.wr').style.transform = `scaleX(${io(t, a - .1, .6).toFixed(3)})`;
        el.querySelectorAll('.wc').forEach(w => popIn(w, t, chips[+w.dataset.i].t));
      } }] });
  };
  const hello = welcome({ id: 'hello', from: 0, to: ws(784), t0: 0, out: ws(784) - .14, lines: ['Platforma', 'hoş geldin!'],
    chips: [{ t: ws(381) - .1, text: 'Hep birlikte gelişeceğiz', icon: 'trend' }, { t: ws(383) - .1, text: 'Birbirimizin başarısına destek', icon: 'star' }] });
  const bye = welcome({ id: 'bye', from: C.aramiza - .4, to: END + .6, t0: C.aramiza, out: Infinity, lines: ['Aramıza', 'hoş geldin!'] });

  // ================= 12.7 - 36.3 EĞİTMEN KARTI (tanıtım videosundaki gibi; rozetler kendi kelimesinde) =================
  // 28.5'te ("Sizlere bu toplulukta...") rozet satırları söner, kart kısalır; "eşlik edeceğim" ve "Çekinmeden sor" satırları gelir.
  const EK = { x: 1080, y: 96, w: 744 };
  const rowY = i => EK.y + 160 + i * 126;
  const T_SIZ = ws(825), OT_OUT = JUMP(C.bv) - .02;                   // "Sizlere" · kart, "Bu videoda" kesiminde sönmüş olur
  const eRow = (i, t, out, iconHtml, ttl, sub, right, extraUpd) => it({ x: EK.x + 22, y: rowY(i), w: EK.w - 44, h: 116, t, out, d: .5,
    html: `<div class="yrow" style="position:absolute;inset:0;border-radius:16px;background:rgba(243,245,250,.035);border:1px solid rgba(255,255,255,.09);padding:0 18px;gap:16px">
      <div style="width:64px;height:64px;border-radius:14px;background:rgba(93,179,240,.12);display:grid;place-items:center;flex:none">${iconHtml}</div>
      <div style="flex:1;min-width:0;line-height:1.2"><div style="font-size:30px;font-weight:700;white-space:nowrap;letter-spacing:-.01em">${ttl}</div>${sub ? `<div class="ym" style="font-size:24px;margin-top:6px;white-space:nowrap;color:rgba(243,245,250,.72)">${sub}</div>` : ''}</div>${right || ''}
      <div class="glow" style="position:absolute;left:-1px;top:16px;bottom:16px;width:3px;border-radius:3px;background:${sky}"></div></div>`,
    upd(tt, el) { el.querySelector('.glow').style.opacity = (1 - io(tt, t + 1.2, .8)).toFixed(3);
      el.querySelectorAll('.rp').forEach(rp => popIn(rp, tt, +rp.dataset.t)); if (extraUpd) extraUpd(tt, el); } });
  const ekH = grow([[-9, 150], [ws(792) - .05, 298], [ws(803) - .15, 424], [ws(810) - .05, 550], [ws(817) - .05, 676],   // kart satırlarla uzar (boş kutu yok)
    [T_SIZ - .05, 150], [ws(829) - .1, 298], [ws(455) - .1, 424]], .5);
  const typingDots = `<div class="rp tb" data-t="${ws(455) + .35}" style="opacity:0;display:flex;gap:7px;padding:14px 18px;border-radius:20px 20px 20px 6px;background:rgba(93,179,240,.16);border:1px solid rgba(93,179,240,.4)">${[0, 1, 2].map(i => `<i class="td" style="width:11px;height:11px;border-radius:50%;background:#BFE3FF"></i>`).join('')}</div>`;
  const egitmen = L.scene({ id: 'egitmen', from: ws(789) - .2, to: OT_OUT + .1, z: 6, parts: [
    it({ x: EK.x, y: EK.y, w: EK.w, h: 676, t: ws(789) - .05, out: OT_OUT, d: .55, html: `<div class="ekb yc" style="position:absolute;left:0;top:0;right:0;height:676px;border-radius:22px"></div>`,
      upd(tt, el) { el.querySelector('.ekb').style.height = ekH(tt).toFixed(1) + 'px'; } }),
    it({ x: EK.x + 30, y: EK.y + 28, t: ws(789), out: OT_OUT, html: `<div class="yk" style="font-size:24px">EĞİTMEN</div>` }),
    it({ x: EK.x + 30, y: EK.y + 66, t: ws(789), out: OT_OUT, d: .55, html: `<div class="yh" style="font-size:54px">Örnek Eğitmen Adı</div>` }),
    eRow(0, ws(792), T_SIZ, `<span style="font-size:44px;font-weight:800;color:${sky};line-height:1">10</span>`, 'yıllık örnek deneyim satırı'),
    eRow(1, ws(803) - .1, T_SIZ, `<img class="rp" data-t="${ws(806)}" src="${MARK}" style="width:46px;opacity:0" alt="">`, 'Örnek Marka kurucusu', 'Örnek alt bilgi satırı'),
    eRow(2, ws(810), T_SIZ, ic('building', 34, sky, 1.8), 'Örnek Kuluçka Merkezi',   // çip başlığın altında (yan yana sığmaz)
      `<span class="rp ypill g" data-t="${ws(813)}" style="font-size:26px;padding:3px 14px 3px 6px;opacity:0">${chk('30px')}kabul</span>`),
    eRow(3, ws(817), T_SIZ, ic('code', 34, sky, 2), 'Örnek Şirket',
      `<span class="rp ypill w" data-t="${ws(821)}" style="font-size:26px;padding:4px 16px;opacity:0">Baş geliştirici</span>`),
    eRow(0, ws(829) - .05, OT_OUT, ic('play', 30, sky), 'Eğitimlerde sana eşlik edeceğim'),
    eRow(1, ws(455) - .05, OT_OUT, ic('chat', 34, sky, 1.9), 'Çekinmeden sor', null, typingDots,
      (tt, el) => el.querySelectorAll('.td').forEach((d, i) => { const ph = ((tt - ws(455)) * 1.6 - i * .18) % 1; d.style.transform = `translateY(${(-6 * Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, ph) / .5)))).toFixed(2)}px)`; })),
  ] });

  // ================= 36.4 - 47.5 BU VİDEODA (3 madde; "Öncelikle topluluğu tanıyalım"da ilk madde yanar) =================
  const BV = { x: 1104, y: 190, w: 708 };
  const BVI = [[ws(839), 'Platformun hedefi'], [ws(841), 'Platform nasıl kullanılır'], [ws(844), 'Eğitimde adım adım ilerlemek']];
  const bvOut = JUMP(C.hedefIn) - .02, bvH = grow([[-9, 92], ...BVI.map(([t], i) => [t, 92 + 106 * (i + 1) + (i === 2 ? 14 : 0)])]);
  const buVideoda = L.scene({ id: 'buvideoda', from: C.bv - .1, to: bvOut + .1, z: 6, parts: [
    it({ x: BV.x, y: BV.y, w: BV.w, t: C.bv, out: bvOut, d: .5,
      html: `<div class="bb yc" style="position:absolute;left:0;top:0;right:0;border-radius:22px"></div>
        <div class="yk yrow" style="position:absolute;left:32px;top:30px;font-size:26px;gap:12px">${ic('film', 30, sky, 1.9)}BU VİDEODA</div>
        ${BVI.map(([, tx], i) => `<div class="bvr yrow" data-i="${i}" style="position:absolute;left:24px;right:24px;top:${92 + i * 106}px;height:92px;border-radius:16px;background:rgba(243,245,250,.035);border:1px solid rgba(255,255,255,.09);padding:0 20px;gap:18px">
          <div class="bn" style="width:50px;height:50px;border-radius:50%;background:rgba(93,179,240,.14);border:2px solid rgba(93,179,240,.55);display:grid;place-items:center;font-size:26px;font-weight:800;color:#BFE3FF;flex:none">${i + 1}</div>
          <div style="flex:1;font-size:32px;font-weight:700;white-space:nowrap;letter-spacing:-.01em">${tx}</div>
          <span class="ba" style="opacity:0;color:${sky}">${ic('arrowR', 34, sky, 2.4)}</span></div>`).join('')}`,
      upd(tt, el) { el.querySelector('.bb').style.height = bvH(tt).toFixed(1) + 'px';
        el.querySelectorAll('.bvr').forEach(rw => { const i = +rw.dataset.i, k = eo(tt, BVI[i][0] - .05, .45); rw.style.opacity = k.toFixed(3); rw.style.transform = `translateY(${((1 - k) * 14).toFixed(1)}px)`; });
        const on = io(tt, ws(854), .4), r0 = el.querySelector('.bvr');            // "Öncelikle": 1. madde yanar
        css(r0, { background: `rgba(43,127,217,${(.035 + .2 * on).toFixed(3)})`, borderColor: `rgba(93,179,240,${(.09 + .5 * on).toFixed(3)})` });
        css(r0.querySelector('.bn'), { background: on > .5 ? '#2B7FD9' : '', color: on > .5 ? '#fff' : '' });
        popIn(r0.querySelector('.ba'), tt, ws(854) + .1);
        el.querySelectorAll('.bvr').forEach((rw, i) => { if (i) rw.style.opacity = (eo(tt, BVI[i][0] - .05, .45) * (1 - .45 * on)).toFixed(3); }); } }),
  ] });

  // ================= 47.6 - 67.2 PLATFORMUN HEDEFİ: yükselen yol (söylendikçe) =================
  const HD = { x: 1084, y: 92, w: 736 };
  const GOALS = [[ws(864), 'code', 'Yapay zekâyla yazılımı doğru öğren', 80], [ws(872), 'refresh', 'Hayatına entegre et', 180],
    [ws(882), 'mega', 'Pazarla', 334], [ws(886), 'lira', 'Gelir elde et', 434]];
  const T_UST = ws(877), T_TOP = ws(892), T_TICK = ws(895), T_WIN = ws(896), HD_OUT = ws(900) - .07;
  const hdH = grow([[-9, 64], [GOALS[0][0], 176], [GOALS[1][0], 276], [T_UST, 322], [GOALS[2][0], 430], [GOALS[3][0], 530], [T_TOP, 646]]);
  const RX = 30 + 30;                                                  // ray ekseni (kart içi x)
  const hedef = L.scene({ id: 'hedef', from: C.hedefIn - .1, to: HD_OUT + .1, z: 6, parts: [
    it({ x: HD.x, y: HD.y, w: HD.w, t: C.hedefIn, out: HD_OUT, od: .35, d: .5,
      html: `<div class="hb yc" style="position:absolute;left:0;top:0;right:0;border-radius:22px"></div>
        <div class="yk yrow" style="position:absolute;left:30px;top:26px;font-size:24px;gap:12px">${ic('target', 28, sky, 2)}PLATFORMDAKİ HEDEFİMİZ</div>
        <svg class="rl" style="position:absolute;left:0;top:0;overflow:visible" width="${HD.w}" height="600"><path class="rf" pathLength="1" d="M${RX} 110 L${RX} 464" stroke="${sky}" stroke-width="4" stroke-linecap="round" style="stroke-dasharray:1 1;stroke-dashoffset:1"/></svg>
        ${GOALS.map(([, icn, tx, y], i) => `<div class="hg yrow" data-i="${i}" style="position:absolute;left:30px;right:26px;top:${y}px;height:60px;gap:22px">
          <div class="hn" style="position:relative;width:60px;height:60px;border-radius:50%;background:#12233F;border:2px solid rgba(93,179,240,.55);display:grid;place-items:center;flex:none">${ic(icn, 30, sky, 1.9)}<span class="hk" style="position:absolute;right:-8px;bottom:-6px;opacity:0">${chk('28px')}</span></div>
          <div style="font-size:31px;font-weight:700;white-space:nowrap;letter-spacing:-.01em">${tx}</div></div>`).join('')}
        <div class="hu yk yrow" style="position:absolute;left:108px;top:276px;font-size:24px;gap:10px;color:#BFE3FF">${ic('arrowU', 28, '#BFE3FF', 2.4)}BİR ÜST SEVİYE</div>
        <div class="ht yrow" style="position:absolute;left:24px;right:24px;top:548px;height:76px;border-radius:16px;background:rgba(43,127,217,.16);border:1px solid rgba(93,179,240,.5);padding:0 20px;gap:18px">
          <img src="${MARK}" style="width:46px" alt=""><div style="font-size:30px;font-weight:700;white-space:nowrap">Tüm yöntemler platformun içinde</div></div>`,
      upd(tt, el) { el.querySelector('.hb').style.height = hdH(tt).toFixed(1) + 'px';
        el.querySelectorAll('.hg').forEach(g => { const i = +g.dataset.i, k = eo(tt, GOALS[i][0] - .05, .45); g.style.opacity = k.toFixed(3); g.style.transform = `translateY(${((1 - k) * 14).toFixed(1)}px)`;
          const n = g.querySelector('.hn'), on = io(tt, GOALS[i][0], .4); n.style.background = `rgb(${lerp(18, 27, on).toFixed(0)},${lerp(35, 78, on).toFixed(0)},${lerp(63, 134, on).toFixed(0)})`;   // opak: ray düğümün içinden görünmez
          popIn(g.querySelector('.hk'), tt, T_TICK + i * .16); });
        const fill = [1, 2, 3].reduce((q, j) => q + io(tt, GOALS[j][0] - .15, .45) * (GOALS[j][3] - GOALS[j - 1][3]) / (GOALS[3][3] - GOALS[0][3]), 0);   // ray yalnız görünen düğümlere kadar
        el.querySelector('.rf').style.strokeDashoffset = (1 - fill).toFixed(4);
        const hu = el.querySelector('.hu'), ku = eo(tt, T_UST, .45); hu.style.opacity = ku.toFixed(3); hu.style.transform = `translateY(${((1 - ku) * 10).toFixed(1)}px)`;
        const ht = el.querySelector('.ht'), kt = eo(tt, T_TOP, .45), win = io(tt, T_WIN, .5);
        ht.style.opacity = kt.toFixed(3); ht.style.transform = `translateY(${((1 - kt) * 14).toFixed(1)}px)`;
        ht.style.boxShadow = win > 0 ? `0 0 0 ${(3 * win).toFixed(2)}px rgba(93,179,240,${(.7 * win * (1 - io(tt, T_WIN + .9, .8))).toFixed(3)})` : 'none'; } }),
  ] });

  // ================= 70.3 - 78.3 TARAYICI: adres yazılır, giriş sayfası, "Giriş yap" tıklanır -> panel (aynı pencere) =================
  const BW = { x: 1052, y: 66, w: 772, h: 728 };
  const loginHtml = `<div class="yz" style="position:absolute;inset:0">
      <div class="nt" style="position:absolute;left:0;right:0;top:170px;display:flex;flex-direction:column;align-items:center;gap:34px"><img src="${MARK}" style="width:84px;opacity:.55" alt="">
        <div class="yrow" style="width:560px;height:76px;border-radius:99px;background:rgba(243,245,250,.07);border:1px solid rgba(255,255,255,.14);padding:0 28px;gap:16px">${ic('search', 30, 'rgba(243,245,250,.6)', 2.2)}<span class="ntx" style="font-size:32px;font-weight:700;white-space:nowrap"></span><i class="ntc" style="width:3px;height:36px;background:${sky}"></i></div></div>
      <div class="lg" style="position:absolute;inset:0;opacity:0">
        <img src="${LOGO}" style="position:absolute;left:${(BW.w - 240) / 2}px;top:40px;width:240px" alt="">
        <div class="yc" style="position:absolute;left:${(BW.w - 500) / 2}px;top:191px;width:500px;padding:30px 34px">
          <div class="yh" style="font-size:40px">Giriş yap</div>
          <div class="ym" style="font-size:24px;margin-top:18px;color:rgba(243,245,250,.75)">E-posta</div>
          <div class="yrow" style="margin-top:8px;height:56px;border-radius:14px;background:rgba(243,245,250,.05);border:1px solid rgba(255,255,255,.14);padding:0 16px;gap:12px">${ic('mail', 24, 'rgba(243,245,250,.55)', 1.9)}<div class="em ysk" style="height:11px;width:0;background:rgba(243,245,250,.4)"></div></div>
          <div class="ym" style="font-size:24px;margin-top:16px;color:rgba(243,245,250,.75)">Şifre</div>
          <div class="yrow" style="margin-top:8px;height:56px;border-radius:14px;background:rgba(243,245,250,.05);border:1px solid rgba(255,255,255,.14);padding:0 16px;gap:12px">${ic('lock', 24, 'rgba(243,245,250,.55)', 1.9)}<div class="pw yrow" style="gap:8px">${[...Array(8).keys()].map(() => '<i style="width:11px;height:11px;border-radius:50%;background:rgba(243,245,250,.7);opacity:0"></i>').join('')}</div></div>
          <div class="lb ypill w" style="margin-top:24px;width:100%;height:60px;justify-content:center;font-size:28px;font-weight:800">Giriş yap ${ic('arrowR', 28, '#0A1122', 2.4)}</div>
        </div></div></div>`;
  const PAGE_T = ws(917) - .35, T_GIR = ws(920) + .05, BTN = { x: BW.x + BW.w / 2, y: BW.y + 44 + 191 + 30 + 42 + 18 + 29 + 8 + 56 + 16 + 29 + 8 + 56 + 24 + 30 };
  const browser = L.scene({ id: 'browser', from: C.browserIn - .1, to: C.panelIn + .45, z: 6, parts: [
    TP.browser({ ...BW, t: C.browserIn, out: C.panelIn + .1, od: .14, url: { a: ws(913) + .05, b: ws(915) + .45, text: 'ornekmarka.com/uye' }, page: loginHtml, pageT: C.browserIn,
      upd(tt, el) { const lg = el.querySelector('.lg'), k = eo(tt, PAGE_T, .45); lg.style.opacity = k.toFixed(3); el.querySelector('.nt').style.opacity = (1 - eo(tt, PAGE_T - .2, .3)).toFixed(3);
        const U = 'ornekmarka.com/uye', nU = Math.round(clamp((tt - ws(913) - .05) / (ws(915) + .4 - ws(913))) * U.length);   // yeni sekmede ortadaki büyük adres kutusu (okunur)
        el.querySelector('.ntx').textContent = tt < ws(913) ? '' : U.slice(0, nU); el.querySelector('.ntc').style.opacity = (Math.floor(tt * 2.6) % 2 ? .15 : 1).toString();
        el.querySelector('.em').style.width = (62 * io(tt, PAGE_T + .45, .5)).toFixed(1) + '%';
        el.querySelectorAll('.pw i').forEach((d, i) => { d.style.opacity = (tt >= PAGE_T + 1.0 + i * .06 ? 1 : 0).toString(); });
        const b = el.querySelector('.lb'); b.style.transform = `scale(${(1 - .05 * bump(tt, T_GIR, .22)).toFixed(3)})`; } }),
    TP.cursor([{ t: PAGE_T + 1.1, to: { x: BTN.x + 150, y: BTN.y - 170 }, d: .1 }, { t: ws(920), to: { x: BTN.x + 40, y: BTN.y + 4 }, d: .6, click: T_GIR, hold: .7 }]),
  ] });

  // ===================== PANEL TURU (78.0 - 239.8): tek arayüz, pencere <-> tam ekran =====================
  const MENU = [['home', 'Ana Sayfa', 'home'], ['egitim', 'Eğitimler', 'book'], ['kutup', 'Kütüphane', 'library'], ['topluluk', 'Topluluk', 'users'],
    ['hap', 'Hap Bilgiler', 'zap'], ['takvim', 'Takvim', 'calendar'], ['hesap', 'Hesabım', 'user']];
  const uKeys = HID.flatMap(([a, b]) => [{ t: a + GROW, to: 1, d: .8 }, { t: b - SHRINK, to: 0, d: .8 }]);
  const P_OUT = JUMP(C.yapman) - .02;
  const T_EGT = ws(929);                                               // "eğitimler": menüde tıklanır
  const OUT_HOME = T_EGT + .15, OUT_EG = C.dersIn, OUT_DERS = C.hapClick + .12, OUT_HAP = C.takvimClick + .12, OUT_TAK = C.toplulukClick + .1;
  const sub2 = 'opacity:calc((var(--u) - .6) * 2.5)';                  // yalnız tam ekranda görünen ikincil satır

  // ---- Ana Sayfa (giriş sonrası) ----
  const homeHero = card(`${kick('FİKİRDEN ÇALIŞAN ÜRÜNE')}<div class="yh" style="font-size:1.6em;margin-top:.35em">Hoş geldin!</div>
    <div class="ym" style="font-size:.86em;margin-top:.4em;line-height:1.4">Bugün kendi projen için bir adım at.<br>Yapay zekâ yanında, sen yönet.</div>
    <span class="ypill w" style="font-size:1em;padding:.35em .85em;margin-top:.6em">Eğitimlere göz at ${icE('arrowR', .95, '#0A1122', 2.4)}</span>`, '.85em 1em');
  const homeProg = card(`${kick('GELİŞİM DURUMUN', 'star')}<div class="ybar" style="height:.36em;margin-top:.6em"><b style="width:0"></b></div>
    <div class="ym" style="font-size:.86em;margin-top:.5em;white-space:nowrap">Video, görev ve kısa bilgi bitirdikçe artar.</div>`, '.8em 1em');
  const homeCom = card(`${postHead('Ayşe Y.', eduBadge, 'Genel sohbet', false)}<div class="ym" style="font-size:.86em;margin-top:.45em;color:rgba(243,245,250,.85);white-space:nowrap">Herkese selam arkadaşlar. Hepiniz hoş geldiniz.</div>`, '.7em 1em');

  // ---- Eğitimler ----
  const MODS = ['bulb', 'layers', 'code', 'rocket'];
  const modCard = (n, icon) => card(`<div style="position:absolute;left:0;right:0;top:0;height:58%;background:${thumbBg(n)};display:grid;place-items:center">${icE(icon, 1.7, '#BFE3FF', 1.5)}</div>
    <div class="yh" style="position:absolute;left:0;right:0;bottom:.4em;text-align:center;font-size:1em">Modül ${n}</div>
    <div class="sel" style="position:absolute;inset:0;border-radius:18px;box-shadow:inset 0 0 0 3px ${sky};opacity:0"></div>`, '0');
  const LESW = [62, 48, 70, 55];
  const lesRow = n => card(`<div class="yrow" style="height:100%;gap:.55em">
    <div class="lp" style="width:1.45em;height:1.45em;border-radius:50%;background:rgba(93,179,240,.14);display:grid;place-items:center;color:${sky};flex:none">${icE('play', .75)}</div>
    <div class="yt" style="font-size:1em;white-space:nowrap;font-weight:700">${n}. ders</div>
    <div style="flex:1;min-width:0;height:.36em;position:relative"><div class="ysk" style="position:absolute;left:0;top:0;height:.36em;width:${LESW[n - 1]}%"></div></div>
    ${n === 1 ? `<span class="go ypill w" style="font-size:.93em;padding:.2em .75em;opacity:0">Başla ${icE('arrowR', .9, '#0A1122', 2.4)}</span>` : ''}</div>`, '0 .7em', 'soft');
  const T_STEP = ws(949), T_KUR = ws(952), T_PROG = ws(954);
  const stairsHtml = card(`${kick('ADIM ADIM', 'trend')}<span class="lbl ypill s" style="position:absolute;left:1em;top:2.2em;font-size:.93em;padding:.12em .7em;opacity:0">${icE('flag', 1, '#BFE3FF', 2)}Eğitim programı</span>
    <div style="position:absolute;left:1em;right:1em;bottom:.9em;height:5em">${[0, 1, 2, 3].map(i => `<i class="sb" data-i="${i}" style="position:absolute;bottom:0;left:${i * 25}%;width:calc(25% - .35em);height:${28 + 24 * i}%;border-radius:.45em .45em .15em .15em;background:rgba(93,179,240,.1);border:1.5px solid rgba(93,179,240,.3)"></i>`).join('')}</div>`, '.85em 1em');
  const PN = [[ws(970), 'bulb', 'Fikir'], [ws(971), 'cpu', 'Yapay zekâ'], [ws(974), 'code', 'Yazılım']];
  const pathHtml = card(`<div class="yrow" style="position:absolute;inset:0;justify-content:center;gap:.8em">${PN.map(([, n, tx], i) => `${i ? `<i class="dl" data-i="${i}" style="width:3em;height:4px;border-radius:2px;background:rgba(93,179,240,.2);margin-bottom:1.5em"></i>` : ''}<div style="display:flex;flex-direction:column;align-items:center;gap:.35em"><div class="dn" data-i="${i}" style="position:relative;width:2.6em;height:2.6em;border-radius:50%;background:rgba(93,179,240,.08);border:2px solid rgba(93,179,240,.35);display:grid;place-items:center">${icE(n, 1.35, '#BFE3FF', 1.6)}${i === 2 ? `<span class="pk" style="position:absolute;right:-.35em;top:-.3em;opacity:0">${chk('1.15em')}</span>` : ''}</div><span class="dt" data-i="${i}" style="font-size:1em;font-weight:800;color:rgba(243,245,250,.45)">${tx}</span></div>`).join('')}</div>`, '0');

  // ---- Ders sayfası + Soru-Cevap ----
  const TABS = [[ws(994), 'Kaynaklar'], [ws(995), 'Ders açıklaması'], [ws(1004), 'Soru-Cevap']];
  const T_ALT = ws(991), T_ONEMLI = ws(1003);
  const playerHtml = card(`<div style="position:absolute;left:0;right:0;top:0;bottom:2.1em;background:linear-gradient(135deg,#123059,#0A1122 62%,#15305A);overflow:hidden">
      <div style="position:absolute;left:6%;top:14%;width:46%">${[70, 52, 84, 40, 66].map((w, i) => `<div style="height:.4em;border-radius:.3em;margin:0 0 .55em ${(i % 3)}em;width:${w}%;background:${['#5DB3F0', '#BFE3FF', '#F3F5FA'][i % 3]};opacity:.5"></div>`).join('')}</div>
      <div style="position:absolute;right:6%;top:14%;width:32%;height:62%;border-radius:10px;background:rgba(243,245,250,.08);border:1px solid rgba(255,255,255,.1)"></div>
      <div class="pp" style="position:absolute;left:50%;top:50%;width:2.6em;height:2.6em;margin:-1.3em;border-radius:50%;background:#2B7FD9;display:grid;place-items:center;box-shadow:0 0 0 .4em rgba(43,127,217,.25)">${icE('play', 1.2, '#fff')}</div></div>
    <div class="yrow" style="position:absolute;left:.8em;right:.8em;bottom:.6em;gap:.6em"><span style="color:${sky}">${icE('play', .9, sky)}</span><div class="ybar" style="flex:1;height:.3em"><b style="width:0"></b></div></div>`, '0');
  const tabsHtml = plain(`<div class="yrow" style="height:100%;gap:.38em;border-bottom:1px solid rgba(255,255,255,.1)">${TABS.map(([, tx], i) => `<span class="ypill o qtab qtab${i + 1}" style="position:relative;font-size:.93em;padding:.22em .62em;opacity:0">${tx}${i === 2 ? `<span class="qs" style="position:absolute;right:-.45em;top:-.55em;width:1.15em;height:1.15em;border-radius:50%;background:#FFD23F;display:grid;place-items:center;opacity:0">${icE('star', .72, '#0A1122', 2.4)}</span>` : ''}</span>`).join('')}</div>`);
  const resHtml = card(`${[0, 1].map(i => `<div class="yrow" style="gap:.6em;margin-top:${i ? .55 : 0}em;height:2.2em;border-radius:12px;background:rgba(243,245,250,.035);border:1px solid rgba(255,255,255,.08);padding:0 .6em"><span style="color:${sky}">${icE('file', 1, sky, 1.9)}</span><div class="ysk" style="height:.4em;width:${[52, 38][i]}%"></div></div>`).join('')}`, '.8em 1em', 'soft');
  const descHtml = card(`${skel([92, 84, 88, 60])}`, '.5em 1em', 'soft');
  const soruPill = '<span class="ypill o" style="font-size:.86em;padding:.04em .5em">Soru</span>';
  const qPost = (i) => postCard('Katılımcı', soruPill, `<div class="ysk" style="height:.4em;width:${[86, 70][i]}%;margin-top:.55em"></div>`, 'Soru-Cevap', true, '.65em 1em');
  const T_DIGER = ws(1024), T_KEND = ws(1030), T_SOR = ws(1033), T_EGTM = ws(1035);
  const qCompHtml = card(`<div class="yrow" style="height:100%;gap:.6em">
      <div class="yav anon" style="width:1.75em;height:1.75em">${icE('user', .95, 'rgba(243,245,250,.7)', 1.8)}</div>
      <div class="yrow" style="flex:1;height:2.2em;border-radius:12px;background:rgba(243,245,250,.05);border:1px solid rgba(255,255,255,.14);padding:0 .7em;gap:.3em"><div class="ty ysk" style="height:.42em;width:0;background:rgba(243,245,250,.5)"></div><i class="cr" style="width:2px;height:1.1em;background:${sky}"></i></div>
      <span class="qSend ypill w" style="font-size:1em;padding:.35em .9em">${icE('chat', 1, '#0A1122', 2)}Soru sor</span></div>`, '0 .9em');
  const qMineHtml = postCard('Sen', soruPill, `<div class="ysk" style="height:.4em;width:74%;margin-top:.55em;background:rgba(243,245,250,.22)"></div>`, 'Soru-Cevap', true, '.65em 1em');
  const qReplyHtml = postCard('Ayşe Y.', eduBadge, `<div class="ysk" style="height:.4em;width:80%;margin-top:.5em"></div><span class="rk" style="position:absolute;right:.9em;top:.8em;opacity:0">${chk('1.5em')}</span>`, 'Yanıt', false, '.6em 1em');

  // ---- Hap Bilgiler ----
  const SHELF_N = 10, T_DIKEY = ws(1064), T_INSTA = ws(1067), T_TIK = ws(1071), T_KISA = ws(1080), T_FARKLI = ws(1098);
  const AREA_IC = ['zap', 'code', 'mega', 'trend', 'tool', 'brief', 'search', 'layers', 'bulb', 'film'];
  const shelfX = t => 1.2 * io(t, T_DIKEY, 2.0) + 1.0 * io(t, T_TIK, 1.6);
  const hapHead = plain(`<div class="yrow" style="gap:.5em"><div style="width:1.9em;height:1.9em;border-radius:12px;background:rgba(93,179,240,.15);display:grid;place-items:center;flex:none">${icE('zap', 1.15, sky, 2)}</div>${title('Hap Bilgiler')}</div>`);
  const hPill = (txt, icon, cls = 's') => plain(`<span class="hp ypill ${cls}" style="font-size:.93em;padding:.2em .65em .2em .5em">${icE(icon, 1.1, 'currentColor', 2.1)}${txt}</span>`);

  // ---- Takvim ----
  const LIVE = [5, 19], OTHER = [9, 23], NEWEV = 26;
  const calHtml = () => card(`<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:.25em;font-size:.86em;font-weight:800;color:rgba(243,245,250,.55);text-align:center">${['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => `<span>${d}</span>`).join('')}</div>
    <div style="position:absolute;left:.7em;right:.7em;top:1.9em;bottom:.6em;display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(5,1fr);gap:.25em">${[...Array(35).keys()].map(i => `<div class="cel" data-i="${i}" style="position:relative;border-radius:.4em;background:rgba(243,245,250,${i < 30 ? .035 : .015});padding:.15em .35em;font-size:.66em;font-weight:700;color:rgba(243,245,250,${i < 30 ? .6 : .22})">${i < 30 ? i + 1 : ''}${LIVE.concat(OTHER, [NEWEV]).includes(i) ? `<i class="ev ${i === NEWEV ? 'evNew' : ''}" style="position:absolute;left:1.75em;right:.4em;top:.5em;height:.55em;border-radius:.3em;background:${OTHER.includes(i) ? sky : '#E5383B'};opacity:0"></i>` : ''}</div>`).join('')}</div>`, '.45em .7em');
  const legHtml = plain(`<div class="yrow" style="height:100%;gap:.5em"><span class="lg1 ypill o" style="font-size:.93em;padding:.18em .7em;opacity:0"><i class="ydot" style="background:#E5383B"></i>Canlı oturum</span><span class="lg2 ypill o" style="font-size:.93em;padding:.18em .7em;opacity:0"><i class="ydot"></i>Diğer etkinlikler</span></div>`);
  const T_KATIL = C.katilma, T_LINK = C.link;
  const evHtml = card(`<div class="yrow" style="gap:.5em"><span class="ypill r" style="font-size:.86em;padding:.1em .6em"><i class="ydot lv" style="background:#E5383B"></i>CANLI</span><span class="yh" style="font-size:1.15em">Canlı oturum</span></div>
    <span class="katil ypill w" style="font-size:1em;padding:.32em .9em;margin-top:.55em"><span class="kc" style="display:none">${icE('check', .95, '#fff', 3)}</span><span class="kt">Katılma talebi gönder</span></span>
    <div class="lk yrow" style="margin-top:.55em;height:1.9em;border-radius:12px;background:rgba(243,245,250,.04);border:1px solid rgba(255,255,255,.1);padding:0 .6em;gap:.5em;opacity:0"><span style="color:${sky}">${icE('link', 1, sky, 2)}</span><span class="yt" style="font-size:1em;font-weight:700">Link</span><div class="ysk" style="flex:1;height:.4em;filter:blur(1.5px)"></div><span style="color:rgba(243,245,250,.6)">${icE('copy', .95, 'currentColor', 1.9)}</span></div>`, '.7em .9em');

  // ---- Yakında (çekmece) ----
  const T_YENI = ws(1155), T_HEPSI = ws(1160), T_ADIM = ws(1163), T_YENILIK = ws(1174);
  const soonHtml = card(`<div class="yrow" style="gap:.5em">${tile('lock', 48, '#BFE3FF', 'rgba(93,179,240,.14)', 12)}<span class="yk" style="font-size:.86em">YAKINDA</span></div>
    <div class="sa" style="opacity:0"><div class="yh" style="font-size:1.15em;margin-top:.6em">Adım adım</div>
    <div class="ybar" style="height:.36em;margin-top:.45em"><b class="sp" style="width:0"></b></div></div>`, '.85em .95em');

  // ---- Topluluk ----
  const CTABS = [['chat', 'Genel sohbet', ws(1198)], ['star', 'Başarılar', ws(1200)], ['tool', 'Teknik destek', ws(1202)]];
  const cTabsHtml = plain(`${title('Topluluk')}<div class="yrow" style="gap:.38em;margin-top:.35em">${CTABS.map(([n, tx], i) => `<span class="ypill ctab ctab${i}" style="font-size:.93em;padding:.2em .62em;border:1px solid rgba(255,255,255,.14);${i ? 'background:rgba(255,255,255,.04);color:rgba(243,245,250,.85)' : 'background:#F3F5FA;color:#0A1122'}"><span class="ci" style="display:none">${icE(n, 1, 'currentColor', 2)}</span>${tx}</span>`).join('')}</div>`);
  const pinHtml = postCard('Ayşe Y.', eduBadge, `<div class="ym" style="font-size:.86em;margin-top:.5em;color:rgba(243,245,250,.88);line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Herkese selam arkadaşlar.<br>Hepiniz hoş geldiniz.</div>`, 'Sabitlenen mesaj', false, '.7em 1em');
  const T_MSG_A = ws(1205) + .3, T_MSG_B = ws(1208) + .3, T_SEND = ws(1209), T_DIGER2 = ws(1210);
  const line = w => `<div class="ysk" style="height:.4em;width:${w}%;margin-top:.5em"></div>`;
  const FEED = [   // [eklenme anı, ad, rozet, alt satır (kanal), içerik]
    [ws(1195), 'Katılımcı', soruPill, 'Genel sohbet', line(84)],
    [ws(1200) + .1, 'Katılımcı', `<span style="color:#FFD23F">${icE('star', .95, '#FFD23F', 2)}</span>`, 'Başarılar', line(78)],
    [ws(1202) + .1, 'Katılımcı', `<span style="color:${sky}">${icE('tool', .95, sky, 2)}</span>`, 'Teknik destek', line(88)],
    [T_SEND + .12, 'Sen', '<span class="ym" style="font-size:.86em">· Genel sohbet</span>', '<span style="color:#F3F5FA;font-weight:600">Herkese merhabalar!</span>', ''],
    [T_DIGER2 + .15, 'Katılımcı', '', 'Genel sohbet', line(72)],
    [ws(1212) + .1, 'Katılımcı', '', 'Genel sohbet', line(90)],
  ];
  const feedHtml = `<div style="position:absolute;inset:0;overflow:hidden">${FEED.map(([, n, b, s, c], i) => `<div class="fp" data-i="${i}" style="position:absolute;left:0;right:0">${postCard(n, b, c, s, true, '.48em 1em')}</div>`).join('')}</div>`;
  const MSG = 'Herkese merhabalar!';
  const cCompHtml = card(`${kick('MESAJ GÖNDER', 'send')}<div class="yrow" style="margin-top:.6em;height:2.3em;border-radius:12px;background:rgba(243,245,250,.05);border:1px solid rgba(255,255,255,.14);padding:0 .3em 0 .7em;gap:.3em">
      <span class="mt yt" style="font-size:1em;font-weight:700;white-space:nowrap"></span><i class="cr" style="width:2px;height:1.1em;background:${sky}"></i><span style="flex:1"></span>
      <span class="cSend" style="width:1.8em;height:1.8em;border-radius:50%;background:#2B7FD9;display:grid;place-items:center">${icE('send', .9, '#fff', 2)}</span></div>`, '.8em .95em');
  const memHtml = card(`${kick('KATILIMCILAR', 'users')}<div class="yrow" style="gap:.32em;margin-top:.65em;flex-wrap:wrap">${[...Array(14).keys()].map(i => `<div class="mav yav anon" style="width:1.5em;height:1.5em;font-size:1em;opacity:0;${i % 4 === 1 ? 'background:#2B7FD9;color:#fff' : ''}">${icE('user', .8, 'currentColor', 1.8)}</div>`).join('')}</div>`, '.8em .95em');
  const chanHtml = card(`${kick('TAKILDIĞINDA', 'hand')}${[['chat', 'Soru-Cevap', 'Dersin altında'], ['users', 'Topluluk', 'Genel sohbet'], ['tool', 'Teknik destek', 'Topluluk sekmesi']].map(([n, tx, sb], i) => `<div class="ch yrow" data-i="${i}" style="margin-top:${i ? .4 : .6}em;height:2.6em;border-radius:14px;background:rgba(243,245,250,.035);border:1px solid rgba(255,255,255,.09);padding:0 .7em;gap:.6em;opacity:0">
      <div style="width:1.7em;height:1.7em;border-radius:10px;background:rgba(93,179,240,.14);display:grid;place-items:center;flex:none">${icE(n, 1, sky, 1.9)}</div><span class="yt" style="font-size:1em;font-weight:800;white-space:nowrap">${tx}</span><span class="ym" style="font-size:.86em;white-space:nowrap">${sb}</span></div>`).join('')}`, '.85em 1em');

  const panel = TP.panel({ id: 'panel', from: C.panelIn - .05, to: P_OUT + .1, menu: MENU, url: 'ornekmarka.com/uye/panel', user: { name: 'Katılımcı', sub: 'Tam erişim' },
    enter: { t: C.panelIn - .04, d: .14, s: 1, stagger: .05 }, out: P_OUT, uKeys,                  // aynı pencere: kabuk anında, içerik sırayla
    active: [{ t: -1, key: 'home' }, { t: T_EGT + .03, key: 'egitim' }, { t: C.hapClick + .03, key: 'hap' }, { t: C.takvimClick + .03, key: 'takvim' }, { t: C.toplulukClick + .03, key: 'topluluk' }],
    drawer: [{ a: C.alanlar + .15, b: C.toplulukClick + .45 }],
    ghosts: { t: T_YENI, n: 2, label: 'Yakında', icon: 'lock', wiggle: T_HEPSI, out: C.toplulukClick + .3 },
    ring: [{ key: 'egitim', a: ws(927), b: T_EGT + .35 }, { key: 'topluluk', a: ws(1180), b: C.toplulukClick + .2 }],   // "sol tarafta" / "topluluk" 
    bell: { jig: T_YENILIK, dot: T_YENILIK + .1 },
    cursor: [
      { t: ws(927), to: { x: 1180, y: 600 }, d: .1 },
      { t: T_EGT, to: { menu: 'egitim' }, d: .75, click: T_EGT + .03, hold: .8 },
      { t: C.qaClick - .02, to: { sel: '.qtab3' }, d: .8, click: C.qaClick, hold: .9 },
      { t: T_KEND, to: { blk: 'qComp', ax: .42, ay: .5 }, d: .6, click: T_KEND + .03, hold: 1.6 },
      { t: T_SOR - .02, to: { sel: '.qSend' }, d: .5, click: T_SOR, hold: .7 },
      { t: C.hapClick - .02, to: { menu: 'hap' }, d: .8, click: C.hapClick, hold: .8 },
      { t: C.takvimClick - .02, to: { menu: 'takvim' }, d: .8, click: C.takvimClick, hold: .8 },
      { t: ws(1135), to: { sel: '.evNew' }, d: .7, click: ws(1135) + .03, hold: 1.2 },
      { t: T_KATIL - .02, to: { sel: '.katil' }, d: .55, click: T_KATIL, hold: .8 },
      { t: ws(1186), to: { menu: 'topluluk' }, d: .8, hold: 3 },
      { t: C.toplulukClick, to: { menu: 'topluluk' }, d: .15, click: C.toplulukClick, hold: .5 },
      { t: ws(1205) + .05, to: { blk: 'cComp', ax: .45, ay: .62 }, d: .6, click: ws(1205) + .08, hold: 1.5 },
      { t: T_SEND - .02, to: { sel: '.cSend' }, d: .45, click: T_SEND, hold: .8 },
    ],
    blocks: [
      // ---- Ana Sayfa ----
      { id: 'aHero', t: C.panelIn + .16, out: OUT_HOME, W: [0, 0, 650, 300], F: [0, 0, 1378, 300], html: homeHero },
      { id: 'aProg', t: C.panelIn + .26, out: OUT_HOME, W: [0, 316, 650, 148], F: [0, 316, 1378, 148], html: homeProg },
      { id: 'aCom', t: C.panelIn + .36, out: OUT_HOME, W: [0, 480, 650, 140], F: [0, 480, 1378, 140], html: homeCom },
      // ---- Eğitimler (tam ekran: modüller, dersler adım adım, eğitim programı basamakları -> pencere: 1. modül 1. ders, fikir -> yazılım) ----
      { id: 'eHead', t: T_EGT + .2, out: OUT_EG, W: [0, 0, 650, 56], F: [0, 0, 1378, 100],
        html: plain(`${title('Eğitimler')}<div class="ym" style="font-size:.86em;margin-top:.35em;white-space:nowrap;${sub2}">Adım adım ilerle: dersi izle, görevi varsa yap, sonra sıradakine geç.</div>`) },
      ...MODS.map((icn, i) => ({ id: 'm' + i, t: T_EGT + .45 + i * .1, out: OUT_EG, W: [i * 166, 68, 152, 128], F: [i * 350, 116, 326, 196], html: modCard(i + 1, icn),
        upd: i ? null : (tt, el) => { el.querySelector('.sel').style.opacity = eo(tt, ws(962), .3).toFixed(3); } })),
      ...[0, 1, 2, 3].map(i => ({ id: 'l' + i, t: T_STEP - .1 + i * .12, out: OUT_EG, W: [0, 210 + i * 62, 650, 54], F: [0, 334 + i * 76, 900, 64], html: lesRow(i + 1),
        upd(tt, el) { const on = io(tt, T_STEP + .35 + i * .25, .3), lp = el.querySelector('.lp');
          css(lp, { background: `rgba(93,179,240,${(.14 + .7 * on).toFixed(3)})`, color: on > .5 ? '#fff' : sky, transform: `scale(${(1 + .15 * bump(tt, T_STEP + .35 + i * .25, .4)).toFixed(3)})` });
          if (i === 0) { const hl = io(tt, ws(958), .4); el.firstChild.style.boxShadow = hl > 0 ? `inset 0 0 0 ${(2.5 * hl).toFixed(2)}px ${sky}` : ''; popIn(el.querySelector('.go'), tt, ws(966)); } } })),
      { id: 'eStairs', t: T_KUR - .15, out: C.h1Out - SHRINK, od: .3, only: 'full', W: [924, 334, 454, 296], F: [924, 334, 454, 296], html: stairsHtml,   // küçülmeden önce söner
        upd(tt, el) { el.querySelectorAll('.sb').forEach(b => { const i = +b.dataset.i, k = io(tt, T_KUR + i * .22, .3);
            css(b, { background: k > 0 ? `linear-gradient(180deg, rgba(93,179,240,${(.25 + .6 * k).toFixed(3)}), rgba(43,127,217,${(.25 + .55 * k).toFixed(3)}))` : 'rgba(93,179,240,.1)', borderColor: `rgba(93,179,240,${(.3 + .6 * k).toFixed(3)})` }); });
          popIn(el.querySelector('.lbl'), tt, T_PROG); } },
      { id: 'ePath', t: ws(967) - .05, out: OUT_EG, W: [0, 470, 650, 176], html: pathHtml,
        upd(tt, el) { PN.forEach(([tk], i) => { const k = io(tt, tk, .4), n = el.querySelector(`.dn[data-i="${i}"]`);
            css(n, { background: `rgba(93,179,240,${(.08 + .26 * k).toFixed(3)})`, borderColor: `rgba(93,179,240,${(.35 + .65 * k).toFixed(3)})`, transform: `scale(${(1 + .1 * bump(tt, tk, .5)).toFixed(3)})` });
            el.querySelector(`.dt[data-i="${i}"]`).style.color = `rgba(243,245,250,${(.45 + .55 * k).toFixed(3)})`;
            const l = el.querySelector(`.dl[data-i="${i}"]`); if (l) l.style.background = `rgba(93,179,240,${(.2 + .8 * k).toFixed(3)})`; });
          popIn(el.querySelector('.pk'), tt, ws(977)); } },
      // ---- Ders sayfası: oynatıcı, alt sekmeler, Soru-Cevap (tam ekran: sorular, soru sor, eğitmen yanıtı) ----
      { id: 'dHead', t: C.dersIn + .08, out: OUT_DERS, W: [0, 0, 650, 50], F: [0, 0, 900, 56],
        html: plain(`<div class="yrow" style="gap:.5em;height:100%"><span style="color:rgba(243,245,250,.6)">${icE('arrowL', 1, 'currentColor', 2.2)}</span><span class="ym" style="font-size:.93em;color:rgba(243,245,250,.7)">Modül 1</span><span class="ym" style="font-size:.93em">·</span>${title('1. ders', 1.4)}</div>`) },
      { id: 'dPlayer', t: C.dersIn + .18, out: OUT_DERS, W: [0, 62, 650, 262], F: [924, 0, 454, 256], html: playerHtml,
        upd(tt, el) { const p = bump(tt, ws(987), .9); el.firstChild.style.boxShadow = p > 0 ? `0 0 0 ${(4 * p).toFixed(2)}px rgba(93,179,240,${(.8 * p).toFixed(3)}), 0 26px 70px rgba(0,0,0,.42)` : ''; } },
      { id: 'dTabs', t: T_ALT, out: OUT_DERS, W: [0, 336, 650, 54], F: [0, 70, 900, 54], html: tabsHtml, fx: 'fade',
        upd(tt, el) { let act = -1; if (tt >= TABS[0][0]) act = 0; if (tt >= TABS[1][0]) act = 1; if (tt >= C.qaClick + .05) act = 2;
          el.querySelectorAll('.qtab').forEach((tb, i) => { popIn(tb, tt, TABS[i][0]); const on = i === act;
            const glow = i === 2 && tt >= TABS[2][0] && tt < C.qaClick + .3 ? .5 + .5 * Math.cos((tt - TABS[2][0]) * 5) : 0;
            css(tb, { background: on ? '#F3F5FA' : 'rgba(255,255,255,.04)', color: on ? '#0A1122' : 'rgba(243,245,250,.85)', boxShadow: glow ? `0 0 0 ${(2 + 2 * glow).toFixed(2)}px rgba(93,179,240,${(.5 + .4 * glow).toFixed(3)})` : '' }); });
          popIn(el.querySelector('.qs'), tt, Math.max(TABS[2][0], T_ONEMLI) + .15); } },
      { id: 'dRes', t: TABS[0][0] + .1, out: TABS[1][0] + .1, od: .15, W: [0, 404, 650, 186], html: resHtml },
      { id: 'dDesc', t: TABS[1][0] + .12, out: C.qaClick + .1, od: .15, W: [0, 404, 650, 150], html: descHtml },
      ...[0, 1].map(i => ({ id: 'q' + i, t: C.qaClick + .15 + i * .15, out: OUT_DERS, W: [0, 404 + i * 122, 650, 110], F: [0, 140 + i * 132, 900, 118], html: qPost(i),
        upd(tt, el) { const hl = bump(tt, T_DIGER + .25 + i * .3, 1.1); el.firstChild.style.boxShadow = hl > 0 ? `inset 3px 0 0 ${sky}, 0 0 0 ${(2 * hl).toFixed(2)}px rgba(93,179,240,${(.6 * hl).toFixed(3)})` : ''; } })),
      { id: 'qComp', t: ws(1029), out: T_SOR + .25, od: .2, only: 'full', W: [0, 404, 900, 100], F: [0, 404, 900, 100], html: qCompHtml,
        upd(tt, el) { el.querySelector('.ty').style.width = (64 * io(tt, T_KEND + .25, T_SOR - T_KEND - .45)).toFixed(1) + '%';
          el.querySelector('.cr').style.opacity = (tt < T_SOR ? (Math.floor(tt * 2.6) % 2 ? .15 : 1) : 0).toString();
          el.querySelector('.qSend').style.transform = `scale(${(1 - .06 * bump(tt, T_SOR + .05, .22)).toFixed(3)})`; } },
      // yalnız tam ekran blokları küçülme başlamadan söner (küçülen panelde başka bloğun üstünden geçmez)
      { id: 'qMine', t: T_SOR + .2, only: 'full', out: C.h2Out - SHRINK, W: [0, 404, 900, 110], F: [0, 404, 900, 110], html: qMineHtml },
      { id: 'qReply', t: T_EGTM - .05, only: 'full', out: C.h2Out - SHRINK, W: [56, 530, 844, 108], F: [56, 530, 844, 108], html: qReplyHtml,
        upd: (tt, el) => popIn(el.querySelector('.rk'), tt, ws(1036)) },
      // ---- Hap Bilgiler (pencere -> tam ekran raf -> pencere: işinize nasıl kullanabileceğiniz, farklı alanlar) ----
      { id: 'hapHead', t: C.hapClick + .15, out: OUT_HAP, W: [0, 0, 650, 58], F: [0, 0, 600, 100], html: hapHead },
      { id: 'hWeek', t: ws(1048), out: ws(1086), W: [0, 68, 210, 46], F: [470, 27, 210, 46], fx: 'pop', html: hPill('Her hafta', 'refresh'),
        upd(tt, el) { el.querySelector('svg').style.transform = `rotate(${(360 * io(tt, ws(1048) + .1, .8)).toFixed(1)}deg)`; } },
      { id: 'hTrend', t: ws(1057), out: ws(1086), W: [220, 68, 400, 46], F: [700, 27, 400, 46], fx: 'pop', html: hPill('Yapay zekâ trendleri', 'trend'),
        upd(tt, el) { const p = bump(tt, ws(1078), .7); el.querySelector('.hp').style.boxShadow = p > 0 ? `0 0 0 ${(3 * p).toFixed(2)}px rgba(93,179,240,${(.6 * p).toFixed(3)})` : ''; } },
      { id: 'hUse', t: ws(1087), out: OUT_HAP, W: [0, 68, 650, 46], F: [470, 27, 650, 46], fx: 'pop', html: hPill('İşinize nasıl kullanabileceğiniz', 'brief', 'w') },
      { id: 'shelf', t: C.hapClick + .35, out: OUT_HAP, od: .3, W: [0, 126, 650, 520], F: [0, 116, 1378, 530], fx: 'fade',
        html: `<div class="sh" style="position:absolute;inset:0;overflow:hidden">${[...Array(SHELF_N).keys()].map(i => TP.vCard(i, AREA_IC[i])).join('')}</div>`,
        upd(tt, el, g) { const ch = g.h - 24, cw = ch * 9 / 16, gap = .1, sft = shelfX(tt);
          el.querySelectorAll('.vcard').forEach((v, i) => { const k = eo(tt, C.hapClick + .4 + i * .05, .45), x = (i * (1 + gap) - sft) * cw;
            const ring = i === 3 ? bump(tt, T_INSTA, T_TIK - T_INSTA + .2) : i === 4 ? bump(tt, T_TIK, 2.2) : 0;
            css(v, { left: x.toFixed(2) + 'px', top: '12px', width: cw.toFixed(2) + 'px', height: ch.toFixed(2) + 'px', fontSize: (cw / 11).toFixed(2) + 'px', opacity: k.toFixed(3),
              transform: `translateY(${((1 - k) * 16).toFixed(1)}px)`, zIndex: i === 3 ? 2 : 1,
              boxShadow: ring > .01 ? `0 0 0 ${(3.5 * Math.min(1, ring * 2)).toFixed(2)}px ${sky}, 0 16px 40px rgba(0,0,0,.45)` : '' });
            const vi = v.querySelector('.vi'); vi.style.transform = `translateX(-50%) scale(${(1 + .3 * bump(tt, T_FARKLI + (i - 2) * .18, .45)).toFixed(3)})`;
            if (i === 3) { const pl = tt >= T_KISA; v.querySelector('.pi').style.display = pl ? 'none' : 'block'; v.querySelector('.pa').style.display = pl ? 'block' : 'none';
              v.querySelector('.vPlay').style.opacity = pl ? '.45' : '1';
              v.querySelector('.vBar b').style.width = (10 + 90 * prog(tt, T_KISA, OUT_HAP)).toFixed(2) + '%'; } }); } },
      // ---- Takvim: canlı oturumlar, diğer etkinlikler; yeni oturum belirir -> tıklanır -> katılma talebi -> link ----
      { id: 'tHead', t: C.takvimClick + .15, out: OUT_TAK, W: [0, 0, 650, 54], html: plain(title('Takvim')) },
      { id: 'tCal', t: C.takvimClick + .25, out: OUT_TAK, W: [0, 64, 650, 290], html: calHtml(),
        upd(tt, el) { el.querySelectorAll('.ev').forEach(e => { const i = +e.parentNode.dataset.i, tk = i === NEWEV ? C.etkinlik : OTHER.includes(i) ? ws(1121) + OTHER.indexOf(i) * .12 : ws(1113) + LIVE.indexOf(i) * .12;
            e.style.opacity = eo(tt, tk, .3).toFixed(3); e.style.transform = `scaleX(${eo(tt, tk, .35).toFixed(3)})`; e.style.transformOrigin = 'left'; });
          const c = el.querySelector(`.cel[data-i="${NEWEV}"]`), k = tt >= C.etkinlik ? eo(tt, C.etkinlik, .3) : 0;
          c.style.boxShadow = k > 0 ? `0 0 0 ${(2.5 * k).toFixed(2)}px rgba(243,245,250,${(.9 * k).toFixed(3)})` : 'none';
          c.style.background = tt >= ws(1135) + .03 ? 'rgba(229,56,59,.18)' : ''; } },
      { id: 'tLeg', t: ws(1112), out: OUT_TAK, W: [0, 364, 650, 44], html: legHtml,
        upd(tt, el) { popIn(el.querySelector('.lg1'), tt, ws(1112)); popIn(el.querySelector('.lg2'), tt, ws(1120)); } },
      { id: 'tEv', t: ws(1135) + .12, out: OUT_TAK, W: [0, 418, 650, 154], moves: [{ a: T_LINK - .1, b: T_LINK + .35, W: [0, 418, 650, 228] }], d: .4, html: evHtml,
        upd(tt, el) { const ok = tt >= T_KATIL + .06, b = el.querySelector('.katil');
          css(b, { background: ok ? '#1FB766' : '#F3F5FA', color: ok ? '#fff' : '#0A1122', transform: `scale(${(1 - .05 * bump(tt, T_KATIL, .22)).toFixed(3)})` });
          el.querySelector('.kc').style.display = ok ? 'block' : 'none'; el.querySelector('.kt').textContent = ok ? 'Katılacağım' : 'Katılma talebi gönder';
          el.querySelector('.lv').style.opacity = (.55 + .45 * Math.abs(Math.cos(tt * 3.2))).toFixed(3);
          const lk = el.querySelector('.lk'), kl = eo(tt, T_LINK + .1, .4); lk.style.opacity = kl.toFixed(3); lk.style.transform = `translateY(${((1 - kl) * 10).toFixed(1)}px)`; } },
      // ---- Yakında (menü çekmecesi açık; içerik kararır, bu kart önde) ----
      { id: 'soon', t: ws(1156), out: C.toplulukClick + .05, z: 5, W: [336, 150, 300, 98], moves: [{ a: T_ADIM - .1, b: T_ADIM + .35, W: [336, 150, 300, 176] }], html: soonHtml,
        upd(tt, el) { const sa = el.querySelector('.sa'), k = eo(tt, T_ADIM, .4); sa.style.opacity = k.toFixed(3);
          el.querySelector('.sp').style.width = (22 * io(tt, T_ADIM, .3) + 20 * io(tt, ws(1164), .3) + 16 * io(tt, T_YENILIK, .5)).toFixed(1) + '%'; } },
      // ---- Topluluk (pencere -> tam ekran: sekmeler, sabit mesaj, akış, mesaj gönder -> pencere: kanallar) ----
      { id: 'cHead', t: C.toplulukClick + .15, out: P_OUT, W: [0, 0, 650, 120], F: [0, 0, 900, 120], html: cTabsHtml,
        upd(tt, el, g) { el.querySelectorAll('.ctab').forEach((tb, i) => { tb.querySelector('.ci').style.display = g.u > .5 ? '' : 'none';
            const tk = CTABS[i][2], p = bump(tt, tk - .05, 1.3) + (i === 0 ? bump(tt, ws(1218) - .05, 1.3) : 0);
            tb.style.boxShadow = p > 0 ? `0 0 0 ${(2 + 2 * p).toFixed(2)}px rgba(93,179,240,${(.4 + .5 * p).toFixed(3)})` : ''; }); } },
      { id: 'cPin', t: C.toplulukClick + .3, out: C.kanallar - .15, W: [0, 134, 650, 170], F: [0, 134, 900, 170], html: pinHtml },
      { id: 'cRule', t: C.h4In + .9, out: C.h4Out - SHRINK, only: 'full', W: [924, 0, 454, 120], F: [924, 0, 454, 120],
        html: card(`<div class="yrow" style="gap:.55em;align-items:flex-start"><span style="color:${sky};margin-top:.1em">${icE('shield', 1.2, sky, 1.9)}</span><div style="line-height:1.25"><div class="yt" style="font-weight:800;font-size:1em">Topluluk kuralları</div><div class="ym" style="font-size:.86em;margin-top:.2em;white-space:nowrap">Saygı, gizlilik, reklamsız paylaşım</div></div></div>`, '.8em .95em') },
      { id: 'cFeed', t: FEED[0][0] - .05, out: C.kanallar - .15, W: [0, 316, 650, 330], F: [0, 316, 900, 330], fx: 'fade', d: .2, html: feedHtml,
        upd(tt, el, g) { const ph = (g.h - 2 * 10) / 3;
          el.querySelectorAll('.fp').forEach(p => { const i = +p.dataset.i, t0 = FEED[i][0];
            const rank = FEED.slice(i + 1).reduce((q, f) => q + io(tt, f[0], .45), 0), k = eo(tt, t0 + .42, .35);   // yeni gönderi, eskiler kaydıktan sonra belirir
            css(p, { top: (rank * (ph + 10)).toFixed(1) + 'px', height: ph.toFixed(1) + 'px', opacity: (tt >= t0 ? k * (1 - clamp(rank - 2.2)) : 0).toFixed(3),
              transform: `translateY(${((1 - k) * -10).toFixed(1)}px)` }); }); } },
      { id: 'cComp', t: ws(1198) - .05, out: C.h4Out - SHRINK, only: 'full', W: [924, 136, 454, 150], F: [924, 136, 454, 150], html: cCompHtml,
        upd(tt, el) { const n = Math.round(clamp((tt - T_MSG_A) / (T_MSG_B - T_MSG_A)) * MSG.length);
          el.querySelector('.mt').textContent = tt >= T_SEND + .05 ? '' : MSG.slice(0, tt < T_MSG_A ? 0 : n);
          el.querySelector('.cr').style.opacity = (Math.floor(tt * 2.6) % 2 ? .15 : 1).toString();
          el.querySelector('.cSend').style.transform = `scale(${(1 - .12 * bump(tt, T_SEND, .22)).toFixed(3)})`; } },
      { id: 'cMem', t: T_DIGER2 - .05, out: C.h4Out - SHRINK, only: 'full', W: [924, 302, 454, 200], F: [924, 302, 454, 200], html: memHtml,
        upd(tt, el) { el.querySelectorAll('.mav').forEach((a, i) => popIn(a, tt, T_DIGER2 + .1 + ((i * 7) % 14) * .07)); } },
      { id: 'cChan', t: C.kanallar - .05, out: P_OUT, W: [0, 134, 650, 350], html: chanHtml,
        upd(tt, el) { el.querySelectorAll('.ch').forEach(c => { const i = +c.dataset.i, k = eo(tt, C.kanallar + .1 + i * .2, .4); c.style.opacity = k.toFixed(3); c.style.transform = `translateY(${((1 - k) * 12).toFixed(1)}px)`; }); } },
    ] });

  // ================= 240 - 258.4 SENİN YAPMAN GEREKEN: kontrol listesi, söylendikçe tiklenir =================
  const YC = { x: 1086, y: 118, w: 734 };
  const TODO = [[ws(1258), ws(1262), 'play', 'Eğitimi adım adım izle'], [ws(1264), ws(1267), 'hand', 'Takıldığında destek al'],
    [ws(1270), ws(1278), 'users', 'Topluluk üzerinden paylaş'], [ws(1283), ws(1289), 'zap', 'Aktif ol']];
  const T_SUB = ws(1287), Y_OUT = C.aramiza - .1;
  const ycH = grow([[-9, 82], ...TODO.map(([t], i) => [t, 82 + 116 * (i + 1) + 8])]);
  const yapman = L.scene({ id: 'yapman', from: ws(1254) - .2, to: Y_OUT + .1, z: 6, parts: [      // "tek şey şu": başlık, maddeler kendi kelimesinde
    it({ x: YC.x, y: YC.y, w: YC.w, t: ws(1254) - .05, out: Y_OUT, od: .32, d: .5,
      html: `<div class="yb yc" style="position:absolute;left:0;top:0;right:0;border-radius:22px"></div>
        <div class="yk yrow" style="position:absolute;left:32px;top:28px;font-size:26px;gap:12px">${ic('flag', 28, sky, 2)}YAPMAN GEREKEN</div>
        ${TODO.map(([, , icn, tx], i) => `<div class="yr yrow" data-i="${i}" style="position:absolute;left:24px;right:24px;top:${82 + i * 116}px;height:104px;border-radius:16px;background:rgba(243,245,250,.035);border:1px solid rgba(255,255,255,.09);padding:0 22px;gap:20px">
          ${tile(icn, 60)}<div style="flex:1;min-width:0;line-height:1.2"><div style="font-size:32px;font-weight:700;white-space:nowrap;letter-spacing:-.01em">${tx}</div>${i === 3 ? `<div class="ys" style="font-size:26px;font-weight:600;color:#BFE3FF;margin-top:6px;white-space:nowrap;opacity:0">Ne kadar aktif, o kadar iyi</div>` : ''}</div>
          <div style="position:relative;width:46px;height:46px;border-radius:50%;border:2.5px solid rgba(243,245,250,.22);flex:none"><span class="yt2" style="position:absolute;inset:-3px;opacity:0">${chk('46px')}</span></div></div>`).join('')}`,
      upd(tt, el) { el.querySelector('.yb').style.height = ycH(tt).toFixed(1) + 'px';
        el.querySelectorAll('.yr').forEach(r => { const i = +r.dataset.i, k = eo(tt, TODO[i][0] - .05, .45); r.style.opacity = k.toFixed(3); r.style.transform = `translateY(${((1 - k) * 14).toFixed(1)}px)`;
          popIn(r.querySelector('.yt2'), tt, TODO[i][1]); const dn = io(tt, TODO[i][1], .4); r.style.borderColor = `rgba(31,183,102,${(.09 + .45 * dn).toFixed(3)})`; });
        const ys = el.querySelector('.ys'), k = eo(tt, T_SUB, .45); ys.style.opacity = k.toFixed(3); ys.style.transform = `translateY(${((1 - k) * 8).toFixed(1)}px)`; } }),
  ] });

  // ================= SON KART (3 s): logo animasyonu, adres, slogan (tanıtım videosuyla aynı) =================
  const endCard = TP.endCard({ t: END, total: TOTAL });

  return {
    style: 2,
    frameShift: true,
    natural: { d: .8, fade: .5, out: .4, dy: 30 },
    jumpEps: 1e-3,
    introFlash: false,
    slowPush: { rate: .0025, max: .035, span: true },                // tam ekranda kesintisiz, çok yavaş yakınlaşma
    cardRing: { w: 2, color: 'rgba(191,227,255,.5)' }, cardR: 22,
    fonts: TP.FONTS,
    layout,
    punches: [],
    shakes: [],
    flashes: [],
    scenes: [scrim, hello, egitmen, buVideoda, hedef, browser, panel, yapman, bye, endCard],
  };
});
