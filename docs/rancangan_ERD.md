# 📘 README – ERD Sistem Katalog & Pemesanan Produk Batik

## 📌 Deskripsi Sistem
Sistem ini merupakan aplikasi katalog dan pemesanan produk batik yang mendukung:
- Registrasi akun pelanggan
- Pengelolaan data pelanggan
- Katalog produk dengan berbagai jenis produk
- Proses pemesanan dan detail transaksi
- Pemberian ulasan produk hanya oleh pelanggan yang telah membeli

Desain database difokuskan pada alur jual–beli nyata, dengan memperhatikan integritas data dan pencegahan manipulasi data.

---

## 🧱 Struktur Tabel & Tipe Data
Asumsi DBMS: MySQL / MariaDB

---

## Tabel: akun
| Field | Tipe Data | Keterangan |
|------|-----------|------------|
| akun_id | INT AUTO_INCREMENT | PK |
| pelanggan_id | INT | FK → pelanggan.pelanggan_id |
| username | VARCHAR(50) | Unik |
| password_hash | VARCHAR(255) | Hash password |
| status_akun | ENUM('aktif','nonaktif') | Status akun |
| tanggal_daftar | DATETIME | Waktu registrasi |

---

## Tabel: pelanggan
| Field | Tipe Data | Keterangan |
|------|-----------|------------|
| pelanggan_id | INT AUTO_INCREMENT | PK |
| nama | VARCHAR(100) | Nama pelanggan |
| email | VARCHAR(100) | Email |
| no_hp | VARCHAR(20) | Nomor HP |
| alamat | TEXT | Alamat lengkap |

---

## Tabel: jenis_produk
| Field | Tipe Data | Keterangan |
|------|-----------|------------|
| jenis_id | INT AUTO_INCREMENT | PK |
| nama_jenis | VARCHAR(50) | Nama jenis produk |
| keterangan | TEXT | Deskripsi |

---

## Tabel: produk
| Field | Tipe Data | Keterangan |
|------|-----------|------------|
| produk_id | INT AUTO_INCREMENT | PK |
| jenis_id | INT | FK → jenis_produk.jenis_id |
| nama_produk | VARCHAR(100) | Nama produk |
| deskripsi | TEXT | Detail produk |
| status | ENUM('tersedia','habis') | Status produk |

---

## Tabel: detail_batik
| Field | Tipe Data | Keterangan |
|------|-----------|------------|
| detail_batik_id | INT AUTO_INCREMENT | PK |
| produk_id | INT | FK → produk.produk_id |
| warna | VARCHAR(50) | Warna |
| ukuran | VARCHAR(20) | Ukuran |
| harga | DECIMAL(12,2) | Harga |
| stok | INT | Jumlah stok |

---

## Tabel: pesanan
| Field | Tipe Data | Keterangan |
|------|-----------|------------|
| pesanan_id | INT AUTO_INCREMENT | PK |
| pelanggan_id | INT | FK → pelanggan.pelanggan_id |
| tanggal_pesanan | DATETIME | Waktu pesan |
| status_pesanan | ENUM('diproses','selesai','batal') | Status |
| total_harga | DECIMAL(12,2) | Total transaksi |

---

## Tabel: detail_pesanan
| Field | Tipe Data | Keterangan |
|------|-----------|------------|
| detail_id | INT AUTO_INCREMENT | PK |
| pesanan_id | INT | FK → pesanan.pesanan_id |
| produk_id | INT | FK → produk.produk_id |
| jumlah | INT | Jumlah beli |
| harga_saat_pesan | DECIMAL(12,2) | Harga transaksi |
| subtotal | DECIMAL(12,2) | Total per item |

---

## Tabel: ulasan
| Field | Tipe Data | Keterangan |
|------|-----------|------------|
| ulasan_id | INT AUTO_INCREMENT | PK |
| pelanggan_id | INT | FK → pelanggan.pelanggan_id |
| produk_id | INT | FK → produk.produk_id |
| pesanan_id | INT | FK → pesanan.pesanan_id |
| rating | TINYINT | Skala 1–5 |
| komentar | TEXT | Isi ulasan |
| tanggal_ulasan | DATETIME | Waktu ulasan |
| status | ENUM('aktif','disembunyikan') | Status ulasan |

Constraint:
UNIQUE (pelanggan_id, produk_id, pesanan_id)

---

## 🔄 Alur Sistem Singkat
1. Pelanggan mendaftar akun
2. Pelanggan memilih produk berdasarkan jenis
3. Pesanan dibuat
4. Detail pesanan mencatat produk & harga
5. Pesanan selesai
6. Pelanggan memberikan ulasan

---

## ✅ Catatan Desain
- Tidak ada relasi M:N langsung
- Harga transaksi bersifat historis
- Review palsu dicegah dengan relasi pesanan
- Struktur siap dikembangkan (admin, pengiriman, promo)
