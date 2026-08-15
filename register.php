<?php
header("Content-Type: application/json");
require "db.php";

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$username = trim($data["username"] ?? "");
$password = $data["password"] ?? "";

if (empty($username) || empty($password)) {
    echo json_encode(["ok" => false, "error" => "missing_fields"]);
    exit;
}

$stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1");
$stmt->execute([$username]);
if ($stmt->fetch()) {
    echo json_encode(["ok" => false, "error" => "username_taken"]);
    exit;
}

$hashed = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO users (username, password, role, title, vip, avatar) VALUES (?, ?, 'user', 'Member', 0, 'assets/gdgcll.png')");

if ($stmt->execute([$username, $hashed])) {
    echo json_encode(["ok" => true]);
} else {
    echo json_encode(["ok" => false, "error" => "insert_failed"]);
}
?>
