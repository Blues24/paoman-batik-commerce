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
            $this->respond(false, null, 'Registrasi gagal: ' . $e->getMessage(), 500);
        }
    }

    public function login(): void {
        $body  = $this->body();
        $model = new AkunModel();

        if (empty($body['username']) || empty($body['password']))
            $this->respond(false, null, 'Username dan password wajib diisi', 422);

        $user = $model->findByUsername($body['username']);

        if (!$user || !password_verify($body['password'], $user['password_hash']))
            $this->respond(false, null, 'Username atau password salah', 401);
        if ($user['status_akun'] !== 'aktif')
            $this->respond(false, null, 'Akun tidak aktif', 403);

        session_regenerate_id(true);
        $_SESSION['akun_id']      = $user['akun_id'];
        $_SESSION['pelanggan_id'] = $user['pelanggan_id'];

        $this->respond(true, ['nama' => $user['nama']], 'Login berhasil', 200);
    }

    public function loginAdmin(): void {
        $body  = $this->body();
        $model = new AkunModel();

        if (empty($body['username']) || empty($body['password']))
            $this->respond(false, null, 'Username dan password wajib diisi', 422);

        $admin = $model->findAdminByUsername($body['username']);

        if (!$admin || !password_verify($body['password'], $admin['password']))
            $this->respond(false, null, 'Kredensial admin salah', 401);

        session_regenerate_id(true);
        $_SESSION['admin_id'] = $admin['admin_id'];
        $_SESSION['role']     = $admin['role'];

        $this->respond(true, ['role' => $admin['role']], 'Login admin berhasil', 200);
    }

    public function logout(): void {
        session_destroy();
        $this->respond(true, null, 'Logout berhasil', 200);
    }
}