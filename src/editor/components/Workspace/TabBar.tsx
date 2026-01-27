import React, { useRef, useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';

interface TabBarProps {
  onTabClose?: (tabId: string) => void;
  onTabSelect?: (tabId: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ onTabClose, onTabSelect }) => {
  const { tabs, activeTabId, setActiveTab, removeTab, closeAllTabs, closeOtherTabs } = useEditorStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  if (tabs.length === 0) return null;

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, { icon: string; color: string }> = {
      js: { icon: 'fa-brands fa-js', color: '#f7df1e' },
      jsx: { icon: 'fa-brands fa-react', color: '#61dafb' },
      ts: { icon: 'fa-brands fa-js', color: '#3178c6' },
      tsx: { icon: 'fa-brands fa-react', color: '#61dafb' },
      py: { icon: 'fa-brands fa-python', color: '#3776ab' },
      java: { icon: 'fa-brands fa-java', color: '#007396' },
      html: { icon: 'fa-brands fa-html5', color: '#e34c26' },
      css: { icon: 'fa-brands fa-css3-alt', color: '#1572b6' },
      json: { icon: 'fa-solid fa-brackets-curly', color: '#f7df1e' },
      md: { icon: 'fa-brands fa-markdown', color: '#ffffff' },
      txt: { icon: 'fa-solid fa-file-lines', color: '#cccccc' },
    };
    return iconMap[ext || ''] || { icon: 'fa-solid fa-file-code', color: '#519aba' };
  };

  const handleTabClick = (tabId: string, e: React.MouseEvent) => {
    if (e.button === 1) {
      // Middle click - close tab
      e.preventDefault();
      removeTab(tabId);
      onTabClose?.(tabId);
    } else {
      setActiveTab(tabId);
      onTabSelect?.(tabId);
    }
  };

  const handleTabClose = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeTab(tabId);
    onTabClose?.(tabId);
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  return (
    <>
      <div
        ref={tabsContainerRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#2d2d30',
          borderBottom: '1px solid #3c3c3c',
          height: '35px',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'thin',
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const fileInfo = getFileIcon(tab.fileName);

          return (
            <div
              key={tab.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 12px',
                height: '100%',
                minWidth: '120px',
                maxWidth: '200px',
                background: isActive ? '#1e1e1e' : 'transparent',
                borderRight: '1px solid #3c3c3c',
                borderTop: isActive ? '2px solid #00f2ff' : '2px solid transparent',
                color: isActive ? '#ffffff' : '#969696',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onClick={(e) => handleTabClick(tab.id, e)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              onMouseDown={(e) => {
                if (e.button === 1) {
                  handleTabClick(tab.id, e);
                }
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#2a2d2e';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {/* File Icon */}
              <i
                className={fileInfo.icon}
                style={{
                  fontSize: '14px',
                  color: fileInfo.color,
                  flexShrink: 0,
                }}
              ></i>

              {/* File Name */}
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                }}
                title={tab.filePath}
              >
                {tab.fileName}
              </span>

              {/* Dirty Indicator */}
              {tab.isDirty && (
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#00f2ff',
                    flexShrink: 0,
                  }}
                  title="Unsaved changes"
                ></div>
              )}

              {/* Close Button */}
              <i
                className="fa-solid fa-xmark"
                onClick={(e) => handleTabClose(tab.id, e)}
                style={{
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  borderRadius: '3px',
                  flexShrink: 0,
                  opacity: isActive ? 1 : 0,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#3c3c3c';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = isActive ? '#ffffff' : '#969696';
                }}
                title="Close (Ctrl+W)"
              ></i>
            </div>
          );
        })}

        {/* Tab Actions */}
        {tabs.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px',
              height: '100%',
              borderRight: '1px solid #3c3c3c',
            }}
          >
            <i
              className="fa-solid fa-ellipsis"
              style={{
                fontSize: '14px',
                color: '#888',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '3px',
              }}
              onClick={(e) => {
                const firstTab = tabs[0];
                if (firstTab) {
                  handleContextMenu(e as any, firstTab.id);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3c3c3c';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#888';
              }}
              title="More Actions"
            ></i>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={handleCloseContextMenu}
            onContextMenu={(e) => {
              e.preventDefault();
              handleCloseContextMenu();
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              background: '#252526',
              border: '1px solid #454545',
              borderRadius: '4px',
              padding: '4px 0',
              minWidth: '200px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              zIndex: 1000,
              fontSize: '13px',
              color: '#cccccc',
            }}
          >
            <div
              style={{
                padding: '6px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2d2e')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              onClick={() => {
                removeTab(contextMenu.tabId);
                handleCloseContextMenu();
              }}
            >
              <i className="fa-solid fa-xmark" style={{ width: '14px' }}></i>
              <span>Close</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#888' }}>Ctrl+W</span>
            </div>
            <div
              style={{
                padding: '6px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2d2e')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              onClick={() => {
                closeOtherTabs(contextMenu.tabId);
                handleCloseContextMenu();
              }}
            >
              <i className="fa-solid fa-xmark" style={{ width: '14px' }}></i>
              <span>Close Others</span>
            </div>
            <div
              style={{
                padding: '6px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2d2e')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              onClick={() => {
                closeAllTabs();
                handleCloseContextMenu();
              }}
            >
              <i className="fa-solid fa-xmark" style={{ width: '14px' }}></i>
              <span>Close All</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#888' }}>Ctrl+K W</span>
            </div>
            <div style={{ height: '1px', background: '#3c3c3c', margin: '4px 0' }}></div>
            <div
              style={{
                padding: '6px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2d2e')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              onClick={() => {
                const tab = tabs.find(t => t.id === contextMenu.tabId);
                if (tab) {
                  navigator.clipboard.writeText(tab.filePath);
                }
                handleCloseContextMenu();
              }}
            >
              <i className="fa-solid fa-copy" style={{ width: '14px' }}></i>
              <span>Copy Path</span>
            </div>
            <div
              style={{
                padding: '6px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2d2e')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              onClick={() => {
                const tab = tabs.find(t => t.id === contextMenu.tabId);
                if (tab) {
                  navigator.clipboard.writeText(tab.fileName);
                }
                handleCloseContextMenu();
              }}
            >
              <i className="fa-solid fa-file" style={{ width: '14px' }}></i>
              <span>Copy Filename</span>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default TabBar;
