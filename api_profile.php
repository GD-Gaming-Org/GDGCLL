<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once "db.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT username, role, title, avatar, banner, is_banned, created_at FROM users";
    $result = $conn->query($sql);
    $profiles = [];
    $allUsers = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $profiles[$row['username']] = [
                'role' => $row['role'],
                'title' => $row['title'],
                'avatar' => $row['avatar'],
                'banner' => $row['banner'],
                'is_banned' => (int)$row['is_banned'],
                'created_at' => $row['created_at']
            ];
            $allUsers[] = [
                'username' => $row['username'],
                'role' => $row['role'],
                'title' => $row['title'],
                'avatar' => $row['avatar'],
                'created_at' => $row['created_at']
            ];
        }
    }
    ob_clean();
    echo json_encode(["ok" => true, "profiles" => $profiles, "users" => $allUsers]);
    exit;
}

if ($method === 'POST') {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true) ?: [];

    $user = trim($data['username'] ?? '');
    $type = trim($data['type'] ?? '');
    $url = trim($data['url'] ?? '');

    if (!$user || !in_array($type, ['avatar', 'banner'])) {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "invalid_data"]);
        exit;
    }

    $col = ($type === 'avatar') ? 'avatar' : 'banner';
    $stmt = $conn->prepare("UPDATE users SET $col = ? WHERE username = ?");
    if ($stmt) {
        $stmt->bind_param("ss", $url, $user);
        $stmt->execute();
        ob_clean();
        echo json_encode(["ok" => true]);
    } else {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "db_error"]);
    }
    exit;
}
