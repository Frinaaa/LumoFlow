import React, { useState, useEffect, useCallback } from 'react';
import IDEHeader from '../components/Editor/IDEHeader';
import FileExplorer from '../components/Editor/FileExplorer';
import CodeEditor from '../components/Editor/CodeEditor';
import Terminal from '../components/Editor/Terminal';
import '../styles/TerminalScreen.css';

interface FileItem {
  name: string;
  path: string;
}

const EditorScreen: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load project files on mount
  useEffect(() => {
    loadProject();
  }, []);

  // Keyboard shortcut for save (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, code]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      const projectFiles = await window.api.readProjectFiles();
      setFiles(projectFiles);
      addTerminalOutput('✅ Project loaded successfully');
      
      // Auto-select first file if available
      if (projectFiles.length > 0) {
        handleFileSelect(projectFiles[0]);
      } else {
        setCode('// No files in project. Create a new file to get started.');
      }
    } catch (error) {
      addTerminalOutput(`❌ Error loading project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (file: FileItem) => {
    try {
      if (hasUnsavedChanges) {
        const shouldDiscard = window.confirm(
          'You have unsaved changes. Do you want to discard them?'
        );
        if (!shouldDiscard) return;
      }

      const content = await window.api.readFile(file.path);
      setSelectedFile(file.path);
      setCode(content);
      setHasUnsavedChanges(false);
      addTerminalOutput(`📂 Opened: ${file.name}`);
    } catch (error) {
      addTerminalOutput(`❌ Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) {
      addTerminalOutput('⚠️ No file selected to save');
      return;
    }

    try {
      await window.api.saveFile({ filePath: selectedFile, content: code });
      setHasUnsavedChanges(false);
      const fileName = selectedFile.split('\\').pop() || selectedFile;
      addTerminalOutput(`💾 Saved: ${fileName}`);
    } catch (error) {
      addTerminalOutput(`❌ Error saving file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRun = async () => {
    if (!selectedFile) {
      addTerminalOutput('⚠️ No file selected to run');
      return;
    }

    try {
      setIsRunning(true);
      const fileName = selectedFile.split('\\').pop() || selectedFile;
      addTerminalOutput(`\n▶️ Running: ${fileName}`);
      addTerminalOutput('─'.repeat(50));

      const output = await window.api.runCode({ filePath: selectedFile, code });
      
      if (Array.isArray(output)) {
        output.forEach(line => addTerminalOutput(line));
      } else {
        addTerminalOutput(String(output));
      }

      addTerminalOutput('─'.repeat(50));
      addTerminalOutput('✅ Execution completed');
    } catch (error) {
      addTerminalOutput(`❌ Runtime error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAnalyze = () => {
    if (!selectedFile) {
      addTerminalOutput('⚠️ No file selected to analyze');
      return;
    }

    addTerminalOutput('\n🔍 Starting code analysis...');
    addTerminalOutput('─'.repeat(50));
    
    const lines = code.split('\n').length;
    const chars = code.length;
    const functions = (code.match(/def\s+\w+|function\s+\w+/g) || []).length;
    const imports = (code.match(/^import\s|^from\s/gm) || []).length;

    addTerminalOutput(`📊 Code Statistics:`);
    addTerminalOutput(`   Lines: ${lines}`);
    addTerminalOutput(`   Characters: ${chars}`);
    addTerminalOutput(`   Functions/Methods: ${functions}`);
    addTerminalOutput(`   Imports: ${imports}`);
    addTerminalOutput('─'.repeat(50));
    addTerminalOutput('✅ Analysis complete');
  };

  const addTerminalOutput = useCallback((message: string) => {
    setTerminalOutput(prev => [...prev, message]);
  }, []);

  const clearTerminal = () => {
    setTerminalOutput([]);
    addTerminalOutput('Terminal cleared');
  };

  return (
    <div className="ide-wrapper">
      <IDEHeader 
        onAnalyze={handleAnalyze}
        onRun={handleRun}
        onSave={handleSave}
        isRunning={isRunning}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <div className="ide-body">
        <FileExplorer 
          files={files}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          isLoading={isLoading}
        />

        <main className="ide-main">
          <CodeEditor 
            code={code}
            onChange={(value) => {
              setCode(value);
              setHasUnsavedChanges(true);
            }}
            selectedFile={selectedFile}
            onSave={handleSave}
          />

          <Terminal 
            output={terminalOutput}
            onClear={clearTerminal}
          />
        </main>
      </div>
    </div>
  );
};

export default EditorScreen;