CREATE DATABASE IF NOT EXISTS batik_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE batik_store;

-- Tabel admin untuk login admin
CREATE TABLE admin (
    admin_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('superadmin','admin') NOT NULL DEFAULT 'admin',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabel akun untuk login pengguna
CREATE TABLE akun (
    akun_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    status_akun     ENUM('aktif','nonaktif','banned') NOT NULL DEFAULT 'aktif',
    tanggal_daftar  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabel pelanggan yang terkait dengan akun
CREATE TABLE pelanggan (
    pelanggan_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    akun_id         INT UNSIGNED NOT NULL UNIQUE,
    nama            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    no_hp           VARCHAR(20),
    alamat          TEXT,
    CONSTRAINT fk_pelanggan_akun FOREIGN KEY (akun_id) REFERENCES akun(akun_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Tabel jenis produk batik
CREATE TABLE jenis_produk (
    jenis_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nama_jenis  VARCHAR(100) NOT NULL,
    keterangan  TEXT
) ENGINE=InnoDB;

-- Tabel produk batik
CREATE TABLE produk (
    produk_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    jenis_id    INT UNSIGNED NOT NULL,
    nama_produk VARCHAR(150) NOT NULL,
    deskripsi   TEXT,
    status      ENUM('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_produk_jenis FOREIGN KEY (jenis_id) REFERENCES jenis_produk(jenis_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Tabel detail batik (varian produk)
CREATE TABLE detail_batik (
    detail_batik_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    produk_id       INT UNSIGNED NOT NULL,
    ukuran          VARCHAR(10)  NOT NULL,
    warna           VARCHAR(50)  NOT NULL,
    bahan           VARCHAR(100) NOT NULL,
    harga           DECIMAL(12,2) NOT NULL,
    stok            INT UNSIGNED NOT NULL DEFAULT 0,
    CONSTRAINT fk_detail_batik_produk FOREIGN KEY (produk_id) REFERENCES produk(produk_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabel pesanan
CREATE TABLE pesanan (
    pesanan_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pelanggan_id    INT UNSIGNED NOT NULL,
    tanggal_pesanan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_pesanan  ENUM('pending','dibayar','diproses','dikirim','selesai','dibatalkan') NOT NULL DEFAULT 'pending',
    total_harga     DECIMAL(14,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_pesanan_pelanggan FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(pelanggan_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Tabel detail pesanan
CREATE TABLE detail_pesanan (
    detail_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pesanan_id       INT UNSIGNED NOT NULL,
    detail_batik_id  INT UNSIGNED NOT NULL,
    jumlah           INT UNSIGNED NOT NULL DEFAULT 1,
    harga_saat_pesan DECIMAL(12,2) NOT NULL,
    subtotal         DECIMAL(14,2) GENERATED ALWAYS AS (jumlah * harga_saat_pesan) STORED,
    CONSTRAINT fk_dp_pesanan      FOREIGN KEY (pesanan_id)      REFERENCES pesanan(pesanan_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_dp_detail_batik FOREIGN KEY (detail_batik_id) REFERENCES detail_batik(detail_batik_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Tabel ulasan produk
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
    CONSTRAINT fk_ulasan_produk    FOREIGN KEY (produk_id)    REFERENCES produk(produk_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ulasan_pelanggan FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(pelanggan_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ulasan_pesanan   FOREIGN KEY (pesanan_id)   REFERENCES pesanan(pesanan_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Seed awal
INSERT INTO admin (username, password, role) VALUES
('admin', '$2a$12$A4I/fvPMAZJsh6abkVvo8.fCnLcl6bNohGo1q1OXEioSZpdFKaMvC', 'superadmin');

INSERT INTO jenis_produk (nama_jenis, keterangan) VALUES
('Batik Tulis', 'Dibuat manual menggunakan canting'),
('Batik Cap', 'Dibuat menggunakan cap/stempel'),
('Batik Printing', 'Diproduksi massal menggunakan mesin');
