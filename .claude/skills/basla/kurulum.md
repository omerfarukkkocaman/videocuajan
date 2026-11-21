# Kurulum (ihtiyaca göre)

Amaç: kullanıcının işi için **gereken en az** parçayı kurmak. Kullanıcı terminal bilmiyor: her şeyi sen yap, ondan yalnız tıklama/şifre/onay iste. Her adımdan önce ne kurulacağını ve yaklaşık süresini söyle; şifre/izin penceresi çıkacaksa önceden haber ver.

## 0. Sistemi tanı
`./studyo doktor` → Sistem satırı (Darwin = Mac, Windows) ve eksikler.
- Claude Code Windows'ta komutları **Git Bash** ile çalıştırır: `./studyo` orada da çalışır. PowerShell betiği için `powershell -ExecutionPolicy Bypass -File kurulum/kur_windows.ps1`.
- Klasör OneDrive içindeyse (yol `OneDrive` içeriyorsa) uyar: videolar büyük, OneDrive eşitlemesi diski ve interneti yorar. Öneri: `C:\Users\<ad>\videocuajan`.

## 1. Sistem araçları (ffmpeg, Node.js, uv)
- **Mac:** `bash kurulum/kur_mac.sh`
  - Çıkış 2: Xcode komut satırı araçları penceresi açıldı → kullanıcı "Yükle"ye basar, bitince tekrar çalıştır.
  - Çıkış 3: Homebrew yok → betik Terminal penceresini komut yazılı açar; kullanıcı yalnız Mac şifresini yazıp Enter'a basar (yazarken görünmez), "Press RETURN" çıkarsa bir Enter daha, sonunda BITTI yazar. Ayrıntılı söyleyiş KURULUM.md §3'te. "bitti" deyince betiği tekrar çalıştır.
- **Windows:** `powershell -ExecutionPolicy Bypass -File kurulum/kur_windows.ps1`
  - Node.js kurulurken "Bu uygulamanın değişiklik yapmasına izin verilsin mi?" penceresi çıkabilir → "Evet".
  - Çıkış 3 (araç görünmüyor): PATH bu oturumda yenilenmemiştir. Önce `./studyo doktor` dene (başlatıcı bilinen yolları ekler); yine yoksa kullanıcıdan Claude Code'u kapatıp açmasını iste.

## 2. Python ortamı + paketler
`./studyo kur <seviye>`:
- `animasyon`: numpy, scipy, Pillow + Node paketleri + Chromium (~300 MB, 1–3 dk)
- `temel`: + Whisper (konuşma → yazı), torch/torchaudio (hizalama), OpenCV (yüz takibi) (~1–2 GB, 3–10 dk; internet hızına bağlı)
- `maske`: + MediaPipe (kişi maskesi)
- `hepsi`: hepsi

Uzun sürecek komutu arka planda çalıştırma; kullanıcıya "bekliyoruz, birkaç dakika" de. Bitince `./studyo doktor` ile doğrula.

## 3. İlk kullanımda inen modeller (otomatik)
- Whisper `medium` (~1.5 GB) ilk transkriptte iner → kullanıcıya önceden söyle.
- Hizalama modeli (MMS, ~1.2 GB) `.cache/torch` altına iner.
- Windows/Linux'ta yüz bulma modeli (YuNet, ~230 KB) ve kişi maskesi modeli (~16 MB) `.cache/models` altına iner.
Hepsi ücretsizdir; hesap/anahtar gerekmez.

## Sık sorunlar
| Belirti | Çözüm |
|---|---|
| `python` yazınca Microsoft Store açılıyor | `./studyo` kullan (kendi Python'unu `.venv`/uv'den bulur) |
| `npx playwright install` takıldı | İnternet/proxy; tekrar `./studyo kur animasyon` |
| HDR iPhone videosunda renkler soluk (Windows) | Gyan "full" ffmpeg kurulu olmalı (betik onu kurar); `./studyo doktor` → zscale ✔ |
| Hizalama "bellek" ile ölüyor (uzun kayıt) | prep'in yazdığı parçalı yol komutunu çalıştır |
| Mac'te `swiftc` yok | Sorun değil; OpenCV yedeği kullanılır. İstenirse `xcode-select --install` |
| Render'da Türkçe/emoji karakter kutu çıkıyor | Windows'ta "Segoe UI Emoji" yüklü olmalı (varsayılan gelir); Linux'ta `fonts-noto-color-emoji` |
