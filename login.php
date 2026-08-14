<?php
session_start();
header("Content-Type: application/json");
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$username = trim($data["username"] ?? "");
$password = $data["password"] ?? "";

$stmt = $conn->prepare("SELECT id, password FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["error" => "no_account"]);
    exit;
}

$row = $result->fetch_assoc();
if (!password_verify($password, $row["password"])) {
    http_response_code(401);
    echo json_encode(["error" => "wrong_password"]);
    exit;
}

$_SESSION["user_id"] = $row["id"];
$_SESSION["username"] = $username;
echo json_encode(["ok" => true, "username" => $username]);
