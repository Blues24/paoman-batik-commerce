<?php

require_once __DIR__ . '/../models/AkunModel.php';

class AuthController {

    private function respond(bool $success, mixed $data, string $msg, int $code): void {
        http_response_code($code);
        echo json_encode(['success' => $success, 'message' => $msg, 'data' => $data]);
        exit;
    }

    private function body(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    private function checkRateLimit(string $key, int $maxAttempts = 5): void {
        $attempts = $_SESSION[$key] ?? 0;
        if ($attempts >= $maxAttempts) {
            $this->respond(false, null, 'Terlalu banyak percobaan, tunggu lima menit lagi', 429);
        }
    }

    private function failAttempt(string $key): void {
        $_SESSION[$key] = ($_SESSION[$key] ?? 0) + 1;
    }

    private function clearAttempt(string $key): void {
        unset($_SESSION[$key]);
    }

    public function register(): void {
        $body  = $this->body();
        $model = new AkunModel();

        foreach (['username', 'password', 'nama', 'email'] as $f) {
            if (empty($body[$f])) $this->respond(false, null, "Field '$f' wajib diisi", 422);
        }
        if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL))
            $this->respond(false, null, 'Format email tidak valid', 422);
        if (strlen($body['password']) < 8)
            $this->respond(false, null, 'Password minimal 8 karakter', 422);
        if ($model->usernameExists($body['username']))
            $this->respond(false, null, 'Username sudah dipakai', 409);
        if ($model->emailExists($body['email']))
            $this->respond(false, null, 'Email sudah terdaftar', 409);

        try {
            $model->createWithPelanggan($body);
            $this->respond(true, null, 'Registrasi berhasil', 201);
        } catch (Exception $e) {
            error_log('[Register Error] ' . $e->getMessage());
            $this->respond(false, null, 'Registrasi gagal, coba lagi nanti', 500);
        }
    }

    public function login(): void {
        $body  = $this->body();
        $model = new AkunModel();
        $key = 'login_attempt_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');

        $this->checkRateLimit($key);

        if (empty($body['username']) || empty($body['password']))
            $this->respond(false, null, 'Username dan password wajib diisi', 422);

        $user = $model->findByUsername($body['username']);

        if (!$user || !password_verify($body['password'], $user['password_hash']))
            $this->failAttempt($key);
            $this->respond(false, null, 'Username atau password salah', 401);

        if ($user['status_akun'] !== 'aktif')
            $this->respond(false, null, 'Akun tidak aktif', 403);
        
        $this->clearAttempt($key);
        session_regenerate_id(true);
        $_SESSION['akun_id']      = $user['akun_id'];
        $_SESSION['pelanggan_id'] = $user['pelanggan_id'];
        $_SESSION['csrf_token']   = bin2hex(random_bytes(32));
        $this->respond(true, [
            'nama'  => $user['nama'],
            'csrf_token' => $_SESSION['csrf_token']
        ], 'Login Berhasil yey', 200);
    }

    public function loginAdmin(): void {
        $body  = $this->body();
        $model = new AkunModel();
        $key   = 'admin_attempt_' . ($_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN');

        $this->checkRateLimit($key);

        if (empty($body['username']) || empty($body['password']))
            $this->respond(false, null, 'Username dan password wajib diisi', 422);

        $admin = $model->findAdminByUsername($body['username']);

        if (!$admin || !password_verify($body['password'], $admin['password']))
            $this->failAttempt($key);
            $this->respond(false, null, 'username atau password admin salah', 401);

        $this->clearAttempt($key);
        session_regenerate_id(true);
        $_SESSION['admin_id']       = $admin['admin_id'];
        $_SESSION['role']           = $admin['role'];
        $_SESSION['csrf_token']     = bin2hex(random_bytes(32));

        $this->respond(true, [
            'role' => $admin['role'],
            'csrf_token' => $_SESSION['csrf_token']
            ], 'Login admin berhasil yey!', 200);
    }

    public function logout(): void {
        session_destroy();
        $this->respond(true, null, 'Logout berhasil', 200);
    }
}