import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeEditor from '../components/Editor/CodeEditor';
import AnalysisPanel from '../components/Editor/AnalysisPanel';
import '../styles/TerminalScreen.css';

const EditorScreen: React.FC = () => {
  const navigate = useNavigate();

  // --- UI STATES ---
  const [activeSidebar, setActiveSidebar] = useState('Explorer');
  const [activeBottomTab, setActiveBottomTab] = useState('Terminal');
  const [showAnalysis, setShowAnalysis] = useState(false); // Controls Split View
  
  // --- EDITOR STATES ---
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [code, setCode] = useState<string>("// Select a file to start coding");
  const [terminalOutput, setTerminalOutput] = useState<string[]>(["user@lumoflow:~/project$ _"]);
  const [isRunning, setIsRunning] = useState(false);

  // --- FILE CREATION STATES ---
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Load project on mount
  useEffect(() => {
    loadProject();
  }, []);

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
    setCode("// Select a file to start coding");
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
    if (!selectedFile) return;
    
    setIsRunning(true);
    setActiveBottomTab('Terminal'); 
    
    const cmd = selectedFile.endsWith('.js') ? `node ${selectedFile}` : `python ${selectedFile}`;
    addLog('info', `> ${cmd}`);

    try {
      const output = await window.api.runCode({ filePath: selectedFile, code });
      if (Array.isArray(output)) {
        output.forEach(line => addLog(line.toLowerCase().includes('error') ? 'error' : 'normal', line));
      } else {
        addLog('normal', String(output));
      }
    } catch (err: any) {
      addLog('error', err.message);
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
    setTerminalOutput(prev => [...prev, msg]);
  };

  // --- RENDER SIDEBAR ---
  const renderSidebar = () => {
    if (activeSidebar === 'Github') {
      return (
        <div className="github-panel">
          <div className="sidebar-header">SOURCE CONTROL</div>
          <div style={{marginTop: '10px'}}>
            <div className="git-file">
              <span>{selectedFile ? selectedFile.split(/[\\/]/).pop() : 'file.js'}</span> 
              <span className="git-status">M</span>
            </div>
          </div>
          <button className="git-btn" onClick={handleCommit}>
            <i className="fa-solid fa-check"></i> Commit Changes
          </button>
        </div>
      );
    }

    // Default: Explorer
    return (
      <div className="file-list">
        <div className="sidebar-header sidebar-actions">
          <span>PROJECT</span>
          <button className="add-file-btn" onClick={() => setIsCreatingFile(true)} title="New File">
            <i className="fa-solid fa-plus"></i>
          </button>
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
          <div 
            key={file.path} 
            className={`file-item ${selectedFile === file.path ? 'active' : ''}`}
            onClick={() => handleFileSelect(file)}
          >
            <i className={file.name.endsWith('.js') ? "fa-brands fa-js" : "fa-brands fa-python"} 
               style={{color: file.name.endsWith('.js') ? '#f7df1e' : '#3776ab'}}></i>
            {file.name}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="ide-wrapper">
      
      {/* 1. LEFT ACTIVITY BAR */}
      <aside className="activity-bar">
        <div className={`activity-icon ${activeSidebar === 'Explorer' ? 'active' : ''}`} onClick={() => setActiveSidebar('Explorer')}>
          <i className="fa-regular fa-copy"></i>
        </div>
        <div className={`activity-icon ${activeSidebar === 'Search' ? 'active' : ''}`} onClick={() => setActiveSidebar('Search')}>
          <i className="fa-solid fa-magnifying-glass"></i>
        </div>
        <div className={`activity-icon ${activeSidebar === 'Github' ? 'active' : ''}`} onClick={() => setActiveSidebar('Github')}>
          <i className="fa-brands fa-github"></i>
        </div>
        <div className="activity-icon" onClick={() => navigate('/dashboard')} title="Home">
          <i className="fa-solid fa-house"></i>
        </div>
        <div className="spacer"></div>
        <div className="activity-icon" onClick={() => navigate('/settings')}>
          <i className="fa-solid fa-gear"></i>
        </div>
      </aside>

      {/* 2. SIDEBAR CONTENT */}
      <aside className="ide-sidebar">
        {renderSidebar()}
      </aside>

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

        {/* EDITOR SPLIT CONTAINER (FIXED STRUCTURE) */}
        <div className="editor-split-container">
          
          {/* CODE EDITOR (Left/Center) */}
          <div className={`editor-area ${showAnalysis ? 'shrink' : ''}`}>
             <CodeEditor 
               code={code}
               onChange={handleCodeChange} 
               selectedFile={selectedFile}
               onSave={() => window.api.saveFile({ filePath: selectedFile!, content: code })}
               onClose={handleCloseFile} 
             />
          </div>

          {/* ANALYSIS PANEL (Right Side - Conditional) */}
          {showAnalysis && <AnalysisPanel />}
          
        </div>

        {/* 4. BOTTOM TERMINAL */}
        <div className="terminal-section">
          <div className="terminal-header">
            <div className={`terminal-tab ${activeBottomTab === 'Terminal' ? 'active' : ''}`} onClick={() => setActiveBottomTab('Terminal')}>Terminal</div>
            <div className={`terminal-tab ${activeBottomTab === 'Output' ? 'active' : ''}`} onClick={() => setActiveBottomTab('Output')}>Output</div>
            <div className={`terminal-tab ${activeBottomTab === 'Debug' ? 'active' : ''}`} onClick={() => setActiveBottomTab('Debug')}>Debug Console</div>
          </div>

          <div className="terminal-body">
            {activeBottomTab === 'Terminal' && (
              <>
                {terminalOutput.map((line, i) => (
                  <div key={i} className={`terminal-line ${line.toLowerCase().includes('error') ? 'error' : ''}`}>
                    {line}
                  </div>
                ))}
              </>
            )}
            {activeBottomTab === 'Output' && <div style={{color: '#00ff88'}}>[System] Analysis Complete.</div>}
            {activeBottomTab === 'Debug' && <div style={{color: '#888'}}>No debug session active.</div>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EditorScreen;