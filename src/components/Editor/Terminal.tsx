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
  onNavigateToLine
}) => {
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentWorkingDir, setCurrentWorkingDir] = useState('~');
  const [expandedProblem, setExpandedProblem] = useState<number | null>(null);
  const [generatingFix, setGeneratingFix] = useState<number | null>(null);
  const [quickFixes, setQuickFixes] = useState<{[key: number]: string[]}>({});
  const terminalRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const debugRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    <div className="vs-panel-container" style={{display:'flex', flexDirection:'column', height:'100%', background:'#1e1e1e'}}>
      <div className="terminal-header">
        <span 
          className={activeTab === 'Problems' ? 'active' : ''} 
          onClick={() => onTabChange?.('Problems')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          PROBLEMS 
          {problems.length > 0 && (
            <span style={{
              background: '#f14c4c', 
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
        >
          TERMINAL
        </span>
        
        <div style={{marginLeft:'auto', display:'flex', gap:'15px', alignItems: 'center'}}>
          <i 
            className="fa-solid fa-trash" 
            onClick={onClear} 
            style={{ cursor: 'pointer', fontSize: '12px', color: '#cccccc', transition: 'color 0.2s' }} 
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#cccccc'}
            title="Clear"
          ></i>
          <i 
            className="fa-solid fa-chevron-up" 
            onClick={onMaximize}
            style={{ cursor: 'pointer', fontSize: '12px', color: '#cccccc', transition: 'color 0.2s' }} 
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#cccccc'}
            title="Maximize Panel"
          ></i>
          <i 
            className="fa-solid fa-xmark" 
            onClick={onClose}
            style={{ cursor: 'pointer', fontSize: '14px', color: '#cccccc', transition: 'color 0.2s' }} 
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#cccccc'}
            title="Close Panel"
          ></i>
        </div>
      </div>

      {/* PROBLEMS TAB - Shows code errors and warnings */}
      {activeTab === 'Problems' && (
        <div style={{ flex: 1, overflowY: 'auto', background: '#1e1e1e' }}>
          {problems.length === 0 ? (
            <div style={{ 
              color: '#858585', 
              textAlign: 'center', 
              padding: '40px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: '32px', opacity: 0.5, color: '#4ec9b0' }}></i>
              <div style={{ fontSize: '14px' }}>No problems detected</div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>Your code is looking good!</div>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {problems.map((problem, idx) => (
                <div key={idx} style={{ 
                  borderBottom: '1px solid #2d2d2d',
                }}>
                  <div 
                    style={{ 
                      padding: '10px 16px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      background: expandedProblem === idx ? '#2a2d2e' : 'transparent'
                    }}
                    onClick={() => handleProblemClick(problem, idx)}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                    onMouseLeave={(e) => e.currentTarget.style.background = expandedProblem === idx ? '#2a2d2e' : 'transparent'}
                  >
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <i className={`fa-solid ${problem.type === 'error' ? 'fa-circle-xmark' : 'fa-triangle-exclamation'}`} 
                         style={{ 
                           color: problem.type === 'error' ? '#f14c4c' : '#cca700',
                           fontSize: '16px',
                           marginTop: '2px'
                         }}></i>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          color: problem.type === 'error' ? '#f14c4c' : '#cca700', 
                          fontSize: '13px', 
                          marginBottom: '6px',
                          fontWeight: 500,
                          lineHeight: '1.4'
                        }}>
                          {problem.message}
                        </div>
                        <div style={{ fontSize: '12px', color: '#858585', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span>{problem.source}</span>
                          <span>•</span>
                          <span>Line {problem.line}{problem.column ? `, Col ${problem.column}` : ''}</span>
                          <span>•</span>
                          <span style={{ 
                            color: problem.type === 'error' ? '#f14c4c' : '#cca700',
                            textTransform: 'uppercase',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            {problem.type}
                          </span>
                        </div>
                      </div>
                      <i className={`fa-solid fa-chevron-${expandedProblem === idx ? 'up' : 'down'}`} 
                         style={{ fontSize: '12px', color: '#858585', marginTop: '4px' }}></i>
                    </div>
                  </div>
                  
                  {/* Expanded Quick Fix Section */}
                  {expandedProblem === idx && (
                    <div style={{ 
                      padding: '12px 16px 16px 42px',
                      background: '#252526',
                      borderTop: '1px solid #2d2d2d'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#cccccc',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#bc13fe' }}></i>
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
                              background: '#0e639c',
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
                            onMouseLeave={(e) => !generatingFix && (e.currentTarget.style.background = '#0e639c')}
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
                                background: '#1e1e1e',
                                border: '1px solid #3c3c3c',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#2a2d2e';
                                e.currentTarget.style.borderColor = '#0e639c';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#1e1e1e';
                                e.currentTarget.style.borderColor = '#3c3c3c';
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // In a real implementation, this would apply the fix
                                console.log('Applying fix:', fix);
                              }}
                            >
                              <i className="fa-solid fa-circle-check" style={{ color: '#4ec9b0', fontSize: '14px' }}></i>
                              <span style={{ fontSize: '12px', color: '#cccccc', flex: 1 }}>{fix}</span>
                              <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px', color: '#858585' }}></i>
                            </div>
                          ))}
                        </div>
                      ) : generatingFix === idx ? (
                        <div style={{ 
                          padding: '20px', 
                          textAlign: 'center', 
                          color: '#858585',
                          fontSize: '12px'
                        }}>
                          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                          Analyzing code and generating fixes...
                        </div>
                      ) : (
                        <div style={{ 
                          padding: '12px', 
                          textAlign: 'center', 
                          color: '#858585',
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
            color: '#cccccc', 
            fontFamily: 'Consolas, "Courier New", monospace', 
            fontSize: '13px', 
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: '#1e1e1e',
            lineHeight: '1.5'
          }}
        >
          {outputData || (
            <div style={{ color: '#858585' }}>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-play-circle" style={{ fontSize: '20px', color: '#4ec9b0' }}></i>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Program Output</span>
              </div>
              <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                This panel shows the output when you run your code.
                <br />
                <br />
                • Click the <span style={{ color: '#0e639c', fontWeight: 600 }}>Run</span> button to execute your code
                <br />
                • Standard output (stdout) appears here
                <br />
                • Errors are sent to the Debug Console
                <br />
                <br />
                <span style={{ color: '#4ec9b0' }}>Ready to run your code!</span>
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
            color: '#cccccc', 
            fontFamily: 'Consolas, "Courier New", monospace', 
            fontSize: '13px', 
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: '#1e1e1e',
            lineHeight: '1.5'
          }}
        >
          {debugData || (
            <div style={{ color: '#858585' }}>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-bug" style={{ fontSize: '20px', color: '#f14c4c' }}></i>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Debug Console</span>
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
                <span style={{ color: '#858585' }}>No debug output yet.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TERMINAL TAB - Interactive command line */}
      {activeTab === 'Terminal' && (
        <div 
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          onClick={handleTerminalClick}
        >
          <div 
            ref={terminalRef}
            className="terminal-output" 
            style={{
              flex: 1,
              padding:'12px 16px', 
              color:'#cccccc', 
              fontFamily:'Consolas, "Courier New", monospace', 
              fontSize:'13px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: '#1e1e1e',
              lineHeight: '1.5',
              cursor: 'text'
            }}
          >
            {terminalOutput || (
              <div style={{ color: '#858585' }}>
                <div style={{ marginBottom: '8px', color: '#4ec9b0' }}>
                  ╔═══════════════════════════════════════════════════════╗
                  <br />
                  ║  Welcome to LumoFlow Terminal                         ║
                  <br />
                  ╚═══════════════════════════════════════════════════════╝
                </div>
                <div style={{ fontSize: '12px', marginTop: '12px' }}>
                  <div style={{ marginBottom: '6px', color: '#cccccc' }}>Available commands:</div>
                  <div style={{ color: '#569cd6', marginLeft: '16px', lineHeight: '1.8' }}>
                    • <span style={{ color: '#4ec9b0' }}>ls</span> / <span style={{ color: '#4ec9b0' }}>dir</span> - List files and directories
                    <br />
                    • <span style={{ color: '#4ec9b0' }}>cd [path]</span> - Change directory
                    <br />
                    • <span style={{ color: '#4ec9b0' }}>mkdir [name]</span> - Create directory
                    <br />
                    • <span style={{ color: '#4ec9b0' }}>echo [text]</span> - Print text
                    <br />
                    • <span style={{ color: '#4ec9b0' }}>clear</span> - Clear terminal
                    <br />
                    • <span style={{ color: '#4ec9b0' }}>npm</span> / <span style={{ color: '#4ec9b0' }}>git</span> - Run npm or git commands
                  </div>
                  <div style={{ marginTop: '12px', color: '#858585', fontSize: '11px' }}>
                    💡 Tip: Use the <span style={{ color: '#0e639c', fontWeight: 600 }}>Run</span> button to execute your code files.
                    <br />
                    Terminal is for shell commands only.
                  </div>
                  <div style={{ marginTop: '12px', color: '#858585' }}>
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
            borderTop: '1px solid #2d2d2d',
            background: '#1e1e1e',
            alignItems: 'center'
          }}>
            <span style={{ 
              color: '#4ec9b0', 
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
                color: '#cccccc',
                fontFamily: 'Consolas, "Courier New", monospace',
                fontSize: '13px',
                caretColor: '#4ec9b0'
              }}
            />
          </form>
        </div>
      )}
    </div>
  );
};

export default Terminal;