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
  onProblemsDetected?: (problems: Array<{message: string; line: number; source: string; type: 'error' | 'warning'}>) => void;
  editorRef?: React.MutableRefObject<any>;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, onChange, selectedFile, onSave, onRun, onClose, onCursorChange, isActive, onFocus, onProblemsDetected, editorRef    
}) => {
  const internalEditorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const fileName = selectedFile ? selectedFile.split('\\').pop() : 'untitled';

  const language = useMemo(() => {
    if (!fileName) return 'javascript';
    const ext = fileName.split('.').pop()?.toLowerCase();
    const map: any = { js: 'javascript', ts: 'typescript', py: 'python', json: 'json', css: 'css', html: 'html' };
    return map[ext || ''] || 'plaintext';
  }, [fileName]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    internalEditorRef.current = editor;
    
    if (editorRef) {
      editorRef.current = editor;
    }
    
    editor.onDidChangeCursorPosition((e: any) => {
      onCursorChange(e.position.lineNumber, e.position.column);
    });
    monacoRef.current = monaco;

    // Listen to model changes to detect diagnostics
    const model = editor.getModel();
    if (model) {
      const handleDiagnosticsChange = () => {
        const diagnostics = monaco.editor.getModelMarkers({ resource: model.uri });
        if (onProblemsDetected && diagnostics.length > 0) {
          const problems = diagnostics.map(d => ({
            message: d.message,
            line: d.startLineNumber,
            source: fileName || 'file',
            type: d.severity === 8 ? 'error' : 'warning' as 'error' | 'warning'
          }));
          onProblemsDetected(problems);
        }
      };
      
      // Check diagnostics on mount
      handleDiagnosticsChange();
      
      // Listen for changes
      const disposable = monaco.editor.onDidChangeMarkers(() => {
        handleDiagnosticsChange();
      });
      
      return () => disposable.dispose();
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
    <div className="editor-section" 
         style={{ 
           display: 'flex', flexDirection: 'column', height: '100%',
           border: isActive ? '1px solid #007acc' : '1px solid transparent' 
         }}>
      {/* File Tab Bar */}
      <div className="editor-tabs">
        {selectedFile ? (
          <div className="editor-tab active">
            <i className={`fa-brands fa-${language === 'python' ? 'python' : 'js'}`}></i>
            <span className="tab-filename">{fileName}</span>
            <i className="fa-solid fa-xmark tab-close" onClick={(e) => { e.stopPropagation(); onClose(); }}></i>
          </div>
        ) : (
          <div className="editor-tab empty">No file selected</div>
        )}
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <Editor
          height="100%"
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
            padding: { top: 15 },
            guides: { indentation: true, bracketPairs: true },
            bracketPairColorization: { enabled: true },
            renderLineHighlight: 'all',
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;