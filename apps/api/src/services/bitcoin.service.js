const fetch = require('node-fetch');

async function getQuote({ amountCents, fiatCurrency = 'USD' }) {
  const vs = fiatCurrency.toLowerCase();
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${vs}`;
  const resp = await fetch(url);
  const json = await resp.json();
  const price = Number(json?.bitcoin?.[vs]);
  if (!price || price <= 0) throw new Error('quote_unavailable');
  const fiat = amountCents / 100;
  const btc = fiat / price;
  const sats = Math.floor(btc * 100_000_000);
  return { btc, btcSats: sats, price };
}

module.exports = { getQuote };
