import React, { useState, useRef, useEffect } from 'react';

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
  onNavigateToLine?: (line: number, column?: number) => void;
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
  const [sessions, setSessions] = useState<TerminalSession[]>([
    { id: '1', name: 'powershell', type: 'powershell', output: 'Windows PowerShell\nCopyright (C) Microsoft.\n\nPS C:\\LumoFlow> ' }
  ]);
  const [activeSessionId, setActiveSessionId] = useState('1');
  const [commandInput, setCommandInput] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession.output, outputData, debugData, activeTab]);

  // --- ACTIONS ---
  const createTerminal = (type: TerminalSession['type'] = 'powershell', name?: string) => {
    const newSession: TerminalSession = {
      id: Date.now().toString(),
      name: name || type,
      type: type,
      output: `\nStarting ${type} session...\nPS C:\\LumoFlow> `
    };
    setSessions([...sessions, newSession]);
    setActiveSessionId(newSession.id);
    setShowProfileMenu(false);
  };

  const killSession = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (sessions.length <= 1) return;
    const newList = sessions.filter(s => s.id !== id);
    setSessions(newList);
    if (activeSessionId === id) setActiveSessionId(newList[0].id);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commandInput.trim()) {
      // Simulate adding command to output (In production, wait for IPC result)
      const timestampedOutput = `\n${commandInput}\nPS C:\\LumoFlow> `;

      setSessions(prev => prev.map(s =>
        s.id === activeSessionId ? { ...s, output: s.output + timestampedOutput } : s
      ));

      onCommand(commandInput);
      setCommandInput('');
    }
  };

  useEffect(() => {
    const handleMenuAction = (e: any) => {
      const action = e?.detail?.action;
      if (!action) return;

      // Map menu actions to terminal helpers in this component
      if (action === 'newTerminal' || action === 'add') {
        createTerminal('powershell');
      } else if (action === 'kill' || action === 'closeTerminal') {
        killSession(activeSessionId);
      } else if (action === 'maximize') {
        onMaximize();
      }
    };

    window.addEventListener('terminal-action', handleMenuAction);
    window.addEventListener('terminal-cmd', handleMenuAction); // support both event names

    return () => {
      window.removeEventListener('terminal-action', handleMenuAction);
      window.removeEventListener('terminal-cmd', handleMenuAction);
    };
  }, [/* handleAddTerminal, handleSplitTerminal, handleCloseTerminal, focusLastTerminal */]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>

      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', height: '35px', background: 'var(--bg-secondary)',
        padding: '0 12px', borderBottom: '1px solid var(--border-light)'
      }}>
        {/* TABS */}
        <div style={{ display: 'flex', height: '100%' }}>
          {['Problems', 'Output', 'Debug Console', 'Terminal'].map(tab => (
            <div
              key={tab}
              onClick={() => onTabChange(tab)}
              style={{
                padding: '0 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '1px solid var(--accent-secondary)' : 'none',
              }}
            >
              {tab}
              {tab === 'Problems' && problems.length > 0 && (
                <span style={{ background: '#0e639c', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>{problems.length}</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}></div>

        {/* TERMINAL TOOLBAR */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-muted)' }}>
          {activeTab === 'Terminal' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'relative' }}>
              <i className="fa-solid fa-plus" onClick={() => createTerminal()} style={{ cursor: 'pointer', padding: '4px' }} title="New Terminal"></i>
              <i className="fa-solid fa-chevron-down" onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ cursor: 'pointer', fontSize: '10px', padding: '4px' }}></i>

              {showProfileMenu && (
                <TerminalProfileMenu onSelect={createTerminal} onClose={() => setShowProfileMenu(false)} />
              )}
            </div>
          )}
          <i className="fa-solid fa-columns" style={{ cursor: 'pointer' }} title="Split Terminal"></i>
          <i className="fa-solid fa-trash-can" onClick={() => killSession(activeSessionId)} style={{ cursor: 'pointer' }} title="Kill Terminal"></i>
          <i className="fa-solid fa-chevron-up" onClick={onMaximize} style={{ cursor: 'pointer' }}></i>
          <i className="fa-solid fa-xmark" onClick={onClose} style={{ cursor: 'pointer', fontSize: '16px' }}></i>
        </div>
      </div>

      {/* MAIN BODY (Content + Instances Sidebar) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* VIEWPORT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div ref={scrollRef} style={{
            flex: 1, overflow: 'auto', padding: '10px 15px',
            fontFamily: '"Cascadia Code", Consolas, monospace', fontSize: '13px'
          }}>
            {activeTab === 'Problems' && <ProblemsView problems={problems} onNavigate={onNavigateToLine} />}
            {activeTab === 'Output' && <pre style={{ color: 'var(--text-secondary)' }}>{outputData || 'No output'}</pre>}
            {activeTab === 'Debug Console' && <pre style={{ color: '#ce9178' }}>{debugData || 'No debug data'}</pre>}
            {activeTab === 'Terminal' && <pre style={{ color: '#ccc', whiteSpace: 'pre-wrap' }}>{activeSession.output}</pre>}
          </div>

          {activeTab === 'Terminal' && (
            <form onSubmit={handleCommandSubmit} style={{
              padding: '5px 15px', display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--bg-primary)', borderTop: '1px solid var(--border-light)'
            }}>
              <span style={{ color: '#00ff00', fontWeight: 'bold' }}>PS {'>'}</span>
              <input
                autoFocus
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                style={{
                  flex: 1, background: 'transparent', border: 'none', color: 'white',
                  outline: 'none', fontFamily: 'monospace', fontSize: '13px'
                }}
              />
            </form>
          )}
        </div>

        {/* INSTANCE SIDEBAR (The Right Column) */}
        {activeTab === 'Terminal' && (
          <div style={{
            width: '180px', borderLeft: '1px solid var(--border-light)',
            background: 'var(--bg-primary)', padding: '5px'
          }}>
            {sessions.map(s => (
              <div
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className="terminal-instance-item"
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 8px',
                  borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginBottom: '2px',
                  background: activeSessionId === s.id ? 'var(--bg-active)' : 'transparent',
                  color: activeSessionId === s.id ? 'var(--text-primary)' : 'var(--text-muted)'
                }}
              >
                <i className={s.type === 'node' ? 'fa-brands fa-node-js' : 'fa-solid fa-terminal'}
                  style={{ fontSize: '14px', width: '15px' }}></i>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                <i className="fa-solid fa-trash-can kill-icon"
                  onClick={(e) => killSession(s.id, e)}
                  style={{ fontSize: '10px', opacity: activeSessionId === s.id ? 1 : 0 }}></i>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .terminal-instance-item:hover { background: var(--bg-hover) !important; color: white !important; }
        .terminal-instance-item:hover .kill-icon { opacity: 1 !important; }
        .menu-item:hover { background: #04395e !important; color: white !important; }
      `}</style>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const TerminalProfileMenu = ({ onSelect, onClose }: { onSelect: (type: any, name: string) => void, onClose: () => void }) => (
  <div style={{
    position: 'absolute', top: '25px', right: 0, width: '240px', background: '#252526',
    border: '1px solid #454545', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 1000,
    borderRadius: '4px', padding: '5px 0'
  }}>
    <div style={menuHeaderStyle}>New Terminal</div>
    <div className="menu-item" onClick={() => onSelect('powershell', 'powershell')} style={menuItemStyle}>
      <span>PowerShell</span> <span style={shortcutStyle}>Ctrl+Shift+`</span>
    </div>
    <div className="menu-item" onClick={() => onSelect('cmd', 'cmd')} style={menuItemStyle}>Command Prompt</div>
    <div className="menu-item" onClick={() => onSelect('node', 'js-debug')} style={menuItemStyle}>JavaScript Debug Terminal</div>
    <div style={{ height: '1px', background: '#454545', margin: '5px 0' }} />
    <div className="menu-item" onClick={onClose} style={menuItemStyle}>Configure Terminal Settings...</div>
  </div>
);

const ProblemsView = ({ problems, onNavigate }: { problems: Problem[], onNavigate?: any }) => (
  <div>
    {problems.length === 0 ? (
      <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>No problems have been detected in the workspace.</div>
    ) : (
      problems.map((p, i) => (
        <div key={i} onClick={() => onNavigate?.(p.line)} style={{ display: 'flex', gap: '10px', padding: '5px 0', cursor: 'pointer' }}>
          <i className="fa-solid fa-circle-xmark" style={{ color: '#f14c4c' }}></i>
          <span style={{ color: 'var(--text-primary)' }}>{p.message}</span>
          <span style={{ color: 'var(--text-muted)' }}>[{p.source}: {p.line}]</span>
        </div>
      ))
    )}
  </div>
);

// --- CSS-IN-JS OBJECTS ---
const menuHeaderStyle: React.CSSProperties = { padding: '5px 15px', fontSize: '10px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase' };
const menuItemStyle: React.CSSProperties = { padding: '6px 15px', fontSize: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', color: '#ccc', transition: '0.1s' };
const shortcutStyle: React.CSSProperties = { color: '#666', fontSize: '10px' };

export default Terminal;