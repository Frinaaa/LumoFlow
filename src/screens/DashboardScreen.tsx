import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer 
} from 'recharts';
import authService from '../services/authService';
import '../styles/DashboardScreen.css'; // Make sure this points to your new CSS file


// 1. Add avatar to interface
interface UserProfile {
  name: string;
  email: string;
  avatar?: string; // Add this
}

const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  // --- 1. MOCK DATA FOR VISUALS ---
  // (Stats are 0 as requested, Chart data is static for now)
  const [stats] = useState({
    lines: 0,
    bugs: 0,
    concepts: 0,
    score: 0,
    level: "LVL 0: DETECTING..."
  });

  const skillData = [
    { subject: 'LOGIC', A: 120, fullMark: 150 },
    { subject: 'SYNTAX', A: 98, fullMark: 150 },
    { subject: 'SPEED', A: 86, fullMark: 150 },
    { subject: 'DEBUG', A: 99, fullMark: 150 },
    { subject: 'VISUALS', A: 85, fullMark: 150 },
  ];

  const recentActivity = [
    { id: 1, title: 'Loops & Arrays', type: 'Terminal Practice • 2h ago', xp: 150, color: '#00f2ff', icon: 'fa-terminal' },
    { id: 2, title: 'Debug Race', type: 'Rank S • 5h ago', xp: 300, color: '#ff0055', icon: 'fa-triangle-exclamation' },
    { id: 3, title: 'Memory Heap', type: 'Visual Guide • Yesterday', xp: 50, color: '#bc13fe', icon: 'fa-code-branch' },
    { id: 4, title: 'Logic Builder', type: 'Level 5 • 2d ago', xp: 200, color: '#00ff88', icon: 'fa-puzzle-piece' },
  ];

  // --- 2. FETCH REAL USERNAME ---
  useEffect(() => {
    const initData = async () => {
      try {
        const res = await authService.getProfile();
        if (res.success && res.user) {
        setUser({ 
            name: res.user.name, 
            email: res.user.email,
            avatar: res.user.avatar // Get avatar
        });
    }
      } catch (e) {
        console.error("Failed to load user");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/'; 
  };

  if (loading) return <div style={{background:'#050508', height:'100vh', color:'#00f2ff', display:'flex', alignItems:'center', justifyContent:'center'}}>CONNECTING...</div>;

  return (
    <div className="dashboard-wrapper">
      
      {/* --- SIDEBAR --- */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-icon"><i className="fa-solid fa-bolt"></i></div>
          <h2>LUMO<span>FLOW</span></h2>
        </div>

        <nav>
          <button className="nav-item active"><i className="fa-solid fa-chart-line"></i> Dashboard</button>
          <button className="nav-item"><i className="fa-solid fa-gamepad"></i> Arcade</button>
          <button className="nav-item" onClick={() => navigate('/terminal')}>
  <i className="fa-solid fa-terminal"></i> Terminal
</button>
          <button className="nav-item"><i className="fa-solid fa-eye"></i> Visuals</button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => navigate('/settings')}>
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
        <header className="dashboard-header">
  <div className="header-text">
    <h1>Hello, <span style={{color:'white'}}>{user?.name || "User"}</span></h1>
    <p>Your neural network is expanding. Keep flowing.</p>
  </div>
  <div className="level-badge">{stats.level}</div>
  
   {/* 3. UPDATE PROFILE PICTURE DISPLAY */}
            <div style={{
              width: '50px', height: '50px', borderRadius: '50%', 
              overflow: 'hidden', border: '2px solid #00f2ff',
              background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
               {user?.avatar ? (
                 <img src={user.avatar} alt="Profile" style={{width:'100%', height:'100%', objectFit:'cover'}} />
               ) : (
                 <i className="fa-solid fa-user-astronaut" style={{color:'#888', fontSize:'24px'}}></i>
               )}
            </div>
          
  {/* UPDATE PROFILE PIC HERE */}
  <div className="profile-pic" style={{overflow:'hidden', border: '2px solid #00f2ff'}}>
     {user?.avatar ? (
        <img src={user.avatar} alt="Profile" style={{width:'100%', height:'100%', objectFit:'cover'}} />
     ) : (
        <i className="fa-solid fa-user-astronaut"></i>
     )}
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
            <div className="stat-icon green"><i className="fa-solid fa-trophy"></i></div>
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
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                  <PolarGrid stroke="#222" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12, fontWeight:'bold' }} />
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
              <div className="focus-area">Focus Area: <span style={{color: '#bc13fe'}}>Debugging Efficiency</span></div>
            </div>
          </div>

          {/* RECENT FLOW LIST */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <h3>RECENT FLOW</h3>
              <i className="fa-solid fa-clock-rotate-left" style={{color:'#666'}}></i>
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
                    <p>{item.type}</p>
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