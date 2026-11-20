<?php
// PHP Backend: ZexiPay Create Order
// Security: Never exposes API Key & Secret to the client

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];

$productId = $body['productId'] ?? '';
$uid = $body['uid'] ?? '';
$nickname = $body['nickname'] ?? '';
$customerMobile = $body['customerMobile'] ?? '+919876543210';
$callbackUrl = $body['callbackUrl'] ?? '';

// Authoritative prices
$catalog = [
    'p2' => ['price' => '88.00', 'name' => '310 Diamonds'],
    'p3' => ['price' => '119.00', 'name' => '520 Diamonds'],
    'p4' => ['price' => '149.00', 'name' => '1060 Diamonds'],
    'p5' => ['price' => '249.00', 'name' => '2180 Diamonds'],
    'p6' => ['price' => '599.00', 'name' => '5600 Diamonds'],
    'p16' => ['price' => '99.00', 'name' => 'Weekly Pass'],
    'p17' => ['price' => '299.00', 'name' => 'Monthly Pass'],
    'p18' => ['price' => '259.00', 'name' => '30 D EVO ACCESS'],
    'p7' => ['price' => '149.00', 'name' => 'Booyah Pass'],
    'p8' => ['price' => '299.00', 'name' => 'Booyah Pass Plus'],
];

if (!isset($catalog[$productId])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid product']);
    exit;
}

$prod = $catalog[$productId];
$orderId = 'FF_' . round(microtime(true) * 1000) . '_' . rand(1000, 9999);

$apiKey = getenv('ZEXIPAY_API_KEY') ?: '';
$apiSecret = getenv('ZEXIPAY_API_SECRET') ?: '';

if (empty($apiKey) || empty($apiSecret)) {
    // Sandbox preview mode
    $fallbackUpi = "upi://pay?pa=test@upi&pn=FireTopUp&am={$prod['price']}&cu=INR&tr={$orderId}&tn=" . urlencode($prod['name'] . " UID " . $uid);
    echo json_encode([
        'status' => 'success',
        'mode' => 'sandbox_preview',
        'data' => [
            'order_id' => $orderId,
            'amount' => $prod['price'],
            'payment_url' => $fallbackUpi,
            'upi_uri' => $fallbackUpi,
            'qr_image_url' => "https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=" . urlencode($fallbackUpi),
            'expires_at_unix' => time() + 3600
        ]
    ]);
    exit;
}

$payload = json_encode([
    'order_id' => $orderId,
    'amount' => $prod['price'],
    'customer_name' => substr(preg_replace('/[^a-zA-Z0-9 _-]/', '', $nickname ?: 'UID_' . $uid), 0, 50),
    'customer_mobile' => $customerMobile,
    'callback_url' => $callbackUrl,
    'is_reusable' => false
]);

$ch = curl_init('https://zexipay.com/api/create-order');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-API-Key: ' . $apiKey,
    'X-API-Secret: ' . $apiSecret
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$zexiData = json_decode($response, true);

if ($httpCode >= 200 && $httpCode < 300 && isset($zexiData['status']) && $zexiData['status'] === 'success') {
    // Try in-app prepare checkout
    $checkoutDetails = [];
    $ch2 = curl_init('https://zexipay.com/api/prepare-checkout');
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch2, CURLOPT_POST, true);
    curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode(['order_id' => $orderId]));
    curl_setopt($ch2, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-API-Key: ' . $apiKey,
        'X-API-Secret: ' . $apiSecret
    ]);
    $resp2 = curl_exec($ch2);
    curl_close($ch2);
    $data2 = json_decode($resp2, true);
    if (isset($data2['data'])) {
        $checkoutDetails = $data2['data'];
    }

    $orderData = $zexiData['data'] ?? [];

    echo json_encode([
        'status' => 'success',
        'data' => [
            'order_id' => $orderId,
            'amount' => $prod['price'],
            'payment_url' => $orderData['payment_url'] ?? ($checkoutDetails['payment_url'] ?? ''),
            'upi_uri' => $checkoutDetails['upi_uri'] ?? ($orderData['payment_url'] ?? ''),
            'qr_image_url' => $checkoutDetails['qr_image_url'] ?? null,
            'expires_at_unix' => $checkoutDetails['expires_at_unix'] ?? (time() + 3600)
        ]
    ]);
} else {
    http_response_code($httpCode ?: 400);
    echo $response ?: json_encode(['status' => 'error', 'message' => 'Failed to create ZexiPay order']);
}
