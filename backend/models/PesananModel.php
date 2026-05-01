<?php

require_once __DIR__ . '/../config/database.php';

/**
 * Model untuk menangani data pesanan.
 */
class PesananModel {
    private PDO $db;
    private array $columnCache = [];

    public function __construct() {
        $this->db = Database::connect();
    }

    /**
     * Mencari varian berdasarkan ID.
     */
    public function findVarianById(int $id): array|false {
        $stmt = $this->db->prepare(
            'SELECT db.detail_batik_id, db.harga, db.stok, pr.nama_produk
             FROM detail_batik db
             JOIN produk pr ON pr.produk_id = db.produk_id
             WHERE db.detail_batik_id = ?'
        );
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
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

    private function paymentStatusFor(string $metode): string {
        return $metode === 'cod' ? 'bayar_di_tempat' : 'menunggu_konfirmasi';
    }

    /**
     * Membuat pesanan baru.
     */
    public function create(int $pelangganId, float $totalHarga, string $metodePembayaran = 'qris', ?string $catatan = null): int {
        $metodePembayaran = in_array($metodePembayaran, ['qris', 'ewallet', 'cod'], true) ? $metodePembayaran : 'qris';
        $columns = ['pelanggan_id', 'total_harga'];
        $placeholders = ['?', '?'];
        $values = [$pelangganId, $totalHarga];

        if ($this->columnExists('pesanan', 'metode_pembayaran')) {
            $columns[] = 'metode_pembayaran';
            $placeholders[] = '?';
            $values[] = $metodePembayaran;
        }

        if ($this->columnExists('pesanan', 'payment_status')) {
            $columns[] = 'payment_status';
            $placeholders[] = '?';
            $values[] = $this->paymentStatusFor($metodePembayaran);
        }

        if ($this->columnExists('pesanan', 'catatan')) {
            $columns[] = 'catatan';
            $placeholders[] = '?';
            $values[] = $catatan;
        }

        $stmt = $this->db->prepare(
            'INSERT INTO pesanan (' . implode(', ', $columns) . ')
             VALUES (' . implode(', ', $placeholders) . ')'
        );
        $stmt->execute($values);
        return (int) $this->db->lastInsertId();
    }

    /**
     * Menambahkan item ke pesanan.
     */
    public function addItem(int $pesananId, array $item): void {
        $columns = ['pesanan_id', 'detail_batik_id', 'jumlah', 'harga_saat_pesan'];
        $placeholders = ['?', '?', '?', '?'];
        $values = [$pesananId, $item['detail_batik_id'], $item['jumlah'], $item['harga_saat_pesan']];

        if ($this->columnExists('detail_pesanan', 'opsi_pesanan')) {
            $columns[] = 'opsi_pesanan';
            $placeholders[] = '?';
            $values[] = !empty($item['opsi_pesanan']) ? json_encode($item['opsi_pesanan'], JSON_UNESCAPED_UNICODE) : null;
        }

        if ($this->columnExists('detail_pesanan', 'catatan')) {
            $columns[] = 'catatan';
            $placeholders[] = '?';
            $values[] = $item['catatan'] ?? null;
        }

        $stmt = $this->db->prepare(
            'INSERT INTO detail_pesanan (' . implode(', ', $columns) . ')
             VALUES (' . implode(', ', $placeholders) . ')'
        );
        $stmt->execute($values);
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
        $paymentColumns = '';
        if ($this->columnExists('pesanan', 'metode_pembayaran')) {
            $paymentColumns .= ', p.metode_pembayaran';
        }
        if ($this->columnExists('pesanan', 'payment_status')) {
            $paymentColumns .= ', p.payment_status';
        }
        if ($this->columnExists('pesanan', 'catatan')) {
            $paymentColumns .= ', p.catatan';
        }
        $productImageColumn = $this->columnExists('produk', 'gambar_produk') ? ', MIN(pr.gambar_produk) AS gambar_produk' : '';

        $stmt = $this->db->prepare(
            'SELECT p.pesanan_id, p.tanggal_pesanan, p.status_pesanan, p.total_harga' . $paymentColumns . ',
                    SUM(dp.jumlah) AS total_jumlah,
                    MIN(pr.nama_produk) AS nama_produk,
                    MIN(CASE WHEN LOWER(pr.nama_produk) LIKE "%kain%" THEN "Kain Batik" ELSE "Pakaian" END) AS kategori
                    ' . $productImageColumn . '
             FROM pesanan p
             LEFT JOIN detail_pesanan dp ON dp.pesanan_id = p.pesanan_id
             LEFT JOIN detail_batik db ON db.detail_batik_id = dp.detail_batik_id
             LEFT JOIN produk pr ON pr.produk_id = db.produk_id
             WHERE p.pelanggan_id = ?
             GROUP BY p.pesanan_id, p.tanggal_pesanan, p.status_pesanan, p.total_harga' . $paymentColumns . '
             ORDER BY p.tanggal_pesanan DESC'
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
        $optionalColumns = '';
        if ($this->columnExists('detail_pesanan', 'opsi_pesanan')) {
            $optionalColumns .= ', dp.opsi_pesanan';
        }
        if ($this->columnExists('detail_pesanan', 'catatan')) {
            $optionalColumns .= ', dp.catatan';
        }

        $stmt = $this->db->prepare(
            'SELECT dp.detail_id, dp.jumlah, dp.harga_saat_pesan, dp.subtotal,
                    db.ukuran, db.warna, db.bahan, pr.produk_id, pr.nama_produk,
                    CASE WHEN LOWER(pr.nama_produk) LIKE "%kain%" THEN "Kain Batik" ELSE "Pakaian" END AS kategori
                    ' . $optionalColumns . '
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
        $paymentColumns = '';
        if ($this->columnExists('pesanan', 'metode_pembayaran')) {
            $paymentColumns .= ', p.metode_pembayaran';
        }
        if ($this->columnExists('pesanan', 'payment_status')) {
            $paymentColumns .= ', p.payment_status';
        }
        $productImageColumn = $this->columnExists('produk', 'gambar_produk') ? ', MIN(pr.gambar_produk) AS gambar_produk' : '';

        $sql    = 'SELECT p.pesanan_id, p.tanggal_pesanan, p.status_pesanan,
                          p.total_harga, pl.nama AS nama_pelanggan' . $paymentColumns . ',
                          SUM(dp.jumlah) AS total_jumlah,
                          MIN(pr.nama_produk) AS nama_produk,
                          MIN(CASE WHEN LOWER(pr.nama_produk) LIKE "%kain%" THEN "Kain Batik" ELSE "Pakaian" END) AS kategori
                          ' . $productImageColumn . '
                   FROM pesanan p
                   JOIN pelanggan pl ON pl.pelanggan_id = p.pelanggan_id
                   LEFT JOIN detail_pesanan dp ON dp.pesanan_id = p.pesanan_id
                   LEFT JOIN detail_batik db ON db.detail_batik_id = dp.detail_batik_id
                   LEFT JOIN produk pr ON pr.produk_id = db.produk_id';
        $params = [];
        if ($status) {
            $sql     .= ' WHERE p.status_pesanan = ?';
            $params[] = $status;
        }
        $sql .= ' GROUP BY p.pesanan_id, p.tanggal_pesanan, p.status_pesanan, p.total_harga, pl.nama' . $paymentColumns;
        $sql .= ' ORDER BY p.tanggal_pesanan DESC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Menghasilkan laporan penjualan (admin).
     * Mengembalikan ringkasan jumlah terjual dan pendapatan per produk.
     * Opsional filter tanggal: $from, $to (YYYY-MM-DD). Jika kosong, ambil semua.
     */
    public function getSalesReport(?string $from = null, ?string $to = null): array {
        $params = [];
        $where = 'WHERE p.status_pesanan NOT IN ("dibatalkan")';

        if ($from) {
            $where .= ' AND DATE(p.tanggal_pesanan) >= ?';
            $params[] = $from;
        }
        if ($to) {
            $where .= ' AND DATE(p.tanggal_pesanan) <= ?';
            $params[] = $to;
        }

    $sql = 'SELECT pr.produk_id, pr.nama_produk,
               SUM(dp.jumlah) AS total_terjual,
               SUM(dp.jumlah * dp.harga_saat_pesan) AS total_pendapatan,
               MIN(p.tanggal_pesanan) AS first_terjual,
               MAX(p.tanggal_pesanan) AS last_terjual
        FROM detail_pesanan dp
        JOIN pesanan p ON p.pesanan_id = dp.pesanan_id
        JOIN detail_batik db ON db.detail_batik_id = dp.detail_batik_id
        JOIN produk pr ON pr.produk_id = db.produk_id
        ' . $where . '
        GROUP BY pr.produk_id, pr.nama_produk
        ORDER BY total_terjual DESC';

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
