<?php

require_once __DIR__ . '/../models/ProdukModel.php';

/**
 * Controller untuk mengelola produk dan varian.
 * Stateless approach: Accept admin_id dari request body untuk operasi admin
 */
class ProdukController {

    /**
     * Mengirim response JSON.
     */
    private function respond(bool $success, mixed $data, string $msg, int $code = 200): void {
        http_response_code($code);
        echo json_encode(['success' => $success, 'message' => $msg, 'data' => $data]);
        exit;
    }

    /**
     * Validasi admin dari body (stateless).
     */
    private function validateAdmin(): int {
        $body = $this->body();
        $adminId = (int) ($body['admin_id'] ?? 0);
        
        if ($adminId <= 0) {
            $this->respond(false, null, 'admin_id wajib diisi (admin only)', 422);
        }
        
        return $adminId;
    }

    /**
     * Mendapatkan data dari body request.
     */
    private function body(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    /**
     * Mendapatkan semua produk (public endpoint).
     */
    public function index(): void {
        $model = new ProdukModel();
        $data  = $model->getAll($_GET);
        $this->respond(true, $data, '', 200);
    }

    /**
     * Mendapatkan detail produk berdasarkan ID (public endpoint).
     */
    public function show(string $id): void {
        $model  = new ProdukModel();
        $produk = $model->findById((int)$id);
        if (!$produk) $this->respond(false, null, 'Produk tidak ditemukan', 404);

        $produk['varian']         = $model->getVarian((int)$id);
        $produk['ulasan_summary'] = $model->getRatingSummary((int)$id);
        $this->respond(true, $produk, '', 200);
    }

    /**
     * Menambahkan produk baru (admin only).
     */
    public function store(): void {
        verifyCsrf();
        
        $adminId = $this->validateAdmin();
        $body    = $this->body();
        $model   = new ProdukModel();

        foreach (['jenis_id', 'nama_produk'] as $f) {
            if (empty($body[$f])) $this->respond(false, null, "Field '$f' wajib diisi", 422);
        }

        $id = $model->create($body);
        $this->respond(true, ['produk_id' => $id], 'Produk berhasil ditambahkan', 201);
    }

    /**
     * Mengupdate produk (admin only).
     */
    public function update(string $id): void {
        verifyCsrf();
        
        $adminId = $this->validateAdmin();
        $model   = new ProdukModel();
        $model->update((int)$id, $this->body());
        $this->respond(true, null, 'Produk berhasil diupdate');
    }

    /**
     * Menonaktifkan produk (admin only).
     */
    public function destroy(string $id): void {
        verifyCsrf();
        
        $adminId = $this->validateAdmin();
        $model   = new ProdukModel();
        $model->softDelete((int)$id);
        $this->respond(true, null, 'Produk dinonaktifkan');
    }

    /**
     * Menambahkan varian produk (admin only).
     */
    public function storeVarian(string $produkId): void {
        verifyCsrf();
        
        $adminId = $this->validateAdmin();
        $body    = $this->body();
        $model   = new ProdukModel();

        foreach (['ukuran', 'warna', 'bahan', 'harga', 'stok'] as $f) {
            if (!isset($body[$f])) $this->respond(false, null, "Field '$f' wajib diisi", 422);
        }

        $id = $model->createVarian((int)$produkId, $body);
        $this->respond(true, ['detail_batik_id' => $id], 'Varian berhasil ditambahkan', 201);
    }

    /**
     * Mengupdate varian produk (admin only).
     */
    public function updateVarian(string $varianId): void {
        verifyCsrf();
        
        $adminId = $this->validateAdmin();
        $model   = new ProdukModel();
        $model->updateVarian((int)$varianId, $this->body());
        $this->respond(true, null, 'Varian berhasil diupdate');
    }
}