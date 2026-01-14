import React, { useMemo } from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  selectedFile: string | null;
  onSave: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, selectedFile, onSave }) => {
  const fileName = selectedFile ? selectedFile.split('\\').pop() : 'untitled';

  const language = useMemo(() => {
    if (!fileName) return 'plaintext';
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'py': 'python',
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'json': 'json',
      'md': 'markdown',
      'html': 'html',
      'css': 'css',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'sql': 'sql',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
    };
    
    return languageMap[ext || ''] || 'plaintext';
  }, [fileName]);

  return (
    <div className="editor-section">
      <div className="editor-tabs">
        {selectedFile ? (
          <div className="editor-tab active">
            <i className="fa-solid fa-file-code"></i>
            <span>{fileName}</span>
            <span className="tab-close">×</span>
          </div>
        ) : (
          <div className="editor-tab empty">
            <span>No file selected</span>
          </div>
        )}
      </div>
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
        }}
        onMount={(editor) => {
          // Add keyboard shortcut for save
          editor.addCommand(
            1 << 11 | 49, // Ctrl+S
            () => onSave()
          );
        }}
      />
    </div>
  );
};

export default CodeEditor;
