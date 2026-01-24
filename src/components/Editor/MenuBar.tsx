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
  autoSave,
  onToggleAutoSave
}) => {
  const [active, setActive] = useState<string | null>(null);
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
      case 'newFile':
        onNewFile?.();
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
          style={{position:'relative', padding:'0 10px', color:'#999', fontSize:'12px', cursor:'pointer', userSelect: 'none'}}
          onMouseEnter={() => active && setActive(m)}
          onClick={() => setActive(active === m ? null : m)}
        >
          {m}
          {active === m && m === 'File' && (
            <div style={{
              position:'absolute', 
              top:'100%', 
              left:0, 
              background:'#252526', 
              border:'1px solid #454545', 
              minWidth:'280px', 
              zIndex:10000, 
              padding:'4px 0', 
              boxShadow:'0 10px 20px rgba(0,0,0,0.5)',
              borderRadius: '4px'
            }}>
              <MenuItem onClick={() => handleMenuClick('newFile')} shortcut="Ctrl+N">
                New Text File
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('newFile')} shortcut="Ctrl+Alt+Windows+N">
                New File...
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('newWindow')} shortcut="Ctrl+Shift+N">
                New Window
              </MenuItem>
              <MenuItem onClick={() => {}} hasSubmenu>
                New Window with Profile
              </MenuItem>
              
              <MenuSeparator />
              
              <MenuItem onClick={() => handleMenuClick('openFile')} shortcut="Ctrl+O">
                Open File...
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('openFolder')} shortcut="Ctrl+K Ctrl+O">
                Open Folder...
              </MenuItem>
              <MenuItem onClick={() => {}}>
                Open Workspace from File...
              </MenuItem>
              <MenuItem onClick={() => {}} hasSubmenu>
                Open Recent
              </MenuItem>
              
              <MenuSeparator />
              
              <MenuItem onClick={() => {}}>
                Add Folder to Workspace...
              </MenuItem>
              <MenuItem onClick={() => {}}>
                Save Workspace As...
              </MenuItem>
              <MenuItem onClick={() => {}}>
                Duplicate Workspace
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
              
              <MenuItem onClick={() => {}} hasSubmenu>
                Share
              </MenuItem>
              
              <MenuSeparator />
              
              <MenuItem onClick={() => handleMenuClick('toggleAutoSave')} checked={autoSave}>
                Auto Save
              </MenuItem>
              <MenuItem onClick={() => {}} hasSubmenu>
                Preferences
              </MenuItem>
              
              <MenuSeparator />
              
              <MenuItem onClick={() => {}}>
                Revert File
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('closeEditor')} shortcut="Ctrl+F4">
                Close Editor
              </MenuItem>
              <MenuItem onClick={() => {}}>
                Close Folder
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick('closeWindow')} shortcut="Alt+F4">
                Close Window
              </MenuItem>
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
        color: disabled ? '#666' : '#ccc',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: '13px',
        gap: '20px',
        opacity: disabled ? 0.5 : 1
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = '#2a2d2e')}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {checked && <i className="fa-solid fa-check" style={{ fontSize: '10px', width: '12px' }}></i>}
        {!checked && <span style={{ width: '12px' }}></span>}
        <span>{children}</span>
      </div>
      {shortcut && <span style={{ color: '#666', fontSize: '11px' }}>{shortcut}</span>}
      {hasSubmenu && <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px', color: '#666' }}></i>}
    </div>
  );
};

const MenuSeparator: React.FC = () => {
  return <div style={{ height: '1px', background: '#454545', margin: '4px 0' }}></div>;
};

export default MenuBar;