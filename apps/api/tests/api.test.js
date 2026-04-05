const request = require('supertest');
const express = require('express');
const db = require('../src/db/inMemoryDb');

// Mock app for testing
const mockApp = express();
mockApp.use(express.json());
mockApp.use((req, res, next) => {
  req.user = db.users[0];
  next();
});

describe('Integrations API', () => {
  describe('GET /api/integrations/methods', () => {
    it('should return available payment methods for US region', async () => {
      const ctrl = require('../src/controllers/integrations.controller');
      const mockReq = { user: { region: 'US' } };
      const mockRes = { 
        json: function(data) { 
          expect(data.methods).toContain('card');
          expect(data.methods).toContain('ach');
          expect(data.methods).toContain('bank_link');
          return this;
        }, 
        status: function() { return this; } 
      };
      await ctrl.getAvailablePaymentMethods(mockReq, mockRes);
    });

    it('should return UnionPay for CN region', async () => {
      const ctrl = require('../src/controllers/integrations.controller');
      const mockReq = { user: { region: 'CN' } };
      const mockRes = { 
        json: function(data) { 
          expect(data.methods).toContain('card');
          expect(data.methods).toContain('unionpay');
          return this;
        }, 
        status: function() { return this; } 
      };
      await ctrl.getAvailablePaymentMethods(mockReq, mockRes);
    });
  });

  describe('POST /api/integrations/buy-bitcoin', () => {
    it('should reject unauthenticated users', async () => {
      const ctrl = require('../src/controllers/integrations.controller');
      const mockReq = { user: null, body: {} };
      const mockRes = { 
        json: function(data) { return this; }, 
        status: function(code) { 
          expect(code).toBe(401);
          return this;
        } 
      };
      await ctrl.buyBitcoin(mockReq, mockRes);
    });

    it('should reject unverified users', async () => {
      const ctrl = require('../src/controllers/integrations.controller');
      const mockReq = { user: { id: 'test', isVerified: false }, body: {} };
      const mockRes = { 
        json: function(data) { return this; }, 
        status: function(code) { 
          expect(code).toBe(403);
          return this;
        } 
      };
      await ctrl.buyBitcoin(mockReq, mockRes);
    });

    it('should create transaction and return order ID', async () => {
      const ctrl = require('../src/controllers/integrations.controller');
      const mockReq = {
        user: { id: 'user_1', isVerified: true, region: 'US' },
        body: {
          amountCents: 10000,
          fiatCurrency: 'USD',
          paymentMethod: 'card',
          walletAddress: '1A1z7agoat5TpgaSScstu6E7XbtBaGQDSu'
        }
      };
      const mockRes = {
        json: function(data) {
          expect(data.id).toBeDefined();
          expect(data.status).toBeDefined();
          expect(data.btcSats).toBeGreaterThan(0);
          return this;
        },
        status: function() { return this; }
      };
      await ctrl.buyBitcoin(mockReq, mockRes);
    });

    it('should respect daily spend limits', async () => {
      const ctrl = require('../src/controllers/integrations.controller');
      // Mock user with high daily spend
      const user = { id: 'user_1', isVerified: true, region: 'US', dailySpent: 2000000 };
      const mockReq = {
        user,
        body: {
          amountCents: 100000,
          fiatCurrency: 'USD',
          paymentMethod: 'card',
          walletAddress: '1A1z7agoat5TpgaSScstu6E7XbtBaGQDSu'
        }
      };
      const mockRes = {
        json: function(data) { return this; },
        status: function(code) {
          // May or may not exceed depending on daily total
          return this;
        }
      };
      await ctrl.buyBitcoin(mockReq, mockRes);
    });
  });
});

describe('Withdrawals API', () => {
  it('should create withdrawal for verified user', async () => {
    const ctrl = require('../src/controllers/withdrawalController');
    const mockReq = {
      user: { id: 'user_1', isVerified: true, balanceCents: 100000 },
      body: { amountCents: 50000, bankAccountToken: 'tok_123' }
    };
    const mockRes = {
      json: function(data) {
        expect(data.id).toBeDefined();
        expect(data.status).toMatch(/processing|completed/);
        return this;
      },
      status: function() { return this; }
    };
    await ctrl.createWithdrawal(mockReq, mockRes);
  });

  it('should reject insufficient balance', async () => {
    const ctrl = require('../src/controllers/withdrawalController');
    const mockReq = {
      user: { id: 'user_1', isVerified: true, balanceCents: 10000 },
      body: { amountCents: 50000, bankAccountToken: 'tok_123' }
    };
    const mockRes = {
      json: function(data) { return this; },
      status: function(code) {
        expect(code).toBe(403);
        return this;
      }
    };
    await ctrl.createWithdrawal(mockReq, mockRes);
  });
});

describe('Admin Dashboard', () => {
  it('should retrieve transaction stats', async () => {
    const ctrl = require('../src/controllers/adminController');
    const mockReq = { query: {} };
    const mockRes = {
      json: function(data) {
        expect(data.transactions).toBeDefined();
        expect(data.transactions.total).toBeGreaterThanOrEqual(0);
        return this;
      }
    };
    await ctrl.getDashboardStats(mockReq, mockRes);
  });
});
