import React, { useState, useEffect, useRef } from 'react';
import '../../styles/MenuBar.css'; // We will create this CSS next

interface MenuBarProps {
  onAction: (action: string) => void;
}

const MenuBar: React.FC<MenuBarProps> = ({ onAction }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handleAction = (action: string) => {
    onAction(action);
    setActiveMenu(null);
  };

  return (
    <div className="custom-menubar" ref={menuRef}>
      {/* MENU ITEMS */}
      <div className="menu-trigger-container">
        
        {/* FILE MENU */}
        <div className={`menu-item ${activeMenu === 'File' ? 'active' : ''}`}>
          <span onClick={() => handleMenuClick('File')}>File</span>
          {activeMenu === 'File' && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => handleAction('newFile')}>
                <span>New Text File</span> <span className="shortcut">Ctrl+N</span>
              </div>
              <div className="dropdown-item" onClick={() => handleAction('newFile')}>
                <span>New File...</span> <span className="shortcut">Ctrl+Alt+N</span>
              </div>
              <div className="separator"></div>
              <div className="dropdown-item" onClick={() => handleAction('save')}>
                <span>Save</span> <span className="shortcut">Ctrl+S</span>
              </div>
              <div className="separator"></div>
              <div className="dropdown-item" onClick={() => handleAction('closeFile')}>
                <span>Close Editor</span> <span className="shortcut">Ctrl+F4</span>
              </div>
              <div className="dropdown-item" onClick={() => handleAction('exit')}>
                <span>Exit</span> <span className="shortcut">Alt+F4</span>
              </div>
            </div>
          )}
        </div>

        {/* EDIT MENU */}
        <div className={`menu-item ${activeMenu === 'Edit' ? 'active' : ''}`}>
          <span onClick={() => handleMenuClick('Edit')}>Edit</span>
          {activeMenu === 'Edit' && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => handleAction('undo')}>
                <span>Undo</span> <span className="shortcut">Ctrl+Z</span>
              </div>
              <div className="dropdown-item" onClick={() => handleAction('redo')}>
                <span>Redo</span> <span className="shortcut">Ctrl+Y</span>
              </div>
              <div className="separator"></div>
              <div className="dropdown-item" onClick={() => handleAction('cut')}>
                <span>Cut</span> <span className="shortcut">Ctrl+X</span>
              </div>
              <div className="dropdown-item" onClick={() => handleAction('copy')}>
                <span>Copy</span> <span className="shortcut">Ctrl+C</span>
              </div>
              <div className="dropdown-item" onClick={() => handleAction('paste')}>
                <span>Paste</span> <span className="shortcut">Ctrl+V</span>
              </div>
            </div>
          )}
        </div>

        {/* VIEW MENU */}
        <div className={`menu-item ${activeMenu === 'View' ? 'active' : ''}`}>
          <span onClick={() => handleMenuClick('View')}>View</span>
          {activeMenu === 'View' && (
            <div className="dropdown-menu">
              {/* 🟢 NEW OPTION */}
              <div className="dropdown-item" onClick={() => handleAction('splitEditor')}>
                <span>Split Editor</span> <span className="shortcut">Ctrl+\</span>
              </div>
              <div className="separator"></div>
              <div className="dropdown-item" onClick={() => handleAction('toggleTerminal')}>
                <span>Terminal</span> <span className="shortcut">Ctrl+`</span>
              </div>
            </div>
          )}
        </div>

        {/* RUN MENU */}
        <div className={`menu-item ${activeMenu === 'Run' ? 'active' : ''}`}>
          <span onClick={() => handleMenuClick('Run')}>Run</span>
          {activeMenu === 'Run' && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => handleAction('run')}>
                <span>Run Without Debugging</span> <span className="shortcut">Ctrl+Enter</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MenuBar;