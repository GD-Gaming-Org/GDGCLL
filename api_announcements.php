<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);
header("Content-Type: application/json; charset=UTF-8");
require_once "db.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $q = $conn->query("SELECT * FROM announcements ORDER BY id DESC");
    $data = [];
    if($q) {
        while($r = $q->fetch_assoc()) {
            $data[] = $r;
        }
    }
    ob_clean();
    echo json_encode(["ok" => true, "announcements" => $data]);
    exit;
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true) ?: [];
$actingUser = trim($_SESSION['username'] ?? $data['admin_user'] ?? "");

if (!$actingUser) {
    ob_clean(); echo json_encode(["ok" => false, "error" => "not_logged_in"]); exit;
}

$isAdmin = false;
if (strtolower($actingUser) === 'pester') {
    $isAdmin = true;
} else {
    $stmt = $conn->prepare("SELECT role, is_banned FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1");
    if ($stmt) {
        $stmt->bind_param("s", $actingUser);
        $stmt->execute();
        $res = $stmt->get_result();
        $uRow = $res->fetch_assoc();
        if ($uRow && intval($uRow['is_banned']) === 0 && in_array(strtolower($uRow['role']), ['owner','admin','developer'])) {
            $isAdmin = true;
        }
    }
}

if (!$isAdmin) {
    ob_clean(); echo json_encode(["ok" => false, "error" => "unauthorized"]); exit;
}

if ($method === 'POST') {
    $action = $data['action'] ?? '';
    if ($action === 'add') {
        $msg = trim($data['message'] ?? '');
        if (!$msg) { ob_clean(); echo json_encode(["ok" => false, "error" => "empty_message"]); exit; }
        
        $stmt = $conn->prepare("INSERT INTO announcements (author, message) VALUES (?, ?)");
        $stmt->bind_param("ss", $actingUser, $msg);
        $stmt->execute();
        ob_clean(); echo json_encode(["ok" => true]); exit;
    }
    
    if ($action === 'delete') {
        $id = intval($data['id'] ?? 0);
        $stmt = $conn->prepare("DELETE FROM announcements WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        ob_clean(); echo json_encode(["ok" => true]); exit;
    }
}

ob_clean();
echo json_encode(["ok" => false, "error" => "unknown_request"]);
exit;
