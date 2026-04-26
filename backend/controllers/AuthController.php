<?php

require_once __DIR__ . '/../models/AkunModel.php';

/**
 * Stateless Authentication Controller
 * Token-based approach: No sessions, akun_id passed in request body
 */
class AuthController {

    /**
     * Send JSON response.
     */
    private function respond(bool $success, mixed $data, string $msg, int $code): void {
        http_response_code($code);
        echo json_encode(['success' => $success, 'message' => $msg, 'data' => $data]);
        exit;
    }

    /**
     * Get JSON body.
     */
    private function body(): array {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    /**
     * Rate limit check (memory-based for dev, no session needed).
     */
    private function checkRateLimit(string $key, int $maxAttempts = 5, int $cooldown = 300): void {
        $tmpDir = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR);
        $file = $tmpDir . DIRECTORY_SEPARATOR . 'ratelimit_' . md5($key) . '.json';
        
        $data = [];
        if (is_file($file)) {
            $data = json_decode(file_get_contents($file), true) ?? [];
        }

        $now = time();
        $attempts = $data['count'] ?? 0;
        $blockedAt = $data['blocked_at'] ?? null;

        if ($blockedAt !== null) {
            $elapsed = $now - $blockedAt;
            if ($elapsed < $cooldown) {
                $sisaMenit = ceil(($cooldown - $elapsed) / 60);
                $this->respond(false, null, "Terlalu banyak percobaan. Coba lagi dalam {$sisaMenit} menit.", 429);
            }
            // Reset after cooldown
            @unlink($file);
            return;
        }

        if ($attempts >= $maxAttempts) {
            $data['blocked_at'] = $now;
            file_put_contents($file, json_encode($data));
            $this->respond(false, null, "Terlalu banyak percobaan. Coba lagi dalam 5 menit.", 429);
        }
    }

    /**
     * Record failed attempt.
     */
    private function failAttempt(string $key): void {
        $tmpDir = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR);
        $file = $tmpDir . DIRECTORY_SEPARATOR . 'ratelimit_' . md5($key) . '.json';
        $data = [];
        if (is_file($file)) {
            $data = json_decode(file_get_contents($file), true) ?? [];
        }
        $data['count'] = ($data['count'] ?? 0) + 1;
        file_put_contents($file, json_encode($data));
    }

    /**
     * Clear attempt counter.
     */
    private function clearAttempt(string $key): void {
        $tmpDir = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR);
        $file = $tmpDir . DIRECTORY_SEPARATOR . 'ratelimit_' . md5($key) . '.json';
        @unlink($file);
    }

    /**
     * Register user.
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
            $akunId = $model->createWithPelanggan($body);
            $user = $model->findByAkunId($akunId);

            if (!$user) {
                throw new Exception('Data pengguna gagal diambil setelah registrasi');
            }

            // Generate token (no session)
            $token = bin2hex(random_bytes(32));

            $this->respond(true, [
                'akun_id'    => $user['akun_id'],
                'pelanggan_id' => $user['pelanggan_id'] ?? null,
                'nama'       => $user['nama'],
                'username'   => $user['username'],
                'email'      => $user['email'],
                'noHp'       => $user['no_hp'],
                'alamat'     => $user['alamat'],
                'csrf_token' => $token
            ], 'Registrasi berhasil', 201);
        } catch (Exception $e) {
            error_log('[Register Error] ' . $e->getMessage());
            $this->respond(false, null, 'Registrasi gagal, coba lagi nanti', 500);
        }
    }

    /**
     * Login user.
     */
    public function login(): void {
        $body  = $this->body();
        $model = new AkunModel();
        $key   = 'login_attempt_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
        $identifier = $body['identifier'] ?? $body['username'] ?? '';

        $this->checkRateLimit($key);

        if (empty($identifier) || empty($body['password']))
            $this->respond(false, null, 'Username/Email dan password wajib diisi', 422);

        $user = $model->findByIdentifier($identifier);

        if (!$user || !password_verify($body['password'], $user['password_hash'])) {
            $this->failAttempt($key);
            $this->respond(false, null, 'Username atau password salah', 401);
        }
        if ($user['status_akun'] !== 'aktif')
            $this->respond(false, null, 'Akun tidak aktif', 403);

        $this->clearAttempt($key);

        // Generate token (no session needed!)
        $token = bin2hex(random_bytes(32));

        $this->respond(true, [
            'akun_id'    => $user['akun_id'],
            'pelanggan_id' => $user['pelanggan_id'] ?? null,
            'nama'       => $user['nama'],
            'username'   => $user['username'],
            'email'      => $user['email'],
            'noHp'       => $user['no_hp'],
            'alamat'     => $user['alamat'],
            'csrf_token' => $token
        ], 'Login Berhasil', 200);
    }

    /**
     * Get current user (dummy, not needed for stateless).
     */
    public function me(): void {
        // For stateless API, this would require user to send akun_id
        // For now, return 401
        $this->respond(false, null, 'Unauthorized', 401);
    }

    /**
     * Update profile.
     * Requires akun_id in body + valid CSRF token.
     */
    public function updateProfile(): void {
        verifyCsrf();  // ✅ Validate token format

        $body  = $this->body();
        $akunId = (int) ($body['akun_id'] ?? 0);

        if ($akunId <= 0) {
            $this->respond(false, null, 'akun_id wajib diisi (valid)', 422);
        }

        $model = new AkunModel();

        foreach (['username', 'nama', 'email'] as $f) {
            if (empty($body[$f])) $this->respond(false, null, "Field '$f' wajib diisi", 422);
        }

        if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL))
            $this->respond(false, null, 'Format email tidak valid', 422);

        if ($model->usernameExistsExcept($body['username'], $akunId))
            $this->respond(false, null, 'Username sudah dipakai', 409);

        if ($model->emailExistsExcept($body['email'], $akunId))
            $this->respond(false, null, 'Email sudah terdaftar', 409);

        try {
            $user = $model->updateProfile($akunId, $body);
            $this->respond(true, [
                'akun_id'  => $user['akun_id'],
                'nama'     => $user['nama'],
                'username' => $user['username'],
                'email'    => $user['email'],
                'noHp'     => $user['no_hp'],
                'alamat'   => $user['alamat']
            ], 'Profil berhasil diperbarui', 200);
        } catch (Exception $e) {
            error_log('[Profile Update Error] ' . $e->getMessage());
            $this->respond(false, null, 'Gagal memperbarui profil', 500);
        }
    }

    /**
     * Update password.
     */
    public function updatePassword(): void {
        verifyCsrf();

        $body = $this->body();
        $akunId = (int) ($body['akun_id'] ?? 0);

        if ($akunId <= 0) {
            $this->respond(false, null, 'akun_id wajib diisi', 422);
        }

        $model = new AkunModel();

        if (empty($body['currentPassword']) || empty($body['newPassword']))
            $this->respond(false, null, 'Password lama dan baru wajib diisi', 422);

        if (strlen($body['newPassword']) < 8)
            $this->respond(false, null, 'Password baru minimal 8 karakter', 422);

        $result = $model->changePassword($akunId, $body['currentPassword'], $body['newPassword']);

        if ($result !== true) {
            $this->respond(false, null, $result, 400);
        }

        $this->respond(true, null, 'Password berhasil diganti', 200);
    }

    /**
     * Request password reset.
     */
    public function requestPasswordReset(): void {
        $body = $this->body();

        if (empty($body['identifier'])) {
            $this->respond(false, null, 'Username atau email wajib diisi', 422);
        }

        $model = new AkunModel();
        $user = $model->findByIdentifier($body['identifier']);

        if (!$user) {
            $this->respond(false, null, 'Akun tidak ditemukan', 404);
        }

        $this->respond(true, ['email' => $user['email']], 'Simulasi reset sandi dikirim ke ' . $user['email'], 200);
    }

    /**
     * Admin login.
     */
    public function loginAdmin(): void {
        $body  = $this->body();
        $model = new AkunModel();
        $key   = 'admin_attempt_' . ($_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN');

        $this->checkRateLimit($key);

        if (empty($body['username']) || empty($body['password']))
            $this->respond(false, null, 'Username dan password wajib diisi', 422);

        $admin = $model->findAdminByUsername($body['username']);

        if (!$admin || !password_verify($body['password'], $admin['password'])) {
            $this->failAttempt($key);
            $this->respond(false, null, 'username atau password admin salah', 401);
        }

        $this->clearAttempt($key);

        // Generate token
        $token = bin2hex(random_bytes(32));

        $this->respond(true, [
            'admin_id'   => $admin['admin_id'],
            'role'       => $admin['role'],
            'csrf_token' => $token
        ], 'Login admin berhasil', 200);
    }

    /**
     * Logout (stateless, just return success).
     */
    public function logout(): void {
        // No session to destroy, client just remove token
        $this->respond(true, null, 'Logout berhasil', 200);
    }
}