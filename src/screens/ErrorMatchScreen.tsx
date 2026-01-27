import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNextErrorCard, ErrorCardData, reshuffleErrors } from '../utils/generators';
import '../styles/ErrorMatch.css';

const ErrorMatchScreen: React.FC = () => {
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [currentCard, setCurrentCard] = useState<ErrorCardData | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'fail' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    reshuffleErrors();
    spawnCard();
  }, []);

  const spawnCard = () => {
    setFeedback(null);
    const newCard = getNextErrorCard();
    setCurrentCard(newCard);
  };

  // --- Drag & Drop Logic ---

  const handleDragStart = (e: React.DragEvent) => {
    if (!currentCard) return;
    setIsDragging(true);
    e.dataTransfer.setData("text/plain", currentCard.type);
    e.dataTransfer.effectAllowed = "move";

    // Hide original element visually but keep it in DOM for drag
    const target = e.target as HTMLElement;
    setTimeout(() => { target.style.opacity = '0.01'; }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (basketType: string) => {
    if (!currentCard) return;

    if (basketType === currentCard.type) {
      // Correct - move to next card
      setScore(s => s + 1);
      setFeedback({ text: "MATCHED!", type: "success" });
      setTimeout(() => {
        spawnCard();
      }, 800);
    } else {
      // Wrong - show error and keep same card
      setFeedback({ text: "WRONG TYPE - TRY AGAIN", type: "fail" });
      setTimeout(() => {
        setFeedback(null);
      }, 1500);
    }
    setIsDragging(false);
  };

  if (!currentCard) return <div style={{ color: 'white', padding: 50 }}>Loading Stream...</div>;

  return (
    <div className="error-match-wrapper">

      {/* HEADER */}
      <header className="error-header">
        <div className="score-box">DETECTED: <span className="score-val">{score}</span></div>

        <button className="exit-btn" onClick={() => navigate('/games')}>EXIT</button>
      </header>

      <div className="em-game-container">

        {/* BASKETS ROW */}
        <div className="baskets-row">

          {['syntax', 'ref', 'type', 'logic'].map((type) => (
            <div
              key={type}
              className={`basket ${type} ${isDragging ? 'highlight' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('drag-over');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('drag-over');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('drag-over');
                handleDrop(type);
              }}
            >
              <i className={`fa-solid ${getIcon(type)}`}></i>
              <span>{type.toUpperCase()} ERROR</span>
            </div>
          ))}

        </div>

        {/* CODE CARD */}
        <div className="card-zone">
          <div
            className="code-card"
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            style={{ borderLeftColor: currentCard.color }}
          >
            <div className="cc-header">
              <span className="cc-filename">error_log_{currentCard.id}.js</span>
              <i className="fa-solid fa-grip-vertical cc-icon"></i>
            </div>

            <div className="cc-body">
              {currentCard.code}
            </div>

            <div className="cc-hint">
              <i className="fa-solid fa-lightbulb"></i>
              <span><b>HINT:</b> {currentCard.hint}</span>
            </div>
          </div>

          {feedback && (
            <div className={`feedback-overlay ${feedback.type}`}>{feedback.text}</div>
          )}
        </div>

      </div>
    </div>
  );
};

// Helper for Icons
const getIcon = (type: string) => {
  switch (type) {
    case 'syntax': return 'fa-code';
    case 'ref': return 'fa-link-slash';
    case 'type': return 'fa-shapes';
    case 'logic': return 'fa-brain';
    default: return 'fa-bug';
  }
};

export default ErrorMatchScreen;