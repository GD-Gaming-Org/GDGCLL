<?php
ob_start();
session_start();
require_once "db.php";

$client_id     = '1544277500555825185';
$client_secret = 'lwk9QEMngPoojqb9i_vwTeiMC3LgOUr5';
$redirect_uri  = 'https://gdgcll.rf.gd/discord_callback.php';

$code = $_GET['code'] ?? '';
$state = $_GET['state'] ?? '';

if (!$code) {
    echo "<script>alert('No authorization code provided.'); window.location.href='/';</script>";
    exit;
}

$token_url = "https://discord.com/api/oauth2/token";
$data = [
    'client_id'     => $client_id,
    'client_secret' => $client_secret,
    'grant_type'    => 'authorization_code',
    'code'          => $code,
    'redirect_uri'  => $redirect_uri,
    'scope'         => 'identify'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $token_url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded',
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
]);
$response = curl_exec($ch);
$curl_err = curl_error($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false || !empty($curl_err)) {
    echo "<script>alert('Server Connection Error: " . addslashes($curl_err) . " (HTTP " . $http_code . ")'); window.location.href='/';</script>";
    exit;
}

$token_data = json_decode($response, true);
$access_token = $token_data['access_token'] ?? null;

if (!$access_token) {
    $err_msg = $token_data['error_description'] ?? $token_data['error'] ?? $response;
    echo "<script>alert('Discord Token Error: " . addslashes($err_msg) . "'); window.location.href='/';</script>";
    exit;
}

$user_url = "https://discord.com/api/users/@me";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $user_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $access_token",
    "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
]);
$user_response = curl_exec($ch);
curl_close($ch);

$discord_user = json_decode($user_response, true);
$discord_id   = $discord_user['id'] ?? null;

if (!$discord_id) {
    echo "<script>alert('Failed to fetch Discord profile.'); window.location.href='/';</script>";
    exit;
}

$stmt = $conn->prepare("SELECT id, username, role, is_banned FROM users WHERE discord_id = ?");
$stmt->bind_param("s", $discord_id);
$stmt->execute();
$res = $stmt->get_result();
$existing_account = $res->fetch_assoc();

if (strpos($state, 'link:') === 0) {
    $target_user = substr($state, 5);
    if ($existing_account && strtolower($existing_account['username']) !== strtolower($target_user)) {
        echo "<script>alert('This Discord account is already linked to another user!'); window.location.href='/#profile';</script>";
        exit;
    }
    $link_stmt = $conn->prepare("UPDATE users SET discord_id = ? WHERE username = ?");
    $link_stmt->bind_param("ss", $discord_id, $target_user);
    $link_stmt->execute();
    echo "<script>alert('Discord account successfully linked!'); window.location.href='/#profile';</script>";
    exit;
} else {
    if ($existing_account) {
        if ((int)$existing_account['is_banned'] === 1) {
            echo "<script>alert('This account is banned.'); window.location.href='/';</script>";
            exit;
        }
        $uName = $existing_account['username'];
        $uRole = $existing_account['role'];
        echo "<script>
            localStorage.setItem('gd_user', " . json_encode($uName) . ");
            localStorage.setItem('gd_role', " . json_encode($uRole) . ");
            alert('Successfully logged in as ' + " . json_encode($uName) . ");
            window.location.href = '/';
        </script>";
        exit;
    } else {
        echo "<script>alert('No account linked with this Discord account. Please log in normally and link it via your profile.'); window.location.href='/';</script>";
        exit;
    }
}
