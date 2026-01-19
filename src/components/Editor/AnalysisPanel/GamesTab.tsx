import React from 'react';

const GamesTab: React.FC = () => {
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
          fontSize: '14px'
        }}
        onClick={() => alert('Games feature coming soon!')}
      >
        <i className="fa-solid fa-gamepad" style={{ marginRight: '8px' }}></i>
        Start Game
      </button>
    </div>
  );
};

export default GamesTab;
