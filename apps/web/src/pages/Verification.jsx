import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Step({ number, title, desc, status, action, actionLabel, loading }) {
  const statusStyles = {
    complete: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    not_started: 'bg-gray-100 dark:bg-gray-700 text-gray-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${statusStyles[status]}`}>
          {status === 'complete' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <span className="text-sm font-bold">{number}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            {status === 'complete' && (
              <span className="inline-flex px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full">Verified</span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
          {action && status !== 'complete' && (
            <button onClick={action} disabled={loading}
              className="mt-4 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 hover:shadow-md">
              {loading ? 'Processing...' : actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Verification() {
  const { user, refreshUser } = useAuth();
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  useEffect(() => {
    api.getVerificationStatus()
      .then(setKycStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSendEmail = async () => {
    setError(''); setSuccess(''); setActionLoading('email');
    try {
      const res = await api.sendVerificationEmail();
      setShowEmailInput(true);
      if (res.devCode) setDevCode(res.devCode);
      setSuccess('Verification code sent to your email.');
    } catch (err) { setError(err.message); }
    finally { setActionLoading(''); }
  };

  const handleVerifyEmail = async () => {
    setError(''); setSuccess(''); setActionLoading('verify-email');
    try {
      await api.verifyEmail(emailCode);
      setSuccess('Email verified successfully!');
      setShowEmailInput(false);
      await refreshUser();
      const status = await api.getVerificationStatus();
      setKycStatus(status);
    } catch (err) { setError(err.message); }
    finally { setActionLoading(''); }
  };

  const handleStartIdentity = async () => {
    setError(''); setActionLoading('identity');
    try {
      const res = await api.startVerification();
      if (res.url) {
        window.open(res.url, '_blank');
        setSuccess('Identity verification opened in a new tab. Complete it there and come back.');
      } else {
        setSuccess('Identity verification initiated. You will be notified when complete.');
        await refreshUser();
        const status = await api.getVerificationStatus();
        setKycStatus(status);
      }
    } catch (err) { setError(err.message); }
    finally { setActionLoading(''); }
  };

  const emailVerified = user?.isVerified || kycStatus?.isVerified;
  const identityVerified = kycStatus?.identityVerified;
  const addressVerified = kycStatus?.addressVerified;
  const allDone = emailVerified && identityVerified;

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verification Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Complete verification to unlock all features and higher transaction limits.</p>
        </div>

        {/* Progress bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Verification Progress</span>
            <span className="text-sm font-bold text-brand-600">
              {[emailVerified, identityVerified, addressVerified].filter(Boolean).length}/3
            </span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-500 to-purple-600 rounded-full transition-all duration-700"
              style={{ width: `${([emailVerified, identityVerified, addressVerified].filter(Boolean).length / 3) * 100}%` }}></div>
          </div>
          {allDone && (
            <div className="mt-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <span className="text-sm font-semibold">Fully Verified — All features unlocked</span>
            </div>
          )}
        </div>

        {error && <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm animate-fadeIn">{error}</div>}
        {success && <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-lg text-sm animate-fadeIn">{success}</div>}

        <div className="space-y-4">
          {/* Step 1: Email Verification */}
          <Step
            number="1"
            title="Email Verification"
            desc="Verify your email address to confirm your identity and receive important notifications."
            status={emailVerified ? 'complete' : 'not_started'}
            action={handleSendEmail}
            actionLabel="Send Verification Code"
            loading={actionLoading === 'email'}
          />

          {/* Email code input */}
          {showEmailInput && !emailVerified && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-brand-200 dark:border-brand-700 p-6 ml-14 animate-slideUp">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Enter the 6-digit code sent to your email:</p>
              {devCode && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg mb-3">
                  Dev mode — your code is: <span className="font-mono font-bold">{devCode}</span>
                </p>
              )}
              <div className="flex gap-3">
                <input type="text" value={emailCode} onChange={e => setEmailCode(e.target.value)}
                  maxLength={6} placeholder="123456"
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:bg-gray-700 dark:text-white transition-colors" />
                <button onClick={handleVerifyEmail} disabled={emailCode.length !== 6 || actionLoading === 'verify-email'}
                  className="px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-50">
                  {actionLoading === 'verify-email' ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Identity Verification */}
          <Step
            number="2"
            title="Identity Verification (KYC)"
            desc="Upload a government-issued ID and take a selfie to verify your identity. Powered by Stripe Identity."
            status={identityVerified ? 'complete' : emailVerified ? 'pending' : 'not_started'}
            action={emailVerified ? handleStartIdentity : null}
            actionLabel="Start Identity Verification"
            loading={actionLoading === 'identity'}
          />

          {/* Step 3: Address Verification */}
          <Step
            number="3"
            title="Address Verification"
            desc="Confirm your business address. This is automatically verified through your identity documents."
            status={addressVerified ? 'complete' : identityVerified ? 'pending' : 'not_started'}
          />
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Verification Benefits</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: 'Higher transaction limits', unlocked: emailVerified },
              { label: 'Instant withdrawals', unlocked: identityVerified },
              { label: 'Full API access', unlocked: emailVerified },
              { label: 'Priority support', unlocked: allDone },
              { label: 'Reduced fees (0.3%)', unlocked: identityVerified },
              { label: 'Business invoicing', unlocked: emailVerified },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-3 p-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${b.unlocked ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  {b.unlocked
                    ? <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                </div>
                <span className={`text-sm ${b.unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
