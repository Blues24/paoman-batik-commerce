<?php

require_once __DIR__ . '/../models/ProdukModel.php';

class ProdukController {

    private function respond(bool $success, mixed $data, string $msg, int $code = 200): void {
        http_response_code($code);
        echo json_encode(['success' => $success, 'message' => $msg, 'data' => $data]);
        exit;
    }

    private function requireAdmin(): void {
        if (empty($_SESSION['admin_id']))
            $this->respond(false, null, 'Unauthorized: bukan admin', 401);
    }

    private function body(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    public function index(): void {
        $model = new ProdukModel();
        $data  = $model->getAll($_GET);
        $this->respond(true, $data, '', 200);
    }

    public function show(string $id): void {
        $model  = new ProdukModel();
        $produk = $model->findById((int)$id);
        if (!$produk) $this->respond(false, null, 'Produk tidak ditemukan', 404);

        $produk['varian']         = $model->getVarian((int)$id);
        $produk['ulasan_summary'] = $model->getRatingSummary((int)$id);
        $this->respond(true, $produk, '', 200);
    }

    public function store(): void {
        verifyCsrf();
        $this->requireAdmin();
        $body  = $this->body();
        $model = new ProdukModel();

        foreach (['jenis_id', 'nama_produk'] as $f) {
            if (empty($body[$f])) $this->respond(false, null, "Field '$f' wajib diisi", 422);
        }

        $id = $model->create($body);
        $this->respond(true, ['produk_id' => $id], 'Produk berhasil ditambahkan', 201);
    }

    public function update(string $id): void {
        verifyCsrf();
        $this->requireAdmin();
        $model = new ProdukModel();
        $model->update((int)$id, $this->body());
        $this->respond(true, null, 'Produk berhasil diupdate');
    }

    public function destroy(string $id): void {
        verifyCsrf();
        $this->requireAdmin();
        $model = new ProdukModel();
        $model->softDelete((int)$id);
        $this->respond(true, null, 'Produk dinonaktifkan');
    }

    public function storeVarian(string $produkId): void {
        verifyCsrf();
        $this->requireAdmin();
        $body  = $this->body();
        $model = new ProdukModel();

        foreach (['ukuran', 'warna', 'bahan', 'harga', 'stok'] as $f) {
            if (!isset($body[$f])) $this->respond(false, null, "Field '$f' wajib diisi", 422);
        }

        $id = $model->createVarian((int)$produkId, $body);
        $this->respond(true, ['detail_batik_id' => $id], 'Varian berhasil ditambahkan', 201);
    }

    public function updateVarian(string $varianId): void {
        verifyCsrf();
        $this->requireAdmin();
        $model = new ProdukModel();
        $model->updateVarian((int)$varianId, $this->body());
        $this->respond(true, null, 'Varian berhasil diupdate');
    }
}