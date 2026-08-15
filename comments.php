<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);
header("Content-Type: application/json; charset=UTF-8");

require_once "db.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $level_id = isset($_GET['level_id']) ? intval($_GET['level_id']) : 0;
    $stmt = $conn->prepare("SELECT username, comment, created_at FROM comments WHERE level_id = ? ORDER BY created_at DESC");
    if (!$stmt) {
        ob_clean();
        echo json_encode(["ok" => true, "data" => []]);
        exit;
    }
    $stmt->bind_param("i", $level_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $comments = [];
    while ($row = $result->fetch_assoc()) {
        $comments[] = $row;
    }
    
    ob_clean();
    echo json_encode(["ok" => true, "data" => $comments]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);
    
    $username = trim($_SESSION['username'] ?? $data['username'] ?? "");
    $level_id = isset($data['level_id']) ? intval($data['level_id']) : 0;
    $comment = trim($data['comment'] ?? "");
    
    if (empty($username)) {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "not_logged_in"]);
        exit;
    }
    
    if (empty($comment)) {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "empty_comment"]);
        exit;
    }
    
    $stmt = $conn->prepare("INSERT INTO comments (level_id, username, comment) VALUES (?, ?, ?)");
    if (!$stmt) {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "table_not_found"]);
        exit;
    }
    
    $stmt->bind_param("iss", $level_id, $username, $comment);
    
    if ($stmt->execute()) {
        ob_clean();
        echo json_encode(["ok" => true]);
    } else {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "insert_failed"]);
    }
    exit;
}
