import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const { login, forgotPassword } = useAuth();
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('Admin1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const fillDemoCredentials = () => {
    setEmail('admin@gmail.com');
    setPassword('Admin1234');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    const result = await login(email.trim(), password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setForgotLoading(true);
    setError('');
    const result = await forgotPassword(forgotEmail.trim());
    setForgotLoading(false);

    if (result.success) {
      setForgotSent(true);
    } else {
      setError(result.message || 'Could not process password reset request.');
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
        {/* Left Side: Red Cross Chapter Showcase */}
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
            <span className="portal-pill">ADMINISTRATIVE CONSOLE</span>
            <h1 className="hero-heading">Empowering Humanitarian Action & Service</h1>
            <p className="hero-description">
              Securely oversee club operations, coordinate emergency response drills,
              manage volunteer registries, and approve media for the university chapter.
            </p>

            <div className="feature-badges">
              <div className="feature-item">
                <span className="feature-icon">🛡️</span>
                <div>
                  <strong>Secure Role Access</strong>
                  <p>Encrypted admin control & audits</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🚑</span>
                <div>
                  <strong>First Aid & Rapid Response</strong>
                  <p>Curated guides & emergency workflows</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🤝</span>
                <div>
                  <strong>Volunteers & Events</strong>
                  <p>Membership records & activity log</p>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-footer">
            <div className="principles-tag">
              <span>Humanity</span> • <span>Neutrality</span> • <span>Voluntary Service</span> • <span>Unity</span>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="login-right">
          {!showForgot ? (
            <div className="form-card">
              <div className="form-header">
                <div className="mobile-logo">
                  <span className="mobile-cross">✚</span>
                  <span>Red Cross KyU</span>
                </div>
                <h2>Admin Sign In</h2>
                <p className="form-subtitle">Enter your authorized administrative credentials</p>
              </div>

              {/* Demo Credentials Quick Pill */}
              <div className="demo-credentials-banner">
                <div className="demo-badge">
                  <span className="demo-dot"></span>
                  <span>Demo Mode</span>
                </div>
                <div className="demo-details">
                  <code>admin@gmail.com</code> / <code>Admin1234</code>
                </div>
                <button
                  type="button"
                  className="demo-autofill-btn"
                  onClick={fillDemoCredentials}
                  title="Click to load demo credentials"
                >
                  Auto-fill
                </button>
              </div>

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

              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="input-group">
                  <label htmlFor="login-email">Email Address</label>
                  <div className="input-field-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </span>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="admin@gmail.com"
                      autoComplete="email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <div className="input-label-row">
                    <label htmlFor="login-password">Password</label>
                    <button
                      type="button"
                      className="inline-link"
                      onClick={() => { setShowForgot(true); setError(''); }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="input-field-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </span>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="Enter administrative password"
                      autoComplete="current-password"
                      required
                      disabled={isLoading}
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

                <button
                  type="submit"
                  className="btn-submit-login"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="btn-loading-content">
                      <span className="btn-spinner"></span> Authenticating...
                    </span>
                  ) : (
                    <span className="btn-submit-text">
                      Sign In to Dashboard
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="form-card">
              <div className="form-header">
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => { setShowForgot(false); setForgotSent(false); setError(''); }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                  Back to Sign In
                </button>
                <h2>Reset Password</h2>
                <p className="form-subtitle">
                  Enter your registered administrator email to receive reset instructions.
                </p>
              </div>

              {forgotSent ? (
                <div className="auth-alert alert-success">
                  <div className="success-icon-badge">✓</div>
                  <div className="success-content">
                    <h3>Instructions Dispatched</h3>
                    <p>
                      If an account exists for <strong>{forgotEmail}</strong>, we've sent instructions to reset your password.
                    </p>
                    <button
                      type="button"
                      className="btn-secondary-link"
                      onClick={() => { setShowForgot(false); setForgotSent(false); }}
                    >
                      Return to Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="auth-form" noValidate>
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
                    <label htmlFor="forgot-email">Admin Email Address</label>
                    <div className="input-field-wrapper">
                      <span className="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </span>
                      <input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => { setForgotEmail(e.target.value); setError(''); }}
                        placeholder="admin@kirinyaga.ac.ke"
                        required
                        disabled={forgotLoading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-submit-login"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <span className="btn-loading-content">
                        <span className="btn-spinner"></span> Sending Reset Link...
                      </span>
                    ) : (
                      'Send Reset Instructions'
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;