import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer
} from 'recharts';
import authService from '../services/authService';
import { useUserStore } from '../stores/userStore';
import SimpleTitlebar from '../components/SimpleTitlebar';
import '../styles/DashboardScreen.css';

// Interface for type safety
interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    stats: storeStats,
    recentActivity: storeActivity,
    fetchUserData,
    user: storeUser,
    skillMatrix: storeSkills,
    isSyncing,
    loading: storeLoading
  } = useUserStore();

  // 🟢 OPTIMIZED: Check cache immediately 
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('user_info');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed;
      }
      return null;
    } catch { return null; }
  });

  const currentUser = storeUser || user;

  // Stats derived from store for UI mapping
  const stats = {
    lines: storeStats.linesWritten,
    bugs: storeStats.bugsDetected,
    concepts: storeStats.conceptsVisualized,
    score: storeStats.totalScore,
    level: storeStats.level
  };

  const recentActivity = storeActivity;
  const [loading, setLoading] = useState(!user);

  const skillData = storeSkills && storeSkills.length > 0 ? storeSkills : [
    { subject: 'Logic', A: 50, fullMark: 150 },
    { subject: 'Syntax', A: 40, fullMark: 150 },
    { subject: 'Speed', A: 30, fullMark: 150 },
    { subject: 'Debug', A: 20, fullMark: 150 },
    { subject: 'Visuals', A: 10, fullMark: 150 },
  ];

  const focusArea = useMemo(() => {
    if (!skillData || skillData.length === 0) return 'Analyzing...';
    const sorted = [...skillData].sort((a, b) => a.A - b.A);
    const lowest = sorted[0];
    const map: any = {
      'Logic': 'Algorithmic Reasoning',
      'Syntax': 'Code Precision',
      'Speed': 'Reaction Velocity',
      'Debug': 'Bug Recognition',
      'Visuals': 'Flow Visualization'
    };
    return map[lowest.subject] || lowest.subject;
  }, [skillData]);

  // 🟢 FETCH LOGIC: Gets latest data from backend
  const fetchUser = async () => {
    try {
      const userString = localStorage.getItem('user_info');
      if (!userString) return;
      const cachedUser = JSON.parse(userString);
      const userId = cachedUser._id || cachedUser.id;

      await fetchUserData();
    } catch (e) {
      console.error("Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 EFFECT: Initial Load + Event Listener for Parallel Updates
  useEffect(() => {
    console.log('✅ DashboardScreen MOUNTED');
    fetchUser(); // Run once on mount

    // Listen for the 'profile-updated' event from SettingsScreen
    window.addEventListener('profile-updated', fetchUser);
    window.addEventListener('stats-updated', fetchUser);

    // Cleanup listener when leaving dashboard
    return () => {
      console.log('❌ DashboardScreen UNMOUNTED');
      window.removeEventListener('profile-updated', fetchUser);
      window.removeEventListener('stats-updated', fetchUser);
    };
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/';
  };

  if (loading) return <div className="loading-screen">CONNECTING...</div>;

  return (
    <>
      <div className="dashboard-wrapper">

        {/* --- SIDEBAR --- */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="logo-icon"><i className="fa-solid fa-bolt"></i></div>
            <h2>LUMO<span>FLOW</span></h2>
          </div>

          <nav>
            <button className="nav-item active"><i className="fa-solid fa-chart-line"></i> Dashboard</button>
            <button className="nav-item" onClick={() => navigate('/games', { state: { from: '/dashboard' } })}>
              <i className="fa-solid fa-gamepad"></i> Arcade
            </button>
            <button className="nav-item" onClick={() => navigate('/editor')}>
              <i className="fa-solid fa-terminal"></i> Code Editor
            </button>
            <button className="nav-item"><i className="fa-solid fa-eye"></i> Visuals</button>
          </nav>

          <div className="sidebar-footer">
            <button className="nav-item" onClick={() => {
              sessionStorage.setItem('settingsReferrer', '/dashboard');
              navigate('/settings');
            }}>
              <i className="fa-solid fa-gear"></i> Settings
            </button>
            <button className="nav-item logout" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket"></i> Logout
            </button>
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="main-content">

          {/* HEADER */}
          <header className="dashboard-header" style={{ alignItems: 'flex-start', paddingTop: '15px' }}>
            <div className="header-text">
              <h1>Hello, <span style={{ color: 'white' }}>{currentUser?.name || "User"}</span></h1>
              <p>Your neural network is expanding. Keep flowing.</p>
            </div>

            <div className="dashboard-right-header" style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div className="dashboard-avatar-container">
                {/* 🟢 FIX: Uses 'user.avatar' instead of 'userData' (which was undefined) */}
                <img
                  src={currentUser?.avatar || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png'}
                  alt="Profile"
                  className="dash-avatar-img"
                />
              </div>
            </div>
          </header>

          {/* STATS ROW */}
          <section className="stats-row">
            <div className="stat-card">
              <div className="stat-icon cyan"><i className="fa-solid fa-code"></i></div>
              <h3>{stats.lines}</h3>
              <p>LINES WRITTEN</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon pink"><i className="fa-solid fa-bug-slash"></i></div>
              <h3>{stats.bugs}</h3>
              <p>BUGS SQUASHED</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><i className="fa-solid fa-eye"></i></div>
              <h3>{stats.concepts}</h3>
              <p>CONCEPTS VISUALIZED</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><i className="fa-solid fa-trophy"></i></div>
              <h3>{stats.score}</h3>
              <p>ARCADE SCORE</p>
            </div>
          </section>

          {/* DASHBOARD GRID */}
          <section className="dashboard-grid">

            {/* CHART PANEL */}
            <div className="dashboard-panel">
              <div className="panel-header">
                <h3>SKILL MATRIX</h3>
                <span className="live-tag">Live Analysis</span>
              </div>

              <div className="focus-area" style={{ marginTop: '8px', marginBottom: '10px', fontSize: '0.9rem', color: '#888' }}>
                Focus Area: <span style={{ color: '#bc13fe' }}>{focusArea}</span>
              </div>

              {/* Added fixed height to prevent Recharts warning */}
              <div className="chart-container" style={{ height: 270 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                    <PolarGrid stroke="#222" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12, fontWeight: 'bold' }} />
                    <Radar
                      name="Skills"
                      dataKey="A"
                      stroke="#bc13fe"
                      strokeWidth={3}
                      fill="#bc13fe"
                      fillOpacity={0.2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RECENT FLOW LIST */}
            <div className="dashboard-panel">
              <div className="panel-header">
                <h3>RECENT FLOW</h3>
                <button
                  className={`refresh-btn ${(storeLoading || isSyncing) ? 'spinning' : ''}`}
                  onClick={fetchUser}
                  title="Refresh Activity"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'color 0.3s ease'
                  }}
                >
                  <i className={`fa-solid fa-sync ${(storeLoading || isSyncing) ? 'fa-spin' : ''}`}></i>
                </button>
              </div>
              <div className="activity-list">
                {recentActivity.map((item) => (
                  <div key={item.id} className="activity-item">
                    <div
                      className="activity-icon"
                      style={{ color: item.color, borderColor: item.color }}
                    >
                      <i className={`fa-solid ${item.icon}`}></i>
                    </div>
                    <div className="activity-info">
                      <h4>{item.title}</h4>
                      <p>{item.type} {item.time ? `• ${item.time}` : ''}</p>
                    </div>
                    <div className="xp-badge">+{item.xp || 0} XP</div>
                  </div>
                ))}
              </div>
            </div>

          </section>
        </main>
      </div >
    </>
  );
};

export default DashboardScreen;