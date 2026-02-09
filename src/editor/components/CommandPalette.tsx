import React, { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { useFileOperations } from '../hooks/useFileOperations';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
  category?: string;
}

export const CommandPalette: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const editorStore = useEditorStore();
  const fileOps = useFileOperations();
  const activeTab = editorStore.tabs.find(t => t.id === editorStore.activeTabId);

  // Define all available commands
  const commands: Command[] = [
    {
      id: 'save',
      label: 'File: Save',
      shortcut: 'Ctrl+S',
      category: 'File',
      action: () => {
        if (activeTab) fileOps.saveFile(activeTab.id);
      }
    },
    {
      id: 'close-tab',
      label: 'File: Close Tab',
      shortcut: 'Ctrl+W',
      category: 'File',
      action: () => {
        if (activeTab) editorStore.removeTab(activeTab.id);
      }
    },
    {
      id: 'close-all-tabs',
      label: 'File: Close All Tabs',
      category: 'File',
      action: () => editorStore.closeAllTabs()
    },
    {
      id: 'toggle-sidebar',
      label: 'View: Toggle Sidebar',
      shortcut: 'Ctrl+B',
      category: 'View',
      action: () => editorStore.toggleSidebar()
    },
    {
      id: 'toggle-terminal',
      label: 'View: Toggle Terminal',
      shortcut: 'Ctrl+`',
      category: 'View',
      action: () => editorStore.toggleTerminal()
    },
    {
      id: 'explorer',
      label: 'View: Explorer',
      category: 'View',
      action: () => {
        editorStore.setActiveSidebar('Explorer');
        if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
      }
    },
    {
      id: 'search',
      label: 'View: Search',
      shortcut: 'Ctrl+Shift+F',
      category: 'View',
      action: () => {
        editorStore.setActiveSidebar('Search');
        if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
      }
    },
    {
      id: 'github',
      label: 'View: Source Control',
      shortcut: 'Ctrl+Shift+G',
      category: 'View',
      action: () => {
        editorStore.setActiveSidebar('GitHub');
        if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
      }
    },
    {
      id: 'npm-scripts',
      label: 'View: NPM Scripts',
      category: 'View',
      action: () => {
        editorStore.setActiveSidebar('NPM');
        if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
      }
    },
    {
      id: 'quick-open',
      label: 'File: Quick Open',
      shortcut: 'Ctrl+P',
      category: 'File',
      action: () => {
        document.dispatchEvent(new CustomEvent('quick-open-toggle'));
      }
    },
    {
      id: 'format',
      label: 'Editor: Format Document',
      shortcut: 'Shift+Alt+F',
      category: 'Editor',
      action: () => {
        document.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'format' } }));
      }
    },
    {
      id: 'run-code',
      label: 'Editor: Run Code',
      shortcut: 'Ctrl+Enter',
      category: 'Editor',
      action: () => {
        if (activeTab) fileOps.runCode(activeTab.id);
      }
    },
    {
      id: 'toggle-word-wrap',
      label: 'Editor: Toggle Word Wrap',
      category: 'Editor',
      action: () => editorStore.toggleWordWrap()
    },
    {
      id: 'increase-font',
      label: 'Editor: Increase Font Size',
      category: 'Editor',
      action: () => editorStore.setFontSize(Math.min(32, editorStore.fontSize + 1))
    },
    {
      id: 'decrease-font',
      label: 'Editor: Decrease Font Size',
      category: 'Editor',
      action: () => editorStore.setFontSize(Math.max(8, editorStore.fontSize - 1))
    },
    {
      id: 'toggle-theme',
      label: 'Preferences: Toggle Theme',
      category: 'Preferences',
      action: () => {
        const newTheme = editorStore.theme === 'dark' ? 'light' : 'dark';
        editorStore.setTheme(newTheme);
      }
    },
    {
      id: 'toggle-auto-save',
      label: 'Preferences: Toggle Auto Save',
      category: 'Preferences',
      action: () => editorStore.toggleAutoSave()
    },
  ];

  const filteredCommands = commands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.id.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (editorStore.commandPaletteVisible) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [editorStore.commandPaletteVisible]);

  const execute = (cmd: Command) => {
    cmd.action();
    editorStore.toggleCommandPalette();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        execute(filteredCommands[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      editorStore.toggleCommandPalette();
    }
  };

  if (!editorStore.commandPaletteVisible) return null;

  return (
    <div
      className="command-palette-overlay"
      onClick={editorStore.toggleCommandPalette}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '50px',
      }}
    >
      <div
        className="command-palette-modal"
        onClick={e => e.stopPropagation()}
        style={{
          width: '600px',
          background: '#252526',
          borderRadius: '6px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '500px',
          border: '1px solid #3c3c3c',
        }}
      >
        <input
          ref={inputRef}
          className="command-input"
          placeholder="Type a command..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          style={{
            background: '#3c3c3c',
            border: 'none',
            padding: '12px 15px',
            color: 'white',
            fontSize: '14px',
            outline: 'none',
            borderBottom: '1px solid #3c3c3c',
          }}
        />
        <div
          className="command-list"
          style={{
            flex: 1,
            overflow: 'auto',
            maxHeight: '400px',
          }}
        >
          {filteredCommands.length === 0 ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: '#888',
                fontSize: '13px',
              }}
            >
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <div
                key={cmd.id}
                className={`command-item ${idx === selectedIndex ? 'selected' : ''}`}
                onClick={() => execute(cmd)}
                style={{
                  padding: '10px 15px',
                  color: idx === selectedIndex ? '#fff' : '#ccc',
                  background: idx === selectedIndex ? '#04395e' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #3c3c3c',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '13px' }}>{cmd.label}</span>
                  {cmd.category && (
                    <span style={{ fontSize: '11px', color: '#888' }}>{cmd.category}</span>
                  )}
                </div>
                {cmd.shortcut && (
                  <span
                    className="shortcut"
                    style={{
                      fontSize: '11px',
                      color: '#888',
                      marginLeft: '20px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cmd.shortcut}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
