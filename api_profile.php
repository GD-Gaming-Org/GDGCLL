<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
require_once "db.php";

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $out = ["ok" => true, "profiles" => [], "users" => []];
    $res = $conn->query("SELECT username, role, is_banned, title FROM users");
    while ($r = $res->fetch_assoc()) {
        $out["users"][] = $r;
    }
    $res2 = $conn->query("SELECT username, avatar, banner, bio, youtube FROM profiles");
    if ($res2) {
        while ($r = $res2->fetch_assoc()) {
            $out["profiles"][$r['username']] = $r;
        }
    }
    ob_clean();
    die(json_encode($out));
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true) ?: [];
$user = trim($data['username'] ?? '');
$type = trim($data['type'] ?? '');
$val = trim($data['value'] ?? $data['url'] ?? '');

if (!$user || !$type) {
    ob_clean();
    die(json_encode(["ok" => false, "error" => "missing_data"]));
}

$conn->query("CREATE TABLE IF NOT EXISTS profiles (
    username VARCHAR(50) PRIMARY KEY,
    avatar TEXT,
    banner TEXT,
    bio TEXT,
    youtube VARCHAR(150)
)");

$allowed = ['avatar', 'banner', 'bio', 'youtube'];
if (!in_array($type, $allowed)) {
    ob_clean();
    die(json_encode(["ok" => false, "error" => "invalid_type"]));
}

$stmt = $conn->prepare("INSERT INTO profiles (username, $type) VALUES (?, ?) ON DUPLICATE KEY UPDATE $type = ?");
$stmt->bind_param("sss", $user, $val, $val);
$stmt->execute();

ob_clean();
die(json_encode(["ok" => true]));
