import React, { useState } from 'react';
import { useAnalysisStore, useVisualStore } from '../../editor/stores';
import VisualizeTab from './VisualizeTab';
import ExplanationTab from './ExplanationTab';
import InteractionTab from './InteractionTab';
import GamesTab from './GamesTab';
import VirtualDebuggerTab from './VirtualDebuggerTab';
import { useEditorStore } from '../../editor/stores/editorStore';
import { analysisPanelStyles } from './styles';

const AnalysisPanel: React.FC = () => {
    // Analysis Store (Static Logic)
    const isVisible = useAnalysisStore(state => state.isVisible);
    const data = useAnalysisStore(state => state.data);
    const isAnalyzing = useAnalysisStore(state => state.isAnalyzing);
    const togglePanel = useAnalysisStore(state => state.togglePanel);
    const panelWidth = useAnalysisStore(state => state.panelWidth);
    const storeTabId = useAnalysisStore(state => state.activeTabId);
    const openTab = useAnalysisStore(state => state.openTab);

    // Visual Store (Runtime Logic Theater)
    const setTraceFrames = useVisualStore(state => state.setTraceFrames);
    const setFrameIndex = useVisualStore(state => state.setFrameIndex);
    const setReplaying = useVisualStore(state => state.setReplaying);

    const staticProblems = useEditorStore(state => state.staticProblems);
    const activeTabId = useEditorStore(state => state.activeTabId);
    const tabs = useEditorStore(state => state.tabs);

    // Only show Debug tab if there are actual ERRORS (not warnings)
    const activeFileData = tabs.find(t => t.id === activeTabId);
    const hasActiveErrors = staticProblems.filter(p => (!activeFileData || p.source === activeFileData.fileName) && p.type === 'error').length > 0;
    const hasAnyErrors = staticProblems.filter(p => p.type === 'error').length > 0;

    const activeTab = (hasAnyErrors && storeTabId === 'debug') ? 'debug' : storeTabId;
    const setActiveTab = (tab: any) => openTab(tab);

    // Switch away from debug tab if ALL errors are cleared
    React.useEffect(() => {
        if (!hasAnyErrors && activeTab === 'debug') {
            setActiveTab('visualize');
        }
    }, [hasAnyErrors, activeTab]);

    // Handle replay visualization from sessionStorage
    React.useEffect(() => {
        const replayData = sessionStorage.getItem('replayVisualization');
        if (replayData) {
            try {
                const viz = JSON.parse(replayData);
                console.log('🎬 Replaying visualization:', viz.title);

                if (viz.frames && Array.isArray(viz.frames)) {
                    // This sets isVisible: true in the store!
                    setReplaying(true);
                    setTraceFrames(viz.frames, viz.type || 'UNIVERSAL');
                    setFrameIndex(0);
                    setActiveTab('visualize');
                    useAnalysisStore.getState().showPanel(true);
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
            // We set it to false if there's no replay data as a safeguard
            // But be careful: clearVisuals also resets this
        }
    }, [setTraceFrames, setFrameIndex, setActiveTab, setReplaying]);

    if (!isVisible) return null;

    return (
        <>
            <style>{analysisPanelStyles}</style>
            <div
                className="analysis-panel-wrapper"
                style={{
                    width: `${panelWidth}px`,
                    borderLeft: '1px solid #333',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                }}
            >
                {/* AI Analysis Overlay (Hidden in VisualizeTab to avoid double-loading) */}
                {isAnalyzing && storeTabId !== 'visualize' && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div className="spinner-neon"></div>
                        <div style={{ color: '#00f2ff', marginTop: '15px', fontWeight: 'bold', fontSize: '12px' }}>LUMO AI ANALYZING...</div>
                        <div style={{ color: '#888', marginTop: '8px', fontSize: '10px' }}>Understanding your code journey...</div>
                    </div>
                )}

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
                    {hasAnyErrors && (
                        <button
                            className={`analysis-tab-btn ${activeTab === 'debug' ? 'active' : ''}`}
                            onClick={() => setActiveTab('debug')}
                            style={{
                                borderColor: '#f14c4c',
                                color: activeTab === 'debug' ? '#000' : '#f14c4c',
                                background: activeTab === 'debug' ? '#f14c4c' : 'transparent',
                                border: '1px solid #f14c4c',
                                animation: (hasActiveErrors && activeTab !== 'debug') ? 'pulse 2s infinite' : 'none'
                            }}
                        >
                            <i className="fa-solid fa-bug-slash"></i> Debug
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="analysis-panel-content" style={{ background: '#1e1e1e', minHeight: '200px' }}>
                    {activeTab === 'visualize' && <VisualizeTab />}
                    {activeTab === 'explain' && <ExplanationTab />}
                    {activeTab === 'interact' && (
                        <InteractionTab analysisData={data || {}} />
                    )}
                    {activeTab === 'games' && <GamesTab />}
                    {activeTab === 'debug' && <VirtualDebuggerTab />}
                </div>
            </div>
        </>
    );
};

export default AnalysisPanel;
