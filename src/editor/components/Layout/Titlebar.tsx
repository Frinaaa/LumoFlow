import React from 'react';

interface TitlebarProps {
  workspaceFolderName?: string;
}

/**
 * Simple Titlebar for Editor
 * Handles window controls without menu dependencies
 */
const Titlebar: React.FC<TitlebarProps> = ({ workspaceFolderName }) => {
  const handleMinimize = async () => {
    try {
      if (window.api?.minimizeWindow) {
        await window.api.minimizeWindow();
      }
    } catch (error) {
      console.error('Error minimizing window:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      if (window.api?.maximizeWindow) {
        await window.api.maximizeWindow();
      }
    } catch (error) {
      console.error('Error maximizing window:', error);
    }
  };

  const handleClose = async () => {
    try {
      if (window.api?.closeWindow) {
        await window.api.closeWindow();
      }
    } catch (error) {
      console.error('Error closing window:', error);
    }
  };

  return (
    <div style={{
      height: '30px',
      background: '#1e1e1e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 10px',
      WebkitAppRegion: 'drag',
      userSelect: 'none',
      borderBottom: '1px solid #2d2d30'
    } as React.CSSProperties}>
      {/* Left: App Title */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        fontSize: '12px',
        color: '#cccccc'
      }}>
        <span style={{ fontWeight: 600 }}>LumoFlow</span>
        {workspaceFolderName && (
          <>
            <span style={{ color: '#666' }}>—</span>
            <span>{workspaceFolderName}</span>
          </>
        )}
      </div>

      {/* Right: Window Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '0',
        WebkitAppRegion: 'no-drag'
      } as React.CSSProperties}>
        <button
          onClick={handleMinimize}
          style={{
            width: '46px',
            height: '30px',
            border: 'none',
            background: 'transparent',
            color: '#cccccc',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          title="Minimize"
        >
          <i className="fa-solid fa-window-minimize" style={{ fontSize: '10px' }}></i>
        </button>
        <button
          onClick={handleMaximize}
          style={{
            width: '46px',
            height: '30px',
            border: 'none',
            background: 'transparent',
            color: '#cccccc',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          title="Maximize"
        >
          <i className="fa-regular fa-window-maximize" style={{ fontSize: '11px' }}></i>
        </button>
        <button
          onClick={handleClose}
          style={{
            width: '46px',
            height: '30px',
            border: 'none',
            background: 'transparent',
            color: '#cccccc',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e81123';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#cccccc';
          }}
          title="Close"
        >
          <i className="fa-solid fa-xmark" style={{ fontSize: '14px' }}></i>
        </button>
      </div>
    </div>
  );
};

export default Titlebar;
