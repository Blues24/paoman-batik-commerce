-- 1. Create Database
CREATE DATABASE IF NOT EXISTS batik_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE batik_store;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- 2. Create Tables
-- Tabel admin
CREATE TABLE admin (
    admin_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('superadmin','admin') NOT NULL DEFAULT 'admin',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabel akun
CREATE TABLE akun (
    akun_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    status_akun     ENUM('aktif','nonaktif','banned') NOT NULL DEFAULT 'aktif',
    tanggal_daftar  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabel pelanggan
CREATE TABLE pelanggan (
    pelanggan_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    akun_id         INT UNSIGNED NOT NULL UNIQUE,
    nama            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    no_hp           VARCHAR(20),
    alamat          TEXT,
    CONSTRAINT fk_pelanggan_akun FOREIGN KEY (akun_id) REFERENCES akun(akun_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Tabel jenis produk
CREATE TABLE jenis_produk (
    jenis_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nama_jenis  VARCHAR(100) NOT NULL,
    keterangan  TEXT
) ENGINE=InnoDB;

-- Tabel produk
CREATE TABLE produk (
    produk_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    jenis_id    INT UNSIGNED NOT NULL,
    nama_produk VARCHAR(150) NOT NULL,
    deskripsi   TEXT,
    gambar_produk VARCHAR(255),
    status      ENUM('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_produk_jenis FOREIGN KEY (jenis_id) REFERENCES jenis_produk(jenis_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Tabel detail batik (varian)
CREATE TABLE detail_batik (
    detail_batik_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    produk_id       INT UNSIGNED NOT NULL,
    ukuran          VARCHAR(10)  NOT NULL,
    warna           VARCHAR(50)  NOT NULL,
    bahan           VARCHAR(100) NOT NULL,
    harga           DECIMAL(12,2) NOT NULL,
    stok            INT UNSIGNED NOT NULL DEFAULT 0,
    CONSTRAINT fk_detail_batik_produk FOREIGN KEY (produk_id) REFERENCES produk(produk_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabel pesanan
CREATE TABLE pesanan (
    pesanan_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pelanggan_id    INT UNSIGNED NOT NULL,
    tanggal_pesanan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_pesanan  ENUM('pending','dibayar','diproses','dikirim','selesai','dibatalkan') NOT NULL DEFAULT 'pending',
    total_harga     DECIMAL(14,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_pesanan_pelanggan FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(pelanggan_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Tabel detail pesanan
CREATE TABLE detail_pesanan (
    detail_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pesanan_id       INT UNSIGNED NOT NULL,
    detail_batik_id  INT UNSIGNED NOT NULL,
    jumlah           INT UNSIGNED NOT NULL DEFAULT 1,
    harga_saat_pesan DECIMAL(12,2) NOT NULL,
    subtotal         DECIMAL(14,2) GENERATED ALWAYS AS (jumlah * harga_saat_pesan) STORED,
    CONSTRAINT fk_dp_pesanan      FOREIGN KEY (pesanan_id)      REFERENCES pesanan(pesanan_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_dp_detail_batik FOREIGN KEY (detail_batik_id) REFERENCES detail_batik(detail_batik_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Tabel tambahan: konsultasi, kontak, cart, ulasan
CREATE TABLE `konsultasi` (
  `id_konsultasi` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `nama_lengkap` varchar(100) NOT NULL,
  `no_whatsapp` varchar(20) NOT NULL,
  `jenis_kebutuhan` enum('Seragam SD / Sekolah','Seragam Kantor / Instansi','Batik Acara / Komunitas','Kain Batik Custom','Pakaian Batik Custom') NOT NULL,
  `estimasi_jumlah` enum('1 - 10 pcs','11 - 30 pcs','31 - 100 pcs','100+ pcs') NOT NULL,
  `target_waktu` enum('Secepatnya','1 - 2 minggu','1 bulan','Lebih dari 1 bulan') NOT NULL,
  `referensi_produk` enum('Opsional','Kain Batik','Baju Batik','Belum tahu') DEFAULT 'Opsional',
  `deskripsi_kebutuhan` text NOT NULL,
  `status_konsultasi` enum('Pending','Diproses','Selesai') DEFAULT 'Pending',
  `tgl_pengajuan` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Tabel kontak (form contact us)
CREATE TABLE `kontak` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `nama_lengkap` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `no_whatsapp` varchar(20) NOT NULL,
  `topik` varchar(50) NOT NULL,
  `pesan` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Tabel keranjang belanja user
CREATE TABLE cart_item (
    cart_item_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pelanggan_id     INT UNSIGNED NOT NULL,
    detail_batik_id  INT UNSIGNED NOT NULL,
    qty              INT UNSIGNED NOT NULL DEFAULT 1,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cart_item (pelanggan_id, detail_batik_id),
    CONSTRAINT fk_cart_pelanggan FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(pelanggan_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_cart_detail_batik FOREIGN KEY (detail_batik_id) REFERENCES detail_batik(detail_batik_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE ulasan (
    ulasan_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    produk_id      INT UNSIGNED NOT NULL,
    pelanggan_id   INT UNSIGNED NOT NULL,
    pesanan_id     INT UNSIGNED NOT NULL,
    rating         TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
    komentar       TEXT,
    tanggal_ulasan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status         ENUM('aktif','disembunyikan') NOT NULL DEFAULT 'aktif',
    UNIQUE KEY uq_ulasan_per_pesanan_produk (pesanan_id, produk_id),
    CONSTRAINT fk_ulasan_produk    FOREIGN KEY (produk_id)    REFERENCES produk(produk_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ulasan_pelanggan FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(pelanggan_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ulasan_pesanan   FOREIGN KEY (pesanan_id)   REFERENCES pesanan(pesanan_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ==========================================
-- TAHAP 2: PENGISIAN DATA (INSERTION)
-- ==========================================

-- 1. Insert Data Admin
INSERT INTO admin (admin_id, username, password, role) VALUES
(1, "daffa", "$2a$12$Eo7JpT4GO5HKaeuosHYd9.nnWIj41f.7icR4pEpuZzc7NV9EqyYVG", "admin"),
(2, "hasbi", "$2a$12$Eo7JpT4GO5HKaeuosHYd9.nnWIj41f.7icR4pEpuZzc7NV9EqyYVG", "admin"),
(3, "blues", "$2a$12$Eo7JpT4GO5HKaeuosHYd9.nnWIj41f.7icR4pEpuZzc7NV9EqyYVG", "admin");

-- 2. Insert Data Akun Pengguna
INSERT INTO akun (akun_id, username, password_hash, status_akun) VALUES
(1, "daffa123", "$2a$12$Eo7JpT4GO5HKaeuosHYd9.nnWIj41f.7icR4pEpuZzc7NV9EqyYVG", "aktif"),
(2, "hasbi123", "$2a$12$Eo7JpT4GO5HKaeuosHYd9.nnWIj41f.7icR4pEpuZzc7NV9EqyYVG", "aktif"),
(3, "lukman", "$2a$12$Eo7JpT4GO5HKaeuosHYd9.nnWIj41f.7icR4pEpuZzc7NV9EqyYVG", "aktif");

-- 3. Insert Data Pelanggan (Relasi ke Akun)
INSERT INTO pelanggan (pelanggan_id, akun_id, nama, email, no_hp, alamat) VALUES
(1, 1, "Daffa", "daffa123@gmail.com", "081010101010", "Jalanin aja dulu, sambil dipukpuk waifu"),
(2, 2, "Hasbi", "hasbi123@gmail.com", "086767676767", "Jl.Tidur lah untuk meraih mimpi"),
(3, 3, "Lukman", "blues@mail.archblues.io", "08696966969", "Jalan-jalan malah ketiduran");

-- 4. Insert Jenis Produk
INSERT INTO jenis_produk (jenis_id, nama_jenis, keterangan) VALUES
(1, 'Kain', NULL),
(2, 'Baju', NULL);

-- 5. Insert Katalog Produk (Master Data)
INSERT INTO produk (jenis_id, nama_produk, deskripsi, gambar_produk, status) VALUES
(1, 'Kain Batik Motif Ganggeng Pesisir', 'Kain batik motif ganggeng yang terinspirasi rumput laut Pantura.', '../img/batik1.jpg', 'aktif'),
(1, 'Kain Batik Motif Jarot Asem', 'Kain batik motif jarot asem khas Indramayu.', '../img/batik2.jpg', 'aktif'),
(1, 'Kain Batik Motif Kapal Kandas', 'Kain batik motif kapal kandas dengan unsur kehidupan nelayan.', '../img/batik3.jpg', 'aktif'),
(1, 'Kain Batik Motif Kembang Gunda', 'Kain batik motif kembang gunda.', '../img/batik4.jpg', 'aktif'),
(1, 'Kain Batik Motif Banji Tepak', 'Kain batik motif banji tepak dengan pengaruh ragam hias Tionghoa.', '../img/batik5.jpg', 'aktif'),
(1, 'Kain Batik Motif Lokcan', 'Kain batik motif lokcan dengan inspirasi burung hong.', '../img/batik6.jpg', 'aktif'),
(1, 'Kain Batik Motif Lasem Urang', 'Kain batik motif lasem urang.', '../img/batik7.jpg', 'aktif'),
(1, 'Kain Batik Motif Kembang Gunda Premium', 'Kain batik kembang gunda versi premium.', '../img/batik8.jpg', 'aktif'),
(1, 'Kain Batik Motif Iwak Etong', 'Kain batik motif iwak etong khas pesisir Indramayu.', '../img/batik9.jpg', 'aktif'),
(1, 'Kain Batik Motif Kapal Laju', 'Kain batik motif kapal laju.', '../img/batik10.jpg', 'aktif'),
(2, 'Baju Batik Motif Kembang Kapas', 'Baju batik motif kembang kapas pintu raja.', '../img/baju1.png', 'aktif'),
(2, 'Kemeja Batik Motif Iwak Etong', 'Kemeja batik motif iwak etong khas pesisir Indramayu.', '../img/baju2.png', 'aktif'),
(2, 'Blus Batik Motif Kembang Karang', 'Blus batik motif kembang karang.', '../img/baju3.png', 'aktif'),
(2, 'Kemeja Batik Motif Kapal Laju', 'Kemeja batik motif kapal laju.', '../img/baju4.png', 'aktif'),
(2, 'Outer Batik Motif Jarot Asem', 'Outer batik motif jarot asem.', '../img/baju5.png', 'aktif'),
(2, 'Tunik Batik Motif Kembang Kapas', 'Tunik batik motif kembang kapas.', '../img/baju6.png', 'aktif'),
(2, 'Dress Batik Motif Kapal Kandas', 'Dress batik motif kapal kandas.', '../img/baju7.png', 'aktif');

-- 6. Insert Detail Batik (Varian Harga & Stok)
-- Menggunakan subquery agar ID produk otomatis sinkron dengan nama produknya
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, '2m', 'Biru', 'Katun', 50000, 25 FROM produk WHERE nama_produk = 'Kain Batik Motif Ganggeng Pesisir';
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, '2m', 'Coklat', 'Katun', 50000, 25 FROM produk WHERE nama_produk = 'Kain Batik Motif Jarot Asem';
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, '2m', 'Hijau', 'Katun', 65000, 20 FROM produk WHERE nama_produk = 'Kain Batik Motif Kapal Kandas';
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, '2m', 'Biru', 'Katun', 65000, 20 FROM produk WHERE nama_produk = 'Kain Batik Motif Kembang Gunda';
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, '2m', 'Hitam', 'Katun', 75000, 18 FROM produk WHERE nama_produk = 'Kain Batik Motif Banji Tepak';
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, '2m', 'Coklat', 'Katun', 85000, 14 FROM produk WHERE nama_produk = 'Kain Batik Motif Lokcan';
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, '2m', 'Navy', 'Katun', 90000, 12 FROM produk WHERE nama_produk = 'Kain Batik Motif Lasem Urang';
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, '2m', 'Hitam', 'Katun Premium', 110000, 10 FROM produk WHERE nama_produk = 'Kain Batik Motif Kembang Gunda Premium';
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, '2m', 'Biru', 'Katun', 95000, 14 FROM produk WHERE nama_produk = 'Kain Batik Motif Iwak Etong';
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, '2m', 'Oranye', 'Katun', 100000, 12 FROM produk WHERE nama_produk = 'Kain Batik Motif Kapal Laju';
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, 'Dewasa M', 'Coklat', 'Katun', 100000, 15 FROM produk WHERE nama_produk = 'Baju Batik Motif Kembang Kapas';
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, 'Dewasa L', 'Hitam', 'Katun', 100000, 12 FROM produk WHERE nama_produk = 'Kemeja Batik Motif Iwak Etong';
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, 'Dewasa M', 'Biru', 'Katun', 120000, 10 FROM produk WHERE nama_produk = 'Blus Batik Motif Kembang Karang';
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, 'Dewasa XL', 'Navy', 'Katun', 135000, 8 FROM produk WHERE nama_produk = 'Kemeja Batik Motif Kapal Laju';
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, 'Dewasa L', 'Coklat', 'Katun', 145000, 6 FROM produk WHERE nama_produk = 'Outer Batik Motif Jarot Asem';
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, 'Dewasa M', 'Navy', 'Katun', 95000, 9 FROM produk WHERE nama_produk = 'Tunik Batik Motif Kembang Kapas';
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT produk_id, 'Dewasa M', 'Maroon', 'Katun', 150000, 5 FROM produk WHERE nama_produk = 'Dress Batik Motif Kapal Kandas';

-- Modifikasi Tabel Pesanan
ALTER TABLE pesanan
    ADD COLUMN metode_pembayaran ENUM('qris','ewallet','cod') NOT NULL DEFAULT 'qris' AFTER status_pesanan,
    ADD COLUMN payment_status ENUM('belum_dibayar','menunggu_konfirmasi','dibayar','bayar_di_tempat') NOT NULL DEFAULT 'belum_dibayar' AFTER metode_pembayaran,
    ADD COLUMN catatan TEXT AFTER payment_status,
    ADD COLUMN payment_detail VARCHAR(255) AFTER catatan,
    ADD COLUMN bukti_pembayaran VARCHAR(255) AFTER payment_detail;

-- Modifikasi Tabel Detail Pesanan
ALTER TABLE detail_pesanan
    ADD COLUMN opsi_pesanan JSON AFTER harga_saat_pesan,
    ADD COLUMN catatan TEXT AFTER opsi_pesanan;

-- Update Status Masal
UPDATE produk SET status = 'nonaktif' WHERE status != 'aktif';

COMMIT;
