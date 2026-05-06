<?php

ini_set('display_errors', '1');
error_reporting(E_ALL);

// ===== SIMPLE DEBUG LOGGING =====
define('DEBUG_MODE', true);  // Set FALSE untuk production

function debugLog(string $msg): void {
    if (!DEBUG_MODE) return;
    
    $timestamp = date('Y-m-d H:i:s');
    $logLine = "[$timestamp] $msg\n";
    
    // Append to file (safe, no mkdir needed)
    $logFile = __DIR__ . '/../logs/api.log';
    @file_put_contents($logFile, $logLine, FILE_APPEND);
}

// Ensure logs directory exists (one-time)
if (DEBUG_MODE && !is_dir(__DIR__ . '/../logs')) {
    @mkdir(__DIR__ . '/../logs', 0777, true);
}

debugLog("=== REQUEST: {$_SERVER['REQUEST_METHOD']} {$_SERVER['REQUEST_URI']} ===");

// ===== CORS & JSON Headers =====
header('Content-Type: application/json');

$allowedOrigins = [
    'null',
    'http://localhost',
    'http://localhost:80',
    'http://localhost:5500',
    'http://localhost:8000',
    'http://127.0.0.1',
    'http://127.0.0.1:80',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:8000',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Cache-Control: no-cache, max-age=0, must-revalidate, no-store', true);
header('Expires: 0');
header('Vary: Origin');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    debugLog("OPTIONS request handled");
    exit;
}

/**
 * Verify CSRF token dari header.
 * Stateless approach: hanya check token format, tidak perlu session.
 */
function verifyCsrf(): void {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

    if (empty($token)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'CSRF token missing',
        ]);
        exit;
    }

    if (strlen($token) !== 64 || !ctype_xdigit($token)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'CSRF token invalid',
        ]);
        exit;
    }
}

try {
    require_once __DIR__ . '/../core/Router.php';

    $router = new Router();
    debugLog("Router initialized");

    // ===== Auth Endpoints =====
    $router->post('/api/auth/register',         ['AuthController', 'register']);
    $router->post('/api/auth/login',            ['AuthController', 'login']);
    $router->post('/api/auth/logout',           ['AuthController', 'logout']);
    $router->get ('/api/auth/me',               ['AuthController', 'me']);
    $router->put ('/api/auth/profile',          ['AuthController', 'updateProfile']);
    $router->post('/api/auth/password',         ['AuthController', 'updatePassword']);
    $router->post('/api/auth/reset-password',   ['AuthController', 'requestPasswordReset']);
    $router->post('/api/admin/login',           ['AuthController', 'loginAdmin']);

    // ===== Admin management Endpoints =====
    $router->get ('/api/admin/ambil-data-pelanggan', ['AdminController', 'getPelanggan']);
    $router->post('/api/admin/hapus-data-pelanggan', ['AdminController', 'deletePelanggan']);
    $router->post('/api/admin/update-data-pelanggan', ['AdminController', 'updatePelanggan']);
    $router->get ('/api/admin/statistik-dashboard',  ['AdminController', 'getStats']);
    $router->get ('/api/admin/laporan-penjualan',  ['AdminController', 'laporanPenjualan']);

    // ===== Produk Endpoints =====
    $router->get ('/api/produk',                 ['ProdukController', 'index']);
    $router->get ('/api/produk/:id',             ['ProdukController', 'show']);
    $router->post('/api/produk',                 ['ProdukController', 'store']);
    $router->put ('/api/produk/:id',             ['ProdukController', 'update']);
    $router->delete('/api/produk/:id',           ['ProdukController', 'destroy']);
    $router->post('/api/produk/:id/varian',      ['ProdukController', 'storeVarian']);
    $router->put ('/api/varian/:id',             ['ProdukController', 'updateVarian']);

    // ===== Pesanan Endpoints =====
    $router->post('/api/pesanan',                ['PesananController', 'store']);
    $router->get ('/api/pesanan/saya',           ['PesananController', 'myOrders']);
    $router->get ('/api/pesanan/:id',            ['PesananController', 'show']);
    $router->post('/api/pesanan/:id/cancel',     ['PesananController', 'cancel']);
    $router->get ('/api/admin/pesanan',          ['PesananController', 'adminIndex']);
    $router->put ('/api/pesanan/:id/status',     ['PesananController', 'updateStatus']);

    // ===== Ulasan Endpoints =====
    $router->post('/api/ulasan',                 ['UlasanController', 'store']);
    $router->get ('/api/produk/:id/ulasan',      ['UlasanController', 'byProduk']);
    $router->put ('/api/ulasan/:id/moderate',    ['UlasanController', 'moderate']);

    // ===== Cart Endpoints =====
    $router->get ('/api/cart',                   ['CartController', 'index']);
    $router->post('/api/cart/sync',              ['CartController', 'sync']);

    $router->run();

} catch (Throwable $e) {
    http_response_code(500);
    
    $errorMsg = $e->getMessage();
    debugLog("ERROR: $errorMsg (file: {$e->getFile()}:{$e->getLine()})");
    
    // Response ke client
    $response = [
        'success' => false,
        'message' => 'Internal server error',
    ];
    
    // Add debug info hanya kalau DEBUG_MODE = true
    if (DEBUG_MODE) {
        $response['debug'] = [
            'error' => $errorMsg,
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ];
    }
    
    echo json_encode($response);
}

debugLog("=== REQUEST END ===\n");

?>
