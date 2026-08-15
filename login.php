<?php
session_start();
header("Content-Type: application/json");
require "db.php";

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$username = trim($data["username"] ?? "");
$password = $data["password"] ?? "";

if (empty($username) || empty($password)) {
    echo json_encode(["ok" => false, "error" => "missing_fields"]);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1");
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode(["ok" => false, "error" => "no_account"]);
    exit;
}

if (!password_verify($password, $user["password"])) {
    http_response_code(401);
    echo json_encode(["ok" => false, "error" => "wrong_password"]);
    exit;
}

$_SESSION["user_id"] = $user["id"];
$_SESSION["username"] = $user["username"];
$_SESSION["role"] = $user["role"];

echo json_encode([
    "ok" => true,
    "user" => [
        "id" => $user["id"],
        "username" => $user["username"],
        "role" => $user["role"],
        "title" => $user["title"],
        "vip" => $user["vip"],
        "avatar" => $user["avatar"]
    ]
]);
?>
