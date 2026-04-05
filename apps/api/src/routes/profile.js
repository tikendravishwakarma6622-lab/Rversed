const express = require('express');
const db = require('../db/inMemoryDb');
const router = express.Router();

// Get business profile
router.get('/', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ profile: req.user.profile });
});

// Create / update business profile (onboarding)
router.put('/', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const { businessName, businessType, fullName, phone, address } = req.body;
  if (!businessName || !fullName) {
    return res.status(400).json({ error: 'Business name and full name are required' });
  }

  const profile = {
    businessName,
    businessType: businessType || 'individual',
    fullName,
    phone: phone || '',
    address: address || {},
    onboardingComplete: true,
    updatedAt: new Date().toISOString(),
  };

  db.updateUser(req.user.id, { profile });
  res.json({ profile });
});

// Get user transaction history
router.get('/transactions', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const txs = db.getUserTransactions(req.user.id);
  res.json({ transactions: txs });
});

// Get user dashboard stats
router.get('/dashboard', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const u = req.user;
  const txs = db.getUserTransactions(u.id);
  const totalSpent = txs.filter(t => t.status === 'completed').reduce((s, t) => s + (t.amountCents || 0), 0);
  const totalBtc = txs.filter(t => t.status === 'completed').reduce((s, t) => s + (t.btcSats || 0), 0);

  res.json({
    balanceCents: u.balanceCents,
    totalSpentCents: totalSpent,
    totalBtcSats: totalBtc,
    transactionCount: txs.length,
    isVerified: u.isVerified,
    identityVerified: u.identityVerified,
    addressVerified: u.addressVerified,
    onboardingComplete: u.profile?.onboardingComplete || false,
  });
});

module.exports = router;
