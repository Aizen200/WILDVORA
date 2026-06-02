import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/hostAPI';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('hostToken');
    if (token) {
      authAPI.me()
        .then(res => setUser(res.data.user))
        .catch(() => localStorage.removeItem('hostToken'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    if (!['operator', 'admin'].includes(user.role)) {
      throw new Error('Access denied. Host account required.');
    }
    localStorage.setItem('hostToken', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('hostToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
