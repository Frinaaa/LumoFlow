import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/GameSelectorScreen.css';

const games = [
  { id: 0, title: "Bug\nHunt", subtitle: "Find the target", icon: "fa-crosshairs" },
  { id: 1, title: "Logic\nPuzzle", subtitle: "Solve the riddle", icon: "fa-puzzle-piece" },
  { id: 2, title: "Debug\nRace", subtitle: "Fix code fast", icon: "fa-bug" },
  { id: 3, title: "Predict\nOutput", subtitle: "What comes next?", icon: "fa-terminal" },
  { id: 4, title: "Error\nMatch", subtitle: "Identify the bug", icon: "fa-circle-exclamation" }
];

const GameSelectorScreen: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(1); // Default to Logic Puzzle (Index 1)
  const touchStartX = useRef(0);

  const nextCard = () => {
    if (currentIndex < games.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const prevCard = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const selectGame = (index: number) => {
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const launchGame = (index: number) => {
    const selectedGame = games[index];
    console.log("🚀 Launching Game:", selectedGame.title);

    // Logic Puzzle has ID 1
    // Inside launchGame function
    if (selectedGame.id === 0) { // Big Hunt is usually ID 0 in your list
  navigate('/games/bughunt');
}
else if (selectedGame.id === 1) { 
  navigate('/games/puzzle');
} else if (selectedGame.id === 2) { // Debug Race (ID 2 in your games array)
      navigate('/games/debug');
    } 
    else if (selectedGame.id === 3) navigate('/games/predict');
    else if (selectedGame.id === 0) navigate('/games/bughunt');
    else if (selectedGame.id === 4) { // Error Match is ID 4 in your list
  navigate('/games/error');
}

    else {
      const gameName = selectedGame.title.replace('\n', ' ');
      alert(`The game "${gameName}" is currently under development.`);
    } 
  };

  // Calculate style for 3D effect
  const getCardStyle = (index: number) => {
    const offset = index - currentIndex;
    const absOffset = Math.abs(offset);
    
    if (offset === 0) {
      // 🟢 FIX: Remove 3D rotation for the active card. 
      // Using simple scale + high zIndex ensures the button is clickable.
      return {
        transform: 'scale(1.1)', 
        zIndex: 1000, 
        opacity: 1,
        filter: 'brightness(1.2)',
        borderColor: 'rgba(255,255,255,0.8)',
        cursor: 'default',
        pointerEvents: 'auto' as const
      };
    } else {
      // Side Cards - Keep 3D effect for visuals
      const sign = offset > 0 ? 1 : -1;
      const x = offset * 220;
      const z = -absOffset * 200;
      const r = -sign * 45;
      
      return {
        transform: `translateX(${x}px) translateZ(${z}px) rotateY(${r}deg) scale(0.9)`,
        zIndex: 100 - absOffset,
        opacity: 0.4,
        filter: 'blur(2px) brightness(0.5)',
        borderColor: 'rgba(255,255,255,0.1)',
        cursor: 'pointer',
        pointerEvents: 'auto' as const
      };
    }
  };

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextCard();
      if (e.key === 'ArrowLeft') prevCard();
      if (e.key === 'Enter') launchGame(currentIndex);
      if (e.key === 'Escape') navigate('/editor');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    if (touchStartX.current - endX > 50) nextCard();
    if (touchStartX.current - endX < -50) prevCard();
  };

  return (
    <div className="game-selector-wrapper" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="spotlight"></div>

      <button className="gs-back-btn" onClick={() => navigate('/editor')} title="Back to Editor">
        <i className="fa-solid fa-arrow-left"></i>
      </button>

      <div className="gs-header">
      
        <h2>GAME ARCADE</h2>
        <p style={{color:'#888', margin:0}}>Swipe to choose your challenge</p>
      </div>

      <div className="carousel-container">
        {games.map((game, index) => {
          const isActive = index === currentIndex;
          return (
            <div 
              key={game.id}
              className={`game-card game-theme-${index}`}
              style={getCardStyle(index)}
              onClick={() => selectGame(index)}
            >
              <i className={`fa-solid ${game.icon} card-icon`}></i>
              <div className="card-content">
                <h3>
                  {game.title.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}<br/>
                    </React.Fragment>
                  ))}
                </h3>
                <p>{game.subtitle}</p>
              </div>
              
              {/* Button only visible/clickable on active card */}
              <button 
                className="play-btn" 
                style={{
                  opacity: isActive ? 1 : 0,
                  pointerEvents: isActive ? 'auto' : 'none',
                  position: 'relative', 
                  zIndex: 2000 // Force on top of card content
                }}
                onClick={(e) => {
                  e.stopPropagation(); // Stop click from triggering card select
                  launchGame(index);
                }}
              >
                Tap to Start
              </button>
            </div>
          );
        })}
      </div>

      <div className="gs-controls">
        <button className="nav-btn" onClick={prevCard}><i className="fa-solid fa-chevron-left"></i></button>
        <button className="nav-btn" onClick={nextCard}><i className="fa-solid fa-chevron-right"></i></button>
      </div>

      {/* Backup Footer Button */}
      <div className="launch-zone" onClick={() => launchGame(currentIndex)}>
        <span>Start Game</span>
        <i className="fa-solid fa-chevron-down"></i>
      </div>
    </div>
  );
};

export default GameSelectorScreen;