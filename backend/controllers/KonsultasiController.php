<?php
require_once __DIR__ . '/../models/KonsultasiModel.php';
require_once __DIR__ . '/../models/AkunModel.php';

class KonsultasiController {
    private function respond(bool $success, mixed $data, string $msg, int $code): void {
        http_response_code($code);
        echo json_encode(['success' => $success, 'message' => $msg, 'data' => $data]);
        exit;
    }

    private function body(): array {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?? $_POST ?? [];
    }

    private function validateAdmin(): int {
        $body = $this->body();
        $adminId = (int) ($body['admin_id'] ?? ($_GET['admin_id'] ?? 0));
        if ($adminId <= 0) {
            $this->respond(false, null, 'admin_id wajib diisi (admin only)', 422);
        }

        $akunModel = new AkunModel();
        if (!$akunModel->isAdminId($adminId)) {
            $this->respond(false, null, 'admin_id tidak valid', 403);
        }

        return $adminId;
    }

    // Public endpoint untuk menyimpan konsultasi
    public function store(): void {
        $body = $this->body();
        try {
            $model = new KonsultasiModel();
            $id = $model->create($body);
            $this->respond(true, ['id' => $id], 'Konsultasi tersimpan', 201);
        } catch (Exception $e) {
            $this->respond(false, null, 'Gagal menyimpan konsultasi: ' . $e->getMessage(), 500);
        }
    }

    // Admin endpoint untuk melihat semua konsultasi
    public function adminIndex(): void {
        $this->validateAdmin();
        try {
            $model = new KonsultasiModel();
            $rows = $model->getAll();
            $this->respond(true, $rows, 'Daftar konsultasi', 200);
        } catch (Exception $e) {
            $this->respond(false, null, 'Gagal mengambil data konsultasi', 500);
        }
    }

    public function updateStatus(string $id): void {
        $this->validateAdmin();
        $body = $this->body();
        $statusInput = strtolower(trim((string)($body['status_konsultasi'] ?? '')));
        $statusMap = [
            'pending' => 'Pending',
            'diproses' => 'Diproses',
            'selesai' => 'Selesai',
        ];

        if (!isset($statusMap[$statusInput])) {
            $this->respond(false, null, 'Status konsultasi tidak valid', 422);
        }

        try {
            $model = new KonsultasiModel();
            $updated = $model->updateStatus((int)$id, $statusMap[$statusInput]);

            if (!$updated) {
                $this->respond(false, null, 'Konsultasi tidak ditemukan atau status belum berubah', 404);
            }

            $this->respond(true, ['id' => (int)$id, 'status_konsultasi' => $statusMap[$statusInput]], 'Status konsultasi berhasil diperbarui', 200);
        } catch (Exception $e) {
            $this->respond(false, null, 'Gagal memperbarui status konsultasi', 500);
        }
    }
}
