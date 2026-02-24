import React, { useState, useEffect, useRef } from 'react';
import { TraceFrame } from '../../editor/stores/visualStore';
import LogicStructure from '../AnalysisPanel/LogicStructure';

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
    const [frameIndex, setFrameIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const frames = viz.frames || [];

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setFrameIndex(0);
            setIsPlaying(true);
        }
        return () => {
            window.speechSynthesis?.cancel();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isOpen, viz]);

    // Auto-play logic
    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!isPlaying || frames.length === 0 || isSpeaking) return;

        const currentFrame = frames[frameIndex];
        if (soundEnabled && currentFrame) {
            speakDescription(currentFrame.desc);
            return; // speech will advance the frame on end
        }

        timerRef.current = setInterval(() => {
            setFrameIndex(prev => {
                if (prev < frames.length - 1) return prev + 1;
                setIsPlaying(false);
                return prev;
            });
        }, 1800);

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isPlaying, frameIndex, isSpeaking, soundEnabled, frames]);

    const speakDescription = (text: string) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            setTimeout(() => {
                setFrameIndex(prev => {
                    if (prev < frames.length - 1) return prev + 1;
                    setIsPlaying(false);
                    return prev;
                });
            }, 600);
        };
        window.speechSynthesis.speak(utterance);
    };

    const stepBack = () => {
        setIsPlaying(false);
        window.speechSynthesis?.cancel();
        setFrameIndex(p => Math.max(0, p - 1));
    };
    const stepForward = () => {
        setIsPlaying(false);
        window.speechSynthesis?.cancel();
        setFrameIndex(p => Math.min(frames.length - 1, p + 1));
    };
    const restart = () => {
        window.speechSynthesis?.cancel();
        setFrameIndex(0);
        setIsPlaying(true);
    };

    if (!isOpen || frames.length === 0) return null;

    const currentFrame = frames[frameIndex];
    const progress = ((frameIndex + 1) / frames.length) * 100;

    const typeIcon: Record<string, string> = {
        SORTING: 'fa-arrow-up-9-1',
        SEARCHING: 'fa-magnifying-glass',
        QUEUE_STACK: 'fa-layer-group',
        TREE: 'fa-diagram-project',
        UNIVERSAL: 'fa-brain',
    };

    return (
        <div className="vpm-overlay" onClick={onClose}>
            <div className="vpm-modal" onClick={e => e.stopPropagation()}>

                {/* HEADER */}
                <header className="vpm-header">
                    <div className="vpm-title-area">
                        <div className="vpm-brand">
                            <div className="vpm-brand-icon">
                                <i className="fa-solid fa-bolt"></i>
                            </div>
                            <span className="vpm-brand-name">LUMO<span>FLOW</span></span>
                        </div>
                        <div className="vpm-title-divider"></div>
                        <div>
                            <h2 className="vpm-title">{viz.title}</h2>
                            <div className="vpm-subtitle"><i className={`fa-solid ${typeIcon[viz.type] || 'fa-eye'}`} style={{ marginRight: '5px' }}></i>{viz.type} · {frames.length} frames</div>
                        </div>
                    </div>
                    <div className="vpm-header-actions">
                        <button
                            className={`vpm-icon-btn ${soundEnabled ? 'active' : ''}`}
                            onClick={() => setSoundEnabled(s => !s)}
                            title={soundEnabled ? 'Mute narration' : 'Enable narration'}
                        >
                            <i className={`fa-solid ${soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
                        </button>
                        <button className="vpm-close-btn" onClick={onClose}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </header>

                {/* BODY */}
                <div className="vpm-body">
                    {/* VISUALIZATION */}
                    <div className="vpm-viz-area">
                        <LogicStructure frame={currentFrame} />
                    </div>

                    {/* NARRATION BUBBLE */}
                    <div className="vpm-narration">
                        <div className="vpm-action-tag">{currentFrame.action}</div>
                        <p className="vpm-desc">{currentFrame.desc}</p>
                        {isSpeaking && (
                            <div className="vpm-speaking-indicator">
                                {[1, 2, 3, 4].map(i => <span key={i} style={{ animationDelay: `${i * 0.1}s` }}></span>)}
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER CONTROLS */}
                <footer className="vpm-footer">
                    {/* PROGRESS BAR */}
                    <div className="vpm-progress-track" onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = (e.clientX - rect.left) / rect.width;
                        setIsPlaying(false);
                        setFrameIndex(Math.round(pct * (frames.length - 1)));
                    }}>
                        <div className="vpm-progress-fill" style={{ width: `${progress}%` }}></div>
                        <div className="vpm-progress-thumb" style={{ left: `${progress}%` }}></div>
                    </div>

                    <div className="vpm-controls">
                        <button className="vpm-ctrl-btn" onClick={restart} title="Restart">
                            <i className="fa-solid fa-rotate-left"></i>
                        </button>
                        <button className="vpm-ctrl-btn" onClick={stepBack} disabled={frameIndex === 0}>
                            <i className="fa-solid fa-backward-step"></i>
                        </button>
                        <button className="vpm-play-btn" onClick={() => setIsPlaying(p => !p)}>
                            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                        </button>
                        <button className="vpm-ctrl-btn" onClick={stepForward} disabled={frameIndex === frames.length - 1}>
                            <i className="fa-solid fa-forward-step"></i>
                        </button>
                        <div className="vpm-step-counter">
                            {frameIndex + 1} <span>/ {frames.length}</span>
                        </div>
                    </div>
                </footer>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

                .vpm-overlay {
                    position: fixed; inset: 0;
                    background: rgba(0,0,0,0.88);
                    backdrop-filter: blur(18px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 10000; padding: 20px;
                    animation: vpmFadeIn 0.35s ease;
                }
                @keyframes vpmFadeIn { from { opacity: 0; } to { opacity: 1; } }

                .vpm-modal {
                    width: 100%; max-width: 1100px; height: 88vh;
                    background: #080810;
                    border: 1px solid rgba(188,19,254,0.35);
                    border-radius: 22px; overflow: hidden;
                    box-shadow: 0 0 80px rgba(188,19,254,0.2), 0 0 200px rgba(0,242,255,0.05);
                    display: flex; flex-direction: column;
                    animation: vpmSlideUp 0.4s cubic-bezier(0.19,1,0.22,1);
                }
                @keyframes vpmSlideUp { from { transform: translateY(40px) scale(0.97); } to { transform: translateY(0) scale(1); } }

                /* HEADER */
                .vpm-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 20px 32px;
                    background: linear-gradient(to right, rgba(188,19,254,0.08), rgba(0,242,255,0.04));
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    flex-shrink: 0;
                }
                .vpm-title-area { display: flex; align-items: center; gap: 18px; }
                .vpm-brand { display: flex; align-items: center; gap: 10px; }
                .vpm-brand-icon {
                    width: 40px; height: 40px; border-radius: 50%;
                    background: rgba(0, 242, 255, 0.08);
                    border: 1.5px solid rgba(0, 242, 255, 0.35);
                    display: flex; align-items: center; justify-content: center;
                    color: #00f2ff; font-size: 16px;
                    box-shadow: 0 0 14px rgba(0, 242, 255, 0.25);
                }
                .vpm-brand-name {
                    font-family: 'Orbitron', sans-serif; font-weight: 800;
                    font-size: 15px; color: #fff; letter-spacing: 1px;
                }
                .vpm-brand-name span { color: #00f2ff; }
                .vpm-title-divider {
                    width: 1px; height: 36px;
                    background: rgba(255,255,255,0.1);
                    flex-shrink: 0;
                }
                .vpm-title {
                    margin: 0; font-size: 1.2rem; color: #fff;
                    font-family: 'Orbitron', sans-serif; letter-spacing: 1px;
                }
                .vpm-subtitle { font-size: 11px; color: #555; margin-top: 3px; font-family: 'Orbitron'; letter-spacing: 1px; }
                .vpm-header-actions { display: flex; gap: 12px; align-items: center; }
                .vpm-icon-btn {
                    width: 40px; height: 40px; border-radius: 50%;
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
                    color: #666; cursor: pointer; transition: all 0.25s;
                    display: flex; align-items: center; justify-content: center; font-size: 14px;
                }
                .vpm-icon-btn:hover, .vpm-icon-btn.active { background: rgba(188,19,254,0.2); color: #bc13fe; border-color: rgba(188,19,254,0.4); }
                .vpm-close-btn {
                    width: 40px; height: 40px; border-radius: 50%;
                    background: rgba(255,50,50,0.08); border: 1px solid rgba(255,50,50,0.2);
                    color: #ff4444; cursor: pointer; transition: all 0.25s;
                    display: flex; align-items: center; justify-content: center; font-size: 16px;
                }
                .vpm-close-btn:hover { background: rgba(255,50,50,0.2); }

                /* BODY */
                .vpm-body {
                    flex: 1; overflow-y: auto; overflow-x: hidden;
                    display: flex; flex-direction: column; gap: 20px;
                    padding: 24px 32px;
                    background: radial-gradient(circle at 50% 30%, rgba(188,19,254,0.04) 0%, transparent 70%);
                    scrollbar-width: thin; scrollbar-color: rgba(188,19,254,0.3) transparent;
                }
                .vpm-body::-webkit-scrollbar { width: 4px; }
                .vpm-body::-webkit-scrollbar-thumb { background: rgba(188,19,254,0.3); border-radius: 4px; }

                .vpm-viz-area {
                    flex: 1; min-height: 280px;
                    background: rgba(0,0,0,0.4);
                    border: 1px solid rgba(255,255,255,0.04);
                    border-radius: 16px; padding: 24px;
                    display: flex; align-items: center; justify-content: center;
                    overflow: auto;
                }

                /* NARRATION */
                .vpm-narration {
                    display: flex; align-items: center; gap: 18px;
                    background: linear-gradient(to right, rgba(188,19,254,0.1), rgba(0,242,255,0.04));
                    border: 1px solid rgba(188,19,254,0.2);
                    border-radius: 14px; padding: 18px 24px;
                    position: relative; overflow: hidden;
                }
                .vpm-narration::before {
                    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
                    width: 3px; background: #bc13fe;
                }
                .vpm-action-tag {
                    background: rgba(188,19,254,0.15); border: 1px solid rgba(188,19,254,0.4);
                    color: #bc13fe; padding: 5px 12px; border-radius: 6px;
                    font-size: 9px; font-weight: 900; letter-spacing: 2px;
                    font-family: 'Orbitron'; white-space: nowrap;
                    text-shadow: 0 0 10px rgba(188,19,254,0.5);
                }
                .vpm-desc { margin: 0; color: #ddd; font-size: 1rem; line-height: 1.6; flex: 1; }
                .vpm-speaking-indicator {
                    display: flex; gap: 3px; align-items: center; margin-left: 8px;
                }
                .vpm-speaking-indicator span {
                    width: 3px; border-radius: 3px; background: #bc13fe;
                    animation: vpmWave 0.8s ease-in-out infinite alternate;
                }
                .vpm-speaking-indicator span:nth-child(1) { height: 8px; }
                .vpm-speaking-indicator span:nth-child(2) { height: 14px; }
                .vpm-speaking-indicator span:nth-child(3) { height: 10px; }
                .vpm-speaking-indicator span:nth-child(4) { height: 6px; }
                @keyframes vpmWave { from { transform: scaleY(0.5); } to { transform: scaleY(1.5); } }

                /* FOOTER */
                .vpm-footer {
                    padding: 16px 32px 20px;
                    background: rgba(0,0,0,0.5);
                    border-top: 1px solid rgba(255,255,255,0.05);
                    flex-shrink: 0;
                }
                .vpm-progress-track {
                    height: 6px; background: rgba(255,255,255,0.06);
                    border-radius: 3px; margin-bottom: 16px;
                    position: relative; cursor: pointer; overflow: visible;
                }
                .vpm-progress-fill {
                    height: 100%; border-radius: 3px;
                    background: linear-gradient(to right, #bc13fe, #00f2ff);
                    transition: width 0.3s ease;
                    box-shadow: 0 0 10px rgba(188,19,254,0.6);
                }
                .vpm-progress-thumb {
                    position: absolute; top: 50%; transform: translate(-50%, -50%);
                    width: 14px; height: 14px; border-radius: 50%;
                    background: #fff; border: 2px solid #bc13fe;
                    box-shadow: 0 0 8px rgba(188,19,254,0.8);
                    transition: left 0.3s ease;
                }
                .vpm-controls {
                    display: flex; align-items: center; gap: 14px; justify-content: center;
                }
                .vpm-ctrl-btn {
                    width: 42px; height: 42px; border-radius: 50%;
                    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                    color: #aaa; cursor: pointer; transition: all 0.25s;
                    display: flex; align-items: center; justify-content: center; font-size: 14px;
                }
                .vpm-ctrl-btn:hover:not(:disabled) { background: rgba(188,19,254,0.2); color: #fff; transform: translateY(-2px); }
                .vpm-ctrl-btn:disabled { opacity: 0.3; cursor: not-allowed; }
                .vpm-play-btn {
                    width: 60px; height: 60px; border-radius: 50%;
                    background: linear-gradient(135deg, #bc13fe, #7010aa);
                    border: none; color: #fff; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
                    box-shadow: 0 8px 25px rgba(188,19,254,0.5);
                    transition: all 0.3s cubic-bezier(0.175,0.885,0.32,1.275);
                }
                .vpm-play-btn:hover { transform: scale(1.12); box-shadow: 0 12px 35px rgba(188,19,254,0.7); }
                .vpm-play-btn:active { transform: scale(0.95); }
                .vpm-step-counter {
                    font-family: 'Orbitron'; font-size: 1rem; color: #fff;
                    font-weight: bold; min-width: 70px; text-align: center;
                }
                .vpm-step-counter span { color: #444; font-size: 0.85rem; }
            `}</style>
        </div>
    );
};

export default VisualPlaybackModal;
