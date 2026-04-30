USE batik_store;

ALTER TABLE produk
    ADD COLUMN IF NOT EXISTS gambar_produk VARCHAR(255) AFTER deskripsi;

UPDATE produk SET status = 'nonaktif';

CREATE TEMPORARY TABLE katalog_paoman (
    urutan INT PRIMARY KEY,
    nama_produk VARCHAR(150) NOT NULL,
    deskripsi TEXT,
    gambar_produk VARCHAR(255) NOT NULL,
    ukuran VARCHAR(20) NOT NULL,
    warna VARCHAR(50) NOT NULL,
    bahan VARCHAR(100) NOT NULL,
    harga DECIMAL(12,2) NOT NULL,
    stok INT UNSIGNED NOT NULL
);

INSERT INTO katalog_paoman VALUES
(1, 'Kain Batik Motif Tangga Istana', 'Kain batik motif tangga istana.', '../img/batik1.jpg', '2m', 'Navy', 'Katun', 75000, 21),
(2, 'Kain Batik Motif Godong Asem', 'Kain batik motif godong asem.', '../img/batik2.jpg', '2m', 'Hijau', 'Katun', 50000, 25),
(3, 'Kain Batik Motif Kembang Gunda', 'Kain batik motif kembang gunda.', '../img/batik3.jpg', '2m', 'Hitam', 'Katun', 65000, 20),
(4, 'Kain Batik Motif Ganggeng Manuk', 'Kain batik motif ganggeng manuk.', '../img/batik4.jpg', '2m', 'Hijau', 'Katun', 65000, 20),
(5, 'Kain Batik Motif Srempang Kandang', 'Kain batik motif srempang kandang.', '../img/batik5.jpg', '2m', 'Biru', 'Katun', 70000, 18),
(6, 'Kain Batik Motif Lasemurang', 'Kain batik motif lasemurang.', '../img/batik6.jpg', '2m', 'Biru', 'Katun', 85000, 14),
(7, 'Kain Batik Motif Kembang Kapas', 'Kain batik motif kembang kapas.', '../img/batik7.jpg', '2m', 'Ungu', 'Katun', 90000, 12),
(8, 'Kain Batik Motif Mangga Bambu', 'Kain batik motif mangga bambu.', '../img/batik8.jpg', '2m', 'Biru', 'Katun', 85000, 12),
(9, 'Kain Batik Motif Cuiri', 'Kain batik motif cuiri.', '../img/batik9.jpg', '2m', 'Oranye', 'Katun', 95000, 14),
(10, 'Kain Batik Motif Sekar Niem', 'Kain batik motif sekar niem.', '../img/batik10.jpg', '2m', 'Biru', 'Katun', 100000, 12),
(11, 'Baju Batik Motif Godong Asem', 'Baju batik motif godong asem.', '../img/baju1.png', 'Dewasa M', 'Ungu', 'Katun', 100000, 15),
(12, 'Kemeja Batik Motif Kentangan', 'Kemeja batik motif kentangan.', '../img/baju2.png', 'Dewasa L', 'Hitam', 'Katun', 100000, 12),
(13, 'Kemeja Batik Motif Sekar Niem', 'Kemeja batik motif sekar niem.', '../img/baju3.png', 'Dewasa M', 'Merah Muda', 'Katun', 120000, 10),
(14, 'Kemeja Batik Motif Lasemurang', 'Kemeja batik motif lasemurang.', '../img/baju4.png', 'Dewasa XL', 'Coklat', 'Katun', 135000, 8),
(15, 'Baju Batik Motif Kentangan', 'Baju batik motif kentangan.', '../img/baju5.png', 'Dewasa M', 'Oranye', 'Katun', 95000, 9),
(16, 'Baju Batik Motif Sekar Niem', 'Baju batik motif sekar niem.', '../img/baju6.png', 'Dewasa M', 'Abu-abu', 'Katun', 95000, 9),
(17, 'Baju Batik Motif Liris atau Parang', 'Baju batik motif liris atau parang.', '../img/baju7.png', 'Dewasa M', 'Coklat', 'Katun', 150000, 5);

INSERT INTO produk (jenis_id, nama_produk, deskripsi, gambar_produk, status)
SELECT 1, k.nama_produk, k.deskripsi, k.gambar_produk, 'aktif'
FROM katalog_paoman k
WHERE NOT EXISTS (SELECT 1 FROM produk p WHERE p.nama_produk = k.nama_produk);

UPDATE produk p
JOIN katalog_paoman k ON k.nama_produk = p.nama_produk
SET p.deskripsi = k.deskripsi,
    p.gambar_produk = k.gambar_produk,
    p.status = 'aktif';

UPDATE produk p
JOIN (
    SELECT nama_produk, MIN(produk_id) AS keep_id
    FROM produk
    WHERE status = 'aktif'
    GROUP BY nama_produk
) x ON x.nama_produk = p.nama_produk
SET p.status = 'nonaktif'
WHERE p.produk_id <> x.keep_id;

INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
SELECT p.produk_id, k.ukuran, k.warna, k.bahan, k.harga, k.stok
FROM produk p
JOIN katalog_paoman k ON k.nama_produk = p.nama_produk
WHERE p.status = 'aktif'
  AND NOT EXISTS (SELECT 1 FROM detail_batik db WHERE db.produk_id = p.produk_id);

UPDATE detail_batik db
JOIN produk p ON p.produk_id = db.produk_id
JOIN katalog_paoman k ON k.nama_produk = p.nama_produk
SET db.ukuran = k.ukuran,
    db.warna = k.warna,
    db.bahan = k.bahan,
    db.harga = k.harga,
    db.stok = k.stok
WHERE p.status = 'aktif';

DROP TEMPORARY TABLE katalog_paoman;
