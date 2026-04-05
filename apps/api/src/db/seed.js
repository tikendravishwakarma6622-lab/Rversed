const db = require('./inMemoryDb');

/**
 * Seed test data for development
 */
function seedDatabase() {
  // Add test users
  db.users.push(
    {
      id: 'user_demo',
      email: 'demo@rversed.test',
      isVerified: true,
      identityVerified: true,
      addressVerified: true,
      region: 'US',
      balanceCents: 100_000_00, // $100k
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user_ca',
      email: 'ca@rversed.test',
      isVerified: true,
      region: 'CA',
      balanceCents: 50_000_00, // $50k
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user_cn',
      email: 'cn@rversed.test',
      isVerified: true,
      region: 'CN',
      balanceCents: 75_000_00, // $75k
      createdAt: new Date().toISOString(),
    }
  );

  console.log('✅ Database seeded with test users');
}

module.exports = { seedDatabase };
