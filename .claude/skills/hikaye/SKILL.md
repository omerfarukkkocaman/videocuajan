---
name: hikaye
description: Dikey (9:16, istenirse 1:1) hikâye anlatımı videosu üretir: kullanıcının kendi seslendirmesi (ya da sessiz, yalnız ekran yazısı) + sahne sahne animasyon, isteğe bağlı fotoğraf/klip. Hikâye yapısını (kanca → kurulum → düğüm → dönüm → sonuç) kurar, gerekirse önce metni /senaryo ile yazdırır, seslendirme kaydı için yönlendirir. Kullanıcı "/hikaye", "hikâye anlat", "hikâye videosu", "animasyonlu reels", "liste videosu", "kinetik yazı" dediğinde kullan.
argument-hint: "[input/<proje>] [marka] [konu / istekler]"
---

# /hikaye — Dikey hikâye stüdyosu

Sen bu akışın yönetmenisin. Motor, ajanlar ve kurallar `/reels` ile aynıdır. Önce oku: [../reels/SKILL.md](../reels/SKILL.md), [../reels/kurallar.md](../reels/kurallar.md), [../reels/anim.md](../reels/anim.md), [../reels/plan-ve-sahne.md](../reels/plan-ve-sahne.md). Görsel referanslar: `ornekler/kurgu-vitrini` (adım rozetleri, döngü), `ornekler/viral-sayi-kancasi` (sayı kancası, 1–2 s'de bir olay), `ornekler/montaj.js` (fotoğraf/klip montajı).

## 0. Neyle anlatılacak? (basla'dan gelmediyse TEK AskUserQuestion, en fazla 4 soru)
1. **Ses:**
   - Kendi seslendirmem var / kaydedeceğim (Önerilen)
   - Sessiz: yalnız ekran yazısı + müzik (kinetik yazı)
2. **Görüntü:**
   - Tamamen animasyon (Önerilen)
   - Fotoğraflarım var (`gorsel/`)
   - Kliplerim var (`broll/`)
3. **Hikâye tipi:**
   - Kişisel hikâye / deneyim
   - Bilgi hikâyesi ("X nasıl oldu?")
   - Liste ("3 hata", "5 ipucu")
   - Önce / sonra dönüşüm
4. **Formatlar:** 9:16 (Önerilen) / 1:1

Metin yoksa: önce `/senaryo` çağır ("sahne sahne senaryo" biçiminde, hikâye tipini söyle). Seslendirme gerekiyorsa `/basla`'daki kayıt yönlendirmesini ver ve dosyayı bekle.

## 1. Hikâye iskeleti (plan.json `brief`'ine yaz)
| Bölüm | Süre (30–60 sn video) | Görsel |
|---|---|---|
| **Kanca** | 0–3 s | Merak ya da gerilim: soru, şaşırtıcı sayı, sonun bir parçası. Ekran kancası ilk karede okunur |
| **Kurulum** | 3–10 s | Kim / nerede / ne istiyordu: tek sahne, 1–2 simge |
| **Düğüm** | 10–25 s | Sorun büyür: bant, damga, kırmızı vurgu, tempo artar |
| **Dönüm** | 25–35 s | Çözüm / fark ediş: flaş yok, ışık açılır, renk değişir |
| **Sonuç + ders** | 35–50 s | Tek cümlelik ders büyük tipografiyle; liste tipinde özet kartı |
| **Çağrı** | son 3–5 s | Takip / yorum sorusu (somut soru) / son kart; istenirse kancaya dönen döngü |

Liste tipinde: her madde = numara rozeti + başlık + 1 simge; maddeler arası tutarlı geçiş, en güçlü madde **sonda**.

## 2. Hazırlık
- Animasyon (seslendirmeli): `./studyo prep <slug> input/<proje> <marka> --yon v`
- Sessiz kinetik yazı: `./studyo prep <slug> input/<proje> <marka> --yon v --sure <sn>`. Süre = metindeki kelime sayısı / 2.5 + sahne başına 0.8 s. Cue'ları sahne başlarına `{ "t": s }` olarak yaz.
- Fotoğraflarla: `./studyo gorsel input/<proje> --yon v` → fotoğraflar `broll/` klibi olur, sonra `prep` montaj olarak çalışır. Seslendirme `ses/`teyse ona göre; yoksa sessiz montajdır: `./studyo prep <slug> input/<proje> <marka> --sure <sn>` (altyazı yok, müzik önde).

## 3. Görsel dil kuralları
- Altyazı: seslendirmede `vurgulu` (hikâyede duygu kelimesi `hl`, kritik kelime `red`). Sessizde altyazı yok; ekran yazısı = metin. Bir ekranda en fazla 7 kelime, satır başına 2–4 kelime, okuma süresi kelime başına ≥ 0.3 s.
- Renk dramaturjisi: kurulum nötr (marka laciverti), düğüm sıcak/kırmızı vurgular, dönüm açık/yeşil, sonuç marka rengi.
- Hareket: girişler `spring`, çıkışlar hızlı (`inExpo`, ≤ 0.25 s). Aynı giriş hareketini art arda 3 kez kullanma.
- Efekt bütçesi (sahne yoğunluğu): 30 sn'de 8–10 olay; düğümde riser → dönümde impact.
- Dürüstlük: Ekrana yalnız seslendirmede söylenen ya da kullanıcının onayladığı senaryoda yazan bilgi yazılır. Gerçek kişi/marka taklidi yok.

## 4. Üretim, kontrol, teslim
`/reels` SKILL.md §3–§5 ile aynıdır: `reels-hareket` (anim.md'yi okumasını söyle) + `reels-ses` paralel → `./studyo safe <slug> all` GEÇTİ → `./studyo final <slug> all` → `reels-kontrol` → `output/<slug>/notlar.md`. Notlara hikâye iskeletinin zaman çizelgesini de yaz.
