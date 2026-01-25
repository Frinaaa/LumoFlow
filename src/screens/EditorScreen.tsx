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
  const [workspaceFolderName, setWorkspaceFolderName] = useState<string>('');
  const [workspaceFolderPath, setWorkspaceFolderPath] = useState<string>('');
  // Context menu state
  const [contextMenu, setContextMenu] = useState<any>(null);
  
  // Outline and Timeline state
  const [outlineExpanded, setOutlineExpanded] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [outlineItems, setOutlineItems] = useState<any[]>([]);
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  
  // Draggable panel state
  const [isDraggingPanel, setIsDraggingPanel] = useState<string | null>(null);
  const [panelPositions, setPanelPositions] = useState({
    explorer: { x: 0, y: 0 },
    terminal: { x: 0, y: 0 },
    analysis: { x: 0, y: 0 }
  });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Close context menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && contextMenu) {
        setContextMenu(null);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [contextMenu]);

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
          case 'newTextFile':
            setIsCreatingFile(true);
            setCreatingInFolder(null);
            setOutputData('Creating new text file...\n');
            setActiveBottomTab('Output');
            break;
            
          case 'newFolder':
            setIsCreatingFolder(true);
            setOutputData('Creating new folder...\n');
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
                // Extract folder name from path
                const folderName = result.folderPath.split(/[\\/]/).pop() || 'Workspace';
                setWorkspaceFolderName(folderName);
                setWorkspaceFolderPath(result.folderPath);
                setOutputData(`Folder opened: ${result.folderPath}\n`);
                setActiveBottomTab('Output');
              }
            } catch (error: any) {
              console.error('Error opening folder:', error);
              setOutputData(`Error opening folder: ${error.message}\n`);
              setActiveBottomTab('Output');
            }
            break;
            
          case 'closeFolder':
            // Clear all files from explorer
            setFiles([]);
            // Clear workspace folder
            setWorkspaceFolderName('');
            setWorkspaceFolderPath('');
            // Close active editor
            setActiveEditor({
              file: null,
              code: '',
              cursorLine: 1,
              cursorCol: 1
            });
            // Collapse all folders
            setExpandedFolders(new Set());
            setOutputData('Folder closed\n');
            setActiveBottomTab('Output');
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
  localStorage.setItem('autoSave', JSON.stringify(newAutoSave)); // Persistent storage
  break;

case 'toggleTerminal':
  editorContext.setEditorState({ isTerminalVisible: !editorContext.isTerminalVisible });
  break;

case 'toggleSidebar':
  const newWidth = sidebarWidth > 0 ? 0 : 260; // Toggles the UI appearance
  setSidebarWidth(newWidth);
  editorContext.setEditorState({ isSidebarVisible: newWidth > 0 });
  break;

case 'toggleWordWrap':
  const nextWrap = editorContext.wordWrap === 'on' ? 'off' : 'on';
  editorContext.setEditorState({ wordWrap: nextWrap });
  break;

case 'goToLine':
  const lineNum = prompt("Go to Line:");
  if (lineNum) {
    window.dispatchEvent(new CustomEvent('monaco-cmd', { 
      detail: { action: 'revealLine', value: parseInt(lineNum) } 
    }));
  }
  break;

case 'selectAll':
  window.dispatchEvent(new CustomEvent('monaco-cmd', { detail: { action: 'selectAll' } }));
  break;

case 'newTerminal':
  setTerminalOutput("> Initializing new session...\n$ ");
  setActiveBottomTab('Terminal');
  editorContext.setEditorState({ isTerminalVisible: true });
  break;

case 'viewProblems':
  setActiveBottomTab('Problems');
  editorContext.setEditorState({ isTerminalVisible: true });
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

  // Auto-save functionality
  useEffect(() => {
    if (!editorContext.autoSave || !activeEditor.file || !activeEditor.code) {
      return;
    }

    const autoSaveInterval = setInterval(async () => {
      try {
        const result = await window.api.saveFile({
          filePath: activeEditor.file!,
          content: activeEditor.code
        });
        
        if (result.success) {
          console.log('Auto-saved:', activeEditor.file);
          // Optionally show a subtle notification
        }
      } catch (error) {
        console.error('Auto-save error:', error);
      }
    }, 5000); // Auto-save every 5 seconds

    return () => clearInterval(autoSaveInterval);
  }, [editorContext.autoSave, activeEditor.file, activeEditor.code]);

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', editorContext.theme);
  }, [editorContext.theme]);

  // Parse outline from active file
  useEffect(() => {
    if (!activeEditor.code || !activeEditor.file) {
      setOutlineItems([]);
      return;
    }

    const lines = activeEditor.code.split('\n');
    const items: any[] = [];
    
    lines.forEach((line, index) => {
      // Detect functions
      if (line.match(/function\s+(\w+)/)) {
        const match = line.match(/function\s+(\w+)/);
        items.push({
          type: 'function',
          name: match![1],
          line: index + 1,
          icon: 'fa-solid fa-cube'
        });
      }
      // Detect classes
      else if (line.match(/class\s+(\w+)/)) {
        const match = line.match(/class\s+(\w+)/);
        items.push({
          type: 'class',
          name: match![1],
          line: index + 1,
          icon: 'fa-solid fa-box'
        });
      }
      // Detect const/let/var
      else if (line.match(/(?:const|let|var)\s+(\w+)/)) {
        const match = line.match(/(?:const|let|var)\s+(\w+)/);
        items.push({
          type: 'variable',
          name: match![1],
          line: index + 1,
          icon: 'fa-solid fa-code'
        });
      }
      // Detect interfaces (TypeScript)
      else if (line.match(/interface\s+(\w+)/)) {
        const match = line.match(/interface\s+(\w+)/);
        items.push({
          type: 'interface',
          name: match![1],
          line: index + 1,
          icon: 'fa-solid fa-shapes'
        });
      }
    });
    
    setOutlineItems(items);
  }, [activeEditor.code, activeEditor.file]);

  // Generate timeline (file history simulation)
  useEffect(() => {
    if (!activeEditor.file) {
      setTimelineItems([]);
      return;
    }

    // Simulate timeline items (in production, this would come from git history)
    const items = [
      { date: 'Today', time: '2:30 PM', action: 'Modified', user: 'You' },
      { date: 'Today', time: '11:45 AM', action: 'Created', user: 'You' },
      { date: 'Yesterday', time: '4:20 PM', action: 'Renamed', user: 'You' }
    ];
    
    setTimelineItems(items);
  }, [activeEditor.file]);

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
      
      // Handle panel dragging
      if (isDraggingPanel) {
        setPanelPositions(prev => ({
          ...prev,
          [isDraggingPanel]: {
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
          }
        }));
      }
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingTerminal(false);
      setIsDraggingPanel(null);
    };

    if (isResizingSidebar || isResizingTerminal || isDraggingPanel) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingSidebar, isResizingTerminal, isDraggingPanel, dragOffset]);

  const handleFileSelect = async (file: any) => {
    // Close context menu if open
    setContextMenu(null);
    
    // Prevent selecting folders
    if (file.isFolder) {
      return;
    }
    
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
      // Validate filename - ensure it has an extension and no path separators
      let fileName = newFileName.trim();
      
      // Remove any path separators from the filename
      fileName = fileName.replace(/[\\/]/g, '');
      
      // If no extension, add .txt by default
      if (!fileName.includes('.')) {
        fileName = fileName + '.txt';
      }
      
      // Build the file path - if creating in folder, extract just the folder name from full path
      if (creatingInFolder) {
        // Extract relative folder path by getting just the folder name(s) after projectDir
        const folderParts = creatingInFolder.split(/[\\/]/);
        const folderName = folderParts[folderParts.length - 1];
        fileName = `${folderName}/${fileName}`;
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
      const fileName = clipboard.name;
      const sourcePath = clipboard.path;
      
      // Get path parts for root calculation
      const pathParts = sourcePath.replace(/\\/g, '/').split('/');
      pathParts.pop(); // Remove filename
      
      // Determine target path (current selected folder or root)
      let targetPath;
      if (selectedFolder) {
        targetPath = `${selectedFolder.replace(/\\/g, '/')}/${fileName}`;
      } else {
        // Paste to root
        targetPath = `${pathParts.join('/')}/${fileName}`;
      }
      
      if (clipboard.operation === 'copy') {
        // Copy file
        const content: any = await window.api.readFile(sourcePath);
        const fileContent = typeof content === 'string' ? content : (content?.content || '');
        
        // Create new file with copied content
        let finalPath = targetPath;
        let counter = 1;
        
        // Check if file exists and add number suffix
        while (files.some(f => f.path === finalPath)) {
          const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
          const nameWithoutExt = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
          finalPath = selectedFolder 
            ? `${selectedFolder.replace(/\\/g, '/')}/${nameWithoutExt}_${counter}${ext}`
            : `${pathParts.join('/')}/${nameWithoutExt}_${counter}${ext}`;
          counter++;
        }
        
        const finalFileName = finalPath.split('/').pop() || fileName;
        const result = await window.api.createFile({
          fileName: finalFileName,
          content: fileContent
        });
        
        if (result.success) {
          const updatedFiles = await window.api.readProjectFiles();
          setFiles(updatedFiles);
          setOutputData(`✅ Copied: ${fileName}\n`);
          setActiveBottomTab('Output');
        }
      } else if (clipboard.operation === 'cut') {
        // Move file using moveFile API
        if ((window.api as any).moveFile) {
          const result = await (window.api as any).moveFile(sourcePath, targetPath);
          
          if (result.success) {
            const updatedFiles = await window.api.readProjectFiles();
            setFiles(updatedFiles);
            
            if (activeEditor.file === sourcePath) {
              setActiveEditor({ ...activeEditor, file: result.newPath || targetPath });
            }
            
            setOutputData(`✅ Moved: ${fileName}\n`);
            setActiveBottomTab('Output');
            setClipboard(null);
          } else {
            setOutputData(`❌ Error moving file: ${result.msg}\n`);
            setActiveBottomTab('Output');
          }
        }
      }
    } catch (error: any) {
      console.error('Error pasting file:', error);
      setOutputData(`❌ Error pasting file: ${error.message}\n`);
      setActiveBottomTab('Output');
    }
  };

  const handleFileDrop = async (draggedFile: any, targetFolder: any | null) => {
    try {
      if (!draggedFile || !(window.api as any).moveFile) return;
      
      // If dropping on a folder, move the file into that folder
      if (targetFolder && targetFolder.isFolder) {
        const fileName = draggedFile.name;
        // Use forward slash for path construction (works on both Windows and Unix)
        const targetPath = targetFolder.path.replace(/\\/g, '/');
        const newPath = `${targetPath}/${fileName}`;
        
        console.log('Moving file:', draggedFile.path, '→', newPath);
        
        // Call moveFile API to move the file
        const result = await (window.api as any).moveFile(draggedFile.path, newPath);
        
        if (result.success) {
          // Reload files
          const updatedFiles = await window.api.readProjectFiles();
          setFiles(updatedFiles);
          
          // Update active editor if moved file is open
          if (activeEditor.file === draggedFile.path) {
            setActiveEditor({ ...activeEditor, file: result.newPath || newPath });
          }
          
          // Expand the target folder to show the moved file
          setExpandedFolders(prev => new Set([...prev, targetFolder.path]));
          
          setOutputData(`✅ Moved: ${draggedFile.name} → ${targetFolder.name}/\n`);
          setActiveBottomTab('Output');
        } else {
          setOutputData(`❌ Error moving file: ${result.msg}\n`);
          setActiveBottomTab('Output');
        }
      } else {
        // Dropping on root - move to project root
        const fileName = draggedFile.name;
        const pathParts = draggedFile.path.replace(/\\/g, '/').split('/');
        pathParts.pop(); // Remove filename
        const projectRoot = pathParts.join('/');
        const newPath = `${projectRoot}/${fileName}`;
        
        if (newPath !== draggedFile.path) {
          const result = await (window.api as any).moveFile(draggedFile.path, newPath);
          
          if (result.success) {
            const updatedFiles = await window.api.readProjectFiles();
            setFiles(updatedFiles);
            
            if (activeEditor.file === draggedFile.path) {
              setActiveEditor({ ...activeEditor, file: result.newPath || newPath });
            }
            
            setOutputData(`✅ Moved: ${draggedFile.name} to root\n`);
            setActiveBottomTab('Output');
          } else {
            setOutputData(`❌ Error moving file: ${result.msg}\n`);
            setActiveBottomTab('Output');
          }
        }
      }
    } catch (error: any) {
      console.error('Error moving file:', error);
      setOutputData(`❌ Error moving file: ${error.message}\n`);
      setActiveBottomTab('Output');
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
    <CustomTitlebar workspaceFolderName={workspaceFolderName} />

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
              <i 
                className="fa-solid fa-grip-vertical" 
                style={{ marginLeft: 'auto', cursor: 'move', opacity: 0.5, marginRight: '8px' }}
                onMouseDown={(e) => {
                  setIsDraggingPanel('explorer');
                  setDragOffset({
                    x: e.clientX - panelPositions.explorer.x,
                    y: e.clientY - panelPositions.explorer.y
                  });
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                title="Drag to move panel"
              ></i>
              <i className="fa-solid fa-ellipsis" style={{ cursor: 'pointer' }}></i>
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
                        className="fa-solid fa-compress" 
                        onClick={() => {
                          setExpandedFolders(new Set());
                          setOutputData('All folders collapsed\n');
                          setActiveBottomTab('Output');
                        }}
                        style={{ cursor: 'pointer', fontSize: '12px', opacity: 0.7 }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                        title="Collapse All"
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
                    workspaceFolderName={workspaceFolderName}
                    workspaceFolderPath={workspaceFolderPath}
                    onCloseWorkspace={() => {
                      setFiles([]);
                      setWorkspaceFolderName('');
                      setWorkspaceFolderPath('');
                      setActiveEditor({ file: null, code: '', cursorLine: 1, cursorCol: 1 });
                      setExpandedFolders(new Set());
                      setOutputData('Workspace closed\n');
                      setActiveBottomTab('Output');
                    }}
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
                    onFileDrop={handleFileDrop}
                  />
                </div>
              )}
              
              {/* OUTLINE SECTION */}
              <div 
                className="sidebar-section-header-only"
                onClick={() => setOutlineExpanded(!outlineExpanded)}
                style={{ cursor: 'pointer' }}
              >
                <i className={`fa-solid fa-chevron-${outlineExpanded ? 'down' : 'right'}`}></i> OUTLINE
              </div>
              {outlineExpanded && (
                <div className="sidebar-section" style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {outlineItems.length === 0 ? (
                    <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
                      No symbols found
                    </div>
                  ) : (
                    <div style={{ padding: '4px 0' }}>
                      {outlineItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="file-item"
                          onClick={() => {
                            // Navigate to line
                            window.dispatchEvent(new CustomEvent('monaco-cmd', { 
                              detail: { action: 'revealLine', value: item.line } 
                            }));
                          }}
                          style={{
                            padding: '4px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '12px'
                          }}
                        >
                          <i className={item.icon} style={{ fontSize: '10px', color: 'var(--accent-primary)', width: '14px' }}></i>
                          <span>{item.name}</span>
                          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '10px' }}>:{item.line}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* TIMELINE SECTION */}
              <div 
                className="sidebar-section-header-only"
                onClick={() => setTimelineExpanded(!timelineExpanded)}
                style={{ cursor: 'pointer' }}
              >
                <i className={`fa-solid fa-chevron-${timelineExpanded ? 'down' : 'right'}`}></i> TIMELINE
              </div>
              {timelineExpanded && (
                <div className="sidebar-section" style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {timelineItems.length === 0 ? (
                    <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
                      No timeline available
                    </div>
                  ) : (
                    <div style={{ padding: '4px 0' }}>
                      {timelineItems.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '8px 12px',
                            borderLeft: '2px solid var(--accent-secondary)',
                            marginLeft: '12px',
                            fontSize: '12px',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <div style={{ fontWeight: 600, marginBottom: '2px' }}>{item.action}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                            {item.date} at {item.time}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                            by {item.user}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
          {/* Sidebar Resize Handle */}
          <div 
            className="resize-handle-vertical"
            onMouseDown={() => setIsResizingSidebar(true)}
            style={{
              width: '4px',
              cursor: 'col-resize',
              background: isResizingSidebar ? 'var(--accent-primary)' : 'transparent',
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
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeEditor.file.split(/[\\/]/).pop()}
              </span>
              <i 
                className="fa-solid fa-xmark close-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveEditor({ file: null, code: '', cursorLine: 1, cursorCol: 1 });
                  setOutputData('Editor closed\n');
                  setActiveBottomTab('Output');
                }}
                title="Close (Ctrl+F4)"
                style={{ 
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px'
                }}
              ></i>
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
                background: isResizingTerminal ? 'var(--accent-primary)' : 'transparent',
                transition: 'background 0.2s',
                borderTop: '1px solid var(--border-color)'
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
                onDragStart={(e) => {
                  setIsDraggingPanel('terminal');
                  setDragOffset({
                    x: e.clientX - panelPositions.terminal.x,
                    y: e.clientY - panelPositions.terminal.y
                  });
                }}
              />
            </div>
          </>
        )}
      </main>

      {/* OPTIONAL ANALYSIS PANEL */}
      {isAnalysisMode && (
        <aside className="analysis-sidebar-fixed" style={{ width: '350px', borderLeft: '1px solid var(--border-color)' }}>
          <AnalysisPanel 
            code={activeEditor.code} 
            language="javascript"
            isVisible={true}
            onDragStart={(e) => {
              setIsDraggingPanel('analysis');
              setDragOffset({
                x: e.clientX - panelPositions.analysis.x,
                y: e.clientY - panelPositions.analysis.y
              });
            }}
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
              zIndex: 999,
              background: 'transparent',
              cursor: 'default'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              borderRadius: '4px',
              padding: '4px 0',
              minWidth: '180px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              zIndex: 1000,
              fontSize: '13px',
              color: 'var(--text-secondary)'
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
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
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
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
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
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
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
                <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }}></div>
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
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
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
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
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
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
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
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
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
            <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }}></div>
            <div
              style={{
                padding: '6px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--error-color)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
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