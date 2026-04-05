import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function BuyBitcoin({ user, onBack }) {
  const [methods, setMethods] = useState([]);
  const [amount, setAmount] = useState('');
  const [wallet, setWallet] = useState('');
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const m = await api.getPaymentMethods();
        setMethods(m.methods || []);
        setMethod(m.methods?.[0] || 'card');
      } catch (err) {
        console.error(err);
        setMethods(['card']);
      }
    })();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    const cents = Math.round(parseFloat(amount || '0') * 100);
    const payload = { amountCents: cents, fiatCurrency: 'USD', paymentMethod: method, walletAddress: wallet };

    // NOTE: in production use Stripe Elements / Plaid Link to collect paymentMethodId securely.
    if (method === 'card') payload.paymentDetails = { paymentMethodId: 'pm_card_test' };
    if (method === 'bank_link') payload.paymentDetails = { paymentMethodId: 'bank_tok_dev' };

    try {
      const res = await api.buyBitcoin(payload);
      if (res.error) alert('Error: ' + res.error);
      else alert(`Order ${res.id} — status ${res.status} — ${res.btcSats} sats`);
    } catch (err) {
      alert('Request failed: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <button onClick={onBack} style={{ marginBottom: 12 }}>← Back</button>
      <h2>Buy Bitcoin on rversed</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
        <label>Amount (USD)</label>
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 100" />

        <label>Wallet address</label>
        <input value={wallet} onChange={e => setWallet(e.target.value)} placeholder="Your BTC address" />

        <label>Payment method</label>
        <select value={method} onChange={e => setMethod(e.target.value)}>
          {methods.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        {method === 'card' && <input placeholder="card token / paymentMethodId (dev)" />}
        {method === 'bank_link' && <input placeholder="bank token (dev)" />}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading || !user?.isVerified}>Buy now</button>
          <div style={{ alignSelf: 'center', color: '#666' }}>{loading ? 'Processing…' : ''}</div>
        </div>
      </form>
    </div>
  );
}
