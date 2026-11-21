# İlk kurulum (Claude için talimat)

Kullanıcı büyük ihtimalle **terminal bilmiyor**. Her şeyi sen yap. Kullanıcıdan yalnız tıklama, şifre ya da onay iste; her istekte neye tıklayacağını ve ne göreceğini tek tek, basitçe söyle. Komut adı söyleme ("ffmpeg kuruyorum" yerine "videoları işleyen aracı kuruyorum" de). Türkçe ve samimi konuş. Her adımın sonunda kısa bir "✔ tamam" ver.

## 1. Klasör
- Şu anki klasöre bak (`pwd`, `ls -A`).
  - **Boşsa** (ya da yalnız `.vscode`, `.DS_Store` varsa): repoyu buraya indir: `git clone https://github.com/omerfarukkkocaman/videocuajan.git .`
  - **Repo zaten buradaysa** (`studyo` dosyası varsa): indirme, 2. adıma geç.
  - **Boş değilse** (başka dosyalar var): kullanıcının dosyalarına dokunma. `videocuajan` alt klasörüne indir (`git clone ... videocuajan`). En sonda kullanıcıya VS Code'da o klasörü açmasını söyle (Dosya → Klasör Aç → videocuajan).
- Yol `OneDrive` içeriyorsa uyar: "Bu klasör OneDrive'a eşitleniyor. Videolar büyük olduğu için bilgisayarı yorar." Ana klasörde (C:\Users\<ad>) yeni bir `videocuajan` klasörü açıp orada yeniden başlamasını öner. Kullanıcı yine de devam etmek isterse devam et.
- **git yoksa:**
  - Mac'te `git` ilk çalıştırıldığında Apple'ın "komut satırı geliştirici araçlarını yükle" penceresi açılır. Kullanıcıya "Açılan pencerede **Yükle**'ye bas, birkaç dakika sürer, bitince 'bitti' yaz" de. Pencere açılmadıysa `xcode-select --install` çalıştır.
  - Windows'ta Claude Code çalışmak için Git'e ihtiyaç duyar, yani çoğu zaman zaten kuruludur. Yoksa kullanıcıyı https://git-scm.com/download/win adresine yönlendir: indir, hep "Next" de, bitince VS Code'u kapatıp aç.

## 2. Ne için kullanacak?
AskUserQuestion ile sor: **"Bu stüdyoyu ne için kullanacaksın?"**
- Kendi videolarımı kurgulamak (telefon/kamera kaydı, seslendirme): seviye `temel`
- Yalnız animasyonlu video (yüz yok, kayıt yok): seviye `animasyon`
- İkisi de (Önerilen): seviye `temel`

## 3. Sistem araçları (videoyu işleyen araç, animasyon motoru, Python yöneticisi)
**Mac:** `bash kurulum/kur_mac.sh`
- **Çıkış 2:** Apple geliştirici araçları penceresi açıldı. "Yükle'ye bas, bitince 'bitti' yaz." Sonra betiği tekrar çalıştır.
- **Çıkış 3:** Homebrew (Mac'e program kuran araç) yok. Betik Terminal penceresini komut yazılı hâlde açar. Kullanıcıya **tam olarak** şunu söyle:
  > Ekranda siyah/beyaz bir Terminal penceresi açıldı. Hiçbir şey yazmana gerek yok, sadece:
  > 1. "Password" yazısını görünce **Mac'ini açarken kullandığın şifreyi** yaz. Yazarken ekranda hiçbir şey görünmez, bu normal. Sonra **Enter**'a bas.
  > 2. "Press RETURN" yazısı çıkarsa bir kez daha **Enter**'a bas.
  > 3. 5–10 dakika bekle. En sonda **BITTI** yazacak, o pencereyi kapatıp bana "bitti" yaz.

  "bitti" deyince betiği tekrar çalıştır.
- **Çıkış 4:** brew kurulumu hata verdi. Çıktıyı oku, sorunu basitçe anlat, tekrar dene.

**Windows:** `powershell -ExecutionPolicy Bypass -File kurulum/kur_windows.ps1`
- Kullanıcıya önceden söyle: "Birazdan 'Bu uygulamanın cihazınızda değişiklik yapmasına izin verilsin mi?' penceresi çıkabilir. **Evet**'e bas."
- **Çıkış 3:** Araç kuruldu ama görünmüyor. Önce `./studyo doktor` dene. Yine olmazsa: "VS Code'u tamamen kapatıp yeniden aç, aynı klasör açılır. Bana 'devam' yaz."

## 4. Python ortamı ve paketler
`./studyo kur temel` (ya da `animasyon`). Önce kullanıcıya şunu söyle: "Şimdi konuşmayı yazıya döken yapay zekâ modelini ve animasyon motorunu kuruyorum. İnternet hızına göre 3–10 dakika sürer, bu sırada bir şey yapmana gerek yok."

## 5. Kontrol
`./studyo doktor`. SONUÇ satırında HAZIR yazmalı. Yazmıyorsa `.claude/skills/basla/kurulum.md` → "Sık sorunlar".

## 6. Bitiş
Kullanıcıya şunu söyle (klasör alt klasöre indiyse önce "Dosya → Klasör Aç → videocuajan"ı ekle):
> Kurulum tamam 🎉 Stüdyonun ajanları yeni bir sohbette çalışmaya başlıyor:
> 1. Claude Code panelinin üstündeki **yeni sohbet (+)** düğmesine bas.
> 2. Yeni sohbete sadece **/basla** yaz ve Enter'a bas.
>
> Sana "Bugün ne yapmak istiyorsun?" diye soracağım. İlk sefer için "Önce bir deneme yap"ı seçersen 2 dakikada örnek bir video yaparız.
