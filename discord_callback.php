<?php
ob_start();
session_start();
require_once "db.php";


$client_id     = 'YOUR_DISCORD_CLIENT_ID';
$client_secret = 'YOUR_DISCORD_CLIENT_SECRET';
$redirect_uri  = 'https://yourdomain.com/discord_callback.php';

$code = $_GET['code'] ?? '';
$state = $_GET['state'] ?? ''; 

if (!$code) {
    die("No authorization code provided. <a href='/'>Go Home</a>");
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
$response = curl_exec($ch);
curl_close($ch);

$token_data = json_decode($response, true);
$access_token = $token_data['access_token'] ?? null;

if (!$access_token) {
    die("Failed to fetch access token from Discord. <a href='/'>Go Home</a>");
}


$user_url = "https://discord.com/api/users/@me";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $user_url);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $access_token"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$user_response = curl_exec($ch);
curl_close($ch);

$discord_user = json_decode($user_response, true);
$discord_id   = $discord_user['id'] ?? null;
$discord_name = $discord_user['username'] ?? '';

if (!$discord_id) {
    die("Failed to fetch Discord user information. <a href='/'>Go Home</a>");
}


$logged_in_user = $_COOKIE['gd_session_user'] ?? ''; 


$stmt = $conn->prepare("SELECT id, username, role, is_banned FROM users WHERE discord_id = ?");
$stmt->bind_param("s", $discord_id);
$stmt->execute();
$res = $stmt->get_result();
$existing_account = $res->fetch_assoc();

if ($state === 'link' && $logged_in_user) {
    
    if ($existing_account && strtolower($existing_account['username']) !== strtolower($logged_in_user)) {
        die("<script>alert('This Discord account is already linked to another user!'); window.location.href='/#profile';</script>");
    }

    $link_stmt = $conn->prepare("UPDATE users SET discord_id = ? WHERE username = ?");
    $link_stmt->bind_param("ss", $discord_id, $logged_in_user);
    $link_stmt->execute();

    echo "<script>
        alert('Discord account successfully linked!');
        window.location.href = '/#profile';
    </script>";
    exit;
} else {
   
    if ($existing_account) {
        if ($existing_account['is_banned'] == 1) {
            die("<script>alert('This account is banned.'); window.location.href='/';</script>");
        }
        $uName = $existing_account['username'];
        $uRole = $existing_account['role'];
        echo "<script>
            localStorage.setItem('gd_user', " . json_encode($uName) . ");
            localStorage.setItem('gd_role', " . json_encode($uRole) . ");
            alert('Successfully logged in as $uName!');
            window.location.href = '/';
        </script>";
        exit;
    } else {
        die("<script>alert('No GDGCLL account is linked to this Discord account yet. Please log in normally and link it on your profile first.'); window.location.href='/';</script>");
    }
}
