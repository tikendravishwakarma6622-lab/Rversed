const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/inMemoryDb');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = db.findUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = db.createUser({ email: email.toLowerCase(), passwordHash });
    const token = db.createSession(user.id);

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, isVerified: user.isVerified, profile: user.profile },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = db.findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = db.createSession(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        region: user.region,
        balanceCents: user.balanceCents,
        profile: user.profile,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (token) db.deleteSession(token);
  res.json({ ok: true });
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const u = req.user;
  res.json({
    id: u.id,
    email: u.email,
    isVerified: u.isVerified,
    region: u.region,
    balanceCents: u.balanceCents,
    identityVerified: u.identityVerified,
    addressVerified: u.addressVerified,
    profile: u.profile,
  });
});

module.exports = router;
