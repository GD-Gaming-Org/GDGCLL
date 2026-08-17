<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);
header("Content-Type: application/json; charset=UTF-8");
require_once "db.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);

    $username = trim($_SESSION['username'] ?? $data['username'] ?? "");
    if (empty($username)) {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "You must log in to submit a record."]);
        exit;
    }

    $lvlName = trim($data['level_name'] ?? '');
    $pct = intval($data['percent'] ?? 100);
    $link = trim($data['link'] ?? '');
    $mob = intval($data['is_mobile'] ?? 0);

    if (!$lvlName || !$link) {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "Level name and proof link are required."]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO pending_records (level_name, username, percent, link, is_mobile) VALUES (?, ?, ?, ?, ?)");
    if ($stmt) {
        $stmt->bind_param("ssisi", $lvlName, $username, $pct, $link, $mob);
        $stmt->execute();
        ob_clean();
        echo json_encode(["ok" => true]);
    } else {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "Database error."]);
    }
    exit;
}
