// Vercel Serverless Function: ZexiPay Signed Webhook Receiver
// Security: HMAC-SHA256 signature verification

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const stamp = req.headers['x-zexipay-timestamp'] || '';
  const eventId = req.headers['x-zexipay-event-id'] || '';
  const signature = req.headers['x-zexipay-signature-v2'] || '';
  const secret = process.env.ZEXIPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.warn('ZEXIPAY_WEBHOOK_SECRET is not configured.');
    return res.status(500).json({ error: 'Webhook secret not configured on server' });
  }

  // Get raw body
  let rawBody = '';
  if (typeof req.body === 'string') {
    rawBody = req.body;
  } else if (Buffer.isBuffer(req.body)) {
    rawBody = req.body.toString('utf8');
  } else {
    rawBody = JSON.stringify(req.body);
  }

  // Verify timestamp within 5 minutes (300 seconds)
  const now = Math.floor(Date.now() / 1000);
  if (!/^\d+$/.test(stamp) || Math.abs(now - parseInt(stamp, 10)) > 300) {
    return res.status(401).json({ error: 'Timestamp expired or invalid' });
  }

  // Calculate HMAC-SHA256 signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${stamp}.${eventId}.${rawBody}`)
    .digest('hex');

  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return res.status(401).json({ error: 'Invalid HMAC signature' });
  }

  const event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);

  console.log('Verified ZexiPay Webhook Event:', event);

  // Here: Fulfill diamond top-up order via database or topup API
  // e.g. credit diamonds to event.data.order_id

  return res.status(200).json({ received: true });
};
