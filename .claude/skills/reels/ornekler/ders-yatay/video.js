// ÖRNEK: ders-yatay — YÜZSÜZ slayt anlatımı (uzun ders videosu, ~17 dk), 16x9. Slayt öğeleri konuşuldukça çerçeve/spot/fosfor, kısa notlar, konu çipi.
// Ne zaman: ekran kaydı / sunum üstüne sesli anlatım; kitle sıfırdan: her terim kısa notla açıklanır, uzun açıklama kartı yok.
// Plan stili: kind face (ama yüz yok: V.focus), density mikro, captions sade (D.capStyle; place ile blok blok yer değiştirir), formats ['16x9'],
//   libs ['ders'] (comp/ders.js D.*), end_card 0.
// Cue'lar (C.<ad>; C.end motordan; C.s_* = slayt geçişleri): s_kod, s_nasil, s_fikir, s_yol, s_kural, s_ajan, s_orkestra, s_yazilim, s_diller, s_site, s_ozet, s_vibe, s_hafta,
//   s_atla
// Görseller: work/ders_kare.jpg (yanlışlıkla görünen bir slaydı örten, önceki slayttan alınmış kare; projenin kendi kaydından çıkarılır).
// Ekran metinleri genel ders içeriği örneğidir; kendi dersinde yalnız anlatılanları yaz. Üçüncü taraf araç adları 'Araç A/B' ile gösterildi.
// Ortak ders kütüphanesi comp/ders.js (D.*; plan.libs ["ders"]). Taban görüntü = kesilmiş ekran kaydı (work/face), yüz yok:
// V.focus verilir (yüz kadrajı / jump / slowPush / punch kapalı), V.introZoom / introFlash false, tek 'full' düzen.
// Dil: sakin ve öğretici. Slayttaki öğe konuşuldukça D.mark (çerçeve + soluklaştırma, fosfor), uzun açıklama notları küçük ve sabit
// (D.note / D.term), üstte konu çipi (D.topic). Ekrana yalnızca söylenen ya da onu açıklayan şey yazılır (terim, çeviri, özet).
// KOORDİNATLAR: slayt öğeleri gerçek karelerden ölçüldü (kaynak px 1920x1080; V.focus'ta D.mark birlikte büyür).
// ZAMANLAR: kelimeye bağlı (ws(i) = word(i).s; indeksler kurgu değişse de sabit), slayt geçişleri plan.json cue'ları (C.s_*,
// work/slayt_gecis.txt). Altyazı yerleri (place) blok başlarına bağlı (bs(i)).
// Güvenli alan 16x9 (x 96-1824, y 54-960): slaydın altındaki (y > 960) öğe yalnızca spot (soluklaştırma) ile vurgulanır.
// QA kararları: dil tablosuna yakınlaşma denendi, kaldırıldı (tablo zaten tam kadraj; z 1.12'de başlık yarım kesiliyor, 'Biz buradayız'
// soldan taşıyordu) -> satır spotu + Diller hücresine fosfor. Vibe coding ve 'Yazılım nedir' tanımları slaytta yazılı: kopya kart yerine
// slayttaki satıra konuşmayla fosfor + tek satır çeviri ('vibe': his, hava). Sohbet robotu notu slayt etiketini değil konuşmayı özetler.
const ws = i => word(i).s, we = i => word(i).e, bs = i => D.blockAt(i) - .02;
const END = C.end;

// ---------- slayt öğeleri (kaynak px: [x, y, w, h]) ----------
const R = {
  // 3) Her bölümü önce izle
  kutu1: [160, 327, 452, 514], kutu2: [735, 327, 452, 514], kutu3: [1310, 327, 452, 514], ezber: [782, 974, 356, 48],
  // 4) Kod yazmadan
  kol1: [150, 368, 345, 462], kol2: [665, 368, 470, 462], kol3: [1300, 428, 512, 402],
  bant4: [30, 903, 1860, 106], bant4yazi: [419, 935, 1083, 52],
  // 5) Yedi modül merdiveni (basamak + etiket)
  m1: [128, 944, 520, 116], m2: [398, 826, 720, 122], m3: [618, 708, 684, 124], m4: [836, 590, 570, 124],
  m5: [1033, 471, 664, 125], m6: [1239, 353, 524, 124], m7: [1424, 234, 440, 125],
  // 6) Vibe coding
  tanim1: [96, 79, 539, 52], tanim2: [643, 79, 1152, 52],
  q1: [194, 330, 1282, 84], q2: [194, 438, 1151, 88], q3: [194, 546, 1260, 90], q4: [194, 653, 1045, 90], q5: [194, 754, 584, 90],
  // 7) Haftalar / 8) Kural
  eskiden: [90, 300, 800, 735], takvim: [693, 386, 182, 178], simdi: [1005, 300, 850, 735],
  basamak: [165, 252, 900, 745], cozum: [1122, 372, 647, 352], cozum2: [1118, 368, 655, 430], cozumYazi: [1243, 752, 403, 44],
  // 9) Sohbet robotu / ajan
  sol9: [138, 375, 750, 511], sag9: [1032, 335, 765, 551], bant9: [30, 958, 1860, 102],
  // 10) Orkestra
  o1: [168, 748, 505, 262], o2: [707, 748, 505, 262], o3: [1246, 748, 506, 262],
  // 11) Yazılım nedir
  baslik1: [132, 88, 1656, 64], baslik2a: [234, 152, 675, 80], baslik2b: [909, 152, 779, 80],
  tarif: [101, 450, 148, 52], asci: [558, 460, 224, 44], yemek: [641, 643, 268, 44], dokunus: [1170, 290, 640, 720],
  // 12) Diller tablosu (satır / Diller hücresi)
  r1: [312, 322, 1488, 92], r2: [312, 416, 1488, 84], r3: [312, 500, 1488, 82], r4: [312, 582, 1488, 82],
  r5: [312, 664, 1488, 82], r6: [312, 746, 1488, 84], r7: [312, 830, 1488, 84], bant12: [104, 962, 1712, 98], biz: [104, 318, 1696, 98],
  d1: [1371, 340, 377, 56], d2: [1458, 432, 200, 50], d3: [1499, 515, 120, 52], d4: [1491, 600, 136, 48],
  d5: [1461, 682, 203, 52], d6: [1482, 765, 160, 52], d7: [1505, 849, 113, 48],
  // 13) Ev / restoran
  ev: [106, 342, 854, 572], restoran: [1015, 342, 800, 500], on: [1015, 345, 388, 500], arka: [1407, 345, 408, 500],
  html: [103, 386, 247, 50], js1: [776, 652, 177, 44], js2: [778, 694, 150, 38], css: [285, 856, 425, 54],
  ampul: [480, 578, 90, 104], evGovde: [232, 368, 560, 462],
  // 14) Özet
  oz1: [198, 300, 743, 188], oz2: [980, 300, 743, 188], oz3: [198, 528, 743, 188], oz4: [980, 528, 743, 188], sirada: [198, 776, 1524, 180],
};

// ---------- V.focus: yalnızca 2 anlamlı yakınlaşma (z ≤ 1.42, ≥ 3 s, .8 s geçiş, slayt değişmeden z 1) ----------
const Z1 = ws(788) - .25, Z1b = ws(816) - .25;                  // "Projemiz" bandı (alttaki banda alt anchorlu)
const Z3 = ws(1803) - .1, Z3b = ws(1967) - .5;                  // restoran (ön yüz / arka yüz)
const FOCUS = [
  { t: 0, z: 1, cx: .5, cy: .5 },
  { t: Z1, z: 1.42, cx: .5, cy: 1, d: .8 }, { t: Z1b, z: 1, cx: .5, cy: 1, d: .8 },
  { t: Z3, z: 1.35, cx: .66, cy: .617, d: .9 }, { t: Z3b, z: 1, cx: .66, cy: .617, d: .8 },
];

// ---------- altyazı yerleri (slayt geçişinde ya da blok başında değişir) ----------
const LOW = { y: 926, box: 1640, maxLines: 1 };                 // tek satır, slaydın en altında (alt öğeler görünsün)
const PLACE = [
  { a: 0, b: C.s_kod, ...LOW },                                                  // giriş: not kartı solda, altyazı tek satır en altta
  { a: C.s_nasil, b: C.s_fikir, ...LOW },                                       // 3 kutu + etiketleri
  { a: C.s_fikir, b: bs(788), y: 870, box: 1640, maxLines: 1 },                 // etiketlerle 'Projemiz' bandı arasında
  { a: bs(788), b: bs(816), y: 118 },                                           // banda yakınlaşma: üstte
  { a: bs(816), b: C.s_yol, y: 870, box: 1640, maxLines: 1 },
  { a: bs(825), b: bs(858), cx: 400, box: 580, y: 530, maxLines: 3 },           // modül sayımı: merdivenin solundaki boşluk
  { a: bs(1014), b: bs(1035), ...LOW },                                          // alıntı okunurken son satır açık kalsın
  { a: C.s_kural, b: C.s_ajan, ...LOW },                              // dağılan proje görselleri
  { a: C.s_ajan, b: C.s_orkestra, ...LOW },                                     // sohbet robotu / ajan etiketleri görünsün
  { a: C.s_orkestra, b: C.s_yazilim, y: 690 },                          // orkestra: kutu etiketleri açık kalsın, kutuların üstünde
  { a: bs(1572), b: C.s_diller, cx: 560, box: 860, y: 898 },                    // 'Her dokunuşun arkasında' görünsün: solda
  { a: C.s_diller, b: C.s_site, ...LOW },                                       // tablo: son satırla alt bant arasında
  { a: bs(1967), b: C.s_ozet, cx: 1415, box: 790, y: 880 },                     // ev etiketleri görünsün: sağda
  { a: C.s_ozet, b: END + 1, y: 82, box: 1640, maxLines: 1 },              // özet: 'Sıradaki' bandı açık kalsın, başlığın üstünde
];

// ---------- notlar ----------
// Okunurluk (960 px gömülü oynatıcı): madde ≥ 30 px, etiket/başlık ≥ 22, terim tanımı ≥ 28, çip ≥ 26, konu çipi ≥ 24
const K22 = { kickerSize: 22 };
const NOT1 = { x: 112, y: 878, w: 820, anchor: 'bottom', size: 30, pad: 18, gap: 8, numbered: true, ...K22 };
const notes = [
  // 1) giriş: başlamadan önce / bu derslerde
  D.note({ ...NOT1, kicker: 'Başlamadan önce', icon: 'flag', t: ws(36) - .1, out: ws(166) - .2, items: [
    { text: 'Bölümleri sırayla, adım adım izle', t: ws(38) },
    { text: "Takıldığın yeri dersin altındaki Soru-Cevap'tan sor", t: ws(75) },
    { text: 'Aktif bir bilgisayar başında izle', t: ws(99) },
    { text: 'Önce izle, sonra uygula', t: ws(104) },
    { text: 'Projeni ve hedefini forumda paylaş', t: ws(141) },
  ] }),
  D.note({ ...NOT1, kicker: 'Bu derslerde', icon: 'layers', t: ws(178) - .25, out: C.s_kod - .05, numbered: false, items: [
    { text: 'Bol görsel ve animasyon: akılda kalsın', t: ws(178) },
    { text: 'Yeni kavram → sunum ve animasyon', t: ws(252) },
    { text: 'Pratik → uygulama ekranı', t: ws(259) },
    { text: 'Sunumları atlama: eğitimin parçası', t: ws(275) },
  ] }),
  // 2) tahtada
  D.note({ x: 1180, y: 830, w: 620, anchor: 'bottom', size: 30, pad: 18, gap: 8, theme: 'light', kicker: 'Bu eğitimde', icon: 'bulb', ...K22,
    t: ws(307), out: C.s_nasil - .05, items: [
      { text: 'Kod ezberi yok', icon: 'x', t: ws(309) },
      { text: 'Yapay zekâyı yönetmeyi öğreniyoruz', icon: 'check', t: ws(326) },
    ] }),
  // 4) fikir nereden gelir -> eskiden / bugün
  D.note({ x: 1290, y: 326, w: 534, size: 30, pad: 18, gap: 9, ...K22, kicker: 'Fikir nereden gelir?', icon: 'bulb', t: ws(505) - .25, out: ws(717) - .1, numbered: true, items: [
    { text: 'Kendi sektörün: tekrar eden işi otomatikleştir (ör. mali müşavir raporları)', t: ws(505) },
    { text: 'Çevrendeki manuel işler (ör. doktorlar için randevu sistemi)', t: ws(613) },
    { text: 'Bir sektöre özel yazılımı çok kişiye satabilirsin', t: ws(645) },
  ] }),
  D.note({ x: 1290, y: 326, w: 534, size: 30, pad: 18, gap: 9, ...K22, kicker: 'Bir yazılım geliştirmek', icon: 'layers', t: ws(724), out: ws(766) - .1, items: [
    { text: 'Eskiden: 5-6 ay', t: ws(733) },
    { text: 'Bugün: birkaç saat', t: ws(740) },
    { text: 'Bol deneme yap, sakın pes etme', t: ws(754), accent: true },
  ] }),
  // 5) modüller
  D.note({ x: 130, y: 360, w: 600, size: 30, pad: 18, gap: 8, ...K22, kicker: 'Bilgi', icon: 'info', t: ws(883), out: C.s_vibe - .05, items: [
    { text: 'Modüller adım adım ekleniyor', t: ws(885) },
    { text: 'En temel kısım: ilk 3 ders', t: ws(908) },
  ] }),
  // 6) vibe coding: tanım satırının altındaki boşlukta tek satır terim
  D.term({ inline: true, x: 330, y: 146, size: 28, ...K22, term: 'Vibe coding', tr: 'İng. "vibe": his, hava', t: ws(965), out: ws(1014) - .1 }),
  // 9) sohbet robotu / ajan: not soluklaşan yarıda, ok odaktaki yarıyı gösterir
  D.note({ x: 1112, y: 418, w: 660, size: 30, pad: 20, gap: 9, ...K22, kicker: 'Eski yöntem', icon: 'help', title: 'Sohbet robotu', arrow: 'left',
    t: ws(1281), out: ws(1313) - .05, items: [
      { text: 'Kodu verir', t: ws(1302), icon: 'check' },
      { text: 'Yapıştırmak, düzenlemek sana kalır', t: ws(1309), icon: 'x' },
    ] }),
  D.note({ x: 208, y: 418, w: 660, size: 30, pad: 20, gap: 9, ...K22, kicker: 'Yeni yöntem', icon: 'bulb', title: 'Ajan', arrow: 'right',
    t: ws(1316), out: ws(1352) - .1, items: [
      { text: 'Kodu yazar', t: ws(1330), icon: 'check' },
      { text: 'Dosyaları birleştirir', t: ws(1332), icon: 'check' },
      { text: 'İstersen yayına da alır', t: ws(1335), icon: 'check' },
    ] }),
  // 11) yazılımın ürünleri (bölücü çizgi x 960 ile telefon x 1262 arasındaki sütun; kart bölücünün biraz soluna taşar)
  D.note({ x: 922, y: 300, w: 334, size: 26, pad: 16, gap: 8, chips: true, ...K22, kicker: 'Yazılım örnekleri', icon: 'layers', t: ws(1537), out: ws(1572) - .1, items: [
    { text: 'Web siteleri', t: ws(1546) }, { text: 'Mobil uygulamalar', t: ws(1548) }, { text: 'Oyunlar', t: ws(1550) },
    { text: 'Gömülü yazılımlar', t: ws(1553) }, { text: 'Askeri uçaklar', t: ws(1556) }, { text: 'Robotlar', t: ws(1559) },
    { text: 'Yapay zekâ', t: ws(1560) },
  ] }),
  // 13) terimler (restorana yakınlaşırken soldaki soluk alanda)
  D.term({ x: 112, y: 320, w: 560, size: 28, ...K22, term: 'Frontend', tr: 'ön yüz', def: 'Ziyaretçinin gördüğü taraf: gözünle gördüğün her yer.',
    t: ws(1851), out: ws(1879) - .1 }),
  D.term({ x: 112, y: 320, w: 560, size: 28, ...K22, term: 'Backend', tr: 'arka yüz', def: 'Kayıt, veri tabanı; ziyaretçinin görmediği taraf.',
    t: ws(1920), out: Z3b + .1 }),
  // 14) dipnot (slayt soluklaşır)
  D.veil({ t: ws(2081) - .2, out: ws(2131) - .15, a: .74 }),
  D.note({ x: 490, y: 300, w: 940, size: 32, pad: 26, gap: 12, kicker: 'Dipnot', ...K22, icon: 'help', title: 'Bir kelimeyi anlamadın mı?',
    t: ws(2081), out: ws(2131) - .15, items: [
      { text: "Dersin altındaki Soru-Cevap'tan sor", t: ws(2096), icon: 'check' },
      { text: 'Hızlı açıklama için yapay zekâna sor (Araç A, Araç B…)', t: ws(2108), icon: 'check' },
    ] }),
];

// ---------- çerçeve + soluklaştırma (D.mark) ----------
const SP = .45;
const marks = [
  // 3) üç kutu, sonra alttaki 'Ezber yok · Hata normal' (y > 960: yalnız spot)
  D.mark({ kind: 'box', spot: SP, pad: 4, out: ws(363) + 1.6, seq: [
    { t: ws(342), rect: R.kutu1 }, { t: ws(346), rect: R.kutu2 }, { t: ws(353), rect: R.kutu3 }, { t: ws(360), rect: R.ezber, frame: false } ] }),
  D.mark({ kind: 'spot', spot: SP, pad: 0, rect: R.ezber, t: ws(389), out: ws(397) + 1 }),
  // 4) üç adım (fikir -> anlat -> çalışan yazılım), sonra yakınlaşmada 'Projemiz' bandı
  D.mark({ kind: 'box', spot: SP, pad: 0, out: Z1 + .2, seq: [
    { t: ws(768), rect: R.kol1 }, { t: ws(772), rect: R.kol2 }, { t: ws(781), rect: R.kol3 } ] }),
  D.mark({ kind: 'spot', spot: SP, pad: 0, rect: R.bant4, t: Z1 + .3, out: Z1b + .1 }),
  D.mark({ kind: 'under', rect: R.bant4yazi, pad: 0, color: '#FFD23F', width: 5, t: ws(799), sweep: [ws(799), we(803)], out: Z1b + .1 }),
  // 5) merdiven: söylendikçe basamak basamak (alt basamaklar y > 960: spot)
  D.mark({ kind: 'spot', spot: .62, pad: 0, out: ws(858) + 1.2, move: .45, seq: [
    { t: ws(833), rect: R.m1 }, { t: ws(835), rect: R.m2 }, { t: ws(840), rect: R.m3 }, { t: ws(844), rect: R.m4 },
    { t: ws(847), rect: R.m5 }, { t: ws(851), rect: R.m6 }, { t: ws(854), rect: R.m7 } ] }),
  // 7) eskiden -> 2 hafta -> şimdi (5 dakika rakamı öne çıkarılmaz: sağ yarı genel)
  D.mark({ kind: 'box', spot: SP, out: C.s_kural - .1, seq: [
    { t: ws(1088), rect: R.eskiden, frame: false }, { t: ws(1128), rect: R.takvim }, { t: ws(1147), rect: R.simdi, frame: false } ] }),
  // 8) dağılan proje -> çözüm kutusu -> '3. bölümde'
  D.mark({ kind: 'box', spot: SP, out: C.s_ajan - .1, seq: [
    { t: ws(1179), rect: R.basamak, frame: false }, { t: ws(1188), rect: R.cozum }, { t: ws(1191), rect: R.cozum2 } ] }),
  // 9) sohbet robotu -> ajan -> 'Biz ajanla çalışıyoruz.'
  D.mark({ kind: 'box', spot: SP, pad: 4, out: C.s_orkestra - .1, seq: [
    { t: ws(1266), rect: R.sol9 }, { t: ws(1313), rect: R.sag9 }, { t: ws(1352), rect: R.bant9, frame: false } ] }),
  // 10) strateji / sınır / sonuç (y > 960: spot)
  D.mark({ kind: 'spot', spot: .6, pad: 0, out: C.s_yazilim - .1, seq: [
    { t: ws(1417), rect: R.o1 }, { t: ws(1419), rect: R.o2 }, { t: ws(1422), rect: R.o3 } ] }),
  // 11) 'Her dokunuşun arkasında bir talimat var'
  D.mark({ kind: 'spot', spot: SP, pad: 0, rect: R.dokunus, t: ws(1572), out: C.s_diller - .1 }),
  // 12) tablo satırları -> alt bant -> 'Biz buradayız' + web satırı
  D.mark({ kind: 'box', spot: SP, pad: 4, out: C.s_site - .1, seq: [
    { t: ws(1659), rect: R.r1, frame: false }, { t: ws(1667), rect: R.r2, frame: false }, { t: ws(1678), rect: R.r3, frame: false },
    { t: ws(1686), rect: R.r4, frame: false }, { t: ws(1692), rect: R.r5, frame: false }, { t: ws(1700), rect: R.r6, frame: false },
    { t: ws(1706), rect: R.r7, frame: false }, { t: ws(1727), rect: R.bant12, frame: false }, { t: ws(1754), rect: R.biz } ] }),
  // 13) ev -> restoran -> (yakınlaşma) ön yüz / arka yüz -> ev
  D.mark({ kind: 'box', spot: SP, out: C.s_ozet - .1, seq: [
    { t: ws(1789), rect: R.ev }, { t: ws(1795), rect: R.restoran }, { t: ws(1831), rect: R.on }, { t: ws(1879), rect: R.arka },
    { t: ws(1947), rect: R.on }, { t: ws(1961), rect: R.arka }, { t: ws(1967) + .3, rect: R.ev } ] }),
  D.mark({ kind: 'pulse', rect: R.evGovde, pad: 0, times: [ws(1996)], t: ws(1996), out: ws(1996) + 1 }),
  D.mark({ kind: 'pulse', rect: R.ampul, pad: 4, r: 40, times: [ws(2006), ws(2006) + 1.1], t: ws(2006), out: ws(2006) + 2.1 }),
  // 14) dört tik: hafif nabız; son: 'Sıradaki' bandı
  ...[R.oz1, R.oz2, R.oz3, R.oz4].map((rc, k) => D.mark({ kind: 'pulse', rect: rc, pad: 6, r: 16, times: [ws([2034, 2037, 2041, 2043][k])],
    t: ws([2034, 2037, 2041, 2043][k]), out: ws([2034, 2037, 2041, 2043][k]) + 1 })),
  D.mark({ kind: 'box', spot: SP, pad: 4, r: 18, rect: R.sirada, t: ws(2131) - .1, out: END + 1 }),
  // 12) '+ Flutter' (tabloda yok; mobil satırının Diller hücresinde)
  D.callout({ to: [1658, 456], side: 'right', dist: 0, arrow: false, text: '+ Flutter', size: 26, t: ws(1672), out: ws(1678) - .1 }),
];

// ---------- fosfor (multiply katmanı) ----------
const HL = (rc, a, b, out, o = {}) => D.mark({ kind: 'hl', rect: rc, pad: 4, r: 8, t: a, sweep: [a, b], out, ...o });
const ink = [
  // 6) tanım satırı (konuşmayla) + slayttaki alıntı satır satır
  HL(R.tanim1, ws(969), we(975), ws(1014)), HL(R.tanim2, ws(986), we(993), ws(1014)),
  HL(R.q1, ws(1016), we(1021), ws(1040) + 1.5), HL(R.q2, ws(1022), we(1025), ws(1040) + 1.5), HL(R.q3, ws(1026), we(1029), ws(1040) + 1.5),
  HL(R.q4, ws(1030), we(1033), ws(1040) + 1.5), HL(R.q5, ws(1034), we(1034), ws(1040) + 1.5),
  // 8) 'Çözümü 3. bölümde kuracağız.'
  HL(R.cozumYazi, ws(1191), we(1195), C.s_ajan - .1),
  // 11) tanım (başlık) + tarif / aşçı / yemek etiketleri
  HL(R.baslik1, ws(1494), we(1500), ws(1531), { pad: 0, r: 6 }), HL(R.baslik2a, ws(1501), we(1502), ws(1531), { pad: 0, r: 6 }),
  HL(R.baslik2b, ws(1503), we(1507), ws(1531), { pad: 0, r: 6 }),
  HL(R.asci, ws(1514), we(1516), ws(1531)), HL(R.yemek, ws(1517), we(1519), ws(1531)), HL(R.tarif, ws(1520), we(1522), ws(1531)),
  // 12) Diller sütunu: dil söylendikçe (birikerek)
  HL(R.d1, ws(1659), we(1661), ws(1727) - .2), HL(R.d2, ws(1667), we(1668), ws(1727) - .2), HL(R.d3, ws(1680), we(1680), ws(1727) - .2),
  HL(R.d4, ws(1686), we(1688), ws(1727) - .2), HL(R.d5, ws(1692), we(1693), ws(1727) - .2), HL(R.d6, ws(1700), we(1701), ws(1727) - .2),
  HL(R.d7, ws(1706), we(1708), ws(1727) - .2),
  // 13) HTML = iskelet / JavaScript = elektrik / CSS = boya
  HL(R.html, ws(1979), we(1979) + .3, C.s_ozet - .1), HL(R.js1, ws(2003), we(2003), C.s_ozet - .1), HL(R.js2, ws(2005), we(2006), C.s_ozet - .1),
  HL(R.css, ws(2017), we(2021), C.s_ozet - .1),
];

// ---------- modül sayacı + konu çipi ----------
const MOD = ['Temeller', 'İlk web uygulaması', 'Araçlar ve otomasyon', 'Mobil uygulama', 'Yayına alma', 'Fikirden ürüne', 'İleri seviye konular'];
const chips = [
  D.steps({ x: 132, y: 352, label: 'Modül', size: 26, out: ws(858) + 1.2,
    items: MOD.map((text, k) => ({ text, t: ws([833, 835, 840, 844, 847, 851, 854][k]) })) }),
  D.topic({ prefix: 'Bölüm 1 · Temeller', x: 96, y: 54, size: 24, lh: 1.12, pad: '.07em .8em .07em .6em', t: .6,   // ince hap (54-86): başlıklar y ≥ 88
    hide: [[C.s_vibe, C.s_hafta], [C.s_ozet, END + 9]], items: [
    { t: 0, text: 'Başlamadan önce' }, { t: C.s_kod, text: 'Kod ezberi yok' }, { t: C.s_nasil, text: 'Nasıl çalışacağız' },
    { t: C.s_fikir, text: 'Fikirden uygulamaya' }, { t: C.s_yol, text: 'Yol haritası' }, { t: C.s_vibe, text: 'Vibe coding' },
    { t: C.s_hafta, text: 'Eskiden / şimdi' }, { t: C.s_kural, text: 'Kurallar' }, { t: C.s_ajan, text: 'Sohbet robotu ve ajan' },
    { t: C.s_orkestra, text: 'Orkestra şefi' }, { t: C.s_yazilim, text: 'Yazılım nedir?' }, { t: C.s_diller, text: 'Yazılım dilleri' },
    { t: C.s_site, text: 'Bir site nasıl kurulur' }, { t: C.s_ozet, text: 'Özet' },
  ] }),
];

defineVideo({
  style: 2, introZoom: false, introFlash: false, layout: [{ t: 0, mode: 'full' }],
  focus: FOCUS,
  ...D.capStyle({ fs: 42, fsMin: 38, y: 902, box: 1360, place: PLACE }),
  scenes: [
    // C.s_atla - C.s_vibe arasında yanlışlıkla görünen slayt: önceki slaydın karesiyle örtülür
    L.scene({ id: 'hold', z: 2, parts: [D.hold({ src: 'work/ders_kare.jpg', a: C.s_atla, b: C.s_vibe })] }),
    D.layer({ id: 'ink', z: 5, blend: 'multiply', parts: ink }),
    L.scene({ id: 'marks', z: 6, parts: marks }),
    L.scene({ id: 'notes', z: 7, parts: notes }),
    L.scene({ id: 'chips', z: 7, parts: chips }),
  ],
});
