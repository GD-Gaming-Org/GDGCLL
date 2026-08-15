<?php
header("Content-Type: application/json");
require "db.php";

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $res = $conn->query("SELECT username, role, title, vip, avatar FROM users WHERE role != 'player' OR vip = 1 ORDER BY username ASC");
    $out = [];
    while ($row = $res->fetch_assoc()) {
        $row["vip"] = (bool)$row["vip"];
        $out[] = $row;
    }
    echo json_encode($out);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    requireAdmin($conn);
    $data = json_decode(file_get_contents("php://input"), true);
    $username = trim($data["username"] ?? "");
    $role = trim($data["role"] ?? "player");
    $title = trim($data["title"] ?? "");
    $vip = !empty($data["vip"]) ? 1 : 0;

    $stmt = $conn->prepare("UPDATE users SET role = ?, title = ?, vip = ? WHERE username = ?");
    $stmt->bind_param("ssis", $role, $title, $vip, $username);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        http_response_code(404);
        echo json_encode(["error" => "user_not_found"]);
        exit;
    }

    echo json_encode(["ok" => true]);
    exit;
}
