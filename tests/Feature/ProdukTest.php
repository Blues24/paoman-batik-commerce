<?php

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../backend/models/ProdukModel.php';

class ProdukTest extends TestCase {

    private PDO $db;

    protected function setUp(): void {
        $this->db = Database::connect();
        $this->db->exec('DELETE FROM detail_batik');
        $this->db->exec('DELETE FROM produk');
        $this->db->exec('DELETE FROM jenis_produk');

        // seed jenis produk
        $this->db->exec("INSERT INTO jenis_produk (jenis_id, nama_jenis) VALUES (1, 'Batik Tulis')");
    }

    public function test_create_produk(): void {
        $model    = new ProdukModel();
        $produkId = $model->create([
            'jenis_id'    => 1,
            'nama_produk' => 'Batik Mega Mendung',
            'deskripsi'   => 'Motif khas Cirebon',
            'status'      => 'aktif',
        ]);

        $this->assertGreaterThan(0, $produkId);
    }

    public function test_find_produk_by_id(): void {
        $model    = new ProdukModel();
        $produkId = $model->create([
            'jenis_id'    => 1,
            'nama_produk' => 'Batik Parang',
            'status'      => 'aktif',
        ]);

        $produk = $model->findById($produkId);
        $this->assertEquals('Batik Parang', $produk['nama_produk']);
    }

    public function test_soft_delete_produk(): void {
        $model    = new ProdukModel();
        $produkId = $model->create([
            'jenis_id'    => 1,
            'nama_produk' => 'Batik Kawung',
            'status'      => 'aktif',
        ]);

        $model->softDelete($produkId);
        $produk = $model->findById($produkId); // hanya return status aktif
        $this->assertFalse($produk);
    }

    public function test_create_dan_get_varian(): void {
        $model    = new ProdukModel();
        $produkId = $model->create([
            'jenis_id'    => 1,
            'nama_produk' => 'Batik Sido Mukti',
            'status'      => 'aktif',
        ]);

        $model->createVarian($produkId, [
            'ukuran' => 'M',
            'warna'  => 'Biru',
            'bahan'  => 'Katun',
            'harga'  => 150000,
            'stok'   => 10,
        ]);

        $varian = $model->getVarian($produkId);
        $this->assertCount(1, $varian);
        $this->assertEquals('M', $varian[0]['ukuran']);
        $this->assertEquals(10, $varian[0]['stok']);
    }
}
