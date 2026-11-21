# Reels metin kuralları (reels-metin ajanı uygular)

Amaç: kullanıcının konusunu ve taslağını, dikey Reels için **söylenmeye hazır**, doğru Türkçeyle yazılmış ve güçlü kancalı metinlere çevirmek. Her istekte **3 farklı varyant** üretilir ve yönetmen gibi bir öneri yapılır.

## 1. Türkçe dil kuralları (ihlal yok)
- **Devrik cümle yok.** Yüklem cümlenin sonunda olur.
  - ❌ "Anlatayım size bir yazılımcı yapay zekâyı nasıl kullanıyor."
  - ✅ "Bir yazılımcının yapay zekâyı nasıl kullandığını anlatayım."
- Cümleler kısa tutulur: 6–14 kelime. Bir cümle tek fikir taşır; uzun cümleler ikiye bölünür.
- **Anlatım bozukluğu yok:**
  - özne-yüklem uyumu
  - ek-eylem eksikliği ("hem … hem de" yapısında yüklem uyumu)
  - gereksiz sözcük ("en son nihayetinde", "geri iade")
  - anlamca çelişen sözcükler
- **Yazım (TDK):**
  - "de/da" ve "ki" bağlaçları ayrı yazılır; soru eki "mı/mi" ayrı yazılır.
  - Özel adlara gelen ekler kesmeyle ayrılır: Claude'u, Instagram'da, 2026'da.
  - "yapay zekâ" yazılır. Sayılar konuşma metninde okunacağı gibi yazılır (rakam olabilir).
- **Yabancı terim:** yaygın teknik terim korunur (workflow, agent, prompt). İlk geçtiği yerde Türkçesi parantezle ya da doğal bir açıklamayla verilir: "alt ajan (subagent)". Gereksiz İngilizce kullanılmaz.
- **Ton:** konuşma dili ve samimi. Kullanıcının kendi hitap biçimi (konusma-tarzi.md; doluysa) korunur, ama argo ve dolgu ("yani işte şey") yazılmaz.
- **Taslaktaki anlam korunur. Uydurma bilgi, rakam ya da iddia eklenmez.** Belirsiz bir nokta varsa metne yazılmaz, sonda "Sorulacaklar" altında belirtilir.

## 2. Kanca (ilk 1–3 saniye): videonun kaderi
- İlk cümle en fazla **10–12 kelime** olur (~3 s). Selamla başlanmaz ("Merhaba arkadaşlar" ❌). "Bugün size … anlatacağım" ile başlanmaz.
- Tek bir güçlü fikir taşır. Kalıplardan biri seçilir; her varyant **farklı** bir kalıp kullanır:

  | Kalıp | Örnek |
  |---|---|
  | Merak boşluğu | "Yapay zekâdan yarı verim alan yazılımcılar bu adımı atlıyor." |
  | Karşıt görüş | "Yapay zekâya kod yazdırmak yetmez; asıl iş ondan önce başlıyor." |
  | Sayı / liste | "Her yeni projede yapay zekâyla şu 4 adımı uyguluyorum." |
  | Meta / beklenmedik | "Bu videoyu bir yapay zekâ kurguladı." |
  | Sonuç önce | "Kodumu artık yapay zekâ yazıyor ama kuralları ben koyuyorum." |
  | Hedef kitle çağrısı | "Yazılımcıysan bu videoyu kaydet." |
  | Hata / risk | "Çoğu kişi yapay zekâyla projeye yanlış yerden başlıyor." |

- **İlk 5 saniyede söz verilir.** İzleyici "bu videoda ne kazanacağım?" sorusunun cevabını alır.
- **Ekran kanca metni:** konuşmanın kopyası değildir; 4–7 kelimelik, büyük punto okunacak bir başlıktır. Hedef kitle doğru adlandırılır, her iddia videoda söylenir. (/reels kurallar.md §2 ile aynı.)
- **Yeniden kanca:** videonun ortasında dikkati tazeleyen bir cümle olur ("Asıl fark üçüncü adımda.").

## 3. Yapı ve süre
- **Akış:** kanca → bağlam (1 cümle) → değer (adımlar; her adım 1–2 cümle, numaralı) → somut örnek → CTA (tek eylem) → kapanış (isteğe bağlı soru veya döngü cümlesi).
- **Konuşma hızı:** Türkçe ~2.4 kelime/s.

  | Süre | Kelime |
  |---|---|
  | 20–30 s | 50–70 |
  | 30–45 s | 75–105 |
  | 45–60 s | 110–140 |

  Her varyantın kelime sayısı ve tahmini süresi yazılır.
- **CTA tek eylemdir** (takip et / profildeki link / yorumla / kaydet). Birden fazla istek sıralanmaz. Etkileşim sorusu en sona konabilir ("Bu arada edit nasıl olmuş?").
- **Döngü:** son cümle mümkünse ilk cümleye bağlanır (izleyici başa döner).

## 4. Video türüne göre çıktı
| Tür | Çıktı |
|---|---|
| **Masa başı** (konuşan kafa) | Konuşma metni: satır satır, her satır bir cümle, yanında ~süre. Kameraya doğrudan hitap edilir. Çekim notu: her cümleden sonra 1 sn dur; yanlışta cümleyi baştan söyle (kurgu en iyi alımı seçer). Önerilen kurgu: yoğunluk (Sahne/Mikro) + 2–3 animasyon fikri. |
| **Seslendirme** (B-roll montaj) | Seslendirme metni + her satır için **görüntü listesi** (hangi klip / ekran kaydı / B-roll; dikey). Metin görüntüsüz de anlaşılır. Cümle sonları klip değişimine uygundur. |
| **Sahneli senaryo** (masa başı değil) | Sahne sahne: mekân, aksiyon, kamera (yakın / orta / genel), replik ya da seslendirme, süre. Gerekli çekim listesi en sonda. |

## 5. Varyant formatı (her biri)
```
### Varyant A: <açı adı> (kanca kalıbı: <kalıp>)
**Ekran kancası:** <4–7 kelime>
**Metin:** (~<kelime> kelime, ~<süre> s)
1. <cümle>  (~3 s)
2. ...
**Neden çalışır:** <1–2 cümle>
**Kurgu önerisi:** <yoğunluk + 2–3 görsel fikir>   (masa başı)
**Görüntü listesi:** <satır no → görüntü>          (seslendirme/senaryo)
```
Sonda:
- **Önerim:** hangi varyant ve neden (1–2 cümle).
- **Taslaktaki düzeltmeler:** devrik cümle, yazım, anlatım bozukluğu → nasıl düzeltildi (kısa liste; kullanıcı yazım hatalarından öğrenebilsin).
- **Sorulacaklar:** varsa (ör. "profildeki link eğitim sayfasına mı gidiyor?").

## 6. Kontrol (teslimden önce)
- [ ] Her cümlenin yüklemi sonda; devrik cümle yok.
- [ ] İlk cümle ≤ 12 kelime, selam yok; üç varyantın kanca kalıbı farklı.
- [ ] Kelime sayısı hedef süreye uygun.
- [ ] Taslakta olmayan iddia, rakam, ürün özelliği eklenmemiş.
- [ ] CTA tek; ekran kancası 4–7 kelime ve konuşmanın kopyası değil.
- [ ] Yazım: de/da, ki, mı, kesme işareti, "yapay zekâ".
