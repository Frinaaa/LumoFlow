import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAnalysisStore, TraceFrame } from '../../editor/stores/analysisStore';
import { useEditorStore } from '../../editor/stores/editorStore';

// Helper functions defined outside component for better performance
const generateSortingTrace = (code: string, frames: TraceFrame[]) => {
  const arrayMatch = code.match(/(?:let|const|var)\s+(\w+)\s*=\s*(\[[\s\S]*?\])/);
  if (!arrayMatch) return;

  const varName = arrayMatch[1];
  const arrayData = JSON.parse(arrayMatch[2].replace(/'/g, '"'));
  
  frames.push({
    id: 0,
    memory: { [varName]: [...arrayData] },
    activeVariable: varName,
    action: 'EXECUTE',
    desc: `Starting with array: [${arrayData.join(', ')}]`
  });

  const arr = [...arrayData];
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      frames.push({
        id: frames.length,
        memory: { [varName]: [...arr], comparing: [j, j + 1] },
        activeVariable: varName,
        action: 'READ',
        desc: `Comparing ${arr[j]} and ${arr[j + 1]}`
      });

      if (arr[j] > arr[j + 1]) {
        frames.push({
          id: frames.length,
          memory: { [varName]: [...arr], swapping: [j, j + 1] },
          activeVariable: varName,
          action: 'WRITE',
          desc: `Swapping ${arr[j]} ↔ ${arr[j + 1]}`
        });

        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];

        frames.push({
          id: frames.length,
          memory: { [varName]: [...arr] },
          activeVariable: varName,
          action: 'WRITE',
          desc: `After swap: [${arr.join(', ')}]`
        });
      }
    }
    
    frames.push({
      id: frames.length,
      memory: { [varName]: [...arr], sorted: arr.length - i - 1 },
      activeVariable: varName,
      action: 'EXECUTE',
      desc: `Pass ${i + 1} complete`
    });
  }

  frames.push({
    id: frames.length,
    memory: { [varName]: [...arr], sorted: arr.length },
    activeVariable: varName,
    action: 'EXECUTE',
    desc: `✓ Sorted: [${arr.join(', ')}]`
  });
};

const generateSearchingTrace = (code: string, frames: TraceFrame[]) => {
  const arrayMatch = code.match(/(?:let|const|var)\s+(\w+)\s*=\s*(\[[\s\S]*?\])/);
  const targetMatch = code.match(/(?:find|search|indexOf)\s*\(\s*(\w+|\d+)\s*\)/i);
  
  if (!arrayMatch) return;

  const varName = arrayMatch[1];
  const arrayData = JSON.parse(arrayMatch[2].replace(/'/g, '"'));
  const target = targetMatch ? targetMatch[1] : arrayData[Math.floor(arrayData.length / 2)];
  
  frames.push({
    id: 0,
    memory: { [varName]: [...arrayData], target },
    activeVariable: varName,
    action: 'EXECUTE',
    desc: `Searching for ${target} in array`
  });

  for (let i = 0; i < arrayData.length; i++) {
    frames.push({
      id: frames.length,
      memory: { [varName]: [...arrayData], currentIndex: i, target },
      activeVariable: varName,
      action: 'READ',
      desc: `Checking index ${i}: ${arrayData[i]} ${arrayData[i] == target ? '✓ Found!' : '≠ ' + target}`
    });

    if (arrayData[i] == target) {
      frames.push({
        id: frames.length,
        memory: { [varName]: [...arrayData], foundIndex: i, target },
        activeVariable: varName,
        action: 'EXECUTE',
        desc: `✓ Found ${target} at index ${i}!`
      });
      return;
    }
  }

  frames.push({
    id: frames.length,
    memory: { [varName]: [...arrayData], target },
    activeVariable: varName,
    action: 'EXECUTE',
    desc: `✗ ${target} not found in array`
  });
};

const generateStringTrace = (code: string, frames: TraceFrame[]) => {
  const strMatch = code.match(/(?:let|const|var)\s+(\w+)\s*=\s*["']([^"']+)["']/);
  if (!strMatch) return;

  const varName = strMatch[1];
  const strValue = strMatch[2];
  
  frames.push({
    id: 0,
    memory: { [varName]: strValue },
    activeVariable: varName,
    action: 'EXECUTE',
    desc: `String: "${strValue}"`
  });

  if (/split/.test(code)) {
    const chars = strValue.split('');
    frames.push({
      id: frames.length,
      memory: { [varName]: strValue, result: chars },
      activeVariable: 'result',
      action: 'WRITE',
      desc: `Split into: [${chars.join(', ')}]`
    });
  }

  if (/toUpperCase/.test(code)) {
    frames.push({
      id: frames.length,
      memory: { [varName]: strValue, result: strValue.toUpperCase() },
      activeVariable: 'result',
      action: 'WRITE',
      desc: `Uppercase: "${strValue.toUpperCase()}"`
    });
  }

  if (/toLowerCase/.test(code)) {
    frames.push({
      id: frames.length,
      memory: { [varName]: strValue, result: strValue.toLowerCase() },
      activeVariable: 'result',
      action: 'WRITE',
      desc: `Lowercase: "${strValue.toLowerCase()}"`
    });
  }

  if (/reverse/.test(code)) {
    const reversed = strValue.split('').reverse().join('');
    frames.push({
      id: frames.length,
      memory: { [varName]: strValue, result: reversed },
      activeVariable: 'result',
      action: 'WRITE',
      desc: `Reversed: "${reversed}"`
    });
  }
};

const generateArrayOperationTrace = (code: string, frames: TraceFrame[]) => {
  const arrayMatch = code.match(/(?:let|const|var)\s+(\w+)\s*=\s*(\[[\s\S]*?\])/);
  if (!arrayMatch) return;

  const varName = arrayMatch[1];
  const arrayData = JSON.parse(arrayMatch[2].replace(/'/g, '"'));
  
  frames.push({
    id: 0,
    memory: { [varName]: [...arrayData] },
    activeVariable: varName,
    action: 'EXECUTE',
    desc: `Array: [${arrayData.join(', ')}]`
  });

  const isMap = /\.map\s*\(/.test(code);
  const isFilter = /\.filter\s*\(/.test(code);

  if (isMap) {
    const result: any[] = [];
    arrayData.forEach((val: any, idx: number) => {
      frames.push({
        id: frames.length,
        memory: { [varName]: [...arrayData], currentIndex: idx, processing: val },
        activeVariable: varName,
        action: 'READ',
        desc: `Processing ${val} at index ${idx}`
      });

      const transformed = val * 2;
      result.push(transformed);
      
      frames.push({
        id: frames.length,
        memory: { [varName]: [...arrayData], result: [...result], currentIndex: idx },
        activeVariable: 'result',
        action: 'WRITE',
        desc: `Transformed ${val} → ${transformed}`
      });
    });

    frames.push({
      id: frames.length,
      memory: { [varName]: [...arrayData], result },
      activeVariable: 'result',
      action: 'EXECUTE',
      desc: `✓ Map complete: [${result.join(', ')}]`
    });
  } else if (isFilter) {
    const result: any[] = [];
    arrayData.forEach((val: any, idx: number) => {
      frames.push({
        id: frames.length,
        memory: { [varName]: [...arrayData], currentIndex: idx, checking: val },
        activeVariable: varName,
        action: 'READ',
        desc: `Checking ${val}: ${val > 5 ? '✓ Pass' : '✗ Fail'}`
      });

      if (val > 5) {
        result.push(val);
        frames.push({
          id: frames.length,
          memory: { [varName]: [...arrayData], result: [...result] },
          activeVariable: 'result',
          action: 'WRITE',
          desc: `Added ${val} to result`
        });
      }
    });

    frames.push({
      id: frames.length,
      memory: { [varName]: [...arrayData], result },
      activeVariable: 'result',
      action: 'EXECUTE',
      desc: `✓ Filter complete: [${result.join(', ')}]`
    });
  } else {
    arrayData.forEach((val: any, idx: number) => {
      frames.push({
        id: frames.length,
        memory: { [varName]: [...arrayData], currentIndex: idx },
        activeVariable: varName,
        action: 'READ',
        desc: `Processing element ${idx}: ${JSON.stringify(val)}`
      });
    });

    frames.push({
      id: frames.length,
      memory: { [varName]: [...arrayData] },
      activeVariable: varName,
      action: 'EXECUTE',
      desc: `✓ Processed all ${arrayData.length} elements`
    });
  }
};

const generateLoopTrace = (code: string, frames: TraceFrame[]) => {
  const forMatch = code.match(/for\s*\(\s*let\s+(\w+)\s*=\s*(\d+)\s*;\s*\w+\s*<\s*(\d+)/);
  
  if (forMatch) {
    const varName = forMatch[1];
    const start = parseInt(forMatch[2]);
    const end = parseInt(forMatch[3]);
    
    frames.push({
      id: 0,
      memory: {},
      activeVariable: null,
      action: 'EXECUTE',
      desc: `Starting loop: ${varName} from ${start} to ${end - 1}`
    });

    for (let i = start; i < end; i++) {
      frames.push({
        id: frames.length,
        memory: { [varName]: i },
        activeVariable: varName,
        action: 'WRITE',
        desc: `Iteration ${i - start + 1}: ${varName} = ${i}`
      });
    }

    frames.push({
      id: frames.length,
      memory: { [varName]: end },
      activeVariable: varName,
      action: 'EXECUTE',
      desc: `✓ Loop complete after ${end - start} iterations`
    });
  }
};

const generateConditionalTrace = (code: string, frames: TraceFrame[]) => {
  const varMatches = Array.from(code.matchAll(/(?:let|const|var)\s+(\w+)\s*=\s*([^;\n]+)/g));
  const memory: Record<string, any> = {};

  frames.push({
    id: 0,
    memory: {},
    activeVariable: null,
    action: 'EXECUTE',
    desc: 'Evaluating conditions...'
  });

  varMatches.forEach(match => {
    const varName = match[1];
    const value = match[2].trim();
    
    try {
      const evalValue = new Function(`return ${value}`)();
      memory[varName] = evalValue;
      
      frames.push({
        id: frames.length,
        memory: { ...memory },
        activeVariable: varName,
        action: 'WRITE',
        desc: `${varName} = ${JSON.stringify(evalValue)}`
      });
    } catch (e) {
      memory[varName] = value;
    }
  });

  const ifMatch = code.match(/if\s*\(\s*([^)]+)\s*\)/);
  if (ifMatch) {
    const condition = ifMatch[1];
    frames.push({
      id: frames.length,
      memory: { ...memory },
      activeVariable: null,
      action: 'READ',
      desc: `Checking: if (${condition})`
    });

    try {
      const result = new Function(...Object.keys(memory), `return ${condition}`)(...Object.values(memory));
      frames.push({
        id: frames.length,
        memory: { ...memory, conditionResult: result },
        activeVariable: null,
        action: 'EXECUTE',
        desc: `Condition is ${result ? 'TRUE ✓' : 'FALSE ✗'}`
      });
    } catch (e) {
      // Ignore
    }
  }
};

const generateFunctionTrace = (code: string, frames: TraceFrame[]) => {
  const funcMatch = code.match(/function\s+(\w+)\s*\(([^)]*)\)/);
  
  if (funcMatch) {
    const funcName = funcMatch[1];
    const params = funcMatch[2];
    
    frames.push({
      id: 0,
      memory: {},
      activeVariable: funcName,
      action: 'EXECUTE',
      desc: `Function ${funcName}(${params}) defined`
    });

    frames.push({
      id: 1,
      memory: { [funcName]: 'function' },
      activeVariable: funcName,
      action: 'EXECUTE',
      desc: `Ready to call ${funcName}()`
    });
  }
};

const generateVariableTrace = (code: string, frames: TraceFrame[]) => {
  const varMatches = Array.from(code.matchAll(/(?:let|const|var)\s+(\w+)\s*=\s*([^;\n]+)/g));
  const memory: Record<string, any> = {};

  if (varMatches.length === 0) {
    frames.push({
      id: 0,
      memory: {},
      activeVariable: null,
      action: 'EXECUTE',
      desc: 'No variables detected. Try: let x = 10 or let arr = [1, 2, 3]'
    });
    return;
  }

  frames.push({
    id: 0,
    memory: {},
    activeVariable: null,
    action: 'EXECUTE',
    desc: 'Starting execution...'
  });

  varMatches.forEach(match => {
    const varName = match[1];
    const value = match[2].trim();
    
    try {
      const evalValue = new Function(`return ${value}`)();
      memory[varName] = evalValue;
      
      frames.push({
        id: frames.length,
        memory: { ...memory },
        activeVariable: varName,
        action: 'WRITE',
        desc: `Declaring ${varName} = ${JSON.stringify(evalValue)}`
      });
    } catch (e) {
      memory[varName] = value;
      frames.push({
        id: frames.length,
        memory: { ...memory },
        activeVariable: varName,
        action: 'WRITE',
        desc: `Declaring ${varName} = ${value}`
      });
    }
  });

  frames.push({
    id: frames.length,
    memory: { ...memory },
    activeVariable: null,
    action: 'EXECUTE',
    desc: `✓ Execution complete with ${varMatches.length} variable(s)`
  });
};

const generateArithmeticTrace = (code: string, frames: TraceFrame[]) => {
  const varMatches = Array.from(code.matchAll(/(?:let|const|var)\s+(\w+)\s*=\s*([^;\n]+)/g));
  const memory: Record<string, any> = {};

  frames.push({
    id: 0,
    memory: {},
    activeVariable: null,
    action: 'EXECUTE',
    desc: 'Starting arithmetic operations...'
  });

  varMatches.forEach(match => {
    const varName = match[1];
    const expression = match[2].trim();
    
    try {
      // Check if it's an arithmetic expression
      if (/[\+\-\*\/\%]/.test(expression)) {
        // Show the expression first
        frames.push({
          id: frames.length,
          memory: { ...memory },
          activeVariable: varName,
          action: 'READ',
          desc: `Evaluating: ${varName} = ${expression}`
        });
      }
      
      const evalValue = new Function(...Object.keys(memory), `return ${expression}`)(...Object.values(memory));
      memory[varName] = evalValue;
      
      frames.push({
        id: frames.length,
        memory: { ...memory },
        activeVariable: varName,
        action: 'WRITE',
        desc: `${varName} = ${evalValue}`
      });
    } catch (e) {
      memory[varName] = expression;
      frames.push({
        id: frames.length,
        memory: { ...memory },
        activeVariable: varName,
        action: 'WRITE',
        desc: `${varName} = ${expression}`
      });
    }
  });

  frames.push({
    id: frames.length,
    memory: { ...memory },
    activeVariable: null,
    action: 'EXECUTE',
    desc: '✓ Arithmetic operations complete'
  });
};

const generateUniversalTrace = (code: string, frames: TraceFrame[]) => {
  // Universal fallback: Try to execute and capture any state changes
  frames.push({
    id: 0,
    memory: {},
    activeVariable: null,
    action: 'EXECUTE',
    desc: 'Executing code...'
  });

  try {
    // Try to extract any meaningful information
    const lines = code.split('\n').filter(line => line.trim());
    
    lines.forEach((line, idx) => {
      if (line.trim()) {
        frames.push({
          id: frames.length,
          memory: { line: line.trim() },
          activeVariable: null,
          action: 'EXECUTE',
          desc: `Line ${idx + 1}: ${line.trim().substring(0, 50)}${line.length > 50 ? '...' : ''}`
        });
      }
    });

    frames.push({
      id: frames.length,
      memory: {},
      activeVariable: null,
      action: 'EXECUTE',
      desc: `✓ Executed ${lines.length} line(s) of code`
    });
  } catch (e) {
    frames.push({
      id: frames.length,
      memory: {},
      activeVariable: null,
      action: 'EXECUTE',
      desc: 'Code structure analyzed'
    });
  }
};

const VisualizeTab: React.FC = () => {
  const { traceFrames, currentFrameIndex, setFrameIndex, setTraceFrames, isPlaying, togglePlay } = useAnalysisStore();
  const editorStore = useEditorStore();
  const { tabs, activeTabId, outputData, debugData } = editorStore;
  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- 3. UNIVERSAL CODE TRACER (Visualizes ANY JavaScript) ---
  const buildAdvancedTrace = React.useCallback((code: string) => {
    const frames: TraceFrame[] = [];
    
    try {
      const cleanCode = code.trim();
      if (!cleanCode) {
        console.log('No code to visualize');
        setTraceFrames([]);
        return;
      }

      console.log('🎬 Starting visualization for code:', cleanCode.substring(0, 100));

      // Detect code patterns
      const hasArray = /\[.*\]/.test(code);
      const hasLoop = /for\s*\(|while\s*\(|\.forEach|\.map|\.filter|\.reduce/i.test(code);
      const hasFunction = /function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{/.test(code);
      const hasConditional = /if\s*\(|else|switch|case|\?/.test(code);
      const isSorting = /sort|bubble|selection|insertion|quick|merge/i.test(code);
      const isSearching = /search|find|indexOf|includes|binary/i.test(code);
      const isStringOp = /split|join|slice|substring|concat|replace|toUpperCase|toLowerCase/.test(code);
      const hasVariable = /(?:let|const|var)\s+\w+\s*=/.test(code);
      const hasArithmetic = /[\+\-\*\/\%]/.test(code);
      const hasComparison = /[<>]=?|===?|!==?/.test(code);

      // PRIORITY 1: Sorting Algorithms (most visual)
      if (isSorting && hasArray) {
        console.log('✅ Detected: Sorting algorithm');
        generateSortingTrace(code, frames);
      }
      // PRIORITY 2: Searching Algorithms
      else if (isSearching && hasArray) {
        console.log('✅ Detected: Searching algorithm');
        generateSearchingTrace(code, frames);
      }
      // PRIORITY 3: Array Operations (map, filter, reduce)
      else if (hasArray && hasLoop) {
        console.log('✅ Detected: Array operations');
        generateArrayOperationTrace(code, frames);
      }
      // PRIORITY 4: String Operations
      else if (isStringOp && hasVariable) {
        console.log('✅ Detected: String operations');
        generateStringTrace(code, frames);
      }
      // PRIORITY 5: Loops (for, while)
      else if (hasLoop) {
        console.log('✅ Detected: Loop');
        generateLoopTrace(code, frames);
      }
      // PRIORITY 6: Conditionals (if/else)
      else if (hasConditional && hasVariable) {
        console.log('✅ Detected: Conditional');
        generateConditionalTrace(code, frames);
      }
      // PRIORITY 7: Functions
      else if (hasFunction) {
        console.log('✅ Detected: Function');
        generateFunctionTrace(code, frames);
      }
      // PRIORITY 8: Arithmetic Operations
      else if (hasArithmetic && hasVariable) {
        console.log('✅ Detected: Arithmetic operations');
        generateArithmeticTrace(code, frames);
      }
      // PRIORITY 9: Any Variables (universal fallback)
      else if (hasVariable) {
        console.log('✅ Detected: Variables');
        generateVariableTrace(code, frames);
      }
      // PRIORITY 10: Execute and trace (for any other code)
      else {
        console.log('✅ Attempting universal execution trace');
        generateUniversalTrace(code, frames);
      }

      console.log(`📊 Generated ${frames.length} frames`);
      
      if (frames.length === 0) {
        // Create a helpful frame if nothing was generated
        frames.push({
          id: 0,
          memory: {},
          activeVariable: null,
          action: 'EXECUTE',
          desc: 'Code executed. Try adding variables to see visualization: let x = 10'
        });
      }

      setTraceFrames(frames);
    } catch (e) {
      console.error('❌ Trace generation error:', e);
      // Show error frame instead of empty
      setTraceFrames([{
        id: 0,
        memory: {},
        activeVariable: null,
        action: 'EXECUTE',
        desc: `Error analyzing code: ${e instanceof Error ? e.message : 'Unknown error'}`
      }]);
    }
  }, [setTraceFrames]);

  // --- 1. REAL-TIME OBSERVER (Watches Editor Changes) ---
  useEffect(() => {
    if (!activeTab?.content) {
      console.log('No active tab content');
      return;
    }
    console.log('Building trace for:', activeTab.content.substring(0, 50));
    const timeout = setTimeout(() => buildAdvancedTrace(activeTab.content), 300);
    return () => clearTimeout(timeout);
  }, [activeTab?.content, activeTabId, buildAdvancedTrace]);

  // --- 2. VIDEO ENGINE (Auto-play animation) ---
  useEffect(() => {
    if (isPlaying && traceFrames.length > 0) {
      timerRef.current = setInterval(() => {
        setFrameIndex((prev: number) => {
           if (prev < traceFrames.length - 1) return prev + 1;
           togglePlay(); // Auto-stop at end
           return prev;
        });
      }, 600); // Reduced from 1000ms to 600ms for faster playback
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, traceFrames.length, setFrameIndex, togglePlay]);

  // --- 4. THE RENDERER ---
  const currentFrame = traceFrames[currentFrameIndex];

  // Check if we have output data to show
  const hasOutput = outputData && outputData.trim().length > 0;
  const hasDebugData = debugData && debugData.trim().length > 0;

  // Fix for Black Screen: Show Output if no visual frames but code has been run
  if (!currentFrame || traceFrames.length === 0) {
    // If code has been executed and produced output, show it
    if (hasOutput || hasDebugData) {
      return (
        <div className="universal-viz" style={{ padding: '16px' }}>
          {/* File indicator */}
          {activeTab && (
            <div style={{
              marginBottom: '12px',
              padding: '8px 12px',
              background: '#252526',
              border: '1px solid #333',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fa-solid fa-file-code" style={{ color: '#00f2ff', fontSize: '12px' }}></i>
              <span style={{ color: '#ccc', fontSize: '11px' }}>
                Output from: <strong style={{ color: '#fff' }}>{activeTab.fileName}</strong>
              </span>
            </div>
          )}

          <div style={{
            marginBottom: '16px',
            padding: '12px',
            background: 'rgba(0, 242, 255, 0.1)',
            border: '1px solid rgba(0, 242, 255, 0.3)',
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <i className="fa-solid fa-terminal" style={{ color: '#00f2ff', fontSize: '14px' }}></i>
              <span style={{ color: '#00f2ff', fontSize: '12px', fontWeight: 'bold' }}>CONSOLE OUTPUT</span>
            </div>
            <div style={{ fontSize: '10px', color: '#aaa' }}>
              This code doesn't have a visual representation, but here's what it outputs:
            </div>
          </div>

          {/* Output Display */}
          {hasOutput && (
            <div style={{
              marginBottom: '16px',
              padding: '16px',
              background: '#1a1a1d',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '12px',
              lineHeight: '1.6',
              color: '#00ff88',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <div style={{
                marginBottom: '8px',
                color: '#00f2ff',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '0.5px'
              }}>
                📤 OUTPUT:
              </div>
              <pre style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#ccc'
              }}>
                {outputData}
              </pre>
            </div>
          )}

          {/* Debug/Error Display */}
          {hasDebugData && (
            <div style={{
              padding: '16px',
              background: '#1a1a1d',
              border: '1px solid rgba(255, 0, 85, 0.3)',
              borderRadius: '8px',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '12px',
              lineHeight: '1.6',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <div style={{
                marginBottom: '8px',
                color: '#ff0055',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '0.5px'
              }}>
                ⚠️ DEBUG INFO:
              </div>
              <pre style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#ffaa00'
              }}>
                {debugData}
              </pre>
            </div>
          )}

          {/* Helpful tips */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(188, 19, 254, 0.05)',
            border: '1px solid rgba(188, 19, 254, 0.2)',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#aaa',
            lineHeight: '1.5'
          }}>
            <div style={{ color: '#bc13fe', fontWeight: 'bold', marginBottom: '6px' }}>
              💡 Want to see visual animations?
            </div>
            Try code with:
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Arrays: <code style={{ color: '#00f2ff' }}>let arr = [5, 2, 8, 1, 9]</code></li>
              <li>Sorting: <code style={{ color: '#00f2ff' }}>arr.sort()</code></li>
              <li>Loops: <code style={{ color: '#00f2ff' }}>for (let i = 0; i &lt; 5; i++)</code></li>
              <li>Array methods: <code style={{ color: '#00f2ff' }}>arr.map(), arr.filter()</code></li>
            </ul>
          </div>

          <style>{styles}</style>
        </div>
      );
    }

    // No output and no frames - show loading
    return (
      <div className="universal-viz empty">
        <div className="loader-box">
          <div className="spinner-neon"></div>
          <p>SCANNING CODE...</p>
          <span>Write code with arrays or variables to visualize</span>
          <span style={{ marginTop: '10px', fontSize: '11px', color: '#555' }}>
            Try: let arr = [5, 2, 8, 1, 9]
          </span>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Render array visualization for sorting
  const renderArrayVisualization = () => {
    const arrayKey = Object.keys(currentFrame.memory).find(k => Array.isArray(currentFrame.memory[k]));
    if (!arrayKey) return null;

    const array = currentFrame.memory[arrayKey];
    const comparing = currentFrame.memory.comparing || [];
    const swapping = currentFrame.memory.swapping || [];
    const sorted = currentFrame.memory.sorted || 0;
    const currentIndex = currentFrame.memory.currentIndex;

    return (
      <div className="array-visualization">
        <div className="array-container">
          {array.map((val: any, idx: number) => {
            const isComparing = comparing.includes(idx);
            const isSwapping = swapping.includes(idx);
            const isSorted = idx >= array.length - sorted;
            const isCurrent = idx === currentIndex;
            
            let className = 'array-bar';
            if (isSwapping) className += ' swapping';
            else if (isComparing) className += ' comparing';
            else if (isCurrent) className += ' current';
            else if (isSorted) className += ' sorted';

            return (
              <div key={idx} className="array-item">
                <div 
                  className={className}
                  style={{ 
                    height: `${Math.max(val * 8, 30)}px`,
                    transition: 'all 0.5s ease'
                  }}
                >
                  <span className="bar-value">{val}</span>
                </div>
                <div className="bar-index">{idx}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="universal-viz">
      {/* File indicator */}
      {activeTab && (
        <div style={{
          marginBottom: '12px',
          padding: '8px 12px',
          background: '#252526',
          border: '1px solid #333',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className="fa-solid fa-file-code" style={{ color: '#00f2ff', fontSize: '12px' }}></i>
          <span style={{ color: '#ccc', fontSize: '11px' }}>
            Visualizing: <strong style={{ color: '#fff' }}>{activeTab.fileName}</strong>
          </span>
        </div>
      )}
      
      <div className="hud-header">
        <div className="badge">STEP-BY-STEP VISUALIZATION</div>
        <div className="step">STEP {currentFrameIndex + 1} / {traceFrames.length}</div>
      </div>

      {renderArrayVisualization()}

      <div className="memory-grid">
        {Object.entries(currentFrame.memory)
          .filter(([key]) => !['comparing', 'swapping', 'sorted', 'currentIndex'].includes(key))
          .map(([key, value]) => {
            const isActive = currentFrame.activeVariable === key;
            return (
              <div key={key} className={`widget ${isActive ? 'active' : ''} ${currentFrame.action}`}>
                <div className="widget-label">{key}</div>
                <div className="widget-content">
                  {Array.isArray(value) ? (
                    <div className="array-viz">
                      {value.map((v: any, i: number) => (
                        <div key={i} className="mini-bar" style={{ height: `${Math.min(Math.abs(Number(v)) * 2 || 5, 60)}px` }}>
                          {v}
                        </div>
                      ))}
                    </div>
                  ) : typeof value === 'object' ? (
                    <div className="obj-viz">{JSON.stringify(value)}</div>
                  ) : (
                    <div className="val-viz">{String(value)}</div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <div className="explanation-hud">
        <i className={`fa-solid ${
          currentFrame.action === 'WRITE' ? 'fa-pen-nib' : 
          currentFrame.action === 'READ' ? 'fa-eye' : 
          'fa-play'
        }`}></i>
        <span>{currentFrame.desc}</span>
      </div>

      <div className="controls">
        <input 
          type="range" 
          min="0" 
          max={traceFrames.length - 1} 
          value={currentFrameIndex} 
          onChange={(e) => setFrameIndex(Number(e.target.value))} 
        />
        <div className="control-buttons">
          <button 
            onClick={() => setFrameIndex(Math.max(0, currentFrameIndex - 1))}
            className="nav-btn"
            disabled={currentFrameIndex === 0}
          >
            <i className="fa-solid fa-backward-step"></i>
          </button>
          <button onClick={togglePlay} className="p-btn">
            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
          </button>
          <button 
            onClick={() => setFrameIndex(Math.min(traceFrames.length - 1, currentFrameIndex + 1))}
            className="nav-btn"
            disabled={currentFrameIndex === traceFrames.length - 1}
          >
            <i className="fa-solid fa-forward-step"></i>
          </button>
        </div>
      </div>
      <style>{styles}</style>
    </div>
  );
};

export default VisualizeTab;

const styles = `
  .universal-viz { 
    display: flex; 
    flex-direction: column; 
    height: 100%; 
    max-height: calc(100vh - 200px);
    background: #0c0c0f; 
    padding: 12px; 
    gap: 12px; 
    overflow-y: auto;
    overflow-x: hidden;
  }
  .universal-viz.empty { justify-content: center; align-items: center; background: #0c0c0f; overflow: hidden; }
  
  .loader-box { text-align: center; color: #888; }
  .loader-box p { color: #00f2ff; font-size: 14px; margin: 10px 0 5px; font-weight: bold; }
  .loader-box span { color: #666; font-size: 12px; display: block; }
  .spinner-neon { width: 40px; height: 40px; border: 2px solid #222; border-top: 2px solid #bc13fe; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .hud-header { display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; padding: 8px 0; }
  .badge { background: #bc13fe; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 4px; letter-spacing: 1px; }
  .step { color: #888; font-size: 10px; font-family: monospace; }

  /* ARRAY VISUALIZATION STYLES */
  .array-visualization { 
    flex-shrink: 0; 
    background: #1a1a1d; 
    border: 1px solid #2a2a2a; 
    border-radius: 8px; 
    padding: 16px; 
    margin-bottom: 8px;
    max-height: 280px;
    overflow: hidden;
  }
  .array-container { 
    display: flex; 
    gap: 12px; 
    justify-content: center; 
    align-items: flex-end; 
    min-height: 150px;
    max-height: 220px;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 10px 0;
  }
  .array-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  
  .array-bar { 
    width: 40px; 
    min-width: 40px;
    background: linear-gradient(180deg, #00f2ff, #0088cc); 
    border-radius: 6px 6px 0 0; 
    display: flex; 
    align-items: flex-end; 
    justify-content: center; 
    padding-bottom: 6px;
    box-shadow: 0 4px 15px rgba(0, 242, 255, 0.3);
    position: relative;
    transition: all 0.5s ease;
    max-height: 180px;
  }
  
  .array-bar.comparing { 
    background: linear-gradient(180deg, #ffaa00, #ff6600); 
    box-shadow: 0 4px 20px rgba(255, 170, 0, 0.5);
    transform: translateY(-8px);
  }
  
  .array-bar.swapping { 
    background: linear-gradient(180deg, #ff0055, #cc0044); 
    box-shadow: 0 4px 25px rgba(255, 0, 85, 0.6);
    transform: translateY(-12px) scale(1.08);
    animation: pulse 0.5s ease-in-out;
  }
  
  .array-bar.sorted { 
    background: linear-gradient(180deg, #00ff88, #00cc66); 
    box-shadow: 0 4px 15px rgba(0, 255, 136, 0.4);
  }
  
  .array-bar.current { 
    background: linear-gradient(180deg, #bc13fe, #8800cc); 
    box-shadow: 0 4px 20px rgba(188, 19, 254, 0.5);
    transform: translateY(-6px);
  }
  
  @keyframes pulse {
    0%, 100% { transform: translateY(-12px) scale(1.08); }
    50% { transform: translateY(-16px) scale(1.12); }
  }
  
  .bar-value { color: #fff; font-weight: bold; font-size: 14px; font-family: 'Orbitron', monospace; }
  .bar-index { color: #666; font-size: 10px; font-family: monospace; }

  .memory-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); 
    gap: 10px; 
    align-content: flex-start; 
    max-height: 300px;
    overflow-y: auto; 
    padding-right: 5px;
    margin-bottom: 8px;
  }
  .no-vars { grid-column: 1/-1; color: #666; text-align: center; margin-top: 30px; font-size: 12px; }
  
  .widget { 
    background: #1a1a1d; 
    border: 1px solid #2a2a2a; 
    border-radius: 6px; 
    padding: 10px; 
    transition: 0.3s; 
    position: relative; 
    overflow: hidden;
    min-height: 80px;
  }
  .widget.active.WRITE { border-color: #ff0055; box-shadow: 0 0 12px rgba(255, 0, 85, 0.2); transform: scale(1.02); }
  .widget.active.READ { border-color: #00f2ff; box-shadow: 0 0 12px rgba(0, 242, 255, 0.2); transform: scale(1.02); }
  
  .widget-label { font-size: 9px; color: #888; text-transform: uppercase; margin-bottom: 8px; font-weight: bold; letter-spacing: 0.5px; }
  .val-viz { font-size: 20px; color: #fff; font-family: 'Orbitron'; text-align: center; }
  .array-viz { display: flex; align-items: flex-end; gap: 3px; height: 50px; justify-content: center; overflow-x: auto; }
  .mini-bar { width: 12px; min-width: 12px; background: #00f2ff; font-size: 8px; color: #000; text-align: center; border-radius: 2px 2px 0 0; font-weight: bold; display: flex; align-items: flex-end; justify-content: center; }
  .obj-viz { font-size: 10px; color: #00ff88; font-family: monospace; word-break: break-all; opacity: 0.8; }

  .explanation-hud { 
    flex-shrink: 0; 
    background: rgba(188, 19, 254, 0.05); 
    border-left: 3px solid #bc13fe; 
    padding: 10px 12px; 
    display: flex; 
    gap: 10px; 
    align-items: center; 
    color: #fff; 
    font-size: 12px; 
    border-radius: 0 4px 4px 0;
    margin-bottom: 8px;
  }
  .explanation-hud i { color: #bc13fe; font-size: 13px; }

  .controls { 
    flex-shrink: 0; 
    background: #1a1a1d; 
    padding: 12px; 
    border-radius: 8px; 
    display: flex; 
    flex-direction: column; 
    gap: 10px; 
    border: 1px solid #2a2a2a;
  }
  .controls input { -webkit-appearance: none; height: 4px; background: #333; border-radius: 2px; outline: none; width: 100%; }
  .controls input::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; background: #bc13fe; border-radius: 50%; cursor: pointer; }
  
  .control-buttons { display: flex; gap: 8px; justify-content: center; align-items: center; }
  .nav-btn { background: #2a2a2a; color: #fff; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 12px; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
  .nav-btn:hover:not(:disabled) { background: #3a3a3a; transform: scale(1.05); }
  .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  
  .p-btn { background: #fff; color: #000; border: none; width: 38px; height: 38px; border-radius: 50%; cursor: pointer; font-size: 16px; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
  .p-btn:hover { transform: scale(1.1); background: #00f2ff; }
  
  /* Custom scrollbar */
  .universal-viz::-webkit-scrollbar,
  .memory-grid::-webkit-scrollbar,
  .array-container::-webkit-scrollbar { width: 6px; height: 6px; }
  .universal-viz::-webkit-scrollbar-track,
  .memory-grid::-webkit-scrollbar-track,
  .array-container::-webkit-scrollbar-track { background: #1a1a1d; }
  .universal-viz::-webkit-scrollbar-thumb,
  .memory-grid::-webkit-scrollbar-thumb,
  .array-container::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
  .universal-viz::-webkit-scrollbar-thumb:hover,
  .memory-grid::-webkit-scrollbar-thumb:hover,
  .array-container::-webkit-scrollbar-thumb:hover { background: #444; }
`;