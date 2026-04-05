import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.profile?.onboardingComplete ? '/dashboard' : '/onboarding');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 to-purple-700 items-center justify-center p-12">
        <div className="max-w-md animate-fadeIn">
          <h2 className="text-4xl font-bold text-white mb-4">Welcome back</h2>
          <p className="text-brand-100 text-lg leading-relaxed">Sign in to manage your payments, view your dashboard, and grow your business.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900 transition-colors">
        <div className="w-full max-w-md animate-slideUp">
          <Link to="/" className="text-2xl font-bold text-brand-600 tracking-tight">Rversed</Link>
          <h1 className="mt-8 text-2xl font-bold text-gray-900 dark:text-white">Sign in to your account</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Don't have an account? <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">Sign up</Link>
          </p>
          {error && <div className="mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm animate-fadeIn">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm bg-white dark:bg-gray-800 dark:text-white"
                placeholder="you@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm bg-white dark:bg-gray-800 dark:text-white"
                placeholder="Enter your password" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 text-sm hover:shadow-md">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
