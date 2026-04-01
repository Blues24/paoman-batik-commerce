<?php

require_once __DIR__ . '/../models/UlasanModel.php';

/**
 * Controller untuk mengelola ulasan produk.
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
     * Memastikan user adalah pelanggan yang login.
     */
    private function requirePelanggan(): int {
        if (empty($_SESSION['pelanggan_id']))
            $this->respond(false, null, 'Unauthorized: login dulu', 401);
        return (int) $_SESSION['pelanggan_id'];
    }

    /**
     * Memastikan user adalah admin.
     */
    private function requireAdmin(): void {
        if (empty($_SESSION['admin_id']))
            $this->respond(false, null, 'Unauthorized: bukan admin', 401);
    }

    /**
     * Menambahkan ulasan baru.
     */
    public function store(): void {
        verifyCsrf();
        $pelangganId = $this->requirePelanggan();
        $body        = json_decode(file_get_contents('php://input'), true) ?? [];
        $model       = new UlasanModel();

        foreach (['produk_id', 'pesanan_id', 'rating'] as $f) {
            if (empty($body[$f])) $this->respond(false, null, "Field '$f' wajib diisi", 422);
        }
        if ($body['rating'] < 1 || $body['rating'] > 5)
            $this->respond(false, null, 'Rating harus antara 1–5', 422);

        if (!$model->verifikasiPembelian((int)$body['pesanan_id'], $pelangganId, (int)$body['produk_id']))
            $this->respond(false, null, 'Pesanan belum selesai atau produk tidak ada di pesanan ini', 403);

        try {
            $model->create([
                'produk_id'    => (int)$body['produk_id'],
                'pelanggan_id' => $pelangganId,
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
     * Mendapatkan ulasan berdasarkan produk.
     */
    public function byProduk(string $produkId): void {
        $model = new UlasanModel();
        $this->respond(true, $model->getByProduk((int)$produkId), '', 200);
    }

    /**
     * Mengupdate status ulasan (admin only).
     */
    public function moderate(string $id): void {
        $this->requireAdmin();
        $body   = json_decode(file_get_contents('php://input'), true) ?? [];
        $status = $body['status'] ?? '';

        if (!in_array($status, ['aktif', 'disembunyikan']))
            $this->respond(false, null, 'Status tidak valid', 422);

        $model = new UlasanModel();
        $model->updateStatus((int)$id, $status);
        $this->respond(true, null, 'Status ulasan diupdate');
    }
}