# 🎬 videocuajan — Claude Code video stüdyosu

Telefonla çektiğin konuşma videosunu, ekran kaydını ya da kendi seslendirmeni **kurgulanmış, animasyonlu, altyazılı, müzikli** videoya çevirir. Dikey (Reels/TikTok/Shorts), yatay (YouTube) ve kare formatlar desteklenir. Mac ve Windows'ta çalışır.

Ne yapabilir?
- **Ham video kurgusu:** boşlukları, tekrarları ve "eee"leri keser; kafayı kesmeyen kadraj, cümle düzeninde altyazı, animasyon, müzik ve efekt ekler, sesi -14 LUFS'a getirir.
- **Animasyonlu video:** yüz olmadan, kendi seslendirmenle ya da yalnızca ekran yazısıyla sahne sahne animasyon üretir.
- **YouTube videosu:** yatay kurgu, ders/ekran kaydı düzenleme, bölüm listesi, SRT altyazı ve başlık/açıklama önerileri.
- **Dikey hikâye:** kanca, düğüm, dönüm ve sonuç yapısında hikâye ya da liste videosu.
- **Metin yazarı:** konundan 3 farklı kanca ve konuşma metni hazırlar.

Müzik ve efektler koddan sentezlenir, telif sorunu çıkmaz. Ücretli bir servis ya da API anahtarı gerekmez.

## Kurulum: tek prompt

Gerekenler: [Claude Code](https://claude.com/claude-code) kurulu olmalı. Windows'ta Claude Code kurulurken Git for Windows da kurulur, o yeterli.

Claude Code'u herhangi bir klasörde aç ve şunu yapıştır:

```
https://github.com/omerfarukkkocaman/videocuajan reposunu ana klasörüme (~/videocuajan) klonla,
içindeki KURULUM.md dosyasını oku ve adımları benimle birlikte uygula.
```

Claude sana birkaç soru sorar, gereken araçları (ffmpeg, Node.js, Python paketleri) kurar ve sonunda şunu söyler:

```
cd ~/videocuajan && claude
```

Claude Code o klasörde açılınca yalnızca şunu yaz:

```
/basla
```

Claude "Bugün ne yapmak istiyorsun?" diye sorar, dosyalarını koyacağın klasörü açar ve videonu üretir.

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
