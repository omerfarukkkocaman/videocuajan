# 🎬 videocuajan — Claude Code video stüdyosu

Telefonla çektiğin konuşma videosunu, ekran kaydını ya da kendi seslendirmeni **kurgulanmış, animasyonlu, altyazılı, müzikli** videoya çevirir. Dikey (Reels/TikTok/Shorts), yatay (YouTube) ve kare formatlar desteklenir. Mac ve Windows'ta çalışır.

Ne yapabilir?
- **Ham video kurgusu:** boşlukları, tekrarları ve "eee"leri keser; kafayı kesmeyen kadraj, cümle düzeninde altyazı, animasyon, müzik ve efekt ekler, sesi -14 LUFS'a getirir.
- **Animasyonlu video:** yüz olmadan, kendi seslendirmenle ya da yalnızca ekran yazısıyla sahne sahne animasyon üretir.
- **YouTube videosu:** yatay kurgu, ders/ekran kaydı düzenleme, bölüm listesi, SRT altyazı ve başlık/açıklama önerileri.
- **Dikey hikâye:** kanca, düğüm, dönüm ve sonuç yapısında hikâye ya da liste videosu.
- **Metin yazarı:** konundan 3 farklı kanca ve konuşma metni hazırlar.

Müzik ve efektler koddan sentezlenir, telif sorunu çıkmaz. Ücretli bir servis ya da API anahtarı gerekmez.

## Kurulum (terminal bilgisi gerekmez)

**Bir kez yapılacaklar:**
1. [VS Code](https://code.visualstudio.com) kur.
2. VS Code'da sol menüden **Eklentiler** (Extensions) → "Claude Code" ara → Anthropic'in eklentisini **Install** et, Claude hesabınla giriş yap (Pro veya üstü abonelik).
3. Windows'ta ayrıca [Git](https://git-scm.com/download/win) kur (hep "Next").

**Stüdyoyu kur:**
1. VS Code → **Dosya → Klasör Aç** (File → Open Folder) → ana klasörüne git → **Yeni Klasör**: `videocuajan` → içine gir → **Aç**.
   (Windows'ta Masaüstü ya da Belgeler OneDrive'a bağlıysa oraya açma: `C:\Users\<adın>` içine aç.)
2. Sağ üstteki Claude simgesine tıklayıp Claude Code panelini aç, şu mesajı yapıştır:

```
https://github.com/omerfarukkkocaman/videocuajan adresindeki video stüdyosunu bu klasöre kur.
Önce repoyu buraya indir, sonra içindeki KURULUM.md dosyasını oku ve oradaki adımları uygula.
Ben terminal bilmiyorum: her şeyi sen yap, benim bir şey yapmam gerekirse bana tek tek ve basitçe söyle.
```

3. Claude izin isteyince **Evet/Yes** de, soru sorarsa cevapla. Mac'te bir kez Terminal penceresi açılıp şifre ister, Windows'ta "izin verilsin mi?" penceresi çıkar. Kurulum 10–20 dakika sürer.
4. Bitince Claude panelinde **yeni sohbet (+)** aç ve yaz:

```
/basla
```

Claude "Bugün ne yapmak istiyorsun?" diye sorar, dosyalarını koyacağın klasörü açar ve videonu üretir.

**Sonraki seferler:** VS Code → Dosya → Son Kullanılanlar → `videocuajan` → Claude paneli → `/basla`.

## Komutlar (Claude bunları kendisi çalıştırır)

| Komut | Ne yapar |
|---|---|
| `/basla` | Giriş kapısı: ne yapmak istediğini sorar, kurar, yönlendirir |
| `/reels` | Dikey/kare video kurgusu |
| `/youtube` | Yatay YouTube videosu: konuşan kafa, ders, animasyon |
| `/hikaye` | Dikey hikâye / liste / kinetik yazı |
| `/senaryo` | Kanca + konuşma metni |
| `./studyo doktor` | Kurulum durumunu gösterir |

## Gizlilik

`input/`, `output/`, `projects/` ve kendi `brands/` klasörlerin git'e **girmez**. Videoların yalnızca senin bilgisayarında kalır.

## Klasörler

- `.claude/skills/`: iş akışları (basla, reels, youtube, hikaye, senaryo) ve 14 tarz örneği (`reels/ornekler/`)
- `.claude/agents/`: hareket tasarımcısı, ses tasarımcısı, kalite kontrolcü, metin yazarı
- `comp/`: animasyon motoru ve bileşen kütüphanesi (HTML/JS, Playwright ile kare kare render)
- `pipeline/`: transkript, hizalama, kesim, yüz takibi, ses
- `brands/ornek/`: hayalî örnek marka (kendi markanı `/basla` ekler)
- `kurulum/`: Mac ve Windows sistem kurulumu

## Lisanslar

Kod: [MIT](LICENSE). Ücretsiz kullan, değiştir, paylaş. Fontlar Manrope ve Montserrat (SIL Open Font License, `assets/fonts/`).
