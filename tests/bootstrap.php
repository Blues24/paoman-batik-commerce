<?php

require_once __DIR__ . '/../backend/config/database.php';

// jalankan schema
$pdo = Database::connect();
$pdo->exec(file_get_contents(__DIR__ . '/../backend/sql/schema.sql'));

?>
