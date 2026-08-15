<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
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
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);

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

if ($_SERVER["REQUEST_METHOD"] === "DELETE") {
    $username = requireLogin();
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);
    $commentId = intval($data["id"] ?? 0);

    $stmt = $conn->prepare("SELECT username FROM comments WHERE id = ?");
    $stmt->bind_param("i", $commentId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    $roleStmt = $conn->prepare("SELECT role FROM users WHERE username = ?");
    $roleStmt->bind_param("s", $username);
    $roleStmt->execute();
    $roleRow = $roleStmt->get_result()->fetch_assoc();
    $isMod = $roleRow && in_array($roleRow["role"], ["admin","owner","developer"]);

    if (!$row || (strtolower($row["username"]) !== strtolower($username) && !$isMod)) {
        http_response_code(403);
        echo json_encode(["error" => "not_allowed"]);
        exit;
    }

    $del = $conn->prepare("DELETE FROM comments WHERE id = ?");
    $del->bind_param("i", $commentId);
    $del->execute();

    echo json_encode(["ok" => true]);
    exit;
}
