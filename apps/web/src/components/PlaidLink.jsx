import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function PlaidLink({ user, onSuccess, onError, onBack }) {
  const [loading, setLoading] = useState(false);
  const [linkToken, setLinkToken] = useState(null);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [exchanging, setExchanging] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const resp = await api.createPlaidLinkToken();
        setLinkToken(resp.link_token);
      } catch (err) {
        setError('Failed to initialize bank connection: ' + err.message);
        onError?.(err.message);
      }
    })();
  }, []);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      // In production with real Plaid keys, this would open the Plaid Link modal.
      // For dev mode, we simulate the public token exchange.
      const result = await api.exchangePlaidToken('public-sandbox-token');
      setAccounts(result.accounts || []);
      onSuccess?.({ accounts: result.accounts, accessToken: result.accessToken });
    } catch (err) {
      setError('Bank connection failed: ' + err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (accounts) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 animate-slideUp">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Bank Account Connected</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ready for instant transfers</p>
          </div>
        </div>
        <div className="space-y-2">
          {accounts.map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{a.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">••••{a.mask}</span>
              </div>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">{a.type}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 animate-slideUp">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Link Bank Account</h3>
        {onBack && (
          <button onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Cancel</button>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Connect your US bank account for instant ACH transfers with lower fees.</p>
      {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
      {!linkToken ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
        </div>
      ) : (
        <button onClick={handleConnect} disabled={loading}
          className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-50">
          {loading ? 'Connecting...' : 'Connect Bank Account via Plaid'}
        </button>
      )}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">Secured by Plaid. Your credentials are never stored on our servers.</p>
    </div>
  );
}
