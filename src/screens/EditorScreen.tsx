import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeEditor from '../components/Editor/CodeEditor';
import AnalysisPanel from '../components/Editor/SidePanel';
import Terminal from '../components/Editor/Terminal';
import StatusBar from '../components/Editor/StatusBar';
import ActivityBar from '../components/Editor/ActivityBar';
import CustomTitlebar from '../components/CustomTitlebar';
import { useEditor } from '../context/EditorContext';
import { FileExplorerSidebar } from './EditorScreen/components';
import '../styles/TerminalScreen.css';

interface Problem {
  message: string;
  line: number;
  source: string;
  type: 'error' | 'warning';
}

const EditorScreen: React.FC = () => {
  const navigate = useNavigate();
  const editorContext = useEditor();

  const [activeSidebar, setActiveSidebar] = useState('Explorer');
  const [activeBottomTab, setActiveBottomTab] = useState('Terminal');
  const [files, setFiles] = useState<any[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [activeEditor, setActiveEditor] = useState({ file: null as string | null, code: "", cursorLine: 1, cursorCol: 1 });
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [outputData, setOutputData] = useState('');
  const [debugData, setDebugData] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [terminalHeight, setTerminalHeight] = useState(240);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);
  const [isTerminalVisible, setIsTerminalVisible] = useState(true);
  
  // File Explorer State
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [renameFile, setRenameFile] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [clipboard, setClipboard] = useState<any>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [creatingInFolder, setCreatingInFolder] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const res = await window.api.readProjectFiles();
      setFiles(res);
    };
    load();
  }, []);

  // Set up editor context handlers
  useEffect(() => {
    editorContext.setEditorState({
      onAnalyze: () => {
        setIsAnalysisMode(prev => !prev);
      },
      onRun: async () => {
        if (!activeEditor.file) {
          setOutputData('❌ No file selected to run\n');
          setActiveBottomTab('Output');
          return;
        }
        
        // Clear previous output and switch to Output tab
        setOutputData('');
        setActiveBottomTab('Output');
        
        // Show running message
        const fileName = activeEditor.file.split(/[\\/]/).pop();
        setOutputData(`▶ Running ${fileName}...\n\n`);
        
        try {
          // Use the proper runCode handler that executes the file
          const result = await window.api.runCode({
            filePath: activeEditor.file,
            code: activeEditor.code
          });
          
          // Display stdout (normal output)
          if (result.stdout) {
            setOutputData(prev => prev + result.stdout + '\n');
          }
          
          // Display stderr (errors) in debug console
          if (result.stderr) {
            setDebugData(prev => prev + `[${fileName}]\n${result.stderr}\n\n`);
            // Also show a summary in output
            setOutputData(prev => prev + '\n❌ Program exited with errors. Check Debug Console for details.\n');
          } else {
            setOutputData(prev => prev + '\n✅ Program completed successfully.\n');
          }
          
        } catch (error: any) {
          setOutputData(prev => prev + `\n❌ Error: ${error.message}\n`);
          setDebugData(prev => prev + `Error executing file: ${error.message}\n`);
        }
      },
      onSave: async () => {
        if (!activeEditor.file) {
          setOutputData('No file to save\n');
          setActiveBottomTab('Output');
          return;
        }
        
        try {
          const result = await window.api.saveFile({
            filePath: activeEditor.file,
            content: activeEditor.code
          });
          
          if (result.success) {
            setOutputData(`File saved: ${activeEditor.file}\n`);
            setActiveBottomTab('Output');
            // Reload files to update the explorer
            const updatedFiles = await window.api.readProjectFiles();
            setFiles(updatedFiles);
          } else {
            setOutputData(`Error saving file: ${result.msg || 'Unknown error'}\n`);
            setActiveBottomTab('Output');
          }
        } catch (error: any) {
          console.error('Error saving file:', error);
          setOutputData(`Error saving file: ${error.message}\n`);
          setActiveBottomTab('Output');
        }
      },
      onMenuAction: async (action: string) => {
        switch(action) {
          case 'newFile':
            setIsCreatingFile(true);
            setCreatingInFolder(null);
            setOutputData('Creating new file...\n');
            setActiveBottomTab('Output');
            break;
            
          case 'openFile':
            try {
              const result = await window.api.openFileDialog();
              if (result && !result.canceled && result.filePath) {
                const content: any = await window.api.readFile(result.filePath);
                setActiveEditor({
                  file: result.filePath,
                  code: typeof content === 'string' ? content : (content.content || ''),
                  cursorLine: 1,
                  cursorCol: 1
                });
                setOutputData(`File opened: ${result.filePath}\n`);
                setActiveBottomTab('Output');
              }
            } catch (error: any) {
              console.error('Error opening file:', error);
              setOutputData(`Error opening file: ${error.message}\n`);
              setActiveBottomTab('Output');
            }
            break;
            
          case 'openFolder':
            try {
              const result = await window.api.openFolderDialog();
              if (result && !result.canceled && result.folderPath) {
                const updatedFiles = await window.api.readProjectFiles();
                setFiles(updatedFiles);
                setOutputData(`Folder opened: ${result.folderPath}\n`);
                setActiveBottomTab('Output');
              }
            } catch (error: any) {
              console.error('Error opening folder:', error);
              setOutputData(`Error opening folder: ${error.message}\n`);
              setActiveBottomTab('Output');
            }
            break;
            
          case 'saveAs':
            if (!activeEditor.code) {
              setOutputData('No content to save\n');
              setActiveBottomTab('Output');
              return;
            }
            try {
              const result = await window.api.saveFileAs(activeEditor.code);
              if (result && !result.canceled && result.filePath) {
                setActiveEditor(prev => ({ ...prev, file: result.filePath }));
                // Reload files to show the new file in explorer
                const updatedFiles = await window.api.readProjectFiles();
                setFiles(updatedFiles);
                setOutputData(`File saved as: ${result.filePath}\n`);
                setActiveBottomTab('Output');
              }
            } catch (error: any) {
              console.error('Error saving file:', error);
              setOutputData(`Error saving file: ${error.message}\n`);
              setActiveBottomTab('Output');
            }
            break;
            
          case 'saveAll':
            if (activeEditor.file && activeEditor.code) {
              try {
                const result = await window.api.saveFile({
                  filePath: activeEditor.file,
                  content: activeEditor.code
                });
                if (result.success) {
                  setOutputData(`All files saved\n`);
                  setActiveBottomTab('Output');
                }
              } catch (error: any) {
                setOutputData(`Error saving files: ${error.message}\n`);
                setActiveBottomTab('Output');
              }
            }
            break;
            
          case 'toggleAutoSave':
            const newAutoSave = !editorContext.autoSave;
            editorContext.setEditorState({ autoSave: newAutoSave });
            setOutputData(`Auto Save ${newAutoSave ? 'enabled' : 'disabled'}\n`);
            setActiveBottomTab('Output');
            break;
            
          case 'closeEditor':
            setActiveEditor({ file: null, code: '', cursorLine: 1, cursorCol: 1 });
            setOutputData('Editor closed\n');
            setActiveBottomTab('Output');
            break;
            
          case 'newWindow':
            try {
              if (window.api && window.api.newWindow) {
                await window.api.newWindow();
                setOutputData('New window opened\n');
                setActiveBottomTab('Output');
              }
            } catch (error: any) {
              setOutputData(`Error opening new window: ${error.message}\n`);
              setActiveBottomTab('Output');
            }
            break;
        }
      },
      isAnalysisMode: isAnalysisMode,
      autoSave: editorContext.autoSave || false
    });
  }, [isAnalysisMode, activeEditor.file, activeEditor.code, editorContext.autoSave]);

  // Sidebar resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) {
        const newWidth = Math.max(200, Math.min(600, e.clientX - 48));
        setSidebarWidth(newWidth);
      }
      if (isResizingTerminal) {
        const newHeight = Math.max(100, Math.min(600, window.innerHeight - e.clientY - 22));
        setTerminalHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingTerminal(false);
    };

    if (isResizingSidebar || isResizingTerminal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingSidebar, isResizingTerminal]);

  const handleFileSelect = async (file: any) => {
    // Close context menu if open
    setContextMenu(null);
    
    try {
      console.log('Opening file:', file.path);
      const res: any = await window.api.readFile(file.path);
      console.log('File read result:', res);
      
      if (res.success === false) {
        setOutputData(`Error reading file: ${res.msg}\n`);
        setActiveBottomTab('Output');
        return;
      }
      
      const content = typeof res === 'string' ? res : (res.content || '');
      setActiveEditor({ 
        file: file.path, 
        code: content,
        cursorLine: 1,
        cursorCol: 1
      });
      
      setOutputData(`File opened: ${file.path}\n`);
      setActiveBottomTab('Output');
    } catch (error: any) {
      console.error('Error reading file:', error);
      setOutputData(`Error reading file: ${error.message || error}\n`);
      setActiveBottomTab('Output');
    }
  };

  const handleProblemsDetected = (detectedProblems: Problem[]) => {
    setProblems(detectedProblems);
    if (detectedProblems.length > 0 && activeBottomTab !== 'Problems') {
      // Optionally auto-switch to Problems tab when errors are detected
      // setActiveBottomTab('Problems');
    }
  };

  const handleCreateFile = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newFileName.trim()) return;

    try {
      // Build the file path - if creating in folder, extract just the folder name from full path
      let fileName = newFileName;
      if (creatingInFolder) {
        // Extract relative folder path by getting just the folder name(s) after projectDir
        const folderParts = creatingInFolder.split(/[\\/]/);
        const folderName = folderParts[folderParts.length - 1];
        fileName = `${folderName}/${newFileName}`;
      }
      
      const result = await window.api.createFile({ 
        fileName: fileName, 
        content: '' 
      });
      
      if (result.success) {
        // Reload files
        const updatedFiles = await window.api.readProjectFiles();
        setFiles(updatedFiles);
        
        // Open the newly created file
        const newFilePath = result.path;
        setActiveEditor({
          file: newFilePath,
          code: '',
          cursorLine: 1,
          cursorCol: 1
        });
        
        setOutputData(`File created: ${fileName}\n`);
        setActiveBottomTab('Output');
      } else {
        setOutputData(`Error creating file: ${result.msg}\n`);
        setActiveBottomTab('Output');
      }
    } catch (error: any) {
      console.error('Error creating file:', error);
      setOutputData(`Error creating file: ${error.message}\n`);
      setActiveBottomTab('Output');
    } finally {
      setIsCreatingFile(false);
      setNewFileName('');
      setCreatingInFolder(null);
    }
  };

  const handleCreateFolder = async (folderName?: string) => {
    const name = folderName || newFolderName;
    if (!name.trim()) return;

    try {
      const result = await window.api.createFolder(name);
      
      if (result.success) {
        // Reload files
        const updatedFiles = await window.api.readProjectFiles();
        setFiles(updatedFiles);
        setOutputData(`Folder created: ${name}\n`);
      } else {
        setOutputData(`Error creating folder: ${result.msg}\n`);
      }
    } catch (error: any) {
      console.error('Error creating folder:', error);
      setOutputData(`Error creating folder: ${error.message}\n`);
    } finally {
      setIsCreatingFolder(false);
      setNewFolderName('');
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const result = await window.api.deleteFile(filePath);
      
      if (result.success) {
        // Reload files
        const updatedFiles = await window.api.readProjectFiles();
        setFiles(updatedFiles);
        
        // Close file if it's currently open
        if (activeEditor.file === filePath) {
          setActiveEditor({ file: null, code: '', cursorLine: 1, cursorCol: 1 });
        }
        
        setOutputData(`File deleted: ${filePath}\n`);
      } else {
        setOutputData(`Error deleting file: ${result.msg}\n`);
      }
    } catch (error: any) {
      console.error('Error deleting file:', error);
      setOutputData(`Error deleting file: ${error.message}\n`);
    }
  };

  const confirmRename = async () => {
    if (!renameFile || !newName.trim()) return;

    try {
      const result = await window.api.renameFile(renameFile, newName);
      
      if (result.success) {
        // Reload files
        const updatedFiles = await window.api.readProjectFiles();
        setFiles(updatedFiles);
        
        // Update active editor if renamed file is open
        if (activeEditor.file === renameFile) {
          setActiveEditor({ ...activeEditor, file: result.newPath || newName });
        }
        
        setOutputData(`File renamed: ${renameFile} → ${newName}\n`);
      } else {
        setOutputData(`Error renaming file: ${result.msg}\n`);
      }
    } catch (error: any) {
      console.error('Error renaming file:', error);
      setOutputData(`Error renaming file: ${error.message}\n`);
    } finally {
      setRenameFile(null);
      setNewName('');
    }
  };

  const handleCopyFile = (file: any) => {
    setClipboard({ ...file, operation: 'copy' });
    setOutputData(`Copied: ${file.name}\n`);
  };

  const handleCutFile = (file: any) => {
    setClipboard({ ...file, operation: 'cut' });
    setOutputData(`Cut: ${file.name}\n`);
  };

  const handlePasteFile = async () => {
    if (!clipboard) return;

    try {
      // Implementation depends on your backend API
      // For now, just show a message
      setOutputData(`Paste operation: ${clipboard.operation} ${clipboard.name}\n`);
      
      if (clipboard.operation === 'cut') {
        setClipboard(null);
      }
    } catch (error: any) {
      console.error('Error pasting file:', error);
      setOutputData(`Error pasting file: ${error.message}\n`);
    }
  };

  const handleCommand = async (cmd: string) => {
    setTerminalOutput(prev => prev + `$ ${cmd}\n`);
    try {
      if (window.api && window.api.executeCommand) {
        const result = await window.api.executeCommand(cmd);
        setTerminalOutput(prev => prev + result + '\n');
        return result;
      }
      return "Command execution not available";
    } catch (error: any) {
      const errorMsg = `Error: ${error.message}\n`;
      setTerminalOutput(prev => prev + errorMsg);
      return errorMsg;
    }
  };

  return (
  <div className="ide-grid-master">
    {/* 1. TOP LAYER: HEADER */}
    <CustomTitlebar />

    {/* 2. MIDDLE LAYER: MAIN CONTENT */}
    <div className="ide-main-body">
      {/* COLUMN A: ACTIVITY BAR (48px) */}
      <ActivityBar 
        activeSidebar={activeSidebar} 
        onSidebarChange={setActiveSidebar}
        onNavigate={navigate}
      />

      {/* COLUMN B: SIDEBAR (260px) */}
      {activeSidebar && (
        <>
          <aside className="vs-sidebar-container" style={{ width: sidebarWidth }}>
            <div className="sidebar-header">
              {activeSidebar.toUpperCase()}
              <i className="fa-solid fa-ellipsis" style={{ marginLeft: 'auto', cursor: 'pointer' }}></i>
            </div>
            <div className="sidebar-sections-stack">
              {activeSidebar === 'Explorer' && (
                <div className="sidebar-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <i className="fa-solid fa-chevron-down"></i> LUMOFLOW UI
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <i 
                        className="fa-solid fa-file-plus" 
                        onClick={() => setIsCreatingFile(true)}
                        style={{ cursor: 'pointer', fontSize: '12px', opacity: 0.7 }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                        title="New File"
                      ></i>
                      <i 
                        className="fa-solid fa-folder-plus" 
                        onClick={() => setIsCreatingFolder(true)}
                        style={{ cursor: 'pointer', fontSize: '12px', opacity: 0.7 }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                        title="New Folder"
                      ></i>
                      <i 
                        className="fa-solid fa-rotate-right" 
                        onClick={async () => {
                          const updatedFiles = await window.api.readProjectFiles();
                          setFiles(updatedFiles);
                          setOutputData('Files refreshed\n');
                        }}
                        style={{ cursor: 'pointer', fontSize: '12px', opacity: 0.7 }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                        title="Refresh"
                      ></i>
                    </div>
                  </div>
                  <FileExplorerSidebar 
                    files={files} 
                    handleFileSelect={handleFileSelect}
                    isCreatingFile={isCreatingFile}
                    isCreatingFolder={isCreatingFolder}
                    newFileName={newFileName}
                    newFolderName={newFolderName}
                    renameFile={renameFile}
                    newName={newName}
                    clipboard={clipboard}
                    expandedFolders={expandedFolders}
                    selectedFolder={selectedFolder}
                    creatingInFolder={creatingInFolder}
                    setIsCreatingFile={setIsCreatingFile}
                    setIsCreatingFolder={setIsCreatingFolder}
                    setNewFileName={setNewFileName}
                    setNewFolderName={setNewFolderName}
                    setExpandedFolders={setExpandedFolders}
                    setSelectedFolder={setSelectedFolder}
                    setCreatingInFolder={setCreatingInFolder}
                    setContextMenu={setContextMenu}
                    setRenameFile={setRenameFile}
                    setNewName={setNewName}
                    handleCreateFile={handleCreateFile}
                    handleCreateFolder={handleCreateFolder}
                    handlePasteFile={handlePasteFile}
                    confirmRename={confirmRename}
                  />
                </div>
              )}
              <div className="sidebar-section-header-only">
                <i className="fa-solid fa-chevron-right"></i> OUTLINE
              </div>
              <div className="sidebar-section-header-only">
                <i className="fa-solid fa-chevron-right"></i> TIMELINE
              </div>
            </div>
          </aside>
          {/* Sidebar Resize Handle */}
          <div 
            className="resize-handle-vertical"
            onMouseDown={() => setIsResizingSidebar(true)}
            style={{
              width: '4px',
              cursor: 'col-resize',
              background: isResizingSidebar ? '#00f2ff' : 'transparent',
              transition: 'background 0.2s'
            }}
          />
        </>
      )}

      {/* COLUMN C: EDITOR & TERMINAL (REMAINING SPACE) */}
      <main className="editor-terminal-stack">
        {/* Editor Tabs */}
        {activeEditor.file && (
          <div className="editor-tabs">
            <div className="editor-tab active">
              <i className="fa-regular fa-file-code" style={{ fontSize: '14px', color: '#519aba' }}></i>
              <span>{activeEditor.file.split(/[\\/]/).pop()}</span>
              <i className="fa-solid fa-xmark close-btn" onClick={() => setActiveEditor({ file: null, code: '', cursorLine: 1, cursorCol: 1 })}></i>
            </div>
          </div>
        )}

        <div className="editor-workspace">
          {activeEditor.file ? (
            <CodeEditor 
              code={activeEditor.code} 
              selectedFile={activeEditor.file} 
              isActive={true} 
              onRun={editorContext.onRun}
              onChange={(v) => setActiveEditor(p => ({...p, code: v}))}
              onCursorChange={(l, c) => setActiveEditor(p => ({...p, cursorLine: l, cursorCol: c}))}
              onSave={() => {}}
              onClose={() => setActiveEditor({ file: null, code: '', cursorLine: 1, cursorCol: 1 })}
              onFocus={() => {}}
              onProblemsDetected={handleProblemsDetected}
            />
          ) : (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#cccccc',
              gap: '24px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(188, 19, 254, 0.1), rgba(0, 242, 255, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px'
              }}>
                <i className="fa-solid fa-file-code" style={{ 
                  fontSize: '56px', 
                  color: '#bc13fe',
                  opacity: 0.6
                }}></i>
              </div>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 500,
                color: '#ffffff',
                letterSpacing: '0.5px'
              }}>
                No File Selected
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#888888',
                maxWidth: '400px',
                lineHeight: '1.6'
              }}>
                Open a file from the explorer or use <span style={{ 
                  color: '#00f2ff',
                  fontFamily: 'monospace',
                  background: '#2d2d30',
                  padding: '2px 6px',
                  borderRadius: '3px'
                }}>Ctrl+O</span> to start editing
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '12px',
                marginTop: '10px'
              }}>
                <button
                  onClick={() => editorContext.onMenuAction?.('openFile')}
                  style={{
                    background: 'transparent',
                    border: '1px solid #3c3c3c',
                    color: '#cccccc',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#37373d';
                    e.currentTarget.style.borderColor = '#4c4c4c';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#3c3c3c';
                  }}
                >
                  <i className="fa-solid fa-folder-open"></i>
                  Open File
                </button>
                <button
                  onClick={() => editorContext.onMenuAction?.('openFolder')}
                  style={{
                    background: 'transparent',
                    border: '1px solid #3c3c3c',
                    color: '#cccccc',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#37373d';
                    e.currentTarget.style.borderColor = '#4c4c4c';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#3c3c3c';
                  }}
                >
                  <i className="fa-solid fa-folder"></i>
                  Open Folder
                </button>
              </div>
            </div>
          )}
          <div className="vs-minimap-strip"></div>
        </div>

        {/* TERMINAL PANEL WITH RESIZE HANDLE */}
        {isTerminalVisible && (
          <>
            <div 
              className="resize-handle-horizontal"
              onMouseDown={() => setIsResizingTerminal(true)}
              style={{
                height: '4px',
                cursor: 'row-resize',
                background: isResizingTerminal ? '#00f2ff' : 'transparent',
                transition: 'background 0.2s',
                borderTop: '1px solid #2d2d2d'
              }}
            />
            <div className="vs-panel-dock" style={{ height: terminalHeight }}>
              <Terminal 
                activeTab={activeBottomTab}
                terminalOutput={terminalOutput}
                outputData={outputData}
                debugData={debugData}
                problems={problems}
                onCommand={handleCommand}
                onClear={() => {
                  if (activeBottomTab === 'Terminal') setTerminalOutput('');
                  else if (activeBottomTab === 'Output') setOutputData('');
                  else if (activeBottomTab === 'Debug') setDebugData('');
                }}
                onTabChange={setActiveBottomTab}
                onClose={() => setIsTerminalVisible(false)}
                onMaximize={() => {
                  setTerminalHeight(prev => prev === 240 ? 500 : 240);
                }}
                onNavigateToLine={(line: number, column?: number) => {
                  // Navigate to the specific line in the code editor
                  setActiveEditor(prev => ({
                    ...prev,
                    cursorLine: line,
                    cursorCol: column || 1
                  }));
                  // You can add Monaco editor navigation here if needed
                  console.log(`Navigating to line ${line}, column ${column || 1}`);
                }}
              />
            </div>
          </>
        )}
      </main>

      {/* OPTIONAL ANALYSIS PANEL */}
      {isAnalysisMode && (
        <aside className="analysis-sidebar-fixed" style={{ width: '350px', borderLeft: '1px solid #2d2d2d' }}>
          <AnalysisPanel 
            code={activeEditor.code} 
            language="javascript"
            isVisible={true} 
          />
        </aside>
      )}
      
      {/* CONTEXT MENU */}
      {contextMenu && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setContextMenu(null)}
          />
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              background: '#252526',
              border: '1px solid #454545',
              borderRadius: '4px',
              padding: '4px 0',
              minWidth: '180px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              zIndex: 1000,
              fontSize: '13px',
              color: '#cccccc'
            }}
          >
            {!contextMenu.file.isFolder && (
              <div
                style={{
                  padding: '6px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => {
                  handleFileSelect(contextMenu.file);
                  setContextMenu(null);
                }}
              >
                <i className="fa-regular fa-folder-open" style={{ width: '14px' }}></i>
                <span>Open</span>
              </div>
            )}
            
            {contextMenu.file.isFolder && (
              <>
                <div
                  style={{
                    padding: '6px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => {
                    setCreatingInFolder(contextMenu.file.path);
                    setIsCreatingFile(true);
                    setExpandedFolders(prev => new Set([...prev, contextMenu.file.path]));
                    setContextMenu(null);
                  }}
                >
                  <i className="fa-solid fa-file-plus" style={{ width: '14px' }}></i>
                  <span>New File</span>
                </div>
                <div
                  style={{
                    padding: '6px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => {
                    // Future: Create subfolder
                    setOutputData('Create subfolder feature coming soon\n');
                    setContextMenu(null);
                  }}
                >
                  <i className="fa-solid fa-folder-plus" style={{ width: '14px' }}></i>
                  <span>New Folder</span>
                </div>
                <div style={{ height: '1px', background: '#454545', margin: '4px 0' }}></div>
              </>
            )}
            
            <div
              style={{
                padding: '6px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => {
                setRenameFile(contextMenu.file.path);
                setNewName(contextMenu.file.name);
                setContextMenu(null);
              }}
            >
              <i className="fa-solid fa-pen" style={{ width: '14px' }}></i>
              <span>Rename</span>
            </div>
            <div
              style={{
                padding: '6px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => {
                handleCopyFile(contextMenu.file);
                setContextMenu(null);
              }}
            >
              <i className="fa-regular fa-copy" style={{ width: '14px' }}></i>
              <span>Copy</span>
            </div>
            <div
              style={{
                padding: '6px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => {
                handleCutFile(contextMenu.file);
                setContextMenu(null);
              }}
            >
              <i className="fa-solid fa-scissors" style={{ width: '14px' }}></i>
              <span>Cut</span>
            </div>
            {clipboard && (
              <div
                style={{
                  padding: '6px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => {
                  handlePasteFile();
                  setContextMenu(null);
                }}
              >
                <i className="fa-solid fa-paste" style={{ width: '14px' }}></i>
                <span>Paste</span>
              </div>
            )}
            <div style={{ height: '1px', background: '#454545', margin: '4px 0' }}></div>
            <div
              style={{
                padding: '6px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#f48771'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => {
                handleDeleteFile(contextMenu.file.path);
                setContextMenu(null);
              }}
            >
              <i className="fa-solid fa-trash" style={{ width: '14px' }}></i>
              <span>Delete</span>
            </div>
          </div>
        </>
      )}
    </div>

    {/* 3. BOTTOM LAYER: STATUS BAR */}
    <StatusBar 
      line={activeEditor.file ? activeEditor.cursorLine : 1} 
      col={activeEditor.file ? activeEditor.cursorCol : 1} 
      language="javascript" 
    />
  </div>
  );
};

export default EditorScreen;