import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNextBugLevel, BugHuntLevel, reshuffleLevels } from '../utils/bugHuntGenerator';
import '../styles/BugHunt.css';

const BugHuntScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // Game Data
  const [level, setLevel] = useState(1);
  const [data, setData] = useState<BugHuntLevel | null>(null);
  
  // Interaction
  const [selectedLineIdx, setSelectedLineIdx] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isSolved, setIsSolved] = useState(false);

  useEffect(() => {
    reshuffleLevels();
    loadLevel(1);
  }, []);

  const loadLevel = (lvl: number) => {
    const newData = getNextBugLevel(lvl);
    setData(newData);
    setSelectedLineIdx(null);
    setShowHint(false);
    setIsSolved(false);
  };

  const handleNextLevel = () => {
    if (!isSolved) return;
    const next = level + 1;
    setLevel(next);
    loadLevel(next);
  };

  const handleMarkBug = () => {
    if (selectedLineIdx === null || !data) {
      alert("⚠️ Select a line of code first!");
      return;
    }

    const selectedLine = data.lines[selectedLineIdx];

    if (selectedLine.isBug) {
      // Success Logic
      setIsSolved(true);
      alert("✅ BUG ELIMINATED! System memory stabilized.");
    } else {
      // Failure Logic
      alert("❌ NO BUG DETECTED on this line. Check logic again.");
    }
  };

  // Syntax Highlighter Helper
  const renderCode = (text: string) => {
    const parts = text.split(' ');
    return parts.map((part, i) => {
      let cls = '';
      if (/^(function|const|let|var|if|for|return)$/.test(part)) cls = 'kwd';
      else if (part.includes('(') && !part.startsWith('//')) cls = 'func';
      else if (/^\d+;?$/.test(part)) cls = 'num';
      else if (part.startsWith('//')) cls = 'cmt';
      
      return <span key={i} className={cls}>{part} </span>;
    });
  };

  if (!data) return <div style={{color:'white', padding:50}}>Loading...</div>;

  return (
    <div className="bug-hunt-wrapper">
      
      {/* HEADER */}
      <header className="bug-header">
       
        
        <div className="level-pill">
          BIG HUNT &nbsp;|&nbsp; <span>Level {level} / ∞</span>
        </div>

        <button className="exit-btn" onClick={() => navigate('/games')}>
          <i className="fa-solid fa-arrow-right-from-bracket"></i> Exit Game
        </button>
      </header>

      {/* GAME AREA */}
      <div className="bh-game-wrapper">
        
        {/* CARD 1: EDITOR */}
        <div className="editor-card">
          <div className="editor-top-bar">
            <div className="window-dots">
              <div className="w-dot red"></div>
              <div className="w-dot yellow"></div>
              <div className="w-dot green"></div>
            </div>
            <div className="file-name">{data.filename}</div>
          </div>

          <div className="code-container">
            {data.lines.map((line: CodeLine, idx: number) => (
              <div 
                key={idx}
                className={`code-row ${selectedLineIdx === idx ? 'selected' : ''}`}
                onClick={() => !isSolved && setSelectedLineIdx(idx)}
              >
                <div className="line-num">{idx + 1}</div>
                <div className="code-content" style={{ paddingLeft: `${line.indent * 20}px` }}>
                  {line.text.startsWith('//') ? (
                    <span className="cmt">{line.text}</span>
                  ) : (
                    renderCode(line.text)
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 2: SIDEBAR */}
        <div className="sidebar-card">
          <div className="mission-header">
            <i className="fa-solid fa-bug"></i> {data.missionTitle}
          </div>
          <p className="mission-text">{data.missionDesc}</p>

          <div className="goal-container">
            <span className="goal-label">GOAL:</span>
            <span className="goal-text">{data.goal}</span>
          </div>

          {/* Hint Toggle */}
          <div className="hint-toggle" onClick={() => setShowHint(!showHint)}>
            <i className="fa-solid fa-circle-question"></i> Hint (Click to Reveal)
          </div>
          {showHint && <div className="hint-box">{data.hint}</div>}

          {/* Buttons */}
          <div className="buttons-row">
            <button className="btn btn-reveal" onClick={() => setShowHint(true)}>
              <i className="fa-regular fa-lightbulb"></i> Reveal Hint
            </button>
            <button 
              className="btn btn-mark" 
              onClick={handleMarkBug}
              style={{ opacity: isSolved ? 0.5 : 1, cursor: isSolved ? 'not-allowed' : 'pointer' }}
            >
              <i className="fa-solid fa-crosshairs"></i> {isSolved ? 'SOLVED' : 'Mark Bug'}
            </button>
          </div>

          {/* Next Level Footer */}
          <div 
            className={`next-level-area ${isSolved ? 'unlocked' : ''}`}
            onClick={handleNextLevel}
          >
            {isSolved ? (
              <>Next Level <i className="fa-solid fa-arrow-right"></i></>
            ) : (
              <><i className="fa-solid fa-lock"></i> Next Level</>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BugHuntScreen;