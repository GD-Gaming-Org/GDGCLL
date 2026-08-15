<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);
header("Content-Type: application/json; charset=UTF-8");

require_once "db.php";


$raw = file_get_contents("php://input");
$data = json_decode($raw, true);


$username = trim($data["username"] ?? $_POST["username"] ?? "");
$password = trim($data["password"] ?? $_POST["password"] ?? "");


if (empty($username) || empty($password)) {
    ob_clean();
    echo json_encode(["ok" => false, "error" => "invalid_input"]);
    exit;
}


$hashedPassword = password_hash($password, PASSWORD_DEFAULT);
$role = "user";


$stmt = $conn->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
if (!$stmt) {
    ob_clean();
    echo json_encode(["ok" => false, "error" => "sql_prepare_error"]);
    exit;
}

$stmt->bind_param("sss", $username, $hashedPassword, $role);

if ($stmt->execute()) {
    ob_clean();
    echo json_encode(["ok" => true]);
} else {
    ob_clean();
    echo json_encode(["ok" => false, "error" => "username_taken"]);
}
exit;
