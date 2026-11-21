# İlk kurulum (Claude için talimat)

Bu dosyayı, kullanıcı repoyu yeni indirdiğinde ve Claude Code henüz bu klasörde açılmamışken uygula. Kullanıcıyla Türkçe, samimi konuş; her adımda ne yaptığını tek cümleyle söyle.

1. **Konum:** Repo şurada olmalı:
   - Mac: `~/videocuajan`
   - Windows: `C:\Users\<ad>\videocuajan` (Git Bash: `~/videocuajan`). Masaüstü OneDrive'a bağlıysa oraya **koyma**, çünkü videolar büyük ve OneDrive eşitlemesi diski ile interneti yorar.

   Klonlanmadıysa: `git clone https://github.com/omerfarukkkocaman/videocuajan.git ~/videocuajan`. Sonra o klasöre geç.
2. **Ne yapmak istiyor?** Kullanıcıya kısaca sor: "Bu stüdyoyla ne yapmayı düşünüyorsun? (a) elimdeki videoları kurgulamak, (b) yalnız animasyonlu video, (c) ikisi de". Cevaba göre kurulum seviyesi değişir: a ya da c ise `temel`, b ise `animasyon`.
3. **Sistem araçları:**
   - Mac: `bash kurulum/kur_mac.sh`. Çıkış kodu 2 ise Xcode penceresinde "Yükle"ye basmasını iste. Çıkış kodu 3 ise betiğin yazdığı Homebrew satırını kullanıcı **Terminal uygulamasında** çalıştırmalı, çünkü şifre ister. "Kurdum" deyince betiği tekrar çalıştır.
   - Windows: `powershell -ExecutionPolicy Bypass -File kurulum/kur_windows.ps1`. İzin penceresi çıkarsa "Evet" desin.
4. **Python ortamı ve paketler:** `./studyo kur temel` (ya da `animasyon`). 3–10 dakika sürer. Kullanıcıya bunu baştan söyle.
5. **Kontrol:** `./studyo doktor`. SONUÇ satırı HAZIR değilse `.claude/skills/basla/kurulum.md` → "Sık sorunlar".
6. **Bitiş:** Kullanıcıya şunu söyle:
   > Kurulum tamam 🎉 Stüdyonun ajanları ve iş akışları bu klasöre bağlı, o yüzden Claude Code'u bu klasörde yeniden açalım:
   > - Terminal'de: `cd ~/videocuajan && claude`
   > - VS Code'da: Dosya → Klasör Aç → `videocuajan`, sonra Claude Code paneli
   >
   > Açılınca yalnızca **/basla** yaz. Sana "Bugün ne yapmak istiyorsun?" diye soracağım.
