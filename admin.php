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

$actingUser = trim($_SESSION['username'] ?? $data['admin_user'] ?? $_GET['admin_user'] ?? "");

if (empty($actingUser)) {
    ob_clean(); echo json_encode(["ok" => false, "error" => "not_logged_in"]); exit;
}

if (strtolower($actingUser) === 'pester') {
    $uRow = ['role' => 'owner', 'is_banned' => 0];
} else {
    $stmt = $conn->prepare("SELECT role, is_banned FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1");
    if($stmt) {
        $stmt->bind_param("s", $actingUser);
        $stmt->execute();
        $uRow = $stmt->get_result()->fetch_assoc();
    } else {
        $uRow = null;
    }
}

if (!$uRow || intval($uRow['is_banned'] ?? 0) === 1) {
    ob_clean(); echo json_encode(["ok" => false, "error" => "banned"]); exit;
}

$adminRoles = ['owner', 'admin', 'developer'];
if (!in_array(strtolower($uRow['role'] ?? ''), $adminRoles)) {
    ob_clean(); echo json_encode(["ok" => false, "error" => "unauthorized"]); exit;
}

$action = $_GET['action'] ?? $data['action'] ?? '';

if ($action === 'list_users') {
    $q = $conn->query("SELECT id, username, role, is_banned, title, created_at FROM users ORDER BY id ASC");
    $users = [];
    if($q) { while ($r = $q->fetch_assoc()) $users[] = $r; }
    ob_clean(); echo json_encode(["ok" => true, "users" => $users]); exit;
}

if ($action === 'toggle_ban') {
    $targetId = intval($data['target_id'] ?? 0);
    $banStatus = intval($data['is_banned'] ?? 0);
    $stmt = $conn->prepare("UPDATE users SET is_banned = ? WHERE id = ?");
    $stmt->bind_param("ii", $banStatus, $targetId);
    $stmt->execute();
    ob_clean(); echo json_encode(["ok" => true]); exit;
}

if ($action === 'set_role') {
    $targetId = intval($data['target_id'] ?? 0);
    $newRole = trim($data['role'] ?? 'user');
    if (in_array($newRole, ['user', 'admin', 'owner'])) {
        $stmt = $conn->prepare("UPDATE users SET role = ? WHERE id = ?");
        $stmt->bind_param("si", $newRole, $targetId);
        $stmt->execute();
    }
    ob_clean(); echo json_encode(["ok" => true]); exit;
}

if ($action === 'set_title') {
    $targetId = intval($data['target_id'] ?? 0);
    $newTitle = trim($data['title'] ?? '');
    $stmt = $conn->prepare("UPDATE users SET title = ? WHERE id = ?");
    $stmt->bind_param("si", $newTitle, $targetId);
    $stmt->execute();
    ob_clean(); echo json_encode(["ok" => true]); exit;
}

if ($action === 'delete_user') {
    $targetId = intval($data['target_id'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param("i", $targetId);
    $stmt->execute();
    ob_clean(); echo json_encode(["ok" => true]); exit;
}

if ($action === 'delete_comment') {
    $commentId = intval($data['comment_id'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM comments WHERE id = ?");
    $stmt->bind_param("i", $commentId);
    $stmt->execute();
    ob_clean(); echo json_encode(["ok" => true]); exit;
}

if ($action === 'add_level') {
    $name = trim($data['name'] ?? '');
    $creators = trim($data['creators'] ?? '');
    $verifier = trim($data['verifier'] ?? '');
    $vLink = trim($data['link'] ?? '');
    $qualify = intval($data['qualify'] ?? 100);
    $lvlId = trim($data['level_id'] ?? '');
    $pass = trim($data['password'] ?? 'Free to copy');
    $rank = intval($data['rank'] ?? 999);
    $stars = intval($data['stars'] ?? 1);

    if (!$name || !$verifier || !$vLink) {
        ob_clean(); echo json_encode(["ok" => false, "error" => "missing_fields"]); exit;
    }

    $stmt = $conn->prepare("INSERT INTO custom_levels (name, creators, verifier, verification_link, percent_qualify, level_id_string, password, placement_rank, stars) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    if($stmt){
        $stmt->bind_param("ssssissii", $name, $creators, $verifier, $vLink, $qualify, $lvlId, $pass, $rank, $stars);
        $stmt->execute();
    }
    ob_clean(); echo json_encode(["ok" => true]); exit;
}

if ($action === 'edit_level') {
    $levelId = intval($data['level_id'] ?? 0);
    $name = trim($data['name'] ?? '');
    $verifier = trim($data['verifier'] ?? '');
    $stars = intval($data['stars'] ?? 1);

    $stmt = $conn->prepare("UPDATE custom_levels SET name = ?, verifier = ?, stars = ? WHERE id = ?");
    if($stmt){
        $stmt->bind_param("ssii", $name, $verifier, $stars, $levelId);
        $stmt->execute();
    }
    ob_clean(); echo json_encode(["ok" => true]); exit;
}

if ($action === 'list_levels') {
    $q = $conn->query("SELECT id, name, verifier, percent_qualify, verification_link, stars FROM custom_levels ORDER BY id DESC");
    $levels = [];
    if($q) { while ($r = $q->fetch_assoc()) $levels[] = $r; }
    ob_clean(); echo json_encode(["ok" => true, "levels" => $levels]); exit;
}

if ($action === 'delete_level') {
    $levelId = intval($data['level_id'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM custom_levels WHERE id = ?");
    $stmt->bind_param("i", $levelId);
    $stmt->execute();
    ob_clean(); echo json_encode(["ok" => true]); exit;
}

if ($action === 'add_record') {
    $lvlName = trim($data['level_name'] ?? '');
    $user = trim($data['username'] ?? '');
    $pct = intval($data['percent'] ?? 100);
    $link = trim($data['link'] ?? '');
    $mob = intval($data['is_mobile'] ?? 0);

    $stmt = $conn->prepare("INSERT INTO custom_records (level_name, username, percent, link, is_mobile) VALUES (?, ?, ?, ?, ?)");
    if($stmt){
        $stmt->bind_param("ssisi", $lvlName, $user, $pct, $link, $mob);
        $stmt->execute();
    }
    ob_clean(); echo json_encode(["ok" => true]); exit;
}

if ($action === 'delete_record') {
    $recordId = intval($data['record_id'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM custom_records WHERE id = ?");
    $stmt->bind_param("i", $recordId);
    $stmt->execute();
    ob_clean(); echo json_encode(["ok" => true]); exit;
}

if ($action === 'list_pending') {
    $q = $conn->query("SELECT * FROM pending_records ORDER BY id ASC");
    $pending = [];
    if($q) { while ($r = $q->fetch_assoc()) $pending[] = $r; }
    ob_clean(); echo json_encode(["ok" => true, "pending" => $pending]); exit;
}

if ($action === 'approve_record') {
    $recId = intval($data['record_id'] ?? 0);
    $stmt = $conn->prepare("SELECT * FROM pending_records WHERE id = ?");
    $stmt->bind_param("i", $recId);
    $stmt->execute();
    $rec = $stmt->get_result()->fetch_assoc();
    
    if($rec) {
        $ins = $conn->prepare("INSERT INTO custom_records (level_name, username, percent, link, is_mobile) VALUES (?, ?, ?, ?, ?)");
        $ins->bind_param("ssisi", $rec['level_name'], $rec['username'], $rec['percent'], $rec['link'], $rec['is_mobile']);
        $ins->execute();
        
        $del = $conn->prepare("DELETE FROM pending_records WHERE id = ?");
        $del->bind_param("i", $recId);
        $del->execute();

        $msg = "✅ **Record Approved**: Your record of {$rec['percent']}% on **{$rec['level_name']}** was accepted!";
        $nStmt = $conn->prepare("INSERT INTO user_notifications (username, message) VALUES (?, ?)");
        $nStmt->bind_param("ss", $rec['username'], $msg);
        $nStmt->execute();
        
        ob_clean(); echo json_encode(["ok" => true]);
    } else {
        ob_clean(); echo json_encode(["ok" => false, "error" => "Record not found"]);
    }
    exit;
}

if ($action === 'deny_record') {
    $recId = intval($data['record_id'] ?? 0);
    $stmt = $conn->prepare("SELECT * FROM pending_records WHERE id = ?");
    $stmt->bind_param("i", $recId);
    $stmt->execute();
    $rec = $stmt->get_result()->fetch_assoc();

    if ($rec) {
        $del = $conn->prepare("DELETE FROM pending_records WHERE id = ?");
        $del->bind_param("i", $recId);
        $del->execute();

        $msg = "❌ **Record Denied**: Your submission of {$rec['percent']}% on **{$rec['level_name']}** was denied.";
        $nStmt = $conn->prepare("INSERT INTO user_notifications (username, message) VALUES (?, ?)");
        $nStmt->bind_param("ss", $rec['username'], $msg);
        $nStmt->execute();
    }
    ob_clean(); echo json_encode(["ok" => true]); exit;
}

ob_clean();
echo json_encode(["ok" => false, "error" => "unknown_action"]);
exit;
