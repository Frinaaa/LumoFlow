import React from 'react';
import MenuBar from '../MenuBar';
import { useEditor } from '../../../context/EditorContext';
import { useEditorStore, useAnalysisStore } from '../../stores';
import { useWindowControls } from '../../../hooks/useWindowControls';
import { useFileOperations } from '../../hooks/useFileOperations';
import '../../styles/CustomTitlebar.css';

interface CustomTitlebarProps {
  workspaceFolderName?: string;
}

const CustomTitlebar: React.FC<CustomTitlebarProps> = ({ workspaceFolderName }) => {
  const { minimize, maximize, close } = useWindowControls();
  const editorState = useEditor();
  const analysisStore = useAnalysisStore();
  const editorStore = useEditorStore();
  const fileOps = useFileOperations();
  const { activeTabId, tabs, toggleCommandPalette, toggleSidebar, toggleTerminal } = editorStore;
  const activeTab = tabs.find(t => t.id === activeTabId);

  // src/components/CustomTitlebar.tsx

  const handleAnalyze = async () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    // 1. Open the panel immediately
    if (!analysisStore.isVisible) analysisStore.togglePanel();

    // The VisualizeTab will automatically detect the code and generate frames
    // No need to manually generate frames here anymore

    // 2. Optional: Run background AI analysis if available
    try {
      if ((window as any).api?.analyzeCode) {
        analysisStore.setAnalyzing(true);
        const result = await (window as any).api.analyzeCode({
          code: activeTab.content,
          language: activeTab.language,
        });
        if (result.success) {
          analysisStore.setAnalysisData(result.analysis);
        }
      }
    } catch (backendErr) {
      console.warn("AI Backend Analysis not available:", backendErr);
    } finally {
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
            onNewFile={async () => {
              console.log('🔥 NEW FILE CLICKED - AUTO CREATE');

              // Check if workspace is set
              const fileStoreModule = await import('../../stores/fileStore');
              const fileStore = fileStoreModule.useFileStore.getState();

              try {
                // Auto-generate filename with incrementing number
                let fileName = 'Untitled-1';
                let counter = 1;

                // Check existing tabs for untitled files
                const existingTabs = editorStore.tabs.map(t => t.fileName.toLowerCase());
                while (existingTabs.includes(fileName.toLowerCase())) {
                  counter++;
                  fileName = `Untitled-${counter}`;
                }

                console.log('🔥 Creating untitled file:', fileName);

                // If no workspace, create an in-memory file (unsaved tab)
                if (!fileStore.workspacePath) {
                  // Create a new tab without a file path (in-memory)
                  editorStore.addTab('', fileName, '', 'javascript');
                  console.log('🔥 Created in-memory file (no workspace)');
                } else {
                  // If workspace exists, create actual file
                  const jsFileName = `${fileName}.js`;
                  let fileCounter = 1;
                  const existingFiles = fileStore.files.map(f => f.name.toLowerCase());
                  let finalFileName = jsFileName;

                  while (existingFiles.includes(finalFileName.toLowerCase())) {
                    finalFileName = `Untitled-${fileCounter}.js`;
                    fileCounter++;
                  }

                  const result = await fileOps.createFile(finalFileName);

                  if (!result) {
                    console.error('🔥 File creation failed!');
                    // Fallback to in-memory file
                    editorStore.addTab('', fileName, '', 'javascript');
                  } else {
                    console.log('🔥 File created and opened successfully!');
                  }
                }
              } catch (error) {
                console.error('🔥 Error in onNewFile handler:', error);
                // Fallback to in-memory file on error
                const fileName = `Untitled-${Date.now()}`;
                editorStore.addTab('', fileName, '', 'javascript');
              }
            }}
            onNewFolder={async () => {
              console.log('🔥 NEW FOLDER CLICKED');

              // Check if workspace is set
              const fileStoreModule = await import('../../stores/fileStore');
              const fileStore = fileStoreModule.useFileStore.getState();

              if (!fileStore.workspacePath) {
                alert('Please open a folder first before creating folders.');
                return;
              }

              // Use DOM input for folder name
              const folderName = await new Promise<string | null>((resolve) => {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = 'new-folder';
                input.placeholder = 'Enter folder name';
                input.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10000;padding:10px;font-size:16px;border:2px solid #00f2ff;background:#1e1e1e;color:#fff;width:300px;';
                document.body.appendChild(input);
                input.focus();
                input.select();

                const handleSubmit = () => {
                  const value = input.value;
                  document.body.removeChild(input);
                  resolve(value || null);
                };

                input.addEventListener('keydown', (e) => {
                  if (e.key === 'Enter') handleSubmit();
                  if (e.key === 'Escape') {
                    document.body.removeChild(input);
                    resolve(null);
                  }
                });

                setTimeout(() => {
                  if (document.body.contains(input)) {
                    document.body.removeChild(input);
                    resolve(null);
                  }
                }, 30000);
              });

              if (folderName && folderName.trim()) {
                const result = await fileOps.createFolder(folderName.trim());
                if (!result) {
                  alert('Folder creation failed! Check console for details.');
                }
              }
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

      <div className="titlebar-section center">
        <div className="titlebar-search" onClick={() => editorStore.toggleQuickOpen()} title="Search files (Ctrl+P)">
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