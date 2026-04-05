const express = require('express');
const crypto = require('crypto');
const router = express.Router();

function getDb() {
  try { return require('../db/db'); } catch { return require('../db/inMemoryDb'); }
}

// In-memory verification codes (in production, use Redis or DB)
const verificationCodes = new Map();

// Send verification email
router.post('/send-verification', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const code = crypto.randomInt(100000, 999999).toString();
  verificationCodes.set(req.user.id, { code, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min

  // In production, send actual email via SendGrid/SES/etc.
  // For now, log it and return it in dev mode
  console.log(`[EMAIL] Verification code for ${req.user.email}: ${code}`);

  res.json({
    message: 'Verification code sent',
    // Only include code in dev mode for testing
    ...(process.env.NODE_ENV !== 'production' && { devCode: code }),
  });
});

// Verify email with code
router.post('/verify-email', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Verification code required' });

  const stored = verificationCodes.get(req.user.id);
  if (!stored) return res.status(400).json({ error: 'No verification code found. Request a new one.' });
  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(req.user.id);
    return res.status(400).json({ error: 'Code expired. Request a new one.' });
  }
  if (stored.code !== code) return res.status(400).json({ error: 'Invalid code' });

  verificationCodes.delete(req.user.id);

  const db = getDb();
  await db.updateUser(req.user.id, { isVerified: true });

  res.json({ message: 'Email verified successfully', verified: true });
});

module.exports = router;
