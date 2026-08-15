<?php
header("Content-Type: application/json");
require "db.php";

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $levelId = intval($_GET["level_id"] ?? 0);
    $stmt = $conn->prepare("SELECT username, text, created_at FROM comments WHERE level_id = ? ORDER BY created_at DESC");
    $stmt->bind_param("i", $levelId);
    $stmt->execute();
    $res = $stmt->get_result();
    $out = [];
    while ($row = $res->fetch_assoc()) $out[] = $row;
    echo json_encode($out);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $username = requireLogin();
    $data = json_decode(file_get_contents("php://input"), true);
    $levelId = intval($data["level_id"] ?? 0);
    $text = trim($data["text"] ?? "");

    if (!$levelId || !$text || strlen($text) > 500) {
        http_response_code(400);
        echo json_encode(["error" => "invalid_input"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO comments (level_id, username, text) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $levelId, $username, $text);
    $stmt->execute();

    echo json_encode(["ok" => true]);
    exit;
}
