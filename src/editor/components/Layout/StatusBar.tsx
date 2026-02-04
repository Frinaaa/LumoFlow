import React from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';

export const StatusBar = () => {
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


  return (
    <div className="vs-status-bar" style={{
      height: '22px',
      background: errorCount > 0 ? '#cc3333' : '#bc13fe',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      padding: '0',
      fontSize: '12px',
      justifyContent: 'space-between',
      borderTop: '1px solid #333',
      transition: 'background 0.3s ease',
      cursor: 'default',
      userSelect: 'none',
      minWidth: 0,
      overflow: 'hidden'
    }}>
      {/* LEFT SECTION */}
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', minWidth: 0, flex: 1 }}>
        <div
          className="status-item remote"
          style={{ padding: '0 12px', height: '100%', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }}
        >
          <i className="fa-solid fa-code-remote"></i>
        </div>

        <div className="status-item" style={{ ...statusItemStyle, padding: '0 12px', fontWeight: '500', opacity: 0.9, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {workspaceName || 'NO FOLDER OPENED'}
        </div>


        <div
          className="status-item clickable"
          onClick={handleProblemsClick}
          style={{ ...statusItemStyle, flexShrink: 0 }}
          title={`${errorCount} errors, ${warningCount} warnings`}
        >
          <i className="fa-regular fa-circle-xmark" style={{ marginRight: '4px' }}></i>
          <span>{errorCount}</span>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginLeft: '8px', marginRight: '4px' }}></i>
          <span>{warningCount}</span>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', flexShrink: 0, gap: 0 }}>
        <div className="status-item" style={{ ...statusItemStyle, flexShrink: 0 }}>
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </div>
        <div className="status-item" style={{ ...statusItemStyle, flexShrink: 0 }}>
          Spaces: 2
        </div>
        <div className="status-item" style={{ ...statusItemStyle, flexShrink: 0 }}>
          UTF-8
        </div>
        <div className="status-item clickable" style={{ ...statusItemStyle, flexShrink: 0 }} onClick={() => { }}>
          {activeTab?.language.toUpperCase() || 'PLAIN TEXT'}
        </div>
        <div className="status-item clickable" style={{ ...statusItemStyle, padding: '0 12px', flexShrink: 0 }}>
          <i className="fa-regular fa-bell"></i>
        </div>
      </div>

      <style>{`
        .status-item {
          padding: 0 8px;
          height: 100%;
          display: flex;
          align-items: center;
          white-space: nowrap;
          gap: 4px;
          color: white;
          min-width: 0;
        }
        .status-item i {
          color: white;
          transition: color 0.1s;
          flex-shrink: 0;
        }
        .status-item.clickable:active i {
          color: #00f2ff;
        }
      `}</style>
    </div>
  );
};

const statusItemStyle: React.CSSProperties = {
  fontSize: '11px',
};
