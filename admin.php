if ($action === 'add_level') {
    $name = trim($data['name'] ?? '');
    $creators = trim($data['creators'] ?? '');
    $verifier = trim($data['verifier'] ?? '');
    $vLink = trim($data['link'] ?? '');
    $qualify = intval($data['qualify'] ?? 100);
    $lvlId = trim($data['level_id'] ?? '');
    $pass = trim($data['password'] ?? 'Free to copy');
    $rank = intval($data['rank'] ?? 999); // <-- New Rank Field

    if (!$name || !$verifier || !$vLink) {
        ob_clean();
        echo json_encode(["ok" => false, "error" => "missing_fields"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO custom_levels (name, creators, verifier, verification_link, percent_qualify, level_id_string, password, placement_rank) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    if($stmt){
        $stmt->bind_param("ssssissi", $name, $creators, $verifier, $vLink, $qualify, $lvlId, $pass, $rank);
        $stmt->execute();
    }
    ob_clean();
    echo json_encode(["ok" => true]);
    exit;
}
