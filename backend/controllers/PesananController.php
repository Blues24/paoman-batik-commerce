<?php

require_once __DIR__ . '/../models/PesananModel.php';

/**
 * Controller untuk mengelola pesanan.
 */
class PesananController {

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
     * Membuat pesanan baru.
     */
    public function store(): void {
        verifyCsrf();
        $pelangganId = $this->requirePelanggan();
        $body        = json_decode(file_get_contents('php://input'), true) ?? [];
        $model       = new PesananModel();

        if (empty($body['items']) || !is_array($body['items']))
            $this->respond(false, null, 'Items pesanan tidak boleh kosong', 422);

        $model->beginTransaction();
        try {
            $totalHarga = 0;
            $resolved   = [];

            foreach ($body['items'] as $item) {
                if (empty($item['detail_batik_id']) || empty($item['jumlah']))
                    throw new Exception('Setiap item harus punya detail_batik_id dan jumlah');

                $varian = $model->findVarianById((int)$item['detail_batik_id']);
                if (!$varian)
                    throw new Exception("Varian ID {$item['detail_batik_id']} tidak ditemukan");
                if ($varian['stok'] < (int)$item['jumlah'])
                    throw new Exception("Stok varian ID {$item['detail_batik_id']} tidak cukup");

                $totalHarga += $varian['harga'] * (int)$item['jumlah'];
                $resolved[]  = [
                    'detail_batik_id'  => $varian['detail_batik_id'],
                    'jumlah'           => (int)$item['jumlah'],
                    'harga_saat_pesan' => $varian['harga'],
                ];
            }

            $pesananId = $model->create($pelangganId, $totalHarga);
            foreach ($resolved as $r) {
                $model->addItem($pesananId, $r);
                $model->kurangiStok($r['detail_batik_id'], $r['jumlah']);
            }

            $model->commit();
            $this->respond(true, ['pesanan_id' => $pesananId, 'total_harga' => $totalHarga], 'Pesanan berhasil dibuat', 201);
        } catch (Exception $e) {
            $model->rollBack();
            $this->respond(false, null, 'Gagal membuat pesanan: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Mendapatkan pesanan milik pelanggan yang login.
     */
    public function myOrders(): void {
        $pelangganId = $this->requirePelanggan();
        $model       = new PesananModel();
        $this->respond(true, $model->getByPelanggan($pelangganId), '', 200);
    }

    /**
     * Mendapatkan detail pesanan berdasarkan ID.
     */
    public function show(string $id): void {
        $pelangganId = $this->requirePelanggan();
        $model       = new PesananModel();
        $pesanan     = $model->findById((int)$id, $pelangganId);
        if (!$pesanan) $this->respond(false, null, 'Pesanan tidak ditemukan', 404);

        $pesanan['items'] = $model->getItems((int)$id);
        $this->respond(true, $pesanan, '', 200);
    }

    public function updateStatus(string $id): void {
        $this->requireAdmin();
        $body        = json_decode(file_get_contents('php://input'), true) ?? [];
        $validStatus = ['pending','dibayar','diproses','dikirim','selesai','dibatalkan'];

        if (!in_array($body['status_pesanan'] ?? '', $validStatus))
            $this->respond(false, null, 'Status tidak valid', 422);

        $model = new PesananModel();
        $model->updateStatus((int)$id, $body['status_pesanan']);
        $this->respond(true, null, 'Status pesanan diupdate');
    }

    public function adminIndex(): void {
        $this->requireAdmin();
        $model = new PesananModel();
        $this->respond(true, $model->getAll($_GET['status'] ?? null), '', 200);
    }
}