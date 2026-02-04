import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import './VisualsScreen.css';

interface SavedVisualization {
    id: string;
    title: string;
    type: string;
    code: string;
    date: Date;
}

import VisualPlaybackModal from '../components/Visualization/VisualPlaybackModal';

const VisualsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const [visualizations, setVisualizations] = useState<SavedVisualization[]>([]);
    const [loading, setLoading] = useState(true);

    // --- MODAL STATE ---
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);
    const [selectedVizData, setSelectedVizData] = useState<any>(null);

    useEffect(() => {
        fetchVisualizations();
    }, []);

    const fetchVisualizations = async () => {
        if (!user?._id) return;

        setLoading(true);
        try {
            const result = await (window as any).api.getAllVisualizations(user._id);
            if (result.success) {
                setVisualizations(result.visualizations || []);
            }
        } catch (err) {
            console.error('Failed to fetch visualizations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVisualizationClick = async (vizId: string) => {
        if (!user?._id) return;

        try {
            console.log('🎬 Playing visualization in-place:', vizId);

            // Fetch the full visualization data including trace frames
            const result = await (window as any).api.getVisualization({
                userId: user._id,
                visualizationId: vizId
            });

            if (result.success && result.visualization) {
                const viz = result.visualization;

                // Set data and open modal
                setSelectedVizData({
                    title: viz.title,
                    code: viz.code,
                    frames: viz.frames,
                    type: viz.type
                });
                setIsPlayerOpen(true);
            } else {
                alert('Failed to load visualization: ' + (result.msg || 'Unknown error'));
            }
        } catch (err) {
            console.error('Failed to load visualization:', err);
            alert('Error loading visualization');
        }
    };

    const handleDelete = async (vizId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!user?._id) return;

        if (window.confirm('Delete this visualization?')) {
            const result = await (window as any).api.deleteVisualization({ userId: user._id, visualizationId: vizId });
            if (result.success) {
                // Refresh list
                fetchVisualizations();
            }
        }
    };

    return (
        <div className="visuals-screen">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="logo-icon"><i className="fa-solid fa-bolt"></i></div>
                    <h2>LUMO<span>FLOW</span></h2>
                </div>

                <nav>
                    <button className="nav-item" onClick={() => navigate('/dashboard')}>
                        <i className="fa-solid fa-chart-line"></i> Dashboard
                    </button>
                    <button className="nav-item" onClick={() => navigate('/games', { state: { from: '/visuals' } })}>
                        <i className="fa-solid fa-gamepad"></i> Arcade
                    </button>
                    <button className="nav-item" onClick={() => navigate('/editor')}>
                        <i className="fa-solid fa-terminal"></i> Code Editor
                    </button>
                    <button className="nav-item active">
                        <i className="fa-solid fa-eye"></i> Visuals
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item" onClick={() => {
                        sessionStorage.setItem('settingsReferrer', '/visuals');
                        navigate('/settings');
                    }}>
                        <i className="fa-solid fa-gear"></i> Settings
                    </button>
                    <button className="nav-item logout" onClick={() => {
                        navigate('/');
                    }}>
                        <i className="fa-solid fa-right-from-bracket"></i> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="visuals-header">
                    <div>
                        <h1>Saved <span style={{ color: '#bc13fe' }}>Visualizations</span></h1>
                        <p>Replay your algorithm visualizations anytime</p>
                    </div>
                    <button className="refresh-btn" onClick={fetchVisualizations}>
                        <i className="fa-solid fa-rotate-right"></i> Refresh
                    </button>
                </header>

                <section className="visuals-grid">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading visualizations...</p>
                        </div>
                    ) : visualizations.length === 0 ? (
                        <div className="empty-state">
                            <i className="fa-solid fa-eye-slash"></i>
                            <h3>No Saved Visualizations</h3>
                            <p>Go to the Code Editor and run a visualization to save it here!</p>
                            <button className="cta-btn" onClick={() => navigate('/editor')}>
                                <i className="fa-solid fa-terminal"></i> Open Editor
                            </button>
                        </div>
                    ) : (
                        visualizations.map((viz) => {
                            // Determine if it's a visual type (has animations)
                            const isVisualType = viz.type !== 'UNIVERSAL';

                            return (
                                <div
                                    key={viz.id}
                                    className="viz-card"
                                    onClick={() => handleVisualizationClick(viz.id)}
                                >
                                    <div className="viz-card-header">
                                        <div className="viz-type-badge">{viz.type}</div>
                                        <button
                                            className="delete-btn"
                                            onClick={(e) => handleDelete(viz.id, e)}
                                            title="Delete"
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </div>

                                    <h3>{viz.title}</h3>

                                    {/* Visual indicator for animation-based visualizations */}
                                    {isVisualType && (
                                        <div className="viz-animation-preview">
                                            <div className="preview-bars">
                                                {[40, 70, 50, 90, 30].map((height, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="preview-bar"
                                                        style={{
                                                            height: `${height}%`,
                                                            animationDelay: `${idx * 0.1}s`
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="preview-label">
                                                <i className="fa-solid fa-play-circle"></i>
                                                Animated Visualization
                                            </div>
                                        </div>
                                    )}

                                    {/* Code preview for all types */}
                                    <div className="viz-code-preview">
                                        <div className="code-header">
                                            <i className="fa-solid fa-code"></i>
                                            <span>Code Preview</span>
                                        </div>
                                        <pre><code>{viz.code}</code></pre>
                                    </div>

                                    <div className="viz-card-footer">
                                        <span className="viz-date">
                                            <i className="fa-regular fa-clock"></i>
                                            {new Date(viz.date).toLocaleDateString()}
                                        </span>
                                        <span className="play-indicator">
                                            <i className="fa-solid fa-play"></i> Replay
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </section>
            </main>

            {/* In-page Replay Modal */}
            {selectedVizData && (
                <VisualPlaybackModal
                    isOpen={isPlayerOpen}
                    onClose={() => setIsPlayerOpen(false)}
                    viz={selectedVizData}
                />
            )}
        </div>
    );
};

export default VisualsScreen;
