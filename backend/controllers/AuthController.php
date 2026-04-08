<?php

require_once __DIR__ . '/../models/AkunModel.php';

/**
 * Controller untuk autentikasi pengguna dan admin.
 * Menangani registrasi, login, logout dengan rate limiting.
 */
class AuthController {

    /**
     * Mengirim response JSON standar.
     */
    private function respond(bool $success, mixed $data, string $msg, int $code): void {
        http_response_code($code);
        echo json_encode(['success' => $success, 'message' => $msg, 'data' => $data]);
        exit;
    }

    /**
     * Mendapatkan data JSON dari body request.
     */
    private function body(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    /**
     * Mengecek rate limit untuk mencegah brute force.
     */
    private function checkRateLimit(string $key, int $maxAttempts = 5, int $cooldown = 300): void {
    $attempts  = $_SESSION[$key]['count'] ?? 0;
    $blockedAt = $_SESSION[$key]['blocked_at'] ?? null;

    if ($blockedAt !== null) {
        $elapsed = time() - $blockedAt;
        if ($elapsed < $cooldown) {
            $sisaDetik = $cooldown - $elapsed;
            $sisaMenit = ceil($sisaDetik / 60);
            $this->respond(false, null, "Terlalu banyak percobaan. Coba lagi dalam {$sisaMenit} menit.", 429);
        }
        // cooldown selesai, reset
        unset($_SESSION[$key]);
    }

    if ($attempts >= $maxAttempts) {
        $_SESSION[$key]['blocked_at'] = time();
        $this->respond(false, null, "Terlalu banyak percobaan. Coba lagi dalam 5 menit.", 429);
    }
    }

    /**
     * Mencatat percobaan gagal.
     */
    private function failAttempt(string $key): void {
        $_SESSION[$key]['count'] = ($_SESSION[$key]['count'] ?? 0) + 1;
    }

    /**
     * Menghapus catatan percobaan.
     */
    private function clearAttempt(string $key): void {
        unset($_SESSION[$key]);
    }

    /**
     * Mendaftarkan pengguna baru.
     */
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

    /**
     * Login pengguna biasa.
     */
    public function login(): void {
        $body  = $this->body();
        $model = new AkunModel();
        $key = 'login_attempt_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
        $identifier = $body['identifier'] ?? $body['username'] ?? '';

        $this->checkRateLimit($key);


        if (empty($identifier) || empty($body['password']))
            $this->respond(false, null, 'Username/Email dan password wajib diisi', 422);

        $user = $model->findByIdentifier($identifier);

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

    /**
     * Login admin.
     */
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

    /**
     * Logout pengguna.
     */
    public function logout(): void {
        session_destroy();
        $this->respond(true, null, 'Logout berhasil', 200);
    }
}