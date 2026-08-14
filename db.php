<?php
$host = "sql206.infinityfree.com";
$user = "if0_42655486";
$pass = "GDGCLL123";
$db   = "if0_42655486_XXX";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "db_connect_failed"]);
    exit;
}
$conn->set_charset("utf8mb4");
