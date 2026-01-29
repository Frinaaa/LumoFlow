import React, { useState } from 'react';
import { useEditorStore } from '../stores/editorStore';
import '../styles/MenuBar.css';

interface MenuBarProps {
  onNewFile: () => void;
  onNewFolder?: () => void;
  onOpenFile: () => void;
  onOpenFolder: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onSaveAll: () => void;
  onCloseEditor: () => void;
  onCloseFolder: () => void;
  onNewWindow: () => void;
  onCloseWindow: () => void;
  autoSave: boolean;
  onToggleAutoSave: () => void;
  onRun?: () => void;
}

const MenuBar: React.FC<MenuBarProps> = ({
  onNewFile,
  onNewFolder,
  onOpenFile,
  onOpenFolder,
  onSave,
  onSaveAs,
  onSaveAll,
  onCloseEditor,
  onCloseFolder,
  onNewWindow,
  onCloseWindow,
  autoSave,
  onToggleAutoSave,
  onRun,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const editorStore = useEditorStore();

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleMenuClick = (action: () => void) => {
    action();
    setOpenMenu(null);
  };

  const dispatchMonacoCmd = (action: string, value?: any) => {
    window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action, value } }));
    setOpenMenu(null);
  };

  return (
    <div className="menu-bar">
      {/* FILE */}
      <div className={`menu-item ${openMenu === 'file' ? 'active' : ''}`}>
        <button className="menu-trigger" onMouseEnter={() => openMenu && setOpenMenu('file')} onClick={() => toggleMenu('file')}>File</button>
        {openMenu === 'file' && (
          <div className="menu-dropdown">
            <div className="menu-option" onClick={() => handleMenuClick(onNewFile)}><span>New Text File</span><span className="shortcut">Ctrl+N</span></div>
            <div className="menu-option" onClick={() => handleMenuClick(onNewFolder || (() => { }))}><span>New Folder...</span><span className="shortcut">Ctrl+Alt+N</span></div>
            <div className="menu-option" onClick={() => handleMenuClick(onNewWindow)}><span>New Window</span><span className="shortcut">Ctrl+Shift+N</span></div>
            <hr />
            <div className="menu-option" onClick={() => handleMenuClick(onOpenFile)}><span>Open File...</span><span className="shortcut">Ctrl+O</span></div>
            <div className="menu-option" onClick={() => handleMenuClick(onOpenFolder)}><span>Open Folder...</span><span className="shortcut">Ctrl+K Ctrl+O</span></div>
            <hr />
            <div className="menu-option" onClick={() => handleMenuClick(onSave)}><span>Save</span><span className="shortcut">Ctrl+S</span></div>
            <div className="menu-option" onClick={() => handleMenuClick(onSaveAs)}><span>Save As...</span><span className="shortcut">Ctrl+Shift+S</span></div>
            <div className="menu-option" onClick={() => handleMenuClick(onSaveAll)}><span>Save All</span></div>
            <hr />
            <div className="menu-option" onClick={() => handleMenuClick(onToggleAutoSave)}><span>Auto Save</span><span className="shortcut">{autoSave ? '✓' : ''}</span></div>
            <hr />
            <div className="menu-option" onClick={() => handleMenuClick(onCloseEditor)}><span>Close Editor</span><span className="shortcut">Ctrl+W</span></div>
            <div className="menu-option" onClick={() => handleMenuClick(onCloseFolder)}><span>Close Folder</span><span className="shortcut">Ctrl+K F</span></div>
            <hr />
            <div className="menu-option" onClick={() => handleMenuClick(onCloseWindow)}><span>Exit</span><span className="shortcut">Alt+F4</span></div>
          </div>
        )}
      </div>

      {/* EDIT */}
      <div className={`menu-item ${openMenu === 'edit' ? 'active' : ''}`}>
        <button className="menu-trigger" onMouseEnter={() => openMenu && setOpenMenu('edit')} onClick={() => toggleMenu('edit')}>Edit</button>
        {openMenu === 'edit' && (
          <div className="menu-dropdown">
            <div className="menu-option" onClick={() => dispatchMonacoCmd('undo')}><span>Undo</span><span className="shortcut">Ctrl+Z</span></div>
            <div className="menu-option" onClick={() => dispatchMonacoCmd('redo')}><span>Redo</span><span className="shortcut">Ctrl+Y</span></div>
            <hr />
            <div className="menu-option" onClick={() => dispatchMonacoCmd('cut')}><span>Cut</span><span className="shortcut">Ctrl+X</span></div>
            <div className="menu-option" onClick={() => dispatchMonacoCmd('copy')}><span>Copy</span><span className="shortcut">Ctrl+C</span></div>
            <div className="menu-option" onClick={() => dispatchMonacoCmd('paste')}><span>Paste</span><span className="shortcut">Ctrl+V</span></div>
            <hr />
            <div className="menu-option" onClick={() => { window.dispatchEvent(new CustomEvent('toggle-find-replace', { detail: { mode: 'find' } })); setOpenMenu(null); }}><span>Find</span><span className="shortcut">Ctrl+F</span></div>
            <div className="menu-option" onClick={() => { window.dispatchEvent(new CustomEvent('toggle-find-replace', { detail: { mode: 'replace' } })); setOpenMenu(null); }}><span>Replace</span><span className="shortcut">Ctrl+H</span></div>
          </div>
        )}
      </div>

      {/* SELECTION */}
      <div className={`menu-item ${openMenu === 'selection' ? 'active' : ''}`}>
        <button className="menu-trigger" onMouseEnter={() => openMenu && setOpenMenu('selection')} onClick={() => toggleMenu('selection')}>Selection</button>
        {openMenu === 'selection' && (
          <div className="menu-dropdown">
            <div className="menu-option" onClick={() => dispatchMonacoCmd('selectAll')}><span>Select All</span><span className="shortcut">Ctrl+A</span></div>
            <div className="menu-option" onClick={() => dispatchMonacoCmd('expandSelection')}><span>Expand Selection</span><span className="shortcut">Shift+Alt+Right</span></div>
            <div className="menu-option" onClick={() => dispatchMonacoCmd('shrinkSelection')}><span>Shrink Selection</span><span className="shortcut">Shift+Alt+Left</span></div>
            <hr />
            <div className="menu-option" onClick={() => dispatchMonacoCmd('copyLineUp')}><span>Copy Line Up</span><span className="shortcut">Shift+Alt+Up</span></div>
            <div className="menu-option" onClick={() => dispatchMonacoCmd('copyLineDown')}><span>Copy Line Down</span><span className="shortcut">Shift+Alt+Down</span></div>
          </div>
        )}
      </div>

      {/* VIEW */}
      <div className={`menu-item ${openMenu === 'view' ? 'active' : ''}`}>
        <button className="menu-trigger" onMouseEnter={() => openMenu && setOpenMenu('view')} onClick={() => toggleMenu('view')}>View</button>
        {openMenu === 'view' && (
          <div className="menu-dropdown">
            <div className="menu-option" onClick={() => { editorStore.toggleCommandPalette(); setOpenMenu(null); }}><span>Command Palette...</span><span className="shortcut">Ctrl+Shift+P</span></div>
            <hr />
            <div className="menu-option" onClick={() => { editorStore.toggleSidebar(); setOpenMenu(null); }}><span>Appearance: Toggle Primary Sidebar</span><span className="shortcut">Ctrl+B</span></div>
            <div className="menu-option" onClick={() => { editorStore.toggleTerminal(); setOpenMenu(null); }}><span>Appearance: Toggle Panel</span><span className="shortcut">Ctrl+`</span></div>
            <hr />
            <div className="menu-option" onClick={() => {
              editorStore.setActiveSidebar('Explorer');
              if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
              setOpenMenu(null);
            }}><span>Explorer</span><span className="shortcut">Ctrl+Shift+E</span></div>
            <div className="menu-option" onClick={() => {
              editorStore.setActiveSidebar('Search');
              if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
              setOpenMenu(null);
            }}><span>Search</span><span className="shortcut">Ctrl+Shift+F</span></div>
            <div className="menu-option" onClick={() => {
              editorStore.setActiveSidebar('Git');
              if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
              setOpenMenu(null);
            }}><span>Source Control</span><span className="shortcut">Ctrl+Shift+G</span></div>
          </div>
        )}
      </div>

      {/* GO */}
      <div className={`menu-item ${openMenu === 'go' ? 'active' : ''}`}>
        <button className="menu-trigger" onMouseEnter={() => openMenu && setOpenMenu('go')} onClick={() => toggleMenu('go')}>Go</button>
        {openMenu === 'go' && (
          <div className="menu-dropdown">
            <div className="menu-option" onClick={() => dispatchMonacoCmd('goBack')}><span>Back</span><span className="shortcut">Alt+Left</span></div>
            <div className="menu-option" onClick={() => dispatchMonacoCmd('goForward')}><span>Forward</span><span className="shortcut">Alt+Right</span></div>
            <hr />
            <div className="menu-option" onClick={() => { window.dispatchEvent(new CustomEvent('quick-open-toggle')); setOpenMenu(null); }}><span>Go to File...</span><span className="shortcut">Ctrl+P</span></div>
          </div>
        )}
      </div>

      {/* RUN */}
      <div className={`menu-item ${openMenu === 'run' ? 'active' : ''}`}>
        <button className="menu-trigger" onMouseEnter={() => openMenu && setOpenMenu('run')} onClick={() => toggleMenu('run')}>Run</button>
        {openMenu === 'run' && (
          <div className="menu-dropdown">
            <div className="menu-option" onClick={() => { onRun?.(); setOpenMenu(null); }}><span>Start Debugging</span><span className="shortcut">F5</span></div>
            <div className="menu-option" onClick={() => { onRun?.(); setOpenMenu(null); }}><span>Run Without Debugging</span><span className="shortcut">Ctrl+F5</span></div>
            <div className="menu-option" onClick={() => setOpenMenu(null)} style={{ opacity: 0.5 }}><span>Stop Debugging</span><span className="shortcut">Shift+F5</span></div>
            <div className="menu-option" onClick={() => { onRun?.(); setOpenMenu(null); }}><span>Restart Debugging</span><span className="shortcut">Ctrl+Shift+F5</span></div>
            <hr />
            <div className="menu-option" onClick={() => setOpenMenu(null)}><span>Open Configurations</span></div>
            <div className="menu-option" onClick={() => setOpenMenu(null)}><span>Add Configuration...</span></div>
            <hr />
            <div className="menu-option" onClick={() => dispatchMonacoCmd('toggleBreakpoint')}><span>Toggle Breakpoint</span><span className="shortcut">F9</span></div>
            <div className="menu-option" onClick={() => setOpenMenu(null)} style={{ opacity: 0.5 }}><span>New Breakpoint</span></div>
          </div>
        )}
      </div>

      {/* Invisible backdrop to close menus when clicking outside */}
      {openMenu && (
        <div
          onClick={() => setOpenMenu(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
        />
      )}
    </div>
  );
};

export default MenuBar;
