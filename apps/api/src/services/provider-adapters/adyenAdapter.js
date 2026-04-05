// DEV stub adapter for Adyen / CN region. Replace with @adyen/api-library calls for production.
async function charge(opts) {
  return { id: `adyen_sim_${Date.now()}`, status: 'succeeded' };
}

module.exports = { charge };
