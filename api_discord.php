<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once "db.php";

$raw = file_get_contents("php://input");
$data = json_decode($raw, true) ?: [];

$action = $data['action'] ?? '';
$discord_id = trim($data['discord_id'] ?? '');
$target_user = trim($data['username'] ?? '');

if (!$discord_id) {
    ob_clean();
    echo json_encode(["ok" => false, "error" => "missing_discord_id"]);
    exit;
}

if ($action === 'link') {
    if (!$target_user) {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "missing_username"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, username FROM users WHERE discord_id = ?");
    $stmt->bind_param("s", $discord_id);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();

    if ($res && strtolower($res['username']) !== strtolower($target_user)) {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "already_linked"]);
        exit;
    }

    $link_stmt = $conn->prepare("UPDATE users SET discord_id = ? WHERE username = ?");
    $link_stmt->bind_param("ss", $discord_id, $target_user);
    $link_stmt->execute();

    ob_clean();
    echo json_encode(["ok" => true]);
    exit;
}

if ($action === 'login') {
    $stmt = $conn->prepare("SELECT username, role, is_banned FROM users WHERE discord_id = ?");
    $stmt->bind_param("s", $discord_id);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();

    if ($res) {
        if ((int)$res['is_banned'] === 1) {
            ob_clean();
            echo json_encode(["ok" => false, "error" => "banned"]);
            exit;
        }
        ob_clean();
        echo json_encode(["ok" => true, "username" => $res['username'], "role" => $res['role'] ?? 'user']);
        exit;
    } else {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "not_linked"]);
        exit;
    }
}

ob_clean();
echo json_encode(["ok" => false, "error" => "invalid_action"]);
exit;
