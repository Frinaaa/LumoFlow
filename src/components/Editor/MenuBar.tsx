/* 🟢 FULL FILE */
import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';

interface MenuBarProps {
  onNewFile?: () => void;
  onOpenFile?: () => void;
  onOpenFolder?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onSaveAll?: () => void;
  onCloseEditor?: () => void;
  onCloseFolder?: () => void;
  autoSave?: boolean;
  onToggleAutoSave?: () => void;
}

const MenuBar: React.FC<MenuBarProps> = ({
  onNewFile,
  onOpenFile,
  onOpenFolder,
  onSave,
  onSaveAs,
  onSaveAll,
  onCloseEditor,
  onCloseFolder,
  autoSave,
  onToggleAutoSave
}) => {
  const [active, setActive] = useState<string | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const editorContext = useEditor();
  const menus = ['File', 'Edit', 'Selection', 'View', 'Go', 'Run'];

  // Keyboard shortcuts handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N - New File
      if (e.ctrlKey && e.key === 'n' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        onNewFile?.();
      }
      // Ctrl+Shift+N - New Window
      else if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        if (window.api?.newWindow) {
          window.api.newWindow();
        }
      }
      // Ctrl+O - Open File
      else if (e.ctrlKey && e.key === 'o' && !e.shiftKey) {
        e.preventDefault();
        onOpenFile?.();
      }
      // Ctrl+S - Save
      else if (e.ctrlKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        onSave?.();
      }
      // Ctrl+Shift+S - Save As
      else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        onSaveAs?.();
      }
      // Ctrl+F4 - Close Editor
      else if (e.ctrlKey && e.key === 'F4') {
        e.preventDefault();
        onCloseEditor?.();
      }
      // Alt+F4 - Close Window
      else if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        if (window.api?.closeWindow) {
          window.api.closeWindow();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewFile, onOpenFile, onOpenFolder, onSave, onSaveAs, onSaveAll, onCloseEditor]);

  const handleMenuClick = (action: string) => {
    setActive(null);
    
    switch(action) {
      case 'newTextFile':
        onNewFile?.();
        break;
      case 'newFolder':
        // Trigger folder creation through menu action
        if (editorContext.onMenuAction) {
          editorContext.onMenuAction('newFolder');
        }
        break;
      case 'newWindow':
        if (window.api?.newWindow) {
          window.api.newWindow();
        }
        break;
      case 'openFile':
        onOpenFile?.();
        break;
      case 'openFolder':
        onOpenFolder?.();
        break;
      case 'save':
        onSave?.();
        break;
      case 'saveAs':
        onSaveAs?.();
        break;
      case 'saveAll':
        onSaveAll?.();
        break;
      case 'toggleAutoSave':
        onToggleAutoSave?.();
        break;
      case 'themeDark':
        editorContext.setEditorState({ theme: 'dark' });
        localStorage.setItem('theme', 'dark');
        break;
      case 'themeLight':
        editorContext.setEditorState({ theme: 'light' });
        localStorage.setItem('theme', 'light');
        break;
      case 'selectAll':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'selectAll' } }));
        break;
      case 'expandSelection':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'expandSelection' } }));
        break;
      case 'shrinkSelection':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'shrinkSelection' } }));
        break;
      case 'copyLineUp':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'copyLineUp' } }));
        break;
      case 'copyLineDown':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'copyLineDown' } }));
        break;
      case 'moveLineUp':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'moveLineUp' } }));
        break;
      case 'moveLineDown':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'moveLineDown' } }));
        break;
      case 'duplicateSelection':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'duplicateSelection' } }));
        break;
      case 'addCursorAbove':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'addCursorAbove' } }));
        break;
      case 'addCursorBelow':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'addCursorBelow' } }));
        break;
      case 'addCursorsToLineEnds':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'addCursorsToLineEnds' } }));
        break;
      
      // Edit menu actions
      case 'undo':
        console.log('MenuBar: Dispatching undo');
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'undo' } }));
        break;
      case 'redo':
        console.log('MenuBar: Dispatching redo');
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'redo' } }));
        break;
      case 'cut':
        console.log('MenuBar: Dispatching cut');
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'cut' } }));
        break;
      case 'copy':
        console.log('MenuBar: Dispatching copy');
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'copy' } }));
        break;
      case 'paste':
        console.log('MenuBar: Dispatching paste');
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'paste' } }));
        break;
      case 'find':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'find' } }));
        break;
      case 'replace':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'replace' } }));
        break;
      case 'findInFiles':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'findInFiles' } }));
        break;
      case 'toggleComment':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'toggleComment' } }));
        break;
      case 'toggleBlockComment':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'toggleBlockComment' } }));
        break;
      
      // View menu actions
      case 'toggleSidebar':
        if (editorContext.onMenuAction) {
          editorContext.onMenuAction('toggleSidebar');
        }
        break;
      case 'toggleTerminal':
        if (editorContext.onMenuAction) {
          editorContext.onMenuAction('toggleTerminal');
        }
        break;
      case 'toggleWordWrap':
        if (editorContext.onMenuAction) {
          editorContext.onMenuAction('toggleWordWrap');
        }
        break;
      case 'viewProblems':
        if (editorContext.onMenuAction) {
          editorContext.onMenuAction('viewProblems');
        }
        break;
      case 'viewOutput':
        if (editorContext.onMenuAction) {
          editorContext.onMenuAction('viewOutput');
        }
        break;
      
      // Go menu actions
      case 'goBack':
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'goBack' } }));
        break;
      case 'goToLine':
        if (editorContext.onMenuAction) {
          editorContext.onMenuAction('goToLine');
        }
        break;
      
      // Run menu actions
      case 'run':
        if (editorContext.onRun) {
          editorContext.onRun();
        }
        break;
      case 'newTerminal':
        if (editorContext.onMenuAction) {
          editorContext.onMenuAction('newTerminal');
        }
        break;
      
      case 'closeEditor':
        onCloseEditor?.();
        break;
      case 'closeWindow':
        if (window.api?.closeWindow) {
          window.api.closeWindow();
        }
        break;
    }
  };

  return (
    <div style={{display:'flex', gap:'5px'}}>
      {menus.map(m => (
        <div 
          key={m} 
          style={{position:'relative', padding:'0 10px', color:'var(--text-tertiary)', fontSize:'12px', cursor:'pointer', userSelect: 'none'}}
          onMouseEnter={() => active && setActive(m)}
          onClick={() => setActive(active === m ? null : m)}
        >
          {m}
          {active === m && m === 'File' && (
            <div style={{
              position:'absolute', 
              top:'100%', 
              left:0, 
              background:'var(--bg-secondary)', 
              border:'1px solid var(--border-light)', 
              minWidth:'280px', 
              zIndex:10000, 
              padding:'4px 0', 
              boxShadow:'0 10px 20px rgba(0,0,0,0.5)',
              borderRadius: '4px'
            }}>
              <MenuItem onClick={() => handleMenuClick('newTextFile')} shortcut="Ctrl+N">
                New Text File
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('newFolder')} shortcut="Ctrl+Alt+Windows+N">
                New Folder...
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('newWindow')} shortcut="Ctrl+Shift+N">
                New Window
              </MenuItem>
              
              
              <MenuSeparator />
              
              <MenuItem onClick={() => handleMenuClick('openFile')} shortcut="Ctrl+O">
                Open File...
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('openFolder')} shortcut="Ctrl+K Ctrl+O">
                Open Folder...
              </MenuItem>
             
             
              
             
              
              
              
              <MenuSeparator />
              
              <MenuItem onClick={() => handleMenuClick('save')} shortcut="Ctrl+S">
                Save
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('saveAs')} shortcut="Ctrl+Shift+S">
                Save As...
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('saveAll')} shortcut="Ctrl+K S" disabled>
                Save All
              </MenuItem>
              
              <MenuSeparator />
              
              
              
              <MenuSeparator />
              
              <MenuItem onClick={() => handleMenuClick('toggleAutoSave')} checked={autoSave}>
                Auto Save
              </MenuItem>
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => setPreferencesOpen(true)}
                onMouseLeave={() => setPreferencesOpen(false)}
              >
                <MenuItem onClick={() => {}} hasSubmenu>
                  Preferences
                </MenuItem>
                
                {preferencesOpen && (
                  <div style={{
                    position: 'absolute',
                    left: '100%',
                    top: 0,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    minWidth: '200px',
                    padding: '4px 0',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
                    borderRadius: '4px',
                    marginLeft: '-1px'
                  }}>
                    <div style={{
                      padding: '6px 20px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Theme
                    </div>
                    <MenuItem 
                      onClick={() => handleMenuClick('themeDark')}
                      checked={editorContext.theme === 'dark'}
                    >
                      Dark Theme
                    </MenuItem>
                    <MenuItem 
                      onClick={() => handleMenuClick('themeLight')}
                      checked={editorContext.theme === 'light'}
                    >
                      Light Theme
                    </MenuItem>
                  </div>
                )}
              </div>
              
              <MenuSeparator />
             
              <MenuItem onClick={() => handleMenuClick('closeEditor')} shortcut="Ctrl+F4">
                Close Editor
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('closeFolder')}>
                Close Folder
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('closeWindow')} shortcut="Alt+F4">
                Close Window
              </MenuItem>
            </div>
          )}
          
          {/* EDIT */}
          {active === m && m === 'Edit' && (
            <div style={{
              position:'absolute', 
              top:'100%', 
              left:0, 
              background:'var(--bg-secondary)', 
              border:'1px solid var(--border-light)', 
              minWidth:'280px', 
              zIndex:10000, 
              padding:'4px 0', 
              boxShadow:'0 10px 20px rgba(0,0,0,0.5)',
              borderRadius: '4px'
            }}>
              <MenuItem onClick={() => handleMenuClick('undo')} shortcut="Ctrl+Z">
                Undo
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('redo')} shortcut="Ctrl+Y">
                Redo
              </MenuItem>
              
              <MenuSeparator />
              
              <MenuItem onClick={() => handleMenuClick('cut')} shortcut="Ctrl+X">
                Cut
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('copy')} shortcut="Ctrl+C">
                Copy
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('paste')} shortcut="Ctrl+V">
                Paste
              </MenuItem>
              
              <MenuSeparator />
              
              <MenuItem onClick={() => handleMenuClick('find')} shortcut="Ctrl+F">
                Find
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('replace')} shortcut="Ctrl+H">
                Replace
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('findInFiles')} shortcut="Ctrl+Shift+F">
                Find in Files
              </MenuItem>
              
              <MenuSeparator />
              
              <MenuItem onClick={() => handleMenuClick('toggleComment')} shortcut="Ctrl+/">
                Toggle Line Comment
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('toggleBlockComment')} shortcut="Shift+Alt+A">
                Toggle Block Comment
              </MenuItem>
            </div>
          )}
          
          {/* SELECTION */}
          {active === m && m === 'Selection' && (
            <div style={{
              position:'absolute', 
              top:'100%', 
              left:0, 
              background:'var(--bg-secondary)', 
              border:'1px solid var(--border-light)', 
              minWidth:'280px', 
              zIndex:10000, 
              padding:'4px 0', 
              boxShadow:'0 10px 20px rgba(0,0,0,0.5)',
              borderRadius: '4px'
            }}>
              <MenuItem onClick={() => handleMenuClick('selectAll')} shortcut="Ctrl+A">
                Select All
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('expandSelection')} shortcut="Shift+Alt+Right">
                Expand Selection
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('shrinkSelection')} shortcut="Shift+Alt+Left">
                Shrink Selection
              </MenuItem>
              
              <MenuSeparator />
              
              <MenuItem onClick={() => handleMenuClick('copyLineUp')} shortcut="Shift+Alt+Up">
                Copy Line Up
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('copyLineDown')} shortcut="Shift+Alt+Down">
                Copy Line Down
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('moveLineUp')} shortcut="Alt+Up">
                Move Line Up
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('moveLineDown')} shortcut="Alt+Down">
                Move Line Down
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('duplicateSelection')} shortcut="Ctrl+D">
                Duplicate Selection
              </MenuItem>
              
              <MenuSeparator />
              
              <MenuItem onClick={() => handleMenuClick('addCursorAbove')} shortcut="Ctrl+Alt+Up">
                Add Cursor Above
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('addCursorBelow')} shortcut="Ctrl+Alt+Down">
                Add Cursor Below
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('addCursorsToLineEnds')} shortcut="Shift+Alt+I">
                Add Cursors to Line Ends
              </MenuItem>
            </div>
          )}

          {/* VIEW */}
          {active === m && m === 'View' && (
            <div style={{
              position:'absolute', 
              top:'100%', 
              left:0, 
              background:'var(--bg-secondary)', 
              border:'1px solid var(--border-light)', 
              minWidth:'280px', 
              zIndex:10000, 
              padding:'4px 0', 
              boxShadow:'0 10px 20px rgba(0,0,0,0.5)',
              borderRadius: '4px'
            }}>
              <MenuItem onClick={() => handleMenuClick('toggleSidebar')} shortcut="Ctrl+B">Appearance: Sidebar</MenuItem>
              <MenuItem onClick={() => handleMenuClick('toggleTerminal')} shortcut="Ctrl+`">Terminal</MenuItem>
              <MenuItem onClick={() => handleMenuClick('toggleWordWrap')} shortcut="Alt+Z">Word Wrap</MenuItem>
              <MenuSeparator />
              <MenuItem onClick={() => handleMenuClick('viewProblems')}>Problems</MenuItem>
              <MenuItem onClick={() => handleMenuClick('viewOutput')}>Output</MenuItem>
            </div>
          )}

          {/* GO */}
          {active === m && m === 'Go' && (
            <div style={{
              position:'absolute', 
              top:'100%', 
              left:0, 
              background:'var(--bg-secondary)', 
              border:'1px solid var(--border-light)', 
              minWidth:'280px', 
              zIndex:10000, 
              padding:'4px 0', 
              boxShadow:'0 10px 20px rgba(0,0,0,0.5)',
              borderRadius: '4px'
            }}>
              <MenuItem onClick={() => handleMenuClick('goBack')} shortcut="Alt+Left">Back</MenuItem>
              <MenuItem onClick={() => handleMenuClick('goToLine')} shortcut="Ctrl+G">Go to Line/Column...</MenuItem>
            </div>
          )}

          {/* RUN */}
          {active === m && m === 'Run' && (
            <div style={{
              position:'absolute', 
              top:'100%', 
              left:0, 
              background:'var(--bg-secondary)', 
              border:'1px solid var(--border-light)', 
              minWidth:'280px', 
              zIndex:10000, 
              padding:'4px 0', 
              boxShadow:'0 10px 20px rgba(0,0,0,0.5)',
              borderRadius: '4px'
            }}>
              <MenuItem onClick={() => handleMenuClick('run')} shortcut="F5">Start Debugging</MenuItem>
              <MenuItem onClick={() => handleMenuClick('newTerminal')}>New Terminal</MenuItem>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

interface MenuItemProps {
  onClick: () => void;
  shortcut?: string;
  children: React.ReactNode;
  hasSubmenu?: boolean;
  checked?: boolean;
  disabled?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ onClick, shortcut, children, hasSubmenu, checked, disabled }) => {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        padding: '6px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: disabled ? 'var(--text-disabled)' : 'var(--text-secondary)',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: '13px',
        gap: '20px',
        opacity: disabled ? 0.5 : 1
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {checked && <i className="fa-solid fa-check" style={{ fontSize: '10px', width: '12px' }}></i>}
        {!checked && <span style={{ width: '12px' }}></span>}
        <span>{children}</span>
      </div>
      {shortcut && <span style={{ color: 'var(--text-disabled)', fontSize: '11px' }}>{shortcut}</span>}
      {hasSubmenu && <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px', color: 'var(--text-disabled)' }}></i>}
    </div>
  );
};

const MenuSeparator: React.FC = () => {
  return <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }}></div>;
};

export default MenuBar;