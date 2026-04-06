const db = require('../db/inMemoryDb');
const btcService = require('../services/bitcoin.service');
const stripeAdapter = require('../services/provider-adapters/stripeAdapter');
const adyenAdapter = require('../services/provider-adapters/adyenAdapter');
const plaidAdapter = require('../services/provider-adapters/plaidAdapter');
const { v4: uuidv4 } = require('uuid');

async function getAvailablePaymentMethods(req, res) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauthenticated' });
  const region = (user.region || 'US').toUpperCase();
  const methods = ['card'];
  if (region === 'US') methods.push('ach', 'bank_link');
  if (region === 'CN') methods.push('unionpay');
  return res.json({ region, methods });
}

async function createPlaidLinkToken(req, res) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauthenticated' });
  try {
    const result = await plaidAdapter.createLinkToken({
      userId: user.id,
      userName: user.profile?.fullName || user.email,
      userEmail: user.email,
      country: (user.region || 'US').toUpperCase(),
    });
    return res.json(result);
  } catch (err) {
    // Fallback to dev token when Plaid not configured
    return res.json({ link_token: `plaid-link-dev-${Date.now()}`, dev: true });
  }
}

async function exchangePlaidToken(req, res) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauthenticated' });
  const { publicToken } = req.body;
  if (!publicToken) return res.status(400).json({ error: 'publicToken required' });
  try {
    const result = await plaidAdapter.exchangePublicToken({ publicToken });
    const authData = await plaidAdapter.getAuth({ accessToken: result.accessToken });
    return res.json({
      accessToken: result.accessToken,
      itemId: result.itemId,
      accounts: authData.accounts,
    });
  } catch (err) {
    // Dev fallback
    return res.json({
      accessToken: `access-dev-${Date.now()}`,
      itemId: `item-dev-${Date.now()}`,
      accounts: [{ id: 'acct_dev', name: 'Dev Checking', type: 'checking', mask: '1234' }],
      dev: true,
    });
  }
}

async function buyBitcoin(req, res) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauthenticated' });
  if (!user.isVerified) return res.status(403).json({ error: 'verification_required' });

  const { amountCents, fiatCurrency = 'USD', paymentMethod, paymentDetails, walletAddress, idempotencyKey = uuidv4() } = req.body;
  if (!amountCents || amountCents <= 0) return res.status(400).json({ error: 'invalid_amount' });
  if (!walletAddress) return res.status(400).json({ error: 'wallet_required' });

  const DAILY_LIMIT_CENTS = Number(process.env.DAILY_BUY_LIMIT_CENTS || 2000000);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const spentToday = db.sumUserTransactionsSince(user.id, since);
  if (spentToday + amountCents > DAILY_LIMIT_CENTS) return res.status(403).json({ error: 'daily_limit_exceeded' });

  const quote = await btcService.getQuote({ amountCents, fiatCurrency });
  const btcAmountSats = quote.btcSats;

  const region = (user.region || 'US').toUpperCase();
  const adapter = region === 'CN' ? adyenAdapter : stripeAdapter;

  const existing = db.findTransactionByIdempotencyKey(idempotencyKey);
  if (existing) return res.json({ id: existing.id, status: existing.status });

  const tx = db.createTransaction({
    userId: user.id,
    amountCents,
    fiatCurrency,
    btcSats: btcAmountSats,
    walletAddress,
    status: 'processing',
    paymentMethod,
    idempotencyKey
  });

  try {
    // Run unified fraud detection
    const { checkFraud } = require('../middlewares/securityMiddleware');
    const fraudAnalysis = checkFraud({ ...tx, userCountry: user.country }, user);

    // Route based on recommendation
    if (fraudAnalysis.recommendation === 'block') {
      db.updateTransaction(tx.id, { status: 'blocked', fraudAnalysis });
      return res.status(403).json({ error: 'transaction_blocked', fraudScore: fraudAnalysis.fraudScore });
    }

    if (fraudAnalysis.recommendation === 'manual_review') {
      // Create transaction but mark for manual review
      db.updateTransaction(tx.id, { status: 'pending_review', fraudAnalysis });
      return res.json({
        id: tx.id,
        status: 'pending_review',
        message: 'Transaction flagged for manual review. You will be notified within 24 hours.',
        btcSats: btcAmountSats,
      });
    }

    // Otherwise, proceed (auto_approve)
    const providerResp = await adapter.charge({
      amountCents,
      currency: fiatCurrency.toLowerCase(),
      paymentMethod,
      paymentDetails,
      metadata: { transactionId: tx.id },
      idempotencyKey,
      user
    });

    db.updateTransaction(tx.id, {
      providerId: providerResp.id,
      providerStatus: providerResp.status,
      status: providerResp.status === 'succeeded' ? 'completed' : 'pending',
      fraudAnalysis
    });

    return res.json({
      id: tx.id,
      status: providerResp.status,
      btcSats: btcAmountSats,
      fiatAmount: amountCents / 100,
      fraudScore: fraudAnalysis.fraudScore
    });
  } catch (err) {
    db.updateTransaction(tx.id, { status: 'failed', errorMessage: err.message });
    return res.status(400).json({ error: err.message || 'payment_failed' });
  }
}

module.exports = { getAvailablePaymentMethods, createPlaidLinkToken, exchangePlaidToken, buyBitcoin };
