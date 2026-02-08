import React, { useState, useEffect } from 'react';
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

  // --- 1. NEW STATE FOR VALIDATION ---
  const [touched, setTouched] = useState<any>({}); // Tracks if user clicked a field
  const [errors, setErrors] = useState<any>({});   // Tracks specific errors
  const [isFormValid, setIsFormValid] = useState(false); // Disables button if false

  // Password Strength Checkers
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    number: false,
    special: false
  });

  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- 2. REAL-TIME VALIDATION ENGINE ---
  useEffect(() => {
    const newErrors: any = {};
    const criteria = {
      length: formData.password.length >= 6,
      upper: /[A-Z]/.test(formData.password),
      number: /\d/.test(formData.password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
    };
    setPasswordCriteria(criteria);

    // Name Validation
    if (!formData.name.trim()) newErrors.name = "Full Name is required";

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email format";

    // Password Validation
    if (!criteria.length) newErrors.password = "Password must be 6+ chars";
    else if (!criteria.upper) newErrors.password = "Add an uppercase letter";
    else if (!criteria.number) newErrors.password = "Add a number";

    // Confirm Password
    if (formData.confirmPassword !== formData.password) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);

    // Only enable button if no errors and all fields are filled
    setIsFormValid(
      Object.keys(newErrors).length === 0 &&
      Object.values(formData).every(val => val !== '')
    );
  }, [formData]);

  // --- 3. HANDLERS ---
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev: any) => ({ ...prev, [name]: true }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setServerError('');

    try {
      const res = await authService.signup({
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password
      });

      if (res.success) {
        navigate('/login');
      } else {
        setServerError(res.msg || 'Signup failed.');
      }
    } catch (err) {
      setServerError("Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  // Helper for input styling
  const getInputClass = (field: string) => {
    if (!touched[field]) return '';
    return errors[field] ? 'input-error' : 'input-success';
  };

  return (
    <div className="signup-screen-wrapper">
      <div className="bg-grid"></div>

      <header className="signup-header">
        <div className="app-brand small" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>

        </div>
        <button className="about-btn" onClick={() => navigate('/about')}>About Us</button>
      </header>

      <main className="signup-content">
        <div className="signup-card">
          <h1>Create Your Account</h1>
          <p className="subtitle">Start your secure workspace with Lumoflow</p>

          {serverError && <div className="server-error-banner">{serverError}</div>}

          <form onSubmit={handleSignUp}>

            {/* NAME FIELD */}
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <input
                  type="text" name="name"
                  className={`signup-input ${getInputClass('name')}`}
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {/* Visual Icon Logic */}
                {touched.name && !errors.name && <i className="fa-solid fa-check input-icon-status success"></i>}
              </div>
              {touched.name && errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            {/* EMAIL FIELD */}
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <input
                  type="email" name="email"
                  className={`signup-input ${getInputClass('email')}`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.email && !errors.email && <i className="fa-solid fa-check input-icon-status success"></i>}
              </div>
              {touched.email && errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            {/* PASSWORD FIELD */}
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"} name="password"
                  className={`signup-input ${getInputClass('password')}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <i
                  className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} input-icon-toggle`}
                  onClick={() => setShowPassword(!showPassword)}
                ></i>
              </div>
              {/* Password Requirements List */}
              <div className="password-criteria">
                <span className={passwordCriteria.length ? 'valid' : ''}>8+ Chars</span>
                <span className={passwordCriteria.upper ? 'valid' : ''}>Upper</span>
                <span className={passwordCriteria.number ? 'valid' : ''}>Number</span>
                <span className={passwordCriteria.special ? 'valid' : ''}>Symbol</span>
              </div>
            </div>

            {/* CONFIRM FIELD */}
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"} name="confirmPassword"
                  className={`signup-input ${getInputClass('confirmPassword')}`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <i
                  className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} input-icon-toggle confirm`}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                ></i>
                {touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword && <i className="fa-solid fa-check input-icon-status success"></i>}
              </div>
              {touched.confirmPassword && errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className={`signup-main-btn ${isFormValid ? 'active' : ''}`} disabled={!isFormValid || loading}>
              {loading ? 'INITIALIZING...' : 'SIGN UP →'}
            </button>
          </form>

          <div className="login-redirect">
            Already have an account? <span onClick={() => navigate('/login')}>Login</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUpScreen;