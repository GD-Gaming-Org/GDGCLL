<?php
session_start();
header("Content-Type: application/json");
require "db.php";

if (!isset($_SESSION["username"])) {
    echo json_encode(["loggedIn" => false]);
    exit;
}

$stmt = $conn->prepare("SELECT role, title, vip, avatar FROM users WHERE username = ?");
$stmt->bind_param("s", $_SESSION["username"]);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();

echo json_encode([
    "loggedIn" => true,
    "username" => $_SESSION["username"],
    "role" => $row["role"],
    "title" => $row["title"],
    "vip" => (bool)$row["vip"],
    "avatar" => $row["avatar"]
]);
