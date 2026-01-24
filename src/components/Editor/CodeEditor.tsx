import React, { useMemo, useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  selectedFile: string | null;
  onSave: () => void;
  onRun: () => void;
  onClose: () => void;
  onCursorChange: (line: number, col: number) => void;
  isActive: boolean;
  onFocus: () => void;
  onProblemsDetected?: (problems: Array<{message: string; line: number; source: string; type: 'error' | 'warning'; column?: number}>) => void;
  editorRef?: React.MutableRefObject<any>;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, onChange, selectedFile, onSave, onRun, onClose, onCursorChange, isActive, onFocus, onProblemsDetected, editorRef    
}) => {
  const internalEditorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isGeneratingFix, setIsGeneratingFix] = React.useState(false);
  const fileName = selectedFile ? selectedFile.split('\\').pop() : 'untitled';

  const language = useMemo(() => {
    if (!fileName) return 'javascript';
    const ext = fileName.split('.').pop()?.toLowerCase();
    const map: any = { js: 'javascript', ts: 'typescript', py: 'python', json: 'json', css: 'css', html: 'html' };
    return map[ext || ''] || 'plaintext';
  }, [fileName]);

  // AI-powered code fix generator
  const generateAIFix = async (errorMessage: string, line: number, currentCode: string): Promise<string | null> => {
    setIsGeneratingFix(true);
    
    try {
      // Simulate AI processing (in production, this would call an AI API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const lines = currentCode.split('\n');
      const errorLine = lines[line - 1];
      
      // Smart fix generation based on error patterns
      if (errorMessage.includes('is not defined') || errorMessage.includes('undefined')) {
        const match = errorMessage.match(/'([^']+)'/);
        const varName = match ? match[1] : 'variable';
        
        // Add variable declaration
        if (language === 'javascript' || language === 'typescript') {
          lines.splice(line - 1, 0, `const ${varName} = null; // Auto-fixed: Added missing declaration`);
        } else if (language === 'python') {
          lines.splice(line - 1, 0, `${varName} = None  # Auto-fixed: Added missing declaration`);
        }
      } 
      else if (errorMessage.includes('missing') && errorMessage.includes('import')) {
        // Add missing import
        const match = errorMessage.match(/'([^']+)'/);
        const moduleName = match ? match[1] : 'module';
        
        if (language === 'javascript' || language === 'typescript') {
          lines.unshift(`import ${moduleName} from '${moduleName}'; // Auto-fixed: Added missing import`);
        } else if (language === 'python') {
          lines.unshift(`import ${moduleName}  # Auto-fixed: Added missing import`);
        }
      }
      else if (errorMessage.includes('syntax error') || errorMessage.includes('unexpected')) {
        // Fix common syntax errors
        if (errorLine.includes('console.log') && !errorLine.includes(';')) {
          lines[line - 1] = errorLine + ';  // Auto-fixed: Added missing semicolon';
        } else if (errorLine.trim().endsWith(',')) {
          lines[line - 1] = errorLine.slice(0, -1) + '  // Auto-fixed: Removed trailing comma';
        }
      }
      else if (errorMessage.includes('type')) {
        // Add type annotation for TypeScript
        if (language === 'typescript' && errorLine.includes('function')) {
          lines[line - 1] = errorLine.replace(')', '): void)') + '  // Auto-fixed: Added return type';
        }
      }
      else {
        // Generic fix: Add a comment
        lines[line - 1] = errorLine + '  // TODO: Fix - ' + errorMessage;
      }
      
      return lines.join('\n');
    } catch (error) {
      console.error('Error generating fix:', error);
      return null;
    } finally {
      setIsGeneratingFix(false);
    }
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    internalEditorRef.current = editor;
    
    if (editorRef) {
      editorRef.current = editor;
    }
    
    editor.onDidChangeCursorPosition((e: any) => {
      onCursorChange(e.position.lineNumber, e.position.column);
    });
    monacoRef.current = monaco;

    // Configure JavaScript/TypeScript validation
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: []
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      allowJs: true,
      checkJs: true,
      strict: false,
      noImplicitAny: false,
      strictNullChecks: false,
      strictFunctionTypes: false,
      strictPropertyInitialization: false,
      noImplicitThis: false,
      alwaysStrict: false
    });

    // Register code action provider for quick fixes
    const provider = monaco.languages.registerCodeActionProvider(language, {
      provideCodeActions: (model, range, context) => {
        const actions: any[] = [];
        
        // Get diagnostics at current position
        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        const relevantMarkers = markers.filter(m => 
          m.startLineNumber === range.startLineNumber
        );
        
        relevantMarkers.forEach(marker => {
          // Quick Fix action
          actions.push({
            title: `💡 Quick Fix: ${marker.message}`,
            diagnostics: [marker],
            kind: 'quickfix',
            isPreferred: true,
            edit: {
              edits: []
            },
            command: {
              id: 'editor.action.quickFix',
              title: 'Apply AI Fix',
              arguments: [marker.message, marker.startLineNumber]
            }
          });
          
          // Auto-fix with AI action
          actions.push({
            title: `🤖 Auto-fix with AI`,
            diagnostics: [marker],
            kind: 'quickfix',
            isPreferred: false,
            command: {
              id: 'editor.action.autoFixWithAI',
              title: 'Auto-fix with AI',
              arguments: [marker.message, marker.startLineNumber]
            }
          });
        });
        
        return {
          actions,
          dispose: () => {}
        };
      }
    });

    // Register command for auto-fix
    editor.addAction({
      id: 'editor.action.autoFixWithAI',
      label: 'Auto-fix with AI',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Period],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: async (ed: any, ...args: any[]) => {
        const [errorMessage, line] = args;
        const currentCode = ed.getValue();
        
        const fixedCode = await generateAIFix(errorMessage, line, currentCode);
        if (fixedCode) {
          ed.setValue(fixedCode);
          // Show notification
          ed.trigger('keyboard', 'editor.action.showHover', {});
        }
      }
    });

    // Listen to model changes to detect diagnostics in real-time
    const model = editor.getModel();
    if (model) {
      const handleDiagnosticsChange = () => {
        const diagnostics = monaco.editor.getModelMarkers({ resource: model.uri });
        
        // Always update problems, even if empty (to clear solved errors)
        if (onProblemsDetected) {
          const problems = diagnostics.map(d => ({
            message: d.message,
            line: d.startLineNumber,
            column: d.startColumn,
            source: fileName || 'file',
            type: d.severity === 8 ? 'error' : 'warning' as 'error' | 'warning',
            code: d.code
          }));
          onProblemsDetected(problems);
        }
      };
      
      // Check diagnostics on mount
      setTimeout(handleDiagnosticsChange, 100);
      
      // Listen for marker changes (errors/warnings)
      const markerDisposable = monaco.editor.onDidChangeMarkers((uris) => {
        // Only update if it's our model
        if (uris.some(uri => uri.toString() === model.uri.toString())) {
          handleDiagnosticsChange();
        }
      });
      
      // Listen for content changes to re-validate
      const contentDisposable = model.onDidChangeContent(() => {
        // Debounce validation
        setTimeout(handleDiagnosticsChange, 300);
      });
      
      return () => {
        markerDisposable.dispose();
        contentDisposable.dispose();
        provider.dispose();
      };
    }

    // Keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun();
    });

    editor.onDidFocusEditorText(() => {
      onFocus();
    });
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {isGeneratingFix && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: '#0e639c',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <i className="fa-solid fa-wand-magic-sparkles fa-spin"></i>
          Generating AI fix...
        </div>
      )}
      <Editor
        height="100%"
        width="100%"
        theme="vs-dark"
        language={language}
        value={code}
        onChange={(val) => onChange(val || "")}
        onMount={handleEditorDidMount}
        options={{
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontSize: 14,
          minimap: { enabled: true },
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          contextmenu: true,
          multiCursorModifier: 'ctrlCmd',
          wordWrap: 'on',
          padding: { top: 10 },
          guides: { indentation: true, bracketPairs: true },
          bracketPairColorization: { enabled: true },
          renderLineHighlight: 'all',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          lightbulb: {
            enabled: true
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false
          }
        }}
      />
    </div>
  );
};

export default CodeEditor;