const Stripe = require('stripe');

// Initialize Stripe only if key is available
let stripe;
function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
  }
  return stripe;
}

/**
 * Create a payment intent for card/ACH charges
 */
async function charge(opts) {
  const s = getStripe();
  if (!s) {
    // Dev fallback
    console.log('[Stripe] No API key — using simulated charge');
    return { id: `stripe_sim_${Date.now()}`, status: 'succeeded' };
  }

  const paymentIntent = await s.paymentIntents.create({
    amount: opts.amountCents,
    currency: opts.currency || 'usd',
    payment_method: opts.paymentMethod,
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    metadata: opts.metadata || {},
    idempotency_key: opts.idempotencyKey,
  });

  return {
    id: paymentIntent.id,
    status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending',
    clientSecret: paymentIntent.client_secret,
  };
}

/**
 * Create a payout to a bank account
 */
async function createPayout(opts) {
  const s = getStripe();
  if (!s) {
    console.log('[Stripe] No API key — using simulated payout');
    return { id: `payout_sim_${Date.now()}`, status: 'succeeded' };
  }

  const payout = await s.payouts.create({
    amount: opts.amountCents,
    currency: opts.currency || 'usd',
    description: opts.description,
    metadata: opts.metadata || {},
  }, { idempotencyKey: opts.idempotencyKey });

  return {
    id: payout.id,
    status: payout.status === 'paid' ? 'succeeded' : payout.status,
  };
}

/**
 * Create a Stripe Identity verification session for KYC
 */
async function createVerificationSession(opts) {
  const s = getStripe();
  if (!s) {
    console.log('[Stripe] No API key — using simulated verification');
    return {
      id: `vs_sim_${Date.now()}`,
      url: 'https://verify.stripe.com/simulated',
      status: 'requires_input',
    };
  }

  const session = await s.identity.verificationSessions.create({
    type: 'document',
    metadata: { userId: opts.userId },
    options: {
      document: {
        allowed_types: ['driving_license', 'passport', 'id_card'],
        require_matching_selfie: true,
      },
    },
    return_url: opts.returnUrl || process.env.FRONTEND_URL + '/dashboard',
  });

  return {
    id: session.id,
    url: session.url,
    status: session.status,
  };
}

/**
 * Retrieve verification session status
 */
async function getVerificationSession(sessionId) {
  const s = getStripe();
  if (!s) {
    return { id: sessionId, status: 'verified' };
  }

  const session = await s.identity.verificationSessions.retrieve(sessionId);
  return {
    id: session.id,
    status: session.status,
    lastError: session.last_error,
  };
}

/**
 * Create a Stripe customer
 */
async function createCustomer(opts) {
  const s = getStripe();
  if (!s) {
    return { id: `cus_sim_${Date.now()}` };
  }

  return s.customers.create({
    email: opts.email,
    name: opts.name,
    metadata: opts.metadata || {},
  });
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload, sig) {
  const s = getStripe();
  if (!s || !process.env.STRIPE_WEBHOOK_SECRET) return null;
  return s.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
}

module.exports = {
  charge,
  createPayout,
  createVerificationSession,
  getVerificationSession,
  createCustomer,
  verifyWebhookSignature,
};
