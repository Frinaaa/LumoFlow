import React, { useState } from 'react';
import '../../styles/MenuBar.css';

interface MenuBarProps {
  onNewFile: () => void;
  onOpenFile: () => void;
  onOpenFolder: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onSaveAll: () => void;
  onCloseEditor: () => void;
  onCloseFolder: () => void;
  autoSave: boolean;
  onToggleAutoSave: () => void;
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
  onToggleAutoSave,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleMenuClick = (action: () => void, menu: string) => {
    action();
    setOpenMenu(null);
  };

  return (
    <div className="menu-bar">
      <div className="menu-item">
        <button
          className="menu-trigger"
          onClick={() => toggleMenu('file')}
        >
          File
        </button>
        {openMenu === 'file' && (
          <div className="menu-dropdown">
            <div
              className="menu-option"
              onClick={() => handleMenuClick(onNewFile, 'file')}
            >
              <span>New File</span>
              <span className="shortcut">Ctrl+N</span>
            </div>
            <div
              className="menu-option"
              onClick={() => handleMenuClick(onOpenFile, 'file')}
            >
              <span>Open File</span>
              <span className="shortcut">Ctrl+O</span>
            </div>
            <div
              className="menu-option"
              onClick={() => handleMenuClick(onOpenFolder, 'file')}
            >
              <span>Open Folder</span>
              <span className="shortcut">Ctrl+K Ctrl+O</span>
            </div>
            <hr />
            <div
              className="menu-option"
              onClick={() => handleMenuClick(onSave, 'file')}
            >
              <span>Save</span>
              <span className="shortcut">Ctrl+S</span>
            </div>
            <div
              className="menu-option"
              onClick={() => handleMenuClick(onSaveAs, 'file')}
            >
              <span>Save As</span>
              <span className="shortcut">Ctrl+Shift+S</span>
            </div>
            <div
              className="menu-option"
              onClick={() => handleMenuClick(onSaveAll, 'file')}
            >
              <span>Save All</span>
            </div>
            <hr />
            <div
              className="menu-option"
              onClick={() => handleMenuClick(onCloseEditor, 'file')}
            >
              <span>Close Editor</span>
            </div>
            <div
              className="menu-option"
              onClick={() => handleMenuClick(onCloseFolder, 'file')}
            >
              <span>Close Folder</span>
            </div>
          </div>
        )}
      </div>

      <div className="menu-item">
        <button
          className="menu-trigger"
          onClick={() => toggleMenu('edit')}
        >
          Edit
        </button>
        {openMenu === 'edit' && (
          <div className="menu-dropdown">
            <div className="menu-option">
              <span>Undo</span>
              <span className="shortcut">Ctrl+Z</span>
            </div>
            <div className="menu-option">
              <span>Redo</span>
              <span className="shortcut">Ctrl+Y</span>
            </div>
            <hr />
            <div className="menu-option">
              <span>Cut</span>
              <span className="shortcut">Ctrl+X</span>
            </div>
            <div className="menu-option">
              <span>Copy</span>
              <span className="shortcut">Ctrl+C</span>
            </div>
            <div className="menu-option">
              <span>Paste</span>
              <span className="shortcut">Ctrl+V</span>
            </div>
          </div>
        )}
      </div>

      <div className="menu-item">
        <button
          className="menu-trigger"
          onClick={() => toggleMenu('view')}
        >
          View
        </button>
        {openMenu === 'view' && (
          <div className="menu-dropdown">
            <div
              className="menu-option"
              onClick={() => handleMenuClick(onToggleAutoSave, 'view')}
            >
              <span>
                {autoSave ? '✓' : ''} Auto Save
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuBar;
