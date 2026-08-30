
<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);
header("Content-Type: application/json; charset=UTF-8");
require_once "db.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$user = trim($_GET['username'] ?? $_POST['username'] ?? $_SESSION['username'] ?? "");

if (!$user) {
    ob_clean();
    echo json_encode(["ok" => false, "error" => "no_user"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->prepare("SELECT * FROM user_notifications WHERE LOWER(username) = LOWER(?) ORDER BY id DESC LIMIT 20");
    $stmt->bind_param("s", $user);
    $stmt->execute();
    $res = $stmt->get_result();
    $notes = [];
    $unread = 0;
    while ($r = $res->fetch_assoc()) {
        $notes[] = $r;
        if (intval($r['is_read']) === 0) $unread++;
    }
    ob_clean();
    echo json_encode(["ok" => true, "notifications" => $notes, "unread" => $unread]);
    exit;
}

if ($method === 'POST') {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true) ?: [];
    $action = $data['action'] ?? '';

    if ($action === 'mark_read') {
        $stmt = $conn->prepare("UPDATE user_notifications SET is_read = 1 WHERE LOWER(username) = LOWER(?)");
        $stmt->bind_param("s", $user);
        $stmt->execute();
        ob_clean();
        echo json_encode(["ok" => true]);
        exit;
    }
}

ob_clean();
echo json_encode(["ok" => false, "error" => "unknown_action"]);
exit;
