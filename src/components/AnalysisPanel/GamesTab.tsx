import React from 'react';
import { useNavigate } from 'react-router-dom';

const GamesTab: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="analysis-content-section">
      <h4 style={{ color: '#00f2ff' }}>Learning Games</h4>
      <p style={{ color: '#ccc' }}>Interactive games to help you understand code concepts better.</p>
      <button
        className="game-btn"
        style={{
          background: '#bc13fe',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onClick={() => navigate('/games', { state: { from: '/editor' } })}
      >
        <i className="fa-solid fa-gamepad"></i>
        Enter Arcade
      </button>
    </div>
  );
};

export default GamesTab;