import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Payments() {
  const navigate = useNavigate();
  const [methods, setMethods] = useState([]);
  const [amount, setAmount] = useState('');
  const [wallet, setWallet] = useState('');
  const [method, setMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPaymentMethods()
      .then(data => { setMethods(data.methods || []); if (data.methods?.length) setMethod(data.methods[0]); })
      .catch(() => {});
  }, []);

  const handleBuy = async (e) => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      const res = await api.buyBitcoin({ amountCents: Math.round(parseFloat(amount) * 100), walletAddress: wallet, paymentMethod: method, paymentToken: 'tok_dev_' + Date.now() });
      setResult(res);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const methodLabels = { card: 'Credit / Debit Card', ach: 'ACH Bank Transfer', bank_link: 'Bank Link (Plaid)', unionpay: 'UnionPay' };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Buy Bitcoin</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Purchase BTC using your preferred payment method.</p>
        </div>

        {result ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center animate-slideUp">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Transaction Submitted</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Your transaction is being processed.</p>
            <div className="bg-gray-50 dark:bg-gray-750 rounded-xl p-4 text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Transaction ID</span><span className="font-mono text-xs text-gray-700 dark:text-gray-300">{result.transaction?.id?.slice(0, 16) || result.id?.slice(0, 16)}...</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Amount</span><span className="font-medium text-gray-900 dark:text-white">${amount}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">BTC</span><span className="font-medium text-gray-900 dark:text-white">{result.btcSats ? (result.btcSats / 1e8).toFixed(8) : '—'} BTC</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Status</span><span className="inline-flex px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">{result.status || result.transaction?.status}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setResult(null); setAmount(''); setWallet(''); }} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg text-sm transition-colors">New Transaction</button>
              <button onClick={() => navigate('/transactions')} className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-sm transition-colors">View Transactions</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBuy} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 space-y-6 animate-slideUp">
            {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm animate-fadeIn">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input type="number" required min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm bg-white dark:bg-gray-700 dark:text-white transition-colors" placeholder="100.00" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bitcoin wallet address</label>
              <input type="text" required value={wallet} onChange={e => setWallet(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm font-mono bg-white dark:bg-gray-700 dark:text-white transition-colors" placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Payment method</label>
              <div className="grid grid-cols-2 gap-3">
                {methods.map(m => (
                  <button type="button" key={m} onClick={() => setMethod(m)}
                    className={`p-3 rounded-lg border text-sm font-medium text-left transition-all ${method === m ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500' : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'}`}>
                    {methodLabels[m] || m}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 text-sm hover:shadow-md">
              {loading ? 'Processing...' : `Buy Bitcoin — $${amount || '0.00'}`}
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">Transactions processed via secure payment partners. 0.5% fee included.</p>
          </form>
        )}
      </div>
    </div>
  );
}
