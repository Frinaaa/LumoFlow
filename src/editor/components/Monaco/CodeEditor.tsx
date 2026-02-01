import React, { useMemo, useRef, useEffect, memo, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useEditorStore } from '../../stores/editorStore';
import { useAnalysisStore } from '../../stores/analysisStore';
import { parseLiveCode } from '../../utils/liveParser';
import FindReplace from './FindReplace';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  selectedFile: string | null;
  onSave: () => void;
  onRun: () => void;
  onClose: () => void;
  onCursorChange: (line: number, col: number) => void;
  onFocus: () => void;
  onProblemsDetected?: (problems: Array<{ message: string; line: number; source: string; type: 'error' | 'warning'; column?: number }>) => void;
  editorRef?: React.MutableRefObject<any>;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code, onChange, selectedFile, onSave, onRun, onCursorChange, onFocus, onProblemsDetected, editorRef
}) => {
  const internalEditorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isGeneratingFix, setIsGeneratingFix] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const editorStore = useEditorStore();
  const analysisStore = useAnalysisStore();
  const fileName = selectedFile ? selectedFile.split('\\').pop() : 'untitled';
  
  const language = useMemo(() => {
    if (!fileName) return 'javascript';
    const ext = fileName.split('.').pop()?.toLowerCase();
    const map: any = { js: 'javascript', ts: 'typescript', py: 'python', json: 'json', css: 'css', html: 'html' };
    return map[ext || ''] || 'plaintext';
  }, [fileName]);

  // React to Word Wrap changes from Menu
  useEffect(() => {
    if (internalEditorRef.current) {
      internalEditorRef.current.updateOptions({ wordWrap: editorStore.wordWrap || 'on' });
    }
  }, [editorStore.wordWrap]);

  // Add this Effect to listen to code changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const visualResult = parseLiveCode(code);
      if (visualResult.type !== 'NONE') {
        analysisStore.setLiveVisual(visualResult);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [code, analysisStore]);

  // Listen for find/replace toggle from menu
  useEffect(() => {
    const handleToggleFindReplace = (e: any) => {
      setShowFindReplace(true);
      // If mode is specified, show/hide replace accordingly
      if (e.detail?.mode === 'find') {
        // Just show find (replace will be hidden by default in FindReplace component)
      } else if (e.detail?.mode === 'replace') {
        // Show both find and replace
      }
    };

    window.addEventListener('toggle-find-replace', handleToggleFindReplace);
    return () => window.removeEventListener('toggle-find-replace', handleToggleFindReplace);
  }, []);

  // AI-powered code fix generator
  const generateAIFix = async (errorMessage: string, line: number, currentCode: string): Promise<string | null> => {
    setIsGeneratingFix(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const lines = currentCode.split('\n');
      const errorLine = lines[line - 1];

      if (errorMessage.includes('is not defined') || errorMessage.includes('undefined')) {
        const match = errorMessage.match(/'([^']+)'/);
        const varName = match ? match[1] : 'variable';

        if (language === 'javascript' || language === 'typescript') {
          lines.splice(line - 1, 0, `const ${varName} = null; // Auto-fixed: Added missing declaration`);
        } else if (language === 'python') {
          lines.splice(line - 1, 0, `${varName} = None  # Auto-fixed: Added missing declaration`);
        }
      }
      else if (errorMessage.includes('missing') && errorMessage.includes('import')) {
        const match = errorMessage.match(/'([^']+)'/);
        const moduleName = match ? match[1] : 'module';

        if (language === 'javascript' || language === 'typescript') {
          lines.unshift(`import ${moduleName} from '${moduleName}'; // Auto-fixed: Added missing import`);
        } else if (language === 'python') {
          lines.unshift(`import ${moduleName}  # Auto-fixed: Added missing import`);
        }
      }
      else if (errorMessage.includes('syntax error') || errorMessage.includes('unexpected')) {
        if (errorLine.includes('console.log') && !errorLine.includes(';')) {
          lines[line - 1] = errorLine + ';  // Auto-fixed: Added missing semicolon';
        } else if (errorLine.trim().endsWith(',')) {
          lines[line - 1] = errorLine.slice(0, -1) + '  // Auto-fixed: Removed trailing comma';
        }
      }
      else if (errorMessage.includes('type')) {
        if (language === 'typescript' && errorLine.includes('function')) {
          lines[line - 1] = errorLine.replace(')', '): void)') + '  // Auto-fixed: Added return type';
        }
      }
      else {
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

    // Disable built-in find and replace - we'll use custom implementation
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      setShowFindReplace(true);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
      setShowFindReplace(true);
    });

    // Completely disable Monaco's find controller
    const findController = editor.getContribution('editor.contrib.findController') as any;
    if (findController) {
      findController.closeFindWidget();
      // Override the show method to prevent it from appearing
      const originalShow = findController.show;
      findController.show = function() {
        return;
      };
    }

    // Hide any find widget that might appear
    const hideFindWidget = () => {
      const findWidget = document.querySelector('.monaco-editor .find-widget') as HTMLElement;
      if (findWidget) {
        findWidget.style.display = 'none';
      }
    };

    setTimeout(hideFindWidget, 100);
    
    // Monitor and hide find widget if it appears
    const hideInterval = setInterval(hideFindWidget, 500);
    
    // Store interval for cleanup
    (editor as any)._findHideInterval = hideInterval;

    // 2. Global Command Listener
    const monacoCommandListener = (e: any) => {
      const { action, value, column } = e.detail;
      editor.focus();
      
      switch (action) {
        case 'revealLine':
          editor.revealLineInCenter(value);
          editor.setPosition({ lineNumber: value, column: column || 1 });
          editor.focus();
          break;

        case 'undo':
          editor.focus();
          editor.trigger('keyboard', 'undo', {});
          break;
        case 'redo':
          editor.focus();
          editor.trigger('keyboard', 'redo', {});
          break;
        case 'cut':
          editor.focus();
          editor.trigger('keyboard', 'editor.action.clipboardCutAction', {});
          break;
        case 'copy':
          editor.focus();
          editor.trigger('keyboard', 'editor.action.clipboardCopyAction', {});
          break;
        case 'paste':
          editor.focus();
          editor.trigger('keyboard', 'editor.action.clipboardPasteAction', {});
          break;
        case 'find':
          setShowFindReplace(true);
          break;
        case 'replace':
          setShowFindReplace(true);
          break;
        case 'findInFiles':
          editor.trigger('menu', 'actions.find', {});
          break;
        case 'toggleComment':
          editor.trigger('menu', 'editor.action.commentLine', {});
          break;
        case 'toggleBlockComment':
          editor.trigger('menu', 'editor.action.blockComment', {});
          break;

        case 'selectAll':
          editor.trigger('menu', 'editor.action.selectAll', {});
          break;
        case 'expandSelection':
          editor.trigger('menu', 'editor.action.smartSelect.expand', {});
          break;
        case 'shrinkSelection':
          editor.trigger('menu', 'editor.action.smartSelect.shrink', {});
          break;
        case 'copyLineUp':
          editor.trigger('menu', 'editor.action.copyLinesUpAction', {});
          break;
        case 'copyLineDown':
          editor.trigger('menu', 'editor.action.copyLinesDownAction', {});
          break;
        case 'moveLineUp':
          editor.trigger('menu', 'editor.action.moveLinesUpAction', {});
          break;
        case 'moveLineDown':
          editor.trigger('menu', 'editor.action.moveLinesDownAction', {});
          break;
        case 'duplicateSelection':
          editor.trigger('menu', 'editor.action.duplicateSelection', {});
          break;
        case 'addCursorAbove':
          editor.trigger('menu', 'editor.action.insertCursorAbove', {});
          break;
        case 'addCursorBelow':
          editor.trigger('menu', 'editor.action.insertCursorBelow', {});
          break;
        case 'addCursorsToLineEnds':
          editor.trigger('menu', 'editor.action.insertCursorAtEndOfEachLineSelected', {});
          break;

        case 'goBack':
          editor.trigger('menu', 'cursorUndo', {});
          break;
        case 'goForward':
          editor.trigger('menu', 'cursorRedo', {});
          break;
        case 'toggleBreakpoint':
          editor.trigger('menu', 'editor.debug.action.toggleBreakpoint', {});
          break;
      }
    };

    window.addEventListener('monaco-cmd', monacoCommandListener);

    editor.updateOptions({ wordWrap: editorStore.wordWrap || 'on' });

    // Configure JavaScript/TypeScript validation
    try {
      // @ts-ignore - Using deprecated API for JavaScript validation
      if (monaco.languages.typescript?.javascriptDefaults) {
        // @ts-ignore
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false,
          diagnosticCodesToIgnore: []
        });

        // @ts-ignore
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
          // @ts-ignore
          target: monaco.languages.typescript.ScriptTarget.ES2020,
          allowNonTsExtensions: true,
          // @ts-ignore
          moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
          // @ts-ignore
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
      }
    } catch (e) {
      // Silently fail if TypeScript config is not available
    }

    // Register code action provider for quick fixes
    const provider = monaco.languages.registerCodeActionProvider(language, {
      provideCodeActions: (model, range) => {
        const actions: any[] = [];

        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        const relevantMarkers = markers.filter(m =>
          m.startLineNumber === range.startLineNumber
        );

        relevantMarkers.forEach(marker => {
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
          dispose: () => { }
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
          ed.trigger('keyboard', 'editor.action.showHover', {});
        }
      }
    });

    // Listen to model changes to detect diagnostics in real-time
    const model = editor.getModel();
    if (model) {
      let diagnosticTimeout: any = null;

      const handleDiagnosticsChange = () => {
        const diagnostics = monaco.editor.getModelMarkers({ resource: model.uri });

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

      const markerDisposable = monaco.editor.onDidChangeMarkers((uris) => {
        if (uris.some(uri => uri.toString() === model.uri.toString())) {
          if (diagnosticTimeout) clearTimeout(diagnosticTimeout);
          diagnosticTimeout = setTimeout(handleDiagnosticsChange, 1000);
        }
      });

      diagnosticTimeout = setTimeout(handleDiagnosticsChange, 500);

      return () => {
        if (diagnosticTimeout) clearTimeout(diagnosticTimeout);
        markerDisposable.dispose();
        provider.dispose();
        window.removeEventListener('monaco-cmd', monacoCommandListener);
        if ((editor as any)._findHideInterval) {
          clearInterval((editor as any)._findHideInterval);
        }
      };
    }

    // Keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'undo', {});
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () => {
      editor.trigger('keyboard', 'redo', {});
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      editor.trigger('keyboard', 'editor.action.commentLine', {});
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      editorStore.toggleSidebar();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote, () => {
      editorStore.toggleTerminal();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, metaKey: true }));
    });

    // Ctrl+N -> New Text File (dispatch to EditorLayout)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyN, () => {
      console.log('🔥 Monaco: Ctrl+N pressed, dispatching event');
      window.dispatchEvent(new CustomEvent('create-new-file'));
    });

    // Ctrl+Alt+N -> New Folder (dispatch to EditorLayout)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyN, () => {
      console.log('🔥 Monaco: Ctrl+Alt+N pressed, dispatching event');
      window.dispatchEvent(new CustomEvent('create-new-folder'));
    });

    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyA, () => {
      editor.trigger('keyboard', 'editor.action.blockComment', {});
    });

    editor.onDidFocusEditorText(() => {
      onFocus();
    });

    return () => {
      window.removeEventListener('monaco-cmd', monacoCommandListener);
    };
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
      <div style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Editor
          height="100%"
          width="100%"
          theme={editorStore.theme === 'light' ? 'vs-light' : 'vs-dark'}
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
            wordWrap: editorStore.wordWrap || 'on',
            padding: { top: 10 },
            guides: { indentation: true, bracketPairs: true },
            bracketPairColorization: { enabled: true },
            renderLineHighlight: 'all',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lightbulb: {
              enabled: 'on' as any
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false
            }
          }}
        />
        <FindReplace 
          editorRef={internalEditorRef} 
          isVisible={showFindReplace}
          onClose={() => setShowFindReplace(false)}
        />
      </div>
    </div>
  );
};

export default memo(CodeEditor);
