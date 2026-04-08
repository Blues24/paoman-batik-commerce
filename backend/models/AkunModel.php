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
        'SELECT a.akun_id, a.password_hash, a.status_akun,
                p.pelanggan_id, p.nama
         FROM akun a
         JOIN pelanggan p ON p.akun_id = a.akun_id
         WHERE a.username = ? OR p.email = ?'
    );
        $stmt->execute([$identifier, $identifier ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
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
}