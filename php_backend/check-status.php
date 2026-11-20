<?php
// PHP Backend: ZexiPay Check Order Status
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$orderId = $_GET['order_id'] ?? '';
if (empty($orderId) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);
    $orderId = $body['order_id'] ?? '';
}

if (empty($orderId)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing order_id']);
    exit;
}

$apiKey = getenv('ZEXIPAY_API_KEY') ?: '';
$apiSecret = getenv('ZEXIPAY_API_SECRET') ?: '';

if (empty($apiKey) || empty($apiSecret)) {
    echo json_encode([
        'status' => 'success',
        'data' => [
            'order_id' => $orderId,
            'payment_status' => 'pending'
        ]
    ]);
    exit;
}

$ch = curl_init('https://zexipay.com/api/check-status');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['order_id' => $orderId]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-API-Key: ' . $apiKey,
    'X-API-Secret: ' . $apiSecret
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode ?: 200);
echo $response;
