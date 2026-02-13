import React from 'react';
import MenuBar from '../MenuBar';
import { useEditor } from '../../../context/EditorContext';
import { useEditorStore, useAnalysisStore, useFileStore } from '../../stores';
import { useWindowControls } from '../../../hooks/useWindowControls';
import { useFileOperations } from '../../hooks/useFileOperations';
import '../../styles/CustomTitlebar.css';

interface CustomTitlebarProps {
  workspaceFolderName?: string;
}

const CustomTitlebar: React.FC<CustomTitlebarProps> = ({ workspaceFolderName }) => {
  const { minimize, maximize, close } = useWindowControls();
  const editorState = useEditor();
  const editorStore = useEditorStore();
  const fileOps = useFileOperations();
  const isAnalyzing = useAnalysisStore(state => state.isAnalyzing);
  const isVisible = useAnalysisStore(state => state.isVisible);
  const togglePanel = useAnalysisStore(state => state.togglePanel);
  const setAnalyzing = useAnalysisStore(state => state.setAnalyzing);
  const setAnalysisData = useAnalysisStore(state => state.setAnalysisData);
  const { activeTabId, tabs, toggleCommandPalette, toggleSidebar, toggleTerminal } = editorStore;
  const activeTab = tabs.find(t => t.id === activeTabId);

  // src/components/CustomTitlebar.tsx

  const handleAnalyze = async () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    // 🟢 Clear first!
    const analysisState = useAnalysisStore.getState();
    analysisState.clearVisuals();

    // 1. Open the panel immediately
    if (!isVisible) togglePanel();

    try {
      if ((window as any).api?.analyzeCode) {
        setAnalyzing(true);

        // Include the filePath here
        analysisState.fetchAiSimulation(activeTab.content, activeTab.filePath);

        const result = await (window as any).api.analyzeCode({
          code: activeTab.content,
          language: activeTab.language,
        });
        if (result.success) {
          setAnalysisData(result.analysis);
        }
      }
    } catch (backendErr) {
      console.warn("AI Backend Analysis not available:", backendErr);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="vs-titlebar-container" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* 1. LEFT SECTION: Logo and MenuBar */}
      <div className="titlebar-section left" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="titlebar-logo">
          <i className="fa-solid fa-bolt"></i>
          <span className="logo-text">LUMO<span>FLOW</span></span>
        </div>
        <div className="titlebar-menu-wrapper" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <MenuBar
            onNewFile={() => {
              console.log('🔥 NEW FILE CLICKED');
              const fileStore = useFileStore.getState();

              if (!fileStore.workspacePath) {
                // Fallback for no workspace: create an in-memory file (unsaved tab)
                const fileName = `Untitled-${Date.now()}`;
                editorStore.addTab('', fileName, '', 'javascript');
                console.log('🔥 Created in-memory file (no workspace)');
                return;
              }

              // If workspace exists, trigger in-place creation in the sidebar
              if (!editorStore.sidebarVisible) {
                editorStore.toggleSidebar();
              }
              editorStore.setActiveSidebar('Explorer');
              fileStore.setCreatingInFolder(null); // Create at root
              fileStore.setIsCreatingFile(true);
            }}
            onNewFolder={() => {
              console.log('🔥 NEW FOLDER CLICKED');
              const fileStore = useFileStore.getState();

              if (!fileStore.workspacePath) {
                alert('Please open a folder first before creating folders.');
                return;
              }

              // 1. Ensure primary sidebar is visible
              if (!editorStore.sidebarVisible) {
                editorStore.toggleSidebar();
              }

              // 2. Switch to Explorer
              editorStore.setActiveSidebar('Explorer');

              // 3. Trigger in-place creation in the sidebar
              fileStore.setCreatingInFolder(null); // Create at root
              fileStore.setIsCreatingFolder(true);
            }}
            onOpenFile={() => {
              console.log('Open file clicked');
              editorState.onMenuAction?.('openFile');
            }}
            onOpenFolder={() => {
              console.log('Open folder clicked');
              editorState.onMenuAction?.('openFolder');
            }}
            onSave={() => {
              console.log('Save clicked');
              editorState.onSave?.();
            }}
            onSaveAs={() => {
              console.log('Save as clicked');
              editorState.onMenuAction?.('saveAs');
            }}
            onSaveAll={() => {
              console.log('Save all clicked');
              editorState.onMenuAction?.('saveAll');
            }}
            onCloseEditor={() => {
              console.log('Close editor clicked');
              editorState.onMenuAction?.('closeEditor');
            }}
            onCloseFolder={() => {
              console.log('Close folder clicked');
              editorState.onMenuAction?.('closeFolder');
            }}
            onNewWindow={() => {
              console.log('New window clicked');
              editorState.onMenuAction?.('newWindow');
            }}
            onCloseWindow={() => {
              console.log('Close window clicked');
              editorState.onMenuAction?.('closeWindow');
            }}
            autoSave={editorState.autoSave}
            onToggleAutoSave={() => {
              console.log('Toggle auto save clicked');
              editorState.onMenuAction?.('toggleAutoSave');
            }}
            onRun={editorState.onRun}
          />
        </div>
      </div>

      <div className="titlebar-section center" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="titlebar-search" onClick={() => editorStore.toggleQuickOpen()} title="Search files (Ctrl+P)" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <span>
            {activeTab ? (
              <span className="active-file">{activeTab.fileName}</span>
            ) : null}
            <span className="search-placeholder">
              {activeTab ? ' — ' : ''}Search files by name (Ctrl+P)
            </span>
          </span>
        </div>
      </div>

      {/* 3. RIGHT SECTION: Action Buttons + Layout Toggles + Window Controls */}
      <div className="titlebar-section right" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="action-btns" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            className="purple-btn analyze"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !activeTab}
            title="Analyze current file"
          >
            {isAnalyzing ? (
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
        <div style={{ display: 'flex', gap: '5px', marginRight: '10px', color: '#ccc', WebkitAppRegion: 'no-drag' } as any}>
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

        <div className="window-controls" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div className="control-btn" onClick={minimize} title="Minimize"><i className="fa-solid fa-minus"></i></div>
          <div className="control-btn" onClick={maximize} title="Maximize"><i className="fa-regular fa-square"></i></div>
          <div className="control-btn close" onClick={close} title="Close"><i className="fa-solid fa-xmark"></i></div>
        </div>
      </div>
    </div >

  );
};

export default CustomTitlebar;