const rateLimit = require('express-rate-limit');
const db = require('../db/inMemoryDb');

/**
 * IP-based rate limiter (3 requests per minute)
 */
const ipLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Per-user rate limiter (10 buy orders per hour)
 */
const userBuyLimiter = (req, res, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauthenticated' });

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentOrders = (db.transactions || []).filter(
    t => t.userId === user.id && new Date(t.createdAt) >= oneHourAgo
  );

  if (recentOrders.length >= 10) {
    return res.status(429).json({ error: 'rate_limit_exceeded', retryAfter: 3600 });
  }

  next();
};

/**
 * Unified fraud detection: intelligent scoring + tiered allowances + manual review
 * Combines: whitelisting, adaptive thresholds, and manual review routing
 */
function checkFraud(transaction, user) {
  const flags = [];
  let fraudScore = 0;

  // TIER 1: User Risk Assessment
  const userTier = getUserRiskTier(user);
  const thresholdByTier = {
    'trusted': 15,    // High threshold (allow most)
    'verified': 8,    // Medium threshold
    'unverified': 3,  // Low threshold
  };
  const threshold = thresholdByTier[userTier] || 8;

  // CHECK 1: Large Order (Adaptive scoring)
  if (transaction.amountCents > 5_000_000) { // >$50k
    flags.push({ type: 'large_order_extreme', score: 5, tier: 'unverified', severity: 'high' });
    fraudScore += 5;
  } else if (transaction.amountCents > 1_000_000) { // >$10k
    flags.push({ type: 'large_order', score: userTier === 'trusted' ? 0 : 2, tier: 'verified', severity: 'medium' });
    fraudScore += (userTier === 'trusted' ? 0 : 2);
  }

  // CHECK 2: Rapid Orders (Whitelist frequent users)
  const last15Mins = new Date(Date.now() - 15 * 60 * 1000);
  const recentTxs = (db.transactions || []).filter(
    t => t.userId === user.id && new Date(t.createdAt) >= last15Mins
  );
  if (recentTxs.length > 5) { // Allow up to 5 orders in 15 min for trusted users
    if (userTier !== 'trusted') {
      flags.push({ type: 'rapid_orders', score: userTier === 'verified' ? 1 : 2, severity: 'low' });
      fraudScore += (userTier === 'verified' ? 1 : 2);
    }
  }

  // CHECK 3: New Payment Method (Whitelist if user has history)
  const userHistoryCount = (db.transactions || []).filter(t => t.userId === user.id).length;
  if ((!user.savedPaymentMethods || user.savedPaymentMethods.length === 0) && userHistoryCount < 3) {
    flags.push({ type: 'new_payment_method', score: userTier === 'trusted' ? 0 : 1, severity: 'low' });
    fraudScore += (userTier === 'trusted' ? 0 : 1);
  }

  // CHECK 4: Geolocation Anomaly (if available)
  if (user.lastCountry && transaction.userCountry && user.lastCountry !== transaction.userCountry) {
    const hoursSinceLastTx = (Date.now() - user.lastTxTime) / (1000 * 60 * 60);
    if (hoursSinceLastTx < 2) { // Impossible travel
      flags.push({ type: 'impossible_travel', score: 3, severity: 'medium' });
      fraudScore += 3;
    }
  }

  // CHECK 5: Wallet Address Whitelist
  if (user.whitelistedWallets && user.whitelistedWallets.includes(transaction.walletAddress)) {
    fraudScore = Math.max(0, fraudScore - 2); // Reduce score for whitelisted addresses
    flags.push({ type: 'whitelisted_wallet', score: -2, severity: 'none' });
  }

  // DECISION: Auto-block, manual review, or approve
  const riskLevel = getRiskLevel(fraudScore, threshold);
  const requiresManualReview = fraudScore >= (threshold * 0.66) && fraudScore < threshold;

  return {
    fraudScore,
    threshold,
    isSuspicious: fraudScore >= threshold,
    requiresManualReview,
    riskLevel, // 'low', 'medium', 'high'
    userTier,
    flags,
    recommendation: getRecommendation(fraudScore, threshold, userTier),
  };
}

/**
 * Determine user risk tier (trusted/verified/unverified)
 */
function getUserRiskTier(user) {
  const userTxCount = (db.transactions || []).filter(t => t.userId === user.id && t.status === 'completed').length;
  const accountAgeDays = user.createdAt ? (Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24) : 0;

  // Trusted: 10+ successful txs, 30+ days old, verified + address verified
  if (userTxCount >= 10 && accountAgeDays >= 30 && user.identityVerified && user.addressVerified) {
    return 'trusted';
  }

  // Verified: KYC done, some history
  if (user.isVerified && user.identityVerified) {
    return 'verified';
  }

  return 'unverified';
}

/**
 * Map fraud score to risk level
 */
function getRiskLevel(score, threshold) {
  if (score < threshold * 0.33) return 'low';
  if (score < threshold * 0.66) return 'medium';
  return 'high';
}

/**
 * Get action recommendation
 */
function getRecommendation(fraudScore, threshold, userTier) {
  if (fraudScore < threshold * 0.33) return 'auto_approve';
  if (fraudScore < threshold * 0.66) return 'manual_review';
  return 'block'; // Only block if significantly over threshold
}

/**
 * Verify user KYC status more strictly for large orders
 */
function requireStrictKYC(threshold = 50_000) {
  return (req, res, next) => {
    const user = req.user;
    const { amountCents } = req.body;

    if (!user) return res.status(401).json({ error: 'unauthenticated' });

    // For orders > threshold, require identity verification + address proof
    if (amountCents > threshold) {
      if (!user.identityVerified || !user.addressVerified) {
        return res.status(403).json({
          error: 'enhanced_kyc_required',
          message: 'Please complete identity and address verification for large orders',
        });
      }
    }

    next();
  };
}

module.exports = {
  ipLimiter,
  userBuyLimiter,
  checkFraud,
  requireStrictKYC,
};
