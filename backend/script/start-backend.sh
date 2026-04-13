#!/usr/bin/env bash

set -euo pipefail

echo "Starting Backend..."

# Cek ketersediaan PHP cli
if ! command -v php &> /dev/null; then
    echo "PHP tidak ditemukan tolong install dulu lah..."
    exit 1
fi

# Cek .env file
if [ ! -f .env]; then
    echo "file .env tidak ditemukan, membuat .env dari .env.example"
    cp ../.env.example ../.env
    echo "✅ .env dibuat. Sesuaikan isinya sebelum lanjut."
    exit 1
fi

if ! mysqladmin ping -h 127.0.0.1 --silent 2>/dev/null; then
    echo "[!] MySql tidak aktif. menjalankan XAMPP MySql daemon..."
    sudo /opt/lampp/lampp startmysql
    sleep 2
fi 


echo "✅ MySQL siap"
echo "🌐 Backend jalan di http://localhost:8000"
echo "🛑 Tekan Ctrl+C untuk stop"
echo ""

php -S localhost:8000 ../public/index.php