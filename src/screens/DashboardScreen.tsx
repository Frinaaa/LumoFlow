import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import authService from '../services/authService';
import '../styles/DashboardScreen.css';

const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      const token = authService.getToken(); // You might decode this to get ID
      // For this example, we assume we stored user info in localStorage during login
      // Or we can just call the backend if the token is handled there.
      
      // Simulating getting the ID from the stored session
      const user = JSON.parse(localStorage.getItem('user_info') || '{}');
      const id = user._id || 'demo_id';

      const res = await authService.getDashboardData(id);
      if (res.success) {
        setUserData(res);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  if (loading) return <div className="loading-screen">LOADING NEURAL LINK...</div>;

  return (
    <div className="dashboard-wrapper">
      {/* --- SIDEBAR --- */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-icon"><i className="fa-solid fa-bolt"></i></div>
          <h2>LUMO<span>FLOW</span></h2>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active"><i className="fa-solid fa-chart-line"></i> Dashboard</button>
          <button className="nav-item"><i className="fa-solid fa-gamepad"></i> Arcade</button>
          <button className="nav-item"><i className="fa-solid fa-terminal"></i> Terminal</button>
          <button className="nav-item"><i className="fa-solid fa-eye"></i> Visuals</button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item"><i className="fa-solid fa-gear"></i> Settings</button>
          <button className="nav-item logout" onClick={handleLogout}><i className="fa-solid fa-right-from-bracket"></i> Logout</button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="main-content">
        
        {/* HEADER */}
        <header className="dashboard-header">
          <div className="header-text">
            <h1>Hello, <span className="username">{userData?.user?.name || 'Coder_01'}</span></h1>
            <p>Your neural network is expanding. Keep flowing.</p>
          </div>
          <div className="level-badge">
            {userData?.stats?.level || "LVL 1: INITIATE"}
          </div>
        </header>

        {/* STATS ROW */}
        <section className="stats-row">
          <div className="stat-card">
            <div className="stat-icon cyan"><i className="fa-solid fa-code"></i></div>
            <h3>{userData?.stats?.linesWritten}</h3>
            <p>LINES WRITTEN</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon pink"><i className="fa-solid fa-bug-slash"></i></div>
            <h3>{userData?.stats?.bugsSquashed}</h3>
            <p>BUGS SQUASHED</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><i className="fa-solid fa-eye"></i></div>
            <h3>{userData?.stats?.conceptsLearned}</h3>
            <p>CONCEPTS VISUALIZED</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><i className="fa-solid fa-trophy"></i></div>
            <h3>{userData?.stats?.arcadeScore}</h3>
            <p>ARCADE SCORE</p>
          </div>
        </section>

        {/* BOTTOM SECTION */}
        <section className="dashboard-grid">
          
          {/* SKILL MATRIX (Chart) */}
          <div className="dashboard-panel skill-matrix">
            <div className="panel-header">
              <h3>SKILL MATRIX</h3>
              <span className="live-tag">Live Analysis</span>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={userData?.skillMatrix}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                  <Radar
                    name="Skills"
                    dataKey="A"
                    stroke="#bc13fe"
                    strokeWidth={3}
                    fill="#bc13fe"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="focus-area">Focus Area: <span style={{color: '#bc13fe'}}>Debugging Efficiency</span></div>
            </div>
          </div>

          {/* RECENT FLOW */}
          <div className="dashboard-panel recent-flow">
            <div className="panel-header">
              <h3>RECENT FLOW</h3>
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div className="activity-list">
              {userData?.recentActivity?.map((item: any) => (
                <div key={item.id} className="activity-item">
                  <div className="activity-icon" style={{ color: item.color, borderColor: item.color }}>
                    <i className="fa-solid fa-code-branch"></i>
                  </div>
                  <div className="activity-info">
                    <h4>{item.title}</h4>
                    <p>{item.type} • {item.time}</p>
                  </div>
                  <div className="xp-badge">+{item.xp} XP</div>
                </div>
              ))}
            </div>
          </div>

        </section>
      </main>
    </div>
  );
};

export default DashboardScreen;