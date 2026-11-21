#!/usr/bin/env bash
# Mac sistem araçları: Xcode komut satırı araçları (git, swiftc), Homebrew, ffmpeg, Node.js, uv (Python yöneticisi).
# Sonra: ./studyo kur <animasyon|temel|maske>
# Şifre isteyen tek adım (Homebrew): betik Terminal penceresini komut yazılı açar, kullanıcı yalnız şifresini girer.
set -u
ok() { printf '  ✔ %s\n' "$1"; }; no() { printf '  ✘ %s\n' "$1"; }
echo "== Mac kurulumu =="
if ! xcode-select -p >/dev/null 2>&1; then
  no "Xcode komut satırı araçları yok -> pencere açılıyor, 'Yükle'ye bas, bitince bu betiği tekrar çalıştır"
  xcode-select --install 2>/dev/null; exit 2
fi
ok "Xcode komut satırı araçları"
for p in /opt/homebrew/bin /usr/local/bin "$HOME/.local/bin"; do [ -d "$p" ] && PATH="$p:$PATH"; done
if ! command -v brew >/dev/null 2>&1; then
  # Homebrew şifre ister; Claude Code içinden şifre girilemez. Terminal penceresini komut yazılı hâlde açıyoruz:
  # kullanıcı yalnız Mac şifresini yazıp Enter'a basar (yazarken görünmez), "Press RETURN" derse bir kez daha Enter.
  no "Homebrew yok -> Terminal penceresi açılıyor. Oraya Mac şifreni yaz (yazarken görünmez) ve Enter'a bas."
  osascript -e 'tell application "Terminal" to activate' \
            -e 'tell application "Terminal" to do script "/bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"; echo; echo BITTI - bu pencereyi kapatabilirsin"' >/dev/null 2>&1 \
    || echo '   Terminal açılamadı. Terminal uygulamasına şunu yapıştır: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  echo "   Terminal'de 'BITTI' yazısı çıkınca Claude Code'a 'bitti' yaz; kurulum kaldığı yerden devam eder."
  exit 3
fi
ok "Homebrew"
need=()
command -v ffmpeg >/dev/null 2>&1 || need+=(ffmpeg)
command -v node   >/dev/null 2>&1 || need+=(node)
command -v uv     >/dev/null 2>&1 || need+=(uv)
if [ ${#need[@]} -gt 0 ]; then echo "  · kuruluyor: ${need[*]}"; brew install "${need[@]}" || exit 4; fi
ok "ffmpeg $(ffmpeg -version | head -1 | awk '{print $3}')"; ok "Node $(node --version)"; ok "uv $(uv --version | awk '{print $2}')"
echo "Sistem araçları hazır. Sıradaki: ./studyo kur temel   (yalnız animasyon için: ./studyo kur animasyon)"
