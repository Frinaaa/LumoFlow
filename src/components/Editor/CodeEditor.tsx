import React, { useMemo, useRef } from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  selectedFile: string | null;
  onSave: () => void;
  onClose: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, selectedFile, onSave, onClose }) => {
  const editorRef = useRef<any>(null);
  const fileName = selectedFile ? selectedFile.split('\\').pop() : 'untitled';

  const language = useMemo(() => {
    if (!fileName) return 'javascript';
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'json': 'json',
      'mjs': 'javascript',
      'cjs': 'javascript',
    };
    
    return languageMap[ext || ''] || 'javascript';
  }, [fileName]);

  const isValidJSFile = useMemo(() => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['js', 'jsx', 'ts', 'tsx', 'json', 'mjs', 'cjs'].includes(ext || '');
  }, [fileName]);

  return (
    <div className="editor-section">
      <div className="editor-tabs">
        {selectedFile ? (
          <div className="editor-tab active">
            <i className={`fa-solid ${language === 'typescript' ? 'fa-file-code' : 'fa-brands fa-js'}`}></i>
            <span className="tab-filename">{fileName}</span>
            <span className="tab-language">{language.toUpperCase()}</span>
            {/* The Close Button */}
            <i 
              className="fa-solid fa-xmark tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Close File"
            ></i>
          </div>
        ) : (
          <div className="editor-tab empty">
            <i className="fa-solid fa-file"></i>
            <span>No file selected</span>
          </div>
        )}
      </div>

      {!isValidJSFile && selectedFile ? (
        <div className="editor-error">
          <i className="fa-solid fa-circle-exclamation"></i>
          <p>Only JavaScript/TypeScript files are supported</p>
          <small>{fileName}</small>
        </div>
      ) : (
        <Editor
          height="100%"
          theme="vs-dark"
          language={language}
          value={code}
          onChange={(value) => onChange(value || "")}
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            padding: { top: 20 },
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            suggestOnTriggerCharacters: true,
            bracketPairColorization: { enabled: true },
            inlineSuggest: { enabled: true },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
            parameterHints: { enabled: true },
            codeLens: true,
            folding: true,
            foldingStrategy: 'indentation',
            showUnused: true,
            showDeprecated: true,
          }}
          onMount={(editor) => {
            editorRef.current = editor;
            
            // Ctrl+S for save
            editor.addCommand(
              1 << 11 | 49,
              () => onSave()
            );

            // Ctrl+/ for comment toggle
            editor.addCommand(
              1 << 11 | 191,
              () => {
                editor.trigger('keyboard', 'editor.action.commentLine', {});
              }
            );

            // Ctrl+Shift+F for format
            editor.addCommand(
              1 << 11 | 1 << 10 | 70,
              () => {
                editor.trigger('keyboard', 'editor.action.formatDocument', {});
              }
            );
          }}
        />
      )}
    </div>
  );
};

export default CodeEditor;
