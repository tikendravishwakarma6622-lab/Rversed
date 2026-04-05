const http = require('http');

/**
 * rversed End-to-End Test Suite
 * Tests all critical platform functionality before launch
 */

const tests = [];
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.error(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

async function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          resolve(JSON.parse(data || '{}'));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🚀 rversed E2E Test Suite');
  console.log('='.repeat(50));
  console.log('');

  // Test 1: Health Check
  await test('API Health Check', async () => {
    const res = await request('GET', '/health');
    if (!res.ok) throw new Error('Health check failed');
  });

  // Test 2: Payment Methods
  await test('Get Payment Methods', async () => {
    const res = await request('GET', '/api/integrations/methods');
    if (!Array.isArray(res)) throw new Error('Methods not an array');
    if (res.length === 0) throw new Error('No payment methods');
  });

  // Test 3: Bitcoin Quote
  await test('Get BTC Quote', async () => {
    const res = await request('GET', '/api/integrations/quote?amount=100');
    if (!res.btcAmount) throw new Error('No BTC amount in quote');
    if (res.btcAmount <= 0) throw new Error('Invalid BTC amount');
  });

  // Test 4: xez AI Chat
  await test('xez AI Chat', async () => {
    const res = await request('POST', '/api/ai/chat', {
      userId: 'test_user',
      message: 'What payment methods do you support?',
    });
    if (!res.message) throw new Error('No AI response');
    if (res.message.length < 10) throw new Error('AI response too short');
  });

  // Test 5: Payment Method Recommendation
  await test('xez AI Recommendations', async () => {
    const res = await request('POST', '/api/ai/recommend-method', {
      userId: 'test_user',
      region: 'US',
      amountCents: 100000,
      userHistory: { transactionCount: 5, avgAmount: 50000 },
    });
    if (!res.recommendation) throw new Error('No recommendation');
  });

  // Test 6: Admin Stats
  await test('Admin Dashboard Stats', async () => {
    const res = await request('GET', '/api/admin/stats');
    if (res.totalVolume === undefined) throw new Error('No total volume');
    if (res.transactionCount === undefined) throw new Error('No transaction count');
  });

  // Test 7: Admin Transactions
  await test('Admin Transactions Endpoint', async () => {
    const res = await request('GET', '/api/admin/transactions');
    if (!Array.isArray(res)) throw new Error('Transactions not an array');
  });

  // Test 8: Admin Users
  await test('Admin Users Endpoint', async () => {
    const res = await request('GET', '/api/admin/users');
    if (!Array.isArray(res)) throw new Error('Users not an array');
  });

  // Test 9: Plaid Link Token
  await test('Plaid Link Token Creation', async () => {
    const res = await request('POST', '/api/integrations/plaid-link-token', {
      userId: 'test_user',
    });
    if (!res.linkToken) throw new Error('No link token');
  });

  // Summary
  console.log('');
  console.log('='.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 All tests passed! Ready for production.');
    process.exit(0);
  } else {
    console.log(`⚠️  ${failed} test(s) failed. Review before launch.`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
