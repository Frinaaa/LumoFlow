import React from 'react';

interface ShortcutToastProps {
  message: string;
}

export const ShortcutToast: React.FC<ShortcutToastProps> = ({ message }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '50px',
      right: '20px',
      background: '#2d2d30',
      color: '#cccccc',
      padding: '8px 16px',
      borderRadius: '4px',
      border: '1px solid #3e3e42',
      fontSize: '12px',
      zIndex: 10000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      animation: 'fadeInOut 2s ease-in-out'
    }}>
      <i className="fa-solid fa-keyboard" style={{ marginRight: '8px', color: '#00f2ff' }}></i>
      {message}
    </div>
  );
};
