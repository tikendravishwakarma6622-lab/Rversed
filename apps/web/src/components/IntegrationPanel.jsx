import React from 'react';

export default function IntegrationPanel({ user, onBuy }) {
  return (
    <div style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, maxWidth: 480 }}>
      <h3>rversed — Buy Bitcoin</h3>
      <p>{user?.isVerified ? 'Verified account — instant buy enabled' : 'KYC required to buy BTC'}</p>
      <button onClick={onBuy} disabled={!user?.isVerified}>Buy BTC</button>
    </div>
  );
}
