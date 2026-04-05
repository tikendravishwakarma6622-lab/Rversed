const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://rversed:dev_password@localhost:5432/rversed',
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error:', err);
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 200) console.log('Slow query:', { text: text.slice(0, 80), duration, rows: res.rowCount });
  return res;
}

async function getOne(text, params) {
  const res = await query(text, params);
  return res.rows[0] || null;
}

async function getMany(text, params) {
  const res = await query(text, params);
  return res.rows;
}

async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, getOne, getMany, transaction };
