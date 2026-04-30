USE batik_store;

-- Seed katalog 17 produk: batik1-10 untuk kain, baju1-7 untuk pakaian.
-- Jalankan pada database kosong, atau pakai migration_produk_paoman_catalog.sql untuk database lama.

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
(1, 'Baju Batik Motif Kembang Kapas', 'Baju batik motif kembang kapas pintu raja.', '../img/baju1.png', 'aktif'),
(1, 'Kemeja Batik Motif Iwak Etong', 'Kemeja batik motif iwak etong khas pesisir Indramayu.', '../img/baju2.png', 'aktif'),
(1, 'Blus Batik Motif Kembang Karang', 'Blus batik motif kembang karang.', '../img/baju3.png', 'aktif'),
(1, 'Kemeja Batik Motif Kapal Laju', 'Kemeja batik motif kapal laju.', '../img/baju4.png', 'aktif'),
(1, 'Outer Batik Motif Jarot Asem', 'Outer batik motif jarot asem.', '../img/baju5.png', 'aktif'),
(1, 'Tunik Batik Motif Kembang Kapas', 'Tunik batik motif kembang kapas.', '../img/baju6.png', 'aktif'),
(1, 'Dress Batik Motif Kapal Kandas', 'Dress batik motif kapal kandas.', '../img/baju7.png', 'aktif');

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
