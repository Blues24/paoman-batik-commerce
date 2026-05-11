<?php
require_once __DIR__ . '/../config/database.php';

class KonsultasiModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::connect();
    }

    /**
     * Simpan data konsultasi ke tabel konsultasi
     * Mengembalikan id yang baru dibuat
     */
    public function create(array $data): int {
        $sql = 'INSERT INTO konsultasi (nama_lengkap, no_whatsapp, jenis_kebutuhan, estimasi_jumlah, target_waktu, referensi_produk, deskripsi_kebutuhan)
                VALUES (?, ?, ?, ?, ?, ?, ?)';

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $data['nama_lengkap'] ?? null,
            $data['no_whatsapp'] ?? null,
            $data['jenis_kebutuhan'] ?? null,
            $data['estimasi_jumlah'] ?? null,
            $data['target_waktu'] ?? null,
            $data['referensi_produk'] ?? null,
            $data['deskripsi_kebutuhan'] ?? null,
        ]);

        return (int)$this->db->lastInsertId();
    }

    /**
     * Ambil semua konsultasi (untuk admin)
     */
    public function getAll(): array {
        $stmt = $this->db->query('SELECT * FROM konsultasi ORDER BY tgl_pengajuan DESC');
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateStatus(int $id, string $status): bool {
        $stmt = $this->db->prepare('UPDATE konsultasi SET status_konsultasi = ? WHERE id_konsultasi = ?');
        return $stmt->execute([$status, $id]);
    }
}
