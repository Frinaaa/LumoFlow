import React, { useState, useEffect, useRef } from 'react';
import { useAnalysisStore, TraceFrame } from '../../editor/stores/analysisStore';

interface VisualPlaybackModalProps {
    isOpen: boolean;
    onClose: () => void;
    viz: {
        title: string;
        code: string;
        frames: TraceFrame[];
        type: string;
    };
}

const VisualPlaybackModal: React.FC<VisualPlaybackModalProps> = ({ isOpen, onClose, viz }) => {
    const {
        traceFrames,
        currentFrameIndex,
        setFrameIndex,
        setTraceFrames,
        isReplaying,
        setReplaying
    } = useAnalysisStore();

    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize frames in store when modal opens
    useEffect(() => {
        if (isOpen && viz.frames) {
            setReplaying(true);
            setTraceFrames(viz.frames, viz.type as any);
            setFrameIndex(0);
            setIsAutoPlaying(true);
        }

        return () => {
            if (isOpen) {
                setReplaying(false);
                setIsAutoPlaying(false);
                window.speechSynthesis.cancel();
            }
        };
    }, [isOpen, viz]);

    // Playback logic
    useEffect(() => {
        if (!isAutoPlaying || traceFrames.length === 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        // Narrate the current frame
        const currentFrame = traceFrames[currentFrameIndex];
        if (currentFrame && soundEnabled && !isSpeaking) {
            speakDescription(currentFrame.desc);
        }

        // If not speaking, wait a bit and move to next
        if (!isSpeaking) {
            timerRef.current = setInterval(() => {
                setFrameIndex((prev: number) => {
                    if (prev < traceFrames.length - 1) return prev + 1;
                    setIsAutoPlaying(false);
                    return prev;
                });
            }, 3000); // 3 second delay if no speech or speech disabled
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isAutoPlaying, currentFrameIndex, isSpeaking, soundEnabled, traceFrames]);

    const speakDescription = (text: string) => {
        if ('speechSynthesis' in window && soundEnabled) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => {
                setIsSpeaking(false);
                // Auto advance after short delay
                setTimeout(() => {
                    if (isAutoPlaying) {
                        setFrameIndex((prev: number) => {
                            if (prev < traceFrames.length - 1) return prev + 1;
                            setIsAutoPlaying(false);
                            return prev;
                        });
                    }
                }, 1000);
            };
            window.speechSynthesis.speak(utterance);
        }
    };

    if (!isOpen) return null;

    const currentFrame = traceFrames[currentFrameIndex] || viz.frames[0];
    if (!currentFrame) return null;

    // Helper to render array visualization (simplified version of VisualizeTab)
    const renderBars = () => {
        const arrayKey = Object.keys(currentFrame.memory).find(k => Array.isArray(currentFrame.memory[k]));
        if (!arrayKey) return null;

        const array = currentFrame.memory[arrayKey];
        const comparing = currentFrame.memory.comparing || [];
        const swapping = currentFrame.memory.swapping || [];
        const sorted = currentFrame.memory.sorted || 0;

        return (
            <div className="playback-bars-container">
                {array.map((val: any, idx: number) => {
                    const isComparing = comparing.includes(idx);
                    const isSwapping = swapping.includes(idx);
                    const isSorted = typeof sorted === 'number' && idx >= array.length - sorted;

                    return (
                        <div
                            key={idx}
                            className={`playback-bar ${isComparing ? 'comparing' : ''} ${isSwapping ? 'swapping' : ''} ${isSorted ? 'sorted' : ''}`}
                            style={{ height: `${Math.min(Math.abs(Number(val)) * 8 || 20, 200)}px` }}
                        >
                            <span className="bar-value">{val}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="visual-playback-overlay" onClick={onClose}>
            <div className="visual-playback-content" onClick={e => e.stopPropagation()}>
                <header className="playback-header">
                    <div className="title-area">
                        <i className={`fa-solid ${viz.type === 'SORTING' ? 'fa-arrow-up-9-1' : 'fa-magnifying-glass'}`}></i>
                        <h2>{viz.title}</h2>
                    </div>
                    <div className="playback-actions">
                        <button onClick={() => setSoundEnabled(!soundEnabled)} className="icon-btn">
                            <i className={`fa-solid ${soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
                        </button>
                        <button onClick={onClose} className="close-btn">&times;</button>
                    </div>
                </header>

                <div className="playback-body">
                    <div className="visualization-area">
                        {renderBars()}

                        <div className="variables-hud">
                            {Object.entries(currentFrame.memory)
                                .filter(([k]) => !['comparing', 'swapping', 'sorted', 'activeVariable'].includes(k))
                                .map(([k, v]) => (
                                    <div key={k} className="var-item">
                                        <span className="var-key">{k}:</span>
                                        <span className="var-val">{JSON.stringify(v)}</span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="explanation-bubble">
                        <div className="action-tag">{currentFrame.action}</div>
                        <p>{currentFrame.desc}</p>
                    </div>
                </div>

                <footer className="playback-controls">
                    <div className="progress-bar-container">
                        <div
                            className="progress-fill"
                            style={{ width: `${((currentFrameIndex + 1) / traceFrames.length) * 100}%` }}
                        ></div>
                    </div>
                    <div className="control-buttons">
                        <button onClick={() => setFrameIndex(Math.max(0, currentFrameIndex - 1))} className="icon-btn">
                            <i className="fa-solid fa-backward-step"></i>
                        </button>
                        <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} className="play-btn">
                            <i className={`fa-solid ${isAutoPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                        </button>
                        <button onClick={() => setFrameIndex(Math.min(traceFrames.length - 1, currentFrameIndex + 1))} className="icon-btn">
                            <i className="fa-solid fa-forward-step"></i>
                        </button>
                    </div>
                    <div className="step-counter">
                        STEP {currentFrameIndex + 1} / {traceFrames.length}
                    </div>
                </footer>

                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

                    .visual-playback-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.9);
                        backdrop-filter: blur(15px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                        padding: 20px;
                        animation: modalFadeIn 0.4s cubic-bezier(0.23, 1, 0.32, 1);
                    }
                    @keyframes modalFadeIn { 
                        from { opacity: 0; backdrop-filter: blur(0); } 
                        to { opacity: 1; backdrop-filter: blur(15px); } 
                    }

                    .visual-playback-content {
                        width: 100%;
                        max-width: 1100px;
                        height: 85vh;
                        background: #0f0f13;
                        border: 1px solid rgba(188, 19, 254, 0.4);
                        border-radius: 24px;
                        overflow: hidden;
                        box-shadow: 0 0 80px rgba(188, 19, 254, 0.25), inset 0 0 20px rgba(0, 242, 255, 0.05);
                        display: flex;
                        flex-direction: column;
                        animation: contentSlideUp 0.5s cubic-bezier(0.19, 1, 0.22, 1);
                    }
                    @keyframes contentSlideUp { 
                        from { transform: translateY(40px) scale(0.95); } 
                        to { transform: translateY(0) scale(1); } 
                    }

                    .playback-header {
                        padding: 24px 40px;
                        background: linear-gradient(to right, rgba(188, 19, 254, 0.1), rgba(0, 242, 255, 0.05));
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    }
                    .title-area { display: flex; align-items: center; gap: 20px; }
                    .title-area i { 
                        background: rgba(188, 19, 254, 0.2);
                        color: #bc13fe; 
                        padding: 12px;
                        border-radius: 12px;
                        font-size: 1.6rem; 
                    }
                    .title-area h2 { 
                        margin: 0; 
                        font-size: 1.8rem; 
                        color: #fff; 
                        font-family: 'Orbitron', sans-serif;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                    }

                    .playback-actions { display: flex; gap: 20px; align-items: center; }
                    .icon-btn { 
                        background: rgba(255,255,255,0.05); 
                        border: 1px solid rgba(255,255,255,0.1); 
                        color: #ccc; 
                        width: 45px; height: 45px; border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        cursor: pointer; transition: all 0.3s ease; 
                    }
                    .icon-btn:hover { background: rgba(188, 19, 254, 0.2); color: #fff; transform: translateY(-3px); }

                    .playback-body { 
                        flex: 1;
                        padding: 40px; 
                        display: flex; 
                        flex-direction: column; 
                        gap: 40px; 
                        overflow-y: auto;
                        background-image: radial-gradient(circle at center, rgba(188, 19, 254, 0.05) 0%, transparent 70%);
                    }
                    
                    .visualization-area {
                        height: 350px;
                        background: rgba(0, 0, 0, 0.5);
                        border: 1px solid rgba(255,255,255,0.05);
                        border-radius: 20px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        padding: 30px;
                        box-shadow: inset 0 0 30px rgba(0,0,0,0.5);
                    }

                    .playback-bars-container {
                        display: flex;
                        align-items: flex-end;
                        justify-content: center;
                        gap: 15px;
                        width: 100%;
                        height: 250px;
                    }
                    .playback-bar {
                        flex: 1;
                        max-width: 50px;
                        background: linear-gradient(to top, #7010aa, #bc13fe);
                        border-radius: 8px 8px 2px 2px;
                        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                        display: flex;
                        align-items: flex-start;
                        justify-content: center;
                        padding-top: 10px;
                        position: relative;
                        box-shadow: 0 5px 20px rgba(188, 19, 254, 0.3);
                    }
                    .playback-bar.comparing { 
                        background: linear-gradient(to top, #0088cc, #00f2ff); 
                        transform: translateY(-10px) scaleX(1.1); 
                        box-shadow: 0 0 40px rgba(0, 242, 255, 0.6); 
                    }
                    .playback-bar.swapping { 
                        background: linear-gradient(to top, #cc0044, #ff0055); 
                        transform: translateY(-20px) scale(1.2); 
                        box-shadow: 0 0 50px rgba(255, 0, 85, 0.8); 
                        z-index: 10;
                    }
                    .playback-bar.sorted { 
                        background: linear-gradient(to top, #00cc66, #4ade80); 
                        opacity: 0.9;
                        box-shadow: 0 5px 15px rgba(74, 222, 128, 0.3);
                    }
                    .bar-value { 
                        color: #fff; 
                        font-size: 0.9rem; 
                        font-weight: bold; 
                        text-shadow: 0 2px 4px rgba(0,0,0,0.6);
                        font-family: 'Orbitron', sans-serif;
                    }

                    .variables-hud {
                        position: absolute;
                        top: 25px;
                        right: 25px;
                        background: rgba(15, 15, 20, 0.85);
                        padding: 20px;
                        border-radius: 16px;
                        border: 1px solid rgba(188, 19, 254, 0.3);
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        min-width: 200px;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    }
                    .var-item { font-size: 0.9rem; display: flex; justify-content: space-between; gap: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; }
                    .var-key { color: #bc13fe; font-weight: bold; font-family: 'Orbitron'; font-size: 0.7rem; text-transform: uppercase; }
                    .var-val { color: #00f2ff; font-weight: bold; font-family: monospace; }

                    .explanation-bubble {
                        background: linear-gradient(to right, rgba(188, 19, 254, 0.15), rgba(0, 242, 255, 0.05));
                        border: 1px solid rgba(188, 19, 254, 0.3);
                        padding: 30px 40px;
                        border-radius: 20px;
                        display: flex;
                        align-items: center;
                        gap: 30px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                        position: relative;
                        overflow: hidden;
                    }
                    .explanation-bubble::before {
                        content: '';
                        position: absolute;
                        top: 0; left: 0; width: 4px; height: 100%;
                        background: #bc13fe;
                    }
                    .action-tag {
                        background: rgba(188, 19, 254, 0.2);
                        border: 1px solid #bc13fe;
                        color: #bc13fe;
                        padding: 6px 14px;
                        border-radius: 8px;
                        font-size: 0.8rem;
                        font-weight: 900;
                        letter-spacing: 2px;
                        font-family: 'Orbitron';
                        text-shadow: 0 0 10px rgba(188, 19, 254, 0.5);
                    }
                    .explanation-bubble p { margin: 0; color: #fff; font-size: 1.3rem; line-height: 1.6; flex: 1; font-weight: 300; }

                    .playback-controls {
                        padding: 30px 50px;
                        background: rgba(0, 0, 0, 0.6);
                        display: flex;
                        align-items: center;
                        gap: 30px;
                        border-top: 1px solid rgba(255, 255, 255, 0.05);
                    }
                    .progress-bar-container {
                        flex: 1;
                        height: 10px;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 5px;
                        overflow: hidden;
                        position: relative;
                        box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
                    }
                    .progress-fill { 
                        height: 100%; 
                        background: linear-gradient(to right, #bc13fe, #00f2ff); 
                        transition: width 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); 
                        box-shadow: 0 0 15px rgba(188, 19, 254, 0.8);
                    }
                    .control-buttons { display: flex; align-items: center; gap: 20px; }
                    .play-btn {
                        width: 65px;
                        height: 65px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #bc13fe, #7010aa);
                        border: none;
                        color: #fff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.8rem;
                        cursor: pointer;
                        box-shadow: 0 10px 30px rgba(188, 19, 254, 0.5);
                        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }
                    .play-btn:hover { transform: scale(1.15) rotate(5deg); box-shadow: 0 15px 40px rgba(188, 19, 254, 0.7); }
                    .play-btn:active { transform: scale(0.95); }
                    
                    .step-counter { 
                        color: #888; 
                        font-size: 1.1rem; 
                        font-weight: 600; 
                        min-width: 150px; 
                        text-align: right; 
                        font-family: 'Orbitron';
                        letter-spacing: 2px;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default VisualPlaybackModal;
