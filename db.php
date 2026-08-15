<?php
$host = "sql206.infinityfree.com";
$db = "if0_42655486_gdgcll";
$user = "if0_42655486";
$pass = "GDGCLL123";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    header("Content-Type: application/json");
    echo json_encode(["ok" => false, "error" => "db_connect_failed"]);
    exit;
}
?>
