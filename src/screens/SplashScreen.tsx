import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SplashScreen.css';

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('INITIALIZING CORE...');
  const [isReady, setIsReady] = useState(false);

  // 1. Loading Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatusText('READY');
          setIsReady(true);
          return 100;
        }

        // Update Text based on progress
        const newProgress = prev + 1;
        if (newProgress === 30) setStatusText('LOADING MODULES...');
        if (newProgress === 70) setStatusText('ESTABLISHING NEURAL LINK...');
        if (newProgress === 90) setStatusText('FINALIZING...');
        
        return newProgress;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const handleEnter = () => {
    // Navigate to login after fade out
    navigate('/login');
  };

  return (
    <div className={`splash-container ${isReady ? 'ready' : ''}`}>
      {/* Background Grid */}
      <div className="splash-bg-grid" />
      
      {/* Ambient Glow */}
      <div className="ambient-glow" />

      <div className="splash-content">
        
        {/* Logo Icon */}
        <div className="splash-logo-container">
          <span className="splash-logo-icon">⚡</span>
        </div>

        {/* Title */}
        <h1 className="splash-title">
          LUMO<span className="splash-title-highlight">FLOW</span>
        </h1>
        
        <p className="splash-subtitle">Illuminating Workflows</p>

        {/* Loading Bar */}
        {!isReady ? (
          <div className="loader-container">
            <div className="status-row">
              <span className="status-text">{statusText}</span>
              <span className="status-text">{progress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          /* Enter Button (Appears when ready) */
          <button className="enter-btn" onClick={handleEnter}>
            Enter Application →
          </button>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;
