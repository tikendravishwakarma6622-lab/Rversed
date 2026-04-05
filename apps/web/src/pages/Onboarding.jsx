import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: '', businessType: 'individual', fullName: '', phone: '',
    line1: '', city: '', state: '', zip: '', country: 'US',
  });

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.updateProfile({
        businessName: form.businessName, businessType: form.businessType, fullName: form.fullName, phone: form.phone,
        address: { line1: form.line1, city: form.city, state: form.state, zip: form.zip, country: form.country },
      });
      await refreshUser();
      navigate('/dashboard');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  if (user?.profile?.onboardingComplete) { navigate('/dashboard'); return null; }

  const inputClass = "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm bg-white dark:bg-gray-700 dark:text-white transition-colors";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-lg animate-slideUp">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set up your business</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Step {step} of 2 — {step === 1 ? 'Business details' : 'Address'}</p>
          <div className="flex gap-2 mt-4">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
          </div>
        </div>
        {error && <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full name</label>
                <input required value={form.fullName} onChange={set('fullName')} className={inputClass} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Business name</label>
                <input required value={form.businessName} onChange={set('businessName')} className={inputClass} placeholder="Acme Inc." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Business type</label>
                <select value={form.businessType} onChange={set('businessType')} className={inputClass + " bg-white dark:bg-gray-700"}>
                  <option value="individual">Individual / Sole Proprietor</option>
                  <option value="llc">LLC</option>
                  <option value="corporation">Corporation</option>
                  <option value="partnership">Partnership</option>
                  <option value="nonprofit">Non-profit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone number</label>
                <input value={form.phone} onChange={set('phone')} className={inputClass} placeholder="+1 (555) 123-4567" />
              </div>
              <button type="button" onClick={() => { if (form.fullName && form.businessName) setStep(2); }}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-all text-sm hover:shadow-md">Continue</button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Street address</label>
                <input required value={form.line1} onChange={set('line1')} className={inputClass} placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">City</label><input required value={form.city} onChange={set('city')} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">State</label><input required value={form.state} onChange={set('state')} className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ZIP code</label><input required value={form.zip} onChange={set('zip')} className={inputClass} /></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Country</label>
                  <select value={form.country} onChange={set('country')} className={inputClass + " bg-white dark:bg-gray-700"}>
                    <option value="US">United States</option><option value="CA">Canada</option><option value="GB">United Kingdom</option><option value="AU">Australia</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors text-sm">Back</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 text-sm hover:shadow-md">{loading ? 'Saving...' : 'Complete Setup'}</button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
