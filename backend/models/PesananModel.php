<?php

require_once __DIR__ . '/../config/database.php';

/**
 * Model untuk menangani data pesanan.
 */
class PesananModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::connect();
    }

    /**
     * Mencari varian berdasarkan ID.
     */
    public function findVarianById(int $id): array|false {
        $stmt = $this->db->prepare(
            'SELECT detail_batik_id, harga, stok FROM detail_batik WHERE detail_batik_id = ?'
        );
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Membuat pesanan baru.
     */
    public function create(int $pelangganId, float $totalHarga): int {
        $stmt = $this->db->prepare(
            'INSERT INTO pesanan (pelanggan_id, total_harga) VALUES (?, ?)'
        );
        $stmt->execute([$pelangganId, $totalHarga]);
        return (int) $this->db->lastInsertId();
    }

    /**
     * Menambahkan item ke pesanan.
     */
    public function addItem(int $pesananId, array $item): void {
        $stmt = $this->db->prepare(
            'INSERT INTO detail_pesanan (pesanan_id, detail_batik_id, jumlah, harga_saat_pesan)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$pesananId, $item['detail_batik_id'], $item['jumlah'], $item['harga_saat_pesan']]);
    }

    /**
     * Mengurangi stok varian.
     */
    public function kurangiStok(int $varianId, int $jumlah): void {
        $stmt = $this->db->prepare(
            'UPDATE detail_batik SET stok = stok - ? WHERE detail_batik_id = ?'
        );
        $stmt->execute([$jumlah, $varianId]);
    }

    /**
     * Mendapatkan pesanan berdasarkan pelanggan.
     */
    public function getByPelanggan(int $pelangganId): array {
        $stmt = $this->db->prepare(
            'SELECT pesanan_id, tanggal_pesanan, status_pesanan, total_harga
             FROM pesanan WHERE pelanggan_id = ? ORDER BY tanggal_pesanan DESC'
        );
        $stmt->execute([$pelangganId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Mencari pesanan berdasarkan ID dan pelanggan.
     */
    public function findById(int $pesananId, int $pelangganId): array|false {
        $stmt = $this->db->prepare(
            'SELECT * FROM pesanan WHERE pesanan_id = ? AND pelanggan_id = ?'
        );
        $stmt->execute([$pesananId, $pelangganId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Mendapatkan item-item dalam pesanan.
     */
    public function getItems(int $pesananId): array {
        $stmt = $this->db->prepare(
            'SELECT dp.detail_id, dp.jumlah, dp.harga_saat_pesan, dp.subtotal,
                    db.ukuran, db.warna, db.bahan, pr.nama_produk
             FROM detail_pesanan dp
             JOIN detail_batik db ON db.detail_batik_id = dp.detail_batik_id
             JOIN produk pr ON pr.produk_id = db.produk_id
             WHERE dp.pesanan_id = ?'
        );
        $stmt->execute([$pesananId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Ambil item minimal untuk pengembalian stok saat pembatalan.
     */
    public function getItemStocks(int $pesananId): array {
        $stmt = $this->db->prepare(
            'SELECT detail_batik_id, jumlah
             FROM detail_pesanan
             WHERE pesanan_id = ?'
        );
        $stmt->execute([$pesananId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Tambah stok varian (digunakan saat cancel).
     */
    public function tambahStok(int $varianId, int $jumlah): void {
        $stmt = $this->db->prepare(
            'UPDATE detail_batik SET stok = stok + ? WHERE detail_batik_id = ?'
        );
        $stmt->execute([$jumlah, $varianId]);
    }

    /**
     * Batalkan pesanan milik pelanggan (pending saja) + rollback stok.
     */
    public function cancelByPelanggan(int $pesananId, int $pelangganId): bool|string {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                'SELECT status_pesanan FROM pesanan WHERE pesanan_id = ? AND pelanggan_id = ? FOR UPDATE'
            );
            $stmt->execute([$pesananId, $pelangganId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                $this->db->rollBack();
                return 'Pesanan tidak ditemukan';
            }

            $status = $row['status_pesanan'] ?? '';
            if ($status !== 'pending') {
                $this->db->rollBack();
                return 'Pesanan tidak bisa dibatalkan (status sudah berubah)';
            }

            $items = $this->getItemStocks($pesananId);
            foreach ($items as $it) {
                $detailId = (int)($it['detail_batik_id'] ?? 0);
                $qty = (int)($it['jumlah'] ?? 0);
                if ($detailId > 0 && $qty > 0) {
                    $this->tambahStok($detailId, $qty);
                }
            }

            $stmt = $this->db->prepare('UPDATE pesanan SET status_pesanan = ? WHERE pesanan_id = ?');
            $stmt->execute(['dibatalkan', $pesananId]);

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            return 'Gagal membatalkan pesanan';
        }
    }

    /**
     * Mengupdate status pesanan.
     */
    public function updateStatus(int $pesananId, string $status): void {
        $stmt = $this->db->prepare('UPDATE pesanan SET status_pesanan=? WHERE pesanan_id=?');
        $stmt->execute([$status, $pesananId]);
    }

    /**
     * Mendapatkan semua pesanan (admin).
     */
    public function getAll(?string $status = null): array {
        $sql    = 'SELECT p.pesanan_id, p.tanggal_pesanan, p.status_pesanan,
                          p.total_harga, pl.nama AS nama_pelanggan
                   FROM pesanan p
                   JOIN pelanggan pl ON pl.pelanggan_id = p.pelanggan_id';
        $params = [];
        if ($status) {
            $sql     .= ' WHERE p.status_pesanan = ?';
            $params[] = $status;
        }
        $sql .= ' ORDER BY p.tanggal_pesanan DESC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Memulai transaksi database.
     */
    public function beginTransaction(): void { $this->db->beginTransaction(); }

    /**
     * Commit transaksi.
     */
    public function commit(): void           { $this->db->commit(); }

    /**
     * Rollback transaksi.
     */
    public function rollBack(): void         { $this->db->rollBack(); }
}