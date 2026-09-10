import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('istidamah_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => localStorage.removeItem('istidamah_token'))
      .finally(() => setLoading(false));
  }, []);

  /**
   * `identifier` is an email address or a phone number — the sign-in form
   * accepts either in one field, and the server resolves which it is.
   */
  const login = useCallback(async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('istidamah_token', res.data.token);
    setUser(res.data.data);
    return res.data.data;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register', payload);
    localStorage.setItem('istidamah_token', res.data.token);
    setUser(res.data.data);
    return res.data.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('istidamah_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
