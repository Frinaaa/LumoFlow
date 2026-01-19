import React, { useEffect, useRef } from 'react';
import { Terminal as Xterm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

// 1. Export Problem Interface
export interface Problem {
  message: string;
  line: number;
  source: string;
  type: 'error' | 'warning';
}

interface TerminalProps {
  activeTab: string; 
  outputData: string;
  debugData: string;
  problems: Problem[];
  onCommand: (cmd: string) => Promise<string>;
  onClear: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ 
  activeTab, 
  outputData, 
  debugData, 
  problems, 
  onCommand, 
  onClear 
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Xterm | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const commandRef = useRef('');

  // Utility function to strip ANSI codes
  const stripAnsiCodes = (str: string): string => {
    return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
  };

  // 2. Initialize Xterm (Interactive Terminal)
  useEffect(() => {
    if (activeTab === 'Terminal' && terminalRef.current && !xtermRef.current) {
      const term = new Xterm({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: "'Consolas', 'Courier New', monospace",
        theme: { background: '#0a0a0e', foreground: '#cccccc' },
        rows: 12,
        allowProposedApi: true
      });
      
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(terminalRef.current);
      fit.fit();
      
      xtermRef.current = term;
      fitAddon.current = fit;
      
      term.writeln('\x1b[1;36mLumoFlow Terminal [Version 1.2.0]\x1b[0m');
      term.write('\r\n$ ');

      term.onData(async (key) => {
        if (key === '\r') { // Enter
          term.write('\r\n');
          const cmd = commandRef.current.trim();
          if (cmd) {
             if (cmd === 'clear') {
                term.clear();
             } else {
                const output = await onCommand(cmd);
                term.write(output.replace(/\n/g, '\r\n'));
                if (output) term.write('\r\n');
             }
          }
          commandRef.current = '';
          term.write('$ ');
        } else if (key === '\u007F') { // Backspace
          if (commandRef.current.length > 0) {
            commandRef.current = commandRef.current.slice(0, -1);
            term.write('\b \b');
          }
        } else {
          commandRef.current += key;
          term.write(key);
        }
      });
      
      const handleResize = () => fit.fit();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    // Resize on tab switch
    if (activeTab === 'Terminal' && fitAddon.current) {
      setTimeout(() => fitAddon.current?.fit(), 10);
    }
  }, [activeTab, onCommand]);

  return (
    <div className="terminal-body" style={{ height: '100%', overflow: 'hidden', padding: 0, backgroundColor: '#0a0a0e' }}>
      
      {/* --- 1. TERMINAL TAB --- */}
      <div 
        ref={terminalRef} 
        style={{ 
          display: activeTab === 'Terminal' ? 'block' : 'none', 
          height: '100%',
          padding: '5px 15px'
        }} 
      />

      {/* --- 2. OUTPUT TAB --- */}
      {activeTab === 'Output' && (
        <div style={{ padding: '10px 15px', height: '100%', overflowY: 'auto', fontFamily: "'Consolas', monospace", fontSize: '13px', color: '#e0e0e0', whiteSpace: 'pre-wrap' }}>
          {outputData ? (
             <div style={{ lineHeight: '1.4' }}>
               {stripAnsiCodes(outputData)}
             </div>
          ) : (
             <span style={{color:'#666', fontStyle:'italic'}}>No output. Run code to see results.</span>
          )}
        </div>
      )}

      {/* --- 3. PROBLEMS TAB --- */}
      {activeTab === 'Problems' && (
        <div style={{ height: '100%', overflowY: 'auto' }}>
          {(!problems || problems.length === 0) ? (
            <div style={{ padding: '15px', color: '#ccc', fontSize: '13px' }}>No problems detected in workspace.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#ccc' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #333', color: '#888' }}>
                  <th style={{ padding: '8px 15px', width: '50px' }}></th>
                  <th style={{ padding: '8px' }}>Description</th>
                  <th style={{ padding: '8px' }}>File</th>
                  <th style={{ padding: '8px' }}>Line</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((prob, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #222', cursor: 'pointer' }}>
                    <td style={{ padding: '8px 15px', textAlign: 'center' }}>
                      <i className="fa-solid fa-circle-xmark" style={{ color: '#ff4444' }}></i>
                    </td>
                    <td style={{ padding: '8px', color: '#ffaaaa' }}>{prob.message}</td>
                    <td style={{ padding: '8px', color: '#888' }}>{prob.source}</td>
                    <td style={{ padding: '8px', color: '#888' }}>{prob.line}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* --- 4. DEBUG TAB --- */}
      {activeTab === 'Debug' && (
        <div style={{ padding: '15px', whiteSpace: 'pre-wrap', fontFamily: 'monospace', height: '100%', overflowY: 'auto', fontSize: '13px' }}>
          {debugData ? (
             <span style={{color: '#ff5555'}}>{stripAnsiCodes(debugData)}</span>
          ) : (
             <span style={{color: '#666'}}>No debug info available.</span>
          )}
        </div>
      )}
    </div>
  );
};

export default Terminal;