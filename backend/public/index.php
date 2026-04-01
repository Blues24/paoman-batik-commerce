<?php

// Header Global
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS');
header('Access-Control-ALlow-Headers: Content-Type');

function verifyCsrf(): void {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!$token || !hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'CSRF token invalid']);
        exit;
    }
}

// Session Config (Cookies)
session_set_cookie_params([
    'lifetime' => 0, // Cookie akan hilang jika user menutup website atau browser
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Strict',
]);

session_start(); // menjalankan sesi dengan parameter yang sudah diset

require_once __DIR__ . '/../core/Router.php';

$router = new Router();

// Auth endpoint API routes
$router->post('/api/auth/register',  ['AuthController', 'register']);
$router->post('/api/auth/login',     ['AuthController', 'login']);
$router->post('/api/auth/logout',    ['AuthController', 'logout']);
$router->post('/api/admin/login',    ['AuthController', 'loginAdmin']);

// Produk endpoint API routes
$router->get ('/api/produk',                 ['ProdukController', 'index']);
$router->get ('/api/produk/:id',             ['ProdukController', 'show']);
$router->post('/api/produk',                 ['ProdukController', 'store']);
$router->put ('/api/produk/:id',             ['ProdukController', 'update']);
$router->delete('/api/produk/:id',           ['ProdukController', 'destroy']);
$router->post('/api/produk/:id/varian',      ['ProdukController', 'storeVarian']);
$router->put ('/api/varian/:id',             ['ProdukController', 'updateVarian']);

// Pemesanan endpoint API routes
$router->post('/api/pesanan',                ['PesananController', 'store']);
$router->get ('/api/pesanan/saya',           ['PesananController', 'myOrders']);
$router->get ('/api/pesanan/:id',            ['PesananController', 'show']);
$router->get ('/api/admin/pesanan',          ['PesananController', 'adminIndex']);
$router->put ('/api/pesanan/:id/status',     ['PesananController', 'updateStatus']);

// Review endpoint API routes
$router->post('/api/ulasan',                 ['UlasanController', 'store']);
$router->get ('/api/produk/:id/ulasan',      ['UlasanController', 'byProduk']);
$router->put ('/api/ulasan/:id/moderate',    ['UlasanController', 'moderate']);

$router->run();

?>