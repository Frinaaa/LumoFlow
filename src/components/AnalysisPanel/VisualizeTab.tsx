import React, { useState, useEffect, useMemo } from 'react';
import { useVisualStore } from '../../editor/stores/visualStore';
import { useEditorStore } from '../../editor/stores/editorStore';
import LogicStructure from './LogicStructure';

const VisualizeTab: React.FC = () => {
  const {
    traceFrames,
    currentFrameIndex,
    setFrameIndex,
    isVisualizing,
    currentVisualFilePath,
    lastError,
    cooldownUntil,
    fetchAiSimulation,
    isPlaying,
    setPlaying,
    isReplaying,
    visualMode
  } = useVisualStore();

  const { activeTabId, tabs, outputData } = useEditorStore();
  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);

  const [timeLeft, setTimeLeft] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (cooldownUntil > Date.now()) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) clearInterval(timer);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setTimeLeft(0);
    }
  }, [cooldownUntil]);

  const currentFrame = traceFrames && traceFrames.length > 0 ? traceFrames[currentFrameIndex] : null;

  const handleAnalyze = (force = false) => {
    if (!activeTab) return;
    fetchAiSimulation(activeTab.content, activeTab.filePath, outputData, force);
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.name.includes('Female') || v.name.includes('Deep') || v.name.includes('Google US English')) || voices[0];

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (isPlaying && currentFrameIndex < traceFrames.length - 1) {
        setFrameIndex(currentFrameIndex + 1);
      } else { setPlaying(false); }
    };
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (isPlaying && currentFrame) speak(currentFrame.desc);
  }, [currentFrameIndex, isPlaying]);

  return (
    <div className="lumo-visual-container">
      <div className="visual-stage">

        {/* TOP STATUS BAR */}
        <div className="visual-header">
          <div className="status-indicator">
            <div className={`status-dot ${isVisualizing ? 'active' : isReplaying ? 'replay' : ''}`}></div>
            <span>
              {isReplaying ? 'REPLAY MODE' : isVisualizing ? 'NEURAL DIRECTING' : 'SYSTEM STANDBY'}
            </span>
          </div>
          {traceFrames.length > 0 && !isReplaying && (
            <button className="regen-btn" onClick={() => handleAnalyze(true)}>
              <i className="fa-solid fa-bolt"></i> RE-TRACE
            </button>
          )}
        </div>

        {/* LOADING OVERLAY */}
        {isVisualizing && (
          <div className="neural-overlay">
            <div className="scanner-line"></div>
            <div className="core-spinner"></div>
            <p className="glow-text">CONSTRUCTING NEURAL LOGIC...</p>
          </div>
        )}

        {/* MAIN VISUAL CONTENT */}
        {traceFrames.length > 0 ? (
          <div className="logic-theater">
            <LogicStructure frame={currentFrame!} />
          </div>
        ) : (
          !isVisualizing && (
            <div className="empty-state">
              <div className="clapper-icon">🎬</div>
              <h2>LOGIC THEATER</h2>
              <p>Initialize a neural trace to explain the runtime execution</p>
              <button className="start-btn" onClick={() => handleAnalyze(false)}>
                GENERATE VISUAL TRACE
              </button>
            </div>
          )
        )}
      </div>

      {/* HUD CONTROLS */}
      <div className="visual-hud">
        <div className="narration-box">
          <div className="narration-icon">
            <i className={`fa-solid fa-wave-square ${isSpeaking ? 'speaking' : ''}`}></i>
          </div>
          <p className="narration-text">
            {currentFrame?.desc || (lastError ? lastError : "Neural interface ready. Awaiting instructions...")}
          </p>
        </div>

        <div className="control-strip">
          <button className="playback-circle" onClick={() => setPlaying(!isPlaying)} disabled={traceFrames.length === 0}>
            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
          </button>

          <div className="timeline-wrap">
            <input
              type="range" className="visual-scrubber"
              min="0" max={Math.max(0, traceFrames.length - 1)}
              value={currentFrameIndex}
              onChange={(e) => {
                setPlaying(false);
                window.speechSynthesis.cancel();
                setFrameIndex(parseInt(e.target.value));
              }}
            />
            <div className="frame-data">
              FRAME {currentFrameIndex + 1} / {traceFrames.length}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .lumo-visual-container { height: 100%; display: flex; flex-direction: column; background: #020204; color: #fff; position: relative; overflow: hidden; }
        .visual-stage { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; position: relative; background: radial-gradient(circle at center, #0a0a18 0%, #020204 100%); overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; scrollbar-color: rgba(188,19,254,0.3) transparent; }
        .visual-stage::-webkit-scrollbar { width: 5px; }
        .visual-stage::-webkit-scrollbar-thumb { background: rgba(188,19,254,0.3); border-radius: 10px; }
        .visual-stage::-webkit-scrollbar-thumb:hover { background: rgba(188,19,254,0.5); }

        .visual-header { position: sticky; top: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; z-index: 50; padding: 15px; background: linear-gradient(to bottom, #020204, transparent); width: 100%; box-sizing: border-box; }
        
        .logic-theater { width: 100%; min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px 20px 20px 20px; flex-shrink: 0; }

        /* ========== STRUCTURE COMMON ========== */
        .logic-structure { width: 100%; max-width: 100%; padding: 20px; box-sizing: border-box; }
        .struct-label { font-family: 'Orbitron'; font-size: 12px; color: #bc13fe; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
        .type-badge { font-size: 8px; padding: 2px 6px; background: rgba(188,19,254,0.1); border: 1px solid #bc13fe; border-radius: 10px; opacity: 0.7; }

        /* ========== ACTION BANNER ========== */
        .action-banner { display: flex; align-items: center; gap: 12px; padding: 6px 12px; margin-bottom: 15px; border-left: 3px solid #888; background: rgba(255,255,255,0.02); border-radius: 0 6px 6px 0; }
        .action-label { font-family: 'Orbitron'; font-size: 10px; font-weight: bold; letter-spacing: 2px; }
        .step-counter { font-size: 9px; color: #555; margin-left: auto; font-family: 'JetBrains Mono'; }

        /* ========== ARRAY VIEW (3D Bubbles) ========== */
        .array-cells { display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; align-items: center; padding: 10px; }
        .array-cell { 
          border-radius: 50%; 
          background: radial-gradient(circle at 35% 35%, hsla(var(--hue, 270), 70%, 55%, 0.15) 0%, rgba(0,0,0,0.5) 100%);
          border: 2px solid hsla(var(--hue, 270), 70%, 50%, 0.3);
          display: flex; flex-direction: column; align-items: center; justify-content: center; 
          position: relative; transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 5px 20px rgba(0,0,0,0.4), inset 0 0 15px rgba(255,255,255,0.03);
        }
        
        .array-cell.comparing { 
          border-color: #ffaa00; 
          background: radial-gradient(circle at 35% 35%, rgba(255,170,0,0.25) 0%, rgba(0,0,0,0.5) 100%);
          transform: scale(1.15); 
          box-shadow: 0 0 25px rgba(255,170,0,0.4), inset 0 0 15px rgba(255,170,0,0.1);
        }
        .array-cell.swapping { 
          border-color: #ff0055; 
          background: radial-gradient(circle at 35% 35%, rgba(255,0,85,0.25) 0%, rgba(0,0,0,0.5) 100%);
          animation: swap-shake 0.3s infinite alternate; 
          box-shadow: 0 0 25px rgba(255,0,85,0.4), inset 0 0 15px rgba(255,0,85,0.1);
        }
        .array-cell.active {
          border-color: #00f2ff;
          box-shadow: 0 0 15px rgba(0,242,255,0.3), inset 0 0 10px rgba(0,242,255,0.05);
        }
        @keyframes swap-shake { 0% { transform: scale(1.1) rotate(3deg); } 100% { transform: scale(1.1) rotate(-3deg); } }

        .cell-val { font-family: 'JetBrains Mono'; font-size: 14px; color: #fff; z-index: 2; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }
        .cell-idx { position: absolute; bottom: -22px; font-size: 8px; color: #555; font-family: 'Orbitron'; }
        .pointer-tag { position: absolute; top: -22px; left: 50%; transform: translateX(-50%); font-family: 'Orbitron'; font-size: 8px; color: #ff9d00; white-space: nowrap; animation: bounce-it 0.5s infinite alternate; }
        @keyframes bounce-it { from { transform: translateX(-50%) translateY(0); } to { transform: translateX(-50%) translateY(3px); } }

        /* ========== SCALAR SIDEBAR ========== */
        .scalar-sidebar { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); }
        .scalar-chip { display: flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; }
        .scalar-name { font-family: 'Orbitron'; font-size: 8px; color: #bc13fe; text-transform: uppercase; }
        .scalar-val { font-family: 'JetBrains Mono'; font-size: 12px; color: #00f2ff; }

        /* ========== LINEAR VIEWS: QUEUE / STACK ========== */
        .sequence-container { display: flex; gap: 10px; padding: 20px; background: rgba(255,255,255,0.02); border: 1px dashed #333; border-radius: 10px; }
        .queue-row { flex-direction: row; align-items: center; flex-wrap: wrap; justify-content: center; }
        .stack-column { flex-direction: column-reverse; align-items: center; min-width: 100px; }
        
        .seq-node { width: 60px; height: 40px; background: #111; border: 1px solid #bc13fe; border-radius: 4px; display: flex; align-items: center; justify-content: center; position: relative; animation: pop-in 0.3s forwards; }
        .node-val { font-family: 'JetBrains Mono'; font-size: 13px; color: #00f2ff; }
        .linear-tag { position: absolute; font-size: 8px; font-family: 'Orbitron'; color: #bc13fe; top: -15px; width: 100%; text-align: center; }
        .stack-column .linear-tag { left: 70px; top: 12px; text-align: left; }
        .empty-linear { font-family: 'Orbitron'; font-size: 10px; color: #333; padding: 20px; text-align: center; }

        /* ========== TREE VIEW ========== */
        .tree-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); gap: 25px; width: 100%; }
        .tree-node-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .tree-circle { width: 45px; height: 45px; border-radius: 50%; border: 2px solid #00f2ff; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-size: 14px; background: rgba(0,242,255,0.05); }
        .tree-id { font-size: 9px; color: #444; }

        /* ========== VARIABLE CARDS ========== */
        .variable-grid { display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; }
        .variable-node { min-width: 80px; padding: 12px 16px; background: rgba(188,19,254,0.03); border: 1px solid rgba(188,19,254,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; opacity: 0; }
        .variable-node.array-inline { min-width: 120px; }
        .variable-node.obj-card { min-width: 140px; }
        @keyframes pop-in { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .node-content { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .node-label { font-family: 'Orbitron'; font-size: 8px; color: #bc13fe; text-transform: uppercase; letter-spacing: 1px; }
        .node-value { font-family: 'JetBrains Mono'; font-size: 16px; color: #00f2ff; }

        /* Inline array inside variable card */
        .inline-arr { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; }
        .inline-arr-item { font-family: 'JetBrains Mono'; font-size: 11px; color: #00f2ff; padding: 2px 6px; background: rgba(0,242,255,0.05); border: 1px solid rgba(0,242,255,0.15); border-radius: 4px; }

        /* Object fields */
        .obj-fields { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; }
        .obj-field { font-size: 10px; color: #888; }
        .obj-key { color: #bc13fe; }
        .obj-val { color: #00f2ff; font-family: 'JetBrains Mono'; }

        /* ========== LOADING ========== */
        .neural-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
        .core-spinner { width: 60px; height: 60px; border: 2px solid rgba(0,242,255,0.1); border-top: 2px solid #00f2ff; border-radius: 50%; animation: spin 0.8s infinite linear; }
        .scanner-line { position: absolute; width: 100%; height: 2px; background: rgba(0,242,255,0.2); top: 0; animation: scan 2s infinite linear; box-shadow: 0 0 15px #00f2ff; }
        @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .glow-text { margin-top: 20px; font-family: 'Orbitron'; font-size: 10px; color: #00f2ff; letter-spacing: 2px; }

        /* ========== HUD ========== */
        .visual-hud { padding: 20px; background: #050508; border-top: 1px solid #111; }
        .narration-box { display: flex; gap: 20px; align-items: center; background: rgba(255,255,255,0.02); padding: 15px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); min-height: 70px; margin-bottom: 20px; }
        .narration-icon { color: #bc13fe; font-size: 20px; }
        .speaking { animation: pulse 1s infinite; color: #00f2ff; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        .narration-text { flex: 1; font-size: 13px; color: #bbb; line-height: 1.6; margin: 0; }
        
        .control-strip { display: flex; align-items: center; gap: 25px; }
        .playback-circle { width: 50px; height: 50px; border-radius: 50%; background: #bc13fe; border: none; color: white; cursor: pointer; transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(188,19,254,0.3); }
        .playback-circle:hover { transform: scale(1.1); background: #d01fff; box-shadow: 0 0 25px rgba(188,19,254,0.5); }
        .playback-circle:disabled { background: #222; opacity: 0.5; box-shadow: none; }
        
        .timeline-wrap { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .visual-scrubber { width: 100%; accent-color: #bc13fe; height: 4px; border-radius: 2px; outline: none; background: #1a1a1a; cursor: pointer; }
        .frame-data { font-family: 'Orbitron'; font-size: 9px; color: #444; letter-spacing: 1px; text-align: right; }

        .empty-state { text-align: center; }
        .clapper-icon { font-size: 50px; margin-bottom: 20px; opacity: 0.2; }
        .start-btn { margin-top: 25px; background: transparent; border: 1px solid #bc13fe; color: #bc13fe; font-family: 'Orbitron'; padding: 10px 20px; border-radius: 4px; cursor: pointer; transition: 0.3s; }
        .start-btn:hover { background: #bc13fe; color: #fff; box-shadow: 0 0 20px rgba(188,19,254,0.4); }
      `}</style>
    </div>
  );
};

export default VisualizeTab;