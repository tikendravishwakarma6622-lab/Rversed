import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function StatCard({ label, value, sub, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${colors[color]} mb-3`}>{label}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      {sub && <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !user.profile?.onboardingComplete) { navigate('/onboarding'); return; }
    api.getDashboard().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, [user, navigate]);

  const fmt = (cents) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });
  const fmtBtc = (sats) => (sats / 1e8).toFixed(8) + ' BTC';

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Welcome back, {user?.profile?.fullName || user?.email}
              {user?.profile?.businessName && <span className="text-gray-400 dark:text-gray-500"> — {user.profile.businessName}</span>}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/invoices" className="inline-flex items-center px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              New Invoice
            </Link>
            <Link to="/payments" className="inline-flex items-center px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-sm transition-all shadow-sm hover:shadow-md">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Payment
            </Link>
          </div>
        </div>

        {!stats?.isVerified && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex items-start gap-3 animate-slideUp">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Account not verified</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Complete identity verification to unlock all features and higher limits.</p>
            </div>
            <Link to="/verification" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0">
              Verify Now
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Balance" value={fmt(stats?.balanceCents || 0)} color="brand" />
          <StatCard label="Total Spent" value={fmt(stats?.totalSpentCents || 0)} color="green" />
          <StatCard label="Bitcoin" value={fmtBtc(stats?.totalBtcSats || 0)} color="amber" />
          <StatCard label="Transactions" value={stats?.transactionCount || 0} color="gray" />
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { to: '/payments', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'brand', title: 'Buy Bitcoin', desc: 'Purchase BTC with card or bank transfer' },
            { to: '/invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'emerald', title: 'Invoices', desc: 'Create and send professional invoices' },
            { to: '/transactions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'purple', title: 'Transaction History', desc: 'View all your past transactions' },
          ].map(card => (
            <Link key={card.to} to={card.to} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg hover:border-brand-200 dark:hover:border-brand-700 transition-all duration-300 group hover:-translate-y-0.5">
              <div className={`w-10 h-10 bg-${card.color}-50 dark:bg-${card.color}-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <svg className={`w-5 h-5 text-${card.color}-600 dark:text-${card.color}-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} /></svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{card.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.desc}</p>
            </Link>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Account Status</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Email Verified', done: true },
              { label: 'Identity Verified', done: stats?.identityVerified },
              { label: 'Business Onboarded', done: stats?.onboardingComplete },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-750">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {s.done
                    ? <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>}
                </div>
                <span className={`text-sm font-medium ${s.done ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
