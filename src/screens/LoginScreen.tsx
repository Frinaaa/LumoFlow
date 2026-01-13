import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/LoginScreen.css';

interface LoginScreenProps {
  setIsAuthenticated: (value: boolean) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  // --- FORM STATE ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // --- VALIDATION STATE ---
  const [emailError, setEmailError] = useState('');
  const [passError, setPassError] = useState('');
  const [serverError, setServerError] = useState('');

  // 1. EFFECT: Real-time validation
 // 1. EFFECT: Real-time validation
  useEffect(() => {
    // Only validate if user has started typing
    if (email.length > 0) {
      // ⬇️ STRICT REGEX: Only allows emails ending in .com
      const emailRegex = /^[^\s@]+@[^\s@]+\.com$/;
      
      if (!emailRegex.test(email)) {
        setEmailError("Only .com domains are accepted.");
      } else {
        setEmailError("");
      }
    } else {
        setEmailError("");
    }

    if (password.length > 0) {
        if (password.length < 6) {
            setPassError("Security key must be 6+ characters.");
        } else {
            setPassError("");
        }
    } else {
        setPassError("");
    }
  }, [email, password]);

  

  // --- 2. GOOGLE LOGIN (External Browser Flow) ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    setServerError('');
    
    try {
      // 🟢 Trigger the browser flow via Main Process
      const res = await authService.startGoogleLogin();

      if (res.success) {
        await authService.setAuthToken(res.token);
        
        if (res.isNewUser) {
            navigate('/signup'); // Navigate to sign up if new
        } else {
            setIsAuthenticated(true);
             navigate('/dashboard'); // Log in if existing
        }
      } else {
        setServerError(res.msg || "Google Login failed.");
      }
    } catch (err) {
      setServerError("Login window closed or connection failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. STANDARD LOGIN ---
 // --- 3. STANDARD LOGIN (DEBUG VERSION) ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // DEBUG LOGS: Check your console for these
    console.log("--- LOGIN ATTEMPT ---");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Email Error:", emailError);
    console.log("Pass Error:", passError);

    // 1. Check Validation
    if (emailError || passError) {
      console.warn("🛑 BLOCKED: Validation errors exist.");
      return;
    }
    
    // 2. Check Empty Fields
    if (!email || !password) {
      console.warn("🛑 BLOCKED: Fields are empty.");
      return;
    }

    console.log("✅ Validation Passed. Calling Server...");

    setLoading(true);
    setServerError('');

    try {
      const res = await authService.login({ 
        email: email.toLowerCase().trim(), 
        password 
      });
      
      console.log("Server Response:", res);

      if (res.success) {
        console.log("🚀 Success! Navigating to Dashboard...");
        setIsAuthenticated(true);
        navigate('/dashboard'); 
      } else {
        console.error("❌ Login Failed:", res.msg);
        setServerError(res.msg || "Access denied.");
      }
    } catch (err) {
      console.error("❌ CRASH:", err);
      setServerError("Connection error. Database offline?");
    } finally {
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
          <p className="subtitle">Real-time authentication active</p>

          {/* ERROR ALERT */}
          {serverError && (
            <div className="login-error-alert">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input 
                type="text" className={`lumo-input ${emailError ? 'input-error' : ''}`}
                placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required 
              />
              <i className="fa-regular fa-user input-icon"></i>
              {emailError && <span className="field-validation-msg">{emailError}</span>}
            </div>

            <div className="input-group">
              <input 
                type={showPassword ? 'text' : 'password'} className={`lumo-input ${passError ? 'input-error' : ''}`}
                placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required 
              />
              <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'} input-icon`}
                 onClick={() => setShowPassword(!showPassword)} style={{cursor:'pointer', zIndex:10}}></i>
              {passError && <span className="field-validation-msg">{passError}</span>}
            </div>

            <button type="submit" className="login-btn" disabled={loading || !!emailError || !!passError || !email || !password}>
              {loading ? (
                <span><i className="fa-solid fa-circle-notch fa-spin"></i> AUTHENTICATING...</span>
              ) : (
                <>LOGIN <i className="fa-solid fa-arrow-right"></i></>
              )}
            </button>
            
            <div className="links-row">
              <button type="button" className="text-link" onClick={() => navigate('/forgot-password')}>Forgot Password?</button>
              <button type="button" className="text-link" style={{ color: 'var(--accent-cyan)' }} onClick={() => navigate('/signup')}>Sign Up</button>
            </div>
          </form>

          <div className="divider">OR CONTINUE WITH</div>

          <div className="social-login">
            {/* 🟢 ORIGINAL ICON STYLE - TRIGGERS BROWSER FLOW */}
            <div className="social-btn" onClick={handleGoogleLogin}>
              <i className="fa-brands fa-google"></i>
            </div>
            <div className="social-btn"><i className="fa-brands fa-github"></i></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;