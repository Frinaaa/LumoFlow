import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LogicPuzzle.css';

// Definition of a code fragment
interface CodeFragment {
  id: string;
  content: React.ReactNode;
}

// The puzzle data
const initialFragments: CodeFragment[] = [
  { id: 'p1', content: <><span className="kw">function</span> <span className="fn">initFirewall</span>() {'{'}</> },
  { id: 'p2', content: <>&nbsp;&nbsp;<span className="kw">let</span> secure = <span className="kw">true</span>;</> },
  { id: 'p3', content: <>&nbsp;&nbsp;<span className="kw">if</span> (secure) {'{'}</> },
  { id: 'p4', content: <>&nbsp;&nbsp;&nbsp;&nbsp;console.log(<span className="str">"Connected"</span>);</> },
  { id: 'p5', content: <>&nbsp;&nbsp;{'}'}</> },
  { id: 'p6', content: <>{'}'}</> },
];

const LogicPuzzleScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // State to track where each fragment is (null means it's in the sidebar)
  // Key = Slot Index (0-4), Value = Fragment ID
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Helper to check if a fragment is already placed in a slot
  const isPlaced = (id: string) => slots.includes(id);

  // --- Drag Handlers ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDropInSlot = (index: number) => {
    if (!draggedId) return;

    setSlots(prev => {
      const newSlots = [...prev];
      
      // If item was already in another slot, clear that slot
      const oldSlotIndex = newSlots.indexOf(draggedId);
      if (oldSlotIndex !== -1) {
        newSlots[oldSlotIndex] = null;
      }

      // If target slot has an item, move it back to sidebar (or swap - simple replace here)
      // For simplicity: overwriting just replaces
      newSlots[index] = draggedId;
      
      return newSlots;
    });
    setDraggedId(null);
  };

  const handleDropInSidebar = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedId) return;

    // Remove from slots (effectively moving back to sidebar)
    setSlots(prev => {
      const newSlots = [...prev];
      const index = newSlots.indexOf(draggedId);
      if (index !== -1) newSlots[index] = null;
      return newSlots;
    });
    setDraggedId(null);
  };

  // --- Validation Logic ---
  const checkPuzzle = () => {
    // Correct Order IDs
    const correctOrder = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
    
    // Check if slots match correct order
    const isCorrect = slots.every((val, index) => val === correctOrder[index]);

    if (isCorrect) {
      alert("✅ SYSTEM SECURE: Firewall initialized successfully!");
    } else {
      alert("❌ SYNTAX ERROR: Code fragments are misplaced or missing.");
    }
  };

  return (
    <div className="logic-puzzle-wrapper">
      <div className="bg-animation"></div>

      {/* HEADER */}
      <header className="puzzle-header">
        <div className="brand-logo">
          <div className="logo-icon"><i className="fa-solid fa-bolt"></i></div>
          LUMO<span>FLOW</span>
        </div>
        <div className="level-badge">PUZZLE: LEVEL 3/5</div>
        
        {/* BACK BUTTON */}
        <button className="exit-btn" onClick={() => navigate('/games')}>
          <i className="fa-solid fa-arrow-right-from-bracket"></i> Exit Game
        </button>
      </header>

      <div className="puzzle-container">
        
        {/* LEFT: Editor Drop Zones */}
        <div className="editor-panel">
          <div className="panel-top-bar">
            <div className="circle red"></div><div className="circle yellow"></div><div className="circle green"></div>
            <div className="filename">broken_logic.js</div>
          </div>
          
          <div className="drop-zone">
            {slots.map((contentId, index) => {
              const fragment = initialFragments.find(f => f.id === contentId);
              return (
                <div 
                  key={index} 
                  className="drop-slot" 
                  data-line={index + 1}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDropInSlot(index)}
                >
                  {fragment && (
                    <div 
                      className="code-card" 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, fragment.id)}
                      style={{ width: '100%', border: 'none', background: 'transparent' }}
                    >
                      {fragment.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Sidebar Instructions & Pieces */}
        <div className="sidebar-panel">
          
          <div className="info-card">
            <h2 className="fancy-heading">Dare to Arrange Me</h2>
            <p className="description">
              The firewall security protocol is scrambled. Rearrange the code snippets to initialize the secure connection.
            </p>
            
            <div className={`hint-text ${showHint ? 'visible' : ''}`}>
              <i className="fa-regular fa-lightbulb"></i> <b>Hint:</b> Declare variable 'secure' before checking it.
            </div>

            <div className="btn-group">
              <button className="action-btn btn-hint" onClick={() => setShowHint(!showHint)}>
                <i className="fa-solid fa-eye"></i> Hint
              </button>
              <button className="action-btn btn-check" onClick={checkPuzzle}>
                <i className="fa-solid fa-play"></i> Run Code
              </button>
            </div>
          </div>

          <h4 style={{ color: '#666', fontFamily: 'Orbitron', marginTop: '10px' }}>FRAGMENTS</h4>
          
          {/* Source Zone (Sidebar) */}
          <div 
            className="fragments-container"
            onDragOver={handleDragOver}
            onDrop={handleDropInSidebar}
          >
            {initialFragments.map((frag) => {
              // Only render if NOT placed in a slot
              if (isPlaced(frag.id)) return null;

              return (
                <div 
                  key={frag.id} 
                  className="code-card" 
                  draggable 
                  onDragStart={(e) => handleDragStart(e, frag.id)}
                >
                  {frag.content}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LogicPuzzleScreen;