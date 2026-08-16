<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);
header("Content-Type: application/json; charset=UTF-8");
require_once "db.php";

$levels = [];
$records = [];

// Fetch all database levels
$q = $conn->query("SELECT * FROM custom_levels ORDER BY id ASC");
if($q) {
    while($r = $q->fetch_assoc()) {
        $levels[] = $r;
    }
}

// Fetch all database records
$q2 = $conn->query("SELECT * FROM custom_records ORDER BY id ASC");
if($q2) {
    while($r = $q2->fetch_assoc()) {
        $records[] = $r;
    }
}

ob_clean();
echo json_encode(["ok" => true, "levels" => $levels, "records" => $records]);
exit;
