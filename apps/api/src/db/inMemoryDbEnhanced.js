const db = require('../db/inMemoryDb');
const { checkFraud } = require('../middlewares/securityMiddleware');

/**
 * Enhanced transaction creation with fraud checks
 */
function createEnhancedTransaction(data, user) {
  const tx = Object.assign({ id: require('uuid').v4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, data);

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
  createEnhancedTransaction,
  ...db,
};
