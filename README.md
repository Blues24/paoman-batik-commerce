# paoman-batik-commerce

Sistem e-commerce untuk UMKM Batik Paoman yang mencakup perancangan database, dokumentasi sistem, dan implementasi proses jual beli berbasis katalog.

## Struktur Proyek

- `backend/`: API backend dengan PHP
- `frontend/`: Frontend (belum diimplementasi)
- `docs/`: Dokumentasi
- `assets/`: Asset gambar
- `sql/`: Schema database

## Setup Backend

1. Import `backend/sql/schema.sql` ke MySQL.
2. Konfigurasi database di `backend/config/database.php`.
3. Jalankan server PHP di `backend/public/index.php`.

## API Endpoints

- Auth: `/api/auth/register`, `/api/auth/login`, dll.
- Produk: `/api/produk`, dll.
- Pesanan: `/api/pesanan`, dll.
- Ulasan: `/api/ulasan`, dll.

## Fitur

- Registrasi dan login pengguna/admin
- Kelola produk dan varian
- Pesan produk
- Beri ulasan
