import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/SignUpScreen.css';

const SignUpScreen: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // State for validation errors
  const [errors, setErrors] = useState<any>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- VALIDATION LOGIC ---
  const validateForm = () => {
    let tempErrors: any = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) tempErrors.name = "Full Name is required";
    if (!emailRegex.test(formData.email)) tempErrors.email = "Invalid email format";
    if (formData.password.length < 6) tempErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) tempErrors.confirmPassword = "Passwords do not match";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    
    if (!validateForm()) return; // Stop if frontend validation fails

    setLoading(true);
    try {
      const res = await authService.signup({
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password
      });

      if (res.success) {
        navigate('/login'); // Success!
      } else {
        setServerError(res.msg); // Show error from MongoDB (e.g., "User already exists")
      }
    } catch (err) {
      setServerError("Connection failed. Check your database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-screen-wrapper">
      <div className="bg-grid"></div>

      <header className="signup-header">
        <div className="app-brand small" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
          <div className="app-brand-icon"><i className="fa-solid fa-bolt"></i></div>
          <h1 className="app-brand-text">LUMO<span className="app-brand-highlight">FLOW</span></h1>
        </div>
        <button className="about-btn" onClick={() => navigate('/about')}>
  About Us
</button>
      </header>

      <main className="signup-content">
        <div className="signup-card">
          <h1>Create Your Account</h1>
          <p className="subtitle">Start your secure workspace with Lumoflow</p>

          {/* Global Server Error */}
          {serverError && <div className="server-error-banner">{serverError}</div>}

          <form onSubmit={handleSignUp}>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" className={`signup-input ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter your full name" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" className={`signup-input ${errors.email ? 'input-error' : ''}`}
                placeholder="Enter your email" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" className={`signup-input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••" 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input 
                type="password" className={`signup-input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="••••••••" 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="signup-main-btn" disabled={loading}>
              {loading ? 'INITIALIZING...' : 'SIGN UP →'}
            </button>
          </form>

          {/* --- NEW: LOGIN NAVIGATION --- */}
          <div className="login-redirect">
             Already have an account? <span onClick={() => navigate('/login')}>Login</span>
          </div>

          

          
        </div>
      </main>
    </div>
  );
};

export default SignUpScreen;