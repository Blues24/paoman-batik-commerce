<?php

require_once __DIR__ . '/../config/database.php';

/**
 * Model untuk menyimpan keranjang user (cart_item).
 */
class CartModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::connect();
    }

    /**
     * Ambil isi keranjang untuk pelanggan.
     * Return shape dibuat mirip data keranjang frontend.
     */
    public function getByPelanggan(int $pelangganId): array {
        $stmt = $this->db->prepare(
            'SELECT
                ci.detail_batik_id AS id,
                ci.detail_batik_id,
                pr.produk_id,
                pr.nama_produk AS nama,
                db.harga,
                ci.qty
             FROM cart_item ci
             JOIN detail_batik db ON db.detail_batik_id = ci.detail_batik_id
             JOIN produk pr ON pr.produk_id = db.produk_id
             WHERE ci.pelanggan_id = ?
             ORDER BY ci.updated_at DESC'
        );
        $stmt->execute([$pelangganId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Upsert item keranjang. qty=0 akan menghapus.
     */
    public function upsertItem(int $pelangganId, int $detailBatikId, int $qty): void {
        if ($qty <= 0) {
            $stmt = $this->db->prepare('DELETE FROM cart_item WHERE pelanggan_id=? AND detail_batik_id=?');
            $stmt->execute([$pelangganId, $detailBatikId]);
            return;
        }

        $stmt = $this->db->prepare(
            'INSERT INTO cart_item (pelanggan_id, detail_batik_id, qty)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE qty = VALUES(qty)'
        );
        $stmt->execute([$pelangganId, $detailBatikId, $qty]);
    }

    /**
     * Replace seluruh keranjang dengan items (id, qty).
     */
    public function replaceAll(int $pelangganId, array $items): void {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare('DELETE FROM cart_item WHERE pelanggan_id=?');
            $stmt->execute([$pelangganId]);

            foreach ($items as $item) {
                $detailId = (int)($item['detail_batik_id'] ?? $item['id'] ?? 0);
                $qty = (int)($item['qty'] ?? 0);
                if ($detailId <= 0 || $qty <= 0) continue;

                $stmt = $this->db->prepare(
                    'INSERT INTO cart_item (pelanggan_id, detail_batik_id, qty) VALUES (?, ?, ?)'
                );
                $stmt->execute([$pelangganId, $detailId, $qty]);
            }

            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}

?>

