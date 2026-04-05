import React, { useEffect, useState } from 'react';

const API = 'http://localhost:4000';

function headers() {
  const h = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('rversed_token');
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

function StatBox({ label, value, sub, color }) {
  const bg = { blue: 'from-blue-500 to-blue-600', green: 'from-emerald-500 to-emerald-600', amber: 'from-amber-500 to-amber-600', purple: 'from-purple-500 to-purple-600', red: 'from-red-500 to-red-600', gray: 'from-gray-500 to-gray-600' };
  return (
    <div className={`bg-gradient-to-br ${bg[color] || bg.blue} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="text-xs font-medium opacity-80 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs opacity-70 mt-1">{sub}</div>}
    </div>
  );
}

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/admin/stats`, { headers: headers() }).then(r => r.json()),
      fetch(`${API}/api/admin/users`, { headers: headers() }).then(r => r.json()),
      fetch(`${API}/api/admin/transactions`, { headers: headers() }).then(r => r.json()),
    ]).then(([s, u, t]) => {
      setStats(s);
      setUsers(u.users || []);
      setTransactions(t.transactions || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const fmt = (v) => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
  const statusBadge = (s) => {
    const c = { completed: 'bg-emerald-100 text-emerald-700', pending: 'bg-amber-100 text-amber-700', failed: 'bg-red-100 text-red-700', processing: 'bg-blue-100 text-blue-700' };
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c[s] || 'bg-gray-100 text-gray-600'}`}>{s}</span>;
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;

  const tabs = ['overview', 'users', 'transactions'];

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform overview and management.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-8 w-fit">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && stats && (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatBox label="Users" value={stats.users} color="blue" />
              <StatBox label="Transactions" value={stats.transactions?.total} color="purple" />
              <StatBox label="Volume" value={fmt(stats.transactions?.totalVolume)} color="green" />
              <StatBox label="Completed" value={stats.transactions?.completed} color="green" />
              <StatBox label="Pending" value={stats.transactions?.pending} color="amber" />
              <StatBox label="Failed" value={stats.transactions?.failed} color="red" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Transaction Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Completed', val: stats.transactions?.completed, total: stats.transactions?.total, color: 'bg-emerald-500' },
                    { label: 'Pending', val: stats.transactions?.pending, total: stats.transactions?.total, color: 'bg-amber-500' },
                    { label: 'Failed', val: stats.transactions?.failed, total: stats.transactions?.total, color: 'bg-red-500' },
                  ].map(b => (
                    <div key={b.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">{b.label}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{b.val || 0}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full ${b.color} rounded-full transition-all duration-500`} style={{ width: `${b.total ? (b.val / b.total) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Withdrawals</h3>
                <div className="grid grid-cols-2 gap-4">
                  {['total', 'completed', 'pending', 'failed'].map(k => (
                    <div key={k} className="bg-gray-50 dark:bg-gray-750 rounded-xl p-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{k}</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.withdrawals?.[k] || 0}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    {['Email', 'Region', 'Verified', 'Balance', 'Transactions', 'Joined'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{u.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{u.region}</td>
                      <td className="px-6 py-4">
                        {u.isVerified || u.is_verified
                          ? <span className="inline-flex px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Yes</span>
                          : <span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">No</span>}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{fmt((u.balanceCents || u.balance_cents || 0) / 100)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{u.totalTransactions || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{u.createdAt || u.created_at ? new Date(u.createdAt || u.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'transactions' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    {['ID', 'User', 'Amount', 'BTC', 'Method', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-gray-500 dark:text-gray-400">{tx.id?.slice(0, 8)}...</td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-500 dark:text-gray-400">{(tx.userId || tx.user_id)?.slice(0, 8)}...</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{fmt((tx.amountCents || tx.amount_cents || 0) / 100)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">{tx.btcSats || tx.btc_sats ? ((tx.btcSats || tx.btc_sats) / 1e8).toFixed(6) : '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">{tx.paymentMethod || tx.payment_method || '—'}</td>
                      <td className="px-6 py-4">{statusBadge(tx.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(tx.createdAt || tx.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
