<?php
error_reporting(0);
ini_set('display_errors', 0);

$host = "sql206.infinityfree.com";
$user = "if0_42655486";
$pass = "GDGCLL123";
$db   = "if0_42655486_gdgcll";

$conn = @new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    header('Content-Type: application/json');
    echo json_encode(["ok" => false, "error" => "db_connect_failed"]);
    exit;
}

$conn->set_charset("utf8mb4");

function checkUserSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    return isset($_SESSION["username"]) ? $_SESSION["username"] : null;
}
