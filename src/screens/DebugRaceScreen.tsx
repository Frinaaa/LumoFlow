import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { getNextBug, BugLevel, reshuffleBugs } from '../utils/debugGenerator';
import '../styles/DebugRace.css';

interface LogEntry {
  msg: string;
  type: 'info' | 'error' | 'success';
}

const DebugRaceScreen: React.FC = () => {
  const navigate = useNavigate();
  const DURATION = 120; // 2 Minutes
  
  const [level, setLevel] = useState(1);
  const [bugData, setBugData] = useState<BugLevel | null>(null);
  const [userCode, setUserCode] = useState("// Initializing System...");
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [isRunning, setIsRunning] = useState(true);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'timeout'>('playing');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(2);

  // Load Level Function
  const loadLevel = (lvl: number) => {
    const newBug = getNextBug(lvl);
    
    // Check console to debug if data is coming correctly
    console.log("New Bug Data:", newBug); 

    if (newBug) {
      setBugData(newBug);
      setUserCode(newBug.buggyCode || "// Error loading code");
      setTimeLeft(DURATION);
      setIsRunning(true);
      setGameState('playing');
      setShowSolution(false); // Reset solution display
      setAttemptsLeft(2); // Reset attempts to 2
      setLogs([
        { msg: `> Level ${lvl} Initialized...`, type: 'info' },
        { msg: `> Analyzing code...`, type: 'info' },
        { msg: `> ERROR DETECTED: ${newBug.description}`, type: 'error' },
        { msg: `> Attempts remaining: 2`, type: 'info' }
      ]);
    }
  };

  // Initial Mount
  useEffect(() => {
    reshuffleBugs(); // Shuffle bugs for new game session
    loadLevel(1);
  }, []);

  const handleNextLevel = () => {
    const nextLvl = level + 1;
    setLevel(nextLvl);
    loadLevel(nextLvl);
  };

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          setGameState('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  // Execute Code Logic
  const handleExecute = () => {
    if (!bugData || timeLeft <= 0) return;
    
    setLogs(prev => [...prev, { msg: "> Compiling patch...", type: 'info' }]);

    setTimeout(() => {
      // Normalize code by removing extra whitespace and empty lines for comparison
      const normalizeCode = (code: string) => {
        return code
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.startsWith('//'))
          .join('\n');
      };

      const normalizedUserCode = normalizeCode(userCode);
      const normalizedFixedCode = normalizeCode(bugData.fixedCode);

      // Check if the fixed code is present in the user's code (allows extra lines)
      const isFixed = normalizedFixedCode.split('\n').every(fixedLine => 
        normalizedUserCode.split('\n').some(userLine => userLine === fixedLine)
      );

      if (isFixed) {
        setLogs(prev => [...prev, 
          { msg: "> SUCCESS: Bug Patched.", type: 'success' },
          { msg: `> ${bugData.explanation}`, type: 'info' }
        ]);
        setGameState('won');
        setIsRunning(false);
        setShowSolution(true);
      } else {
        const newAttemptsLeft = attemptsLeft - 1;
        setAttemptsLeft(newAttemptsLeft);
        
        if (newAttemptsLeft > 0) {
          // Still have attempts left
          setLogs(prev => [...prev, 
            { msg: "> ERROR: Issue persists.", type: 'error' },
            { msg: `> Attempts remaining: ${newAttemptsLeft}`, type: 'info' },
            { msg: "> Hint: " + bugData.hint, type: 'info' }
          ]);
        } else {
          // No attempts left, show solution if time is remaining
          if (timeLeft > 0) {
            setLogs(prev => [...prev, 
              { msg: "> ERROR: Maximum attempts reached.", type: 'error' },
              { msg: "> Revealing solution...", type: 'info' }
            ]);
            setShowSolution(true);
          } else {
            setLogs(prev => [...prev, 
              { msg: "> ERROR: Time expired.", type: 'error' }
            ]);
          }
        }
      }
    }, 500);
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!bugData) return <div style={{color:'white', padding:50}}>Loading Neural Interface...</div>;

  return (
    <div className="debug-race-wrapper">
      <header className="hud-header">
        <div className="debug-brand">
          <div className="debug-icon"><i className="fa-solid fa-bolt"></i></div>
          DEBUG<span style={{color:'#ff003c'}}>RACE</span>
        </div>
        <div style={{display:'flex', gap: 20, alignItems: 'center'}}>
            <div style={{color:'#aaa', border:'1px solid #333', padding:'5px 15px', borderRadius:20}}>LEVEL {level}</div>
            <button onClick={() => navigate('/games')} style={{background:'transparent', border:'1px solid #444', color:'#888', padding:'5px 15px', cursor:'pointer'}}>EXIT</button>
        </div>
        <div className="timer-box" style={{backgroundColor: timeLeft <= 10 ? 'rgba(255,0,60,0.4)' : ''}}>
          <span className="timer-label">TIME</span>
          <span className="timer-val" style={{color: timeLeft <= 10 ? '#fff' : ''}}>{formatTime(timeLeft)}</span>
        </div>
      </header>

      <div className="progress-line">
        <div className="progress-fill" style={{width: `${(timeLeft / DURATION) * 100}%`}}></div>
      </div>

      <div className="interface-container">
        
        {/* Editor */}
        <div className="debug-editor-panel">
          <div className="editor-top">
            <div className="file-tab">bug_level_{level}.js</div>
            <div>READ/WRITE</div>
          </div>
          <div style={{flex: 1}}>
            <Editor
              key={`editor-level-${level}`}
              height="100%"
              theme="vs-dark"
              language="javascript"
              value={userCode}
              onChange={(val) => setUserCode(val || '')}
              options={{ fontSize: 16, minimap: { enabled: false }, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="system-panel" style={{display:'flex', flexDirection:'column', height:'100%'}}>
          <div className="status-card">
            <div className="status-header"><i className="fa-solid fa-circle-exclamation"></i> Error Log</div>
            <p style={{color:'#ccc', fontSize:'0.9rem'}}>{bugData.description}</p>
          </div>
          <div className="status-card" style={{flex:1, display:'flex', flexDirection:'column', minHeight:0}}>
            <div className="status-header"><i className="fa-solid fa-terminal"></i> Console</div>
            <div className="console-box" style={{flex:1, overflow:'auto'}}>
              {logs.map((log, idx) => (
                <div key={idx} className={`log-entry ${log.type === 'error' ? 'log-err' : log.type === 'success' ? 'log-ok' : ''}`}>{log.msg}</div>
              ))}
            </div>
          </div>
          
          {/* Solution Panel - Shows after execute */}
          {showSolution && (
            <div className="status-card" style={{maxHeight:'250px', overflow:'auto'}}>
              <div className="status-header"><i className="fa-solid fa-lightbulb"></i> Solution</div>
              <div style={{background:'#1a1a1a', padding:'10px', borderRadius:'5px', fontSize:'0.85rem', fontFamily:'monospace', color:'#4ade80', maxHeight:'150px', overflow:'auto', whiteSpace:'pre-wrap'}}>
                {bugData.fixedCode}
              </div>
              <div style={{marginTop:'10px', padding:'8px', background:'rgba(74,222,128,0.1)', borderRadius:'5px', fontSize:'0.85rem', color:'#86efac'}}>
                <strong>Explanation:</strong> {bugData.explanation}
              </div>
            </div>
          )}
          
          {/* Show Next Level button after solution is shown */}
          {showSolution ? (
            <button 
              className="deploy-btn" 
              onClick={handleNextLevel} 
              style={{marginTop:'auto', flexShrink:0, background:'var(--neon-safe)', color:'#000'}}
            >
              <i className="fa-solid fa-forward"></i> NEXT LEVEL
            </button>
          ) : (
            <button 
              className="deploy-btn" 
              onClick={handleExecute} 
              disabled={gameState !== 'playing' || attemptsLeft === 0 || timeLeft === 0} 
              style={{marginTop:'auto', flexShrink:0}}
            >
              <i className="fa-solid fa-play"></i> EXECUTE FIX ({attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} left)
            </button>
          )}
        </div>

        {/* TIMEOUT OVERLAY */}
        {gameState === 'timeout' && (
          <div className="overlay-screen" style={{background: 'rgba(0,0,0,0.98)', display:'flex'}}>
            <h1 style={{color: 'var(--neon-alert)', fontFamily:'Orbitron', marginBottom:20}}>TIME EXPIRED</h1>
            <div style={{display:'flex', gap:20, width:'90%', height:'400px'}}>
                <div style={{flex:1}}>
                    <div style={{color:'#888', marginBottom:5}}>YOUR CODE</div>
                    <div className="solution-box">{userCode}</div>
                </div>
                <div style={{flex:1}}>
                    <div style={{color:'var(--neon-safe)', marginBottom:5}}>SOLUTION</div>
                    <div className="solution-box correct">{bugData.fixedCode}</div>
                </div>
            </div>
            <button className="deploy-btn" style={{marginTop:30}} onClick={handleNextLevel}>CONTINUE <i className="fa-solid fa-arrow-right"></i></button>
          </div>
        )}

        {/* WIN OVERLAY */}
        {gameState === 'won' && (
          <div className="overlay-screen" style={{display:'flex'}}>
            <h1 style={{color: 'var(--neon-safe)', fontFamily:'Orbitron'}}>BUG ELIMINATED</h1>
            <button className="deploy-btn" style={{marginTop:30, background:'var(--neon-safe)', color:'black'}} onClick={handleNextLevel}>NEXT LEVEL <i className="fa-solid fa-forward"></i></button>
          </div>
        )}

      </div>
    </div>
  );
};

export default DebugRaceScreen;