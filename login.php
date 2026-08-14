<?php
session_start();
header('Content-Type: application/json');
require_once 'db.php';

$raw = file_get_contents('php://input');
$json = json_decode($raw, true);

$user = trim($_POST['username'] ?? $json['username'] ?? '');
$pass = trim($_POST['password'] ?? $json['password'] ?? '');

if (empty($user) || empty($pass)) {
    echo json_encode(['status' => 'error', 'message' => 'Please enter username and password.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, username, password FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1");
    $stmt->execute([$user]);
    $account = $stmt->fetch();

    if ($account && password_verify($pass, $account['password'])) {
        $_SESSION['user_id'] = $account['id'];
        $_SESSION['username'] = $account['username'];
        echo json_encode([
            'status' => 'success',
            'message' => 'Login successful!',
            'username' => $account['username']
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid username or password.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Server query error.']);
}
?>
