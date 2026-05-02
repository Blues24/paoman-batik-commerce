<?php

require_once __DIR__ . '/../models/ProdukModel.php';

/**
 * Controller untuk mengelola produk dan varian.
 * Stateless approach: Accept admin_id dari request body untuk operasi admin
 */
class ProdukController {

    // Cache parsed request body to avoid re-reading php://input (stream can be consumed once)
    private ?array $cachedBody = null;

    /**
     * Mengirim response JSON.
     */
    private function respond(bool $success, mixed $data, string $msg, int $code = 200): void {
        http_response_code($code);
        echo json_encode(['success' => $success, 'message' => $msg, 'data' => $data]);
        exit;
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
     * Mendapatkan data dari body request.
     */
    private function body(): array {
        // Return cached if already parsed (php://input is a one-time stream)
        if (is_array($this->cachedBody)) {
            return $this->cachedBody;
        }

        // Support both JSON body and multipart/form-data (from file upload form)
        $raw = file_get_contents('php://input');
        $json = json_decode($raw, true);
        $data = is_array($json) ? $json : [];

        // Merge with $_POST if present (multipart/form-data)
        if (!empty($_POST) && is_array($_POST)) {
            $data = array_merge($data, $_POST);
        }

        // Cache parsed body for subsequent calls
        $this->cachedBody = $data;
        return $data;
    }

    /**
     * Mendapatkan semua produk (public endpoint).
     */
    public function index(): void {
        $model = new ProdukModel();
        $data  = $model->getAll($_GET);
        $this->respond(true, $data, '', 200);
    }

    /**
     * Mendapatkan detail produk berdasarkan ID (public endpoint).
     */
    public function show(string $id): void {
        $model  = new ProdukModel();
        $produk = $model->findById((int)$id);
        if (!$produk) $this->respond(false, null, 'Produk tidak ditemukan', 404);

        $produk['varian']         = $model->getVarian((int)$id);
        $produk['ulasan_summary'] = $model->getRatingSummary((int)$id);
        $this->respond(true, $produk, '', 200);
    }

    /**
     * Menambahkan produk baru (admin only).
     */
    public function store(): void {
        verifyCsrf();
        
        $adminId = $this->validateAdmin();
        $body    = $this->body();
        // If an uploaded file exists in $_FILES['image_file'], move it to frontend img/uploads
        if (!empty($_FILES['image_file']) && is_uploaded_file($_FILES['image_file']['tmp_name'])) {
            $uploadDir = __DIR__ . '/../../frontend/img/uploads';
            if (!is_dir($uploadDir)) @mkdir($uploadDir, 0777, true);
            $fname = time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '_', $_FILES['image_file']['name']);
            $dest = $uploadDir . DIRECTORY_SEPARATOR . $fname;
            $moved = false;
            $moveErr = '';
            try {
                $moved = move_uploaded_file($_FILES['image_file']['tmp_name'], $dest);
                if ($moved) {
                    // store relative web path used by frontend
                    $body['gambar_produk'] = '../../img/uploads/' . $fname;
                } else {
                    $moveErr = 'move_uploaded_file returned false';
                }
            } catch (Exception $e) {
                $moveErr = $e->getMessage();
            }

            // Debug log to help diagnose upload/display issues
            $log = sprintf("[%s] ProdukController::store upload: name=%s tmp=%s dest=%s moved=%s err=%s\n",
                date('Y-m-d H:i:s'),
                $_FILES['image_file']['name'] ?? '',
                $_FILES['image_file']['tmp_name'] ?? '',
                $dest,
                $moved ? '1' : '0',
                $moveErr
            );
            @file_put_contents(__DIR__ . '/../logs/api.log', $log, FILE_APPEND);
        }
        $model   = new ProdukModel();

        foreach (['jenis_id', 'nama_produk'] as $f) {
            if (empty($body[$f])) $this->respond(false, null, "Field '$f' wajib diisi", 422);
        }

        $id = $model->create($body);
        // include final gambar_produk in response to help frontend debug and immediately use the path
        $respData = ['produk_id' => $id, 'gambar_produk' => $body['gambar_produk'] ?? null];
        $this->respond(true, $respData, 'Produk berhasil ditambahkan', 201);
    }

    /**
     * Mengupdate produk (admin only).
     */
    public function update(string $id): void {
        verifyCsrf();
        
        $adminId = $this->validateAdmin();
        $model   = new ProdukModel();
        $model->update((int)$id, $this->body());
        $this->respond(true, null, 'Produk berhasil diupdate');
    }

    /**
     * Menonaktifkan produk (admin only).
     */
    public function destroy(string $id): void {
        verifyCsrf();
        
        $adminId = $this->validateAdmin();
        $model   = new ProdukModel();
        $model->softDelete((int)$id);
        $this->respond(true, null, 'Produk dinonaktifkan');
    }

    /**
     * Menambahkan varian produk (admin only).
     */
    public function storeVarian(string $produkId): void {
        verifyCsrf();
        
        $adminId = $this->validateAdmin();
        $body    = $this->body();
        $model   = new ProdukModel();

        foreach (['ukuran', 'warna', 'bahan', 'harga', 'stok'] as $f) {
            if (!isset($body[$f])) $this->respond(false, null, "Field '$f' wajib diisi", 422);
        }

        $id = $model->createVarian((int)$produkId, $body);
        $this->respond(true, ['detail_batik_id' => $id], 'Varian berhasil ditambahkan', 201);
    }

    /**
     * Mengupdate varian produk (admin only).
     */
    public function updateVarian(string $varianId): void {
        verifyCsrf();
        
        $adminId = $this->validateAdmin();
        $model   = new ProdukModel();
        $model->updateVarian((int)$varianId, $this->body());
        $this->respond(true, null, 'Varian berhasil diupdate');
    }
}