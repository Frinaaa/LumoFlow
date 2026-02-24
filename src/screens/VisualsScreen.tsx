import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import VisualPlaybackModal from '../components/Visualization/VisualPlaybackModal';
import './VisualsScreen.css';

interface SavedVisualization {
    id: string;
    title: string;
    type: string;
    code: string;
    date: Date;
    frames?: any[];
}

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
    SORTING: { icon: 'fa-arrow-up-9-1', color: '#bc13fe', label: 'Sorting' },
    SEARCHING: { icon: 'fa-magnifying-glass', color: '#00f2ff', label: 'Searching' },
    QUEUE_STACK: { icon: 'fa-layer-group', color: '#ff9d00', label: 'Queue/Stack' },
    TREE: { icon: 'fa-diagram-project', color: '#00ff88', label: 'Tree' },
    UNIVERSAL: { icon: 'fa-brain', color: '#bc13fe', label: 'Universal' },
};

const VisualsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const [visualizations, setVisualizations] = useState<SavedVisualization[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);
    const [selectedVizData, setSelectedVizData] = useState<any>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => { fetchVisualizations(); }, []);

    const fetchVisualizations = async () => {
        if (!user?._id) return;
        setLoading(true);
        try {
            const result = await (window as any).api.getAllVisualizations(user._id);
            if (result.success) setVisualizations(result.visualizations || []);
        } catch (err) {
            console.error('Failed to fetch visualizations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePlay = async (vizId: string) => {
        if (!user?._id) return;
        try {
            const result = await (window as any).api.getVisualization({ userId: user._id, visualizationId: vizId });
            if (result.success && result.visualization) {
                const viz = result.visualization;
                setSelectedVizData({ title: viz.title, code: viz.code, frames: viz.frames, type: viz.type });
                setIsPlayerOpen(true);
            }
        } catch (err) {
            console.error('Failed to load visualization:', err);
        }
    };

    const handleDelete = async (vizId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user?._id || !window.confirm('Delete this visualization?')) return;
        setDeletingId(vizId);
        try {
            const result = await (window as any).api.deleteVisualization({ userId: user._id, visualizationId: vizId });
            if (result.success) setVisualizations(prev => prev.filter(v => v.id !== vizId));
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (d: Date) => {
        try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
        catch { return '—'; }
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
                    <button className="nav-item" onClick={() => { sessionStorage.setItem('settingsReferrer', '/visuals'); navigate('/settings'); }}>
                        <i className="fa-solid fa-gear"></i> Settings
                    </button>
                    <button className="nav-item logout" onClick={() => navigate('/')}>
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
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button className="refresh-btn" onClick={fetchVisualizations}>
                            <i className="fa-solid fa-rotate-right"></i> Refresh
                        </button>
                        <button className="cta-btn" onClick={() => navigate('/editor')} style={{ margin: 0 }}>
                            <i className="fa-solid fa-plus"></i> New Visual
                        </button>
                    </div>
                </header>

                {/* STATS BAR */}
                {!loading && visualizations.length > 0 && (
                    <div className="viz-stats-bar">
                        <div className="viz-stat">
                            <span className="viz-stat-num">{visualizations.length}</span>
                            <span className="viz-stat-label">Saved</span>
                        </div>
                        {Object.entries(
                            visualizations.reduce((acc, v) => { acc[v.type] = (acc[v.type] || 0) + 1; return acc; }, {} as Record<string, number>)
                        ).map(([type, count]) => (
                            <div key={type} className="viz-stat">
                                <span className="viz-stat-num" style={{ color: TYPE_META[type]?.color || '#bc13fe' }}>{count}</span>
                                <span className="viz-stat-label">{TYPE_META[type]?.label || type}</span>
                            </div>
                        ))}
                    </div>
                )}

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
                            <p>Generate a visualization in the Code Editor and click <strong>SAVE</strong> to store it here.</p>
                            <button className="cta-btn" onClick={() => navigate('/editor')}>
                                <i className="fa-solid fa-terminal"></i> Open Editor
                            </button>
                        </div>
                    ) : (
                        visualizations.map((viz) => {
                            const meta = TYPE_META[viz.type] || TYPE_META.UNIVERSAL;
                            const frameCount = viz.frames?.length || 0;
                            return (
                                <div
                                    key={viz.id}
                                    className="viz-card"
                                    onClick={() => handlePlay(viz.id)}
                                    style={{ '--card-color': meta.color } as React.CSSProperties}
                                >
                                    {/* Card glow accent */}
                                    <div className="viz-card-glow"></div>

                                    {/* Header row */}
                                    <div className="viz-card-header">
                                        <div className="viz-type-badge" style={{ color: meta.color, borderColor: `${meta.color}44`, background: `${meta.color}18` }}>
                                            <i className={`fa-solid ${meta.icon}`}></i>
                                            {meta.label}
                                        </div>
                                        <button
                                            className="delete-btn"
                                            onClick={(e) => handleDelete(viz.id, e)}
                                            disabled={deletingId === viz.id}
                                            title="Delete"
                                        >
                                            <i className={`fa-solid ${deletingId === viz.id ? 'fa-spinner fa-spin' : 'fa-trash'}`}></i>
                                        </button>
                                    </div>

                                    {/* Title */}
                                    <h3 className="viz-card-title">{viz.title}</h3>

                                    {/* Animated mini preview */}
                                    <div className="viz-mini-preview">
                                        <div className="mini-bars">
                                            {[55, 80, 40, 95, 65, 30, 75].map((h, i) => (
                                                <div
                                                    key={i}
                                                    className="mini-bar"
                                                    style={{
                                                        height: `${h}%`,
                                                        background: meta.color,
                                                        animationDelay: `${i * 0.12}s`,
                                                        opacity: 0.7 + (i % 3) * 0.1,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <div className="mini-play-overlay">
                                            <div className="mini-play-icon">
                                                <i className="fa-solid fa-play"></i>
                                            </div>
                                            <span>Play Visualization</span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="viz-card-footer">
                                        <span className="viz-meta-item">
                                            <i className="fa-regular fa-clock"></i>
                                            {formatDate(viz.date)}
                                        </span>
                                        {frameCount > 0 && (
                                            <span className="viz-meta-item" style={{ color: meta.color }}>
                                                <i className="fa-solid fa-film"></i>
                                                {frameCount} frames
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </section>
            </main>

            {/* Playback Modal */}
            {selectedVizData && (
                <VisualPlaybackModal
                    isOpen={isPlayerOpen}
                    onClose={() => { setIsPlayerOpen(false); setSelectedVizData(null); }}
                    viz={selectedVizData}
                />
            )}

            <style>{`
                .visuals-screen { display: flex; height: 100vh; background: #0a0a0f; color: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }

                /* STATS BAR */
                .viz-stats-bar {
                    display: flex; gap: 24px; align-items: center;
                    padding: 12px 40px; background: rgba(188,19,254,0.04);
                    border-bottom: 1px solid rgba(188,19,254,0.1);
                    flex-shrink: 0;
                }
                .viz-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
                .viz-stat-num { font-size: 1.4rem; font-weight: 800; color: #bc13fe; font-family: 'Orbitron', sans-serif; }
                .viz-stat-label { font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: 1px; }

                /* GRID */
                .visuals-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 24px; padding: 28px 40px; overflow-y: auto; flex: 1;
                    scrollbar-width: thin; scrollbar-color: rgba(188,19,254,0.3) transparent;
                }

                /* CARD */
                .viz-card {
                    background: #0d0d15; border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 18px; padding: 22px;
                    cursor: pointer; transition: all 0.3s ease;
                    position: relative; overflow: hidden;
                    display: flex; flex-direction: column; gap: 14px;
                }
                .viz-card:hover {
                    border-color: var(--card-color, #bc13fe);
                    transform: translateY(-4px);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.4), 0 0 30px color-mix(in srgb, var(--card-color, #bc13fe) 20%, transparent);
                }
                .viz-card-glow {
                    position: absolute; top: -60px; right: -60px;
                    width: 140px; height: 140px; border-radius: 50%;
                    background: radial-gradient(circle, color-mix(in srgb, var(--card-color, #bc13fe) 15%, transparent), transparent 70%);
                    pointer-events: none; transition: opacity 0.3s;
                    opacity: 0;
                }
                .viz-card:hover .viz-card-glow { opacity: 1; }

                .viz-card-header { display: flex; justify-content: space-between; align-items: center; }
                .viz-type-badge {
                    display: flex; align-items: center; gap: 6px;
                    padding: 4px 10px; border-radius: 20px; border: 1px solid;
                    font-size: 10px; font-weight: 700; letter-spacing: 1px;
                    font-family: 'Orbitron', sans-serif; text-transform: uppercase;
                }
                .delete-btn {
                    width: 32px; height: 32px; border-radius: 50%;
                    background: rgba(255,50,50,0.08); border: 1px solid rgba(255,50,50,0.2);
                    color: #ff4444; cursor: pointer; transition: all 0.2s;
                    display: flex; align-items: center; justify-content: center; font-size: 12px;
                }
                .delete-btn:hover:not(:disabled) { background: rgba(255,50,50,0.2); transform: scale(1.1); }
                .delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .viz-card-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: #fff; line-height: 1.3; }

                /* MINI PREVIEW */
                .viz-mini-preview {
                    height: 100px; border-radius: 10px;
                    background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.04);
                    position: relative; overflow: hidden;
                    display: flex; align-items: flex-end; padding: 12px 16px; gap: 6px;
                }
                .mini-bar {
                    flex: 1; border-radius: 4px 4px 2px 2px;
                    animation: miniPulse 2s ease-in-out infinite alternate;
                    transition: height 0.5s ease;
                }
                @keyframes miniPulse { 0% { opacity: 0.5; } 100% { opacity: 1; } }
                .mini-play-overlay {
                    position: absolute; inset: 0;
                    background: rgba(0,0,0,0.6); backdrop-filter: blur(2px);
                    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
                    opacity: 0; transition: opacity 0.25s;
                }
                .viz-card:hover .mini-play-overlay { opacity: 1; }
                .mini-play-icon {
                    width: 36px; height: 36px; border-radius: 50%;
                    background: var(--card-color, #bc13fe);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 14px; color: #fff;
                    box-shadow: 0 0 20px var(--card-color, #bc13fe);
                }
                .mini-play-overlay span { font-size: 10px; color: #ccc; font-family: 'Orbitron'; letter-spacing: 1px; }

                /* FOOTER */
                .viz-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); }
                .viz-meta-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #555; }
                .viz-meta-item i { font-size: 10px; }

                /* LOADING / EMPTY */
                .loading-state { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; padding: 80px; color: #555; }
                .spinner { width: 40px; height: 40px; border: 2px solid rgba(188,19,254,0.2); border-top-color: #bc13fe; border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .empty-state { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 80px; color: #555; text-align: center; }
                .empty-state i { font-size: 3rem; color: #222; }
                .empty-state h3 { color: #888; margin: 0; }
                .empty-state p { max-width: 360px; line-height: 1.6; }

                /* HEADER */
                .visuals-header { display: flex; justify-content: space-between; align-items: center; padding: 28px 40px 20px; flex-shrink: 0; }
                .visuals-header h1 { margin: 0; font-size: 1.8rem; font-weight: 800; }
                .visuals-header p { margin: 4px 0 0; color: #555; font-size: 13px; }
                .refresh-btn { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #ccc; padding: 8px 18px; border-radius: 8px; cursor: pointer; font-size: 13px; transition: all 0.2s; }
                .refresh-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
                .cta-btn { display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #bc13fe, #7010aa); border: none; color: #fff; padding: 8px 18px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; margin-top: 16px; }
                .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(188,19,254,0.4); }

                /* SIDEBAR (reuse dashboard styles) */
                .sidebar { width: 220px; background: #080810; border-right: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; padding: 20px 0; flex-shrink: 0; }
                .sidebar-brand { display: flex; align-items: center; gap: 12px; padding: 0 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 12px; }
                .logo-icon { width: 36px; height: 36px; background: rgba(0, 242, 255, 0.08); border: 1.5px solid rgba(0, 242, 255, 0.35); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #00f2ff; font-size: 15px; box-shadow: 0 0 12px rgba(0, 242, 255, 0.2); }
                .sidebar-brand h2 { margin: 0; font-size: 1rem; font-weight: 800; color: #fff; letter-spacing: 1px; }
                .sidebar-brand h2 span { color: #00f2ff; }
                nav { display: flex; flex-direction: column; gap: 4px; padding: 0 12px; flex: 1; }
                .nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px; background: none; border: none; color: #666; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; text-align: left; width: 100%; }
                .nav-item:hover { background: rgba(255,255,255,0.05); color: #ccc; }
                .nav-item.active { background: rgba(188,19,254,0.15); color: #bc13fe; }
                .nav-item.logout { color: #ff4444; }
                .nav-item.logout:hover { background: rgba(255,68,68,0.1); }
                .sidebar-footer { padding: 12px; border-top: 1px solid rgba(255,255,255,0.05); margin-top: auto; }
                .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
            `}</style>
        </div>
    );
};

export default VisualsScreen;
