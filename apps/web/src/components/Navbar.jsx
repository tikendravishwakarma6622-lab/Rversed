import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/payments', label: 'Payments' },
    { to: '/invoices', label: 'Invoices' },
    { to: '/transactions', label: 'Transactions' },
    { to: '/verification', label: 'Verification' },
    { to: '/admin', label: 'Admin' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="text-xl font-bold text-brand-600 tracking-tight">Rversed</Link>
            <div className="hidden lg:flex gap-1">
              {links.map(l => (
                <Link key={l.to} to={l.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === l.to ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Dark mode toggle */}
            <button onClick={toggle} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Toggle theme">
              {dark ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</span>
            <button onClick={handleLogout} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Logout
            </button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggle} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              {dark ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 space-y-1 animate-slideDown">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === l.to ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'text-gray-600 dark:text-gray-400'}`}>
              {l.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
            <span className="block px-3 py-1 text-xs text-gray-400">{user?.email}</span>
            <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Logout</button>
          </div>
        </div>
      )}
    </nav>
  );
}
