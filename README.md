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
2. Import tabel keranjang `backend/sql/schema_cart.sql`.
3. (Opsional) Import seed produk `backend/sql/seed_produk_batik.sql` supaya ada data produk.
2. Konfigurasi database di `backend/config/database.php`.
3. Jalankan server PHP di `backend/public/index.php`.

## Catatan penting (Frontend)

- Frontend sebaiknya dibuka via Live Server (mis. `http://localhost:5500`) supaya request ke API tidak terkena blokir CORS.
- Kalau kamu membuka file HTML langsung (`file://...`), origin browser biasanya `null`. Backend sudah diizinkan untuk origin `null`, tapi workflow yang paling stabil tetap Live Server.

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
