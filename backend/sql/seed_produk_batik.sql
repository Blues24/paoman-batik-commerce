USE batik_store;

-- Seed contoh produk batik + 1 varian per produk (bisa kamu tambah varian lagi nanti).
-- Asumsi: tabel `jenis_produk` sudah terisi (lihat schema.sql).
-- Kita pakai jenis_id = 1 (Batik Tulis) untuk contoh, kamu bisa ganti sesuai kebutuhan.

-- 1) Produk: Kain Batik Motif Biru Pesisir
INSERT INTO produk (jenis_id, nama_produk, deskripsi, status)
VALUES (1, 'Kain Batik Motif Biru Pesisir', 'Kain batik motif pesisir bernuansa biru.', 'aktif');
SET @produk_id := LAST_INSERT_ID();
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
VALUES (@produk_id, '2m', 'Biru', 'Katun', 50000, 25);

-- 2) Produk: Kain Batik Motif Godong Asem
INSERT INTO produk (jenis_id, nama_produk, deskripsi, status)
VALUES (1, 'Kain Batik Motif Godong Asem', 'Kain batik motif godong asem.', 'aktif');
SET @produk_id := LAST_INSERT_ID();
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
VALUES (@produk_id, '2m', 'Coklat', 'Katun', 50000, 25);

-- 3) Produk: Baju Batik Motif Kentangan
INSERT INTO produk (jenis_id, nama_produk, deskripsi, status)
VALUES (1, 'Baju Batik Motif Kentangan', 'Baju batik motif kentangan.', 'aktif');
SET @produk_id := LAST_INSERT_ID();
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
VALUES (@produk_id, 'L', 'Navy', 'Katun', 100000, 15);

-- 4) Produk: Kain Batik Motif Mangga Bambu
INSERT INTO produk (jenis_id, nama_produk, deskripsi, status)
VALUES (1, 'Kain Batik Motif Mangga Bambu', 'Kain batik motif mangga bambu.', 'aktif');
SET @produk_id := LAST_INSERT_ID();
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
VALUES (@produk_id, '2m', 'Maroon', 'Katun', 65000, 20);

-- 5) Produk: Kain Batik Motif Kembang Gunda
INSERT INTO produk (jenis_id, nama_produk, deskripsi, status)
VALUES (1, 'Kain Batik Motif Kembang Gunda', 'Kain batik motif kembang gunda.', 'aktif');
SET @produk_id := LAST_INSERT_ID();
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
VALUES (@produk_id, '2m', 'Hitam', 'Katun', 65000, 20);

-- 6) Produk: Kemeja Batik Motif Kembang Paoman
INSERT INTO produk (jenis_id, nama_produk, deskripsi, status)
VALUES (1, 'Kemeja Batik Motif Kembang Paoman', 'Kemeja batik motif kembang paoman.', 'aktif');
SET @produk_id := LAST_INSERT_ID();
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
VALUES (@produk_id, 'L', 'Hitam', 'Katun', 100000, 12);

-- 7) Produk: Kain Batik Motif Lereng Paoman
INSERT INTO produk (jenis_id, nama_produk, deskripsi, status)
VALUES (1, 'Kain Batik Motif Lereng Paoman', 'Kain batik motif lereng paoman.', 'aktif');
SET @produk_id := LAST_INSERT_ID();
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
VALUES (@produk_id, '2m', 'Biru', 'Katun', 75000, 18);

-- 8) Produk: Blus Batik Motif Pesisir Laut
INSERT INTO produk (jenis_id, nama_produk, deskripsi, status)
VALUES (1, 'Blus Batik Motif Pesisir Laut', 'Blus batik motif pesisir laut.', 'aktif');
SET @produk_id := LAST_INSERT_ID();
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
VALUES (@produk_id, 'M', 'Biru', 'Katun', 120000, 10);

-- 9) Produk: Kain Batik Motif Daun Nila
INSERT INTO produk (jenis_id, nama_produk, deskripsi, status)
VALUES (1, 'Kain Batik Motif Daun Nila', 'Kain batik motif daun nila.', 'aktif');
SET @produk_id := LAST_INSERT_ID();
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
VALUES (@produk_id, '2m', 'Hijau', 'Katun', 85000, 14);

-- 10) Produk: Kemeja Batik Motif Kawung Laut
INSERT INTO produk (jenis_id, nama_produk, deskripsi, status)
VALUES (1, 'Kemeja Batik Motif Kawung Laut', 'Kemeja batik motif kawung laut.', 'aktif');
SET @produk_id := LAST_INSERT_ID();
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
VALUES (@produk_id, 'XL', 'Navy', 'Katun', 135000, 8);

-- 11) Produk: Kain Batik Motif Biru Pesisir Premium
INSERT INTO produk (jenis_id, nama_produk, deskripsi, status)
VALUES (1, 'Kain Batik Motif Biru Pesisir Premium', 'Kain batik pesisir versi premium.', 'aktif');
SET @produk_id := LAST_INSERT_ID();
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
VALUES (@produk_id, '2m', 'Biru', 'Katun Premium', 90000, 12);

-- 12) Produk: Outer Batik Motif Godong Asem
INSERT INTO produk (jenis_id, nama_produk, deskripsi, status)
VALUES (1, 'Outer Batik Motif Godong Asem', 'Outer batik motif godong asem.', 'aktif');
SET @produk_id := LAST_INSERT_ID();
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
VALUES (@produk_id, 'L', 'Coklat', 'Katun', 145000, 6);

-- 13) Produk: Tunik Batik Motif Kentangan
INSERT INTO produk (jenis_id, nama_produk, deskripsi, status)
VALUES (1, 'Tunik Batik Motif Kentangan', 'Tunik batik motif kentangan.', 'aktif');
SET @produk_id := LAST_INSERT_ID();
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
VALUES (@produk_id, 'M', 'Navy', 'Katun', 95000, 9);

-- 14) Produk: Dress Batik Motif Mangga Bambu
INSERT INTO produk (jenis_id, nama_produk, deskripsi, status)
VALUES (1, 'Dress Batik Motif Mangga Bambu', 'Dress batik motif mangga bambu.', 'aktif');
SET @produk_id := LAST_INSERT_ID();
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
VALUES (@produk_id, 'M', 'Maroon', 'Katun', 150000, 5);

-- 15) Produk: Kain Batik Motif Kembang Gunda Premium
INSERT INTO produk (jenis_id, nama_produk, deskripsi, status)
VALUES (1, 'Kain Batik Motif Kembang Gunda Premium', 'Kain batik kembang gunda versi premium.', 'aktif');
SET @produk_id := LAST_INSERT_ID();
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
VALUES (@produk_id, '2m', 'Hitam', 'Katun Premium', 110000, 10);

