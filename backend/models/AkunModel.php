<?php

require_once __DIR__ . '/../config/database.php';

/**
 * Model untuk menangani data akun dan pelanggan.
 */
class AkunModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::connect();
    }

    /**
     * Mencari akun berdasarkan username atau email.
     */
    public function findByIdentifier(string $identifier): array|false {
        $stmt = $this->db->prepare(
        'SELECT a.akun_id, a.username, a.password_hash, a.status_akun,
                p.pelanggan_id, p.nama, p.email, p.no_hp, p.alamat
         FROM akun a
         LEFT JOIN pelanggan p ON p.akun_id = a.akun_id
         WHERE a.username = ? OR p.email = ?'
    );
        $stmt->execute([$identifier, $identifier]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Mencari pengguna berdasarkan akun id.
     */
    public function findByAkunId(int $akunId): array|false {
        $stmt = $this->db->prepare(
            'SELECT a.akun_id, a.username, a.password_hash, a.status_akun,
                    p.pelanggan_id, p.nama, p.email, p.no_hp, p.alamat
             FROM akun a
             LEFT JOIN pelanggan p ON p.akun_id = a.akun_id
             WHERE a.akun_id = ?'
        );
        $stmt->execute([$akunId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Mendapatkan pelanggan_id dari akun_id.
     * Dipakai oleh controller lain karena tabel pesanan/ulasan memakai pelanggan_id.
     */
    public function getPelangganIdByAkunId(int $akunId): int {
        $stmt = $this->db->prepare('SELECT pelanggan_id FROM pelanggan WHERE akun_id = ?');
        $stmt->execute([$akunId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)($row['pelanggan_id'] ?? 0);
    }

    /**
     * Mengecek apakah username sudah ada.
     */
    public function usernameExists(string $username): bool {
        $stmt = $this->db->prepare('SELECT akun_id FROM akun WHERE username = ?');
        $stmt->execute([$username]);
        return (bool) $stmt->fetch();
    }

    /**
     * Mengecek apakah email sudah ada.
     */
    public function emailExists(string $email): bool {
        $stmt = $this->db->prepare('SELECT pelanggan_id FROM pelanggan WHERE email = ?');
        $stmt->execute([$email]);
        return (bool) $stmt->fetch();
    }

    public function usernameExistsExcept(string $username, int $exceptAkunId): bool {
        $stmt = $this->db->prepare('SELECT akun_id FROM akun WHERE username = ? AND akun_id != ?');
        $stmt->execute([$username, $exceptAkunId]);
        return (bool) $stmt->fetch();
    }

    public function emailExistsExcept(string $email, int $exceptAkunId): bool {
        $stmt = $this->db->prepare(
            'SELECT p.pelanggan_id
             FROM pelanggan p
             JOIN akun a ON a.akun_id = p.akun_id
             WHERE p.email = ? AND a.akun_id != ?'
        );
        $stmt->execute([$email, $exceptAkunId]);
        return (bool) $stmt->fetch();
    }

    /**
     * Membuat akun baru dengan data pelanggan.
     * @param array<int,mixed> $data
     */
    public function createWithPelanggan(array $data): int {
        $db = $this->db;
        $db->beginTransaction();
        try {
            $hash = password_hash($data['password'], PASSWORD_BCRYPT);
            $stmt = $db->prepare('INSERT INTO akun (username, password_hash) VALUES (?, ?)');
            $stmt->execute([$data['username'], $hash]);
            $akunId = (int) $db->lastInsertId();

            $stmt = $db->prepare(
                'INSERT INTO pelanggan (akun_id, nama, email, no_hp, alamat)
                 VALUES (?, ?, ?, ?, ?)'
            );
            $stmt->execute([$akunId, $data['nama'], $data['email'], $data['no_hp'] ?? null, $data['alamat'] ?? null]);

            $db->commit();
            return $akunId;
        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    public function updateProfile(int $akunId, array $data): array {
        $db = $this->db;
        $db->beginTransaction();
        try {
            $stmt = $db->prepare('UPDATE akun SET username = ? WHERE akun_id = ?');
            $stmt->execute([$data['username'], $akunId]);

            $stmt = $db->prepare(
                'UPDATE pelanggan SET nama = ?, email = ?, no_hp = ?, alamat = ?
                 WHERE akun_id = ?'
            );
            $stmt->execute([
                $data['nama'],
                $data['email'],
                $data['no_hp'] ?? null,
                $data['alamat'] ?? null,
                $akunId
            ]);

            $db->commit();

            $user = $this->findByAkunId($akunId);
            if (!$user) {
                throw new Exception('Profil tidak ditemukan setelah update');
            }
            return $user;
        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    public function changePassword(int $akunId, string $currentPassword, string $newPassword): bool|string {
        $user = $this->findByAkunId($akunId);

        if (!$user) {
            return 'Akun tidak ditemukan';
        }

        if (!password_verify($currentPassword, $user['password_hash'])) {
            return 'Password lama tidak sesuai';
        }

        $hash = password_hash($newPassword, PASSWORD_BCRYPT);
        $stmt = $this->db->prepare('UPDATE akun SET password_hash = ? WHERE akun_id = ?');
        $stmt->execute([$hash, $akunId]);

        return true;
    }
    
    /**
     * Mengambil semua data pelanggan (user) untuk dikelola admin.
     */
    public function getAllPelanggan(int $limit, int $offset): array {
        $stmt = $this->db->prepare(
            'SELECT a.akun_id, a.username, p.email, a.status_akun as status 
             FROM akun a 
             INNER JOIN pelanggan p ON a.akun_id = p.akun_id 
             LIMIT ? OFFSET ?'
        );
        // Menggunakan INNER JOIN ke pelanggan memastikan hanya 'user' yang tertarik, 
        // karena admin tidak memiliki data di tabel pelanggan.
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->bindValue(2, $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Menghitung total pelanggan untuk paginasi.
     */
    public function countPelanggan(): int {
        $stmt = $this->db->query('SELECT COUNT(*) FROM pelanggan');
        return (int) $stmt->fetchColumn();
    }

    /**
     * Menghapus akun pelanggan.
     */
    public function deleteAkun(int $akunId): bool {
        // Pastikan ID ini memang milik pelanggan sebelum dihapus
        $stmt = $this->db->prepare(
            'DELETE a FROM akun a 
             INNER JOIN pelanggan p ON a.akun_id = p.akun_id 
             WHERE a.akun_id = ?'
        );
        return $stmt->execute([$akunId]);
    }

    /**
     * Mencari admin berdasarkan username.
     */
    public function findAdminByUsername(string $username): array|false {
        $stmt = $this->db->prepare(
            'SELECT admin_id, password, role FROM admin WHERE username = ?'
        );
        $stmt->execute([$username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updatePelangganByAdmin(int $akunId, string $email, string $status): bool {
    $this->db->beginTransaction();
    try {
        // 1. Update Status di tabel Akun
        $stmt1 = $this->db->prepare('UPDATE akun SET status_akun = ? WHERE akun_id = ?');
        $stmt1->execute([$status, $akunId]);

        // 2. Update Email di tabel Pelanggan
        $stmt2 = $this->db->prepare('UPDATE pelanggan SET email = ? WHERE akun_id = ?');
        $stmt2->execute([$email, $akunId]);

        $this->db->commit();
        return true;
    } catch (Exception $e) {
        $this->db->rollBack();
        return false;
    }
}

    // Fungsi pembantu untuk statistik
    public function countProduk(): int {
        return (int) $this->db->query('SELECT COUNT(*) FROM produk')->fetchColumn();
    }
    
    public function countPesanan(): int {
        return (int) $this->db->query('SELECT COUNT(*) FROM pesanan')->fetchColumn();
    }
}