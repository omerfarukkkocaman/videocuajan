# Windows sistem araçları: ffmpeg (tam sürüm, Gyan), Node.js LTS, uv (Python yöneticisi). Git, Claude Code ile zaten kurulu.
# Çalıştırma (Claude Code'un Bash'inden ya da PowerShell'den):
#   powershell -ExecutionPolicy Bypass -File kurulum/kur_windows.ps1
# Sonra: ./studyo kur <animasyon|temel|maske>
$ErrorActionPreference = "Continue"
function Ok($m) { Write-Host "  [OK] $m" }
function No($m) { Write-Host "  [X]  $m" }
Write-Host "== Windows kurulumu =="
$hasWinget = [bool](Get-Command winget -ErrorAction SilentlyContinue)
if (-not $hasWinget) {
  No "winget yok. Microsoft Store'dan 'Uygulama Yükleyicisi' (App Installer) kurulup bu betik tekrar çalıştırılmalı."
  exit 2
}
function Has($c) { [bool](Get-Command $c -ErrorAction SilentlyContinue) }
$links = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Links"
$env:Path = "$links;C:\Program Files\nodejs;$env:USERPROFILE\.local\bin;$env:Path"
if (-not (Has ffmpeg)) {
  Write-Host "  . ffmpeg kuruluyor (Gyan.FFmpeg)"
  winget install --id Gyan.FFmpeg -e --accept-source-agreements --accept-package-agreements --silent | Out-Host
}
if (-not (Has node)) {
  Write-Host "  . Node.js LTS kuruluyor (izin penceresi açılırsa 'Evet' de)"
  winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements --silent | Out-Host
}
if (-not (Has uv)) {
  Write-Host "  . uv kuruluyor (Python yöneticisi)"
  powershell -ExecutionPolicy Bypass -c "irm https://astral.sh/uv/install.ps1 | iex" | Out-Host
}
$env:Path = "$links;C:\Program Files\nodejs;$env:USERPROFILE\.local\bin;$env:Path"
$all = $true
foreach ($c in @("ffmpeg", "ffprobe", "node", "npm", "uv")) { if (Has $c) { Ok $c } else { No $c; $all = $false } }
if ($all) { Write-Host "Sistem araçları hazır. Sıradaki: ./studyo kur temel   (yalnız animasyon için: ./studyo kur animasyon)" }
else { Write-Host "Bazı araçlar görünmüyor. Claude Code'u kapatıp açın (PATH yenilenir) ve tekrar deneyin."; exit 3 }
