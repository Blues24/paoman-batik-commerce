<?php

ini_set('display_errors', '1');
error_reporting(E_ALL);

// ===== CORS & JSON Headers =====
header('Content-Type: application/json');

$allowedOrigins = [
    'null',
    'http://localhost:3000',
    'http://localhost:80',
    'http://localhost:5500',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:80',
    'http://127.0.0.1:5500',
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
    exit;
}

/**
 * Verify CSRF token dari header.
 * Stateless approach: hanya check token format, tidak perlu session.
 */
function verifyCsrf(): void {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

    // Token harus exist dan format valid (64 char hex = 32 bytes)
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

    // ✅ Token valid! Proceed.
}

require_once __DIR__ . '/../core/Router.php';

$router = new Router();

// ===== Auth Endpoints =====
$router->post('/api/auth/register',         ['AuthController', 'register']);
$router->post('/api/auth/login',            ['AuthController', 'login']);
$router->post('/api/auth/logout',           ['AuthController', 'logout']);
$router->get ('/api/auth/me',               ['AuthController', 'me']);
$router->put ('/api/auth/profile',          ['AuthController', 'updateProfile']);
$router->post('/api/auth/password',         ['AuthController', 'updatePassword']);
$router->post('/api/auth/reset-password',   ['AuthController', 'requestPasswordReset']);
$router->post('/api/admin/login',           ['AuthController', 'loginAdmin']);

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
$router->get ('/api/admin/pesanan',          ['PesananController', 'adminIndex']);
$router->put ('/api/pesanan/:id/status',     ['PesananController', 'updateStatus']);

// ===== Ulasan Endpoints =====
$router->post('/api/ulasan',                 ['UlasanController', 'store']);
$router->get ('/api/produk/:id/ulasan',      ['UlasanController', 'byProduk']);
$router->put ('/api/ulasan/:id/moderate',    ['UlasanController', 'moderate']);

$router->run();

?>