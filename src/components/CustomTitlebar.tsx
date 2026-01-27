/* 🟢 FULL FILE */
import React from 'react';
import MenuBar from '../editor/components/MenuBar';
import { useEditor } from '../context/EditorContext';
import { useAnalysisStore } from '../editor/stores/analysisStore';
import { useEditorStore } from '../editor/stores/editorStore';
import '../styles/CustomTitlebar.css';

interface CustomTitlebarProps {
  workspaceFolderName?: string;
}

const CustomTitlebar: React.FC<CustomTitlebarProps> = ({ workspaceFolderName }) => {
  const editorState = useEditor();
  const analysisStore = useAnalysisStore();
  const { activeTabId, tabs } = useEditorStore();

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

  const handleCloseFolder = async () => {
    try {
      if (editorState.onMenuAction) {
        editorState.onMenuAction('closeFolder');
      }
      // Also call the API to close workspace if needed
      if (window.api && window.api.closeWorkspace) {
        await window.api.closeWorkspace();
      }
    } catch (error) {
      console.error('Error closing folder:', error);
    }
  };

  const handleAnalyze = async () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    analysisStore.setAnalyzing(true);
    analysisStore.togglePanel();

    try {
      const result = await (window as any).api.analyzeCode({
        code: activeTab.content,
        language: activeTab.language,
      });

      if (result.success) {
        analysisStore.setAnalysisData(result.analysis || result.data);
      }
    } catch (e) {
      console.error('Analysis error:', e);
    } finally {
      analysisStore.setAnalyzing(false);
    }
  };

  return (
    <div className="vs-titlebar-layout">
      {/* LEFT: BRAND & MENUS */}
      <div className="title-left">
        <i className="fa-solid fa-bolt bolt-cyan"></i>
        <span className="lumo-logo-text">
          LUMO<span>FLOW</span>
        </span>
        
        
        
        <MenuBar 
          onNewFile={handleNewFile}
          onOpenFile={handleOpenFile}
          onOpenFolder={handleOpenFolder}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onSaveAll={() => {}}
          onCloseEditor={() => editorState.onMenuAction?.('closeEditor')}
          onCloseFolder={handleCloseFolder}
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
          <button className="btn-analyze" onClick={handleAnalyze}>
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

      {/* Show folder name if opened */}
      
    </div>
  );
};

export default CustomTitlebar;