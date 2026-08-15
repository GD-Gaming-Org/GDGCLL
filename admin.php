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
$data = json_decode($raw, true) ?: [];

$actingUser = trim($_SESSION['username'] ?? $data['admin_user'] ?? "");

if (empty($actingUser)) {
    ob_clean();
    echo json_encode(["ok" => false, "error" => "not_logged_in"]);
    exit;
}

$stmt = $conn->prepare("SELECT role FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1");
$stmt->bind_param("s", $actingUser);
$stmt->execute();
$res = $stmt->get_result();
$uRow = $res->fetch_assoc();

$adminRoles = ['owner', 'admin', 'developer'];
if (!$uRow || !in_array(strtolower($uRow['role']), $adminRoles)) {
    ob_clean();
    echo json_encode(["ok" => false, "error" => "unauthorized"]);
    exit;
}

$action = $_GET['action'] ?? $data['action'] ?? '';

if ($action === 'list_users') {
    $q = $conn->query("SELECT id, username, role, created_at FROM users ORDER BY id ASC");
    $users = [];
    while ($r = $q->fetch_assoc()) {
        $users[] = $r;
    }
    ob_clean();
    echo json_encode(["ok" => true, "users" => $users]);
    exit;
}

if ($action === 'set_role') {
    $targetId = intval($data['target_id'] ?? 0);
    $newRole = trim($data['role'] ?? 'user');
    
    if (!in_array($newRole, ['user', 'admin', 'owner'])) {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "invalid_role"]);
        exit;
    }

    $stmt = $conn->prepare("UPDATE users SET role = ? WHERE id = ?");
    $stmt->bind_param("si", $newRole, $targetId);
    $stmt->execute();

    ob_clean();
    echo json_encode(["ok" => true]);
    exit;
}

if ($action === 'delete_user') {
    $targetId = intval($data['target_id'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param("i", $targetId);
    $stmt->execute();

    ob_clean();
    echo json_encode(["ok" => true]);
    exit;
}

if ($action === 'delete_comment') {
    $commentId = intval($data['comment_id'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM comments WHERE id = ?");
    $stmt->bind_param("i", $commentId);
    $stmt->execute();

    ob_clean();
    echo json_encode(["ok" => true]);
    exit;
}

ob_clean();
echo json_encode(["ok" => false, "error" => "unknown_action"]);
exit;
