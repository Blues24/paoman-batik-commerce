<?php

// set env vars sebelum Database di-load
putenv('DB_HOST=127.0.0.1');
putenv('DB_NAME=batik_test');
putenv('DB_USER=root');
putenv('DB_PASS=');
putenv('DB_PORT=3306');

require_once __DIR__ . '/../backend/config/database.php';

// jalankan schema
$pdo = Database::connect();
$pdo->exec(file_get_contents(__DIR__ . '/../backend/sql/schema.sql'));

?>
