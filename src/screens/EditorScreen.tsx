import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeEditor from '../components/Editor/CodeEditor';
import AnalysisPanel from '../components/Editor/SidePanel';
import Terminal, { Problem } from '../components/Editor/Terminal'; 
import StatusBar from '../components/Editor/StatusBar';
import ActivityBar from '../components/Editor/ActivityBar';
import { useEditor } from '../context/EditorContext';
import '../styles/TerminalScreen.css';
import CustomTitlebar from '@/components/CustomTitlebar';


// 1. Define Editor State Structure
interface EditorState {
  file: string | null;
  code: string;
  cursorLine: number;
  cursorCol: number;
}

const initialEditorState: EditorState = { file: null, code: "", cursorLine: 1, cursorCol: 1 };

// 🟢 UTILITY: Strip ANSI escape sequences
const stripAnsiCodes = (str: string): string => {
  return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
};

// 🟢 PARSE ERRORS FROM STDERR INTO PROBLEMS
const parseErrors = (stderr: string, fileName: string): Problem[] => {
  if (!stderr) return [];
  
  // Strip ANSI codes from stderr first
  const cleanStderr = stripAnsiCodes(stderr);
  const problems: Problem[] = [];
  const lines = cleanStderr.split('\n');
  
  for (const line of lines) {
    // Python error patterns
    if (line.includes('File "') && line.includes('line ')) {
      const lineMatch = line.match(/line (\d+)/);
      const lineNum = lineMatch ? parseInt(lineMatch[1]) : 1;
      
      // Look for the actual error message in subsequent lines
      const errorIndex = lines.indexOf(line);
      let message = 'Syntax Error';
      
      if (errorIndex < lines.length - 1) {
        const nextLine = lines[errorIndex + 1];
        if (nextLine && nextLine.trim()) {
          message = nextLine.trim();
        }
      }
      
      problems.push({
        message,
        line: lineNum,
        source: fileName,
        type: 'error'
      });
    }
    
    // JavaScript error patterns
    else if (line.includes('SyntaxError') || line.includes('ReferenceError') || line.includes('TypeError')) {
      const lineMatch = line.match(/:(\d+):/);
      const lineNum = lineMatch ? parseInt(lineMatch[1]) : 1;
      
      problems.push({
        message: line.trim(),
        line: lineNum,
        source: fileName,
        type: 'error'
      });
    }
    
    // Generic error patterns
    else if (line.includes('Error:') || line.includes('Exception:')) {
      problems.push({
        message: line.trim(),
        line: 1,
        source: fileName,
        type: 'error'
      });
    }
  }
  
  return problems;
};

const EditorScreen: React.FC = () => {
  const navigate = useNavigate();
  const editorContext = useEditor();

  // --- UI STATES ---
  const [activeSidebar, setActiveSidebar] = useState('Explorer');
  const [activeBottomTab, setActiveBottomTab] = useState('Terminal');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  
  // --- SPLIT VIEW STATES ---
  const [isSplitView, setIsSplitView] = useState(false);
  const [activePane, setActivePane] = useState<'left' | 'right'>('left');
  const [leftEditor, setLeftEditor] = useState<EditorState>(initialEditorState);
  const [rightEditor, setRightEditor] = useState<EditorState>(initialEditorState);

  // --- DATA STATES ---
  const [files, setFiles] = useState<any[]>([]);
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [isRunning, setIsRunning] = useState(false);
 const [problems, setProblems] = useState<Problem[]>([]);

  // --- EDITOR REFS FOR CLIPBOARD OPERATIONS ---
  const leftEditorRef = useRef<any>(null);
  const rightEditorRef = useRef<any>(null);

  // --- SIDEBAR FEATURES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // --- GIT/GITHUB STATES ---
  const [gitBranch, setGitBranch] = useState('main');
  const [gitChanges, setGitChanges] = useState<Array<{ status: string; file: string }>>([]);
  const [gitCommitMessage, setGitCommitMessage] = useState('');
  const [gitBranches, setGitBranches] = useState<Array<{ name: string; current: boolean }>>([]);
  const [gitCommits, setGitCommits] = useState<Array<{ hash: string; message: string }>>([]);
  const [showGitClone, setShowGitClone] = useState(false);
  const [gitCloneUrl, setGitCloneUrl] = useState('');
  const [showBranchCreate, setShowBranchCreate] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [gitLoading, setGitLoading] = useState(false);
  
  // --- CONTEXT MENU & CLIPBOARD ---
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: any } | null>(null);
  const [clipboard, setClipboard] = useState<{ file: any; action: 'cut' | 'copy' } | null>(null);
  const [renameFile, setRenameFile] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [autoSave, setAutoSave] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);
  
  // Toast notification for keyboard shortcuts
  const showShortcutToast = (message: string) => {
    setShortcutToast(message);
    setTimeout(() => setShortcutToast(null), 2000);
  };
  
  // Auto-save effect
  useEffect(() => {
    if (!autoSave) return;
    
    const autoSaveInterval = setInterval(async () => {
      const currentEditor = activePane === 'left' ? leftEditor : rightEditor;
      if (currentEditor.file && currentEditor.code) {
        try {
          setIsAutoSaving(true);
          
          await window.api.saveFile({ 
            filePath: currentEditor.file, 
            content: currentEditor.code 
          });
          
          // Also save to database if user is logged in
          const userInfo = localStorage.getItem('user_info');
          if (userInfo) {
            const user = JSON.parse(userInfo);
            await window.api.saveCodeToDatabase({ 
              filePath: currentEditor.file, 
              content: currentEditor.code,
              userId: user._id || user.id
            });
          }
          
          console.log('Auto-saved:', currentEditor.file);
        } catch (error: any) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsAutoSaving(false);
        }
      }
    }, 30000); // Auto-save every 30 seconds
    
    return () => clearInterval(autoSaveInterval);
  }, [autoSave, leftEditor, rightEditor, activePane]);
  // --- RESIZING STATES ---
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [analysisWidth, setAnalysisWidth] = useState(400);
  const [isDragging, setIsDragging] = useState<'sidebar' | 'terminal' | 'analysis' | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadProject(); }, []);

  // --- MOUSE MOVE FOR RESIZING ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      if (isDragging === 'sidebar') setSidebarWidth(Math.max(150, Math.min(400, e.clientX - 50)));
      else if (isDragging === 'terminal') setTerminalHeight(Math.max(100, Math.min(600, window.innerHeight - e.clientY)));
      else if (isDragging === 'analysis') setAnalysisWidth(Math.max(300, Math.min(800, window.innerWidth - e.clientX)));
    };
    const handleMouseUp = () => setIsDragging(null);
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const loadProject = async () => {
    try {
      const projectFiles = await window.api.readProjectFiles();
      setFiles(projectFiles);
    } catch (e) { console.error("Load error", e); }
  };

  // --- FILE HANDLING ---
  const handleFileSelect = async (file: any) => {
    const content = await window.api.readFile(file.path);
    const newState = { file: file.path, code: content, cursorLine: 1, cursorCol: 1 };
    
    if (activePane === 'left') setLeftEditor(prev => ({ ...prev, ...newState }));
    else setRightEditor(prev => ({ ...prev, ...newState }));
  };

  // 🟢 UPDATED: RUN HANDLER
  const handleRun = async () => {
    const current = activePane === 'left' ? leftEditor : rightEditor;
    if (!current.file) return;
    
    setStdout(''); 
    setStderr(''); 
    setProblems([]); // Clear old problems
    setActiveBottomTab('Output'); 
    setIsTerminalOpen(true);
    setIsRunning(true);

    try {
      // Auto-save
      await window.api.saveFile({ filePath: current.file, content: current.code });
      
      const res = await window.api.runCode({ filePath: current.file, code: current.code });
      
      // Clean output - remove error formatting and show only actual program output
      let cleanOutput = '';
      if (res.stdout) {
        // Strip any remaining ANSI codes that might have gotten through
        cleanOutput = stripAnsiCodes(res.stdout).trim();
      }
      
      setStdout(cleanOutput);
      
      if (res.stderr) {
        const cleanStderr = stripAnsiCodes(res.stderr);
        setStderr(cleanStderr);
        
        // 🟢 Generate Problems from Stderr
        const detectedProblems = parseErrors(cleanStderr, current.file.split(/[\\/]/).pop() || 'file');
        setProblems(detectedProblems);

        if (detectedProblems.length > 0) {
           setActiveBottomTab('Problems'); // Auto-switch to Problems if we parsed any
        } else if (!cleanOutput) {
           setActiveBottomTab('Debug'); // Otherwise go to Debug if no output
        }
      } else if (!cleanOutput) {
        // No output and no errors - show a completion message
        setStdout('Program executed successfully with no output.');
      }
    } catch (err: any) {
      setStderr("System Error: " + err.message);
      setProblems([{
        message: "System Error: " + err.message,
        line: 1,
        source: current.file?.split(/[\\/]/).pop() || 'file',
        type: 'error'
      }]);
      setActiveBottomTab('Problems');
    } finally {
      setIsRunning(false);
    }
  };

  // --- MENU ACTIONS ---
  // Inside src/screens/EditorScreen.tsx

 const handleMenuAction = async (action: string) => {
    console.log('Menu action triggered:', action); // Debug log
    
    // Helper: Identify which editor is currently focused
    const currentEditor = activePane === 'left' ? leftEditor : rightEditor;
    const setCurrentEditor = activePane === 'left' ? setLeftEditor : setRightEditor;

    switch(action) {
      
      // 1. New Text File (In-memory only)
      case 'newTextFile':
        const untitledState = { file: null, code: '', cursorLine: 1, cursorCol: 1 };
        setCurrentEditor(untitledState);
        break;

      // 2. New File... (Triggers Sidebar Input)
      case 'newFile':
        setIsCreatingFile(true); // Focuses sidebar input
        break;

      // 3. New Window
      case 'newWindow':
        await window.api.newWindow();
        break;

      // 4. Open File...
      case 'openFile':
        const fileRes = await window.api.openFileDialog();
        if (fileRes && !fileRes.canceled) {
           setCurrentEditor({ 
             file: fileRes.filePath, 
             code: fileRes.content, 
             cursorLine: 1, cursorCol: 1 
           });
           // Add to sidebar if not already there
           if (!files.find(f => f.path === fileRes.filePath)) {
             setFiles(prev => [...prev, { name: fileRes.fileName, path: fileRes.filePath }]);
           }
        }
        break;

      // 5. Open Folder...
      case 'openFolder':
        const folderRes = await window.api.openFolderDialog();
        if (folderRes && !folderRes.canceled) {
           setFiles(folderRes.files); // Populate sidebar with new folder files
           setLeftEditor(initialEditorState); // Reset editors
           setRightEditor(initialEditorState);
        }
        break;

      // 6. Open Recent (Mock Implementation - usually requires LocalStore)
      case 'openRecent':
        // For now, just reload the default project directory
        loadProject();
        break;

      // 7. Save (Enhanced with database saving)
      case 'save':
        try {
          if (currentEditor.file) {
             // Save to file system
             await window.api.saveFile({ filePath: currentEditor.file, content: currentEditor.code });
             console.log('File saved to filesystem');
             
             // Save to database
             const userInfo = localStorage.getItem('user_info');
             if (userInfo) {
               const user = JSON.parse(userInfo);
               const dbResult = await window.api.saveCodeToDatabase({ 
                 filePath: currentEditor.file, 
                 content: currentEditor.code,
                 userId: user._id || user.id
               });
               if (dbResult.success) {
                 console.log('File saved to database');
               } else {
                 console.warn('Database save failed:', dbResult.msg);
               }
             }
          } else {
             // If it's untitled, redirect to "Save As"
             handleMenuAction('saveAs');
          }
        } catch (error: any) {
          console.error('Save failed:', error);
          alert('Save failed: ' + error.message);
        }
        break;

      // 8. Save As... (Enhanced with database saving)
      case 'saveAs':
        try {
          const saveRes = await window.api.saveFileAs(currentEditor.code);
          if (saveRes && !saveRes.canceled) {
             setCurrentEditor(prev => ({ ...prev, file: saveRes.filePath }));
             console.log('File saved as:', saveRes.filePath);
             
             // Update sidebar
             if (!files.find(f => f.path === saveRes.filePath)) {
               setFiles(prev => [...prev, { name: saveRes.fileName, path: saveRes.filePath }]);
             }
             
             // Save to database
             const userInfo = localStorage.getItem('user_info');
             if (userInfo) {
               const user = JSON.parse(userInfo);
               const dbResult = await window.api.saveCodeToDatabase({ 
                 filePath: saveRes.filePath, 
                 content: currentEditor.code,
                 userId: user._id || user.id
               });
               if (dbResult.success) {
                 console.log('File saved to database');
               } else {
                 console.warn('Database save failed:', dbResult.msg);
               }
             }
          }
        } catch (error: any) {
          console.error('Save As failed:', error);
          alert('Save As failed: ' + error.message);
        }
        break;

      // 9. Save All (Enhanced with database saving)
      case 'saveAll':
        try {
          const userInfo = localStorage.getItem('user_info');
          const user = userInfo ? JSON.parse(userInfo) : null;
          const userId = user?._id || user?.id;
          
          let savedCount = 0;
          
          if (leftEditor.file) {
            await window.api.saveFile({ filePath: leftEditor.file, content: leftEditor.code });
            savedCount++;
            if (userId) {
              const dbResult = await window.api.saveCodeToDatabase({ 
                filePath: leftEditor.file, 
                content: leftEditor.code, 
                userId 
              });
              if (dbResult.success) {
                console.log('Left editor saved to database');
              }
            }
          }
          
          if (rightEditor.file) {
            await window.api.saveFile({ filePath: rightEditor.file, content: rightEditor.code });
            savedCount++;
            if (userId) {
              const dbResult = await window.api.saveCodeToDatabase({ 
                filePath: rightEditor.file, 
                content: rightEditor.code, 
                userId 
              });
              if (dbResult.success) {
                console.log('Right editor saved to database');
              }
            }
          }
          
          if (savedCount > 0) {
            console.log(`Saved ${savedCount} file(s)`);
          } else {
            console.log('No files to save');
          }
        } catch (error: any) {
          console.error('Save All failed:', error);
          alert('Save All failed: ' + error.message);
        }
        break;

      // 10. Close Editor (Clear active pane)
      case 'closeFile':
        console.log('Closing editor');
        setCurrentEditor(initialEditorState);
        break;

      // 11. Close Folder (Clear sidebar)
      case 'closeFolder':
        console.log('Closing folder');
        setFiles([]);
        setLeftEditor(initialEditorState);
        setRightEditor(initialEditorState);
        break;

      // 12. Close Window / Exit
      case 'exit':
        console.log('Closing window');
        if (window.api && window.api.closeWindow) {
          window.api.closeWindow();
        } else {
          console.error('closeWindow API not available');
        }
        break;

      // 13. Toggle Auto Save
      case 'toggleAutoSave':
        setAutoSave(!autoSave);
        break;

      // 14. Add Folder to Workspace
      case 'addFolderToWorkspace':
        const addFolderRes = await window.api.openFolderDialog();
        if (addFolderRes && !addFolderRes.canceled) {
          // Add files to existing workspace instead of replacing
          const newFiles = addFolderRes.files.filter(newFile => 
            !files.find(existingFile => existingFile.path === newFile.path)
          );
          setFiles(prev => [...prev, ...newFiles]);
        }
        break;

      // 15. Save Workspace As
      case 'saveWorkspaceAs':
        // Create a workspace file with current project structure
        const workspaceData = {
          name: 'LumoFlow Workspace',
          folders: files.map(f => ({ path: f.path, name: f.name })),
          settings: { autoSave }
        };
        const workspaceRes = await window.api.saveFileAs(JSON.stringify(workspaceData, null, 2));
        if (workspaceRes && !workspaceRes.canceled) {
          console.log('Workspace saved to:', workspaceRes.filePath);
        }
        break;

      // 16. Share
      case 'share':
        if (currentEditor.file && currentEditor.code) {
          // Copy current file content to clipboard for sharing
          try {
            await navigator.clipboard.writeText(currentEditor.code);
            alert('Code copied to clipboard for sharing!');
          } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            alert('Failed to copy code to clipboard');
          }
        } else {
          alert('No file open to share');
        }
        break;

      // 15. Edit Actions
      case 'undo':
        const undoEditor = activePane === 'left' ? leftEditorRef.current : rightEditorRef.current;
        if (undoEditor) {
          undoEditor.trigger('keyboard', 'undo', null);
        }
        break;

      case 'redo':
        const redoEditor = activePane === 'left' ? leftEditorRef.current : rightEditorRef.current;
        if (redoEditor) {
          redoEditor.trigger('keyboard', 'redo', null);
        }
        break;

      case 'cut':
        const cutEditor = activePane === 'left' ? leftEditorRef.current : rightEditorRef.current;
        if (cutEditor) {
          cutEditor.focus();
          cutEditor.trigger('keyboard', 'editor.action.clipboardCutAction', null);
        }
        break;

      case 'copy':
        const copyEditor = activePane === 'left' ? leftEditorRef.current : rightEditorRef.current;
        if (copyEditor) {
          copyEditor.focus();
          copyEditor.trigger('keyboard', 'editor.action.clipboardCopyAction', null);
        }
        break;

      case 'paste':
        const pasteEditor = activePane === 'left' ? leftEditorRef.current : rightEditorRef.current;
        if (pasteEditor) {
          pasteEditor.focus();
          pasteEditor.trigger('keyboard', 'editor.action.clipboardPasteAction', null);
        }
        break;
        
      // Existing UI Toggles
      case 'splitEditor': 
        console.log('Toggling split editor');
        setIsSplitView(!isSplitView); 
        setActivePane('right'); 
        break;
        
      case 'toggleTerminal': 
        console.log('Toggling terminal');
        setIsTerminalOpen(!isTerminalOpen); 
        break;

      // Default case for unhandled actions
      default:
        console.warn('Unhandled menu action:', action);
        break;
    }
  };
  // --- FILE OPERATIONS (Context Menu) ---
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    try {
      const res = await window.api.createFile({ fileName: newFileName, content: '' });
      if (res.success) { await loadProject(); handleFileSelect({ name: newFileName, path: res.path }); }
    } catch(e) {} finally { setIsCreatingFile(false); setNewFileName(''); }
  };

  const handleCreateFolder = async (folderName?: string) => {
    let name = folderName;
    if (!name) {
      const promptResult = prompt('Enter folder name:');
      if (!promptResult) return;
      name = promptResult;
    }
    if (!name?.trim()) return;
    try { 
      const res = await window.api.createFolder(name);
      if (res && res.success) {
        await loadProject();
        showShortcutToast(`Folder "${name}" created`);
      } else {
        console.error('Folder creation failed:', res?.msg || 'Unknown error');
        alert('Failed to create folder');
      }
    } catch(e) {
      console.error('Folder creation error:', e);
      alert('Error creating folder');
    }
  };

  const handleDeleteFile = async (file: any) => {
    if (window.confirm(`Delete ${file.name}?`)) {
      try { await window.api.deleteFile(file.path); await loadProject(); } catch(e){}
    }
    setContextMenu(null);
  };

  const confirmRename = async () => {
    if (!renameFile || !newName.trim()) return;
    try { await window.api.renameFile(renameFile, newName); await loadProject(); } catch(e){}
    setRenameFile(null); setNewName('');
  };

  const handlePasteFile = async () => {
    if (!clipboard) return;
    try {
      const content = await window.api.readFile(clipboard.file.path);
      const name = clipboard.action === 'cut' ? clipboard.file.name : `copy_${clipboard.file.name}`;
      await window.api.createFile({ fileName: name, content });
      if (clipboard.action === 'cut') await window.api.deleteFile(clipboard.file.path);
      await loadProject();
      setClipboard(null);
    } catch(e){}
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { 
      setSearchResults([]); 
      return; 
    }
    const results = files.filter(f => 
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.path.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };
  
  // --- GIT OPERATIONS ---
  const refreshGitStatus = async () => {
    try {
      const [statusRes, branchRes, branchesRes, logRes] = await Promise.all([
        window.api.gitStatus(),
        window.api.gitBranch(),
        window.api.gitBranches(),
        window.api.gitLog({ limit: 5 })
      ]);
      
      if (statusRes.success && statusRes.changes) {
        setGitChanges(statusRes.changes);
      }
      
      if (branchRes.success && branchRes.branch) {
        setGitBranch(branchRes.branch);
      }
      
      if (branchesRes.success && branchesRes.branches) {
        setGitBranches(branchesRes.branches);
      }
      
      if (logRes.success && logRes.commits) {
        setGitCommits(logRes.commits);
      }
    } catch (error) {
      console.error('Git status refresh error:', error);
    }
  };
  
  useEffect(() => {
    if (activeSidebar === 'Github') {
      refreshGitStatus();
    }
  }, [activeSidebar]);
  
  const handleGitInit = async () => {
    setGitLoading(true);
    const res = await window.api.gitInit();
    if (res.success) {
      showShortcutToast('Git repository initialized');
      refreshGitStatus();
    } else {
      showShortcutToast('Error: ' + res.error);
    }
    setGitLoading(false);
  };
  
  const handleGitClone = async () => {
    if (!gitCloneUrl.trim()) return;
    setGitLoading(true);
    const res = await window.api.gitClone({ url: gitCloneUrl });
    if (res.success) {
      showShortcutToast('Repository cloned successfully');
      setShowGitClone(false);
      setGitCloneUrl('');
      await loadProject();
      refreshGitStatus();
    } else {
      showShortcutToast('Clone error: ' + res.error);
    }
    setGitLoading(false);
  };
  
  const handleGitStage = async (file: string) => {
    setGitLoading(true);
    const res = await window.api.gitAdd({ files: [file] });
    if (res.success) {
      showShortcutToast('File staged');
      refreshGitStatus();
    } else {
      showShortcutToast('Error: ' + res.error);
    }
    setGitLoading(false);
  };
  
  const handleGitStageAll = async () => {
    setGitLoading(true);
    const res = await window.api.gitAdd({ files: ['.'] });
    if (res.success) {
      showShortcutToast('All changes staged');
      refreshGitStatus();
    } else {
      showShortcutToast('Error: ' + res.error);
    }
    setGitLoading(false);
  };
  
  const handleGitCommit = async () => {
    if (!gitCommitMessage.trim()) {
      showShortcutToast('Please enter a commit message');
      return;
    }
    setGitLoading(true);
    const res = await window.api.gitCommit({ message: gitCommitMessage });
    if (res.success) {
      showShortcutToast('Changes committed');
      setGitCommitMessage('');
      refreshGitStatus();
    } else {
      showShortcutToast('Commit error: ' + res.error);
    }
    setGitLoading(false);
  };
  
  const handleGitPush = async () => {
    setGitLoading(true);
    const res = await window.api.gitPush({ branch: gitBranch });
    if (res.success) {
      showShortcutToast('Changes pushed to remote');
      refreshGitStatus();
    } else {
      showShortcutToast('Push error: ' + res.error);
    }
    setGitLoading(false);
  };
  
  const handleGitPull = async () => {
    setGitLoading(true);
    const res = await window.api.gitPull({ branch: gitBranch });
    if (res.success) {
      showShortcutToast('Changes pulled from remote');
      await loadProject();
      refreshGitStatus();
    } else {
      showShortcutToast('Pull error: ' + res.error);
    }
    setGitLoading(false);
  };
  
  const handleGitCheckout = async (branch: string) => {
    setGitLoading(true);
    const res = await window.api.gitCheckout({ branch });
    if (res.success) {
      showShortcutToast(`Switched to ${branch}`);
      setGitBranch(branch);
      await loadProject();
      refreshGitStatus();
    } else {
      showShortcutToast('Checkout error: ' + res.error);
    }
    setGitLoading(false);
  };
  
  const handleGitCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    setGitLoading(true);
    const res = await window.api.gitCreateBranch({ branch: newBranchName });
    if (res.success) {
      showShortcutToast(`Created branch ${newBranchName}`);
      setShowBranchCreate(false);
      setNewBranchName('');
      refreshGitStatus();
    } else {
      showShortcutToast('Error: ' + res.error);
    }
    setGitLoading(false);
  };
  
   useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl (Windows/Linux) or Cmd (Mac)
      const isCtrl = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;

      if (isCtrl) {
        switch(e.key.toLowerCase()) {
          // Save operations
          case 's':
            e.preventDefault();
            if (e.shiftKey) {
              handleMenuAction('saveAs');
              showShortcutToast('Save As... (Ctrl+Shift+S)');
            } else {
              handleMenuAction('save');
              showShortcutToast('Save (Ctrl+S)');
            }
            break;
          
          // New operations
          case 'n':
            e.preventDefault();
            if (e.shiftKey) {
              handleMenuAction('newWindow');
              showShortcutToast('New Window (Ctrl+Shift+N)');
            } else {
              handleMenuAction('newTextFile');
              showShortcutToast('New Text File (Ctrl+N)');
            }
            break;
            
          // Open operations
          case 'o':
            e.preventDefault();
            if (e.shiftKey) {
              handleMenuAction('openFolder');
              showShortcutToast('Open Folder (Ctrl+Shift+O)');
            } else {
              handleMenuAction('openFile');
              showShortcutToast('Open File (Ctrl+O)');
            }
            break;

          // Ctrl+K combinations (need to handle specially)
          case 'k':
            e.preventDefault();
            // Set a flag to wait for the next key
            const handleNextKey = (nextEvent: KeyboardEvent) => {
              if (nextEvent.ctrlKey || nextEvent.metaKey) {
                switch(nextEvent.key.toLowerCase()) {
                  case 's':
                    nextEvent.preventDefault();
                    handleMenuAction('saveAll'); // Ctrl+K S
                    break;
                  case 'f':
                    nextEvent.preventDefault();
                    handleMenuAction('closeFolder'); // Ctrl+K F
                    break;
                  case 'o':
                    nextEvent.preventDefault();
                    handleMenuAction('openFolder'); // Ctrl+K Ctrl+O
                    break;
                }
              }
              window.removeEventListener('keydown', handleNextKey);
            };
            window.addEventListener('keydown', handleNextKey);
            // Remove listener after 2 seconds if no second key is pressed
            setTimeout(() => {
              window.removeEventListener('keydown', handleNextKey);
            }, 2000);
            break;

          // Edit operations
          case 'z':
            e.preventDefault();
            if (e.shiftKey) handleMenuAction('redo'); // Ctrl+Shift+Z (alternative to Ctrl+Y)
            else handleMenuAction('undo');           // Ctrl+Z
            break;

          case 'y':
            e.preventDefault();
            handleMenuAction('redo'); // Ctrl+Y
            break;

          case 'x':
            e.preventDefault();
            handleMenuAction('cut'); // Ctrl+X
            break;

          case 'c':
            e.preventDefault();
            handleMenuAction('copy'); // Ctrl+C
            break;

          case 'v':
            e.preventDefault();
            handleMenuAction('paste'); // Ctrl+V
            break;

          // View operations
          case '\\': // Split Editor
            e.preventDefault();
            handleMenuAction('splitEditor');
            break;
            
          case '`': // Toggle Terminal
            e.preventDefault();
            handleMenuAction('toggleTerminal');
            break;
        }
      }

      // Alt key combinations
      if (isAlt) {
        switch(e.key) {
          case 'F4': // Alt+F4 - Close Window
            e.preventDefault();
            handleMenuAction('exit');
            break;
        }
      }

      // Function key combinations
      if (isCtrl) {
        switch(e.key) {
          case 'F4': // Ctrl+F4 - Close Editor
            e.preventDefault();
            handleMenuAction('closeFile');
            break;
        }
      }

      // Special combinations with multiple modifiers
      if (isCtrl && e.altKey && e.key === 'n') { // Ctrl+Alt+Win+N (simplified to Ctrl+Alt+N)
        e.preventDefault();
        handleMenuAction('newFile');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [leftEditor, rightEditor, activePane]); // Dependencies ensure current state is used

  // --- RENDER SIDEBAR CONTENT ---
  const renderSidebar = () => {
    if (activeSidebar === 'Github') {
      return (
        <div className="github-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>SOURCE CONTROL</span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button 
                className="add-file-btn" 
                onClick={refreshGitStatus} 
                title="Refresh"
                disabled={gitLoading}
              >
                <i className={`fa-solid fa-rotate ${gitLoading ? 'fa-spin' : ''}`}></i>
              </button>
              <button 
                className="add-file-btn" 
                onClick={() => setShowGitClone(true)} 
                title="Clone Repository"
              >
                <i className="fa-solid fa-download"></i>
              </button>
            </div>
          </div>
          
          <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
            {/* Current Branch */}
            <div className="git-section" style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px',
                background: '#2d2d30',
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-code-branch" style={{ color: '#00f2ff' }}></i>
                  <span style={{ color: '#fff', fontSize: '13px' }}>{gitBranch}</span>
                </div>
                <button 
                  className="add-file-btn" 
                  onClick={() => setShowBranchCreate(true)}
                  title="Create Branch"
                  style={{ padding: '2px 6px' }}
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
              
              {/* Branch List */}
              {gitBranches.length > 0 && (
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '5px' }}>
                  {gitBranches.slice(0, 5).map((branch, idx) => (
                    <div 
                      key={idx}
                      onClick={() => !branch.current && handleGitCheckout(branch.name)}
                      style={{ 
                        padding: '4px 8px',
                        cursor: branch.current ? 'default' : 'pointer',
                        background: branch.current ? '#1e1e1e' : 'transparent',
                        borderRadius: '3px',
                        marginBottom: '2px'
                      }}
                    >
                      {branch.current && '* '}{branch.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Changes Section */}
            <div className="git-section" style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>
                  Changes ({gitChanges.length})
                </span>
                {gitChanges.length > 0 && (
                  <button 
                    className="add-file-btn" 
                    onClick={handleGitStageAll}
                    title="Stage All Changes"
                    style={{ padding: '2px 6px', fontSize: '10px' }}
                  >
                    <i className="fa-solid fa-plus"></i> All
                  </button>
                )}
              </div>
              
              {gitChanges.length === 0 ? (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#666',
                  fontSize: '12px'
                }}>
                  <i className="fa-solid fa-check-circle" style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}></i>
                  No changes
                </div>
              ) : (
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {gitChanges.map((change, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '4px 8px',
                        background: '#1e1e1e',
                        borderRadius: '3px',
                        marginBottom: '4px',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span style={{ 
                          color: change.status.includes('M') ? '#ffa500' : 
                                 change.status.includes('A') ? '#00ff00' : 
                                 change.status.includes('D') ? '#ff0000' : '#fff',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          {change.status}
                        </span>
                        <span style={{ color: '#ccc', fontSize: '11px' }}>{change.file}</span>
                      </div>
                      <button 
                        className="add-file-btn" 
                        onClick={() => handleGitStage(change.file)}
                        title="Stage File"
                        style={{ padding: '2px 4px', fontSize: '9px' }}
                      >
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Commit Section */}
            <div className="git-section" style={{ marginBottom: '15px' }}>
              <textarea
                placeholder="Commit message..."
                value={gitCommitMessage}
                onChange={(e) => setGitCommitMessage(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '60px',
                  background: '#1e1e1e',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: '#fff',
                  padding: '8px',
                  fontSize: '12px',
                  resize: 'vertical',
                  marginBottom: '8px'
                }}
              />
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={handleGitCommit}
                  disabled={!gitCommitMessage.trim() || gitLoading}
                  style={{
                    flex: 1,
                    background: '#238636',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    color: 'white',
                    fontSize: '11px',
                    cursor: gitCommitMessage.trim() ? 'pointer' : 'not-allowed',
                    opacity: gitCommitMessage.trim() ? 1 : 0.5
                  }}
                >
                  <i className="fa-solid fa-check"></i> Commit
                </button>
              </div>
            </div>

            {/* Sync Section */}
            <div className="git-section" style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={handleGitPull}
                  disabled={gitLoading}
                  style={{
                    flex: 1,
                    background: '#0969da',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    color: 'white',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-download"></i> Pull
                </button>
                <button
                  onClick={handleGitPush}
                  disabled={gitLoading}
                  style={{
                    flex: 1,
                    background: '#bc13fe',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    color: 'white',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-upload"></i> Push
                </button>
              </div>
            </div>

            {/* Recent Commits */}
            {gitCommits.length > 0 && (
              <div className="git-section">
                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Recent Commits
                </div>
                {gitCommits.map((commit, idx) => (
                  <div 
                    key={idx}
                    style={{ 
                      padding: '6px 8px',
                      background: '#1e1e1e',
                      borderRadius: '3px',
                      marginBottom: '4px',
                      fontSize: '11px'
                    }}
                  >
                    <div style={{ color: '#00f2ff', marginBottom: '2px' }}>{commit.hash}</div>
                    <div style={{ color: '#ccc' }}>{commit.message}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Initialize Git Button */}
            {gitChanges.length === 0 && gitCommits.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  onClick={handleGitInit}
                  disabled={gitLoading}
                  style={{
                    background: '#238636',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    color: 'white',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-code-branch"></i> Initialize Repository
                </button>
              </div>
            )}
          </div>

          {/* Clone Modal */}
          {showGitClone && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: '#2d2d30',
                padding: '20px',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '400px'
              }}>
                <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '14px' }}>Clone Repository</h3>
                <input
                  type="text"
                  placeholder="https://github.com/user/repo.git"
                  value={gitCloneUrl}
                  onChange={(e) => setGitCloneUrl(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#1e1e1e',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '8px',
                    fontSize: '12px',
                    marginBottom: '15px'
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setShowGitClone(false); setGitCloneUrl(''); }}
                    style={{
                      background: '#555',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      color: 'white',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGitClone}
                    disabled={!gitCloneUrl.trim() || gitLoading}
                    style={{
                      background: '#238636',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      color: 'white',
                      fontSize: '11px',
                      cursor: gitCloneUrl.trim() ? 'pointer' : 'not-allowed',
                      opacity: gitCloneUrl.trim() ? 1 : 0.5
                    }}
                  >
                    Clone
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Branch Modal */}
          {showBranchCreate && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: '#2d2d30',
                padding: '20px',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '400px'
              }}>
                <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '14px' }}>Create Branch</h3>
                <input
                  type="text"
                  placeholder="feature/new-feature"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#1e1e1e',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '8px',
                    fontSize: '12px',
                    marginBottom: '15px'
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setShowBranchCreate(false); setNewBranchName(''); }}
                    style={{
                      background: '#555',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      color: 'white',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGitCreateBranch}
                    disabled={!newBranchName.trim() || gitLoading}
                    style={{
                      background: '#238636',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      color: 'white',
                      fontSize: '11px',
                      cursor: newBranchName.trim() ? 'pointer' : 'not-allowed',
                      opacity: newBranchName.trim() ? 1 : 0.5
                    }}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    if (activeSidebar === 'Search') {
      return (
        <div className="search-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="sidebar-header">SEARCH</div>
          <input 
            className="search-input" 
            placeholder="Search files..." 
            value={searchQuery} 
            onChange={(e) => handleSearch(e.target.value)} 
            autoFocus
            style={{
              padding: '8px 12px',
              margin: '10px',
              background: '#1e1e1e',
              border: '1px solid #333',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '13px'
            }}
          />
          <div className="search-results" style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
             {searchResults.length === 0 && searchQuery && (
               <div style={{ color: '#666', fontSize: '12px', padding: '20px', textAlign: 'center' }}>
                 No files found
               </div>
             )}
             {searchResults.map(f => (
               <div 
                 key={f.path} 
                 className="search-result-item" 
                 onClick={() => handleFileSelect(f)}
                 style={{
                   padding: '8px 12px',
                   background: '#1e1e1e',
                   borderRadius: '4px',
                   marginBottom: '4px',
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '8px',
                   color: '#ccc',
                   fontSize: '12px',
                   transition: 'background 0.2s'
                 }}
                 onMouseEnter={(e) => e.currentTarget.style.background = '#2d2d30'}
                 onMouseLeave={(e) => e.currentTarget.style.background = '#1e1e1e'}
               >
                 <i className="fa-regular fa-file-code"></i> {f.name}
               </div>
             ))}
          </div>
        </div>
      );
    }
    // Default Explorer
    return (
      <div className="file-list">
        <div className="sidebar-header sidebar-actions">
          <span>EXPLORER</span>
          <div className="sidebar-buttons">
             <button 
               className="add-file-btn" 
               onClick={() => {
                 console.log('New file button clicked');
                 setIsCreatingFile(true);
               }}
               title="New File"
               style={{
                 padding: '4px 8px',
                 background: 'transparent',
                 border: '1px solid #333',
                 borderRadius: '3px',
                 color: '#888',
                 cursor: 'pointer',
                 fontSize: '11px',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '4px'
               }}
             >
               <i className="fa-solid fa-file-plus"></i>
               <span>New</span>
             </button>
             <button 
               className="add-folder-btn" 
               onClick={() => {
                 console.log('New folder button clicked');
                 handleCreateFolder();
               }}
               title="New Folder"
               style={{
                 padding: '4px 8px',
                 background: 'transparent',
                 border: '1px solid #333',
                 borderRadius: '3px',
                 color: '#888',
                 cursor: 'pointer',
                 fontSize: '11px',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '4px'
               }}
             >
               <i className="fa-solid fa-folder-plus"></i>
               <span>Folder</span>
             </button>
             {clipboard && (
               <button 
                 className="paste-btn" 
                 onClick={handlePasteFile}
                 title="Paste"
                 style={{
                   padding: '4px 8px',
                   background: 'transparent',
                   border: '1px solid #333',
                   borderRadius: '3px',
                   color: '#888',
                   cursor: 'pointer',
                   fontSize: '11px'
                 }}
               >
                 <i className="fa-solid fa-paste"></i>
               </button>
             )}
          </div>
        </div>
        
        {isCreatingFile && (
          <form onSubmit={handleCreateFile} className="new-file-form">
            <input 
              autoFocus 
              type="text" 
              className="new-file-input" 
              value={newFileName} 
              onChange={(e)=>setNewFileName(e.target.value)} 
              onBlur={()=>setIsCreatingFile(false)}
              placeholder="filename.py"
              style={{
                width: '100%',
                padding: '6px 8px',
                margin: '8px 0',
                background: '#2d2d30',
                border: '1px solid #00f2ff',
                borderRadius: '3px',
                color: '#fff',
                fontSize: '12px'
              }}
            />
          </form>
        )}

        {files.length === 0 && !isCreatingFile && (
          <div style={{
            padding: '20px 8px',
            textAlign: 'center',
            color: '#666',
            fontSize: '12px'
          }}>
            <i className="fa-solid fa-folder-open" style={{ display: 'block', marginBottom: '8px', fontSize: '24px' }}></i>
            No files in workspace
          </div>
        )}

        {files.map(file => (
          <div key={file.path}>
            {renameFile === file.path ? (
              <form onSubmit={(e) => { e.preventDefault(); confirmRename(); }} className="rename-form">
                <input 
                  autoFocus 
                  className="rename-input" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  onBlur={confirmRename}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: '#2d2d30',
                    border: '1px solid #00f2ff',
                    borderRadius: '3px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </form>
            ) : (
              <div 
                className={`file-item ${(leftEditor.file === file.path || rightEditor.file === file.path) ? 'active' : ''}`}
                onClick={() => handleFileSelect(file)}
                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, file }); }}
                style={{
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  background: (leftEditor.file === file.path || rightEditor.file === file.path) ? '#2d2d30' : 'transparent',
                  borderLeft: (leftEditor.file === file.path || rightEditor.file === file.path) ? '3px solid #00f2ff' : '3px solid transparent',
                  color: (leftEditor.file === file.path || rightEditor.file === file.path) ? '#fff' : '#ccc',
                  fontSize: '12px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (leftEditor.file !== file.path && rightEditor.file !== file.path) {
                    e.currentTarget.style.background = '#1e1e1e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (leftEditor.file !== file.path && rightEditor.file !== file.path) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <i 
                  className={file.name.endsWith('.js') ? "fa-brands fa-js" : file.name.endsWith('.py') ? "fa-brands fa-python" : "fa-solid fa-file-code"} 
                  style={{
                    marginRight: 0,
                    color: file.name.endsWith('.js') ? '#f7df1e' : file.name.endsWith('.py') ? '#3776ab' : '#888',
                    fontSize: '12px'
                  }}
                />
                {file.name}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const activeState = activePane === 'left' ? leftEditor : rightEditor;
  
  // Update editor context for titlebar
  useEffect(() => {
    editorContext.setEditorState({
      onAnalyze: () => setShowAnalysis(!showAnalysis),
      onRun: handleRun,
      onSave: () => { if(activeState.file) window.api.saveFile({filePath: activeState.file, content: activeState.code}) },
      isAnalysisMode: showAnalysis,
      onMenuAction: handleMenuAction,
      autoSave: autoSave,
      isAutoSaving: isAutoSaving
    });
  }, [showAnalysis, autoSave, isAutoSaving, activeState, editorContext]);
  
  // Determine current language based on file extension
  const getCurrentLanguage = () => {
    if (!activeState.file) return 'javascript';
    const ext = activeState.file.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py': return 'python';
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'jsx': return 'javascript';
      case 'tsx': return 'typescript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      default: return 'javascript';
    }
  };
  
  const currentLang = getCurrentLanguage();

  return (
    <div className="ide-wrapper" ref={containerRef}>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }} onMouseLeave={() => setContextMenu(null)}>
          <div className="context-item" onClick={() => { setRenameFile(contextMenu.file.path); setNewName(contextMenu.file.name); setContextMenu(null); }}><i className="fa-solid fa-pen"></i> Rename</div>
          <div className="context-item" onClick={() => { setClipboard({file: contextMenu.file, action:'cut'}); setContextMenu(null); }}><i className="fa-solid fa-scissors"></i> Cut</div>
          <div className="context-item" onClick={() => { setClipboard({file: contextMenu.file, action:'copy'}); setContextMenu(null); }}><i className="fa-solid fa-copy"></i> Copy</div>
          <div className="context-divider"></div>
          <div className="context-item delete" onClick={() => handleDeleteFile(contextMenu.file)}><i className="fa-solid fa-trash"></i> Delete</div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="ide-main-content" style={{ display: 'flex', height: 'calc(100% - 40px)' }}>
        
        {/* ACTIVITY BAR */}
        <ActivityBar 
          activeSidebar={activeSidebar}
          onSidebarChange={setActiveSidebar}
        />

        {/* SIDEBAR */}
        <aside className="ide-sidebar" style={{ width: sidebarWidth }}>
           {renderSidebar()}
        </aside>

        {/* EDITOR + ANALYSIS WRAPPER */}
        <div style={{ display: 'grid', gridTemplateColumns: showAnalysis ? `1fr ${analysisWidth}px` : '1fr', height: '100%', width: '100%', gap: 0, minHeight: 0 }}>
          
          {/* LEFT: EDITOR + TERMINAL */}
          <div className="editor-terminal-wrapper" style={{ minHeight: 0 }}>
            
            {/* EDITOR SECTION */}
            {(leftEditor.file || rightEditor.file) ? (
              <div className="editor-split-container" style={{ gridTemplateColumns: isSplitView ? '1fr 1fr' : '1fr', minHeight: 0 }}>
                <div className="editor-area">
                   <CodeEditor 
                     code={leftEditor.code}
                     selectedFile={leftEditor.file}
                     isActive={activePane === 'left'}
                     onFocus={() => setActivePane('left')}
                     onChange={(val) => setLeftEditor(prev => ({...prev, code: val}))}
                     onSave={() => { if(leftEditor.file) window.api.saveFile({filePath: leftEditor.file, content: leftEditor.code}) }}
                     onRun={handleRun}
                     onClose={() => setLeftEditor(initialEditorState)}
                     onCursorChange={(l, c) => setLeftEditor(prev => ({...prev, cursorLine: l, cursorCol: c}))}
                     onProblemsDetected={(probs) => setProblems(probs)}
                     editorRef={leftEditorRef}
                   />
                </div>

                {isSplitView && (
                  <div className="editor-area" style={{ borderLeft: '1px solid #333' }}>
                     <CodeEditor 
                       code={rightEditor.code}
                       selectedFile={rightEditor.file}
                       isActive={activePane === 'right'}
                       onFocus={() => setActivePane('right')}
                       onChange={(val) => setRightEditor(prev => ({...prev, code: val}))}
                       onSave={() => { if(rightEditor.file) window.api.saveFile({filePath: rightEditor.file, content: rightEditor.code}) }}
                       onRun={handleRun}
                       onClose={() => { setRightEditor(initialEditorState); setIsSplitView(false); setActivePane('left'); }}
                       onCursorChange={(l, c) => setRightEditor(prev => ({...prev, cursorLine: l, cursorCol: c}))}
                       onProblemsDetected={(probs) => setProblems(probs)}
                       editorRef={rightEditorRef}
                     />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#666', gap: '20px', height: '100%' }}>
                <i className="fa-solid fa-file" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                <p style={{ fontSize: '16px', margin: 0 }}>No file selected</p>
                <p style={{ fontSize: '12px', margin: 0, color: '#555' }}>Open a file from the explorer to start editing</p>
              </div>
            )}

            {/* TERMINAL SECTION */}
            {isTerminalOpen ? (
              <div className="terminal-section" style={{ height: `${terminalHeight}px`, minHeight: 0 }}>
                 <div className="terminal-header">
                    <div className={`terminal-tab ${activeBottomTab==='Terminal'?'active':''}`} onClick={()=>setActiveBottomTab('Terminal')}>Terminal</div>
                    <div className={`terminal-tab ${activeBottomTab==='Output'?'active':''}`} onClick={()=>setActiveBottomTab('Output')}>Output</div>
                    <div className={`terminal-tab ${activeBottomTab==='Problems'?'active':''}`} onClick={()=>setActiveBottomTab('Problems')}>
                       Problems 
                       {problems.length > 0 && <span style={{marginLeft:5, background:'#ff4444', borderRadius:'50%', padding:'0 5px', fontSize:'10px', color:'black'}}>{problems.length}</span>}
                    </div>
                    <div className={`terminal-tab ${activeBottomTab==='Debug'?'active':''}`} onClick={()=>setActiveBottomTab('Debug')}>Debug Console</div>
                    <div style={{marginLeft:'auto', display:'flex', gap:'10px'}}>
                       <i className="fa-solid fa-ban" onClick={() => { setStdout(''); setStderr(''); setProblems([]); }} style={{cursor:'pointer'}}></i>
                       <i className="fa-solid fa-chevron-down" onClick={()=>setIsTerminalOpen(false)} style={{cursor:'pointer'}}></i>
                    </div>
                 </div>
                 <Terminal 
                    activeTab={activeBottomTab}
                    outputData={stdout}
                    debugData={stderr}
                    problems={problems}
                    onCommand={async (cmd) => await window.api.executeCommand(cmd)}
                    onClear={() => { setStdout(''); setStderr(''); setProblems([]); }}
                 />
              </div>
            ) : (
              <div className="terminal-collapsed-bar">
                 <div className="collapsed-tabs">
                    <div className={`collapsed-tab ${activeBottomTab==='Terminal'?'active':''}`} onClick={()=>{setActiveBottomTab('Terminal'); setIsTerminalOpen(true);}}>
                       <i className="fa-solid fa-terminal"></i>
                       <span className="tab-label">Terminal</span>
                    </div>
                    <div className={`collapsed-tab ${activeBottomTab==='Output'?'active':''}`} onClick={()=>{setActiveBottomTab('Output'); setIsTerminalOpen(true);}}>
                       <i className="fa-solid fa-list"></i>
                       <span className="tab-label">Output</span>
                    </div>
                    <div className={`collapsed-tab ${activeBottomTab==='Problems'?'active':''}`} onClick={()=>{setActiveBottomTab('Problems'); setIsTerminalOpen(true);}}>
                       <i className="fa-solid fa-circle-exclamation"></i>
                       <span className="tab-label">Problems</span>
                       {problems.length > 0 && <span className="tab-badge">{problems.length}</span>}
                    </div>
                    <div className={`collapsed-tab ${activeBottomTab==='Debug'?'active':''}`} onClick={()=>{setActiveBottomTab('Debug'); setIsTerminalOpen(true);}}>
                       <i className="fa-solid fa-bug"></i>
                       <span className="tab-label">Debug</span>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* RIGHT: ANALYSIS PANEL */}
          {showAnalysis && (
            <div className="analysis-panel">
              <AnalysisPanel 
                code={activeState.code}
                language={currentLang}
                isVisible={showAnalysis}
              />
            </div>
          )}
        </div>
      </div>

      {/* STATUS BAR */}
      <StatusBar line={activeState.cursorLine} col={activeState.cursorCol} language={currentLang} />
      
      {/* Keyboard Shortcut Toast */}
      {shortcutToast && (
        <div style={{
          position: 'fixed',
          top: '50px',
          right: '20px',
          background: '#2d2d30',
          color: '#cccccc',
          padding: '8px 16px',
          borderRadius: '4px',
          border: '1px solid #3e3e42',
          fontSize: '12px',
          zIndex: 10000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          animation: 'fadeInOut 2s ease-in-out'
        }}>
          <i className="fa-solid fa-keyboard" style={{ marginRight: '8px', color: '#00f2ff' }}></i>
          {shortcutToast}
        </div>
      )}
    </div>
  );
};


export default EditorScreen;