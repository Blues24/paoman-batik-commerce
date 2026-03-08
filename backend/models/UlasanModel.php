<?php

require_once __DIR__ . '/../config/database.php';

class UlasanModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::connect();
    }

    public function verifikasiPembelian(int $pesananId, int $pelangganId, int $produkId): bool {
        $stmt = $this->db->prepare(
            'SELECT p.pesanan_id FROM pesanan p
             JOIN detail_pesanan dp ON dp.pesanan_id = p.pesanan_id
             JOIN detail_batik db ON db.detail_batik_id = dp.detail_batik_id
             WHERE p.pesanan_id = ? AND p.pelanggan_id = ?
               AND p.status_pesanan = "selesai" AND db.produk_id = ?
             LIMIT 1'
        );
        $stmt->execute([$pesananId, $pelangganId, $produkId]);
        return (bool) $stmt->fetch();
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare(
            'INSERT INTO ulasan (produk_id, pelanggan_id, pesanan_id, rating, komentar)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$data['produk_id'], $data['pelanggan_id'], $data['pesanan_id'], $data['rating'], $data['komentar'] ?? null]);
        return (int) $this->db->lastInsertId();
    }

    public function getByProduk(int $produkId): array {
        $stmt = $this->db->prepare(
            'SELECT u.ulasan_id, u.rating, u.komentar, u.tanggal_ulasan,
                    pl.nama AS nama_pelanggan
             FROM ulasan u
             JOIN pelanggan pl ON pl.pelanggan_id = u.pelanggan_id
             WHERE u.produk_id = ? AND u.status = "aktif"
             ORDER BY u.tanggal_ulasan DESC'
        );
        $stmt->execute([$produkId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateStatus(int $ulasanId, string $status): void {
        $stmt = $this->db->prepare('UPDATE ulasan SET status=? WHERE ulasan_id=?');
        $stmt->execute([$status, $ulasanId]);
    }
}