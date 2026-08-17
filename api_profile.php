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
    // We now fetch everyone, including their role, so we know who is registered
    $q = $conn->query("SELECT username, role, avatar, banner, title FROM users");
    $data = [];
    if ($q) {
        while ($r = $q->fetch_assoc()) {
            $data[$r['username']] = [
                "role" => $r['role'],
                "avatar" => $r['avatar'],
                "banner" => $r['banner'],
                "title" => $r['title']
            ];
        }
    }
    ob_clean();
    echo json_encode(["ok" => true, "profiles" => $data]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);
    
    $username = trim($_SESSION['username'] ?? $data['username'] ?? "");
    if (empty($username)) {
        ob_clean(); 
        echo json_encode(["ok" => false, "error" => "not_logged_in"]); 
        exit;
    }
    
    $type = $data['type'] ?? ''; 
    $image = $data['image'] ?? '';
    
    if (empty($image)) {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "Image processing failed. File might be empty."]);
        exit;
    }
    
    if ($type === 'avatar') {
        $stmt = $conn->prepare("UPDATE users SET avatar = ? WHERE LOWER(username) = LOWER(?)");
    } elseif ($type === 'banner') {
        $stmt = $conn->prepare("UPDATE users SET banner = ? WHERE LOWER(username) = LOWER(?)");
    } else {
        ob_clean(); 
        echo json_encode(["ok" => false, "error" => "invalid_type"]); 
        exit;
    }

    if (!$stmt) {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "Database error: " . $conn->error]);
        exit;
    }
    
    $stmt->bind_param("ss", $image, $username);
    
    if ($stmt->execute()) {
        ob_clean();
        echo json_encode(["ok" => true]);
    } else {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "Failed to save: " . $stmt->error]);
    }
    exit;
}
