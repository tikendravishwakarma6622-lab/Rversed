
const db = require('../db/inMemoryDb');
const stripeAdapter = require('../services/provider-adapters/stripeAdapter');
const { v4: uuidv4 } = require('uuid');
const { validationResult, body } = require('express-validator');

/**
 * @api {post} /withdrawals Create a new withdrawal
 * @apiName CreateWithdrawal
 * @apiGroup Withdrawals
 * @apiDescription Initiate an instant withdrawal. Response format and error structure inspired by Stripe/Square APIs.
 *
 * @apiBody {Number} amountCents Amount to withdraw in cents (required)
 * @apiBody {String} [destinationId] Optional destination identifier
 * @apiBody {String} [bankAccountToken] Optional bank account token
 * @apiBody {String} [idempotencyKey] Optional idempotency key
 *
 * @apiSuccess {String} id Withdrawal ID
 * @apiSuccess {String} status Withdrawal status (processing/completed/pending/failed)
 * @apiSuccess {Number} amountCents Amount withdrawn in cents
 *
 * @apiError (Error 4xx/5xx) {Object} error Error object
 * @apiError (Error 4xx/5xx) {String} error.type Error type (e.g. 'invalid_request_error')
 * @apiError (Error 4xx/5xx) {String} error.message Human-readable error message
 * @apiError (Error 4xx/5xx) {String} [error.code] Optional error code
 * @apiError (Error 4xx/5xx) {String} [error.param] Parameter related to error
 */
const validateWithdrawal = [
  body('amountCents').isInt({ min: 1 }).withMessage('amountCents must be a positive integer'),
  body('bankAccountToken').optional().isString(),
  body('destinationId').optional().isString(),
  body('idempotencyKey').optional().isString(),
];

async function createWithdrawal(req, res) {
  console.log(`[${new Date().toISOString()}] Withdrawal attempt by user:`, req.user ? req.user.id : 'unknown');
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: {
        type: 'invalid_request_error',
        message: 'Validation failed',
        details: errors.array(),
      }
    });
  }

  const user = req.user;
  if (!user) {
    console.warn(`[${new Date().toISOString()}] Unauthenticated withdrawal attempt.`);
    return res.status(401).json({
      error: {
        type: 'authentication_error',
        message: 'User is not authenticated',
      }
    });
  }
  if (!user.isVerified) {
    console.warn(`[${new Date().toISOString()}] Unverified user withdrawal attempt: ${user.id}`);
    return res.status(403).json({
      error: {
        type: 'verification_error',
        message: 'User verification required',
      }
    });
  }

  const { amountCents, destinationId, bankAccountToken, idempotencyKey = uuidv4() } = req.body;
  if (!amountCents || amountCents <= 0) {
    console.warn(`[${new Date().toISOString()}] Invalid withdrawal amount by user ${user.id}:`, amountCents);
    return res.status(400).json({
      error: {
        type: 'invalid_request_error',
        message: 'Invalid withdrawal amount',
        param: 'amountCents',
      }
    });
  }

  // Check balance
  if (!user.balanceCents || user.balanceCents < amountCents) {
    console.warn(`[${new Date().toISOString()}] Insufficient balance for user ${user.id}. Requested: ${amountCents}, Available: ${user.balanceCents}`);
    return res.status(403).json({
      error: {
        type: 'balance_error',
        message: 'Insufficient balance',
        code: 'insufficient_balance',
      }
    });
  }

  // Check for duplicate (idempotency)
  const existing = db.withdrawals?.find(w => w.idempotencyKey === idempotencyKey);
  if (existing) {
    console.info(`[${new Date().toISOString()}] Duplicate withdrawal request detected for user ${user.id}, idempotencyKey: ${idempotencyKey}`);
    return res.status(200).json({
      id: existing.id,
      status: existing.status,
      object: 'withdrawal',
    });
  }

  // Create withdrawal record
  const withdrawal = {
    id: uuidv4(),
    userId: user.id,
    amountCents,
    status: 'processing',
    idempotencyKey,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!db.withdrawals) db.withdrawals = [];
  db.withdrawals.push(withdrawal);

  try {
    console.log(`[${new Date().toISOString()}] Processing withdrawal for user ${user.id}, amount: ${amountCents}`);
    // Reserve funds (atomic update)
    const userRecord = db.users.find(u => u.id === user.id);
    if (!userRecord || userRecord.balanceCents < amountCents) {
      throw new Error('insufficient_balance');
    }
    userRecord.balanceCents -= amountCents;

    // Call payment provider for instant payout
    if (process.env.STRIPE_SECRET_KEY && bankAccountToken) {
      const payoutResp = await stripeAdapter.createPayout({
        amountCents,
        currency: 'usd',
        bankAccountToken,
        description: `Withdrawal from rversed for user ${user.id}`,
        metadata: { withdrawalId: withdrawal.id },
        idempotencyKey,
      });

      // Update withdrawal
      console.log(`[${new Date().toISOString()}] Stripe payout response for withdrawal ${withdrawal.id}:`, payoutResp);
      const w = db.withdrawals.find(x => x.id === withdrawal.id);
      Object.assign(w, {
        providerId: payoutResp.id,
        providerStatus: payoutResp.status,
        status: payoutResp.status === 'succeeded' ? 'completed' : 'pending',
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Dev stub
      Object.assign(withdrawal, {
        providerId: `payout_sim_${Date.now()}`,
        status: 'completed',
        updatedAt: new Date().toISOString(),
      });
      console.log(`[${new Date().toISOString()}] Simulated payout completed for withdrawal ${withdrawal.id}`);
    }

    console.log(`[${new Date().toISOString()}] Withdrawal completed for user ${user.id}, withdrawalId: ${withdrawal.id}, status: ${withdrawal.status}`);
    return res.status(201).json({
      id: withdrawal.id,
      status: withdrawal.status,
      amountCents,
      object: 'withdrawal',
    });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Withdrawal failed for user ${user ? user.id : 'unknown'}, error:`, err);
    // Refund reserved funds on error
    const userRecord = db.users.find(u => u.id === user.id);
    if (userRecord) userRecord.balanceCents += amountCents;

    // Mark withdrawal as failed
    const w = db.withdrawals.find(x => x.id === withdrawal.id);
    Object.assign(w, { status: 'failed', errorMessage: err.message });

    // Improved error structure
    return res.status(400).json({
      error: {
        type: 'api_error',
        message: err.message || 'withdrawal_failed',
        code: err.code || 'withdrawal_failed',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
    });
  }
}

/**
 * @api {get} /withdrawals Get all withdrawals for user
 * @apiName GetUserWithdrawals
 * @apiGroup Withdrawals
 * @apiDescription Retrieve all withdrawals for the authenticated user. Response format inspired by Stripe/Square APIs.
 *
 * @apiSuccess {Object[]} withdrawals List of withdrawal objects
 * @apiSuccess {String} withdrawals.id Withdrawal ID
 * @apiSuccess {String} withdrawals.status Withdrawal status
 * @apiSuccess {Number} withdrawals.amountCents Amount in cents
 * @apiSuccess {String} withdrawals.createdAt Creation timestamp
 * @apiSuccess {String} withdrawals.updatedAt Last update timestamp
 *
 * @apiError (Error 401) {Object} error Error object
 * @apiError (Error 401) {String} error.type Error type
 * @apiError (Error 401) {String} error.message Human-readable error message
 */
async function getUserWithdrawals(req, res) {
  console.log(`[${new Date().toISOString()}] Fetching withdrawals for user:`, req.user ? req.user.id : 'unknown');
  const user = req.user;
  if (!user) {
    console.warn(`[${new Date().toISOString()}] Unauthenticated withdrawal history request.`);
    return res.status(401).json({
      error: {
        type: 'authentication_error',
        message: 'User is not authenticated',
      }
    });
  }

  const userWithdrawals = (db.withdrawals || []).filter(w => w.userId === user.id);
  return res.status(200).json({
    object: 'list',
    data: userWithdrawals,
  });
}

module.exports = { createWithdrawal, getUserWithdrawals, validateWithdrawal };
