const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Determine mode
const USE_PG = !!process.env.DATABASE_URL;

let pg;
if (USE_PG) {
  pg = require('./postgres');
  console.log('[DB] Using PostgreSQL');
} else {
  console.log('[DB] Using in-memory storage (set DATABASE_URL for PostgreSQL)');
}

// Fallback in-memory store
const mem = require('./inMemoryDb');

// ─── Users ───
async function createUser(data) {
  if (USE_PG) {
    return pg.getOne(
      `INSERT INTO users (email, password_hash, region) VALUES ($1, $2, $3) RETURNING *`,
      [data.email, data.passwordHash, data.region || 'US']
    );
  }
  return mem.createUser(data);
}

async function findUserByEmail(email) {
  if (USE_PG) {
    const u = await pg.getOne(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()]);
    if (u) return normalizeUser(u);
    return null;
  }
  return mem.findUserByEmail(email);
}

async function findUserById(id) {
  if (USE_PG) {
    const u = await pg.getOne(`SELECT * FROM users WHERE id = $1`, [id]);
    if (!u) return null;
    const profile = await pg.getOne(`SELECT * FROM business_profiles WHERE user_id = $1`, [id]);
    const result = normalizeUser(u);
    result.profile = profile ? normalizeProfile(profile) : null;
    return result;
  }
  return mem.findUserById(id);
}

async function updateUser(id, patch) {
  if (USE_PG) {
    const sets = [];
    const vals = [];
    let i = 1;
    const fieldMap = {
      isVerified: 'is_verified', region: 'region', balanceCents: 'balance_cents',
      identityVerified: 'identity_verified', addressVerified: 'address_verified',
    };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (patch[key] !== undefined) { sets.push(`${col} = $${i}`); vals.push(patch[key]); i++; }
    }
    if (sets.length) {
      sets.push(`updated_at = NOW()`);
      vals.push(id);
      await pg.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${i}`, vals);
    }
    if (patch.profile) {
      const p = patch.profile;
      await pg.query(
        `INSERT INTO business_profiles (user_id, business_name, business_type, full_name, phone, address_line1, address_city, address_state, address_zip, address_country, onboarding_complete)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (user_id) DO UPDATE SET business_name=$2, business_type=$3, full_name=$4, phone=$5, address_line1=$6, address_city=$7, address_state=$8, address_zip=$9, address_country=$10, onboarding_complete=$11, updated_at=NOW()`,
        [id, p.businessName, p.businessType, p.fullName, p.phone, p.address?.line1, p.address?.city, p.address?.state, p.address?.zip, p.address?.country, p.onboardingComplete || true]
      );
    }
    return findUserById(id);
  }
  return mem.updateUser(id, patch);
}

// ─── Sessions ───
async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  if (USE_PG) {
    await pg.query(`INSERT INTO sessions (token, user_id) VALUES ($1, $2)`, [token, userId]);
  } else {
    mem.sessions[token] = { userId, createdAt: Date.now() };
  }
  return token;
}

async function getSession(token) {
  if (USE_PG) {
    return pg.getOne(`SELECT * FROM sessions WHERE token = $1`, [token]);
  }
  const s = mem.sessions[token];
  return s ? { userId: s.userId, user_id: s.userId } : null;
}

async function deleteSession(token) {
  if (USE_PG) {
    await pg.query(`DELETE FROM sessions WHERE token = $1`, [token]);
  } else {
    mem.deleteSession(token);
  }
}

// ─── Transactions ───
async function createTransaction(data) {
  if (USE_PG) {
    return pg.getOne(
      `INSERT INTO transactions (user_id, amount_cents, fiat_currency, btc_sats, wallet_address, status, payment_method, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [data.userId, data.amountCents, data.fiatCurrency || 'USD', data.btcSats || 0, data.walletAddress, data.status || 'pending', data.paymentMethod, data.idempotencyKey]
    );
  }
  return mem.createTransaction(data);
}

async function findTransactionByIdempotencyKey(key) {
  if (USE_PG) {
    return pg.getOne(`SELECT * FROM transactions WHERE idempotency_key = $1`, [key]);
  }
  return mem.findTransactionByIdempotencyKey(key);
}

async function updateTransaction(id, patch) {
  if (USE_PG) {
    const sets = [];
    const vals = [];
    let i = 1;
    const cols = { status: 'status', providerId: 'provider_id', providerStatus: 'provider_status', errorMessage: 'error_message', fraudAnalysis: 'fraud_analysis' };
    for (const [k, c] of Object.entries(cols)) {
      if (patch[k] !== undefined) {
        sets.push(`${c} = $${i}`);
        vals.push(k === 'fraudAnalysis' ? JSON.stringify(patch[k]) : patch[k]);
        i++;
      }
    }
    if (sets.length) {
      sets.push('updated_at = NOW()');
      vals.push(id);
      return pg.getOne(`UPDATE transactions SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    }
    return null;
  }
  return mem.updateTransaction(id, patch);
}

async function sumUserTransactionsSince(userId, sinceDate) {
  if (USE_PG) {
    const r = await pg.getOne(
      `SELECT COALESCE(SUM(amount_cents), 0) AS total FROM transactions WHERE user_id = $1 AND created_at >= $2 AND status IN ('completed','pending')`,
      [userId, sinceDate]
    );
    return parseInt(r.total);
  }
  return mem.sumUserTransactionsSince(userId, sinceDate);
}

async function getUserTransactions(userId) {
  if (USE_PG) {
    return pg.getMany(`SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
  }
  return mem.getUserTransactions(userId);
}

// ─── Withdrawals ───
async function createWithdrawal(data) {
  if (USE_PG) {
    return pg.getOne(
      `INSERT INTO withdrawals (user_id, amount_cents, status, idempotency_key) VALUES ($1,$2,$3,$4) RETURNING *`,
      [data.userId, data.amountCents, data.status || 'processing', data.idempotencyKey]
    );
  }
  const w = { id: uuidv4(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (!mem.withdrawals) mem.withdrawals = [];
  mem.withdrawals.push(w);
  return w;
}

async function findWithdrawalByIdempotencyKey(key) {
  if (USE_PG) {
    return pg.getOne(`SELECT * FROM withdrawals WHERE idempotency_key = $1`, [key]);
  }
  return (mem.withdrawals || []).find(w => w.idempotencyKey === key);
}

async function updateWithdrawal(id, patch) {
  if (USE_PG) {
    const sets = [];
    const vals = [];
    let i = 1;
    const cols = { status: 'status', providerId: 'provider_id', providerStatus: 'provider_status', errorMessage: 'error_message' };
    for (const [k, c] of Object.entries(cols)) {
      if (patch[k] !== undefined) { sets.push(`${c} = $${i}`); vals.push(patch[k]); i++; }
    }
    if (sets.length) {
      sets.push('updated_at = NOW()');
      vals.push(id);
      return pg.getOne(`UPDATE withdrawals SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    }
    return null;
  }
  const w = (mem.withdrawals || []).find(x => x.id === id);
  if (w) Object.assign(w, patch, { updatedAt: new Date().toISOString() });
  return w;
}

async function getUserWithdrawals(userId) {
  if (USE_PG) {
    return pg.getMany(`SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
  }
  return (mem.withdrawals || []).filter(w => w.userId === userId);
}

// ─── Invoices ───
async function createInvoice(data) {
  if (USE_PG) {
    const num = 'INV-' + Date.now().toString(36).toUpperCase();
    return pg.getOne(
      `INSERT INTO invoices (user_id, customer_name, customer_email, items, subtotal_cents, tax_cents, total_cents, status, due_date, notes, invoice_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [data.userId, data.customerName, data.customerEmail, JSON.stringify(data.items), data.subtotalCents, data.taxCents || 0, data.totalCents, data.status || 'draft', data.dueDate, data.notes, num]
    );
  }
  const inv = { id: uuidv4(), invoiceNumber: 'INV-' + Date.now().toString(36).toUpperCase(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (!mem.invoices) mem.invoices = [];
  mem.invoices.push(inv);
  return inv;
}

async function getUserInvoices(userId) {
  if (USE_PG) {
    return pg.getMany(`SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
  }
  return (mem.invoices || []).filter(i => i.userId === userId);
}

async function getInvoiceById(id) {
  if (USE_PG) {
    return pg.getOne(`SELECT * FROM invoices WHERE id = $1`, [id]);
  }
  return (mem.invoices || []).find(i => i.id === id);
}

async function updateInvoice(id, patch) {
  if (USE_PG) {
    const sets = [];
    const vals = [];
    let i = 1;
    const cols = { customerName: 'customer_name', customerEmail: 'customer_email', items: 'items', subtotalCents: 'subtotal_cents', taxCents: 'tax_cents', totalCents: 'total_cents', status: 'status', dueDate: 'due_date', notes: 'notes', paidAt: 'paid_at' };
    for (const [k, c] of Object.entries(cols)) {
      if (patch[k] !== undefined) {
        sets.push(`${c} = $${i}`);
        vals.push(k === 'items' ? JSON.stringify(patch[k]) : patch[k]);
        i++;
      }
    }
    if (sets.length) {
      sets.push('updated_at = NOW()');
      vals.push(id);
      return pg.getOne(`UPDATE invoices SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    }
    return null;
  }
  const inv = (mem.invoices || []).find(x => x.id === id);
  if (inv) Object.assign(inv, patch, { updatedAt: new Date().toISOString() });
  return inv;
}

async function deleteInvoice(id) {
  if (USE_PG) {
    await pg.query(`DELETE FROM invoices WHERE id = $1`, [id]);
    return true;
  }
  if (!mem.invoices) return false;
  const idx = mem.invoices.findIndex(i => i.id === id);
  if (idx >= 0) { mem.invoices.splice(idx, 1); return true; }
  return false;
}

// ─── Admin ───
async function getAllTransactions(filters = {}) {
  if (USE_PG) {
    let q = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];
    let i = 1;
    if (filters.status) { q += ` AND status = $${i}`; params.push(filters.status); i++; }
    if (filters.userId) { q += ` AND user_id = $${i}`; params.push(filters.userId); i++; }
    q += ` ORDER BY created_at DESC LIMIT $${i} OFFSET $${i+1}`;
    params.push(parseInt(filters.limit) || 50, parseInt(filters.offset) || 0);
    return pg.getMany(q, params);
  }
  let txs = mem.transactions || [];
  if (filters.status) txs = txs.filter(t => t.status === filters.status);
  if (filters.userId) txs = txs.filter(t => t.userId === filters.userId);
  return txs.slice(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50));
}

async function getAllUsers(filters = {}) {
  if (USE_PG) {
    return pg.getMany(`SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [parseInt(filters.limit) || 50, parseInt(filters.offset) || 0]);
  }
  return (mem.users || []).slice(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50));
}

async function getStats() {
  if (USE_PG) {
    const txStats = await pg.getOne(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='completed') as completed, COUNT(*) FILTER (WHERE status='pending') as pending, COUNT(*) FILTER (WHERE status='failed') as failed, COALESCE(SUM(amount_cents) FILTER (WHERE status='completed'), 0) as volume, COALESCE(SUM(btc_sats) FILTER (WHERE status='completed'), 0) as btc FROM transactions`);
    const wStats = await pg.getOne(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='completed') as completed, COUNT(*) FILTER (WHERE status='pending') as pending, COUNT(*) FILTER (WHERE status='failed') as failed FROM withdrawals`);
    const userCount = await pg.getOne(`SELECT COUNT(*) as total FROM users`);
    const invStats = await pg.getOne(`SELECT COUNT(*) as total, COALESCE(SUM(total_cents) FILTER (WHERE status='paid'), 0) as paid_volume FROM invoices`);
    return {
      transactions: { total: +txStats.total, completed: +txStats.completed, pending: +txStats.pending, failed: +txStats.failed, totalVolume: +txStats.volume / 100, totalBtc: +txStats.btc / 1e8 },
      withdrawals: { total: +wStats.total, completed: +wStats.completed, pending: +wStats.pending, failed: +wStats.failed },
      users: +userCount.total,
      invoices: { total: +invStats.total, paidVolume: +invStats.paid_volume / 100 },
    };
  }
  // In-memory fallback
  const txs = mem.transactions || [];
  const completed = txs.filter(t => t.status === 'completed');
  return {
    transactions: { total: txs.length, completed: completed.length, pending: txs.filter(t => t.status === 'pending').length, failed: txs.filter(t => t.status === 'failed').length, totalVolume: completed.reduce((s, t) => s + (t.amountCents || 0), 0) / 100, totalBtc: completed.reduce((s, t) => s + (t.btcSats || 0), 0) / 1e8 },
    withdrawals: { total: 0, completed: 0, pending: 0, failed: 0 },
    users: (mem.users || []).length,
    invoices: { total: 0, paidVolume: 0 },
  };
}

// ─── Helpers ───
function normalizeUser(row) {
  return {
    id: row.id, email: row.email, passwordHash: row.password_hash,
    isVerified: row.is_verified, region: row.region, balanceCents: parseInt(row.balance_cents),
    identityVerified: row.identity_verified, addressVerified: row.address_verified,
    createdAt: row.created_at, profile: null,
  };
}

function normalizeProfile(row) {
  return {
    businessName: row.business_name, businessType: row.business_type, fullName: row.full_name,
    phone: row.phone, address: { line1: row.address_line1, city: row.address_city, state: row.address_state, zip: row.address_zip, country: row.address_country },
    onboardingComplete: row.onboarding_complete,
  };
}

module.exports = {
  createUser, findUserByEmail, findUserById, updateUser,
  createSession, getSession, deleteSession,
  createTransaction, findTransactionByIdempotencyKey, updateTransaction, sumUserTransactionsSince, getUserTransactions,
  createWithdrawal, findWithdrawalByIdempotencyKey, updateWithdrawal, getUserWithdrawals,
  createInvoice, getUserInvoices, getInvoiceById, updateInvoice, deleteInvoice,
  getAllTransactions, getAllUsers, getStats,
  get users() { return mem.users; },
  get transactions() { return mem.transactions; },
  get withdrawals() { return mem.withdrawals || []; },
  get eventLog() { return mem.eventLog || []; },
};
