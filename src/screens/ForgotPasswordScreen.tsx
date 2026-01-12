import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from "../services/authService";
import '../styles/LoginScreen.css'; // Reuses your existing neon styles

const ForgotPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    // 1. Validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setGeneralError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      // 2. Call Backend API (via Electron IPC)
      const response = await authService.forgotPassword(email);

      if (response.success) {
        // --- THIS IS THE CRITICAL FIX (Translated from your RN code) ---
        // Navigate immediately to the Reset Password screen, passing the email in state
        navigate('/reset-password', { state: { email } });
      } else {
        setGeneralError(response.msg || 'An error occurred.');
      }
    } catch (error: any) {
      setGeneralError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen-wrapper">
      <div className="bg-grid"></div>

      {/* --- Header --- */}
      <header className="login-header">
        <div className="app-brand small">
            <div className="app-brand-icon">
                <i className="fa-solid fa-bolt"></i>
            </div>
            <h1 className="app-brand-text">
                LUMO<span className="app-brand-highlight">FLOW</span>
            </h1>
        </div>
      </header>

      {/* --- Main Content --- */}
      <div className="login-content-container">
        <div className="login-card">
          <h1>Forgot Password</h1>
          <p className="subtitle">Enter email to restore neural link</p>

          {/* Error Message */}
          {generalError && (
            <div style={{ color: '#ff4444', background: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem' }}>
              <i className="fa-solid fa-circle-exclamation"></i> {generalError}
            </div>
          )}

          <form onSubmit={handleSendCode}>
            <div className="input-group">
              <input 
                type="email" 
                className="lumo-input" 
                placeholder="Enter your registered Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={loading}
              />
              <i className="fa-regular fa-envelope input-icon"></i>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <span><i className="fa-solid fa-circle-notch fa-spin"></i> SENDING...</span>
              ) : (
                <>SEND RESET CODE <i className="fa-regular fa-paper-plane" style={{ marginLeft: '8px' }}></i></>
              )}
            </button>
          </form>

          <div className="divider">OR</div>

          {/* Back to Login Button */}
          <button 
            type="button" 
            className="text-link" 
            style={{ width: '100%', textAlign: 'center' }}
            onClick={() => navigate('/login')}
          >
            <i className="fa-solid fa-arrow-left"></i> Return to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;