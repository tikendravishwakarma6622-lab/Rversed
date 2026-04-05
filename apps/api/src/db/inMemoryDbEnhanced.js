const db = require('../db/inMemoryDb');
const { checkFraud } = require('../middlewares/securityMiddleware');

/**
 * Update in-memory DB helpers for withdrawals
 */
function updateWithdrawal(id, patch) {
  const w = (db.withdrawals || []).find(x => x.id === id);
  if (!w) return null;
  Object.assign(w, patch, { updatedAt: new Date().toISOString() });
  return w;
}

function findWithdrawalByIdempotencyKey(key) {
  return (db.withdrawals || []).find(w => w.idempotencyKey === key);
}

/**
 * Enhanced transaction creation with fraud checks
 */
function createEnhancedTransaction(data, user) {
  const tx = Object.assign({ id: require('uuid').v4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, data);
  
  // Run fraud checks
  const fraud = checkFraud(tx, user);
  if (fraud.isSuspicious) {
    tx.fraudFlags = fraud.flags;
    tx.requiresManualReview = true;
    console.warn(`[FRAUD ALERT] Transaction ${tx.id} flagged for review. Score: ${fraud.fraudScore}`);
  }

  if (!db.transactions) db.transactions = [];
  db.transactions.push(tx);
  return tx;
}

module.exports = {
  updateWithdrawal,
  findWithdrawalByIdempotencyKey,
  createEnhancedTransaction,
  ...require('./inMemoryDb'),
};
