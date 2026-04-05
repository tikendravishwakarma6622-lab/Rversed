import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rversed_token');
    if (token) {
      api.me()
        .then(u => setUser(u))
        .catch(() => localStorage.removeItem('rversed_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('rversed_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password) => {
    const data = await api.register(email, password);
    localStorage.setItem('rversed_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.logout().catch(() => {});
    localStorage.removeItem('rversed_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const u = await api.me();
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
