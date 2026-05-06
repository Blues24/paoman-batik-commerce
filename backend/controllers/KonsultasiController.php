<?php
require_once __DIR__ . '/../models/KonsultasiModel.php';

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
        try {
            $model = new KonsultasiModel();
            $rows = $model->getAll();
            $this->respond(true, $rows, 'Daftar konsultasi', 200);
        } catch (Exception $e) {
            $this->respond(false, null, 'Gagal mengambil data konsultasi', 500);
        }
    }
}
