<?php

require_once __DIR__ . '/../config/database.php';

class ProdukModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::connect();
    }

    public function getAll(array $filters = []): array {
        $where  = ['p.status = "aktif"'];
        $params = [];

        if (!empty($filters['jenis_id'])) {
            $where[]  = 'p.jenis_id = ?';
            $params[] = (int) $filters['jenis_id'];
        }
        if (!empty($filters['search'])) {
            $where[]  = 'p.nama_produk LIKE ?';
            $params[] = '%' . $filters['search'] . '%';
        }

        $sql  = 'SELECT p.produk_id, p.nama_produk, p.deskripsi, j.nama_jenis,
                        MIN(db.harga) AS harga_mulai
                 FROM produk p
                 JOIN jenis_produk j ON j.jenis_id = p.jenis_id
                 LEFT JOIN detail_batik db ON db.produk_id = p.produk_id
                 WHERE ' . implode(' AND ', $where) . '
                 GROUP BY p.produk_id ORDER BY p.created_at DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $id): array|false {
        $stmt = $this->db->prepare(
            'SELECT p.*, j.nama_jenis FROM produk p
             JOIN jenis_produk j ON j.jenis_id = p.jenis_id
             WHERE p.produk_id = ? AND p.status = "aktif"'
        );
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getVarian(int $produkId): array {
        $stmt = $this->db->prepare(
            'SELECT * FROM detail_batik WHERE produk_id = ? ORDER BY ukuran, warna'
        );
        $stmt->execute([$produkId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getRatingSummary(int $produkId): array|false {
        $stmt = $this->db->prepare(
            'SELECT ROUND(AVG(rating),1) AS avg_rating, COUNT(*) AS total_ulasan
             FROM ulasan WHERE produk_id = ? AND status = "aktif"'
        );
        $stmt->execute([$produkId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare(
            'INSERT INTO produk (jenis_id, nama_produk, deskripsi, status) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$data['jenis_id'], $data['nama_produk'], $data['deskripsi'] ?? null, $data['status'] ?? 'aktif']);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): void {
        $stmt = $this->db->prepare(
            'UPDATE produk SET jenis_id=?, nama_produk=?, deskripsi=?, status=? WHERE produk_id=?'
        );
        $stmt->execute([$data['jenis_id'], $data['nama_produk'], $data['deskripsi'] ?? null, $data['status'] ?? 'aktif', $id]);
    }

    public function softDelete(int $id): void {
        $stmt = $this->db->prepare('UPDATE produk SET status="nonaktif" WHERE produk_id=?');
        $stmt->execute([$id]);
    }

    public function createVarian(int $produkId, array $data): int {
        $stmt = $this->db->prepare(
            'INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$produkId, $data['ukuran'], $data['warna'], $data['bahan'], (float)$data['harga'], (int)$data['stok']]);
        return (int) $this->db->lastInsertId();
    }

    public function updateVarian(int $varianId, array $data): void {
        $stmt = $this->db->prepare(
            'UPDATE detail_batik SET ukuran=?, warna=?, bahan=?, harga=?, stok=?
             WHERE detail_batik_id=?'
        );
        $stmt->execute([$data['ukuran'], $data['warna'], $data['bahan'], (float)$data['harga'], (int)$data['stok'], $varianId]);
    }
}