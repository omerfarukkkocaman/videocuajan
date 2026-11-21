# Örnek kodlar

Buradaki `video.js` (+ varsa `video.css`) dosyaları gerçek projelerden türetilmiş, **render edilmeyen** teknik referanslardır: motor (`comp/engine.js`) ve bileşen kütüphaneleriyle (`L.*`, `PR.*`, `KP.*`, `D.*`, `TP.*`) kare kare animasyonun nasıl yazıldığını, zamanlamanın cue'lara (`C.xxx`) ve kelimelere (`word(i).s`) nasıl bağlandığını, format dallarının (`F.pick`, `V9/SQ/WD`) nasıl kurulduğunu gösterir.

- Kod yapısı, ölçüler ve zamanlama mantığı özgün projedeki gibidir. Yorumlardaki teknik gerekçeler (neden bu ölçü, hangi QA sorununu çözüyor) en değerli kısımdır.
- Ekran metinleri yer tutucudur ("Örnek Marka", "ornekmarka.com", "@ornekmarka", "Örnek Stüdyo", "Araç A/B/C" ...). Kendi videonda yalnız konuşmada gerçekten geçen ifadeleri yaz.
- Her dosyanın başındaki yorum: tarzın adı, ne zaman kullanılır, plan.json stil alanları (kind / density / captions / formats / libs / matte), beklenen cue adları ve gerekli görseller (projenin `gorsel/` klasöründen).
- `plan.json`, medya ve yardımcı betikler bu klasörde yok; örnekleri kopyalayıp çalıştırmaya değil, kendi projenin `video.js`'ini yazarken örnek almaya kullan.

| Klasör | Tarz | Format | Yoğunluk | libs |
|---|---|---|---|---|
| `sahne-3format/` | Hareketli anlatım: kart / tam ekran / gizli sahne dansı, kinetik kanca, damga, kırmızı bant, takip kartı, son kart; her formata ayrı yerleşim | 9x16 + 1x1 + 16x9 | sahne | yok (L.*) |
| `editoryal-premium/` | Sakin "dergi" dili: bölüm başlıkları, alt bantlar, ince altın çizgiler, sinematik renk, logo kapanışı; damga/flaş yok (40+, tanıtım) | 9x16 | sahne (sakin) | yok (L.*) |
| `viral-sayi-kancasi/` | Viral tempo: dev sayı kancası, cevabı sonda halka grafikle, 1-2 s'de bir görsel olay, yorum balonu, döngü kapanışı | 9x16 | sahne | yok (L.*) |
| `kurgu-vitrini/` | Meta anlatım: kurgu zaman çizelgesi kancada ve finalde, adım rozetleri, akış düğümleri, ajan figürleri, döngü | 9x16 | sahne | yok (L.*) |
| `derinlik-studyo/` | Kişi maskesiyle derinlik: grafikler konuşmacının arkasından çıkar, oda -> stüdyo, PIP, ekrandan fırlama, alt alta site karşılaştırması | 9x16 | sahne | yok (L.*), `matte: true` |
| `ok-gecis-dalis/` | Uzun reklam (45+): omuz arkasından pencereler, baş üstünden kıvrılan ok, kameranın ekranın içine dalışı, form CTA | 9x16 (1x1 taslak) | sahne | yok (L.*), `matte: true` |
| `sakin-tempo-45/` | Kısa sakin reklam (45+): iri altyazı, yavaş geçişler, yumuşak damga, form CTA, döngü kapanışı | 9x16 + 1x1 | sahne | yok (L.*) |
| `oncesi-sonrasi/` | Konuşmasız montaj reklamı: öncesi/sonrası, ışın taraması + kıyas sürgüsü, cesur sosyal yazı, çağrı ekranı | 9x16 + 1x1 | sahne | `premium` |
| `secki-reklami/` | Konuşmasız montaj: "Hangisi senin tarzın?" 4'lü seçki, müzik vuruşunda kesim, 2x2 kolaj, çağrı ekranı | 9x16 + 1x1 | sahne | `premium` |
| `musteri-yorumu/` | Müşteri yorumu (testimonial): yüz hep ekranda, kanca kartı, marka çubuğu + ilerleme çizgisi, çağrı kartı, donmuş son kart | 9x16 + 1x1 | mikro | `premium` |
| `emojili-3d/` | Kampanya reklamı: kalıcı kanca başlığı, büyük 3D emoji ve 3D rozet, çekim parçası başına sabit kadraj | 9x16 + 1x1 | mikro | `premium` |
| `kapak-dili/` | "Kapak" reklam dili: konuşmacı %100 tam ekran, grafikler arkasında, sanal çift kamera, dev kelimeler, büyük CTA düğmesi | 9x16 + 1x1 | sahne | `kapak`, `matte: true` |
| `ders-yatay/` | Yüzsüz slayt dersi: slayt öğesine çerçeve / spot / fosfor, kısa notlar ve terimler, konu çipi, blok blok altyazı yeri | 16x9 | mikro | `ders` |
| `yatay-tanitim/` | Yatay hoş geldin / platform tanıtımı: konuşmacı solda, sağda eğitmen kartı, hedef rayı, tarayıcı -> panel turu, kontrol listesi | 16x9 | sahne | `topluluk` |
| `mikro.js` | Mikro yoğunluk taslağı: yüz hep ekranda, yanında küçük çip / sayaç / bildirim (sahne-3format cue adlarıyla) | 9x16 | mikro | yok (L.*) |
| `montaj.js` + `montaj_plan_base.json` | Montaj iskeleti: klipler + mikro elemanlar + son kart; plan.json `base.clips` örneği | 9x16 | mikro | yok (L.*) |
