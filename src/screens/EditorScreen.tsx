import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeEditor from '../components/Editor/CodeEditor';
import AnalysisPanel from '../components/Editor/SidePanel';
import '../styles/TerminalScreen.css';

const EditorScreen: React.FC = () => {
  const navigate = useNavigate();

  // --- UI STATES ---
  const [activeSidebar, setActiveSidebar] = useState('Explorer');
  const [activeBottomTab, setActiveBottomTab] = useState('Terminal');
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // --- EDITOR STATES ---
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [terminalOutput, setTerminalOutput] = useState<string[]>(["user@lumoflow:~/project$ _"]);
  const [isRunning, setIsRunning] = useState(false);

  // --- FILE CREATION STATES ---
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // --- SEARCH STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [gitStatus, setGitStatus] = useState<any[]>([]);

  // --- CONTEXT MENU STATES ---
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: any } | null>(null);
  const [clipboard, setClipboard] = useState<{ file: any; action: 'cut' | 'copy' } | null>(null);
  const [renameFile, setRenameFile] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  // --- RESIZING STATES ---
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [terminalHeight, setTerminalHeight] = useState(250);
  const [analysisWidth, setAnalysisWidth] = useState(400);
  const [isDragging, setIsDragging] = useState<'sidebar' | 'terminal' | 'analysis' | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load project on mount
  useEffect(() => {
    loadProject();
  }, []);

  // --- MOUSE MOVE FOR RESIZING ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      if (isDragging === 'sidebar') {
        const newWidth = Math.max(150, Math.min(400, e.clientX - 50));
        setSidebarWidth(newWidth);
      } else if (isDragging === 'terminal') {
        const newHeight = Math.max(100, Math.min(600, window.innerHeight - e.clientY));
        setTerminalHeight(newHeight);
      } else if (isDragging === 'analysis') {
        const newWidth = Math.max(300, Math.min(800, window.innerWidth - e.clientX));
        setAnalysisWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const loadProject = async () => {
    try {
      const projectFiles = await window.api.readProjectFiles();
      setFiles(projectFiles);
      if (projectFiles.length > 0 && !selectedFile) {
        handleFileSelect(projectFiles[0]);
      }
    } catch (e) {
      console.error("Load error", e);
    }
  };

  const handleFileSelect = async (file: any) => {
    const content = await window.api.readFile(file.path);
    setSelectedFile(file.path);
    setCode(content);
  };

  const handleCloseFile = () => {
    setSelectedFile(null);
    setCode("");
  };

  // --- SEARCH FUNCTIONALITY ---
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = files.filter(file => 
      file.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

  // --- 1. HANDLE CODE WRITING ---
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  // --- 2. HANDLE ADD FILE ---
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    try {
      const res = await window.api.createFile({ fileName: newFileName, content: '' });
      if (res.success) {
        await loadProject(); 
        const newFile = { name: newFileName, path: res.path };
        handleFileSelect(newFile);
        addLog('info', `Created new file: ${newFileName}`);
      } else {
        addLog('error', res.msg);
      }
    } catch (err) {
      addLog('error', "Failed to create file");
    } finally {
      setIsCreatingFile(false);
      setNewFileName('');
    }
  };

  // --- 3. HANDLE RUN ---
  const handleRun = async () => {
    if (!selectedFile) {
      addLog('error', 'No file selected');
      return;
    }
    
    setIsRunning(true);
    setActiveBottomTab('Terminal');
    
    const fileName = selectedFile.split('\\').pop() || selectedFile.split('/').pop();
    const isJS = selectedFile.endsWith('.js');
    const isPy = selectedFile.endsWith('.py');
    
    if (!isJS && !isPy) {
      addLog('error', `Unsupported file type. Only .js and .py files are supported.`);
      setIsRunning(false);
      return;
    }
    
    const cmd = isJS ? `node "${selectedFile}"` : `python "${selectedFile}"`;
    addLog('info', `> ${cmd}`);
    addLog('info', '---');

    try {
      const output = await window.api.runCode({ filePath: selectedFile, code });
      if (Array.isArray(output)) {
        output.forEach(line => {
          if (line.toLowerCase().includes('error') || line.startsWith('❌')) {
            addLog('error', line);
          } else if (line.toLowerCase().includes('warning')) {
            addLog('warning', line);
          } else {
            addLog('normal', line);
          }
        });
      } else {
        addLog('normal', String(output));
      }
      addLog('info', '---');
      addLog('success', 'Process completed successfully');
    } catch (err: any) {
      addLog('error', `Execution failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // --- 4. HANDLE COMMIT ---
  const handleCommit = () => {
    addLog('info', '> git add .');
    addLog('info', '> git commit -m "Update source code"');
    setTimeout(() => {
      addLog('success', 'Changes committed to branch main.');
    }, 800);
  };

  const addLog = (type: string, msg: string) => {
    // Don't add prefix if message already has one
    const hasPrefix = msg.startsWith('❌') || msg.startsWith('✅') || msg.startsWith('⚠️') || msg.startsWith('ℹ️');
    
    let formattedMsg = msg;
    if (!hasPrefix) {
      const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'info' ? 'ℹ️' : '';
      formattedMsg = prefix ? `${prefix} ${msg}` : msg;
    }
    
    setTerminalOutput(prev => [...prev, formattedMsg]);
  };

  // --- FILE OPERATIONS ---
  const handleDeleteFile = async (file: any) => {
    if (window.confirm(`Delete ${file.name}?`)) {
      try {
        await (window.api as any).deleteFile(file.path);
        await loadProject();
        if (selectedFile === file.path) {
          handleCloseFile();
        }
        addLog('info', `Deleted: ${file.name}`);
      } catch (err) {
        addLog('error', `Failed to delete ${file.name}`);
      }
    }
    setContextMenu(null);
  };

  const handleRenameFile = async (file: any) => {
    setRenameFile(file.path);
    setNewName(file.name);
    setContextMenu(null);
  };

  const confirmRename = async () => {
    if (!renameFile || !newName.trim()) return;
    try {
      await (window.api as any).renameFile(renameFile, newName);
      await loadProject();
      addLog('info', `Renamed to: ${newName}`);
      setRenameFile(null);
      setNewName('');
    } catch (err) {
      addLog('error', `Failed to rename file`);
      setRenameFile(null);
      setNewName('');
    }
  };

  const handleCutFile = (file: any) => {
    setClipboard({ file, action: 'cut' });
    setContextMenu(null);
    addLog('info', `Cut: ${file.name}`);
  };

  const handleCopyFile = (file: any) => {
    setClipboard({ file, action: 'copy' });
    setContextMenu(null);
    addLog('info', `Copied: ${file.name}`);
  };

  const handlePasteFile = async () => {
    if (!clipboard) return;
    try {
      const content = await window.api.readFile(clipboard.file.path);
      const newFileName = clipboard.action === 'cut' 
        ? clipboard.file.name 
        : `${clipboard.file.name.split('.')[0]}_copy.${clipboard.file.name.split('.')[1]}`;
      
      await window.api.createFile({ fileName: newFileName, content });
      
      if (clipboard.action === 'cut') {
        await (window.api as any).deleteFile(clipboard.file.path);
      }
      
      await loadProject();
      setClipboard(null);
      addLog('info', `Pasted: ${newFileName}`);
    } catch (err) {
      addLog('error', `Failed to paste file`);
    }
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;

    try {
      await (window.api as any).createFolder(folderName);
      await loadProject();
      addLog('info', `Created folder: ${folderName}`);
    } catch (err) {
      addLog('error', `Failed to create folder`);
    }
  };

  // --- RENDER SIDEBAR ---
  const renderSidebar = () => {
    if (activeSidebar === 'Github') {
      return (
        <div className="github-panel">
          <div className="sidebar-header">SOURCE CONTROL</div>
          <div className="git-info">
            <div className="git-branch">
              <i className="fa-solid fa-code-branch"></i>
              <span>main</span>
            </div>
            <div className="git-status-list">
              {gitStatus.length > 0 ? (
                gitStatus.map((file, idx) => (
                  <div key={idx} className="git-file">
                    <span className="git-file-name">{file.name}</span>
                    <span className={`git-status ${file.status.toLowerCase()}`}>{file.status}</span>
                  </div>
                ))
              ) : (
                <div className="git-empty">No changes</div>
              )}
            </div>
          </div>
          <div className="git-actions">
            <button className="git-btn commit" onClick={handleCommit}>
              <i className="fa-solid fa-check"></i> Commit
            </button>
            <button className="git-btn push">
              <i className="fa-solid fa-arrow-up"></i> Push
            </button>
            <button className="git-btn pull">
              <i className="fa-solid fa-arrow-down"></i> Pull
            </button>
          </div>
          <div className="github-connect">
            <button className="github-btn">
              <i className="fa-brands fa-github"></i> Connect GitHub
            </button>
          </div>
        </div>
      );
    }

    if (activeSidebar === 'Search') {
      return (
        <div className="search-panel">
          <div className="sidebar-header">SEARCH</div>
          <input 
            type="text"
            className="search-input"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
          <div className="search-results">
            {searchResults.length > 0 ? (
              searchResults.map(file => (
                <div 
                  key={file.path}
                  className={`search-result-item ${selectedFile === file.path ? 'active' : ''}`}
                  onClick={() => handleFileSelect(file)}
                >
                  <i className={file.name.endsWith('.js') ? "fa-brands fa-js" : "fa-brands fa-python"} 
                     style={{color: file.name.endsWith('.js') ? '#f7df1e' : '#3776ab'}}></i>
                  <div className="search-result-info">
                    <div className="search-result-name">{file.name}</div>
                    <div className="search-result-path">{file.path}</div>
                  </div>
                </div>
              ))
            ) : searchQuery ? (
              <div className="search-empty">No files found</div>
            ) : (
              <div className="search-empty">Type to search files</div>
            )}
          </div>
        </div>
      );
    }

    // Default: Explorer
    return (
      <div className="file-list">
        <div className="sidebar-header sidebar-actions">
          <span>PROJECT</span>
          <div className="sidebar-buttons">
            <button className="add-file-btn" onClick={() => setIsCreatingFile(true)} title="New File">
              <i className="fa-solid fa-plus"></i>
            </button>
            <button className="add-file-btn" onClick={handleCreateFolder} title="New Folder">
              <i className="fa-solid fa-folder-plus"></i>
            </button>
            {clipboard && (
              <button className="add-file-btn paste-btn" onClick={handlePasteFile} title="Paste">
                <i className="fa-solid fa-paste"></i>
              </button>
            )}
          </div>
        </div>

        {/* INPUT FOR NEW FILE */}
        {isCreatingFile && (
          <form onSubmit={handleCreateFile} className="new-file-form">
            <input 
              autoFocus
              type="text" 
              className="new-file-input"
              placeholder="filename.js"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => setIsCreatingFile(false)} 
            />
          </form>
        )}

        {files.map(file => (
          <div key={file.path}>
            {renameFile === file.path ? (
              <form onSubmit={(e) => { e.preventDefault(); confirmRename(); }} className="rename-form">
                <input 
                  autoFocus
                  type="text"
                  className="rename-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={confirmRename}
                />
              </form>
            ) : (
              <div 
                key={file.path} 
                className={`file-item ${selectedFile === file.path ? 'active' : ''}`}
                onClick={() => handleFileSelect(file)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, file });
                }}
              >
                <i className={file.name.endsWith('.js') ? "fa-brands fa-js" : "fa-brands fa-python"} 
                   style={{color: file.name.endsWith('.js') ? '#f7df1e' : '#3776ab'}}></i>
                {file.name}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="ide-wrapper" ref={containerRef}>
      
      {/* CONTEXT MENU */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <div className="context-item" onClick={() => handleRenameFile(contextMenu.file)}>
            <i className="fa-solid fa-pen"></i> Rename
          </div>
          <div className="context-item" onClick={() => handleCutFile(contextMenu.file)}>
            <i className="fa-solid fa-scissors"></i> Cut
          </div>
          <div className="context-item" onClick={() => handleCopyFile(contextMenu.file)}>
            <i className="fa-solid fa-copy"></i> Copy
          </div>
          {clipboard && (
            <div className="context-item" onClick={handlePasteFile}>
              <i className="fa-solid fa-paste"></i> Paste
            </div>
          )}
          <div className="context-divider"></div>
          <div className="context-item delete" onClick={() => handleDeleteFile(contextMenu.file)}>
            <i className="fa-solid fa-trash"></i> Delete
          </div>
        </div>
      )}
      
      {/* 1. LEFT ACTIVITY BAR */}
      <aside className="activity-bar">
        <div className="activity-icon" onClick={() => navigate('/dashboard')} title="Home">
          <i className="fa-solid fa-house"></i>
        </div>
        <div className={`activity-icon ${activeSidebar === 'Explorer' ? 'active' : ''}`} onClick={() => setActiveSidebar('Explorer')}>
          <i className="fa-regular fa-copy"></i>
        </div>
        <div className={`activity-icon ${activeSidebar === 'Search' ? 'active' : ''}`} onClick={() => setActiveSidebar('Search')}>
          <i className="fa-solid fa-magnifying-glass"></i>
        </div>
        <div className={`activity-icon ${activeSidebar === 'Github' ? 'active' : ''}`} onClick={() => setActiveSidebar('Github')}>
          <i className="fa-brands fa-github"></i>
        </div>
        <div className="spacer"></div>
        <div className="activity-icon" onClick={() => navigate('/settings')}>
          <i className="fa-solid fa-gear"></i>
        </div>
      </aside>

      {/* 2. SIDEBAR CONTENT */}
      <aside className="ide-sidebar" style={{ width: `${sidebarWidth}px` }}>
        {renderSidebar()}
      </aside>

      {/* SIDEBAR RESIZE HANDLE */}
      <div 
        className="resize-handle resize-handle-vertical"
        onMouseDown={() => setIsDragging('sidebar')}
        title="Drag to resize sidebar"
      ></div>

      {/* 3. MAIN EDITOR AREA */}
      <div className="ide-main-content">
        
        {/* HEADER */}
        <header className="ide-header">
          <div className="ide-brand">
            <i className="fa-solid fa-bolt"></i>
            <span>LUMO FLOW</span>
          </div>
          
          <div className="ide-actions">
            {/* ANALYZE BUTTON - TOGGLES RIGHT PANEL */}
            <button className="btn-analyze" onClick={() => setShowAnalysis(!showAnalysis)}>
              <i className="fa-solid fa-microchip"></i> {showAnalysis ? 'Close Analysis' : 'Analyze'}
            </button>
            
            {/* RUN BUTTON */}
            <button className="btn-run" onClick={handleRun}>
              <i className={`fa-solid ${isRunning ? 'fa-spinner fa-spin' : 'fa-play'}`}></i> 
              {isRunning ? 'Running' : 'Run'}
            </button>
          </div>
        </header>

        {/* MAIN CONTENT WRAPPER - Editor + Terminal */}
        <div className="editor-terminal-wrapper">
          
          {/* EDITOR SPLIT CONTAINER */}
          <div className="editor-split-container" style={{ flex: '1' }}>
            
            {/* CODE EDITOR (Left/Center) */}
            <div className="editor-area" style={{ flex: showAnalysis ? `0 0 calc(100% - ${analysisWidth}px)` : '1' }}>
               <CodeEditor 
                 code={code}
                 onChange={handleCodeChange} 
                 selectedFile={selectedFile}
                 onSave={() => window.api.saveFile({ filePath: selectedFile!, content: code })}
                 onClose={handleCloseFile} 
               />
            </div>

            {/* ANALYSIS RESIZE HANDLE */}
            {showAnalysis && (
              <div 
                className="resize-handle resize-handle-horizontal"
                onMouseDown={() => setIsDragging('analysis')}
                title="Drag to resize analysis panel"
              ></div>
            )}

            {/* ANALYSIS PANEL (Right Side - Conditional) */}
            {showAnalysis && (
              <div className="analysis-panel" style={{ flex: `0 0 ${analysisWidth}px` }}>
                <AnalysisPanel />
              </div>
            )}
            
          </div>

          {/* TERMINAL RESIZE HANDLE - Only show when terminal is open */}
          {isTerminalOpen && (
            <div 
              className="resize-handle resize-handle-horizontal-bottom"
              onMouseDown={() => setIsDragging('terminal')}
              title="Drag to resize terminal"
            ></div>
          )}

          {/* 4. BOTTOM TERMINAL - Conditional rendering */}
          {isTerminalOpen ? (
            <div className="terminal-section" style={{ flex: `0 0 ${terminalHeight}px` }}>
              <div className="terminal-header">
                <div className="terminal-header-left">
                  <div className={`terminal-tab ${activeBottomTab === 'Terminal' ? 'active' : ''}`} onClick={() => setActiveBottomTab('Terminal')}>
                    <i className="fa-solid fa-terminal"></i> Terminal
                  </div>
                  <div className={`terminal-tab ${activeBottomTab === 'Output' ? 'active' : ''}`} onClick={() => setActiveBottomTab('Output')}>
                    <i className="fa-solid fa-square-poll-vertical"></i> Output
                  </div>
                  <div className={`terminal-tab ${activeBottomTab === 'Debug' ? 'active' : ''}`} onClick={() => setActiveBottomTab('Debug')}>
                    <i className="fa-solid fa-bug"></i> Debug
                  </div>
                </div>
                <button 
                  className="terminal-close-btn"
                  onClick={() => setIsTerminalOpen(false)}
                  title="Close Terminal"
                >
                  <i className="fa-solid fa-chevron-down"></i>
                </button>
              </div>

              <div className="terminal-body">
                {activeBottomTab === 'Terminal' && (
                  <>
                    {terminalOutput.map((line, i) => {
                      let lineClass = 'normal';
                      if (line.startsWith('❌') || line.toLowerCase().includes('error')) {
                        lineClass = 'error';
                      } else if (line.startsWith('⚠️') || line.toLowerCase().includes('warning')) {
                        lineClass = 'warning';
                      } else if (line.startsWith('✅') || line.toLowerCase().includes('success')) {
                        lineClass = 'success';
                      } else if (line.startsWith('ℹ️') || line.startsWith('>')) {
                        lineClass = 'info';
                      }
                      return (
                        <div key={i} className={`terminal-line ${lineClass}`}>
                          {line}
                        </div>
                      );
                    })}
                  </>
                )}
                {activeBottomTab === 'Output' && <div style={{color: '#00ff88'}}>[System] Analysis Complete.</div>}
                {activeBottomTab === 'Debug' && <div style={{color: '#888'}}>No debug session active.</div>}
              </div>
            </div>
          ) : (
            /* COLLAPSED TERMINAL BAR */
            <div className="terminal-collapsed-bar">
              <div className="collapsed-tabs">
                <button 
                  className={`collapsed-tab ${activeBottomTab === 'Terminal' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveBottomTab('Terminal');
                    setIsTerminalOpen(true);
                  }}
                  title="Open Terminal"
                >
                  <i className="fa-solid fa-terminal"></i>
                  <span className="tab-label">Terminal</span>
                  {terminalOutput.length > 1 && <span className="tab-badge">{terminalOutput.length}</span>}
                </button>
                <button 
                  className={`collapsed-tab ${activeBottomTab === 'Output' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveBottomTab('Output');
                    setIsTerminalOpen(true);
                  }}
                  title="Open Output"
                >
                  <i className="fa-solid fa-square-poll-vertical"></i>
                  <span className="tab-label">Output</span>
                </button>
                <button 
                  className={`collapsed-tab ${activeBottomTab === 'Debug' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveBottomTab('Debug');
                    setIsTerminalOpen(true);
                  }}
                  title="Open Debug"
                >
                  <i className="fa-solid fa-bug"></i>
                  <span className="tab-label">Debug</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default EditorScreen;