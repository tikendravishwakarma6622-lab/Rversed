const db = require('../db/inMemoryDb');

/**
 * Log all payment events (converted, charged, etc.)
 */
function logEvent(eventType, data) {
  if (!db.eventLog) db.eventLog = [];
  db.eventLog.push({
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
  });
  console.log(`[EVENT] ${eventType}:`, data);
}

/**
 * Webhook handler for Stripe events (payment_intent.succeeded, charge.dispute.created, etc.)
 */
async function handleStripeWebhook(event) {
  const { type, data } = event;
  logEvent(`stripe.${type}`, data.object);

  switch (type) {
    case 'payment_intent.succeeded': {
      const piId = data.object.id;
      const metadata = data.object.metadata || {};
      const txId = metadata.transactionId;

      if (txId) {
        db.updateTransaction(txId, {
          status: 'completed',
          providerId: piId,
          providerStatus: 'succeeded',
        });
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const piId = data.object.id;
      const metadata = data.object.metadata || {};
      const txId = metadata.transactionId;

      if (txId) {
        db.updateTransaction(txId, {
          status: 'failed',
          providerId: piId,
          providerStatus: 'failed',
          errorMessage: data.object.last_payment_error?.message || 'Payment failed',
        });
      }
      break;
    }

    case 'charge.dispute.created': {
      const chargeId = data.object.charge;
      logEvent('fraud_alert', { chargeId, reason: data.object.reason });
      // Flag related transaction for review
      const flaggedTx = (db.transactions || []).find(t => t.providerId === chargeId);
      if (flaggedTx) {
        db.updateTransaction(flaggedTx.id, {
          status: 'disputed',
          fraudFlags: [{ type: 'dispute', reason: data.object.reason, timestamp: new Date().toISOString() }],
          requiresManualReview: true,
        });
        // Flag the user account
        const flaggedUser = db.findUserById(flaggedTx.userId);
        if (flaggedUser) {
          db.updateUser(flaggedUser.id, { flaggedForReview: true, flagReason: `Dispute: ${data.object.reason}` });
        }
      }
      break;
    }

    case 'payout.paid': {
      const payoutId = data.object.id;
      const matched = (db.withdrawals || []).filter(w => w.providerId === payoutId);
      matched.forEach(w => {
        const wd = db.withdrawals.find(x => x.id === w.id);
        if (wd) Object.assign(wd, { status: 'completed', updatedAt: new Date().toISOString() });
      });
      break;
    }

    case 'payout.failed': {
      const payoutId = data.object.id;
      const matched = (db.withdrawals || []).filter(w => w.providerId === payoutId);
      matched.forEach(w => {
        const wd = db.withdrawals.find(x => x.id === w.id);
        if (wd) Object.assign(wd, { status: 'failed', errorMessage: data.object.failure_message, updatedAt: new Date().toISOString() });
      });
      break;
    }

    default:
      break;
  }
}

/**
 * Webhook handler for Plaid events (TRANSACTIONS_UPDATED, AUTH_VERIFICATION, etc.)
 */
async function handlePlaidWebhook(event) {
  const { webhook_type, webhook_code } = event;
  logEvent(`plaid.${webhook_type}`, event);

  switch (webhook_code) {
    case 'ITEM_LOGIN_REQUIRED':
      // Bank account login failed, notify user
      break;
    case 'INSUFFICIENT_CREDENTIALS':
      // MFA or re-auth required
      break;
    default:
      break;
  }
}

/**
 * Webhook handler for Adyen events
 */
async function handleAdyenWebhook(event) {
  const { eventCode, data } = event;
  logEvent(`adyen.${eventCode}`, data);

  switch (eventCode) {
    case 'AUTHORISATION': {
      const pspRef = data.pspReference;
      const success = data.success === 'true';
      const tx = (db.transactions || []).find(t => t.providerId === pspRef);
      if (tx) {
        db.updateTransaction(tx.id, {
          status: success ? 'completed' : 'failed',
          providerStatus: success ? 'succeeded' : 'failed',
          errorMessage: success ? undefined : (data.reason || 'Payment declined'),
        });
      }
      break;
    }
    case 'CANCELLATION':
    case 'REFUND': {
      const pspRef = data.pspReference;
      const tx = (db.transactions || []).find(t => t.providerId === pspRef);
      if (tx) {
        db.updateTransaction(tx.id, { status: 'refunded' });
      }
      break;
    }
    default:
      break;
  }
}

module.exports = {
  handleStripeWebhook,
  handlePlaidWebhook,
  handleAdyenWebhook,
  logEvent,
};
