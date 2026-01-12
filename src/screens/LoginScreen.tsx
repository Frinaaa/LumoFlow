import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/LoginScreen.css';

interface LoginScreenProps {
  setIsAuthenticated: (value: boolean) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      if (response.success && response.token) {
        authService.setAuthToken(response.token);
        setIsAuthenticated(true);
      } else {
        setGeneralError(response.msg || 'Login failed');
      }
    } catch (error) {
      setGeneralError('Server connection error');
    } finally {
      setLoading(false);
    }
  };

  // ... imports ...

return (
  <div className="login-screen-wrapper">
    <div className="bg-grid"></div>

    {/* --- HEADER START --- */}
    <header className="login-header">
      
      {/* Container matching Splash style */}
      <div className="login-brand-wrapper">
        
        {/* Neon Circle */}
        <div className="login-logo-circle">
          <i className="fa-solid fa-bolt"></i>
        </div>
        
        {/* Text with exact font and glow */}
        <h1 className="login-brand-text">
          LUMO<span className="login-brand-highlight">FLOW</span>
        </h1>
        
      </div>

    </header>
    {/* --- HEADER END --- */}

    {/* ... Rest of your login card code ... */}
      {/* ------------------------------------------- */}

      <div className="login-content-container">
        <div className="login-card">
          <h1>Welcome Back</h1>
          <p className="subtitle">Access your neural workspace</p>

          {generalError && <div className="error-text" style={{fontSize: '14px', marginBottom: '15px'}}>{generalError}</div>}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input 
                type="text" className="lumo-input" placeholder="Email Address"
                value={email} onChange={(e) => setEmail(e.target.value)} required 
              />
              <i className="fa-regular fa-user input-icon"></i>
            </div>

            <div className="input-group">
              <input 
                type={showPassword ? 'text' : 'password'} className="lumo-input" placeholder="Password"
                value={password} onChange={(e) => setPassword(e.target.value)} required 
              />
              <i 
                className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'} input-icon`}
                onClick={() => setShowPassword(!showPassword)} style={{cursor:'pointer', zIndex:5}}
              ></i>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'PROCESSING...' : 'LOGIN'}
            </button>
            
            <div className="links-row">
                <button 
  type="button" 
  className="text-link" 
  onClick={() => navigate('/forgot-password')} // <--- Added Navigation
>
  Forgot Password?
</button>

  <button 
  type="button" 
  className="text-link" 
  style={{ color: 'var(--neon-blue)' }}
  onClick={() => navigate('/signup')} // <--- Change this line
>
  Sign Up
</button>
            </div>
          </form>

          <div className="divider">OR CONTINUE WITH</div>

          <div className="social-login">
            <div className="social-btn"><i className="fa-brands fa-google"></i></div>
            <div className="social-btn"><i className="fa-brands fa-github"></i></div>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default LoginScreen;