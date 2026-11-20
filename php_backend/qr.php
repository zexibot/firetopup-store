<?php
$d = isset($_GET['d']) ? $_GET['d'] : '';
$s = isset($_GET['s']) ? intval($_GET['s']) : 280;

if (empty($d)) {
    http_response_code(400);
    exit('Missing data');
}

$url = "https://api.qrserver.com/v1/create-qr-code/?size={$s}x{$s}&margin=10&data=" . urlencode($d);
header("Location: $url");
exit;
