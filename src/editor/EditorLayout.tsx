import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from './stores/editorStore';
import { useFileStore } from './stores/fileStore';
import { useFileOperations } from './hooks/useFileOperations';

// ... rest of imports ...
// Components
import { StatusBar, ActivityBar } from './components/Layout';
import { CodeEditor } from './components/Monaco';
import { Terminal } from './components/Terminal';
import { CommandPalette } from './components/CommandPalette';
import { FileExplorerSidebar } from './components/Explorer/FileExplorerSidebar';
import { GitHubSidebar } from './components/Explorer/GitHubSidebar';
import { SearchSidebar } from './components/Explorer/SearchSidebar';
import { QuickOpen } from './components/QuickOpen';
import CustomTitlebar from './components/Layout/CustomTitlebar';
// src/editor/EditorLayout.tsx (Simplified Concept)
import { useAnalysisStore } from './stores/analysisStore';
import AnalysisPanel from '../components/AnalysisPanel';
import './styles/TerminalScreen.css';

/**
 * EditorLayout - Main entry point for the Code Editor feature
 */
export const EditorLayout: React.FC = () => {
  const navigate = useNavigate();
  const editorStore = useEditorStore();
  const fileStore = useFileStore();
  const fileOps = useFileOperations();

  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);
  const [isResizingAnalysis, setIsResizingAnalysis] = useState(false);
  const analysisStore = useAnalysisStore();
  const errorStates = useRef<Record<string, boolean>>({});

  const activeTab = editorStore.tabs.find(t => t.id === editorStore.activeTabId);

  // Initialize data on mount
  useEffect(() => {
    const init = async () => {
      // 1. Try to restore workspace from localStorage (like VS Code)
      const savedWorkspace = localStorage.getItem('lumoflow_workspace');
      if (savedWorkspace) {
        try {
          const { path, name } = JSON.parse(savedWorkspace);
          console.log('🔄 Restoring workspace from localStorage:', path);
          fileStore.setWorkspace(path, name);

          // Sync with backend - update projectDir in main process
          if ((window as any).api?.setWorkspace) {
            const result = await (window as any).api.setWorkspace(path);
            if (result.success) {
              console.log('✅ Backend workspace synced:', result.path);
            } else {
              console.warn('⚠️ Failed to sync backend workspace:', result.error);
            }
          }

          await fileOps.refreshFiles();
        } catch (e) {
          console.error('Error restoring workspace:', e);
        }
      }

      // 2. Load files and sync workspace from backend (fallback)
      if (!savedWorkspace) {
        try {
          await fileOps.refreshFiles();
        } catch (e) {
          console.error('Error refreshing files:', e);
        }

        if ((window as any).api?.getWorkspace) {
          try {
            const workspace = await (window as any).api.getWorkspace();
            if (workspace.path) {
              fileStore.setWorkspace(workspace.path, workspace.name);
              // Save to localStorage for next time
              localStorage.setItem('lumoflow_workspace', JSON.stringify({
                path: workspace.path,
                name: workspace.name
              }));
            }
          } catch (e) {
            console.error('Error loading workspace:', e);
          }
        }
      }
    };
    init();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', editorStore.theme);
  }, [editorStore.theme]);

  useEffect(() => {
    if (!editorStore.autoSave || !activeTab?.isDirty) return;
    const timer = setTimeout(() => fileOps.saveFile(activeTab.id), editorStore.autoSaveDelay);
    return () => clearTimeout(timer);
  }, [editorStore.autoSave, activeTab?.isDirty, activeTab?.content]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) {
        editorStore.setSidebarWidth(Math.max(200, Math.min(600, e.clientX - 48)));
      }
      if (isResizingTerminal) {
        editorStore.setTerminalHeight(Math.max(100, Math.min(600, window.innerHeight - e.clientY - 22)));
      }
      if (isResizingAnalysis) {
        analysisStore.setPanelWidth(Math.max(300, Math.min(800, window.innerWidth - e.clientX)));
      }
    };
    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingTerminal(false);
      setIsResizingAnalysis(false);
    };
    if (isResizingSidebar || isResizingTerminal || isResizingAnalysis) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingSidebar, isResizingTerminal, isResizingAnalysis]);

  // Auto-run when static errors are resolved
  useEffect(() => {
    if (!activeTab) return;

    // Check for static errors specifically for the current file
    const currentErrors = editorStore.staticProblems.filter(p => p.source === activeTab.fileName && p.type === 'error');
    const hasErrors = currentErrors.length > 0;

    // Check previous state for THIS tab
    const hadErrors = errorStates.current[activeTab.id] || false;

    // If we had errors before, and now we don't -> Run Code
    if (hadErrors && !hasErrors) {
      // Small debounce to ensure file is saved/ready? 
      // runCode handles saving if needed? No, runCode runs content.
      // We'll trigger it immediately as requested.
      fileOps.runCode(activeTab.id);
    }

    // Update state map
    errorStates.current[activeTab.id] = hasErrors;
  }, [activeTab?.fileName, activeTab?.id, editorStore.staticProblems, fileOps]);

  useEffect(() => {
    const handleOpenFile = (e: any) => {
      const { path } = e.detail;
      if (path) fileOps.openFile(path);
    };
    const handleQuickOpenToggle = () => editorStore.toggleQuickOpen();

    const handleCreateNewFile = async () => {
      console.log('🔥 Create new file event received (Ctrl+N)');

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
            console.error('🔥 File creation failed, creating in-memory file');
            // Fallback to in-memory file
            editorStore.addTab('', fileName, '', 'javascript');
          } else {
            console.log('🔥 File created and opened successfully!');
          }
        }
      } catch (error) {
        console.error('🔥 Error creating file:', error);
        // Fallback to in-memory file on error
        const fileName = `Untitled-${Date.now()}`;
        editorStore.addTab('', fileName, '', 'javascript');
      }
    };

    const handleCreateNewFolder = async () => {
      console.log('🔥 Create new folder event received (Ctrl+Alt+N)');

      // Check if workspace is set
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
    };

    window.addEventListener('open-file', handleOpenFile);
    window.addEventListener('quick-open-toggle', handleQuickOpenToggle);
    window.addEventListener('create-new-file', handleCreateNewFile);
    window.addEventListener('create-new-folder', handleCreateNewFolder);
    return () => {
      window.removeEventListener('open-file', handleOpenFile);
      window.removeEventListener('quick-open-toggle', handleQuickOpenToggle);
      window.removeEventListener('create-new-file', handleCreateNewFile);
      window.removeEventListener('create-new-folder', handleCreateNewFolder);
    };
  }, []);

  // Track chord state (e.g. for Ctrl+K sequences)
  const [chordState, setChordState] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      // CHORD HANDLING (Ctrl+K ...)
      if (chordState === 'ctrl+k') {
        setChordState(null); // Reset after next key
        if (e.key === 'o' && isMod) { // Ctrl+K, Ctrl+O -> Open Folder
          e.preventDefault();
          fileOps.openFolder();
          return;
        }
        if (e.key === 'f') { // Ctrl+K, F -> Close Folder
          e.preventDefault();
          editorStore.closeAllTabs();
          return;
        }
      }

      // START CHORD
      if (isMod && e.key === 'k') {
        e.preventDefault();
        setChordState('ctrl+k');
        // Optional: Show status "Waiting for second key of chord..."
        return;
      }
      // If we didn't match a chord second key, just continue normal processing but clear chord
      if (chordState) setChordState(null);


      // SINGLE SHORTCUTS
      if (isMod && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        editorStore.toggleCommandPalette();
      } else if (isMod && e.key === 'p' && !e.shiftKey) {
        e.preventDefault();
        editorStore.toggleQuickOpen();
      } else if (isMod && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) { // Ctrl+Shift+S -> Save As
          if (activeTab) fileOps.saveFileAs(activeTab.id);
        } else { // Ctrl+S -> Save
          if (activeTab) fileOps.saveFile(activeTab.id);
        }
      } else if (isMod && e.key === 'Enter') {
        e.preventDefault();
        if (activeTab) fileOps.runCode(activeTab.id);
      } else if (isMod && e.key === 'w') {
        e.preventDefault();
        if (activeTab) editorStore.removeTab(activeTab.id);
      } else if (isMod && e.key === '`') {
        e.preventDefault();
        editorStore.toggleTerminal();
      } else if (isMod && e.key === 'b') {
        e.preventDefault();
        editorStore.toggleSidebar();
      } else if (isMod && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        editorStore.setActiveSidebar('Search');
        if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
      } else if (isMod && e.shiftKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        editorStore.setActiveSidebar('GitHub');
        if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
      } else if (isMod && e.shiftKey && e.key === 'e') {
        e.preventDefault();
        editorStore.setActiveSidebar('Explorer');
        if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
      } else if (isMod && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        if ((window as any).api?.newWindow) (window as any).api.newWindow();
      } else if (isMod && e.altKey && (e.key === 'n' || e.key === 'N')) {
        // Ctrl+Alt+N -> New Folder
        e.preventDefault();
        e.stopPropagation();
        console.log('🔥 Ctrl+Alt+N pressed (global)');
        window.dispatchEvent(new CustomEvent('create-new-folder'));
      } else if (isMod && !e.shiftKey && !e.altKey && (e.key === 'n' || e.key === 'N')) {
        // Ctrl+N -> New Text File
        e.preventDefault();
        e.stopPropagation();
        console.log('🔥 Ctrl+N pressed (global)');
        window.dispatchEvent(new CustomEvent('create-new-file'));
      } else if (isMod && e.key === 'o') {
        // Toggle Breakpoint - send to monaco
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'toggleBreakpoint' } }));
      }

      // EDIT COMMANDS (Global fallback to editor)
      if (isMod) {
        if (e.key === 'z') { // Undo
          // Don't prevent default if valid input is focused
          if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'undo' } }));
        } else if (e.key === 'y') { // Redo
          if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'redo' } }));
        } else if (e.key === 'f') { // Find (Shift+F handled above for Search sidebar, this is editor find)
          if (!e.shiftKey) {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'find' } }));
          }
        } else if (e.key === 'h') { // Replace
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'replace' } }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, chordState]);

  const handleTerminalCommand = async (cmd: string) => {
    editorStore.appendTerminalOutput(`$ ${cmd}\n`);
    try {
      if ((window as any).api?.executeCommand) {
        const result = await (window as any).api.executeCommand(cmd);
        editorStore.appendTerminalOutput(result + '\n');
      }
    } catch (error: any) {
      editorStore.appendTerminalOutput(`Error: ${error.message}\n`);
    }
  };

  const renderSidebar = () => {
    switch (editorStore.activeSidebar) {
      case 'Explorer':
        return <FileExplorerSidebar />;
      case 'Search':
        return <SearchSidebar />;
      case 'GitHub':
        return <GitHubSidebar />;
      default:
        return null;
    }
  };

  return (
    <div className="ide-grid-master">
      <CustomTitlebar workspaceFolderName={fileStore.workspaceName} />
      <CommandPalette />
      <QuickOpen visible={editorStore.quickOpenVisible} onClose={() => editorStore.toggleQuickOpen()} />

      <div className="ide-main-body">
        {/* Activity Bar */}
        <ActivityBar
          activeSidebar={editorStore.activeSidebar}
          onSidebarChange={(s: any) => editorStore.setActiveSidebar(s)}
          onNavigate={navigate}
        />

        {/* Sidebar */}
        {editorStore.sidebarVisible && (
          <>
            <aside
              className="vs-sidebar-container"
              style={{
                width: editorStore.sidebarWidth,
                background: '#252526',
                borderRight: '1px solid #1e1e1e',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {renderSidebar()}
            </aside>
            <div
              onMouseDown={() => setIsResizingSidebar(true)}
              style={{
                width: '4px',
                cursor: 'col-resize',
                background: isResizingSidebar ? '#00f2ff' : 'transparent',
                transition: 'background 0.2s',
              }}
            />
          </>
        )}

        {/* Editor & Terminal Stack */}
        <main className="editor-terminal-stack" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Tab Bar */}
          {editorStore.tabs.length > 0 && (
            <>
              <div
                className="vs-tabs-container"
                style={{
                  display: 'flex',
                  background: '#2d2d30',
                  borderBottom: '1px solid #3c3c3c',
                  height: '35px',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                }}
              >
                {editorStore.tabs.map((tab) => (
                  <div
                    key={tab.id}
                    onClick={() => editorStore.setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0 12px',
                      minWidth: '120px',
                      maxWidth: '200px',
                      background: tab.id === editorStore.activeTabId ? '#1e1e1e' : 'transparent',
                      borderTop: tab.id === editorStore.activeTabId ? '2px solid #00f2ff' : '2px solid transparent',
                      borderRight: '1px solid #3c3c3c',
                      color: tab.id === editorStore.activeTabId ? '#fff' : '#969696',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {tab.fileName}
                    </span>
                    {tab.isDirty && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#fff',
                        }}
                      />
                    )}
                    <i
                      className="fa-solid fa-xmark"
                      onClick={(e) => {
                        e.stopPropagation();
                        editorStore.removeTab(tab.id);
                      }}
                      style={{ fontSize: '14px', opacity: 0.7, cursor: 'pointer' }}
                    />
                  </div>
                ))}
              </div>

              {/* Breadcrumbs */}
              <div style={{
                height: '22px',
                background: '#1e1e1e',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                gap: '8px',
                fontSize: '12px',
                color: '#888',
                borderBottom: '1px solid #2d2d2d'
              }}>
                <i className="fa-solid fa-folder-open" style={{ fontSize: '10px' }}></i>
                <span>{fileStore.workspaceName || 'Project'}</span>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
                <i className="fa-solid fa-file-code" style={{ fontSize: '10px', color: '#00f2ff' }}></i>
                <span style={{ color: '#ccc' }}>{activeTab?.fileName}</span>
              </div>
            </>
          )}

          {/* Editor Area */}
          <div className="editor-workspace" style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            {activeTab ? (
              <CodeEditor
                code={activeTab.content}
                selectedFile={activeTab.filePath}

                onRun={() => fileOps.runCode(activeTab.id)}
                onChange={(content) => editorStore.updateTabContent(activeTab.id, content)}
                onCursorChange={(line, col) => editorStore.updateCursorPosition(activeTab.id, line, col)}
                onSave={() => fileOps.saveFile(activeTab.id)}
                onClose={() => editorStore.removeTab(activeTab.id)}
                onFocus={() => { }}
                onProblemsDetected={editorStore.setStaticProblems}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  width: '100%',
                  color: '#888',
                  gap: '16px',
                }}
              >
                <i className="fa-solid fa-file-code" style={{ fontSize: '64px', opacity: 0.3 }} />
                <div style={{ fontSize: '16px' }}>No file open</div>
              </div>
            )}
          </div>

          {/* Terminal */}
          {editorStore.terminalVisible && (
            <>
              <div
                onMouseDown={() => setIsResizingTerminal(true)}
                style={{
                  height: '4px',
                  cursor: 'row-resize',
                  background: isResizingTerminal ? '#00f2ff' : 'transparent',
                  borderTop: '1px solid #3c3c3c',
                }}
              />
              <div style={{ height: editorStore.terminalHeight }}>
                <Terminal
                  activeTab={editorStore.activeBottomTab}
                  problems={editorStore.problems as any}
                  outputData={editorStore.outputData}
                  debugData={editorStore.debugData}
                  onCommand={handleTerminalCommand}
                  onClear={() => {
                    if (editorStore.activeBottomTab === 'Terminal') editorStore.clearTerminalOutput();
                    else if (editorStore.activeBottomTab === 'Output') editorStore.clearOutputData();
                    else if (editorStore.activeBottomTab === 'Debug') editorStore.clearDebugData();
                  }}
                  onTabChange={(tab: any) => editorStore.setActiveBottomTab(tab)}
                  onClose={editorStore.toggleTerminal}
                  onMaximize={() =>
                    editorStore.setTerminalHeight(editorStore.terminalHeight === 240 ? 500 : 240)
                  }
                  onNavigateToLine={(line: number, column?: number, source?: string) => {
                    if (source) {
                      window.dispatchEvent(new CustomEvent('open-file', { detail: { path: source } }));
                      // Wait a bit for file to open if needed, then reveal
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('monaco-cmd', {
                          detail: { action: 'revealLine', value: line, column: column || 1, file: source }
                        }));
                      }, 100);
                    }
                  }}
                />
              </div>
            </>
          )}
        </main>

        {/* Analysis Panel (LumoFlow) */}
        {analysisStore.isVisible && (
          <>
            <div
              onMouseDown={() => setIsResizingAnalysis(true)}
              style={{
                width: '4px',
                cursor: 'col-resize',
                background: isResizingAnalysis ? '#bc13fe' : 'transparent',
                transition: 'background 0.2s',
                zIndex: 10
              }}
            />
            <AnalysisPanel />
          </>
        )}
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
};
