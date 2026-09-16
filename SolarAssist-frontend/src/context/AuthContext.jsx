import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { extractErrorMessage } from '../utils/errorHelper';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from sessionStorage on first render
  useEffect(() => {
    const storedUser = sessionStorage.getItem('solarassist_user') || localStorage.getItem('solarassist_user');
    const token = sessionStorage.getItem('solarassist_token') || localStorage.getItem('solarassist_token');

    if (storedUser && token) {
      sessionStorage.setItem('solarassist_user', storedUser);
      sessionStorage.setItem('solarassist_token', token);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      const { access_token, user } = res.data;

      sessionStorage.setItem('solarassist_token', access_token);
      sessionStorage.setItem('solarassist_user', JSON.stringify(user));
      localStorage.setItem('solarassist_token', access_token);
      localStorage.setItem('solarassist_user', JSON.stringify(user));
      localStorage.setItem('solarassist_last_email', user.email);

      setUser(user);
      return { success: true, user };
    } catch (err) {
      const message = extractErrorMessage(err) || 'Login failed';
      return { success: false, message };
    }
  };

  const register = async (formData) => {
    try {
      const payload = {
        full_name: formData.fullName,
        email: formData.email.trim(),
        phone: formData.phone,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        role: formData.role,
        business_name: formData.businessName || null,
        business_address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        service_area: formData.serviceArea || null,
        gst_id: formData.gst || null,
      };
      await api.post('/auth/register', payload);
      const loginResult = await login(payload.email, payload.password);
      if (!loginResult.success) return loginResult;
      return { success: true, user: loginResult.user };
    } catch (err) {
      const message = extractErrorMessage(err) || 'Registration failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('solarassist_token');
    sessionStorage.removeItem('solarassist_user');
    localStorage.removeItem('solarassist_token');
    localStorage.removeItem('solarassist_user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// This is the named export that was missing
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};