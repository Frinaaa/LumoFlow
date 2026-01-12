import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './LoginScreen.css';

interface LoginScreenProps {
  setIsAuthenticated: (value: boolean) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await authService.login({
        email: email.toLowerCase().trim(),
        password,
      });

      // Store user data and navigate to app
      await authService.setAuthToken(response.token);
      setIsAuthenticated(true);
      navigate('/app');
    } catch (error: any) {
      setError(error.response?.data?.msg || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background Grid */}
      <div className="bg-grid" />

      {/* Header */}
      <header className="login-header">
        <div className="brand-container">
          <div className="logo-icon">
            <span className="logo-symbol">⚡</span>
          </div>
          <h1 className="brand-text">
            LUMO<span className="brand-text-highlight">FLOW</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="login-main">
        <div className="login-card">
          
          {/* Visual Neon Shape */}
          <div className="visual-side">
            <div className="neon-shape">
              <div className="inner-shape" />
            </div>
          </div>

          {/* Form */}
          <div className="content-side">
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">Access your secure workspace</p>

            <form onSubmit={handleLogin} className="login-form">
              {/* Error Message */}
              {error && <div className="error-message">{error}</div>}

              {/* Email Input */}
              <input
                type="email"
                className="login-input"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />

              {/* Password Input */}
              <div className="password-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="password-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '👁️' : '🔒'}
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="login-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="button-spinner" />
                ) : (
                  <span>LOGIN →</span>
                )}
              </button>

              {/* Signup Link */}
              <div className="signup-container">
                <span className="signup-text">Don't have an account? </span>
                <button type="button" className="signup-link" disabled={loading}>
                  SignUp
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="login-footer">
        <button className="footer-link">Privacy Policy</button>

        <div className="footer-center">
          <button className="footer-link">Terms of Service</button>
          <div className="social-icons">
            <span className="social-icon">🐦</span>
            <span className="social-icon">📸</span>
            <span className="social-icon">📘</span>
          </div>
          <p className="copyright">© 2024 Lumoflow. All rights reserved.</p>
        </div>

        <button className="footer-link">Contact Us</button>
      </footer>
    </div>
  );
};

export default LoginScreen;
