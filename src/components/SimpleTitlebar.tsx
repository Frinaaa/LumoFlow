import React from 'react';

const SimpleTitlebar: React.FC = () => {
  const isElectronAvailable = () => {
    return typeof window !== 'undefined' && window.api;
  };

  const handleMinimize = async () => {
    console.log('SimpleTitlebar: Minimize clicked');
    if (!isElectronAvailable()) {
      console.log('Electron API not available');
      return;
    }
    try {
      console.log('Calling window.api.minimizeWindow()');
      const result = await window.api.minimizeWindow();
      console.log('Minimize result:', result);
    } catch (error) {
      console.error('Error minimizing window:', error);
    }
  };

  const handleMaximize = async () => {
    console.log('SimpleTitlebar: Maximize clicked');
    if (!isElectronAvailable()) {
      console.log('Electron API not available');
      return;
    }
    try {
      console.log('Calling window.api.maximizeWindow()');
      const result = await window.api.maximizeWindow();
      console.log('Maximize result:', result);
    } catch (error) {
      console.error('Error maximizing window:', error);
    }
  };

  const handleClose = async () => {
    console.log('SimpleTitlebar: Close clicked');
    if (!isElectronAvailable()) {
      console.log('Electron API not available');
      return;
    }
    try {
      console.log('Calling window.api.closeWindow()');
      await window.api.closeWindow();
    } catch (error) {
      console.error('Error closing window:', error);
    }
  };

  return (
    <div style={{
      height: '35px',
      background: '#1a1a20',
      borderBottom: '1px solid #25252b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 15px',
      userSelect: 'none',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999
    } as React.CSSProperties}>
      {/* LEFT: Logo and Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <i className="fa-solid fa-bolt" style={{ color: '#00f2ff', fontSize: '14px' }}></i>
        <span style={{ 
          fontFamily: 'Orbitron, sans-serif', 
          fontWeight: 'bold', 
          fontSize: '13px', 
          color: 'white' 
        }}>
          LUMO<span style={{ color: '#00f2ff' }}>FLOW</span>
        </span>
      </div>

      {/* RIGHT: Window Controls */}
      <div style={{ display: 'flex', gap: '18px' }}>
        <i 
          className="fa-solid fa-minus" 
          onClick={handleMinimize}
          style={{ 
            cursor: 'pointer', 
            color: '#888', 
            fontSize: '12px',
            transition: 'color 0.2s',
            padding: '4px 8px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
          title="Minimize"
        ></i>
        <i 
          className="fa-regular fa-square" 
          onClick={handleMaximize}
          style={{ 
            cursor: 'pointer', 
            color: '#888', 
            fontSize: '12px',
            transition: 'color 0.2s',
            padding: '4px 8px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
          title="Maximize"
        ></i>
        <i 
          className="fa-solid fa-xmark" 
          onClick={handleClose}
          style={{ 
            cursor: 'pointer', 
            color: '#888', 
            fontSize: '14px',
            transition: 'color 0.2s',
            padding: '4px 8px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ff5f56'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
          title="Close"
        ></i>
      </div>
    </div>
  );
};

export default SimpleTitlebar;
