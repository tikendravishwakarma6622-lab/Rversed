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
      // TODO: notify fraud team, flag user for review
      break;
    }

    case 'payout.paid': {
      const payoutId = data.object.id;
      const withdrawals = (db.withdrawals || []).filter(w => w.providerId === payoutId);
      withdrawals.forEach(w => {
        db.updateWithdrawal(w.id, { status: 'completed' });
      });
      break;
    }

    case 'payout.failed': {
      const payoutId = data.object.id;
      const withdrawals = (db.withdrawals || []).filter(w => w.providerId === payoutId);
      withdrawals.forEach(w => {
        db.updateWithdrawal(w.id, { status: 'failed', errorMessage: data.object.failure_message });
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

  // Similar to Stripe handlers
  switch (eventCode) {
    case 'AUTHORISATION':
      if (data.success === 'true') {
        // Mark transaction as succeeded
      }
      break;
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
