<?php

require_once __DIR__ . '/../models/AkunModel.php';
require_once __DIR__ . '/../models/PesananModel.php';
require_once __DIR__ . '/../models/ProdukModel.php';

class AdminController {

    /**
     * Memperbaiki respond agar argumen code bersifat opsional (Default 200)
     */
    private function respond(bool $success, mixed $data, string $msg, int $code = 200): void {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode(['success' => $success, 'message' => $msg, 'data' => $data]);
        exit;
    }

    private function body(): array {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?? $_POST ?? [];
    }

    /**
     * LOGIKA BARU: createProduk dengan penanganan file yang lebih aman
     */
    public function createProduk(): void {
        // 1. Ambil data teks dari $_POST
        $namaProduk = $_POST['nama_produk'] ?? '';
        $harga      = $_POST['harga'] ?? 0;
        $stok       = $_POST['stok'] ?? 0;
        $jenisId    = $_POST['jenis_id'] ?? 1; // Pastikan kirim jenis_id dari frontend
        $deskripsi  = $_POST['deskripsi'] ?? '';

        $fileGambar = $_FILES['gambar_produk'] ?? null;

        // Path absolut sesuai lingkungan LAMPP kamu
        $baseDir = "/opt/lampp/htdocs/paoman-batik/backend/public/uploads/produk/";

        // 2. Validasi Folder & Izin Akses (Gunakan @ untuk membungkam warning jika ijin ditolak)
        if (!is_dir($baseDir)) {
            if (!@mkdir($baseDir, 0775, true) && !is_dir($baseDir)) {
                $this->respond(false, null, 'Server gagal menyediakan folder upload. Cek izin akses /opt/lampp.', 500);
            }
        }

        // 3. Validasi Input File
        if (!$fileGambar || $fileGambar['error'] !== UPLOAD_ERR_OK) {
            $this->respond(false, null, 'File gambar tidak valid atau gagal diunggah.', 400);
        }

        // 4. Olah Nama File (Hanya simpan nama file di DB, bukan full path sistem)
        $ext = pathinfo($fileGambar['name'], PATHINFO_EXTENSION);
        $newFilename = 'produk_' . time() . '.' . $ext;
        $targetPath = $baseDir . $newFilename;

        // 5. Eksekusi: Pindah File Dulu, Baru Simpan ke DB
        if (move_uploaded_file($fileGambar['tmp_name'], $targetPath)) {
            $model = new ProdukModel();
            try {
                // Gunakan fungsi insertProduk yang sudah kita buat di ProdukModel
                $produkId = $model->insertProduk($namaProduk, $newFilename, $jenisId, $deskripsi);

                // Tambahkan varian otomatis (harga & stok)
                $model->insertVarian($produkId, (float)$harga, (int)$stok);

                $this->respond(true, ['produk_id' => $produkId], 'Produk dan gambar berhasil disimpan');
            } catch (Exception $e) {
                // Jika DB gagal, hapus file yang sudah terlanjur diupload agar tidak jadi sampah
                if (file_exists($targetPath)) {
                    unlink($targetPath);
                }
                $this->respond(false, null, 'Gagal menyimpan ke database: ' . $e->getMessage(), 500);
            }
        } else {
            $this->respond(false, null, 'Gagal memindahkan file ke direktori tujuan. Pastikan folder uploads dimiliki user daemon.', 500);
        }
    }

    /**
     * Ambil daftar pelanggan dengan paginasi
     */
    public function getPelanggan(): void {
        $model = new AkunModel();
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = 10;
        $offset = ($page - 1) * $limit;

        try {
            $data = $model->getAllPelanggan($limit, $offset);
            $total = $model->countPelanggan();

            $this->respond(true, [
                'users' => $data,
                'total' => $total,
                'currentPage' => $page,
                'totalPages' => ceil($total / $limit)
            ], 'Berhasil mengambil data pelanggan');
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
        $status = strtolower($body['status'] ?? ''); 

        if ($akunId <= 0) {
            $this->respond(false, null, 'ID Akun tidak ditemukan', 422);
        }

        $model = new AkunModel();
        try {
            $success = $model->updatePelangganByAdmin($akunId, $email, $status);
            if ($success) {
                $this->respond(true, null, 'Berhasil memperbarui data');
            } else {
                $this->respond(false, null, 'Gagal update database', 400);
            }
        } catch (Exception $e) {
            $this->respond(false, null, $e->getMessage(), 500);
        }
    }

    /**
     * Mengambil statistik ringkas untuk dashboard
     */
    public function getStats(): void {
        $akunModel = new AkunModel();
        $pesananModel = new PesananModel();
        try {
            $sales = $pesananModel->getSalesReport(null, null);
            $totalTerbeli = 0;
            foreach ($sales as $row) {
                $totalTerbeli += (int)($row['total_terjual'] ?? 0);
            }

            $stats = [
                'total_produk' => $akunModel->countProduk(),
                'total_pesanan' => $akunModel->countPesanan(),
                'total_pelanggan' => $akunModel->countPelanggan(),
                'total_terbeli' => $totalTerbeli
            ];

            $this->respond(true, $stats, 'Statistik berhasil dimuat');
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
            $result = $model->deleteAkun($akunId);
            if ($result) {
                $this->respond(true, null, 'Akun berhasil dihapus permanen');
            } else {
                $this->respond(false, null, 'Gagal menghapus akun atau akun tidak ditemukan', 404);
            }
        } catch (Exception $e) {
            $this->respond(false, null, 'Terjadi kesalahan pada server', 500);
        }
    }
}