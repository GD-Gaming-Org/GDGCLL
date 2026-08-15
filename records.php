<?php
header("Content-Type: application/json");
require "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    exit;
}

requireAdmin($conn);
$data = json_decode(file_get_contents("php://input"), true);

$levelId = intval($data["level_id"] ?? 0);
$username = trim($data["username"] ?? "");
$percent = intval($data["percent"] ?? 0);
$link = trim($data["link"] ?? "");
$mobile = !empty($data["mobile"]) ? 1 : 0;

if (!$levelId || !$username || !$link) {
    http_response_code(400);
    echo json_encode(["error" => "missing_fields"]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO records (level_id, username, percent, link, mobile) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("isisi", $levelId, $username, $percent, $link, $mobile);
$stmt->execute();

echo json_encode(["ok" => true]);
