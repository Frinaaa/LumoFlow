import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ActivityBarProps {
  activeSidebar: string;
  onSidebarChange: (sidebar: string) => void;
}

const ActivityBar: React.FC<ActivityBarProps> = ({ activeSidebar, onSidebarChange }) => {
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    console.log('Dashboard button clicked, navigating to /dashboard');
    navigate('/dashboard');
  };

  const handleSettingsClick = () => {
    console.log('Settings button clicked, navigating to /settings');
    sessionStorage.setItem('settingsReferrer', '/terminal');
    navigate('/settings');
  };

  return (
    <aside className="activity-bar" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '50px',
      background: '#1e1e1e',
      borderRight: '1px solid #333',
      padding: '10px 0',
      gap: '10px'
    }}>
      <div 
        className="activity-icon" 
        onClick={handleDashboardClick} 
        title="Dashboard"
        style={{
          padding: '8px',
          cursor: 'pointer',
          color: '#888',
          fontSize: '18px',
          transition: 'all 0.2s ease',
          borderLeft: '3px solid transparent',
          '&:hover': {
            color: '#00f2ff'
          }
        }}
      >
        <i className="fa-solid fa-house"></i>
      </div>

      <div 
        className={`activity-icon ${activeSidebar === 'Explorer' ? 'active' : ''}`} 
        onClick={() => onSidebarChange('Explorer')} 
        title="Explorer"
        style={{
          padding: '8px',
          cursor: 'pointer',
          color: activeSidebar === 'Explorer' ? '#00f2ff' : '#888',
          fontSize: '18px',
          transition: 'all 0.2s ease'
        }}
      >
        <i className="fa-regular fa-copy"></i>
      </div>

      <div 
        className={`activity-icon ${activeSidebar === 'Search' ? 'active' : ''}`} 
        onClick={() => onSidebarChange('Search')} 
        title="Search"
        style={{
          padding: '8px',
          cursor: 'pointer',
          color: activeSidebar === 'Search' ? '#00f2ff' : '#888',
          fontSize: '18px',
          transition: 'all 0.2s ease'
        }}
      >
        <i className="fa-solid fa-magnifying-glass"></i>
      </div>

      <div 
        className={`activity-icon ${activeSidebar === 'Github' ? 'active' : ''}`} 
        onClick={() => onSidebarChange('Github')} 
        title="Source Control"
        style={{
          padding: '8px',
          cursor: 'pointer',
          color: activeSidebar === 'Github' ? '#00f2ff' : '#888',
          fontSize: '18px',
          transition: 'all 0.2s ease'
        }}
      >
        <i className="fa-brands fa-github"></i>
      </div>

      <div style={{ flex: 1 }}></div>

      <div 
        className="activity-icon" 
        onClick={handleSettingsClick} 
        title="Settings"
        style={{
          padding: '8px',
          cursor: 'pointer',
          color: '#888',
          fontSize: '18px',
          transition: 'all 0.2s ease'
        }}
      >
        <i className="fa-solid fa-gear"></i>
      </div>
    </aside>
  );
};

export default ActivityBar;
