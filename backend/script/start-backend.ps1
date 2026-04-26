$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = Split-Path -Parent $scriptRoot
$envPath = Join-Path $backendRoot ".env"
$envExamplePath = Join-Path $backendRoot ".env.example"
$publicPath = Join-Path $backendRoot "public"
$routerPath = Join-Path $publicPath "index.php"

Write-Host "[INFO] Starting Paoman Batik Commerce Backend..."

# Cek PHP tersedia di PATH.
if (-not (Get-Command php -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] PHP tidak ditemukan. Install PHP dulu atau tambahkan ke PATH."
    exit 1
}

# Cek file penting backend ada.
if (-not (Test-Path $publicPath)) {
    Write-Host "[ERROR] Folder public tidak ditemukan di: $publicPath"
    exit 1
}

if (-not (Test-Path $routerPath)) {
    Write-Host "[ERROR] File router backend tidak ditemukan di: $routerPath"
    exit 1
}

# Cek .env berdasarkan lokasi backend, bukan current working directory.
if (-not (Test-Path $envPath)) {
    if (-not (Test-Path $envExamplePath)) {
        Write-Host "[ERROR] .env dan .env.example sama-sama tidak ditemukan."
        exit 1
    }

    Write-Host "[WARN] File .env tidak ditemukan. Membuat dari .env.example..."
    Copy-Item $envExamplePath $envPath
    Write-Host "[OK] .env berhasil dibuat di $envPath"
    Write-Host "[WARN] Sesuaikan isi .env dulu, lalu jalankan script ini lagi."
    exit 1
}

# Cek MySQL jalan via XAMPP.
$mysql = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if (-not $mysql) {
    Write-Host "[WARN] MySQL belum berjalan."

    $xamppControl = "C:\xampp\xampp-control.exe"
    if (Test-Path $xamppControl) {
        Write-Host "[INFO] Membuka XAMPP Control Panel..."
        Start-Process $xamppControl
    } else {
        Write-Host "[WARN] XAMPP Control Panel tidak ditemukan di $xamppControl"
    }

    Write-Host "[WARN] Jalankan MySQL dulu, lalu ulangi script ini."
    exit 1
}

Write-Host "[OK] MySQL siap"
Write-Host "[INFO] Backend jalan di http://localhost:8000"
Write-Host "[INFO] Tekan Ctrl+C untuk stop"
Write-Host ""

Push-Location $backendRoot
try {
    php -S localhost:8000 -t $publicPath $routerPath
} finally {
    Pop-Location
}
