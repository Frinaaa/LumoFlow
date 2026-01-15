import React, { useState } from 'react';
import '../styles/CustomTitlebar.css';

const CustomTitlebar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = () => {
    if (window.api && window.api.minimizeWindow) {
      window.api.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.api && window.api.maximizeWindow) {
      window.api.maximizeWindow();
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (window.api && window.api.closeWindow) {
      window.api.closeWindow();
    }
  };

  return (
    <div className="custom-titlebar">
      <div className="titlebar-left">
        <div className="titlebar-icon">
          <i className="fa-solid fa-bolt"></i>
        </div>
      </div>

      <div className="titlebar-right">
        <button className="titlebar-btn minimize" onClick={handleMinimize} title="Minimize">
          <i className="fa-solid fa-minus"></i>
        </button>
        <button className="titlebar-btn maximize" onClick={handleMaximize} title="Maximize">
          <i className={`fa-solid ${isMaximized ? 'fa-window-restore' : 'fa-square'}`}></i>
        </button>
        <button className="titlebar-btn close" onClick={handleClose} title="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  );
};

export default CustomTitlebar;
