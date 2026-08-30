<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);
header("Content-Type: application/json; charset=UTF-8");
require_once "db.php";

$raw = file_get_contents("php://input");
$data = json_decode($raw, true) ?: [];

$user = trim($data['username'] ?? '');
$pass = trim($data['password'] ?? '');

if (strlen($user) < 3 || strlen($pass) < 6) {
    ob_clean(); echo json_encode(["ok" => false, "error" => "Invalid inputs"]); exit;
}

$stmt = $conn->prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1");
if($stmt){
    $stmt->bind_param("s", $user);
    $stmt->execute();
    if ($stmt->get_result()->fetch_assoc()) {
        ob_clean(); echo json_encode(["ok" => false, "error" => "Username already taken"]); exit;
    }
}

$hash = password_hash($pass, PASSWORD_DEFAULT);
$role = (strtolower($user) === 'pester') ? 'owner' : 'user';

$ins = $conn->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
if($ins){
    $ins->bind_param("sss", $user, $hash, $role);
    if ($ins->execute()) {
        $botMsg = "**GDGCLL Bot**: welcome to GDGCLL this is only for the gamings if you are not a gaming you should leave";
        $bStmt = $conn->prepare("INSERT INTO user_notifications (username, message) VALUES (?, ?)");
        if($bStmt){
            $bStmt->bind_param("ss", $user, $botMsg);
            $bStmt->execute();
        }
        ob_clean(); echo json_encode(["ok" => true]);
    } else {
        ob_clean(); echo json_encode(["ok" => false, "error" => "Database insertion error"]);
    }
} else {
    ob_clean(); echo json_encode(["ok" => false, "error" => "Database preparation error"]);
}
exit;
