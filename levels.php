<?php
header("Content-Type: application/json");
require "db.php";

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $levels = [];
    $res = $conn->query("SELECT * FROM levels ORDER BY rank_order ASC");
    while ($lv = $res->fetch_assoc()) {
        $recStmt = $conn->prepare("SELECT username, percent, link, mobile FROM records WHERE level_id = ? ORDER BY percent DESC, created_at ASC");
        $recStmt->bind_param("i", $lv["id"]);
        $recStmt->execute();
        $recs = [];
        $recRes = $recStmt->get_result();
        while ($r = $recRes->fetch_assoc()) {
            $r["mobile"] = (bool)$r["mobile"];
            $recs[] = $r;
        }
        $lv["records"] = $recs;
        $levels[] = $lv;
    }
    echo json_encode($levels);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    requireAdmin($conn);
    $data = json_decode(file_get_contents("php://input"), true);

    $gdId = intval($data["gd_id"] ?? 0);
    $name = trim($data["name"] ?? "");
    $creators = trim($data["creators"] ?? "");
    $verifier = trim($data["verifier"] ?? "");
    $verification = trim($data["verification"] ?? "");
    $qualify = intval($data["percent_to_qualify"] ?? 50);
    $password = trim($data["password"] ?? "Free To Copy");
    $rank = intval($data["rank_order"] ?? 999);

    if (!$name || !$verifier || !$verification) {
        http_response_code(400);
        echo json_encode(["error" => "missing_fields"]);
        exit;
    }

    $conn->query("UPDATE levels SET rank_order = rank_order + 1 WHERE rank_order >= $rank");

    $stmt = $conn->prepare("INSERT INTO levels (gd_id, name, creators, verifier, verification, percent_to_qualify, password, rank_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("issssisi", $gdId, $name, $creators, $verifier, $verification, $qualify, $password, $rank);
    $stmt->execute();

    echo json_encode(["ok" => true, "id" => $stmt->insert_id]);
    exit;
}
