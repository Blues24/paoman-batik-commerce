<?php

require_once __DIR__ . '/../config/database.php';

/**
 * Model untuk menangani data produk dan varian.
 */
class ProdukModel {
    private PDO $db;
    private array $columnCache = [];

    public function __construct() {
        $this->db = Database::connect();
    }

    private function columnExists(string $table, string $column): bool {
        $key = "{$table}.{$column}";
        if (array_key_exists($key, $this->columnCache)) {
            return $this->columnCache[$key];
        }

        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
        );
        $stmt->execute([$table, $column]);
        $this->columnCache[$key] = ((int) $stmt->fetchColumn()) > 0;
        return $this->columnCache[$key];
    }

    /**
     * Mendapatkan semua produk dengan filter.
     */
    public function getAll(array $filters = []): array {
        $where  = ['p.status = "aktif"'];
        $params = [];

        if (!empty($filters['jenis_id'])) {
            $where[]  = 'p.jenis_id = ?';
            $params[] = (int) $filters['jenis_id'];
        }
        if (!empty($filters['search'])) {
            $where[]  = 'p.nama_produk LIKE ?';
            $params[] = '%' . substr(trim($filters['search']), 0, 100) . '%';
        }

        $imageSelect = $this->columnExists('produk', 'gambar_produk')
            ? ', MIN(p.gambar_produk) AS gambar_produk'
            : '';

        $orderCase = 'CASE p.nama_produk
            WHEN "Kain Batik Motif Tangga Istana" THEN 1
            WHEN "Kain Batik Motif Godong Asem" THEN 2
            WHEN "Kain Batik Motif Kembang Gunda" THEN 3
            WHEN "Kain Batik Motif Ganggeng Manuk" THEN 4
            WHEN "Kain Batik Motif Srempang Kandang" THEN 5
            WHEN "Kain Batik Motif Lasemurang" THEN 6
            WHEN "Kain Batik Motif Kembang Kapas" THEN 7
            WHEN "Kain Batik Motif Mangga Bambu" THEN 8
            WHEN "Kain Batik Motif Cuiri" THEN 9
            WHEN "Kain Batik Motif Sekar Niem" THEN 10
            WHEN "Baju Batik Motif Godong Asem" THEN 11
            WHEN "Kemeja Batik Motif Kentangan" THEN 12
            WHEN "Kemeja Batik Motif Sekar Niem" THEN 13
            WHEN "Kemeja Batik Motif Lasemurang" THEN 14
            WHEN "Baju Batik Motif Kentangan" THEN 15
            WHEN "Baju Batik Motif Sekar Niem" THEN 16
            WHEN "Baju Batik Motif Liris atau Parang" THEN 17
            ELSE 999
        END';

        $sql  = 'SELECT MIN(p.produk_id) AS produk_id,
                        p.nama_produk,
                        MIN(p.deskripsi) AS deskripsi' . $imageSelect . ',
                        MIN(j.nama_jenis) AS nama_jenis,
                        MIN(db.harga) AS harga_mulai,
                        ' . $orderCase . ' AS urutan_katalog
                 FROM produk p
                 JOIN jenis_produk j ON j.jenis_id = p.jenis_id
                 LEFT JOIN detail_batik db ON db.produk_id = p.produk_id
                 WHERE ' . implode(' AND ', $where) . '
                 GROUP BY p.nama_produk
                 ORDER BY urutan_katalog, MIN(p.produk_id)';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Mencari produk berdasarkan ID.
     */
    public function findById(int $id): array|false {
        $stmt = $this->db->prepare(
            'SELECT p.*, j.nama_jenis FROM produk p
             JOIN jenis_produk j ON j.jenis_id = p.jenis_id
             WHERE p.produk_id = ? AND p.status = "aktif"'
        );
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Mendapatkan varian produk.
     */
    public function getVarian(int $produkId): array {
        $stmt = $this->db->prepare(
            'SELECT * FROM detail_batik WHERE produk_id = ? ORDER BY ukuran, warna'
        );
        $stmt->execute([$produkId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Mendapatkan ringkasan rating produk.
     */
    public function getRatingSummary(int $produkId): array|false {
        $stmt = $this->db->prepare(
            'SELECT ROUND(AVG(rating),1) AS avg_rating, COUNT(*) AS total_ulasan
             FROM ulasan WHERE produk_id = ? AND status = "aktif"'
        );
        $stmt->execute([$produkId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Membuat produk baru.
     */
    public function create(array $data): int {
        $columns = ['jenis_id', 'nama_produk', 'deskripsi', 'status'];
        $placeholders = ['?', '?', '?', '?'];
        $values = [$data['jenis_id'], $data['nama_produk'], $data['deskripsi'] ?? null, $data['status'] ?? 'aktif'];

        if ($this->columnExists('produk', 'gambar_produk')) {
            $columns[] = 'gambar_produk';
            $placeholders[] = '?';
            $values[] = $data['gambar_produk'] ?? $data['image'] ?? null;
        }

        $stmt = $this->db->prepare(
            'INSERT INTO produk (' . implode(', ', $columns) . ')
             VALUES (' . implode(', ', $placeholders) . ')'
        );
        $stmt->execute($values);
        return (int) $this->db->lastInsertId();
    }

    /**
     * Mengupdate produk.
     */
    public function update(int $id, array $data): void {
        $sets = ['jenis_id=?', 'nama_produk=?', 'deskripsi=?', 'status=?'];
        $values = [$data['jenis_id'], $data['nama_produk'], $data['deskripsi'] ?? null, $data['status'] ?? 'aktif'];

        if ($this->columnExists('produk', 'gambar_produk')) {
            $sets[] = 'gambar_produk=?';
            $values[] = $data['gambar_produk'] ?? $data['image'] ?? null;
        }

        $values[] = $id;
        $stmt = $this->db->prepare(
            'UPDATE produk SET ' . implode(', ', $sets) . ' WHERE produk_id=?'
        );
        $stmt->execute($values);
    }

    /**
     * Menonaktifkan produk (soft delete).
     */
    public function softDelete(int $id): void {
        $stmt = $this->db->prepare('UPDATE produk SET status="nonaktif" WHERE produk_id=?');
        $stmt->execute([$id]);
    }

    /**
     * Membuat varian produk baru.
     */
    public function createVarian(int $produkId, array $data): int {
        $stmt = $this->db->prepare(
            'INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$produkId, $data['ukuran'], $data['warna'], $data['bahan'], (float)$data['harga'], (int)$data['stok']]);
        return (int) $this->db->lastInsertId();
    }

    /**
     * Mengupdate varian produk.
     */
    public function updateVarian(int $varianId, array $data): void {
        $stmt = $this->db->prepare(
            'UPDATE detail_batik SET ukuran=?, warna=?, bahan=?, harga=?, stok=?
             WHERE detail_batik_id=?'
        );
        $stmt->execute([$data['ukuran'], $data['warna'], $data['bahan'], (float)$data['harga'], (int)$data['stok'], $varianId]);
    }
}
