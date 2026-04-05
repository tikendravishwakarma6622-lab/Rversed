const db = require('../db/inMemoryDb');

/**
 * Admin: get all transactions (with filtering)
 */
async function getTransactions(req, res) {
  const { status, userId, limit = 50, offset = 0 } = req.query;

  let txs = db.transactions || [];

  if (status) txs = txs.filter(t => t.status === status);
  if (userId) txs = txs.filter(t => t.userId === userId);

  const total = txs.length;
  const page = txs.slice(offset, offset + parseInt(limit));

  return res.json({ total, limit, offset, transactions: page });
}

/**
 * Admin: get all users with stats
 */
async function getUsers(req, res) {
  const { limit = 50, offset = 0 } = req.query;

  const users = (db.users || []).map(u => {
    const userTxs = (db.transactions || []).filter(t => t.userId === u.id);
    const totalSpent = userTxs.reduce((s, t) => s + (t.amountCents || 0), 0);
    const totalBtc = userTxs.reduce((s, t) => s + (t.btcSats || 0), 0);

    return {
      ...u,
      totalTransactions: userTxs.length,
      totalSpent,
      totalBtc,
    };
  });

  const total = users.length;
  const page = users.slice(offset, offset + parseInt(limit));

  return res.json({ total, limit, offset, users: page });
}

/**
 * Admin: get dashboard stats
 */
async function getDashboardStats(req, res) {
  const txs = db.transactions || [];
  const withdrawals = db.withdrawals || [];
  const users = db.users || [];

  const completed = txs.filter(t => t.status === 'completed');
  const pending = txs.filter(t => t.status === 'pending');
  const failed = txs.filter(t => t.status === 'failed');

  const totalVolume = completed.reduce((s, t) => s + t.amountCents, 0) / 100; // USD
  const totalBtc = completed.reduce((s, t) => s + t.btcSats, 0) / 100_000_000; // BTC
  const avgOrderSize = completed.length > 0 ? totalVolume / completed.length : 0;

  const withdrawalStats = {
    total: withdrawals.length,
    completed: withdrawals.filter(w => w.status === 'completed').length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    failed: withdrawals.filter(w => w.status === 'failed').length,
  };

  return res.json({
    transactions: {
      total: txs.length,
      completed: completed.length,
      pending: pending.length,
      failed: failed.length,
      totalVolume,
      totalBtc,
      avgOrderSize,
    },
    withdrawals: withdrawalStats,
    users: users.length,
    eventLog: (db.eventLog || []).slice(-20), // Last 20 events
  });
}

module.exports = { getTransactions, getUsers, getDashboardStats };
