import React, { useState } from 'react';

interface ActivityBarProps {
  activeSidebar: string;
  onSidebarChange: (sidebar: string) => void;
  onNavigate?: (path: string) => void;
}

const ActivityBar: React.FC<ActivityBarProps> = ({ activeSidebar, onSidebarChange, onNavigate }) => {
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🏠 Home button clicked');
    if (onNavigate) {
      onNavigate('/dashboard');
    } else {
      window.location.href = '/#/dashboard';
    }
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('⚙️ Settings button clicked');
    sessionStorage.setItem('settingsReferrer', '/editor');
    if (onNavigate) {
      onNavigate('/settings');
    } else {
      window.location.href = '/#/settings';
    }
  };

  return (
    <aside className="activity-bar">
      <button 
        type="button"
        className="activity-icon home-icon" 
        onClick={handleDashboardClick}
        title="Dashboard"
        onMouseEnter={() => setHoveredIcon('home')}
        onMouseLeave={() => setHoveredIcon(null)}
        style={{
          color: hoveredIcon === 'home' ? '#00f2ff' : '#888',
        }}
      >
        <i className="fa-solid fa-house"></i>
      </button>

      <button 
        type="button"
        className={`activity-icon ${activeSidebar === 'Explorer' ? 'active' : ''}`} 
        onClick={() => onSidebarChange('Explorer')} 
        title="Explorer"
        onMouseEnter={() => setHoveredIcon('explorer')}
        onMouseLeave={() => setHoveredIcon(null)}
        style={{
          color: activeSidebar === 'Explorer' ? '#00f2ff' : hoveredIcon === 'explorer' ? '#00f2ff' : '#888'
        }}
      >
        <i className="fa-regular fa-copy"></i>
      </button>

      <button 
        type="button"
        className={`activity-icon ${activeSidebar === 'Search' ? 'active' : ''}`} 
        onClick={() => onSidebarChange('Search')} 
        title="Search"
        onMouseEnter={() => setHoveredIcon('search')}
        onMouseLeave={() => setHoveredIcon(null)}
        style={{
          color: activeSidebar === 'Search' ? '#00f2ff' : hoveredIcon === 'search' ? '#00f2ff' : '#888'
        }}
      >
        <i className="fa-solid fa-magnifying-glass"></i>
      </button>

      <button 
        type="button"
        className={`activity-icon ${activeSidebar === 'Github' ? 'active' : ''}`} 
        onClick={() => onSidebarChange('Github')} 
        title="Source Control"
        onMouseEnter={() => setHoveredIcon('github')}
        onMouseLeave={() => setHoveredIcon(null)}
        style={{
          color: activeSidebar === 'Github' ? '#00f2ff' : hoveredIcon === 'github' ? '#00f2ff' : '#888'
        }}
      >
        <i className="fa-brands fa-github"></i>
      </button>

      <div style={{ flex: 1 }}></div>

      <button 
        type="button"
        className="activity-icon settings-icon" 
        onClick={handleSettingsClick}
        title="Settings"
        onMouseEnter={() => setHoveredIcon('settings')}
        onMouseLeave={() => setHoveredIcon(null)}
        style={{
          color: hoveredIcon === 'settings' ? '#00f2ff' : '#888',
        }}
      >
        <i className="fa-solid fa-gear"></i>
      </button>
    </aside>
  );
};

export default ActivityBar;
