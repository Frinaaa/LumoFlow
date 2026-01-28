import React from 'react';
import MenuBar from '../MenuBar';
import { useEditor } from '../../../context/EditorContext';
import { useEditorStore, useAnalysisStore } from '../../stores';
import { useWindowControls } from '../../../hooks/useWindowControls';
import '../../styles/CustomTitlebar.css';

interface CustomTitlebarProps {
  workspaceFolderName?: string;
}

const CustomTitlebar: React.FC<CustomTitlebarProps> = ({ workspaceFolderName }) => {
  const { minimize, maximize, close } = useWindowControls();
  const editorState = useEditor();
  const analysisStore = useAnalysisStore();
  const editorStore = useEditorStore();
  const { activeTabId, tabs, toggleCommandPalette, toggleSidebar, toggleTerminal } = editorStore;
  const activeTab = tabs.find(t => t.id === activeTabId);

  // src/components/CustomTitlebar.tsx

  const handleAnalyze = async () => {
    console.log("🔍 Analyze button clicked");

    // 1. Get the current active tab and its content
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) {
      console.warn("⚠️ No active file to analyze");
      return;
    }

    console.log(`📄 Analyzing file: ${activeTab.fileName} (${activeTab.language})`);

    // 2. Start the loading state and open the panel
    analysisStore.setAnalyzing(true);

    // If the panel is closed, open it
    if (!analysisStore.isVisible) {
      analysisStore.togglePanel();
    }

    try {
      // 3. Call the Electron Backend
      const result = await (window as any).api.analyzeCode({
        code: activeTab.content,
        language: activeTab.language,
      });

      console.log("📊 Analysis result:", result);

      if (result.success) {
        // 4. Send results to the store
        analysisStore.setAnalysisData(result.analysis);
      } else {
        console.error("❌ Analysis failed:", result.msg);
      }
    } catch (e) {
      console.error("💥 IPC Error during analysis:", e);
    } finally {
      // 5. Stop the loading spinner
      analysisStore.setAnalyzing(false);
    }
  };
  return (
    <div className="vs-titlebar-container">
      {/* 1. LEFT SECTION: Logo and MenuBar */}
      <div className="titlebar-section left">
        <div className="titlebar-logo">
          <i className="fa-solid fa-bolt"></i>
          <span className="logo-text">LUMO<span>FLOW</span></span>
        </div>
        <div className="titlebar-menu-wrapper">
          <MenuBar
            onNewFile={() => editorState.onMenuAction?.('newTextFile')}
            onOpenFile={() => editorState.onMenuAction?.('openFile')}
            onOpenFolder={() => editorState.onMenuAction?.('openFolder')}
            onSave={() => editorState.onSave?.()}
            onSaveAs={() => editorState.onMenuAction?.('saveAs')}
            onSaveAll={() => editorState.onMenuAction?.('saveAll')}
            onCloseEditor={() => editorState.onMenuAction?.('closeEditor')}
            onCloseFolder={() => editorState.onMenuAction?.('closeFolder')}
            onNewWindow={() => editorState.onMenuAction?.('newWindow')}
            onCloseWindow={() => editorState.onMenuAction?.('closeWindow')}
            autoSave={editorState.autoSave}
            onToggleAutoSave={() => editorState.onMenuAction?.('toggleAutoSave')}
            onRun={editorState.onRun}
          />
        </div>
      </div>

      {/* 2. CENTER SECTION: Search / Command Palette */}
      <div className="titlebar-section center">
        <div className="titlebar-search" onClick={toggleCommandPalette} title="Search files (Ctrl+P)">
          <i className="fa-solid fa-magnifying-glass"></i>
          <span>
            {activeTab ? (
              <span className="active-file">{activeTab.fileName}</span>
            ) : null}
            <span className="search-placeholder">
              {activeTab ? ' — ' : ''}Search files and commands (Ctrl+P)
            </span>
          </span>
        </div>
      </div>

      {/* 3. RIGHT SECTION: Action Buttons + Layout Toggles + Window Controls */}
      <div className="titlebar-section right">
        <div className="action-btns">
          <button
            className="purple-btn analyze"
            onClick={handleAnalyze}
            disabled={analysisStore.isAnalyzing || !activeTab}
            title="Analyze current file"
          >
            {analysisStore.isAnalyzing ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <i className="fa-solid fa-microchip"></i>
            )}
            <span>Analyze</span>
          </button>
          <button
            className="purple-btn run"
            onClick={editorState.onRun}
            disabled={!activeTab}
            title="Run current file (Ctrl+Enter)"
          >
            <i className="fa-solid fa-play"></i>
            <span>Run</span>
          </button>
        </div>

        {/* Layout Toggles */}
        <div style={{ display: 'flex', gap: '5px', marginRight: '10px', color: '#ccc' }}>
          <div
            className="control-btn small"
            onClick={toggleSidebar}
            title="Toggle Primary Sidebar (Ctrl+B)"
          >
            <i className="fa-solid fa-columns" style={{ transform: 'rotate(0deg)' }}></i>
          </div>
          <div
            className="control-btn small"
            onClick={toggleTerminal}
            title="Toggle Panel (Ctrl+`)"
          >
            <i className="fa-solid fa-window-maximize" style={{ transform: 'rotate(180deg)' }}></i>
          </div>
        </div>

        <div className="window-controls">
          <div className="control-btn" onClick={minimize} title="Minimize"><i className="fa-solid fa-minus"></i></div>
          <div className="control-btn" onClick={maximize} title="Maximize"><i className="fa-regular fa-square"></i></div>
          <div className="control-btn close" onClick={close} title="Close"><i className="fa-solid fa-xmark"></i></div>
        </div>
      </div>
    </div>
  );
};

export default CustomTitlebar;