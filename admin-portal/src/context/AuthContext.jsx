import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      authAPI.me()
        .then(res => {
          if (res.data.user && res.data.user.role === 'admin') {
            setUser(res.data.user);
          } else {
            localStorage.removeItem('adminToken');
          }
        })
        .catch(() => localStorage.removeItem('adminToken'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    if (user.role !== 'admin') {
      throw new Error('Access denied. Admin account required.');
    }
    localStorage.setItem('adminToken', token);
    setUser(user);
  };

  const register = async (name, email, phone, password, role) => {
    const res = await authAPI.register({ name, email, phone, password, role });
    const { token, user } = res.data;
    if (user.role !== 'admin') {
      throw new Error('Access denied. Admin account required.');
    }
    localStorage.setItem('adminToken', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
