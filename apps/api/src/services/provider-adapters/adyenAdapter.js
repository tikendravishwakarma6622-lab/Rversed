// Adyen adapter — uses real @adyen/api-library when ADYEN_API_KEY is set, simulates otherwise.
const { v4: uuidv4 } = require('uuid');

const isConfigured = !!process.env.ADYEN_API_KEY;

async function charge(opts) {
  const { amountCents, currency = 'cny', paymentMethod, paymentDetails, metadata, idempotencyKey, user } = opts;

  if (isConfigured) {
    // Production: call Adyen Checkout API
    const fetch = require('node-fetch');
    const resp = await fetch(`${process.env.ADYEN_ENDPOINT || 'https://checkout-test.adyen.com'}/v71/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ADYEN_API_KEY,
        'Idempotency-Key': idempotencyKey || uuidv4(),
      },
      body: JSON.stringify({
        amount: { value: amountCents, currency: currency.toUpperCase() },
        reference: metadata?.transactionId || uuidv4(),
        paymentMethod: paymentDetails || { type: 'unionpay' },
        merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT || 'RversedECOM',
        returnUrl: `${process.env.FRONTEND_URL || 'https://rversed.com'}/payments/callback`,
        shopperReference: user?.id,
      }),
    });
    const data = await resp.json();
    if (data.resultCode === 'Authorised' || data.resultCode === 'Received') {
      return { id: data.pspReference, status: 'succeeded', raw: data };
    }
    if (data.resultCode === 'RedirectShopper') {
      return { id: data.pspReference || uuidv4(), status: 'pending', redirectUrl: data.action?.url, raw: data };
    }
    throw new Error(`Adyen payment ${data.resultCode}: ${data.refusalReason || 'declined'}`);
  }

  // Dev simulation
  console.log(`[ADYEN-SIM] Charging ${amountCents} ${currency} for tx ${metadata?.transactionId}`);
  return { id: `adyen_sim_${Date.now()}`, status: 'succeeded' };
}

async function refund(opts) {
  const { pspReference, amountCents, currency = 'cny' } = opts;
  if (isConfigured) {
    const fetch = require('node-fetch');
    const resp = await fetch(`${process.env.ADYEN_ENDPOINT || 'https://checkout-test.adyen.com'}/v71/payments/${pspReference}/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.ADYEN_API_KEY },
      body: JSON.stringify({
        amount: { value: amountCents, currency: currency.toUpperCase() },
        merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT || 'RversedECOM',
      }),
    });
    return await resp.json();
  }
  return { pspReference: `adyen_refund_sim_${Date.now()}`, status: 'received' };
}

module.exports = { charge, refund };
