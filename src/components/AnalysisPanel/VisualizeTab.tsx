import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAnalysisStore } from '../../editor/stores/analysisStore';
import { useEditorStore } from '../../editor/stores/editorStore';
import { copilotService } from '../../services/CopilotService';
import { useUserStore } from '../../stores/userStore';

const VisualizeTab: React.FC = () => {
  const {
    traceFrames, currentFrameIndex, setFrameIndex, setTraceFrames,
    isAnalyzing, fetchAiSimulation, currentVisualFilePath
  } = useAnalysisStore();


  const { tabs, activeTabId } = useEditorStore();
  const { user } = useUserStore();

  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);

  // 🟢 STALE CHECK: Ensure visuals match current file
  const isStale = useMemo(() => {
    if (!activeTab || !traceFrames.length) return true;
    if (currentVisualFilePath && currentVisualFilePath !== activeTab.filePath) return true;
    return false;
  }, [activeTab, traceFrames, currentVisualFilePath]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // 🟢 MANUAL TRIGGER: Clear stage on switch
  const previousTabIdRef = useRef(activeTabId);
  useEffect(() => {
    if (activeTabId !== previousTabIdRef.current) {
      setTraceFrames([]);
      previousTabIdRef.current = activeTabId;
    }
  }, [activeTabId]);

  // 🟢 2. FEMALE VOICE & PLAYBACK SYNC
  const speak = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google US English')));
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // Auto-move to next frame if PLAY is active
      if (isPlaying && currentFrameIndex < traceFrames.length - 1) {
        setTimeout(() => setFrameIndex(currentFrameIndex + 1), 600);
      } else {
        setIsPlaying(false);
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (isPlaying && traceFrames[currentFrameIndex]?.desc) {
      speak(traceFrames[currentFrameIndex].desc);
    }
  }, [currentFrameIndex, isPlaying]);

  // 🟢 3. 3D RENDERER (Spheres and Depth Cards)
  const render3DStage = () => {
    // 🟢 If we have data, SHOW THE DATA (ignore isAnalyzing)
    if (traceFrames.length > 0) {
      const frame = traceFrames[currentFrameIndex];
      if (!frame) return null;

      // AI sometimes returns 'vars' instead of 'memory'
      const memory = frame.memory || (frame as any).vars || {};

      const arrayKey = Object.keys(memory).find(k => Array.isArray(memory[k]) && !['comparing', 'swapping'].includes(k));
      const arrayData = arrayKey ? memory[arrayKey] : null;
      const comparing = memory.comparing || [];
      const swapping = memory.swapping || [];

      // If no variables found, show a summary card of the frame
      const hasVars = Object.keys(memory).filter(k => !['comparing', 'swapping'].includes(k)).length > 0;

      return (
        <div className="theater-3d" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {arrayData ? (
            <div className="bubbles-row-3d">
              {arrayData.map((val: any, idx: number) => {
                const isComp = comparing.includes(idx);
                const isSwap = swapping.includes(idx);
                return (
                  <div key={idx} className={`bubble-3d ${isComp ? 'comp' : ''} ${isSwap ? 'swap' : ''}`}
                    style={{
                      background: isSwap ? 'radial-gradient(circle at 30% 30%, #ff0055, #660022)' : isComp ? 'radial-gradient(circle at 30% 30%, #ffaa00, #884400)' : 'radial-gradient(circle at 30% 30%, #bc13fe, #330055)',
                      transform: isSwap ? 'translateZ(60px) translateY(-20px) rotateY(15deg)' : isComp ? 'translateZ(30px) translateY(-10px)' : 'translateZ(0)'
                    }}
                  >
                    <div className="shine"></div>
                    <span>{String(val)}</span>
                  </div>
                );
              })}
            </div>
          ) : hasVars ? (
            <div className="vars-grid-3d">
              {Object.entries(memory).filter(([k]) => !['comparing', 'swapping'].includes(k)).map(([k, v]) => (
                <div key={k} className="card-3d">
                  <span className="label">{k}</span>
                  <strong className="val">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-3d" style={{ borderBottomColor: '#bc13fe' }}>
              <span className="label">ACTION</span>
              <strong className="val">Executing...</strong>
            </div>
          )}
        </div>
      );
    }

    // 🟢 Only if we have NO data, show the Loading Wand
    if (isAnalyzing) {
      return (
        <div className="theater-3d" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%',
          background: 'radial-gradient(ellipse at center, rgba(30, 10, 50, 0.6) 0%, rgba(0, 0, 0, 0) 70%)'
        }}>
          <div className="lumo-empty" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            <i className="fa-solid fa-wand-magic-sparkles fa-spin" style={{
              fontSize: '2.5rem',
              background: '-webkit-linear-gradient(#bc13fe, #00f2ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 10px rgba(188, 19, 254, 0.6))',
              marginBottom: '20px'
            }}></i>
            <p style={{
              marginTop: '15px',
              fontSize: '12px',
              color: '#00f2ff',
              letterSpacing: '2px',
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(0, 242, 255, 0.4)'
            }}>LUMO AI: SIMULATING LOGIC...</p>
          </div>
        </div>
      );
    }

    return <div className="lumo-empty">Ready to visualize.</div>;
  };

  return (
    <div className="lumo-visuals-wrapper">
      {/* 🟢 LOADING OVERLAY (Died from Store) */}
      {(isAnalyzing || isStale) && (
        <div className="ai-overlay">
          <div className="spinner-3d"></div>
          <p>{isStale ? "PREPARING NEW VISUALS..." : "LUMO AI: DIRECTING SCENE..."}</p>
        </div>
      )}

      <div className="cinema-header">
        <div className="cinema-title">LUMO <span className="highlight">VISUALS</span></div>
        {/* 🟢 FIX: Corrected Frame Counter logic */}
        <div className="cinema-stats">
          FRAME {traceFrames.length > 0 ? currentFrameIndex + 1 : 0} / {traceFrames.length}
        </div>
      </div>

      <div className="cinema-stage">
        {render3DStage()}
      </div>

      <div className="cinema-controls">
        <div className="narrator-hud">
          <i className={`fa-solid fa-microphone-lines ${isSpeaking ? 'active' : ''}`}></i>
          <p>{traceFrames[currentFrameIndex]?.desc || "Change code to see visuals..."}</p>
        </div>

        <div className="playback-bar">
          <button onClick={() => { setIsPlaying(!isPlaying); if (isPlaying) window.speechSynthesis.cancel(); }} className="play-btn">
            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
          </button>

          {/* 🟢 MOVABLE PROGRESS LINE (SCRUBBER) */}
          <input
            type="range" className="scrubber"
            min="0" max={Math.max(0, traceFrames.length - 1)}
            value={currentFrameIndex}
            onChange={(e) => {
              setIsPlaying(false);
              window.speechSynthesis.cancel();
              setFrameIndex(parseInt(e.target.value));
            }}
          />

          <button className="save-viz-icon" onClick={() => { }} title="Save Video Data"><i className="fa-solid fa-bookmark"></i></button>
        </div>
      </div>

      <style>{`
        .lumo-visuals-wrapper { height: 100%; display: flex; flex-direction: column; background: #050508; position: relative; color: white; font-family: 'Orbitron', sans-serif; overflow: hidden; }
        .cinema-header { display: flex; justify-content: space-between; padding: 15px 20px; border-bottom: 1px solid #1a1a1a; }
        .cinema-title { font-size: 14px; font-weight: 900; letter-spacing: 2px; }
        .highlight { color: #bc13fe; text-shadow: 0 0 10px #bc13fe; }
        .cinema-stats { font-size: 10px; color: #444; font-family: monospace; }
        
        .cinema-stage { flex: 1; display: flex; align-items: center; justify-content: center; perspective: 1000px; }
        .bubbles-row-3d { display: flex; gap: 20px; transform-style: preserve-3d; transform: rotateX(15deg); }
        .bubble-3d { 
            width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
            font-weight: bold; position: relative; transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 15px 35px rgba(0,0,0,0.5), inset -5px -5px 15px rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .bubble-3d.swap { animation: 3dBounce 0.6s infinite alternate; }
        .shine { position: absolute; top: 10%; left: 20%; width: 15px; height: 10px; background: rgba(255,255,255,0.2); border-radius: 50%; }

        .vars-grid-3d { display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; transform: rotateX(10deg); }
        .card-3d { background: #111; border: 1px solid #222; padding: 12px 20px; border-radius: 8px; box-shadow: 0 10px 20px rgba(0,0,0,0.4); border-bottom: 3px solid #00f2ff; }
        .label { display: block; font-size: 8px; color: #888; margin-bottom: 4px; }

        .cinema-controls { background: #0c0c0f; padding: 20px; border-top: 1px solid #1a1a1a; }
        .narrator-hud { display: flex; gap: 15px; align-items: center; margin-bottom: 20px; background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; min-height: 50px; border: 1px solid rgba(188,19,254,0.1); }
        .narrator-hud p { color: #aaa; margin: 0; font-size: 12px; font-family: 'Inter'; line-height: 1.5; }
        .fa-microphone-lines.active { color: #00f2ff; animation: pulse 1s infinite; }

        .playback-bar { display: flex; align-items: center; gap: 15px; }
        .play-btn { width: 45px; height: 45px; border-radius: 50%; border: none; background: #bc13fe; color: white; cursor: pointer; font-size: 18px; box-shadow: 0 0 15px rgba(188,19,254,0.4); }
        .scrubber { flex: 1; accent-color: #bc13fe; cursor: pointer; height: 4px; background: #222; border-radius: 2px; }
        .save-viz-icon { background: none; border: none; color: #444; cursor: pointer; font-size: 16px; transition: 0.3s; }
        .save-viz-icon:hover { color: #00f2ff; transform: scale(1.2); }

        .ai-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.9); z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .spinner-3d { width: 40px; height: 40px; border: 3px solid #222; border-top: 3px solid #bc13fe; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px; }
        
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes 3dBounce { from { transform: translateZ(60px) translateY(-20px); } to { transform: translateZ(80px) translateY(-30px); } }
      `}</style>
    </div>
  );
};

export default VisualizeTab;