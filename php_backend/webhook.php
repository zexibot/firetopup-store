<?php
// PHP Webhook Receiver for ZexiPay Signed Notifications
header('Content-Type: application/json; charset=utf-8');

$raw = file_get_contents('php://input');
$stamp = $_SERVER['HTTP_X_ZEXIPAY_TIMESTAMP'] ?? '';
$id = $_SERVER['HTTP_X_ZEXIPAY_EVENT_ID'] ?? '';
$sig = $_SERVER['HTTP_X_ZEXIPAY_SIGNATURE_V2'] ?? '';
$secret = getenv('ZEXIPAY_WEBHOOK_SECRET') ?: '';

if (!$secret || !ctype_digit($stamp) || abs(time() - (int)$stamp) > 300
    || !hash_equals(hash_hmac('sha256', $stamp . '.' . $id . '.' . $raw, $secret), $sig)) {
    http_response_code(401);
    exit(json_encode(['error' => 'Invalid signature']));
}

$event = json_decode($raw, true);

// Fulfill order safely
http_response_code(200);
echo json_encode(['received' => true]);
