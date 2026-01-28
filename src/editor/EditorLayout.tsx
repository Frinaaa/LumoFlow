import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from './stores/editorStore';
import { useFileStore } from './stores/fileStore';
import { useGitStore } from './stores/gitStore';
import { useFileOperations } from './hooks/useFileOperations';

// Components
import { StatusBar } from './components/Layout';
import { CodeEditor } from './components/Monaco';
import { Terminal } from './components/Terminal';
import { CommandPalette } from './components/CommandPalette';
import { FileExplorerSidebar } from './components/Explorer/FileExplorerSidebar';
import { GitSidebar } from './components/Explorer/GitSidebar';
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
  const gitStore = useGitStore();
  const fileOps = useFileOperations();

  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);
  const [quickOpenVisible, setQuickOpenVisible] = useState(false);
  const errorStates = useRef<Record<string, boolean>>({});

  const activeTab = editorStore.tabs.find(t => t.id === editorStore.activeTabId);

  // Initialize data on mount
  useEffect(() => {
    const init = async () => {
      // Load files and sync workspace
      fileOps.refreshFiles();
      if ((window as any).api?.getWorkspace) {
        const workspace = await (window as any).api.getWorkspace();
        if (workspace.path) {
          fileStore.setWorkspace(workspace.path, workspace.name);
        }
      }

      // Load git status
      try {
        if ((window as any).api?.gitStatus) {
          const gitStatus = await (window as any).api.gitStatus();
          gitStore.setGitStatus({
            branch: gitStatus.branch || 'main',
            changes: gitStatus.changes || [],
            isRepo: !!gitStatus.branch,
          });
        }
      } catch (e) {
        console.error('Error loading git status:', e);
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
    };
    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingTerminal(false);
    };
    if (isResizingSidebar || isResizingTerminal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingSidebar, isResizingTerminal]);

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
    const handleQuickOpenToggle = () => setQuickOpenVisible(prev => !prev);

    window.addEventListener('open-file', handleOpenFile);
    window.addEventListener('quick-open-toggle', handleQuickOpenToggle);
    return () => {
      window.removeEventListener('open-file', handleOpenFile);
      window.removeEventListener('quick-open-toggle', handleQuickOpenToggle);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        editorStore.toggleCommandPalette();
      } else if (isMod && e.key === 'p' && !e.shiftKey) {
        e.preventDefault();
        setQuickOpenVisible(true);
      } else if (isMod && e.key === 's') {
        e.preventDefault();
        if (activeTab) fileOps.saveFile(activeTab.id);
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
      } else if (isMod && e.shiftKey && e.key === 'g') {
        e.preventDefault();
        editorStore.setActiveSidebar('Git');
        if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

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
      case 'Git':
        return <GitSidebar />;
      default:
        return null;
    }
  };

  return (
    <div className="ide-grid-master">
      <CustomTitlebar workspaceFolderName={fileStore.workspaceName} />
      <CommandPalette />
      <QuickOpen visible={quickOpenVisible} onClose={() => setQuickOpenVisible(false)} />

      <div className="ide-main-body">
        {/* Activity Bar */}
        <div
          style={{
            width: '48px',
            background: '#333',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '10px',
            paddingBottom: '10px',
            gap: '10px',
            borderRight: '1px solid #1e1e1e',
          }}
        >
          <i
            className="fa-solid fa-house activity-icon"
            onClick={() => navigate('/dashboard')}
            style={{
              cursor: 'pointer',
              fontSize: '20px',
              color: '#888',
              transition: 'color 0.2s',
            }}
            title="Dashboard"
          />
          <i
            className={`fa-solid fa-copy activity-icon ${editorStore.activeSidebar === 'Explorer' ? 'active' : ''}`}
            onClick={() => {
              if (editorStore.activeSidebar === 'Explorer' && editorStore.sidebarVisible) {
                editorStore.toggleSidebar();
              } else {
                editorStore.setActiveSidebar('Explorer');
                if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
              }
            }}
            style={{
              cursor: 'pointer',
              fontSize: '20px',
              color: editorStore.activeSidebar === 'Explorer' ? '#00f2ff' : '#888',
              transition: 'color 0.2s',
            }}
            title="Explorer"
          />
          <i
            className={`fa-solid fa-magnifying-glass activity-icon ${editorStore.activeSidebar === 'Search' ? 'active' : ''}`}
            onClick={() => {
              if (editorStore.activeSidebar === 'Search' && editorStore.sidebarVisible) {
                editorStore.toggleSidebar();
              } else {
                editorStore.setActiveSidebar('Search');
                if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
              }
            }}
            style={{
              cursor: 'pointer',
              fontSize: '20px',
              color: editorStore.activeSidebar === 'Search' ? '#00f2ff' : '#888',
              transition: 'color 0.2s',
            }}
            title="Search"
          />
          <i
            className={`fa-solid fa-code-branch activity-icon ${editorStore.activeSidebar === 'Git' ? 'active' : ''}`}
            onClick={() => {
              if (editorStore.activeSidebar === 'Git' && editorStore.sidebarVisible) {
                editorStore.toggleSidebar();
              } else {
                editorStore.setActiveSidebar('Git');
                if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
              }
            }}
            style={{
              cursor: 'pointer',
              fontSize: '20px',
              color: editorStore.activeSidebar === 'Git' ? '#00f2ff' : '#888',
              transition: 'color 0.2s',
            }}
            title="Git"
          />
          <i
            className="fa-solid fa-gear activity-icon"
            onClick={() => navigate('/settings')}
            style={{
              marginTop: 'auto',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#888',
              transition: 'color 0.2s',
            }}
            title="Settings"
          />
        </div>

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
                isActive={true}
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
        <AnalysisPanel />
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
};
