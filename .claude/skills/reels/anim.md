# Saf animasyon (`kind: "anim"`)

Yüz çekimi ve B-roll olmadan, tamamen koddan üretilen video. İki hâli var:
- **Seslendirmeli:** `input/<proje>/ses/` içinde kullanıcının kendi kaydı → Whisper + hizalama çalışır, altyazı ve cue'lar kelimelere bağlanır.
- **Sessiz:** hiç medya yok → süre `--sure` ile verilir, ekrandaki metin kullanıcının onayladığı senaryodan gelir, altyazı `yok`, müzik + efekt taşır.

## Hazırlık
```
./studyo prep <slug> input/<proje> <marka> --yon v      # dikey (hikâye, Reels); yatay için --yon h
./studyo prep <slug> input/<proje> <marka> --yon h --sure 40   # sessiz, 40 sn
```
- `inbox.py` klasörde video/broll bulamayınca türü `anim` yapar. Klasörde `ses/` varsa seslendirmeli, yoksa sessizdir.
- Sessizde plan iskeletine `cut.src_start/src_end`, `captions: "yok"`, `audio.voice.none: true` yazılır.
- `cut` aşaması yüz takibi yapmaz, taban olarak `work/still.jpg` üretir (marka `colors.navy` tonunda hafif degrade). Kendi zemin görselin için plan'a `"base_still": "gorsel/zemin.jpg"` yaz (proje klasörüne göre yol). İstersen `"bg": "#hex"` ile rengi değiştir.
- Fotoğraflarla anlatım istiyorsan türü **montaj** yap: `./studyo gorsel input/<proje> --yon v` fotoğrafları `broll/` klibine çevirir. Sonra prep montaj olarak çalışır ve klipler Ken Burns hareketiyle döşenir (kurallar.md §3d).

## video.js kuralları (anim)
- `layout: [{ t: 0, mode: 'hidden' }]` ile başla ve hep `hidden`'da kal. Ekranın tamamı sahnelerindir; yüz/kart modu yok.
- Sahneler `L.scene({ under: true, ... })` ile yazılır. `L.hook`'a **`z: 7`** ver, yoksa zeminin altında kalır.
- **Her 1.5–3 saniyede bir görsel olay olsun:** yeni satır, sayaç, ikon, geçiş. Animasyonda yüz olmadığı için tempo tamamen grafiklerden gelir.
- Sahne geçişleri: önceki sahneye `exit: { a, b, dy }` ver, yenisi `t`'de girsin; 0.2–0.4 s üst üste binme yeterli.
- Seslendirmede zamanlar `C.<cue>` ya da `word(i).s`; sessizde cue'ları `{ "t": saniye }` olarak plan.json'a yaz (elle saniye yazmak yalnız sessizde serbest).
- Güvenli alan kuralları aynen geçerli (`./studyo safe <slug> all`).
- Bileşen seçimi: `plan-ve-sahne.md` kütüphane tablosu. Anim için en verimli olanlar: `L.hook`, `L.bigType`, `L.checklist`, `L.counter`, `L.badge`, `L.stamp`, `L.bubble`, `L.paper`, `L.siteGrid`, `L.calendar`, `L.banner`; hikâye için `kolaj.js` (K.*) kâğıt/film dokuları; yatay ders/açıklayıcı için `ders.js` (D.*).

## En küçük örnek (denenmiş: 8 sn, 9x16, sessiz)
plan.json cue'ları: `"cues": {"bas": {"t": 0.3}, "orta": {"t": 3}, "son": {"t": 6}}`
```js
defineVideo(F => ({
  style: 2, captions: 'yok',
  layout: [{ t: 0, mode: 'hidden' }],
  punches: [], flashes: [{ t: C.orta, a: .3, d: .1 }], shakes: [],
  scenes: [
    L.hook({ chip: 'DENEME', lines: [['Merhaba!'], ['Stüdyo', 'çalışıyor']],
             emph: { word: 'çalışıyor', t: C.bas + .6 }, out: C.orta - .2, pre: .4, z: 7 }),
    L.scene({ id: 'sayi', under: true, parts: [
      L.bigType({ text: '2026', x: 540, y: 600, size: 260, t: C.orta, tGhost: C.orta - .3, out: C.son - .2 }),
    ] }),
    L.endCard({ t: C.son }),
  ],
}));
```
Çalıştırma: `./studyo cut <slug> && ./studyo audio <slug> && ./studyo package <slug>`

## Ses
- Seslendirmeli: konuşma esas, müzik -16..-20 dB altında (ses-kurallari.md).
- Sessiz: müzik önde (`voice.none: true, music_under: 12`). Her sahne girişine hafif bir efekt, büyük vuruşlara impact koy, efekt bütçesine uy.
