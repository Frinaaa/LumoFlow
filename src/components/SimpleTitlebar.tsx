import React from 'react';
import { useWindowControls } from '../hooks/useWindowControls';

const SimpleTitlebar: React.FC = () => {
  // Use shared window controls hook
  const { minimize, maximize, close } = useWindowControls();

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
          onClick={minimize}
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
          onClick={maximize}
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
          onClick={close}
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
