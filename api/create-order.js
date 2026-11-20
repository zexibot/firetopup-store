// Vercel Serverless Function: Create Order via ZexiPay
// Security: Keeps X-API-Key and X-API-Secret strictly on the server

const productsTable = require('./products-table.js');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { productId, uid, nickname, customerMobile, callbackUrl } = body;

    if (!productId || !uid) {
      return res.status(400).json({ status: 'error', message: 'Missing productId or UID' });
    }

    // Authoritative Server-side Price Lookup
    const product = productsTable[productId];
    if (!product) {
      return res.status(400).json({ status: 'error', message: 'Invalid product selected' });
    }

    const orderId = `FF_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;
    const apiKey = process.env.ZEXIPAY_API_KEY;
    const apiSecret = process.env.ZEXIPAY_API_SECRET;

    // Check if live ZexiPay credentials are provided
    if (!apiKey || !apiSecret || apiKey.includes('your_server_side')) {
      // Return safe fallback for sandbox / development preview
      const fallbackUpi = `upi://pay?pa=test@upi&pn=FireTopUp&am=${product.price}&cu=INR&tr=${orderId}&tn=${encodeURIComponent(product.name + ' UID ' + uid)}`;
      return res.status(200).json({
        status: 'success',
        mode: 'sandbox_preview',
        data: {
          order_id: orderId,
          amount: product.price,
          currency: 'INR',
          customer_name: nickname || `Player ${uid}`,
          payment_url: fallbackUpi,
          upi_uri: fallbackUpi,
          qr_image_url: `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(fallbackUpi)}`,
          expires_at_unix: Math.floor(Date.now() / 1000) + 3600
        }
      });
    }

    // Live ZexiPay Integration
    const createOrderPayload = {
      order_id: orderId,
      amount: product.price,
      customer_name: (nickname || `UID_${uid}`).replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 50) || 'Gamer',
      customer_mobile: customerMobile || '+919876543210',
      callback_url: callbackUrl || (req.headers.origin ? `${req.headers.origin}/store.html` : 'https://free-fire-topup.shop'),
      is_reusable: false
    };

    const zexiResp = await fetch('https://zexipay.com/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-API-Secret': apiSecret
      },
      body: JSON.stringify(createOrderPayload)
    });

    const zexiData = await zexiResp.json();

    if (!zexiResp.ok || zexiData.status !== 'success') {
      return res.status(zexiResp.status || 400).json({
        status: 'error',
        message: zexiData.message || 'Failed to create ZexiPay order'
      });
    }

    // Try prepare in-app embedded checkout
    let checkoutDetails = {};
    try {
      const prepResp = await fetch('https://zexipay.com/api/prepare-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          'X-API-Secret': apiSecret
        },
        body: JSON.stringify({ order_id: orderId })
      });
      const prepData = await prepResp.json();
      if (prepResp.ok && prepData.status === 'success' && prepData.data) {
        checkoutDetails = prepData.data;
      }
    } catch (_) {}

    const orderData = zexiData.data || {};

    return res.status(200).json({
      status: 'success',
      data: {
        order_id: orderId,
        amount: product.price,
        currency: 'INR',
        payment_url: orderData.payment_url || checkoutDetails.payment_url,
        upi_uri: checkoutDetails.upi_uri || orderData.payment_url,
        qr_image_url: checkoutDetails.qr_image_url || null,
        expires_at_unix: checkoutDetails.expires_at_unix || orderData.expires_at || (Math.floor(Date.now() / 1000) + 3600)
      }
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message || 'Internal Server Error' });
  }
};
