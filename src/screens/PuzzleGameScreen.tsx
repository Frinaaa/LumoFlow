import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNextPuzzle, PuzzleData, reshufflePuzzles } from '../utils/generators';
import { trackGameProgress, trackActivity } from '../utils/statsTracker';
import '../styles/LogicPuzzle.css';

const LogicPuzzleScreen: React.FC = () => {
  const navigate = useNavigate();

  // -- Game State --
  const [level, setLevel] = useState(1);
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);

  // -- Slots State (Array of fragment IDs) --
  const [slots, setSlots] = useState<(string | null)[]>([]);

  // -- UI State --
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initial Load
  useEffect(() => {
    reshufflePuzzles(); // Shuffle puzzles for new game session
    loadLevel(1);

    // Track Screen Entry
    trackActivity({
      title: 'Logic Puzzle Started',
      type: 'Algorithm',
      xp: 0,
      color: '#bc13fe',
      icon: 'fa-puzzle-piece'
    });
  }, []);

  const loadLevel = (lvl: number) => {
    const newPuzzle = getNextPuzzle(lvl);
    setPuzzle(newPuzzle);
    // Initialize empty slots based on number of fragments
    setSlots(new Array(newPuzzle.correctOrderIds.length).fill(null));
    setIsSuccess(false);
    setShowHint(false);
  };

  const handleNextLevel = () => {
    const nextLvl = level + 1;
    setLevel(nextLvl);
    loadLevel(nextLvl);
  };

  const isPlaced = (id: string) => slots.includes(id);

  // --- Drag & Drop ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDropInSlot = (index: number) => {
    if (!draggedId) return;

    setSlots(prev => {
      const newSlots = [...prev];
      // Remove from old slot if it exists there
      const oldIndex = newSlots.indexOf(draggedId);
      if (oldIndex !== -1) newSlots[oldIndex] = null;

      // Place in new slot (overwrite/replace)
      newSlots[index] = draggedId;
      return newSlots;
    });
    setDraggedId(null);
  };

  const handleDropInSidebar = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedId) return;

    // Remove from slots = return to sidebar
    setSlots(prev => {
      const newSlots = [...prev];
      const index = newSlots.indexOf(draggedId);
      if (index !== -1) newSlots[index] = null;
      return newSlots;
    });
    setDraggedId(null);
  };

  // --- Validation ---
  const checkPuzzle = () => {
    if (!puzzle) return;
    const isCorrect = slots.every((val, index) => val === puzzle.correctOrderIds[index]);

    if (isCorrect) {
      setIsSuccess(true);

      // 🟢 TRACK PROGRESS & SCORE
      trackGameProgress({
        gameName: 'Logic Puzzle',
        score: 150,
        level: level
      });

      trackActivity({
        title: 'Algo Reconstructed',
        type: `Logic Puzzle - Lvl ${level}`,
        xp: 150,
        color: '#bc13fe',
        icon: 'fa-puzzle-piece'
      });
    } else {
      alert("⚠️ Syntax Error: Blocks are missing or in the wrong order.");
    }
  };

  if (!puzzle) return <div style={{ color: 'white', padding: 50 }}>Loading Neural Interface...</div>;

  return (
    <div className="logic-puzzle-wrapper">
      <div className="bg-animation"></div>

      {/* HEADER */}
      <header className="puzzle-header">

        <div className="level-pill">PUZZLE: LEVEL {level}/∞</div>
        <button className="exit-btn" onClick={() => navigate('/games')}>
          <i className="fa-solid fa-arrow-right-from-bracket"></i> Exit Game
        </button>
      </header>

      <div className="puzzle-container">

        {/* LEFT PANEL: Drop Zones */}
        <div className="editor-panel">
          <div className="panel-top-bar">
            <div className="circle red"></div><div className="circle yellow"></div><div className="circle green"></div>
            <div className="filename">logic_level_{level}.js</div>
          </div>

          <div className="drop-zone">
            {slots.map((contentId, index) => {
              const fragment = contentId ? puzzle.fragments.find((f: any) => f.id === contentId) : null;
              return (
                <div
                  key={index}
                  className={`drop-slot ${isSuccess ? 'success-glow' : ''}`}
                  data-line={index + 1}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDropInSlot(index)}
                >
                  {fragment && (
                    <div
                      className="code-card"
                      draggable={!isSuccess}
                      onDragStart={(e) => handleDragStart(e, fragment.id)}
                      style={{ width: '100%', border: 'none', background: 'transparent', margin: 0, padding: 0 }}
                    >
                      {fragment.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Info & Fragments */}
        <div className="sidebar-panel">

          <div className="info-card">
            <h2 className="fancy-heading">{puzzle.title}</h2>
            <p className="description">{puzzle.description}</p>

            {showHint && (
              <div className="hint-text">
                <i className="fa-solid fa-lightbulb"></i> {puzzle.hint}
              </div>
            )}

            <div className="btn-group">
              {isSuccess ? (
                <button
                  className="action-btn btn-check"
                  style={{ background: '#00ff88', color: '#000', border: 'none' }}
                  onClick={handleNextLevel}
                >
                  Next Level <i className="fa-solid fa-arrow-right"></i>
                </button>
              ) : (
                <>
                  <button className="action-btn btn-hint" onClick={() => setShowHint(!showHint)}>
                    <i className="fa-solid fa-eye"></i> Hint
                  </button>
                  <button className="action-btn btn-check" onClick={checkPuzzle}>
                    <i className="fa-solid fa-play"></i> Run Code
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="fragments-header">FRAGMENTS</div>

          {/* Source Zone */}
          <div
            className="fragments-container"
            onDragOver={handleDragOver}
            onDrop={handleDropInSidebar}
          >
            {puzzle.fragments.map((frag: any) => {
              if (isPlaced(frag.id)) return null; // Hide if placed

              return (
                <div
                  key={frag.id}
                  className="code-card"
                  draggable={!isSuccess}
                  onDragStart={(e) => handleDragStart(e, frag.id)}
                >
                  {frag.content}
                </div>
              );
            })}

            {slots.every(s => s !== null) && (
              <div style={{ textAlign: 'center', color: '#444', fontSize: '0.8rem', marginTop: 20 }}>
                All fragments placed.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LogicPuzzleScreen;