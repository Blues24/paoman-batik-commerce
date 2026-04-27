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

    // Determine base path dari REQUEST_URI
    // Contoh: /paoman-batik/backend/public/api/produk
    $baseApi = '/paoman-batik/backend/public/api';

    // ===== Auth Endpoints =====
    $router->post("$baseApi/auth/register",         ['AuthController', 'register']);
    $router->post("$baseApi/auth/login",            ['AuthController', 'login']);
    $router->post("$baseApi/auth/logout",           ['AuthController', 'logout']);
    $router->get ("$baseApi/auth/me",               ['AuthController', 'me']);
    $router->put ("$baseApi/auth/profile",          ['AuthController', 'updateProfile']);
    $router->post("$baseApi/auth/password",         ['AuthController', 'updatePassword']);
    $router->post("$baseApi/auth/reset-password",   ['AuthController', 'requestPasswordReset']);
    $router->post("$baseApi/admin/login",           ['AuthController', 'loginAdmin']);

    // ===== Produk Endpoints =====
    $router->get ("$baseApi/produk",                 ['ProdukController', 'index']);
    $router->get ("$baseApi/produk/:id",             ['ProdukController', 'show']);
    $router->post("$baseApi/produk",                 ['ProdukController', 'store']);
    $router->put ("$baseApi/produk/:id",             ['ProdukController', 'update']);
    $router->delete("$baseApi/produk/:id",           ['ProdukController', 'destroy']);
    $router->post("$baseApi/produk/:id/varian",      ['ProdukController', 'storeVarian']);
    $router->put ("$baseApi/varian/:id",             ['ProdukController', 'updateVarian']);

    // ===== Pesanan Endpoints =====
    $router->post("$baseApi/pesanan",                ['PesananController', 'store']);
    $router->get ("$baseApi/pesanan/saya",           ['PesananController', 'myOrders']);
    $router->get ("$baseApi/pesanan/:id",            ['PesananController', 'show']);
    $router->get ("$baseApi/admin/pesanan",          ['PesananController', 'adminIndex']);
    $router->put ("$baseApi/pesanan/:id/status",     ['PesananController', 'updateStatus']);

    // ===== Ulasan Endpoints =====
    $router->post("$baseApi/ulasan",                 ['UlasanController', 'store']);
    $router->get ("$baseApi/produk/:id/ulasan",      ['UlasanController', 'byProduk']);
    $router->put ("$baseApi/ulasan/:id/moderate",    ['UlasanController', 'moderate']);

    // ===== Cart Endpoints =====
    $router->get ("$baseApi/cart",                   ['CartController', 'index']);
    $router->post("$baseApi/cart/sync",              ['CartController', 'sync']);

    debugLog("Routes registered with base: $baseApi");
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
