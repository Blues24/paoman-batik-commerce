<?php

/**
 * Class untuk koneksi database menggunakan singleton pattern.
 */
class Database {
    private static ?PDO $instance = null;

    /**
     * Mendapatkan instance PDO untuk koneksi database.
     */
    public static function connect(): PDO {
        if (self::$instance === null) {
            $dsn = "mysql:unix_socket=/opt/lampp/var/mysql/mysql.sock;dbname=batik_store;charset=utf8mb4";
            self::$instance = new PDO($dsn, "root", "", [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        }

        return self::$instance;
    }
}