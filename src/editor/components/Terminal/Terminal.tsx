import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../stores/editorStore';

// Extended type for individual terminal sessions
interface TerminalSession {
  id: string;
  name: string;
  type: 'powershell' | 'cmd' | 'node' | 'bash';
  output: string;
}

interface Problem {
  message: string;
  line: number;
  source: string;
  type: 'error' | 'warning';
  column?: number;
}

interface TerminalProps {
  activeTab: string;
  problems: Problem[];
  outputData: string;
  debugData: string;
  onCommand: (cmd: string) => void;
  onClear: () => void;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  onMaximize: () => void;
  onNavigateToLine?: (line: number, column?: number, source?: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({
  activeTab,
  problems,
  outputData,
  debugData,
  onCommand,
  onClear,
  onTabChange,
  onClose,
  onMaximize,
  onNavigateToLine,
}) => {
  // --- STATE MANAGEMENT ---
  const editorStore = useEditorStore();
  const [commandInput, setCommandInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [editorStore.terminalSessions, outputData, debugData, activeTab, editorStore.activeTerminalSessionId]);

  const activeSession = editorStore.terminalSessions.find(s => s.id === editorStore.activeTerminalSessionId);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commandInput.trim()) {
      // In a real app, we'd send to the backend for the specific session ID
      // For now, we simulate echoing to the active session
      editorStore.appendTerminalOutput(`PS C:\\LumoFlow> ${commandInput}\n`);
      onCommand(commandInput);
      setCommandInput('');
    }
  };

  const handleClear = () => {
    editorStore.clearTerminalOutput();
    onClear();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e' }}>

      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', height: '35px', background: '#252526',
        padding: '0 12px', borderBottom: '1px solid #2d2d2d'
      }}>
        {/* TABS */}
        <div style={{ display: 'flex', height: '100%' }}>
          {['Problems', 'Output', 'Debug Console', 'Terminal'].map(tab => (
            <div
              key={tab}
              onClick={() => onTabChange(tab)}
              style={{
                padding: '0 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2px',
                color: activeTab === tab ? '#ffffff' : '#969696',
                borderBottom: activeTab === tab ? '1px solid #00f2ff' : 'none',
                height: '100%'
              }}
            >
              {tab}
              {tab === 'Problems' && problems.length > 0 && (
                <span style={{
                  background: problems.some(p => p.type === 'error') ? '#f14c4c' : '#cca700',
                  color: 'white', padding: '1px 5px', borderRadius: '10px', fontSize: '10px',
                  marginLeft: '4px', minWidth: '16px', textAlign: 'center'
                }}>
                  {problems.length}
                </span>
              )}
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}></div>

        {/* TERMINAL TOOLBAR */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#969696' }}>

          {/* TERMINAL DROPDOWN & ACTIONS */}
          {activeTab === 'Terminal' && (
            <>
              <div style={{ position: 'relative' }}>
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer',
                    padding: '2px 6px', borderRadius: '3px', background: isDropdownOpen ? '#3c3c3c' : 'transparent'
                  }}
                  title="Switch Terminal"
                >
                  <i className="fa-solid fa-terminal" style={{ fontSize: '12px' }}></i>
                  <span style={{ fontSize: '12px' }}>{activeSession?.name || 'Terminal'}</span>
                  <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px' }}></i>
                </div>

                {/* DROPDOWN MENU */}
                {isDropdownOpen && (
                  <>
                    <div
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: '5px',
                      background: '#252526', border: '1px solid #454545', borderRadius: '4px',
                      width: '200px', zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                    }}>
                      <div style={menuHeaderStyle}>OPEN TERMINALS</div>
                      {editorStore.terminalSessions.map(session => (
                        <div
                          key={session.id}
                          onClick={() => { editorStore.setActiveTerminalSession(session.id); setIsDropdownOpen(false); }}
                          style={{
                            ...menuItemStyle,
                            background: session.id === editorStore.activeTerminalSessionId ? '#37373d' : 'transparent',
                            color: session.id === editorStore.activeTerminalSessionId ? 'white' : '#ccc'
                          }}
                        >
                          <span>
                            <i className="fa-solid fa-terminal" style={{ marginRight: '8px', fontSize: '10px' }}></i>
                            {session.name}
                          </span>
                          {session.id === editorStore.activeTerminalSessionId && <i className="fa-solid fa-check"></i>}
                        </div>
                      ))}

                      <div style={{ height: '1px', background: '#454545', margin: '4px 0' }}></div>

                      <div style={menuItemStyle} onClick={() => { editorStore.createTerminalSession('PowerShell', 'powershell'); setIsDropdownOpen(false); }}>
                        <span><i className="fa-solid fa-plus" style={{ marginRight: '8px', fontSize: '10px' }}></i>New Terminal</span>
                      </div>
                      <div style={menuItemStyle} onClick={() => { editorStore.splitTerminal(); setIsDropdownOpen(false); }}>
                        <span><i className="fa-solid fa-table-columns" style={{ marginRight: '8px', fontSize: '10px' }}></i>Split Terminal</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={{ width: '1px', height: '14px', background: '#454545', margin: '0 5px' }}></div>

              <i className="fa-solid fa-plus" onClick={() => editorStore.createTerminalSession('PowerShell', 'powershell')} style={{ cursor: 'pointer', fontSize: '14px' }} title="New Terminal"></i>
              <i className="fa-solid fa-trash-can"
                onClick={() => activeSession && editorStore.removeTerminalSession(activeSession.id)}
                style={{ cursor: 'pointer', fontSize: '14px' }}
                title="Kill Terminal"
              ></i>

              <div style={{ width: '1px', height: '14px', background: '#454545', margin: '0 5px' }}></div>
            </>
          )}

          <i className="fa-solid fa-ban" onClick={handleClear} style={{ cursor: 'pointer', fontSize: '14px' }} title="Clear Output"></i>
          <i className="fa-solid fa-chevron-up" onClick={onMaximize} style={{ cursor: 'pointer', fontSize: '14px' }} title="Toggle Maximize"></i>
          <i className="fa-solid fa-xmark" onClick={onClose} style={{ cursor: 'pointer', fontSize: '16px' }} title="Close Panel"></i>
        </div>
      </div>

      {/* MAIN BODY */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '10px 15px',
          fontFamily: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
          fontSize: '13px',
          lineHeight: '1.4',
          scrollbarWidth: 'thin'
        }}
        onClick={() => {
          // Focus input when clicking anywhere in terminal area if Terminal tab is active
          if (activeTab === 'Terminal') document.getElementById('terminal-input')?.focus();
        }}
      >
        {activeTab === 'Problems' && (
          <ProblemsView
            problems={problems}
            onNavigate={(line, col, source) => {
              window.dispatchEvent(new CustomEvent('monaco-cmd', {
                detail: { action: 'revealLine', value: line, column: col, file: source }
              }));
            }}
          />
        )}

        {activeTab === 'Output' && <pre style={{ color: '#cccccc', whiteSpace: 'pre-wrap', margin: 0 }}>{outputData || 'No output'}</pre>}

        {activeTab === 'Debug Console' && <pre style={{ color: '#ce9178', whiteSpace: 'pre-wrap', margin: 0 }}>{debugData || 'No debug data'}</pre>}

        {activeTab === 'Terminal' && activeSession && (
          <div style={{ color: '#cccccc' }}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{activeSession.content}</div>
            <form onSubmit={handleCommandSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#4ec9b0', fontWeight: 'bold' }}>PS C:\LumoFlow{'>'}</span>
              <input
                id="terminal-input"
                autoFocus
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                autoComplete="off"
                spellCheck="false"
                style={{
                  flex: 1, background: 'transparent', border: 'none', color: 'white',
                  outline: 'none', fontFamily: 'inherit', fontSize: 'inherit',
                  padding: 0
                }}
              />
            </form>
          </div>
        )}
        {activeTab === 'Terminal' && !activeSession && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
            <p>No active terminal session</p>
            <button
              onClick={() => editorStore.createTerminalSession()}
              style={{
                background: '#0e639c', color: 'white', border: 'none', padding: '6px 12px',
                cursor: 'pointer', marginTop: '10px', borderRadius: '2px'
              }}
            >
              Create New Terminal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const ProblemsView = ({ problems, onNavigate }: { problems: Problem[], onNavigate: (line: number, col: number, source: string) => void }) => {
  // Group problems by source (file)
  const grouped = problems.reduce((acc, p) => {
    if (!acc[p.source]) acc[p.source] = [];
    acc[p.source].push(p);
    return acc;
  }, {} as Record<string, Problem[]>);

  if (problems.length === 0) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>No problems have been detected in the workspace.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {Object.entries(grouped).map(([source, fileProblems]) => (
        <div key={source}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '12px',
            marginBottom: '5px'
          }}>
            <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px' }}></i>
            <i className="fa-solid fa-file-code" style={{ color: '#00f2ff' }}></i>
            <span>{source}</span>
          </div>
          <div style={{ marginLeft: '20px' }}>
            {fileProblems.map((p, i) => (
              <div
                key={i}
                onClick={() => onNavigate(p.line, p.column || 1, source)}
                style={{
                  display: 'flex', gap: '10px', padding: '4px 0', cursor: 'pointer',
                  fontSize: '12px', borderBottom: '1px solid #2d2d2d'
                }}
              >
                <i className={p.type === 'error' ? "fa-solid fa-circle-xmark" : "fa-solid fa-triangle-exclamation"}
                  style={{ color: p.type === 'error' ? '#f14c4c' : '#cca700' }}></i>
                <span style={{ color: 'var(--text-primary)', flex: 1 }}>{p.message}</span>
                <span style={{ color: 'var(--text-muted)' }}>[{p.line}, {p.column || 1}]</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// --- CSS-IN-JS OBJECTS ---
const menuHeaderStyle: React.CSSProperties = { padding: '5px 15px', fontSize: '10px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase' };
const menuItemStyle: React.CSSProperties = { padding: '6px 15px', fontSize: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', color: '#ccc', transition: '0.1s' };
const shortcutStyle: React.CSSProperties = { color: '#666', fontSize: '10px' };

export default Terminal;