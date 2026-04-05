import React, { useEffect, useState } from 'react';
import api from '../services/api';

/**
 * Plaid Link Integration for US bank account ACH setup
 */
export default function PlaidLink({ user, onSuccess, onError, onBack }) {
  const [loading, setLoading] = useState(false);
  const [linkToken, setLinkToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch Plaid link token
    (async () => {
      try {
        const resp = await api.createPlaidLinkToken();
        setLinkToken(resp.link_token);
      } catch (err) {
        setError('Failed to initialize Plaid: ' + err.message);
        onError?.(err.message);
      }
    })();
  }, []);

  function handlePlaidSuccess(publicToken, metadata) {
    setLoading(true);
    // TODO: Exchange public token for Stripe PaymentMethod
    // Send to backend: POST /api/plaid/exchange-token
    // Then call buyBitcoin with the resulting Stripe PaymentMethod ID
    setLoading(false);
    onSuccess?.({ publicToken, metadata });
  }

  if (!linkToken) {
    return <div>Loading Plaid Link...</div>;
  }

  // In production, render the actual Plaid Link component
  // For now, show a placeholder
  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <button onClick={onBack}>← Back</button>
      <h2>Link Bank Account (US)</h2>
      <p>Connect your bank account for instant ACH transfers.</p>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button disabled={loading}>
        {loading ? 'Processing…' : 'Open Plaid Link'}
      </button>
      <small>(Plaid Link component requires full SDK integration)</small>
    </div>
  );
}
