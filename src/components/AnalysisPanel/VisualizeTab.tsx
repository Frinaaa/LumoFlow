import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useVisualStore } from '../../editor/stores/visualStore';
import { useEditorStore } from '../../editor/stores/editorStore';
import { useUserStore } from '../../stores/userStore';
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
  const { user } = useUserStore();
  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);

  const [timeLeft, setTimeLeft] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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

  const handleSave = useCallback(async () => {
    if (!traceFrames.length || !activeTab || !user?._id) return;
    setSaveState('saving');
    try {
      const title = activeTab.fileName.replace(/\.[^.]+$/, '') || 'Untitled';
      const result = await (window as any).api.saveVisualization({
        userId: user._id,
        title,
        visualType: visualMode || 'UNIVERSAL',
        codeSnippet: activeTab.content,
        traceFrames: traceFrames,
      });
      setSaveState(result.success ? 'saved' : 'error');
    } catch {
      setSaveState('error');
    }
    setTimeout(() => setSaveState('idle'), 2500);
  }, [traceFrames, activeTab, user, visualMode]);

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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {traceFrames.length > 0 && !isReplaying && (
              <>
                <button
                  className="save-viz-btn"
                  onClick={handleSave}
                  disabled={saveState === 'saving'}
                  title="Save this visualization"
                >
                  {saveState === 'saving' && <i className="fa-solid fa-spinner fa-spin"></i>}
                  {saveState === 'saved' && <i className="fa-solid fa-check"></i>}
                  {saveState === 'error' && <i className="fa-solid fa-xmark"></i>}
                  {saveState === 'idle' && <i className="fa-solid fa-floppy-disk"></i>}
                  {saveState === 'saving' ? 'SAVING...' : saveState === 'saved' ? 'SAVED!' : saveState === 'error' ? 'FAILED' : 'SAVE'}
                </button>
                <button className="regen-btn" onClick={() => handleAnalyze(true)}>
                  <i className="fa-solid fa-bolt"></i> RE-TRACE
                </button>
              </>
            )}
          </div>
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

        .save-viz-btn {
          display: flex; align-items: center; gap: 6px;
          background: transparent; border: 1px solid #00ff88; color: #00ff88;
          font-family: 'Orbitron'; font-size: 9px; letter-spacing: 1.5px;
          padding: 6px 14px; border-radius: 4px; cursor: pointer;
          transition: all 0.3s ease;
        }
        .save-viz-btn:hover:not(:disabled) { background: rgba(0,255,136,0.12); box-shadow: 0 0 18px rgba(0,255,136,0.35); transform: translateY(-1px); }
        .save-viz-btn:disabled { opacity: 0.6; cursor: not-allowed; }

      `}</style>
    </div>
  );
};

export default VisualizeTab;