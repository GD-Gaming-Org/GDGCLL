<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);
header("Content-Type: application/json; charset=UTF-8");
require_once "db.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

$username = trim($data["username"] ?? $_POST["username"] ?? "");
$password = trim($data["password"] ?? $_POST["password"] ?? "");

if (empty($username) || empty($password)) {
    ob_clean();
    echo json_encode(["ok" => false, "error" => "invalid_input"]);
    exit;
}

$stmt = $conn->prepare("SELECT id, username, password, role, is_banned FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1");
if (!$stmt) {
    ob_clean();
    echo json_encode(["ok" => false, "error" => "sql_prepare_error"]);
    exit;
}

$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    ob_clean();
    echo json_encode(["ok" => false, "error" => "no_account"]);
    exit;
}

$row = $result->fetch_assoc();

if (intval($row['is_banned']) === 1) {
    ob_clean();
    echo json_encode(["ok" => false, "error" => "You are permanently banned from this list."]);
    exit;
}

if (!password_verify($password, $row["password"])) {
    ob_clean();
    echo json_encode(["ok" => false, "error" => "wrong_password"]);
    exit;
}

$_SESSION["user_id"] = $row["id"];
$_SESSION["username"] = $row["username"];
$_SESSION["role"] = $row["role"] ?? "user";

ob_clean();
echo json_encode([
    "ok" => true,
    "username" => $row["username"],
    "role" => $row["role"] ?? "user"
]);
exit;
