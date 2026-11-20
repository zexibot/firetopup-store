// Vercel Serverless Function: Check Order Status via ZexiPay
// Security: Confirms payments with server-side API Secret

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const orderId = req.method === 'POST'
    ? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body)?.order_id
    : req.query.order_id;

  if (!orderId) {
    return res.status(400).json({ status: 'error', message: 'Missing order_id' });
  }

  const apiKey = process.env.ZEXIPAY_API_KEY;
  const apiSecret = process.env.ZEXIPAY_API_SECRET;

  if (!apiKey || !apiSecret || apiKey.includes('your_server_side')) {
    // Development sandbox check
    return res.status(200).json({
      status: 'success',
      data: {
        order_id: orderId,
        payment_status: 'pending',
        message: 'Sandbox mode: Set ZEXIPAY_API_KEY and ZEXIPAY_API_SECRET on Vercel'
      }
    });
  }

  try {
    const zexiResp = await fetch('https://zexipay.com/api/check-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-API-Secret': apiSecret
      },
      body: JSON.stringify({ order_id: orderId })
    });

    const data = await zexiResp.json();
    return res.status(zexiResp.status || 200).json(data);
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message || 'Status check failed' });
  }
};
