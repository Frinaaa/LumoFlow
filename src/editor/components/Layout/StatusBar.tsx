import React from 'react';
import { useGitStore } from '../../stores/gitStore';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';

export const StatusBar = () => {
  const { branch, isRepo } = useGitStore();
  const { workspaceName } = useFileStore();
  const editorStore = useEditorStore();
  const { activeTabId, tabs, problems, setActiveBottomTab, toggleTerminal, setActiveSidebar, toggleSidebar } = editorStore;

  const activeTab = tabs.find(t => t.id === activeTabId);
  const cursorPosition = activeTab?.cursorPosition || { line: 1, column: 1 };

  const errorCount = problems.filter(p => p.type === 'error').length;
  const warningCount = problems.filter(p => p.type === 'warning').length;

  const handleProblemsClick = () => {
    setActiveBottomTab('Problems');
    if (!editorStore.terminalVisible) toggleTerminal();
  };

  const handleGitClick = () => {
    setActiveSidebar('Git');
    if (!editorStore.sidebarVisible) toggleSidebar();
  };

  return (
    <div className="vs-status-bar" style={{
      height: '22px',
      background: errorCount > 0 ? '#cc3333' : '#7b1fa2',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      padding: '0',
      fontSize: '12px',
      justifyContent: 'space-between',
      borderTop: '1px solid #333',
      transition: 'background 0.3s ease',
      cursor: 'default',
      userSelect: 'none'
    }}>
      {/* LEFT SECTION */}
      <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
        <div
          className="status-item remote"
          style={{ padding: '0 12px', height: '100%', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)' }}
        >
          <i className="fa-solid fa-code-remote"></i>
        </div>

        <div className="status-item" style={{ ...statusItemStyle, padding: '0 12px', fontWeight: '500', opacity: 0.9 }}>
          {workspaceName || 'NO FOLDER OPENED'}
        </div>

        {isRepo && (
          <div
            className="status-item clickable"
            onClick={handleGitClick}
            style={statusItemStyle}
            title={`${branch}*`}
          >
            <i className="fa-solid fa-code-branch" style={{ marginRight: '4px' }}></i>
            <span>{branch}</span>
          </div>
        )}

        <div
          className="status-item clickable"
          onClick={handleProblemsClick}
          style={statusItemStyle}
          title={`${errorCount} errors, ${warningCount} warnings`}
        >
          <i className="fa-regular fa-circle-xmark" style={{ marginRight: '4px' }}></i>
          <span>{errorCount}</span>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginLeft: '8px', marginRight: '4px' }}></i>
          <span>{warningCount}</span>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
        <div className="status-item" style={statusItemStyle}>
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </div>
        <div className="status-item" style={statusItemStyle}>
          Spaces: 2
        </div>
        <div className="status-item" style={statusItemStyle}>
          UTF-8
        </div>
        <div className="status-item clickable" style={statusItemStyle} onClick={() => { }}>
          {activeTab?.language.toUpperCase() || 'PLAIN TEXT'}
        </div>
        <div className="status-item clickable" style={{ ...statusItemStyle, padding: '0 12px' }}>
          <i className="fa-regular fa-bell"></i>
        </div>
      </div>

      <style>{`
        .status-item {
          padding: 0 8px;
          height: 100%;
          display: flex;
          align-items: center;
          transition: background 0.1s;
          white-space: nowrap;
        }
        .status-item.clickable:hover {
          background: rgba(255, 255, 255, 0.2);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

const statusItemStyle: React.CSSProperties = {
  fontSize: '11px',
};
