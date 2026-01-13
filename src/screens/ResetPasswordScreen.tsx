import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/LoginScreen.css'; 

const ResetPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email passed from ForgotPasswordScreen state
  const email = location.state?.email || "";

  const [formData, setFormData] = useState({ code: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword({
        email: email,
        code: formData.code.toUpperCase().trim(),
        newPassword: formData.newPassword
      });

      if (res.success) {
        alert("Password updated! Please login with your new password.");
        navigate('/login');
      } else {
        setError(res.msg);
      }
    } catch (err) {
      setError("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen-wrapper">
      <div className="bg-grid"></div>
      
      <header className="login-header">
        <div className="login-brand-wrapper">
          <div className="login-logo-circle"><i className="fa-solid fa-bolt"></i></div>
          <h1 className="login-brand-text">LUMO<span className="login-brand-highlight">FLOW</span></h1>
        </div>
      </header>

      <div className="login-content-container">
        <div className="login-card" style={{ borderRadius: '24px' }}>
          <h1>Verify OTP</h1>
          <p className="subtitle">Enter the 6-digit code sent to {email}</p>

          {error && <div className="error-msg" style={{color: '#ff4444', marginBottom: '15px', background: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '8px'}}>{error}</div>}

          <form onSubmit={handleReset}>
            <div className="input-group">
              <input 
                type="text" className="lumo-input" placeholder="6-Digit Recovery Code" maxLength={6}
                value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} required 
              />
              <i className="fa-solid fa-key input-icon"></i>
            </div>

            <div className="input-group">
              <input 
                type="password" className="lumo-input" placeholder="New Password"
                value={formData.newPassword} onChange={(e) => setFormData({...formData, newPassword: e.target.value})} required 
              />
              <i className="fa-solid fa-lock input-icon"></i>
            </div>

            <div className="input-group">
              <input 
                type="password" className="lumo-input" placeholder="Confirm New Password"
                value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required 
              />
              <i className="fa-solid fa-shield-check input-icon"></i>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'VERIFYING...' : 'RESET PASSWORD →'}
            </button>
          </form>

          <button type="button" className="text-link" style={{marginTop: '20px'}} onClick={() => navigate('/forgot-password')}>
            Didn't get a code? Resend
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;