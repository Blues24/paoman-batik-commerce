<?php

require_once __DIR__ . '/../models/PesananModel.php';
require_once __DIR__ . '/../models/AkunModel.php';

/**
 * Controller untuk mengelola pesanan.
 * Stateless approach: Accept akun_id/admin_id dari request body
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
     * Mendapatkan data dari body request.
     */
    private function body(): array {
        $raw = file_get_contents('php://input');
        if ($raw !== false && trim($raw) !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        if (!empty($_POST) && is_array($_POST)) {
            return $_POST;
        }

        return [];
    }

    /**
     * Resolve pelanggan_id dari akun_id.
     */
    private function pelangganIdFromAkunId(int $akunId): int {
        $akunModel = new AkunModel();
        return $akunModel->getPelangganIdByAkunId($akunId);
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

    private function validMetodePembayaran(string $metode): string {
        return in_array($metode, ['qris', 'ewallet', 'cod'], true) ? $metode : 'qris';
    }

    private function savePaymentFile(): string {
        $file = $_FILES['bukti_pembayaran'] ?? $_FILES['payment_proof'] ?? null;
        if (!$file || !is_uploaded_file($file['tmp_name'])) {
            $this->respond(false, null, 'File bukti pembayaran wajib diunggah', 422);
        }

        if ($file['error'] !== UPLOAD_ERR_OK) {
            $this->respond(false, null, 'Upload bukti pembayaran gagal. Kode error: ' . $file['error'], 400);
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'pdf'], true)) {
            $this->respond(false, null, 'Bukti pembayaran harus JPG, PNG, WEBP, atau PDF', 422);
        }

        $uploadDir = realpath(__DIR__ . '/../../frontend/img/uploads');
        if ($uploadDir === false) {
            $targetRoot = __DIR__ . '/../../frontend/img/uploads';
            if (!is_dir($targetRoot)) {
                @mkdir($targetRoot, 0777, true);
            }
            $uploadDir = realpath($targetRoot);
        }

        if ($uploadDir === false || !is_dir($uploadDir)) {
            $this->respond(false, null, 'Folder upload tidak ditemukan', 500);
        }

        $filename = 'bukti_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 8) . '.' . $ext;
        $target = $uploadDir . DIRECTORY_SEPARATOR . $filename;
        if (!move_uploaded_file($file['tmp_name'], $target)) {
            $this->respond(false, null, 'Gagal menyimpan bukti pembayaran', 500);
        }

        return 'uploads/' . $filename;
    }

    private function minimumJumlahUntukItem(array $item, array $varian): int {
        $namaProduk = strtolower((string)($varian['nama_produk'] ?? ''));
        $kategori = strtolower((string)($item['kategori'] ?? ''));
        $isPakaian = str_contains($namaProduk, 'baju')
            || str_contains($namaProduk, 'kemeja')
            || str_contains($namaProduk, 'blus')
            || str_contains($namaProduk, 'outer')
            || str_contains($namaProduk, 'tunik')
            || str_contains($namaProduk, 'dress')
            || $kategori === 'pakaian';

        if (!$isPakaian) {
            return 1;
        }

        $opsi = is_array($item['opsi_pesanan'] ?? null) ? $item['opsi_pesanan'] : [];
        $ukuran = strtolower((string)($opsi['ukuran'] ?? ''));
        return str_contains($ukuran, 'anak') ? 20 : 5;
    }

    /**
     * Membuat pesanan baru.
     */
    public function store(): void {
        verifyCsrf();
        
        $body = $this->body();
        $akunId = (int) ($body['akun_id'] ?? 0);
        
        if ($akunId <= 0) {
            $this->respond(false, null, 'akun_id wajib diisi', 422);
        }

        $pelangganId = $this->pelangganIdFromAkunId($akunId);
        if ($pelangganId <= 0) {
            $this->respond(false, null, 'Akun belum terhubung ke data pelanggan', 422);
        }
        
        $model = new PesananModel();

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
                $jumlah = (int)$item['jumlah'];
                $minimumJumlah = $this->minimumJumlahUntukItem($item, $varian);
                if ($jumlah < $minimumJumlah)
                    throw new Exception("Jumlah minimal untuk item ini adalah {$minimumJumlah}");
                if ($varian['stok'] < $jumlah)
                    throw new Exception("Stok varian ID {$item['detail_batik_id']} tidak cukup");

                $totalHarga += $varian['harga'] * $jumlah;
                $resolved[]  = [
                    'detail_batik_id'  => $varian['detail_batik_id'],
                    'jumlah'           => $jumlah,
                    'harga_saat_pesan' => $varian['harga'],
                    'opsi_pesanan'     => is_array($item['opsi_pesanan'] ?? null) ? $item['opsi_pesanan'] : null,
                    'catatan'          => trim((string)($item['catatan'] ?? '')) ?: null,
                ];
            }

            $metodePembayaran = $this->validMetodePembayaran((string)($body['metode_pembayaran'] ?? 'qris'));
            $paymentDetail = trim((string)($body['payment_detail'] ?? ''));
            $catatanOrder = trim((string)($body['catatan'] ?? ''));
            $catatan = trim($catatanOrder . ($paymentDetail ? "\nRincian pembayaran: " . $paymentDetail : '')) ?: null;
            $pesananId = $model->create($pelangganId, $totalHarga, $metodePembayaran, $catatan, $paymentDetail ?: null);
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
     * Mendapatkan pesanan milik pelanggan.
     */
    public function myOrders(): void {
        // Untuk GET request, body biasanya kosong.
        // Support akun_id via query string supaya frontend bisa memanggil endpoint ini.
        $body = $this->body();
        $akunId = (int) ($body['akun_id'] ?? ($_GET['akun_id'] ?? 0));
        
        if ($akunId <= 0) {
            $this->respond(false, null, 'akun_id wajib diisi', 422);
        }
        
        $pelangganId = $this->pelangganIdFromAkunId($akunId);
        if ($pelangganId <= 0) {
            $this->respond(true, [], '', 200);
        }

        $model = new PesananModel();
        $this->respond(true, $model->getByPelanggan($pelangganId), '', 200);
    }

    /**
     * Mendapatkan detail pesanan berdasarkan ID.
     */
    public function show(string $id): void {
        // Untuk GET request, body biasanya kosong.
        // Support akun_id via query string supaya frontend bisa memanggil endpoint ini.
        $body = $this->body();
        $akunId = (int) ($body['akun_id'] ?? ($_GET['akun_id'] ?? 0));
        
        if ($akunId <= 0) {
            $this->respond(false, null, 'akun_id wajib diisi', 422);
        }
        
        $pelangganId = $this->pelangganIdFromAkunId($akunId);
        if ($pelangganId <= 0) {
            $this->respond(false, null, 'Pesanan tidak ditemukan', 404);
        }

        $model   = new PesananModel();
        $pesanan = $model->findById((int)$id, $pelangganId);
        if (!$pesanan) $this->respond(false, null, 'Pesanan tidak ditemukan', 404);

        $pesanan['items'] = $model->getItems((int)$id);
        $this->respond(true, $pesanan, '', 200);
    }

    /**
     * Batalkan pesanan (user).
     * POST /api/pesanan/:id/cancel
     * Body: { akun_id }
     */
    public function cancel(string $id): void {
        verifyCsrf();

        $body = $this->body();
        $akunId = (int) ($body['akun_id'] ?? ($_GET['akun_id'] ?? 0));
        if ($akunId <= 0) {
            $this->respond(false, null, 'akun_id wajib diisi', 422);
        }

        $pelangganId = $this->pelangganIdFromAkunId($akunId);
        if ($pelangganId <= 0) {
            $this->respond(false, null, 'Akun belum terhubung ke data pelanggan', 422);
        }

        $model = new PesananModel();
        $result = $model->cancelByPelanggan((int)$id, $pelangganId);
        if ($result === true) {
            $this->respond(true, null, 'Pesanan berhasil dibatalkan', 200);
        }

        $this->respond(false, null, is_string($result) ? $result : 'Gagal membatalkan pesanan', 400);
    }

    /**
     * Update status pesanan (admin only).
     */
    public function updateStatus(string $id): void {
        verifyCsrf();
        
        $body = $this->body();
        $adminId = (int) ($body['admin_id'] ?? 0);
        
        if ($adminId <= 0) {
            $this->respond(false, null, 'admin_id wajib diisi (admin only)', 422);
        }
        
        $validStatus = ['pending','dibayar','diproses','dikirim','selesai','dibatalkan'];

        if (!in_array($body['status_pesanan'] ?? '', $validStatus))
            $this->respond(false, null, 'Status tidak valid', 422);

        $model = new PesananModel();
        $model->updateStatus((int)$id, $body['status_pesanan']);
        if (!empty($body['payment_status']) && in_array($body['payment_status'], ['belum_dibayar','menunggu_konfirmasi','dibayar','bayar_di_tempat'], true)) {
            $model->updatePaymentStatus((int)$id, $body['payment_status']);
        }
        $this->respond(true, null, 'Status pesanan diupdate');
    }

    public function uploadPaymentProof(string $id): void {
        verifyCsrf();

        $body = $this->body();
        $akunId = (int) ($body['akun_id'] ?? ($_POST['akun_id'] ?? 0));
        if ($akunId <= 0) {
            $this->respond(false, null, 'akun_id wajib diisi', 422);
        }

        $pelangganId = $this->pelangganIdFromAkunId($akunId);
        if ($pelangganId <= 0) {
            $this->respond(false, null, 'Akun belum terhubung ke data pelanggan', 422);
        }

        $proofPath = $this->savePaymentFile();
        $paymentDetail = trim((string)($_POST['payment_detail'] ?? $body['payment_detail'] ?? '')) ?: null;

        $model = new PesananModel();
        if (!$model->savePaymentProof((int)$id, $pelangganId, $proofPath, $paymentDetail)) {
            $this->respond(false, null, 'Pesanan tidak ditemukan atau bukti gagal disimpan', 404);
        }

        $this->respond(true, ['bukti_pembayaran' => $proofPath], 'Bukti pembayaran berhasil diunggah');
    }

    /**
     * Get all orders (admin only).
     */
    public function adminIndex(): void {
        $body = $this->body();
        $adminId = (int) ($body['admin_id'] ?? ($_GET['admin_id'] ?? 0));
        
        if ($adminId <= 0) {
            $this->respond(false, null, 'admin_id wajib diisi (admin only)', 422);
        }
        
        $model = new PesananModel();
        $this->respond(true, $model->getAll($_GET['status'] ?? null), '', 200);
    }

    public function adminShow(string $id): void {
        $body = $this->body();
        $adminId = (int) ($body['admin_id'] ?? ($_GET['admin_id'] ?? 0));

        if ($adminId <= 0) {
            $this->respond(false, null, 'admin_id wajib diisi (admin only)', 422);
        }

        $model = new PesananModel();
        $pesanan = $model->findByIdForAdmin((int)$id);
        if (!$pesanan) {
            $this->respond(false, null, 'Pesanan tidak ditemukan', 404);
        }

        $pesanan['items'] = $model->getItems((int)$id);
        $this->respond(true, $pesanan, '', 200);
    }
}
