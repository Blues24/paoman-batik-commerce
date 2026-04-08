<?php

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../backend/models/AkunModel.php';

class AuthTest extends TestCase {

    private PDO $db;

    protected function setUp(): void {
        $this->db = Database::connect();
        // bersihkan table sebelum tiap test
        $this->db->exec('DELETE FROM ulasan');
        $this->db->exec('DELETE FROM detail_pesanan');
        $this->db->exec('DELETE FROM pesanan');
        $this->db->exec('DELETE FROM pelanggan');
        $this->db->exec('DELETE FROM akun');
    }

    public function test_register_berhasil(): void {
        $model = new AkunModel();
        $akunId = $model->createWithPelanggan([
            'username' => 'testuser',
            'password' => 'rahasia123',
            'nama'     => 'Test User',
            'email'    => 'test@mail.com',
        ]);

        $this->assertIsInt($akunId);
        $this->assertGreaterThan(0, $akunId);
    }

    public function test_username_exists(): void {
        $model = new AkunModel();
        $model->createWithPelanggan([
            'username' => 'duplikat',
            'password' => 'rahasia123',
            'nama'     => 'User A',
            'email'    => 'usera@mail.com',
        ]);

        $this->assertTrue($model->usernameExists('duplikat'));
        $this->assertFalse($model->usernameExists('tidakada'));
    }

    public function test_email_exists(): void {
        $model = new AkunModel();
        $model->createWithPelanggan([
            'username' => 'userb',
            'password' => 'rahasia123',
            'nama'     => 'User B',
            'email'    => 'sama@mail.com',
        ]);

        $this->assertTrue($model->emailExists('sama@mail.com'));
        $this->assertFalse($model->emailExists('beda@mail.com'));
    }

    public function test_password_di_hash(): void {
        $model = new AkunModel();
        $model->createWithPelanggan([
            'username' => 'hashtest',
            'password' => 'rahasia123',
            'nama'     => 'Hash Test',
            'email'    => 'hash@mail.com',
        ]);

        $user = $model->findByIdentifier('hashtest');
        // password tidak boleh tersimpan plain text
        $this->assertNotEquals('rahasia123', $user['password_hash']);
        // tapi harus bisa diverifikasi
        $this->assertTrue(password_verify('rahasia123', $user['password_hash']));
    }

    public function test_login_user_tidak_ada(): void {
        $model = new AkunModel();
        $user  = $model->findByIdentifier('tidakada');
        $this->assertFalse($user);
    }

    public function test_login_via_email(): void {
    $model = new AkunModel();
    $model->createWithPelanggan([
        'username' => 'emailtest',
        'password' => 'rahasia123',
        'nama'     => 'Email Test',
        'email'    => 'emailtest@mail.com',
    ]);

    // login pakai email
    $user = $model->findByIdentifier('emailtest@mail.com');
    $this->assertNotFalse($user);
    $this->assertEquals('emailtest', $user['nama'] === 'Email Test' ? 'emailtest' : '');

    // login pakai username
    $user2 = $model->findByIdentifier('emailtest');
    $this->assertNotFalse($user2);
}
}
