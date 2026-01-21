import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEditor } from '../context/EditorContext';
import '../styles/CustomTitlebar.css';

const CustomTitlebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editorState = useEditor();
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if we're in EditorScreen
  const isEditorScreen = location.pathname === '/editor';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMinimize = async () => {
    console.log('🔵 Minimize button clicked!');
    try {
      if (window.api && window.api.minimizeWindow) {
        console.log('🔵 Calling window.api.minimizeWindow...');
        const result = await window.api.minimizeWindow();
        console.log('🔵 Minimize result:', result);
      } else {
        console.error('❌ window.api.minimizeWindow not available');
        alert('Minimize function not available. Are you running in Electron?');
      }
    } catch (error: any) {
      console.error('❌ Error minimizing window:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleMaximize = async () => {
    console.log('🔵 Maximize button clicked!');
    try {
      if (window.api && window.api.maximizeWindow) {
        console.log('🔵 Calling window.api.maximizeWindow...');
        const result = await window.api.maximizeWindow();
        console.log('🔵 Maximize result:', result);
        setIsMaximized(!isMaximized);
      } else {
        console.error('❌ window.api.maximizeWindow not available');
      }
    } catch (error: any) {
      console.error('❌ Error maximizing window:', error);
    }
  };

  const handleClose = async () => {
    console.log('🔵 Close button clicked!');
    try {
      if (window.api && window.api.closeWindow) {
        console.log('🔵 Calling window.api.closeWindow...');
        await window.api.closeWindow();
      } else {
        console.error('❌ window.api.closeWindow not available');
      }
    } catch (error: any) {
      console.error('❌ Error closing window:', error);
    }
  };

  const triggerAction = (action: string) => {
    if (editorState.onMenuAction) {
      editorState.onMenuAction(action);
    }
    setActiveMenu(null);
  };

  return (
    <div className="custom-titlebar">
      <div className="titlebar-left">
        <div className="titlebar-icon">
          <i className="fa-solid fa-bolt"></i>
        </div>
        <div className="titlebar-brand">
          LUMO<span style={{ color: '#00f2ff' }}>FLOW</span>
        </div>

        {/* Menu Bar - Only show in EditorScreen */}
        {isEditorScreen && (
          <div className="titlebar-menubar" ref={menuRef}>
            {/* FILE MENU */}
            <div className={`menu-trigger ${activeMenu === 'File' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'File' ? null : 'File')}>
              <span>File</span>
              {activeMenu === 'File' && (
                <div className="header-dropdown">
                  <div onClick={() => triggerAction('newFolder')}>New Folder <span className="sc">Ctrl+N</span></div>
                  <div onClick={() => triggerAction('newFile')}>New File... <span className="sc">Ctrl+Alt+N</span></div>
                  <div onClick={() => triggerAction('newWindow')}>New Window <span className="sc">Ctrl+Shift+N</span></div>
                  <div className="h-sep"></div>
                  <div onClick={() => triggerAction('openFile')}>Open File... <span className="sc">Ctrl+O</span></div>
                  <div onClick={() => triggerAction('openFolder')}>Open Folder... <span className="sc">Ctrl+K Ctrl+O</span></div>
                  <div className="h-sep"></div>
                  <div onClick={() => triggerAction('save')}>Save <span className="sc">Ctrl+S</span></div>
                  <div onClick={() => triggerAction('saveAs')}>Save As... <span className="sc">Ctrl+Shift+S</span></div>
                  <div onClick={() => triggerAction('saveAll')}>Save All <span className="sc">Ctrl+K S</span></div>
                  <div className="h-sep"></div>
                  <div onClick={() => triggerAction('toggleAutoSave')}>
                     {editorState.autoSave && <i className="fa-solid fa-check" style={{marginRight: '8px', color: 'white'}}></i>}
                     Auto Save
                  </div>
                  <div className="h-sep"></div>
                  <div onClick={() => triggerAction('closeFile')}>Close Editor <span className="sc">Ctrl+F4</span></div>
                  <div onClick={() => triggerAction('exit')}>Close Window <span className="sc">Alt+F4</span></div>
                </div>
              )}
            </div>

            {/* EDIT MENU */}
            <div className={`menu-trigger ${activeMenu === 'Edit' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'Edit' ? null : 'Edit')}>
              <span>Edit</span>
              {activeMenu === 'Edit' && (
                <div className="header-dropdown">
                  <div onClick={() => triggerAction('undo')}>Undo <span className="sc">Ctrl+Z</span></div>
                  <div onClick={() => triggerAction('redo')}>Redo <span className="sc">Ctrl+Y</span></div>
                  <div className="h-sep"></div>
                  <div onClick={() => triggerAction('cut')}>Cut <span className="sc">Ctrl+X</span></div>
                  <div onClick={() => triggerAction('copy')}>Copy <span className="sc">Ctrl+C</span></div>
                  <div onClick={() => triggerAction('paste')}>Paste <span className="sc">Ctrl+V</span></div>
                </div>
              )}
            </div>

            {/* VIEW MENU */}
            <div className={`menu-trigger ${activeMenu === 'View' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'View' ? null : 'View')}>
              <span>View</span>
              {activeMenu === 'View' && (
                <div className="header-dropdown">
                  <div onClick={() => triggerAction('splitEditor')}>Split Editor <span className="sc">Ctrl+\</span></div>
                  <div onClick={() => triggerAction('toggleTerminal')}>Toggle Terminal <span className="sc">Ctrl+`</span></div>
                  <div className="h-sep"></div>
                  <div onClick={editorState.onAnalyze}>Toggle Analysis</div>
                </div>
              )}
            </div>

            {/* DEVELOPER MENU */}
            <div className={`menu-trigger ${activeMenu === 'Developer' ? 'active' : ''}`} onClick={() => setActiveMenu(activeMenu === 'Developer' ? null : 'Developer')}>
              <span>Developer</span>
              {activeMenu === 'Developer' && (
                <div className="header-dropdown">
                  <div onClick={() => triggerAction('toggleDevTools')}>Toggle DevTools <span className="sc">Ctrl+Shift+I</span></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="titlebar-right">
        {/* Action Buttons - Only show in EditorScreen */}
        {isEditorScreen && (
          <div className="titlebar-actions">
            {editorState.autoSave && (
              <div className="auto-save-indicator">
                <i className={`fa-solid ${editorState.isAutoSaving ? 'fa-spinner fa-spin' : 'fa-check'}`}></i>
                {editorState.isAutoSaving ? 'Auto-saving...' : 'Auto-save'}
              </div>
            )}
            <button className="btn-analyze" onClick={editorState.onAnalyze}>
              <i className="fa-solid fa-microchip"></i> {editorState.isAnalysisMode ? 'Close' : 'Analyze'}
            </button>
            <button className="btn-run" onClick={editorState.onRun}>
               <i className="fa-solid fa-play"></i> Run
            </button>
          </div>
        )}

        {/* Window Controls */}
        <button className="titlebar-btn minimize" onClick={handleMinimize} title="Minimize">
          <i className="fa-solid fa-minus"></i>
        </button>
        <button className="titlebar-btn maximize" onClick={handleMaximize} title="Maximize">
          <i className={`fa-solid ${isMaximized ? 'fa-window-restore' : 'fa-square'}`}></i>
        </button>
        <button className="titlebar-btn close" onClick={handleClose} title="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  );
};

export default CustomTitlebar;
