import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNextChallenge, PredictChallenge, reshuffleChallenges } from '../utils/generators';
import { trackGameProgress, trackActivity } from '../utils/statsTracker';
import '../styles/PredictGame.css';

const PredictGameScreen: React.FC = () => {
  const navigate = useNavigate();

  // Game State
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState<PredictChallenge | null>(null);

  // Interaction State
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Load first question
  useEffect(() => {
    reshuffleChallenges();
    loadQuestion(1);

    // Track Screen Entry
    trackActivity({
      title: 'Predict Challenge Started',
      type: 'Logic',
      xp: 0,
      color: '#00ccff',
      icon: 'fa-crystal-ball'
    });
  }, []);

  const loadQuestion = (lvl: number) => {
    const newQ = getNextChallenge(lvl);
    setQuestion(newQ);
    setSelectedIdx(null);
    setIsAnswered(false);
  };

  const handleOptionClick = (index: number) => {
    if (isAnswered || !question) return;

    setSelectedIdx(index);
    setIsAnswered(true);

    if (index === question.correctIndex) {
      setScore(s => s + 1);

      // 🟢 TRACK PROGRESS & SCORE
      trackGameProgress({
        gameName: 'Predict Output',
        score: 50,
        level: level
      });

      trackActivity({
        title: 'Correct Prediction',
        type: 'Output Prediction',
        xp: 50,
        color: '#00ccff',
        icon: 'fa-terminal'
      });
    }
  };

  const handleNext = () => {
    const nextLvl = level + 1;
    setLevel(nextLvl);
    loadQuestion(nextLvl);
  };

  if (!question) return <div style={{ color: 'white', padding: 50 }}>Initializing...</div>;

  return (
    <div className="predict-wrapper">
      <div className="bg-texture"></div>

      {/* HEADER */}
      <header>

        <div className="score-box">
          <div>Level: <span>{level}</span></div>
          <div style={{ color: '#00ff88' }}>Score: <span>{score}</span></div>
        </div>

        <button className="exit-btn" onClick={() => navigate('/games')}>EXIT</button>
      </header>

      <div className="game-container">

        {/* CODE MONITOR */}
        <div className="monitor-frame">
          <div className="monitor-header">
            <div className="dot red"></div><div className="dot yellow"></div><div className="dot green"></div>
            <div className="tab-title">challenge_{level}.js</div>
          </div>
          <div className="code-display">
            {question.code}
          </div>
        </div>

        <div className="prompt-text">
          &gt; What will be logged to the console?
        </div>

        {/* OPTIONS GRID */}
        <div className="options-grid">
          {question.options.map((opt: string, idx: number) => {
            let statusClass = "";
            if (isAnswered) {
              if (idx === question.correctIndex) statusClass = "correct";
              else if (idx === selectedIdx) statusClass = "wrong";
            }

            return (
              <div
                key={idx}
                className={`option-card ${statusClass}`}
                onClick={() => handleOptionClick(idx)}
              >
                {opt}
              </div>
            );
          })}
        </div>

        {/* NEXT BUTTON (Only visible after answer) */}
        {isAnswered && (
          <button className="next-btn" onClick={handleNext}>
            NEXT CHALLENGE <i className="fa-solid fa-chevron-right"></i>
          </button>
        )}

      </div>
    </div>
  );
};

export default PredictGameScreen;