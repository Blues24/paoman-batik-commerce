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

    private function saveUploadedImage(array $fields = ['gambar_produk', 'image_file']): ?string {
        foreach ($fields as $field) {
            if (empty($_FILES[$field]) || !is_uploaded_file($_FILES[$field]['tmp_name'])) {
                continue;
            }

            if ($_FILES[$field]['error'] !== UPLOAD_ERR_OK) {
                $this->respond(false, null, 'Upload gambar gagal. Kode error: ' . $_FILES[$field]['error'], 400);
            }

            $ext = strtolower(pathinfo($_FILES[$field]['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'webp'];
            if (!in_array($ext, $allowed, true)) {
                $this->respond(false, null, 'Format gambar harus JPG, PNG, atau WEBP', 422);
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

            $safeBase = preg_replace('/[^a-zA-Z0-9_.-]/', '_', pathinfo($_FILES[$field]['name'], PATHINFO_FILENAME));
            $filename = 'produk_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 8) . '_' . $safeBase . '.' . $ext;
            $target = $uploadDir . DIRECTORY_SEPARATOR . $filename;

            if (!move_uploaded_file($_FILES[$field]['tmp_name'], $target)) {
                $this->respond(false, null, 'Gagal memindahkan file gambar ke folder upload', 500);
            }

            return 'uploads/' . $filename;
        }

        return null;
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
     * Mendapatkan 5 produk terbaru untuk dashboard admin.
     */
    public function latest(): void {
        $limit = (int)($_GET['limit'] ?? 5);
        $model = new ProdukModel();
        $data = $model->getLatest($limit);
        $this->respond(true, $data, 'Produk terbaru berhasil dimuat', 200);
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
        $uploadedPath = $this->saveUploadedImage();
        if ($uploadedPath) {
            $body['gambar_produk'] = $uploadedPath;
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
        $body = $this->body();
        $uploadedPath = $this->saveUploadedImage();
        if ($uploadedPath) {
            $body['gambar_produk'] = $uploadedPath;
        }
        $model->update((int)$id, $body);
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

    /**
     * Mendapatkan semua jenis produk.
     */
    public function jenis(): void {
        $model = new ProdukModel();
        $data  = $model->getJenis();
        $this->respond(true, $data, '', 200);
    }
}
