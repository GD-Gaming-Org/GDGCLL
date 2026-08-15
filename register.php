<?php
header('Content-Type: application/json');
require_once 'db.php';

$raw = file_get_contents('php://input');
$json = json_decode($raw, true);

$user = trim($_POST['username'] ?? $json['username'] ?? '');
$pass = trim($_POST['password'] ?? $json['password'] ?? '');

if (empty($user) || empty($pass)) {
    echo json_encode(['status' => 'error', 'message' => 'Username and password are required.']);
    exit;
}

if (strlen($user) < 3) {
    echo json_encode(['status' => 'error', 'message' => 'Username must be at least 3 characters.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1");
    $stmt->execute([$user]);
    if ($stmt->fetch()) {
        echo json_encode(['status' => 'error', 'message' => 'Username already taken.']);
        exit;
    }

    $hashedPassword = password_hash($pass, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'user')");
    if ($stmt->execute([$user, $hashedPassword])) {
        echo json_encode(['status' => 'success', 'message' => 'Registration successful!']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to register account.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Server query error.']);
}
?>
