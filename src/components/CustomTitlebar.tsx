/* 🟢 FULL FILE */
import React from 'react';
import MenuBar from './Editor/MenuBar';
import { useEditor } from '../context/EditorContext';
import '../styles/CustomTitlebar.css';

interface CustomTitlebarProps {
  workspaceFolderName?: string;
}

const CustomTitlebar: React.FC<CustomTitlebarProps> = ({ workspaceFolderName }) => {
  const editorState = useEditor();

  const handleMinimize = async () => {
    try {
      if (window.api && window.api.minimizeWindow) {
        await window.api.minimizeWindow();
      }
    } catch (error) {
      console.error('Error minimizing window:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      if (window.api && window.api.maximizeWindow) {
        await window.api.maximizeWindow();
      }
    } catch (error) {
      console.error('Error maximizing window:', error);
    }
  };

  const handleClose = async () => {
    try {
      if (window.api && window.api.closeWindow) {
        await window.api.closeWindow();
      }
    } catch (error) {
      console.error('Error closing window:', error);
    }
  };

  const handleNewFile = () => {
    editorState.onMenuAction?.('newTextFile');
  };

  const handleOpenFile = async () => {
    editorState.onMenuAction?.('openFile');
  };

  const handleOpenFolder = async () => {
    editorState.onMenuAction?.('openFolder');
  };

  const handleSave = () => {
    editorState.onSave?.();
  };

  const handleSaveAs = async () => {
    try {
      editorState.onMenuAction?.('saveAs');
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const handleToggleAutoSave = () => {
    editorState.onMenuAction?.('toggleAutoSave');
  };

  return (
    <div className="vs-titlebar-layout">
      {/* LEFT: BRAND & MENUS */}
      <div className="title-left">
        <i className="fa-solid fa-bolt bolt-cyan"></i>
        <span className="lumo-logo-text">
          {workspaceFolderName ? workspaceFolderName.toUpperCase() : 'LUMO'}
          <span>{workspaceFolderName ? '' : 'FLOW'}</span>
        </span>
        <MenuBar 
          onNewFile={handleNewFile}
          onOpenFile={handleOpenFile}
          onOpenFolder={handleOpenFolder}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onSaveAll={() => {}}
          onCloseEditor={() => editorState.onMenuAction?.('closeEditor')}
          onCloseFolder={() => editorState.onMenuAction?.('closeFolder')}
          autoSave={editorState.autoSave}
          onToggleAutoSave={handleToggleAutoSave}
        />
      </div>

      {/* CENTER: VS CODE SEARCH */}
      <div className="title-center">
        <div className="vs-search-container">
          <i className="fa-solid fa-magnifying-glass"></i>
          <span>LumoFlow IDE - Search files and learn...</span>
        </div>
      </div>

      {/* RIGHT: ACTIONS & CONTROLS */}
      <div className="title-right">
        <div className="btn-group">
          <button className="btn-analyze" onClick={editorState.onAnalyze}>
            <i className="fa-solid fa-microchip"></i> Analyze
          </button>
          <button className="btn-run" onClick={editorState.onRun}>
            <i className="fa-solid fa-play"></i> Run
          </button>
        </div>
        <div className="vs-window-buttons">
          <i className="fa-solid fa-minus" onClick={handleMinimize} title="Minimize"></i>
          <i className="fa-regular fa-square" onClick={handleMaximize} title="Maximize"></i>
          <i className="fa-solid fa-xmark close-hover" onClick={handleClose} title="Close"></i>
        </div>
      </div>
    </div>
  );
};

export default CustomTitlebar;