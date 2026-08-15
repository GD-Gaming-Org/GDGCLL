<?php
$host = "sql206.infinityfree.com";
$user = "if0_42655486";
$pass = "GDGCLL123";
$db   = "if0_42655486_gdgcll";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "db_connect_failed"]);
    exit;
}

$conn->set_charset("utf8mb4");

function requireLogin() {
    session_start();
    if (!isset($_SESSION["username"])) {
        http_response_code(401);
        echo json_encode(["error" => "not_logged_in"]);
        exit;
    }
    return $_SESSION["username"];
}

function requireAdmin($conn) {
    $username = requireLogin();
    $stmt = $conn->prepare("SELECT role FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if (!$row || !in_array($row["role"], ["admin", "owner", "developer"])) {
        http_response_code(403);
        echo json_encode(["error" => "not_admin"]);
        exit;
    }
}
