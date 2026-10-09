import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext();
const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes in ms

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout API errors
    }
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('admin');
    sessionStorage.removeItem('admin_last_activity');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('admin');
    setIsAuthenticated(false);
    setAdmin(null);
  }, []);

  // On mount, check stored tokens and validate them
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    const storedAdmin = sessionStorage.getItem('admin') || localStorage.getItem('admin');

    if (token && storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
      setIsAuthenticated(true);

      // Verify token is still valid by fetching profile
      api.get('/auth/me')
        .then(res => {
          const adminData = res.data.data;
          setAdmin(adminData);
          sessionStorage.setItem('admin', JSON.stringify(adminData));
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('admin');
        })
        .catch(() => {
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          sessionStorage.removeItem('admin');
          sessionStorage.removeItem('admin_last_activity');
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

  // 30-Minute Inactivity Auto-Logout Tracker
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkInactivity = () => {
      const lastActivityStr = sessionStorage.getItem('admin_last_activity');
      if (lastActivityStr) {
        const elapsed = Date.now() - parseInt(lastActivityStr, 10);
        if (elapsed >= INACTIVITY_LIMIT) {
          logout();
        }
      } else {
        sessionStorage.setItem('admin_last_activity', Date.now().toString());
      }
    };

    checkInactivity();

    let lastRecorded = 0;
    const updateActivity = () => {
      const now = Date.now();
      if (now - lastRecorded > 2000) {
        lastRecorded = now;
        sessionStorage.setItem('admin_last_activity', now.toString());
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(evt => window.addEventListener(evt, updateActivity, { passive: true }));

    const timer = setInterval(checkInactivity, 10000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkInactivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, updateActivity));
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, logout]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, admin: adminData } = res.data.data;

      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('refreshToken', refreshToken);
      sessionStorage.setItem('admin', JSON.stringify(adminData));
      sessionStorage.setItem('admin_last_activity', Date.now().toString());
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('admin');

      setAdmin(adminData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.patch('/auth/me', data);
      const updated = res.data.data;
      setAdmin(updated);
      sessionStorage.setItem('admin', JSON.stringify(updated));
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
      sessionStorage.setItem('admin', JSON.stringify({ ...admin, notification_preferences: prefs }));
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