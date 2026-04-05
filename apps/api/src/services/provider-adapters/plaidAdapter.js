const plaid = require('plaid');

const plaidClient = process.env.PLAID_CLIENT_ID
  ? new plaid.PlaidApi(
      new plaid.Configuration({
        basePath: plaid.PlaidEnvironments.sandbox,
        baseServer: new plaid.ServerConfiguration(
          plaid.PlaidEnvironments.sandbox,
          {}
        ),
        apiKey: process.env.PLAID_SECRET,
        clientId: process.env.PLAID_CLIENT_ID,
      })
    )
  : null;

/**
 * Create Plaid Link token for bank account authentication
 */
async function createLinkToken(opts) {
  const { userId, userName, userEmail, country = 'US' } = opts;

  if (!plaidClient) throw new Error('Plaid not configured');

  try {
    const request = {
      user: { client_user_id: userId },
      client_name: 'rversed',
      language: 'en',
      products: ['auth'],
      country_codes: [country],
      webhook: process.env.PLAID_WEBHOOK || 'https://api.rversed.app/webhooks/plaid',
    };

    const response = await plaidClient.linkTokenCreate(request);
    return { link_token: response.data.link_token };
  } catch (err) {
    throw new Error(`Plaid LinkToken creation failed: ${err.message}`);
  }
}

/**
 * Exchange Plaid public token for access token
 */
async function exchangePublicToken(opts) {
  const { publicToken } = opts;

  if (!plaidClient) throw new Error('Plaid not configured');

  try {
    const response = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
    return {
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
    };
  } catch (err) {
    throw new Error(`Plaid token exchange failed: ${err.message}`);
  }
}

/**
 * Get bank account information for ACH setup
 */
async function getAuth(opts) {
  const { accessToken } = opts;

  if (!plaidClient) throw new Error('Plaid not configured');

  try {
    const response = await plaidClient.authGet({ access_token: accessToken });
    const accounts = response.data.accounts;
    const auth = response.data.auth;

    return {
      accounts: accounts.map(acc => ({
        id: acc.account_id,
        name: acc.name,
        official_name: acc.official_name,
        type: acc.subtype,
        mask: auth.numbers.ach[0]?.account_mask || 'XXXX',
        routing_number: auth.numbers.ach[0]?.routing_number || '',
      })),
    };
  } catch (err) {
    throw new Error(`Plaid auth retrieval failed: ${err.message}`);
  }
}

module.exports = {
  createLinkToken,
  exchangePublicToken,
  getAuth,
};
