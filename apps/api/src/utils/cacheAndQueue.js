const Redis = require('redis');
const bull = require('bull');

/**
 * Request queue + caching layer to optimize provider calls
 * Reduces API costs by batching and caching requests
 */

const redisClient = process.env.REDIS_URL
  ? Redis.createClient({ url: process.env.REDIS_URL })
  : Redis.createClient();

// Request queues for batch processing
const paymentQueue = new bull('payments', process.env.REDIS_URL || 'redis://localhost:6379');
const quoteQueue = new bull('quotes', process.env.REDIS_URL || 'redis://localhost:6379');
const checkFraudQueue = new bull('fraud-checks', process.env.REDIS_URL || 'redis://localhost:6379');

const CACHE_TTL = {
  quote: 60, // 1 minute
  user: 300, // 5 minutes
  exchange_rate: 300, // 5 minutes
};

/**
 * Get cached value
 */
async function getCached(key) {
  try {
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.warn(`Cache get error: ${err.message}`);
    return null;
  }
}

/**
 * Set cached value
 */
async function setCached(key, value, ttl = CACHE_TTL.quote) {
  try {
    await redisClient.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.warn(`Cache set error: ${err.message}`);
  }
}

/**
 * Queue a payment for batch processing
 */
async function queuePayment(transactionId, paymentData) {
  try {
    await paymentQueue.add(
      { transactionId, ...paymentData },
      {
        priority: paymentData.priority || 5,
        delay: paymentData.delay || 0,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      }
    );
  } catch (err) {
    console.error(`Payment queue error: ${err.message}`);
    throw err;
  }
}

/**
 * Get cached BTC quote (avoid redundant provider calls)
 */
async function getCachedQuote(amountCents, fiatCurrency = 'USD') {
  const cacheKey = `quote:${fiatCurrency}:${Math.floor(amountCents / 100)}`;
  const cached = await getCached(cacheKey);
  
  if (cached) {
    console.log(`[CACHE HIT] Quote for ${fiatCurrency} ${amountCents / 100}`);
    return cached;
  }

  return null; // Cache miss — caller fetches fresh quote
}

/**
 * Cache a BTC quote
 */
async function cacheQuote(amountCents, fiatCurrency, quoteData) {
  const cacheKey = `quote:${fiatCurrency}:${Math.floor(amountCents / 100)}`;
  await setCached(cacheKey, quoteData, CACHE_TTL.quote);
}

/**
 * Setup batch payment processor (runs periodically)
 */
async function setupPaymentBatchProcessor() {
  paymentQueue.process(10, async (job) => {
    const { transactionId, amountCents, paymentMethodId } = job.data;
    
    console.log(`[BATCH PROCESSING] Payment ${transactionId}...`);
    
    try {
      // Call provider (Stripe, Adyen, etc.)
      // This is where batching saves costs — fewer individual API calls
      const result = await processPaymentBatch([job.data]);
      return result;
    } catch (err) {
      throw new Error(`Batch processing failed: ${err.message}`);
    }
  });

  paymentQueue.on('completed', (job) => {
    console.log(`[BATCH SUCCESS] Payment ${job.data.transactionId} completed`);
  });

  paymentQueue.on('failed', (job, err) => {
    console.error(`[BATCH FAILED] Payment ${job.data.transactionId}: ${err.message}`);
  });
}

/**
 * Cost optimization: batch multiple payments into single provider call
 */
async function processPaymentBatch(payments) {
  // This would group payments and send to provider in batches
  // Example: send 10 ACH transfers in one API call instead of 10 calls
  console.log(`[COST OPTIMIZATION] Batching ${payments.length} payments into single provider call`);
  
  // Simulated batch response
  return payments.map(p => ({
    transactionId: p.transactionId,
    status: 'succeeded',
    batchId: `batch_${Date.now()}`,
  }));
}

module.exports = {
  getCached,
  setCached,
  queuePayment,
  getCachedQuote,
  cacheQuote,
  setupPaymentBatchProcessor,
  processPaymentBatch,
  redisClient,
  paymentQueue,
  quoteQueue,
  checkFraudQueue,
};
