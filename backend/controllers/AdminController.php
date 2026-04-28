<?php

require_once __DIR__ . '/../models/AkunModel.php';

class AdminController {

    private function respond(bool $success, mixed $data, string $msg, int $code): void {
        http_response_code($code);
        echo json_encode(['success' => $success, 'message' => $msg, 'data' => $data]);
        exit;
    }

    private function body(): array {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?? $_POST ?? [];
    }

    /**
     * Ambil daftar pelanggan dengan paginasi
     */
    public function getPelanggan(): void {
        // Logika verifikasi role admin harus ada di sini (via middleware/token)
        
        $model = new AkunModel();
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = 10; // Sesuai dengan rencana paginasi di frontend
        $offset = ($page - 1) * $limit;

        try {
            $data = $model->getAllPelanggan($limit, $offset);
            $total = $model->countPelanggan();

            $this->respond(true, [
                'users' => $data,
                'total' => $total,
                'currentPage' => $page,
                'totalPages' => ceil($total / $limit)
            ], 'Berhasil mengambil data pelanggan', 200);
        } catch (Exception $e) {
            $this->respond(false, null, 'Gagal mengambil data', 500);
        }
    }

    /**
     * Memperbarui data profil pelanggan (Email & Status)
     */
    public function updatePelanggan(): void {
        $body = $this->body();
        $akunId = (int)($body['akun_id'] ?? 0);
        $email = $body['email'] ?? '';
        $status = $body['status'] ?? ''; // 'Aktif' atau 'Nonaktif'
    
        if ($akunId <= 0 || empty($email)) {
            $this->respond(false, null, 'Data tidak lengkap', 422);
        }
    
        $model = new AkunModel();
        try {
            // Konversi status ke format database ('aktif'/'nonaktif')
            $dbStatus = (strtolower($status) === 'aktif') ? 'aktif' : 'nonaktif';
            
            $result = $model->updatePelangganByAdmin($akunId, $email, $dbStatus);
    
            if ($result) {
                $this->respond(true, null, 'Data pelanggan berhasil diperbarui', 200);
            } else {
                $this->respond(false, null, 'Gagal memperbarui data', 400);
            }
        } catch (Exception $e) {
            $this->respond(false, null, 'Terjadi kesalahan server', 500);
        }
    }

    /**
     * Mengambil statistik ringkas untuk dashboard
     */
    public function getStats(): void {
        $model = new AkunModel();
        try {
            $stats = [
                'total_produk' => $model->countProduk(),
                'total_pesanan' => $model->countPesanan(),
                'total_pelanggan' => $model->countPelanggan()
            ];
            $this->respond(true, $stats, 'Statistik berhasil dimuat', 200);
        } catch (Exception $e) {
            $this->respond(false, null, 'Gagal memuat statistik', 500);
        }
    }

    /**
     * Hapus Akun Pelanggan (Permanen)
     */
    public function deletePelanggan(): void {
        $body = $this->body();
        $akunId = (int)($body['akun_id'] ?? 0);

        if ($akunId <= 0) {
            $this->respond(false, null, 'ID akun tidak valid', 422);
        }

        $model = new AkunModel();
        
        try {
            // Pastikan admin tidak menghapus akunnya sendiri
            // Logika ini penting untuk keamanan sistem
            $result = $model->deleteAkun($akunId);

            if ($result) {
                $this->respond(true, null, 'Akun berhasil dihapus permanen', 200);
            } else {
                $this->respond(false, null, 'Gagal menghapus akun atau akun tidak ditemukan', 404);
            }
        } catch (Exception $e) {
            $this->respond(false, null, 'Terjadi kesalahan pada server', 500);
        }
    }
}