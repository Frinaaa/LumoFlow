import React, { useState } from 'react';
import { useAnalysisStore } from '../../editor/stores/analysisStore';
import VisualizeTab from './VisualizeTab';
import ExplanationTab from './ExplanationTab';
import InteractionTab from './InteractionTab';
import GamesTab from './GamesTab';
import { analysisPanelStyles } from './styles';

const AnalysisPanel: React.FC = () => {
    const { isVisible, data, isAnalyzing, togglePanel, setTraceFrames, setFrameIndex, setReplaying } = useAnalysisStore();
    const [activeTab, setActiveTab] = useState<'visualize' | 'explain' | 'interact' | 'games'>('visualize');

    // Handle replay visualization from sessionStorage
    React.useEffect(() => {
        const replayData = sessionStorage.getItem('replayVisualization');
        if (replayData) {
            try {
                const viz = JSON.parse(replayData);
                console.log('🎬 Replaying visualization:', viz.title);

                if (viz.frames && Array.isArray(viz.frames)) {
                    // This sets isVisible: true in the store!
                    // And we set a flag so VisualizeTab doesn't overwrite these frames
                    setReplaying(true);
                    setTraceFrames(viz.frames, viz.type || 'UNIVERSAL');
                    setFrameIndex(0);
                    setActiveTab('visualize');
                }

                // Clear the trigger
                sessionStorage.removeItem('replayVisualization');
            } catch (err) {
                console.error('Failed to parse replay data:', err);
                sessionStorage.removeItem('replayVisualization');
                setReplaying(false);
            }
        } else {
            // Not replaying, ensure replay mode is off
            setReplaying(false);
        }
    }, [setTraceFrames, setFrameIndex, setActiveTab, setReplaying]);

    if (!isVisible) return null;

    return (
        <>
            <style>{analysisPanelStyles}</style>
            <div className="analysis-panel-wrapper" style={{ width: '400px', borderLeft: '1px solid #333' }}>
                {/* Header */}
                <div
                    style={{
                        height: '35px',
                        borderBottom: '1px solid #333',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 12px',
                        background: '#252526',
                        color: '#ccc',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-microchip" style={{ color: '#00f2ff', fontSize: '14px' }}></i>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>LUMO ANALYSIS</span>
                    </div>
                    <i
                        className="fa-solid fa-xmark"
                        onClick={togglePanel}
                        style={{
                            cursor: 'pointer',
                            color: '#888',
                            fontSize: '14px',
                            transition: 'color 0.2s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
                        onMouseOut={(e) => (e.currentTarget.style.color = '#888')}
                    ></i>
                </div>

                {/* Tabs */}
                <div className="analysis-panel-tabs">
                    <button
                        className={`analysis-tab-btn ${activeTab === 'visualize' ? 'active' : ''}`}
                        onClick={() => setActiveTab('visualize')}
                    >
                        <i className="fa-solid fa-diagram-project"></i> Visualize
                    </button>
                    <button
                        className={`analysis-tab-btn ${activeTab === 'explain' ? 'active' : ''}`}
                        onClick={() => setActiveTab('explain')}
                    >
                        <i className="fa-solid fa-file-lines"></i> Explain
                    </button>
                    <button
                        className={`analysis-tab-btn ${activeTab === 'interact' ? 'active' : ''}`}
                        onClick={() => setActiveTab('interact')}
                    >
                        <i className="fa-solid fa-hand-pointer"></i> Interact
                    </button>
                    <button
                        className={`analysis-tab-btn ${activeTab === 'games' ? 'active' : ''}`}
                        onClick={() => setActiveTab('games')}
                    >
                        <i className="fa-solid fa-gamepad"></i> Games
                    </button>
                </div>

                {/* Content */}
                <div className="analysis-panel-content" style={{ background: '#1e1e1e', minHeight: '200px' }}>
                    {activeTab === 'visualize' && <VisualizeTab />}
                    {activeTab === 'explain' && <ExplanationTab />}
                    {activeTab === 'interact' && (
                        data ? (
                            <InteractionTab analysisData={data} />
                        ) : (
                            <div
                                style={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '16px',
                                    color: '#666',
                                    textAlign: 'center',
                                    padding: '20px'
                                }}
                            >
                                <i className="fa-solid fa-bolt" style={{ fontSize: '32px', opacity: 0.2 }}></i>
                                <div>
                                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>No Data Available</div>
                                    <div style={{ fontSize: '12px' }}>Run the code or trigger analysis to see results</div>
                                </div>
                            </div>
                        )
                    )}
                    {activeTab === 'games' && <GamesTab />}
                </div>
            </div>
        </>
    );
};

export default AnalysisPanel;
