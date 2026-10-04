import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './Login.css';

function ResetPassword({ onBackToLogin }) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Extract token from query params: ?token=xyz or hash or path
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Password reset token is required. Please check your reset email.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post(`/auth/reset-password/${token.trim()}`, {
        password,
        confirmPassword,
      });

      if (res.data.success) {
        setSuccess(true);
      } else {
        setError(res.data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Password reset link is invalid or has expired. Please request a new one.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReturnLogin = () => {
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    if (onBackToLogin) {
      onBackToLogin();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-decorations" aria-hidden="true">
        <div className="decor-circle decor-1"></div>
        <div className="decor-circle decor-2"></div>
        <div className="decor-cross decor-cross-1">✚</div>
        <div className="decor-cross decor-cross-2">✚</div>
      </div>

      <div className="login-container">
        {/* Left Side: Brand Showcase */}
        <div className="login-left">
          <div className="brand-badge">
            <div className="cross-emblem">
              <span>✚</span>
            </div>
            <div className="brand-text">
              <span className="org-title">KENYA RED CROSS SOCIETY</span>
              <span className="chapter-subtitle">Kirinyaga University Chapter</span>
            </div>
          </div>

          <div className="login-hero-content">
            <span className="portal-pill">SECURITY ACCESS</span>
            <h1 className="hero-heading">Secure Account Recovery</h1>
            <p className="hero-description">
              Create a strong, unique password to secure administrative access to the chapter portal.
            </p>
          </div>

          <div className="hero-footer">
            <div className="principles-tag">
              <span>Humanity</span> • <span>Neutrality</span> • <span>Voluntary Service</span> • <span>Unity</span>
            </div>
          </div>
        </div>

        {/* Right Side: Reset Form */}
        <div className="login-right">
          <div className="form-card">
            <div className="form-header">
              <div className="mobile-logo">
                <span className="mobile-cross">✚</span>
                <span>Red Cross KyU</span>
              </div>
              <h2>Set New Password</h2>
              <p className="form-subtitle">Enter and confirm your new secure administrator password</p>
            </div>

            {success ? (
              <div className="auth-alert alert-success">
                <div className="success-icon-badge">✓</div>
                <div className="success-content">
                  <h3>Password Reset Complete!</h3>
                  <p>
                    Your administrator password has been updated successfully. You can now log in with your new credentials.
                  </p>
                  <button
                    type="button"
                    className="btn-submit-login"
                    style={{ marginTop: '1rem' }}
                    onClick={handleReturnLogin}
                  >
                    Proceed to Admin Sign In →
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReset} className="auth-form" noValidate>
                {error && (
                  <div className="auth-alert alert-error" role="alert">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="input-group">
                  <label htmlFor="reset-token">Reset Token</label>
                  <div className="input-field-wrapper">
                    <input
                      id="reset-token"
                      type="text"
                      value={token}
                      onChange={(e) => { setToken(e.target.value); setError(''); }}
                      placeholder="Paste your 64-character reset token"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="new-password">New Password</label>
                  <div className="input-field-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </span>
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="confirm-password">Confirm New Password</label>
                  <div className="input-field-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </span>
                    <input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-submit-login"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="btn-loading-content">
                      <span className="btn-spinner"></span> Resetting Password...
                    </span>
                  ) : (
                    'Set New Password & Login'
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    type="button"
                    className="inline-link"
                    onClick={handleReturnLogin}
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
