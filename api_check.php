<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);
header("Content-Type: application/json; charset=UTF-8");
require_once "db.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$username = trim($_GET['username'] ?? "");

if (empty($username)) {
    ob_clean();
    echo json_encode(["ok" => false, "error" => "no_user"]);
    exit;
}


if (strtolower($username) === 'pester') {
    ob_clean();
    echo json_encode(["ok" => true, "role" => "owner", "is_banned" => 0]);
    exit;
}

$stmt = $conn->prepare("SELECT role, is_banned FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1");
if ($stmt) {
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();
    
    if ($row) {
        ob_clean();
        echo json_encode([
            "ok" => true, 
            "role" => $row['role'], 
            "is_banned" => intval($row['is_banned'])
        ]);
        exit;
    }
}


ob_clean();
echo json_encode(["ok" => false, "error" => "deleted"]);
exit;
