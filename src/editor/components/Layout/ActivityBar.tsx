import React, { useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { useUserStore } from '../../../stores/userStore';
import { useGitStore } from '../../stores/gitStore';

interface ActivityBarProps {
  activeSidebar: string;
  onSidebarChange: (sidebar: string) => void;
  onNavigate?: (path: string) => void;
}

const ActivityBar: React.FC<ActivityBarProps> = ({ activeSidebar, onSidebarChange, onNavigate }) => {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const editorStore = useEditorStore();
  const { user } = useUserStore();
  const changes = useGitStore((state: any) => state.changes);

  const menuItemStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 16px',
    background: 'transparent',
    border: 'none',
    color: '#ccc',
    textAlign: 'left',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'background 0.1s'
  };

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
    <aside className="activity-bar" style={{ position: 'relative' }}>
      {showAccountMenu && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '56px',
          width: '240px',
          background: '#252526',
          border: '1px solid #454545',
          borderRadius: '6px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
          zIndex: 1000,
          padding: '8px 0',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {user ? (
            <>
              <div style={{ padding: '8px 16px', borderBottom: '1px solid #333' }}>
                <div style={{ fontWeight: 600, color: '#fff' }}>{user.name || user.email}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>{user.githubId ? 'GitHub Connected' : 'Local Account'}</div>
              </div>
              <button
                onClick={() => { setShowAccountMenu(false); onNavigate?.('/dashboard'); }}
                style={menuItemStyle}
              >
                <i className="fa-solid fa-user" style={{ width: '20px' }}></i> Profile
              </button>
              <button
                onClick={() => { setShowAccountMenu(false); onNavigate?.('/settings'); }}
                style={menuItemStyle}
              >
                <i className="fa-solid fa-gear" style={{ width: '20px' }}></i> Settings
              </button>
              <div style={{ height: '1px', background: '#333', margin: '8px 0' }}></div>
              <button
                onClick={() => { window.location.href = '/'; }}
                style={{ ...menuItemStyle, color: '#f85149' }}
              >
                <i className="fa-solid fa-right-from-bracket" style={{ width: '20px' }}></i> Sign Out
              </button>
            </>
          ) : (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>Sign in to sync your progress</p>
              <button
                onClick={() => { window.location.href = '/#/login'; }}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#00f2ff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      )}

      {/* Background overlay to close menu */}
      {showAccountMenu && (
        <div
          onClick={() => setShowAccountMenu(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 999 }}
        />
      )}
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
        onClick={() => {
          onSidebarChange('Explorer');
          if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
        }}
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
        onClick={() => {
          onSidebarChange('Search');
          if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
        }}
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
        className={`activity-icon ${activeSidebar === 'GitHub' ? 'active' : ''}`}
        onClick={() => {
          onSidebarChange('GitHub');
          if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
        }}
        title="GitHub"
        onMouseEnter={() => setHoveredIcon('github')}
        onMouseLeave={() => setHoveredIcon(null)}
        style={{
          color: activeSidebar === 'GitHub' ? '#00f2ff' : hoveredIcon === 'github' ? '#00f2ff' : '#888',
          position: 'relative'
        }}
      >
        <i className="fa-brands fa-github"></i>
        {changes.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: '#007acc',
            color: 'white',
            fontSize: '9px',
            fontWeight: 'bold',
            minWidth: '14px',
            height: '14px',
            borderRadius: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 2px',
            pointerEvents: 'none'
          }}>
            {changes.length}
          </span>
        )}
      </button>

      <div style={{ flex: 1 }}></div>

      <button
        type="button"
        className="activity-icon account-icon"
        title={user ? `Account (${user.name || user.email})` : 'Accounts'}
        onMouseEnter={() => setHoveredIcon('account')}
        onMouseLeave={() => setHoveredIcon(null)}
        onClick={() => setShowAccountMenu(!showAccountMenu)}
        style={{
          color: hoveredIcon === 'account' || showAccountMenu ? '#00f2ff' : '#888',
          position: 'relative'
        }}
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt="User"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '1px solid currentColor',
              padding: '1px'
            }}
          />
        ) : (
          <i className="fa-regular fa-circle-user" style={{ fontSize: '20px' }}></i>
        )}
        {user?.githubId && (
          <i className="fa-brands fa-github" style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            fontSize: '10px',
            background: '#1e1e1e',
            borderRadius: '50%',
            padding: '1px',
            color: '#00f2ff'
          }}></i>
        )}
      </button>

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
