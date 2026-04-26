<?php

require_once __DIR__ . '/../models/UlasanModel.php';

/**
 * Controller untuk mengelola ulasan produk.
 * Stateless approach: Accept akun_id/admin_id dari request body
 */
class UlasanController {

    /**
     * Mengirim response JSON.
     */
    private function respond(bool $success, mixed $data, string $msg, int $code = 200): void {
        http_response_code($code);
        echo json_encode(['success' => $success, 'message' => $msg, 'data' => $data]);
        exit;
    }

    /**
     * Mendapatkan data dari body request.
     */
    private function body(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    /**
     * Validasi pelanggan dari body (stateless).
     */
    private function validatePelanggan(): int {
        $body = $this->body();
        $akunId = (int) ($body['akun_id'] ?? 0);
        
        if ($akunId <= 0) {
            $this->respond(false, null, 'akun_id wajib diisi', 422);
        }
        
        return $akunId;
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
     * Menambahkan ulasan baru.
     */
    public function store(): void {
        verifyCsrf();
        
        $body = $this->body();
        $akunId = (int) ($body['akun_id'] ?? 0);
        
        if ($akunId <= 0) {
            $this->respond(false, null, 'akun_id wajib diisi', 422);
        }
        
        $model = new UlasanModel();

        foreach (['produk_id', 'pesanan_id', 'rating'] as $f) {
            if (empty($body[$f])) $this->respond(false, null, "Field '$f' wajib diisi", 422);
        }
        if ($body['rating'] < 1 || $body['rating'] > 5)
            $this->respond(false, null, 'Rating harus antara 1–5', 422);

        // Verify purchase menggunakan akunId (= pelanggan_id)
        if (!$model->verifikasiPembelian((int)$body['pesanan_id'], $akunId, (int)$body['produk_id']))
            $this->respond(false, null, 'Pesanan belum selesai atau produk tidak ada di pesanan ini', 403);

        try {
            $model->create([
                'produk_id'    => (int)$body['produk_id'],
                'pelanggan_id' => $akunId,  // Use akunId instead of session
                'pesanan_id'   => (int)$body['pesanan_id'],
                'rating'       => (int)$body['rating'],
                'komentar'     => $body['komentar'] ?? null,
            ]);
            $this->respond(true, null, 'Ulasan berhasil ditambahkan', 201);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000')
                $this->respond(false, null, 'Kamu sudah memberi ulasan untuk produk ini', 409);
            $this->respond(false, null, 'Gagal menyimpan ulasan', 500);
        }
    }

    /**
     * Mendapatkan ulasan berdasarkan produk (public endpoint).
     */
    public function byProduk(string $produkId): void {
        $model = new UlasanModel();
        $this->respond(true, $model->getByProduk((int)$produkId), '', 200);
    }

    /**
     * Mengupdate status ulasan (admin only).
     */
    public function moderate(string $id): void {
        verifyCsrf();
        
        $adminId = $this->validateAdmin();
        $body    = $this->body();
        $status  = $body['status'] ?? '';

        if (!in_array($status, ['aktif', 'disembunyikan']))
            $this->respond(false, null, 'Status tidak valid', 422);

        $model = new UlasanModel();
        $model->updateStatus((int)$id, $status);
        $this->respond(true, null, 'Status ulasan diupdate');
    }
}