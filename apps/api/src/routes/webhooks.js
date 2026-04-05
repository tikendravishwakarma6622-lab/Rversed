const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const webhookService = require('../services/webhookService');

const router = Router();

/**
 * Stripe webhook endpoint
 * Verify signature and handle events
 */
router.post('/stripe', (req, res) => {
  const sig = req.headers['stripe-signature'];
  const body = req.rawBody || JSON.stringify(req.body);

  try {
    const event = crypto.timingSafeEqual(
      Buffer.from(sig.split(',')[0].split('=')[1]),
      Buffer.from(
        crypto
          .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test')
          .update(body)
          .digest('hex')
      )
    )
      ? JSON.parse(body)
      : null;

    if (!event) {
      console.warn('Invalid Stripe webhook signature');
      return res.status(403).json({ error: 'invalid_signature' });
    }

    webhookService.handleStripeWebhook(event);
    return res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return res.status(400).json({ error: err.message });
  }
});

/**
 * Plaid webhook endpoint
 */
router.post('/plaid', (req, res) => {
  try {
    webhookService.handlePlaidWebhook(req.body);
    res.json({ received: true });
  } catch (err) {
    console.error('Plaid webhook error:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * Adyen webhook endpoint
 */
router.post('/adyen', (req, res) => {
  try {
    webhookService.handleAdyenWebhook(req.body);
    res.json({ notificationResponse: '[accepted]' });
  } catch (err) {
    console.error('Adyen webhook error:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
