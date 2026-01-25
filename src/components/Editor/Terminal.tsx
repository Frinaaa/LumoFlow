import React, { useState, useRef, useEffect } from 'react';

interface Problem {
  message: string;
  line: number;
  source: string;
  type: 'error' | 'warning';
  column?: number;
  code?: string;
  severity?: number;
}

interface TerminalProps {
  activeTab: string;
  terminalOutput: string;
  outputData: string;
  debugData: string;
  problems: Problem[];
  onCommand: (cmd: string) => Promise<string>;
  onClear: () => void;
  onTabChange?: (tab: string) => void;
  onClose?: () => void;
  onMaximize?: () => void;
  onNavigateToLine?: (line: number, column?: number) => void;
  onDragStart?: (e: React.MouseEvent) => void;
}

const Terminal: React.FC<TerminalProps> = ({ 
  activeTab, 
  terminalOutput,
  outputData,
  debugData,
  problems, 
  onCommand, 
  onClear,
  onTabChange,
  onClose,
  onMaximize,
  onNavigateToLine,
  onDragStart
}) => {
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [expandedProblem, setExpandedProblem] = useState<number | null>(null);
  const [generatingFix, setGeneratingFix] = useState<number | null>(null);
  const [quickFixes, setQuickFixes] = useState<{[key: number]: string[]}>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [terminalName, setTerminalName] = useState('Terminal');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const debugRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll for terminal
  useEffect(() => {
    if (terminalRef.current && activeTab === 'Terminal') {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput, activeTab]);

  // Auto-scroll for output
  useEffect(() => {
    if (outputRef.current && activeTab === 'Output') {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputData, activeTab]);

  // Auto-scroll for debug
  useEffect(() => {
    if (debugRef.current && activeTab === 'Debug') {
      debugRef.current.scrollTop = debugRef.current.scrollHeight;
    }
  }, [debugData, activeTab]);

  // Focus input when terminal tab is active
  useEffect(() => {
    if (activeTab === 'Terminal' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeTab]);

  // Focus rename input when renaming
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Keyboard shortcuts for terminal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab === 'Terminal') {
        // F2 - Rename terminal
        if (e.key === 'F2') {
          e.preventDefault();
          handleRename();
        }
        // Delete - Kill terminal (with confirmation)
        else if (e.key === 'Delete' && e.ctrlKey) {
          e.preventDefault();
          if (confirm('Are you sure you want to kill this terminal?')) {
            handleKillTerminal();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // Add to command history
      setCommandHistory(prev => [...prev, input]);
      setHistoryIndex(-1);
      
      // Execute command
      await onCommand(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Arrow Up - Previous command
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    }
    // Arrow Down - Next command
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    }
    // Ctrl+C - Clear current input
    else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      setInput('');
    }
    // Ctrl+L - Clear terminal
    else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      onClear();
    }
  };

  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate position to keep menu visible
    const menuWidth = 280;
    const menuHeight = 320;
    const x = e.clientX + menuWidth > window.innerWidth 
      ? window.innerWidth - menuWidth - 10 
      : e.clientX;
    const y = e.clientY + menuHeight > window.innerHeight 
      ? window.innerHeight - menuHeight - 10 
      : e.clientY;
    
    setContextMenu({ x, y });
  };

  const handleSplitTerminal = () => {
    console.log('Split Terminal - Create new terminal instance');
    // In a real implementation, this would create a new terminal instance
    setContextMenu(null);
  };

  const handleMoveToEditor = () => {
    console.log('Move Terminal into Editor Area');
    // In a real implementation, this would move terminal to editor area
    setContextMenu(null);
  };

  const handleMoveToWindow = () => {
    console.log('Move Terminal into New Window');
    // In a real implementation, this would open terminal in new window
    setContextMenu(null);
  };

  const handleChangeColor = () => {
    console.log('Change Terminal Color');
    // In a real implementation, this would open color picker
    setContextMenu(null);
  };

  const handleChangeIcon = () => {
    console.log('Change Terminal Icon');
    // In a real implementation, this would open icon selector
    setContextMenu(null);
  };

  const handleRename = () => {
    setIsRenaming(true);
    setRenameValue(terminalName);
    setContextMenu(null);
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim()) {
      setTerminalName(renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
    }
  };

  const handleToggleSize = () => {
    console.log('Toggle Size to Content Width');
    // In a real implementation, this would adjust terminal width
    setContextMenu(null);
  };

  const handleKillTerminal = () => {
    console.log('Kill Terminal');
    if (onClose) {
      onClose();
    }
    setContextMenu(null);
  };

  const handleProblemClick = (problem: Problem, index: number) => {
    // Navigate to the line in the code editor
    if (onNavigateToLine) {
      onNavigateToLine(problem.line, problem.column);
    }
    // Toggle expanded state
    setExpandedProblem(expandedProblem === index ? null : index);
  };

  const generateQuickFix = async (problem: Problem, index: number) => {
    setGeneratingFix(index);
    
    try {
      // Simulate AI-powered quick fix generation
      // In a real implementation, this would call an AI API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const fixes: string[] = [];
      
      // Generate contextual fixes based on error type
      if (problem.message.includes('undefined')) {
        fixes.push('Add variable declaration before usage');
        fixes.push('Check if variable is defined before accessing');
        fixes.push('Initialize variable with default value');
      } else if (problem.message.includes('not defined')) {
        fixes.push('Import missing module or function');
        fixes.push('Declare the variable or function');
        fixes.push('Check for typos in the name');
      } else if (problem.message.includes('syntax')) {
        fixes.push('Fix syntax error at line ' + problem.line);
        fixes.push('Check for missing brackets or parentheses');
        fixes.push('Verify proper indentation');
      } else if (problem.message.includes('type')) {
        fixes.push('Add type annotation');
        fixes.push('Convert to correct type');
        fixes.push('Use type assertion');
      } else {
        fixes.push('Review code at line ' + problem.line);
        fixes.push('Check documentation for correct usage');
        fixes.push('Add error handling');
      }
      
      setQuickFixes(prev => ({ ...prev, [index]: fixes }));
    } catch (error) {
      console.error('Error generating quick fix:', error);
    } finally {
      setGeneratingFix(null);
    }
  };

  return (
    <div className="vs-panel-container" style={{display:'flex', flexDirection:'column', height:'100%', background:'var(--bg-primary)'}}>
      <div className="terminal-header">
        <span 
          className={activeTab === 'Problems' ? 'active' : ''} 
          onClick={() => onTabChange?.('Problems')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          PROBLEMS 
          {problems.length > 0 && (
            <span style={{
              background: 'var(--error-color)', 
              padding:'2px 6px', 
              borderRadius:'10px', 
              color:'white', 
              fontSize:'10px',
              fontWeight: 600,
              minWidth: '18px',
              textAlign: 'center'
            }}>
              {problems.length}
            </span>
          )}
        </span>
        <span 
          className={activeTab === 'Output' ? 'active' : ''} 
          onClick={() => onTabChange?.('Output')}
        >
          OUTPUT
        </span>
        <span 
          className={activeTab === 'Debug' ? 'active' : ''} 
          onClick={() => onTabChange?.('Debug')}
        >
          DEBUG CONSOLE
        </span>
        <span 
          className={activeTab === 'Terminal' ? 'active' : ''} 
          onClick={() => onTabChange?.('Terminal')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {isRenaming && activeTab === 'Terminal' ? (
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleRenameKeyDown}
              style={{
                background: '#3c3c3c',
                border: '1px solid #0e639c',
                color: '#cccccc',
                padding: '2px 6px',
                fontSize: '11px',
                fontFamily: 'inherit',
                outline: 'none',
                borderRadius: '2px',
                width: '120px'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            terminalName.toUpperCase()
          )}
        </span>
        
        <div style={{marginLeft:'auto', display:'flex', gap:'15px', alignItems: 'center'}}>
          <i 
            className="fa-solid fa-grip-vertical" 
            onMouseDown={onDragStart}
            style={{ 
              cursor: 'move', 
              fontSize: '12px', 
              color: 'var(--text-secondary)', 
              opacity: 0.5,
              transition: 'opacity 0.2s' 
            }} 
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
            title="Drag to move panel"
          ></i>
          <i 
            className="fa-solid fa-trash" 
            onClick={onClear} 
            style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)', transition: 'color 0.2s' }} 
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            title="Clear"
          ></i>
          <i 
            className="fa-solid fa-chevron-up" 
            onClick={onMaximize}
            style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)', transition: 'color 0.2s' }} 
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            title="Maximize Panel"
          ></i>
          <i 
            className="fa-solid fa-xmark" 
            onClick={onClose}
            style={{ cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)', transition: 'color 0.2s' }} 
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#cccccc'}
            title="Close Panel"
          ></i>
        </div>
      </div>

      {/* PROBLEMS TAB - Shows code errors and warnings */}
      {activeTab === 'Problems' && (
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
          {problems.length === 0 ? (
            <div style={{ 
              color: 'var(--text-muted)', 
              textAlign: 'center', 
              padding: '40px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: '32px', opacity: 0.5, color: 'var(--success-color)' }}></i>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No problems detected</div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>Your code is looking good!</div>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {problems.map((problem, idx) => (
                <div key={idx} style={{ 
                  borderBottom: '1px solid var(--border-color)',
                }}>
                  <div 
                    style={{ 
                      padding: '10px 16px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      background: expandedProblem === idx ? 'var(--bg-hover)' : 'transparent'
                    }}
                    onClick={() => handleProblemClick(problem, idx)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = expandedProblem === idx ? 'var(--bg-hover)' : 'transparent'}
                  >
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <i className={`fa-solid ${problem.type === 'error' ? 'fa-circle-xmark' : 'fa-triangle-exclamation'}`} 
                         style={{ 
                           color: problem.type === 'error' ? 'var(--error-color)' : 'var(--warning-color)',
                           fontSize: '16px',
                           marginTop: '2px'
                         }}></i>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          color: problem.type === 'error' ? 'var(--error-color)' : 'var(--warning-color)', 
                          fontSize: '13px', 
                          marginBottom: '6px',
                          fontWeight: 500,
                          lineHeight: '1.4'
                        }}>
                          {problem.message}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span>{problem.source}</span>
                          <span>•</span>
                          <span>Line {problem.line}{problem.column ? `, Col ${problem.column}` : ''}</span>
                          <span>•</span>
                          <span style={{ 
                            color: problem.type === 'error' ? 'var(--error-color)' : 'var(--warning-color)',
                            textTransform: 'uppercase',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            {problem.type}
                          </span>
                        </div>
                      </div>
                      <i className={`fa-solid fa-chevron-${expandedProblem === idx ? 'up' : 'down'}`} 
                         style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}></i>
                    </div>
                  </div>
                  
                  {/* Expanded Quick Fix Section */}
                  {expandedProblem === idx && (
                    <div style={{ 
                      padding: '12px 16px 16px 42px',
                      background: 'var(--bg-secondary)',
                      borderTop: '1px solid var(--border-color)'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <i className="fa-solid fa-wand-magic-sparkles" style={{ color: 'var(--accent-secondary)' }}></i>
                          AI Quick Fixes
                        </div>
                        {!quickFixes[idx] && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              generateQuickFix(problem, idx);
                            }}
                            disabled={generatingFix === idx}
                            style={{
                              background: 'var(--accent-blue)',
                              border: 'none',
                              color: '#ffffff',
                              padding: '4px 12px',
                              borderRadius: '3px',
                              fontSize: '11px',
                              cursor: generatingFix === idx ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'background 0.2s',
                              opacity: generatingFix === idx ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => !generatingFix && (e.currentTarget.style.background = '#1177bb')}
                            onMouseLeave={(e) => !generatingFix && (e.currentTarget.style.background = 'var(--accent-blue)')}
                          >
                            {generatingFix === idx ? (
                              <>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                Generating...
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-lightbulb"></i>
                                Generate Fixes
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      
                      {quickFixes[idx] ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {quickFixes[idx].map((fix, fixIdx) => (
                            <div
                              key={fixIdx}
                              style={{
                                padding: '10px 12px',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-light)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--bg-hover)';
                                e.currentTarget.style.borderColor = 'var(--accent-blue)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--bg-primary)';
                                e.currentTarget.style.borderColor = 'var(--border-light)';
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Applying fix:', fix);
                              }}
                            >
                              <i className="fa-solid fa-circle-check" style={{ color: 'var(--success-color)', fontSize: '14px' }}></i>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1 }}>{fix}</span>
                              <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px', color: 'var(--text-muted)' }}></i>
                            </div>
                          ))}
                        </div>
                      ) : generatingFix === idx ? (
                        <div style={{ 
                          padding: '20px', 
                          textAlign: 'center', 
                          color: 'var(--text-muted)',
                          fontSize: '12px'
                        }}>
                          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                          Analyzing code and generating fixes...
                        </div>
                      ) : (
                        <div style={{ 
                          padding: '12px', 
                          textAlign: 'center', 
                          color: 'var(--text-muted)',
                          fontSize: '12px',
                          fontStyle: 'italic'
                        }}>
                          Click "Generate Fixes" to get AI-powered suggestions
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OUTPUT TAB - Shows program execution output (from Run button) */}
      {activeTab === 'Output' && (
        <div 
          ref={outputRef}
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            color: 'var(--text-secondary)', 
            fontFamily: 'Consolas, "Courier New", monospace', 
            fontSize: '13px', 
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: 'var(--bg-primary)',
            lineHeight: '1.5'
          }}
        >
          {outputData || (
            <div style={{ color: 'var(--text-muted)' }}>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-play-circle" style={{ fontSize: '20px', color: 'var(--success-color)' }}></i>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Program Output</span>
              </div>
              <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                This panel shows the output when you run your code.
                <br />
                <br />
                • Click the <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Run</span> button to execute your code
                <br />
                • Standard output (stdout) appears here
                <br />
                • Errors are sent to the Debug Console
                <br />
                <br />
                <span style={{ color: 'var(--success-color)' }}>Ready to run your code!</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DEBUG CONSOLE TAB - For debugging output and runtime errors */}
      {activeTab === 'Debug' && (
        <div 
          ref={debugRef}
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            color: 'var(--text-secondary)', 
            fontFamily: 'Consolas, "Courier New", monospace', 
            fontSize: '13px', 
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: 'var(--bg-primary)',
            lineHeight: '1.5'
          }}
        >
          {debugData || (
            <div style={{ color: 'var(--text-muted)' }}>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-bug" style={{ fontSize: '20px', color: 'var(--error-color)' }}></i>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Debug Console</span>
              </div>
              <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                This panel shows debugging information and runtime errors.
                <br />
                <br />
                • Runtime errors (stderr) appear here
                <br />
                • console.log() statements
                <br />
                • Stack traces and error details
                <br />
                • Debugging information
                <br />
                <br />
                <span style={{ color: 'var(--text-muted)' }}>No debug output yet.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TERMINAL TAB - Interactive command line */}
      {activeTab === 'Terminal' && (
        <div 
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
          onClick={handleTerminalClick}
          onContextMenu={handleContextMenu}
        >
          <div 
            ref={terminalRef}
            className="terminal-output" 
            style={{
              flex: 1,
              padding:'12px 16px', 
              color:'var(--text-secondary)', 
              fontFamily:'Consolas, "Courier New", monospace', 
              fontSize:'13px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: 'var(--bg-primary)',
              lineHeight: '1.5',
              cursor: 'text'
            }}
          >
            {terminalOutput || (
              <div style={{ color: 'var(--text-muted)' }}>
                <div style={{ marginBottom: '8px', color: 'var(--success-color)' }}>
                  ╔═══════════════════════════════════════════════════════╗
                  <br />
                  ║  Welcome to LumoFlow Terminal                         ║
                  <br />
                  ╚═══════════════════════════════════════════════════════╝
                </div>
                <div style={{ fontSize: '12px', marginTop: '12px' }}>
                  <div style={{ marginBottom: '6px', color: 'var(--text-secondary)' }}>Available commands:</div>
                  <div style={{ color: 'var(--accent-blue)', marginLeft: '16px', lineHeight: '1.8' }}>
                    • <span style={{ color: 'var(--success-color)' }}>ls</span> / <span style={{ color: 'var(--success-color)' }}>dir</span> - List files and directories
                    <br />
                    • <span style={{ color: 'var(--success-color)' }}>cd [path]</span> - Change directory
                    <br />
                    • <span style={{ color: 'var(--success-color)' }}>mkdir [name]</span> - Create directory
                    <br />
                    • <span style={{ color: 'var(--success-color)' }}>echo [text]</span> - Print text
                    <br />
                    • <span style={{ color: 'var(--success-color)' }}>clear</span> - Clear terminal
                    <br />
                    • <span style={{ color: 'var(--success-color)' }}>npm</span> / <span style={{ color: 'var(--success-color)' }}>git</span> - Run npm or git commands
                  </div>
                  <div style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '11px' }}>
                    💡 Tip: Use the <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Run</span> button to execute your code files.
                    <br />
                    Terminal is for shell commands only.
                  </div>
                  <div style={{ marginTop: '12px', color: 'var(--text-muted)' }}>
                    Keyboard shortcuts:
                    <br />
                    <span style={{ marginLeft: '16px' }}>↑/↓ - Navigate command history</span>
                    <br />
                    <span style={{ marginLeft: '16px' }}>Ctrl+C - Cancel current input</span>
                    <br />
                    <span style={{ marginLeft: '16px' }}>Ctrl+L - Clear terminal</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} style={{ 
            display: 'flex', 
            padding: '8px 16px', 
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            alignItems: 'center'
          }}>
            <span style={{ 
              color: 'var(--success-color)', 
              marginRight: '8px', 
              fontFamily: 'Consolas, monospace', 
              fontSize: '13px',
              fontWeight: 'bold'
            }}>
              $
            </span>
            <input 
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command..."
              autoComplete="off"
              spellCheck={false}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-secondary)',
                fontFamily: 'Consolas, "Courier New", monospace',
                fontSize: '13px',
                caretColor: 'var(--success-color)'
              }}
            />
          </form>

          {/* Context Menu */}
          {contextMenu && (
            <div
              style={{
                position: 'fixed',
                left: contextMenu.x,
                top: contextMenu.y,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: '4px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                zIndex: 10000,
                minWidth: '280px',
                padding: '4px 0',
                fontFamily: 'Segoe UI, sans-serif',
                fontSize: '13px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                onClick={handleSplitTerminal}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: 'var(--text-secondary)',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <i className="fa-solid fa-columns" style={{ width: '16px', fontSize: '12px', color: 'var(--text-muted)' }}></i>
                <span>Split Terminal</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>Ctrl+Shift+5</span>
              </div>

              <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }}></div>

              <div
                onClick={handleMoveToEditor}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: 'var(--text-secondary)',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <i className="fa-solid fa-arrow-up-right-from-square" style={{ width: '16px', fontSize: '12px', color: 'var(--text-muted)' }}></i>
                <span>Move Terminal into Editor Area</span>
              </div>

              <div
                onClick={handleMoveToWindow}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: 'var(--text-secondary)',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <i className="fa-solid fa-window-restore" style={{ width: '16px', fontSize: '12px', color: 'var(--text-muted)' }}></i>
                <span>Move Terminal into New Window</span>
              </div>

              <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }}></div>

              <div
                onClick={handleChangeColor}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: 'var(--text-secondary)',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <i className="fa-solid fa-palette" style={{ width: '16px', fontSize: '12px', color: 'var(--text-muted)' }}></i>
                <span>Change Color...</span>
              </div>

              <div
                onClick={handleChangeIcon}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: 'var(--text-secondary)',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <i className="fa-solid fa-icons" style={{ width: '16px', fontSize: '12px', color: 'var(--text-muted)' }}></i>
                <span>Change Icon...</span>
              </div>

              <div
                onClick={handleRename}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: 'var(--text-secondary)',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <i className="fa-solid fa-pen" style={{ width: '16px', fontSize: '12px', color: 'var(--text-muted)' }}></i>
                <span>Rename...</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>F2</span>
              </div>

              <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }}></div>

              <div
                onClick={handleToggleSize}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: 'var(--text-secondary)',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <i className="fa-solid fa-arrows-left-right" style={{ width: '16px', fontSize: '12px', color: 'var(--text-muted)' }}></i>
                <span>Toggle Size to Content Width</span>
              </div>

              <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }}></div>

              <div
                onClick={handleKillTerminal}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: 'var(--error-color)',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <i className="fa-solid fa-skull-crossbones" style={{ width: '16px', fontSize: '12px' }}></i>
                <span>Kill Terminal</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>Delete</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Terminal;