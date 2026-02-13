import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAnalysisStore, TraceFrame } from '../../editor/stores/analysisStore';
import { useEditorStore } from '../../editor/stores/editorStore';
import { useUserStore } from '../../stores/userStore';
import { copilotService } from '../../services/CopilotService';

const VisualizeTab: React.FC = () => {
  // --- STORES ---
  const { traceFrames, currentFrameIndex, setFrameIndex, setTraceFrames, isPlaying, isReplaying } = useAnalysisStore();
  const editorStore = useEditorStore();
  const { tabs, activeTabId, outputData, debugData } = editorStore;
  const { user } = useUserStore();
  
  // --- STATE ---
  const [isAiSimulating, setIsAiSimulating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // 🟢 1. THE AI SIMULATOR (Adaptive Logic)
  const fetchAiSimulation = async (codeSnippet: string) => {
    if (!codeSnippet || codeSnippet.length < 10) return;

    setIsAiSimulating(true);
    let fullResponse = "";

    try {
      // We tell the AI to use Mode 2 (Visualization Engine) defined in our backend
      await copilotService.streamChat(
        `[GENERATE_VISUALS] Simulate this code and return ONLY the JSON array of TraceFrames. 
        Detect the variables used (like ${activeTab?.fileName}) and reflect them in the memory. 
        If it is a sort/search, include 'comparing' or 'swapping' arrays. \n\n${codeSnippet}`,
        (chunk) => { fullResponse += chunk; },
        () => {
          try {
            // Extract the JSON array from the potential markdown response
            const jsonStart = fullResponse.indexOf('[');
            const jsonEnd = fullResponse.lastIndexOf(']') + 1;
            const jsonStr = fullResponse.substring(jsonStart, jsonEnd);
            
            if (jsonStr) {
              const frames = JSON.parse(jsonStr);
              setTraceFrames(frames, 'UNIVERSAL');
            }
          } catch (e) {
            console.error("AI Visualization Parse Error");
          } finally {
            setIsAiSimulating(false);
          }
        }
      );
    } catch (err) {
      console.error("AI Connection Failed");
      setIsAiSimulating(false);
    }
  };

  // 🟢 2. REAL-TIME OBSERVER (Typing)
  useEffect(() => {
    if (isReplaying || !activeTab?.content) return;

    // Debounce: Wait 1.5 seconds after typing stops to re-simulate
    const timer = setTimeout(() => {
      fetchAiSimulation(activeTab.content);
    }, 1500);

    return () => clearTimeout(timer);
  }, [activeTab?.content, activeTabId]);

  // 🟢 3. EXECUTION SYNC (Run Button)
  useEffect(() => {
    const handleRefresh = (e: any) => {
      if (e.detail && e.detail.code) {
        fetchAiSimulation(e.detail.code);
      }
    };
    window.addEventListener('refresh-ai-visuals', handleRefresh);
    return () => window.removeEventListener('refresh-ai-visuals', handleRefresh);
  }, []);

  // 🟢 4. ADAPTIVE RENDERER
  const renderArrayVisualization = () => {
    const currentFrame = traceFrames[currentFrameIndex];
    if (!currentFrame || !currentFrame.memory) return null;

    // Dynamically find the array the AI simulated
    const arrayKey = Object.keys(currentFrame.memory).find(k => 
      Array.isArray(currentFrame.memory[k]) && 
      !['comparing', 'swapping', 'sorted'].includes(k)
    );

    if (!arrayKey) return null;

    const array = currentFrame.memory[arrayKey];
    const comparing = currentFrame.memory.comparing || [];
    const swapping = currentFrame.memory.swapping || [];

    return (
      <div className="array-visualization bubble-theme">
        <div className="bubble-container">
          {array.map((val: any, idx: number) => {
            const isComparing = comparing.includes(idx);
            const isSwapping = swapping.includes(idx);
            return (
              <div key={idx} className="bubble-wrapper">
                <div className={`bubble ${isComparing ? 'bubble-comparing' : ''} ${isSwapping ? 'bubble-swapping' : ''}`}>
                  <span className="bubble-value">{val}</span>
                </div>
                <div className="bubble-index">#{idx}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- AUDIO LOGIC ---
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
  };

  const speakDescription = (text: string, shouldAutoAdvance: boolean = false) => {
    if ('speechSynthesis' in window && soundEnabled) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (shouldAutoAdvance && isAutoPlaying && currentFrameIndex < traceFrames.length - 1) {
          setFrameIndex(prev => prev + 1);
        }
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePlayPause = () => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      stopSpeaking();
    } else {
      setIsAutoPlaying(true);
      if (traceFrames[currentFrameIndex]?.desc) speakDescription(traceFrames[currentFrameIndex].desc, true);
    }
  };

  const handleSaveVisualization = async () => {
     // ... (Keep your existing save logic here)
  };

  const currentFrame = traceFrames[currentFrameIndex];

  return (
    <div className="universal-viz">
      {/* 🟢 AI LOADING OVERLAY */}
      {isAiSimulating && (
        <div className="ai-overlay" style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 100, display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="spinner-neon"></div>
            <p style={{ color: '#bc13fe', marginTop: 10, fontFamily: 'Orbitron', fontSize: '10px' }}>
                LUMO AI SIMULATING EXECUTION...
            </p>
        </div>
      )}

      {/* Header */}
      <div className="hud-header">
        <div className="viz-banner">
          <i className="fa-solid fa-wand-magic-sparkles"></i>
          <span>{traceFrames.length > 0 ? "LIVE SIMULATION" : "READY"}</span>
        </div>
        <div className="step">STEP {currentFrameIndex + 1} / {traceFrames.length}</div>
      </div>

      {renderArrayVisualization()}

      {/* Dynamic Memory Grid */}
      <div className="memory-grid">
        {currentFrame && Object.entries(currentFrame.memory)
          .filter(([key]) => !Array.isArray(currentFrame.memory[key]) && !['comparing', 'swapping', 'sorted'].includes(key))
          .map(([key, value]) => (
            <div key={key} className={`widget ${currentFrame.activeVariable === key ? 'active' : ''}`}>
              <div className="widget-label">{key}</div>
              <div className="val-viz">{String(value)}</div>
            </div>
          ))}
      </div>

      <div className="explanation-hud">
        <i className={`fa-solid ${currentFrame?.action === 'WRITE' ? 'fa-pen-nib' : 'fa-eye'}`}></i>
        <span>{currentFrame?.desc || "Analyzing code logic..."}</span>
      </div>

      <div className="viz-footer">
        <div className="control-panel">
          <button onClick={handlePlayPause} className="play-pause-btn">
            <i className={`fa-solid ${isAutoPlaying ? 'fa-pause' : 'fa-play'}`}></i>
          </button>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="sound-toggle-btn">
             <i className={`fa-solid ${soundEnabled ? 'fa-volume-up' : 'fa-volume-xmark'}`}></i>
          </button>
        </div>
        
        <div className="progress-bar-container">
          <div className="progress-bar interactive" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              setFrameIndex(Math.floor(percent * traceFrames.length));
          }}>
            <div className="progress-fill" style={{ width: `${((currentFrameIndex + 1) / traceFrames.length) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <style>{`
        .spinner-neon { width: 30px; height: 30px; border: 2px solid #222; border-top: 2px solid #bc13fe; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        /* Include the rest of your CSS here */
      `}</style>
    </div>
  );
};

export default VisualizeTab;