import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/SettingsScreen.css';

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();


  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [showCamera, setShowCamera] = useState(false); // Fixes 'showCamera'
  

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: '' // Base64 string for image
  });

  const [preferences, setPreferences] = useState({
    sound: true,
    notifications: false
  });

  // Mock Stats
  const stats = {
    level: 12,
    role: '<System Architect />',
    currentXP: 2450,
    maxXP: 3000
  };

  // 1. Fetch Data
  useEffect(() => {
    const loadProfile = async () => {
      const res = await authService.getProfile();
      if (res.success && res.user) {
        setFormData({
          name: res.user.name || '',
          email: res.user.email || '',
          bio: res.user.bio || '',
          avatar: res.user.avatar || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png'
        });
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  // 2. Handle Text Input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Handle Image Upload (Convert to Base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 4. Handle Toggles
  const togglePreference = (key: 'sound' | 'notifications') => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const stopCamera = () => { // Fixes 'stopCamera'
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => { // Fixes 'capturePhoto'
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 300, 300);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setFormData(prev => ({ ...prev, avatar: dataUrl }));
        stopCamera();
      }
    }
  };

  // 5. Handle Save & Redirect
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const payload = { ...formData, ...preferences };
    const res = await authService.updateProfile(payload);
    
    if (res.success) {
      setMessage('SYSTEM UPDATED. REDIRECTING...');
      
      // Wait 1.5s then go to Dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } else {
      setMessage('ERROR: COULD NOT SAVE DATA');
      setSaving(false);
    }
  };

  if (loading) return <div className="settings-loading">ACCESSING NEURAL LINK...</div>;

  const progressPercent = (stats.currentXP / stats.maxXP) * 100;

  return (
    <div className="settings-wrapper">
      
      {/* FIXED HEADER */}
      <header className="settings-header">
        <div className="settings-brand">
          <i className="fa-solid fa-bolt"></i> LUMO<span>FLOW</span>
        </div>
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
        </button>
      </header>

      {/* SCROLLABLE CONTENT */}
      <div className="settings-scroll-area">
        <div className="settings-content">
          
          {/* --- LEFT: PROFILE CARD --- */}
          <div className="profile-card">
            <div className="avatar-container">
              <div className="avatar-glow"></div>
              {/* Image Preview */}
              <img src={formData.avatar} alt="Avatar" className="user-avatar" />
              
              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleImageUpload}
              />
              
              {/* Trigger Button */}
              <button className="camera-btn" onClick={triggerFileInput} type="button">
                <i className="fa-solid fa-camera"></i>
              </button>
            </div>

            <h2 className="profile-name">{formData.name || 'User'}</h2>
            <p className="profile-role">{stats.role}</p>

            <div className="level-container">
              <div className="level-info">
                <span>Level {stats.level}</span>
                <span className="xp-text">{stats.currentXP} / {stats.maxXP} XP</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>

            <div className="achievements-box">
              <p className="ach-title">ACHIEVEMENTS</p>
              <div className="ach-icons">
                <div className="ach-icon active"><i className="fa-solid fa-terminal"></i></div>
                <div className="ach-icon active"><i className="fa-solid fa-bug-slash"></i></div>
                <div className="ach-icon active"><i className="fa-solid fa-bolt"></i></div>
                <div className="ach-icon"><i className="fa-solid fa-brain"></i></div>
                <div className="ach-icon"><i className="fa-solid fa-fire"></i></div>
              </div>
            </div>
          </div>

          {/* --- RIGHT: SETTINGS FORM --- */}
          <div className="settings-form-card">
            <h2 className="form-title">Profile Settings</h2>
            
            <form onSubmit={handleSave}>
              <h3 className="section-title">GENERAL INFORMATION</h3>
              
              <div className="input-row">
                <div className="form-group">
                  <label>Username</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    className="settings-input" 
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    disabled 
                    className="settings-input disabled" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea 
                  name="bio"
                  value={formData.bio} 
                  onChange={handleChange}
                  placeholder="Tell us about your coding journey..."
                  className="settings-textarea"
                  rows={4}
                ></textarea>
              </div>

              <h3 className="section-title" style={{marginTop: '30px'}}>PREFERENCES</h3>
              <div className="prefs-row">
                <div className="toggle-group" onClick={() => togglePreference('sound')}>
                  <span>Sound Effects</span>
                  <div className={`toggle-switch ${preferences.sound ? 'active' : ''}`}></div>
                </div>
                <div className="toggle-group" onClick={() => togglePreference('notifications')}>
                  <span>Notifications</span>
                  <div className={`toggle-switch ${preferences.notifications ? 'active' : ''}`}></div>
                </div>
              </div>

              <div className="form-actions">
                {message && <span className={`save-msg ${message.includes('ERROR') ? 'error' : 'success'}`}>{message}</span>}
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
         
      {/* --- CAMERA MODAL --- */}
      {showCamera && (
        <div className="camera-modal-overlay">
          <div className="camera-modal">
            <h3>Capture Profile</h3>
            <div className="video-container">
              <video ref={videoRef} autoPlay playsInline></video>
              <canvas ref={canvasRef} width="300" height="300" style={{display:'none'}}></canvas>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={stopCamera}>Cancel</button>
              <button className="snap-btn" onClick={capturePhoto}>SNAP</button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;