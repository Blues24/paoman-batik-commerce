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
        // 1. Ambil data input dengan aman
        $namaProduk = $_POST['nama_produk'] ?? '';
        $harga      = $_POST['harga'] ?? 0;
        $stok       = $_POST['stok'] ?? 0;
        $jenisId    = $_POST['jenis_id'] ?? 1;
        $deskripsi  = $_POST['deskripsi'] ?? '';
        $adminId    = $_POST['admin_id'] ?? null;
    
        // 2. Cek apakah ada file yang diunggah
        $fileGambar = $_FILES['gambar_produk'] ?? null;
    
        if (!$fileGambar || $fileGambar['error'] !== UPLOAD_ERR_OK) {
            $this->respond(false, null, 'Gambar wajib diunggah atau terjadi error saat upload.', 400);
            return;
        }
    
        // 3. DEFINISI PATH (Kunci Utama)
        // baseDir: Alamat fisik di Linux untuk move_uploaded_file
        $baseDir = "/opt/lampp/htdocs/paoman-batik/frontend/img/uploads/";
    
        // Pastikan folder tujuan ada
        if (!is_dir($baseDir)) {
            mkdir($baseDir, 0775, true);
        }
    
        // 4. Olah Nama File
        $ext = pathinfo($fileGambar['name'], PATHINFO_EXTENSION);
        $newFilename = 'produk_' . time() . '.' . $ext;
    
        // Target Path: Alamat lengkap file di sistem (Internal)
        $targetPath = $baseDir . $newFilename; 
    
        // DB Path: String yang akan disimpan di database (External/Web)
        // Kita simpan "uploads/nama_file.jpg" agar konsisten dengan logika pembelian.js
        $dbPath = "uploads/" . $newFilename; 
    
        // 5. Eksekusi Pemindahan File
        if (move_uploaded_file($fileGambar['tmp_name'], $targetPath)) {
            $model = new ProdukModel();
            
            try {
                // Simpan ke Tabel Produk (Pastikan kolom gambar_produk menerima $dbPath)
                $produkId = $model->insertProduk($namaProduk, $dbPath, $jenisId, $deskripsi);
                
                // Simpan ke Tabel Varian (untuk Harga dan Stok)
                $model->insertVarian($produkId, (float)$harga, (int)$stok);
    
                $this->respond(true, ['produk_id' => $produkId], 'Produk dan gambar berhasil disimpan di frontend.');
            } catch (Exception $e) {
                // Jika DB gagal, hapus file fisik yang terlanjur pindah agar tidak jadi sampah[cite: 5]
                if (file_exists($targetPath)) unlink($targetPath);
                $this->respond(false, null, 'Gagal menyimpan ke database: ' . $e->getMessage(), 500);
            }
        } else {
            // Jika gagal di sini, biasanya masalah Permission atau Path salah[cite: 5]
            $this->respond(false, null, 'Gagal memindahkan file ke folder frontend. Cek izin folder!', 500);
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
     * Mengembalikan laporan penjualan per produk.
     * Query menerima optional query params: from, to (ISO date/datetime)
     */
    public function laporanPenjualan(): void {
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;

        $model = new PesananModel();
        try {
            $rows = $model->getSalesReport($from, $to);
            $this->respond(true, $rows, 'Laporan penjualan berhasil', 200);
        } catch (Exception $e) {
            $this->respond(false, null, 'Gagal mengambil laporan penjualan', 500);
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