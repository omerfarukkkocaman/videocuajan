#!/usr/bin/env bash
# Mac sistem araçları: Xcode komut satırı araçları (git, swiftc), Homebrew, ffmpeg, Node.js, uv (Python yöneticisi).
# Sonra: ./studyo kur <animasyon|temel|maske>
# Şifre isteyen adımlar (Homebrew kurulumu) Claude Code içinden yapılamaz: betik bunu söyler, kullanıcı Terminal'de bir kez çalıştırır.
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
  no "Homebrew yok. Terminal uygulamasını aç, şunu yapıştır, şifreni gir (bir kez):"
  echo '     /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  echo "   Bitince Claude Code'a 'kurdum' de; kurulum kaldığı yerden devam eder."
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
