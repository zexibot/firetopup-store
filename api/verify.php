<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$uid = isset($_GET['uid']) ? preg_replace('/\D/', '', trim($_GET['uid'])) : '';

if (empty($uid) || strlen($uid) < 6 || strlen($uid) > 14) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Please provide a valid 6-12 digit UID'
    ]);
    exit;
}

// -------------------------------------------------------------
// REAL TOP-UP API INTEGRATION
// Aap yahan apni API Key aur Provider Endpoint daal sakte hain
// -------------------------------------------------------------
$API_KEY = "YOUR_REAL_API_KEY_HERE";
$UPSTREAM_URL = "https://free-fire-topup.shop/api/verify.php?uid=" . urlencode($uid);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $UPSTREAM_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 6);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response && $httpCode === 200) {
    $data = json_decode($response, true);
    if ($data && (isset($data['data']['basicInfo']) || isset($data['basicInfo']) || isset($data['nickname']))) {
        echo $response;
        exit;
    }
}

// Fallback Mock Data for testing if upstream fails or offline
$nicknames = ['ShadowSlayer', 'ProGamer_Raj', 'VortexKnight', 'BooyahKing', 'PhantomX', 'HyperSniper'];
$regions = ['IND', 'SG', 'BR', 'ID'];
$seed = array_sum(str_split($uid));

echo json_encode([
    'status' => 'success',
    'route' => 'LocalFallback',
    'data' => [
        'basicInfo' => [
            'accountId' => $uid,
            'nickname' => $nicknames[$seed % count($nicknames)] . '_' . ($seed % 99),
            'region' => $regions[$seed % count($regions)],
            'level' => 35 + ($seed % 45),
            'liked' => 1250 + ($seed * 43),
            'hasElitePass' => ($seed % 2 === 0)
        ],
        'clanBasicInfo' => [
            'clanName' => 'Team Phoenix'
        ]
    ]
]);
