const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const users = [
  {
    id: 'user_1',
    email: 'dev@rversed.test',
    passwordHash: '$2b$10$placeholder', // seeded user, use auth routes to create real users
    isVerified: true,
    region: 'US',
    balanceCents: 10_000_00,
    identityVerified: true,
    addressVerified: true,
    createdAt: new Date('2025-12-01').toISOString(),
    profile: {
      businessName: 'Dev Co',
      businessType: 'individual',
      fullName: 'Dev User',
      phone: '+15551234567',
      address: { line1: '123 Main St', city: 'San Francisco', state: 'CA', zip: '94105', country: 'US' },
      onboardingComplete: true,
    }
  }
];

const sessions = {};

const transactions = [];

const withdrawals = [];

const eventLog = [];

function createUser(data) {
  const user = {
    id: uuidv4(),
    email: data.email,
    passwordHash: data.passwordHash,
    isVerified: false,
    region: data.region || 'US',
    balanceCents: 0,
    identityVerified: false,
    addressVerified: false,
    createdAt: new Date().toISOString(),
    profile: null,
  };
  users.push(user);
  return user;
}

function findUserByEmail(email) {
  return users.find(u => u.email === email.toLowerCase());
}

function findUserById(id) {
  return users.find(u => u.id === id);
}

function updateUser(id, patch) {
  const u = users.find(x => x.id === id);
  if (!u) return null;
  Object.assign(u, patch);
  return u;
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions[token] = { userId, createdAt: Date.now() };
  return token;
}

function getSession(token) {
  return sessions[token] || null;
}

function deleteSession(token) {
  delete sessions[token];
}

function createTransaction(data) {
  const tx = Object.assign({ id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, data);
  transactions.push(tx);
  return tx;
}

function findTransactionByIdempotencyKey(key) {
  return transactions.find(t => t.idempotencyKey === key);
}

function updateTransaction(id, patch) {
  const t = transactions.find(x => x.id === id);
  if (!t) return null;
  Object.assign(t, patch, { updatedAt: new Date().toISOString() });
  return t;
}

function sumUserTransactionsSince(userId, sinceDate) {
  const since = new Date(sinceDate);
  return transactions
    .filter(t => t.userId === userId && new Date(t.createdAt) >= since && ['completed', 'pending'].includes(t.status))
    .reduce((s, t) => s + (t.amountCents || 0), 0);
}

function getUserTransactions(userId) {
  return transactions.filter(t => t.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = {
  users, sessions, transactions, withdrawals, eventLog,
  createUser, findUserByEmail, findUserById, updateUser,
  createSession, getSession, deleteSession,
  createTransaction, findTransactionByIdempotencyKey, updateTransaction, sumUserTransactionsSince, getUserTransactions,
};
