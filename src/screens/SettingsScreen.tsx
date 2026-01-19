import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/SettingsScreen.css';

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Store the previous location
  const previousPath = useRef<string>('/dashboard');

  useEffect(() => {
    // Get the referrer from session storage or default to dashboard
    const referrer = sessionStorage.getItem('settingsReferrer') || '/dashboard';
    previousPath.current = referrer;
  }, []);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' // Default fallback
  });

  // --- PREFERENCES STATE ---
  const [preferences, setPreferences] = useState({
    sound: true,
    notifications: false
  });

  // Mock Stats for UI
  const stats = {
    level: 12,
    role: '<System Architect />',
    currentXP: 2450,
    maxXP: 3000
  };

  // Load from cache immediately on mount
  useEffect(() => {
    console.log('✅ SettingsScreen MOUNTED');
    const userString = localStorage.getItem('user_info');
    if (userString) {
      try {
        const cachedUser = JSON.parse(userString);
        console.log('📦 Loaded cached user from localStorage:', cachedUser);
        setFormData({
          name: cachedUser.name || '',
          email: cachedUser.email || '',
          bio: cachedUser.bio || '',
          avatar: cachedUser.avatar || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png'
        });
      } catch (e) {
        console.error('Failed to parse cached user:', e);
      }
    }
    return () => {
      console.log('❌ SettingsScreen UNMOUNTED');
    };
  }, []);

  // Then fetch fresh data from backend
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Get user ID from localStorage
        const userString = localStorage.getItem('user_info');
        console.log('📦 localStorage user_info:', userString);
        
        if (!userString) {
          console.error('❌ No user_info in localStorage');
          setLoading(false);
          return;
        }
        
        const currentUser = JSON.parse(userString);
        console.log('👤 Parsed user:', currentUser);
        
        const userId = currentUser._id || currentUser.id;
        console.log('🔑 Using userId:', userId);
        
        if (!userId) {
          console.error('❌ No userId found in user object');
          setLoading(false);
          return;
        }
        
        // Fetch fresh data from backend
        console.log('🔄 Fetching dashboard data...');
        const res = await authService.getDashboardData(userId);
        console.log('📥 Dashboard response:', res);
        
        if (res.success && res.user) {
          console.log('✅ Setting form data with user:', res.user);
          setFormData({
            name: res.user.name || '',
            email: res.user.email || '',
            bio: res.user.bio || '',
            avatar: res.user.avatar || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png'
          });
        } else {
          console.error('❌ Failed to load user data:', res.msg);
          // Fallback to cached data
          setFormData({
            name: currentUser.name || '',
            email: currentUser.email || '',
            bio: currentUser.bio || '',
            avatar: currentUser.avatar || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png'
          });
        }
      } catch (err) {
        console.error("❌ Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);
  // 2. Handle Text Input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Handle Image Upload
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

  // 4. Camera Logic
  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      setMessage("ERROR: CAMERA ACCESS DENIED");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
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

  // 5. Handle Toggles
  const togglePreference = (key: 'sound' | 'notifications') => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 6. 🟢 HANDLE SAVE (FIXED)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // Only send name, bio, avatar (not preferences for now)
      const payload = { 
        name: formData.name,
        bio: formData.bio,
        avatar: formData.avatar
      };

      console.log("Saving profile with payload:", { ...payload, avatar: payload.avatar.substring(0, 50) + '...' });

      const res = await authService.updateProfile(payload);
      
      console.log("Update response:", res);

      if (res.success) {
        setMessage('SYSTEM UPDATED. REDIRECTING...');
        // 1.5s delay to let user see success message before moving
        setTimeout(() => {
          navigate(previousPath.current);
        }, 1500);
      } else {
        console.error("Update failed:", res.msg);
        setMessage(`ERROR: ${res.msg || 'COULD NOT SAVE DATA'}`);
        setSaving(false);
      }
    } catch (err) {
      console.error("Save error:", err);
      setMessage('ERROR: COULD NOT SAVE DATA');
      setSaving(false);
    }
  };

  if (loading) return <div className="settings-loading">ACCESSING NEURAL LINK...</div>;

  const progressPercent = (stats.currentXP / stats.maxXP) * 100;

  return (
    <div className="settings-wrapper">
      <header className="settings-header">
        <div className="settings-brand">
          <i className="fa-solid fa-bolt"></i> LUMO<span>FLOW</span>
        </div>
        <button className="back-btn" onClick={() => navigate(previousPath.current)}>
          <i className="fa-solid fa-arrow-left"></i> Back
        </button>
      </header>

      <div className="settings-scroll-area">
        <div className="settings-content">
          
          {/* LEFT: PROFILE CARD */}
          <div className="profile-card">
            <div className="avatar-container">
              <div className="avatar-glow"></div>
              <img 
                src={formData.avatar || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png'} 
                alt="Avatar" 
                className="user-avatar" 
              />
              
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleImageUpload}
              />
              
              <div className="avatar-actions">
                <button className="action-btn camera" onClick={startCamera} type="button" title="Take Photo">
                  <i className="fa-solid fa-camera"></i>
                </button>
                <button className="action-btn upload" onClick={triggerFileInput} type="button" title="Upload Image">
                  <i className="fa-solid fa-upload"></i>
                </button>
              </div>
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

          {/* RIGHT: SETTINGS FORM */}
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
                  {/* Email is disabled (read-only) but populated via state */}
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
                {message && (
                  <span className={`save-msg ${message.includes('ERROR') ? 'error' : 'success'}`}>
                    {message}
                  </span>
                )}
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
         
          {/* CAMERA MODAL */}
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