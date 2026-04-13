<?php

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../backend/models/PesananModel.php';
require_once __DIR__ . '/../../backend/models/AkunModel.php';
require_once __DIR__ . '/../../backend/models/ProdukModel.php';

class PesananTest extends TestCase {

    private PDO    $db;
    private int    $pelangganId;
    private int    $varianId;

    protected function setUp(): void {
        $this->db = Database::connect();
        $this->db->exec('DELETE FROM ulasan');
        $this->db->exec('DELETE FROM detail_pesanan');
        $this->db->exec('DELETE FROM pesanan');
        $this->db->exec('DELETE FROM detail_batik');
        $this->db->exec('DELETE FROM produk');
        $this->db->exec('DELETE FROM jenis_produk');
        $this->db->exec('DELETE FROM pelanggan');
        $this->db->exec('DELETE FROM akun');

        // setup data awal
        $akun = new AkunModel();
        $akun->createWithPelanggan([
            'username' => 'pembeli',
            'password' => 'rahasia123',
            'nama'     => 'Pembeli Test',
            'email'    => 'pembeli@mail.com',
        ]);
        $user              = $akun->findByIdentifier('pembeli');
        $this->pelangganId = $user['pelanggan_id'];

        $this->db->exec("INSERT INTO jenis_produk (jenis_id, nama_jenis) VALUES (1, 'Batik Tulis')");
        $produk  = new ProdukModel();
        $produkId = $produk->create(['jenis_id' => 1, 'nama_produk' => 'Batik Test', 'status' => 'aktif']);
        $this->varianId = $produk->createVarian($produkId, [
            'ukuran' => 'L',
            'warna'  => 'Merah',
            'bahan'  => 'Sutra',
            'harga'  => 200000,
            'stok'   => 5,
        ]);
    }

    public function test_buat_pesanan(): void {
        $model     = new PesananModel();
        $pesananId = $model->create($this->pelangganId, 200000);
        $this->assertGreaterThan(0, $pesananId);
    }

    public function test_stok_berkurang_setelah_pesan(): void {
        $model = new PesananModel();
        $model->kurangiStok($this->varianId, 2);

        $stmt = Database::connect()->prepare('SELECT stok FROM detail_batik WHERE detail_batik_id = ?');
        $stmt->execute([$this->varianId]);
        $stok = $stmt->fetchColumn();

        $this->assertEquals(3, $stok); // 5 - 2 = 3
    }

    public function test_update_status_pesanan(): void {
        $model     = new PesananModel();
        $pesananId = $model->create($this->pelangganId, 200000);
        $model->updateStatus($pesananId, 'dibayar');

        $pesanan = $model->findById($pesananId, $this->pelangganId);
        $this->assertEquals('dibayar', $pesanan['status_pesanan']);
    }
}
