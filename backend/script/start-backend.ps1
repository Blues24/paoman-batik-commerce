Write-Host "🚀 Starting Paoman Batik Commerce Backend..."

# cek PHP tersedia
if (-not (Get-Command php -ErrorAction SilentlyContinue)) {
    Write-Host "❌ PHP tidak ditemukan. Install PHP dulu."
    exit 1
}

# cek .env ada
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  File .env tidak ditemukan, membuat dari .env.example..."
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env dibuat. Sesuaikan isinya sebelum lanjut."
    exit 1
}

# cek MySQL jalan via XAMPP
$mysql = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if (-not $mysql) {
    Write-Host "⚠️  MySQL tidak jalan. Menjalankan XAMPP MySQL..."
    Start-Process "C:\xampp\xampp-control.exe"
    Write-Host "⚠️  Jalankan MySQL dari XAMPP Control Panel, lalu jalankan script ini lagi."
    exit 1
}

Write-Host "✅ MySQL siap"
Write-Host "🌐 Backend jalan di http://localhost:8000"
Write-Host "🛑 Tekan Ctrl+C untuk stop"
Write-Host ""

php -S localhost:8000 public/index.php