import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useNavigate } from 'react-router-dom';
import '../styles/TerminalScreen.css';

const TerminalScreen: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [code, setCode] = useState<string>("// Select a file to start coding");
  const [terminalOutput, setTerminalOutput] = useState<string[]>(["user@lumoflow:~/project$ _"]);
  const [isRunning, setIsRunning] = useState(false);

  // 1. Load project files on mount
  useEffect(() => {
    loadProject();
  }, []);

  const loadProject = async () => {
    const projectFiles = await (window as any).api.readProjectFiles();
    setFiles(projectFiles);
  };

  const handleFileSelect = async (file: any) => {
    const content = await (window as any).api.readFile(file.path);
    setSelectedFile(file.path);
    setCode(content);
  };

  const handleSave = async () => {
    if (selectedFile) {
      await (window as any).api.saveFile({ filePath: selectedFile, content: code });
      alert("File Saved to System");
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    const output = await (window as any).api.runCode(code);
    setTerminalOutput(prev => [...prev, ...output]);
    setIsRunning(false);
  };

  return (
    <div className="ide-wrapper">
      {/* TOP HEADER */}
      <header className="ide-header">
        <div className="ide-brand">
          <i className="fa-solid fa-bolt"></i> LUMO<span>FLOW</span>
        </div>
        <div className="ide-actions">
          <button className="btn-analyze">Analyze</button>
          <button className="btn-run" onClick={handleRun} disabled={isRunning}>
            <i className={`fa-solid ${isRunning ? 'fa-spinner fa-spin' : 'fa-play'}`}></i> Run
          </button>
          <button className="btn-icon" onClick={() => navigate('/dashboard')}><i className="fa-solid fa-house"></i></button>
          <button className="btn-icon" onClick={() => navigate('/settings')}><i className="fa-solid fa-gear"></i></button>
        </div>
      </header>

      <div className="ide-body">
        {/* SIDEBAR EXPLORER */}
        <aside className="ide-sidebar">
          <div className="sidebar-tabs">
            <div className="tab active"><i className="fa-regular fa-copy"></i> Explorer</div>
            <div className="tab"><i className="fa-solid fa-magnifying-glass"></i></div>
            <div className="tab"><i className="fa-brands fa-github"></i></div>
          </div>
          <div className="file-list">
            <p className="project-label">PROJECT</p>
            {files.map(file => (
              <div 
                key={file.path} 
                className={`file-item ${selectedFile === file.path ? 'active' : ''}`}
                onClick={() => handleFileSelect(file)}
              >
                <i className={`fa-brands ${file.name.endsWith('.py') ? 'fa-python' : 'fa-js'}`}></i>
                {file.name}
              </div>
            ))}
          </div>
        </aside>

        {/* EDITOR AND TERMINAL AREA */}
        <main className="ide-main">
          <div className="editor-section">
            <div className="editor-tabs">
              {selectedFile && <div className="editor-tab active">{selectedFile.split('\\').pop()} <span>x</span></div>}
            </div>
            <Editor
              height="100%"
              theme="vs-dark"
              defaultLanguage="python"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                fontSize: 14,
                minimap: { enabled: true },
                padding: { top: 20 }
              }}
            />
          </div>

          {/* TERMINAL SECTION */}
          <div className="terminal-section">
            <div className="terminal-header">
              <span className="active">Terminal</span>
              <span>Output</span>
              <span>Debug Console</span>
            </div>
            <div className="terminal-body">
              {terminalOutput.map((line, i) => (
                <div key={i} className="terminal-line">{line}</div>
              ))}
              <div className="terminal-cursor">user@lumoflow:~/project$ <span className="blink">_</span></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TerminalScreen;