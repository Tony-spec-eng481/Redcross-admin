import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if we have stored tokens and validate them
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedAdmin = localStorage.getItem('admin');

    if (token && storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
      setIsAuthenticated(true);

      // Verify token is still valid by fetching profile
      api.get('/auth/me')
        .then(res => {
          const adminData = res.data.data;
          setAdmin(adminData);
          localStorage.setItem('admin', JSON.stringify(adminData));
        })
        .catch(() => {
          // Token invalid — clear everything
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('admin');
          setIsAuthenticated(false);
          setAdmin(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, admin: adminData } = res.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('admin', JSON.stringify(adminData));

      setAdmin(adminData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout API errors
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('admin');
    setIsAuthenticated(false);
    setAdmin(null);
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.patch('/auth/me', data);
      const updated = res.data.data;
      setAdmin(updated);
      localStorage.setItem('admin', JSON.stringify(updated));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Update failed.' };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.patch('/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Password change failed.' };
    }
  };

  const updateNotificationPreferences = async (prefs) => {
    try {
      await api.patch('/auth/notification-preferences', prefs);
      setAdmin(prev => ({ ...prev, notification_preferences: prefs }));
      localStorage.setItem('admin', JSON.stringify({ ...admin, notification_preferences: prefs }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Update failed.' };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return { success: true, message: res.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Request failed.' };
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      admin,
      loading,
      login,
      logout,
      updateProfile,
      changePassword,
      updateNotificationPreferences,
      forgotPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}