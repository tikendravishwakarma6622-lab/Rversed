const express = require('express');
const cors = require('cors');
const path = require('path');
const integrationsRouter = require('./routes/integrations');
const webhooksRouter = require('./routes/webhooks');
const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const invoicesRouter = require('./routes/invoices');
const kycRouter = require('./routes/kyc');
const emailVerificationRouter = require('./routes/emailVerification');
const withdrawalController = require('./controllers/withdrawalController');
const adminController = require('./controllers/adminController');
const { ipLimiter, userBuyLimiter, requireStrictKYC } = require('./middlewares/securityMiddleware');
const db = require('./db/inMemoryDb');

const app = express();
const PORT = process.env.PORT_API || process.env.PORT || 4000;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
  'https://rversed.com',
  'https://www.rversed.com',
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));

// Auth middleware: resolve user from Bearer token
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (token) {
    const session = db.getSession(token);
    if (session) {
      req.user = db.findUserById(session.userId);
    }
  }
  if (!req.user && !req.path.startsWith('/api/auth')) {
    req.user = null;
  }
  next();
});

// Rate limiting
app.use('/api/integrations/buy-bitcoin', ipLimiter, userBuyLimiter, requireStrictKYC());
app.use('/api/withdrawals', ipLimiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/auth', emailVerificationRouter);
app.use('/api/profile', profileRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/kyc', kycRouter);
app.use('/webhooks', webhooksRouter);
app.post('/api/withdrawals', withdrawalController.createWithdrawal);
app.get('/api/withdrawals', withdrawalController.getUserWithdrawals);
app.get('/api/admin/transactions', adminController.getTransactions);
app.get('/api/admin/users', adminController.getUsers);
app.get('/api/admin/stats', adminController.getDashboardStats);

// Health check
app.get('/health', (req, res) => res.json({ ok: true, version: '1.0.0' }));

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../web/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/webhooks') && !req.path.startsWith('/health')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: {
      type: 'api_error',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`rversed-api listening on http://0.0.0.0:${PORT}`);
});
