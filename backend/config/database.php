<?php

class Database {
    private static ?PDO $instance = null;

    public static function connect(): PDO {
        if (self::$instance === null) {
            self::loadEnv();

            $name   = getenv('DB_NAME') ?: 'batik_store';
            $user   = getenv('DB_USER') ?: 'root';
            $pass   = getenv('DB_PASS') ?: '';
            $socket = getenv('DB_SOCKET') ?: '';

            // kalau socket tersedia → pakai unix socket (Linux)
            // kalau tidak → pakai TCP (Windows)
            if ($socket) {
                $dsn = "mysql:unix_socket={$socket};dbname={$name};charset=utf8mb4";
            } else {
                $host = getenv('DB_HOST') ?: '127.0.0.1';
                $port = getenv('DB_PORT') ?: '3306';
                $dsn  = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
            }

            self::$instance = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        }
        return self::$instance;
    }

    private static function loadEnv(): void {
        $path = __DIR__ . '/../.env';
        if (!file_exists($path)) return;

        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            if (str_starts_with(trim($line), '#')) continue;
            [$key, $value] = explode('=', $line, 2);
            putenv(trim($key) . '=' . trim($value));
        }
    }
}
