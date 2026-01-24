import React, { useEffect, useState } from 'react';
import SimpleTitlebar from '../components/SimpleTitlebar';
import '../styles/SplashScreen.css';

interface SplashScreenProps {
    onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('INITIALIZING CORE...');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatusText('READY');
          setIsReady(true);
          return 100;
        }

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
    onComplete();
  };

  return (
    <>
      <SimpleTitlebar />
      <div className={`splash-container ${isReady ? 'ready' : ''}`} style={{ paddingTop: '35px' }}>
      <div className="splash-bg-grid" />
      <div className="ambient-glow" />

      <div className="splash-content">

        {/* --- ORIGINAL LOGO STRUCTURE --- */}
        <div className="splash-logo-container">
          <span className="splash-logo-icon">
            <i className="fa-solid fa-bolt"></i>
          </span>
        </div>

        <h1 className="splash-title">
          LUMO<span className="splash-title-highlight">FLOW</span>
        </h1>
        {/* ------------------------------- */}

        <p className="splash-subtitle">Illuminating Workflows</p>

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
          <button className="enter-btn" onClick={handleEnter}>
            Enter Application →
          </button>
        )}
      </div>
    </div>
    </>
  );
};

export default SplashScreen;