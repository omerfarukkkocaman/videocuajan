---
name: senaryo
description: Konu ve taslak metinden dikey Reels için 3 farklı metin varyantı yazar (Türkçe dil kurallarına uygun, devrik cümle yok, güçlü kanca). Masa başı videoda konuşma metni, montajda seslendirme + görüntü listesi, masa başı olmayan videoda sahne sahne senaryo verir. Kullanıcı "/senaryo", "metin yaz", "kanca yaz", "senaryo hazırla", "bu konuyu reels metnine çevir" dediğinde kullan.
argument-hint: "[konu ve/veya taslak metin] [proje-adı]"
---

# /senaryo — Reels metin yazarı

Kullanıcı konu ve taslak verir; sen `reels-metin` ajanıyla **3 varyant** üretip en iyisini önerirsin. Kurallar: [metin-kurallari.md](metin-kurallari.md). Ses: kullanıcının konuşma tarzı ([konusma-tarzi.md](konusma-tarzi.md); doluysa metin kullanıcının ağzından çıkmış gibi olmalı, boşsa nötr ve samimi Türkçe kullan). Kullanıcı "tek metin" isterse tek varyant yaz. Kullanıcıyla Türkçe ve samimi konuş. Yalnızca bu klasörde çalış.

## 1. Girdiler
Mesajdan şunları çıkar:
- konu
- taslak metin
- video türü
- hedef süre
- CTA hedefi
- marka
- proje adı (varsa)

Eksik olanlar için **tek AskUserQuestion** ile sor (en fazla 3 soru; cevabı mesajda olanı sorma):
1. **Video türü:**
   - Masa başı (konuşma metni)
   - Seslendirme + B-roll (montaj)
   - Sahneli senaryo (masa başı değil)

   Mesajda "masa başı" geçiyorsa sorma.
2. **Süre:** 20–30 s / 30–45 s (Önerilen) / 45–60 s. Taslağın uzunluğu bir fikir verir: ~2.4 kelime/s.
3. **CTA:**
   - Profildeki link
   - Takip et
   - Yorum yaz
   - Kaydet

   Taslakta açıkça varsa sorma.

## 2. Ajanı çalıştır
- **Kayıt yolu:**
  - Proje adı varsa `input/<proje>/senaryo.md` (klasörü oluştur). Kullanıcı videoyu çekince aynı klasöre koyar ve /reels bunu referans alır.
  - Yoksa `senaryolar/<YYYY-AA-GG>-<kısa-konu>.md`.
- **`reels-metin` ajanını çağır.** Konuyu, taslağı aynen, türü, süreyi, CTA'yı, markayı ve kayıt yolunu ver.
  - Ajan tipi bu oturumda yoksa `general-purpose` ajana şunu söyle: ".claude/agents/reels-metin.md dosyasını oku ve o ajan olarak çalış."

## 3. Kontrol ve sunum
- Dosyayı oku ve metin-kurallari.md §6'ya göre kendin kontrol et:
  - Devrik cümle var mı?
  - İlk cümle 12 kelimeyi aşıyor mu?
  - Yeni iddia eklenmiş mi?

  Hata varsa dosyada düzelt.
- **Kullanıcıya göster:**
  - 3 varyantın ekran kancası ve ilk cümlesi
  - önerdiğin varyant ve kısa gerekçesi
  - önerilen varyantın tam metni (çekerken okuyabilsin)
  - dosya yolu
  - taslaktaki dil düzeltmelerinin kısa özeti
- **Ardından teklif et:** "Beğendiğin varyantı söyle (ya da karıştır), son hâline getireyim. Çekince videoyu input/<proje>/ klasörüne koy, /reels yaz."

## 4. /reels bağlantısı
Seçilen metin `input/<proje>/senaryo.md` dosyasına yazılır. Başına `**Seçilen: Varyant X**` satırı eklenir.

/reels bu dosyayı şu işler için kullanır:
- **Whisper ipucu:** terimler, marka adı
- **Yazım düzeltmeleri:** Whisper'ın yanlış duyduğu terimleri metne göre düzeltir. Konuşmacının kayıtta söylediği esas alınır; metinden farklı söylediyse altyazı söyleneni yazar.
- **Kanca ve kurgu önerisi**
