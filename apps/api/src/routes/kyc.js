const express = require('express');
const router = express.Router();

let stripeAdapter;
try { stripeAdapter = require('../services/provider-adapters/stripeAdapter'); } catch { stripeAdapter = null; }

function getDb() {
  try { return require('../db/db'); } catch { return require('../db/inMemoryDb'); }
}

// Start KYC verification (Stripe Identity)
router.post('/start', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const session = await stripeAdapter.createVerificationSession({
      userId: req.user.id,
      returnUrl: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/dashboard',
    });
    res.json({ sessionId: session.id, url: session.url, status: session.status });
  } catch (err) {
    console.error('KYC start error:', err);
    res.status(500).json({ error: 'Failed to start verification' });
  }
});

// Check KYC status
router.get('/status', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({
    isVerified: req.user.isVerified,
    identityVerified: req.user.identityVerified,
    addressVerified: req.user.addressVerified,
  });
});

// Webhook callback for verification completion (called by Stripe webhook)
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    if (event.type === 'identity.verification_session.verified') {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (userId) {
        const db = getDb();
        await db.updateUser(userId, { isVerified: true, identityVerified: true });
        console.log(`[KYC] User ${userId} verified via Stripe Identity`);
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('KYC webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
