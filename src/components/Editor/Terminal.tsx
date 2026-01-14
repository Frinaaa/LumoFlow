import React, { useEffect, useRef } from 'react';

interface TerminalProps {
  output: string[];
  onClear?: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ output, onClear }) => {
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when output updates
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [output]);

  const getLineClass = (line: string): string => {
    if (line.startsWith('❌')) return 'error';
    if (line.startsWith('✅')) return 'success';
    if (line.startsWith('⚠️')) return 'warning';
    if (line.startsWith('▶️')) return 'info';
    if (line.startsWith('📂')) return 'info';
    if (line.startsWith('💾')) return 'success';
    if (line.startsWith('🔍')) return 'info';
    if (line.startsWith('📊')) return 'info';
    if (line.startsWith('─')) return 'separator';
    return '';
  };

  return (
    <div className="terminal-section">
      <div className="terminal-header">
        <span className="active">Terminal</span>
        <span>Output</span>
        <span>Debug Console</span>
        <button 
          className="terminal-clear-btn"
          onClick={onClear}
          title="Clear terminal"
        >
          <i className="fa-solid fa-trash"></i>
        </button>
      </div>
      <div className="terminal-body" ref={terminalBodyRef}>
        {output.length === 0 ? (
          <div className="terminal-line empty">
            Ready to run code. Select a file and click Run or press Ctrl+Enter
          </div>
        ) : (
          output.map((line, i) => (
            <div key={i} className={`terminal-line ${getLineClass(line)}`}>
              {line}
            </div>
          ))
        )}
        <div className="terminal-cursor">
          user@lumoflow:~/project$ <span className="blink">_</span>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
