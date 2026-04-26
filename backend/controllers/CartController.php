<?php

require_once __DIR__ . '/../models/CartModel.php';
require_once __DIR__ . '/../models/AkunModel.php';

/**
 * Controller untuk keranjang user.
 * Stateless: akun_id dikirim via query/body.
 */
class CartController {
    private function respond(bool $success, mixed $data, string $msg, int $code = 200): void {
        http_response_code($code);
        echo json_encode(['success' => $success, 'message' => $msg, 'data' => $data]);
        exit;
    }

    private function body(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    private function pelangganIdFromAkunId(int $akunId): int {
        $akunModel = new AkunModel();
        return $akunModel->getPelangganIdByAkunId($akunId);
    }

    /**
     * GET /api/cart?akun_id=...
     */
    public function index(): void {
        $akunId = (int)($_GET['akun_id'] ?? 0);
        if ($akunId <= 0) {
            $this->respond(false, null, 'akun_id wajib diisi', 422);
        }

        $pelangganId = $this->pelangganIdFromAkunId($akunId);
        if ($pelangganId <= 0) {
            $this->respond(true, [], '', 200);
        }

        $model = new CartModel();
        $this->respond(true, $model->getByPelanggan($pelangganId), '', 200);
    }

    /**
     * POST /api/cart/sync
     * Body: { akun_id, items: [{detail_batik_id|id, qty}] }
     * Replace cart di server sesuai data client.
     */
    public function sync(): void {
        verifyCsrf();

        $body = $this->body();
        $akunId = (int)($body['akun_id'] ?? 0);
        if ($akunId <= 0) {
            $this->respond(false, null, 'akun_id wajib diisi', 422);
        }

        $pelangganId = $this->pelangganIdFromAkunId($akunId);
        if ($pelangganId <= 0) {
            $this->respond(false, null, 'Akun belum terhubung ke data pelanggan', 422);
        }

        $items = $body['items'] ?? null;
        if (!is_array($items)) {
            $this->respond(false, null, 'items wajib berupa array', 422);
        }

        $model = new CartModel();
        try {
            $model->replaceAll($pelangganId, $items);
            $this->respond(true, $model->getByPelanggan($pelangganId), 'Keranjang tersimpan', 200);
        } catch (Exception $e) {
            $this->respond(false, null, 'Gagal menyimpan keranjang', 500);
        }
    }
}

?>

