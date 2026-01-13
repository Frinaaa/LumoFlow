import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/LoginScreen.css';

interface LoginScreenProps {
  setIsAuthenticated: (value: boolean) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  // --- STATE VARIABLES ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- STANDARD LOGIN VALIDATION ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Email Format Check (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please use a valid email address structure (e.g., name@gmail.com).");
      return;
    }

    // 2. Password Length Check
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login({ 
        email: email.toLowerCase().trim(), 
        password 
      });
      
      if (response.success) {
        setIsAuthenticated(true);
      } else {
        setError(response.msg || "Invalid login credentials.");
        setLoading(false);
      }
    } catch (err) {
      setError("Connection error. Is the database running?");
      setLoading(false);
    }
  };

  // --- GOOGLE LOGIN FLOW ---
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // Calls the bridge you created in preload.js
      // Note: In production, these details would come from a real Google Popup
      const res = await window.api.googleLogin({
        email: "testuser@gmail.com", 
        name: "Google Explorer",
        googleId: "G-UNIQUE-12345"
      });

      if (res.success) {
        await authService.setAuthToken(res.token);

        if (res.isNewUser) {
          // 🟢 NAVIGATE TO SIGNUP if they are new (to complete profile)
          navigate('/signup'); 
        } else {
          // 🔵 GO TO DASHBOARD if they already had an account
          setIsAuthenticated(true);
        }
      } else {
        setError("Google authentication failed.");
        setLoading(false);
      }
    } catch (err) {
      setError("Fatal Error: Could not connect to Google service.");
      setLoading(false);
    }
  };

  return (
    <div className="login-screen-wrapper">
      <div className="bg-grid"></div>

      <header className="login-header">
        <div className="login-brand-wrapper">
          <div className="login-logo-circle">
            <i className="fa-solid fa-bolt"></i>
          </div>
          <h1 className="login-brand-text">
            LUMO<span className="login-brand-highlight">FLOW</span>
          </h1>
        </div>
      </header>

      <div className="login-content-container">
        <div className="login-card">
          <h1>Welcome Back</h1>
          <p className="subtitle">Access your neural workspace</p>

          {/* NEON ERROR ALERT */}
          {error && (
            <div className="login-error-alert">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input 
                type="text" 
                className={`lumo-input ${error ? 'input-error' : ''}`} 
                placeholder="Email Address"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={loading}
                required 
              />
              <i className="fa-regular fa-user input-icon"></i>
            </div>

            <div className="input-group">
              <input 
                type={showPassword ? 'text' : 'password'} 
                className={`lumo-input ${error ? 'input-error' : ''}`} 
                placeholder="Password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={loading}
                required 
              />
              <i 
                className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'} input-icon`}
                onClick={() => setShowPassword(!showPassword)} 
                style={{cursor:'pointer', zIndex:10}}
              ></i>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <span><i className="fa-solid fa-circle-notch fa-spin"></i> VERIFYING...</span>
              ) : (
                <>LOGIN <i className="fa-solid fa-arrow-right"></i></>
              )}
            </button>
            
            <div className="links-row">
              <button 
                type="button" 
                className="text-link" 
                onClick={() => navigate('/forgot-password')}
              >
                Forgot Password?
              </button>

              <button 
                type="button" 
                className="text-link" 
                style={{ color: 'var(--accent-cyan)' }}
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </button>
            </div>
          </form>

          <div className="divider">OR CONTINUE WITH</div>

          <div className="social-login">
            <div className="social-btn" onClick={handleGoogleLogin}>
              <i className="fa-brands fa-google"></i>
            </div>
            <div className="social-btn">
              <i className="fa-brands fa-github"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;