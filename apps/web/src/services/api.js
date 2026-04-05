// In production, API is same origin (served by Express). In dev, proxy to localhost:4000.
const API = import.meta.env.PROD ? '' : 'http://localhost:4000';

function headers() {
  const h = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('rversed_token');
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function request(path, opts = {}) {
  const res = await fetch(`${API}${path}`, { ...opts, headers: { ...headers(), ...opts.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export default {
  // Auth
  register: (email, password) => request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),

  // Profile
  getProfile: () => request('/api/profile'),
  updateProfile: (data) => request('/api/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getDashboard: () => request('/api/profile/dashboard'),
  getTransactions: () => request('/api/profile/transactions'),

  // Payments
  getPaymentMethods: () => request('/api/integrations/methods'),
  buyBitcoin: (payload) => request('/api/integrations/buy-bitcoin', { method: 'POST', body: JSON.stringify(payload) }),

  // Withdrawals
  createWithdrawal: (payload) => request('/api/withdrawals', { method: 'POST', body: JSON.stringify(payload) }),
  getWithdrawals: () => request('/api/withdrawals'),

  // Invoices
  getInvoices: () => request('/api/invoices'),
  getInvoice: (id) => request(`/api/invoices/${id}`),
  createInvoice: (data) => request('/api/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id, data) => request(`/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  sendInvoice: (id) => request(`/api/invoices/${id}/send`, { method: 'POST' }),
  deleteInvoice: (id) => request(`/api/invoices/${id}`, { method: 'DELETE' }),

  // KYC
  startVerification: () => request('/api/kyc/start', { method: 'POST' }),
  getVerificationStatus: () => request('/api/kyc/status'),

  // Email verification
  sendVerificationEmail: () => request('/api/auth/send-verification', { method: 'POST' }),
  verifyEmail: (code) => request('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ code }) }),
};
