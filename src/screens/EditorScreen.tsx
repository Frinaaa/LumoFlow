import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeEditor from '../components/Editor/CodeEditor';
import AnalysisPanel from '../components/Editor/SidePanel';
import Terminal, { Problem } from '../components/Editor/Terminal';
import StatusBar from '../components/Editor/StatusBar';
import ActivityBar from '../components/Editor/ActivityBar';
import { useEditor } from '../context/EditorContext';
import { FileExplorerSidebar, SearchSidebar, GitSidebar, ContextMenu, ShortcutToast } from './EditorScreen/components';
import { stripAnsiCodes, parseErrors, isElectronAvailable, getLanguageFromFile } from './EditorScreen/utils';
import { EditorState, FileItem } from './EditorScreen/types';
import '../styles/TerminalScreen.css';

const initialEditorState: EditorState = { file: null, code: "", cursorLine: 1, cursorCol: 1 };

const EditorScreen: React.FC = () => {
  const navigate = useNavigate();
  const editorContext = useEditor();

  // --- UI STATES ---
  const [activeSidebar, setActiveSidebar] = useState('Explorer');
  const [activeBottomTab, setActiveBottomTab] = useState('Problems');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);
  
  // --- SPLIT VIEW STATES ---
  const [isSplitView, setIsSplitView] = useState(false);
  const [activePane, setActivePane] = useState<'left' | 'right'>('left');
  const [leftEditor, setLeftEditor] = useState<EditorState>(initialEditorState);
  const [rightEditor, setRightEditor] = useState<EditorState>(initialEditorState);

  // --- DATA STATES ---
  const [files, setFiles] = useState<FileItem[]>([]);
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [problems, setProblems] = useState<Problem[]>([]);

  // --- EDITOR REFS FOR CLIPBOARD OPERATIONS ---
  const leftEditorRef = useRef<any>(null);
  const rightEditorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- SIDEBAR FEATURES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileItem[]>([]);
  
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
  const [remoteUrl, setRemoteUrl] = useState('');
  
  // --- CONTEXT MENU & CLIPBOARD ---
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem } | null>(null);
  const [clipboard, setClipboard] = useState<{ file: FileItem; action: 'cut' | 'copy' } | null>(null);
  const [renameFile, setRenameFile] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [autoSave, setAutoSave] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [creatingInFolder, setCreatingInFolder] = useState<string | null>(null);
  
  // --- RESIZING STATES ---
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [analysisWidth, setAnalysisWidth] = useState(400);
  const [isDragging, setIsDragging] = useState<'sidebar' | 'terminal' | 'analysis' | null>(null);

  // Toast notification for keyboard shortcuts
  const showShortcutToast = (message: string) => {
    setShortcutToast(message);
    setTimeout(() => setShortcutToast(null), 2000);
  };
  
  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !isElectronAvailable()) return;
    
    const autoSaveInterval = setInterval(async () => {
      const currentEditor = activePane === 'left' ? leftEditor : rightEditor;
      if (currentEditor.file && currentEditor.code) {
        try {
          setIsAutoSaving(true);
          
          await window.api.saveFile({ 
            filePath: currentEditor.file, 
            content: currentEditor.code 
          });
          
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
    }, 30000);
    
    return () => clearInterval(autoSaveInterval);
  }, [autoSave, leftEditor, rightEditor, activePane]);

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

  useEffect(() => { 
    console.log('✅ EditorScreen MOUNTED');
    loadProject(); 
    return () => {
      console.log('❌ EditorScreen UNMOUNTED');
    };
  }, []);

  const loadProject = async () => {
    try {
      if (window.api && window.api.readProjectFiles) {
        const projectFiles = await window.api.readProjectFiles();
        setFiles(projectFiles);
      } else {
        console.log('Electron API not available - skipping project load');
      }
    } catch (e) { 
      console.error("Load error", e); 
    }
  };

  // --- FILE HANDLING ---
  const handleFileSelect = async (file: FileItem) => {
    if (file.isInMemory) {
      const newState = { file: file.path, code: '', cursorLine: 1, cursorCol: 1 };
      if (activePane === 'left') setLeftEditor(prev => ({ ...prev, ...newState }));
      else setRightEditor(prev => ({ ...prev, ...newState }));
      return;
    }
    
    if (!isElectronAvailable()) {
      console.log('Electron API not available - cannot read file');
      return;
    }

    try {
      const response: any = await window.api.readFile(file.path);
      const fileContent = (response && response.success && typeof response.content === 'string') 
        ? response.content 
        : (typeof response === 'string' ? response : '');

      const newState = { file: file.path, code: fileContent, cursorLine: 1, cursorCol: 1 };
      
      if (activePane === 'left') setLeftEditor(prev => ({ ...prev, ...newState }));
      else setRightEditor(prev => ({ ...prev, ...newState }));
    } catch (error) {
      console.error("Error reading file:", error);
    }
  };

  // --- RUN HANDLER ---
  const handleRun = async () => {
    const current = activePane === 'left' ? leftEditor : rightEditor;
    if (!current.file) return;
    
    if (!isElectronAvailable()) {
      setStderr('Electron API not available - cannot run code');
      setActiveBottomTab('Debug');
      return;
    }
    
    setStdout(''); 
    setStderr(''); 
    setProblems([]);
    setActiveBottomTab('Output'); 
    setIsTerminalOpen(true);

    try {
      await window.api.saveFile({ filePath: current.file, content: current.code });
      
      const res = await window.api.runCode({ filePath: current.file, code: current.code });
      
      let cleanOutput = '';
      if (res.stdout) {
        cleanOutput = stripAnsiCodes(res.stdout).trim();
      }
      
      setStdout(cleanOutput);
      
      if (res.stderr) {
        const cleanStderr = stripAnsiCodes(res.stderr);
        setStderr(cleanStderr);
        
        const detectedProblems = parseErrors(cleanStderr, current.file.split(/[\\/]/).pop() || 'file');
        setProblems(detectedProblems);

        if (detectedProblems.length > 0) {
          setActiveBottomTab('Problems');
        } else if (!cleanOutput) {
          setActiveBottomTab('Debug');
        }
      } else if (!cleanOutput) {
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
    }
  };

  // --- MENU ACTIONS ---
  const handleMenuAction = async (action: string) => {
    console.log('Menu action triggered:', action);
    
    const currentEditor = activePane === 'left' ? leftEditor : rightEditor;
    const setCurrentEditor = activePane === 'left' ? setLeftEditor : setRightEditor;

    switch(action) {
      case 'newTextFile':
        const untitledState = { file: null, code: '', cursorLine: 1, cursorCol: 1 };
        setCurrentEditor(untitledState);
        break;

      case 'newFile':
        setIsCreatingFile(true);
        break;

      case 'newFolder':
        setIsCreatingFolder(true);
        break;

      case 'newWindow':
        if (isElectronAvailable()) {
          await window.api.newWindow();
        }
        break;

      case 'openFile':
        if (!isElectronAvailable()) break;
        const fileRes = await window.api.openFileDialog();
        if (fileRes && !fileRes.canceled) {
          setCurrentEditor({ 
            file: fileRes.filePath, 
            code: fileRes.content, 
            cursorLine: 1, 
            cursorCol: 1 
          });
          if (!files.find(f => f.path === fileRes.filePath)) {
            setFiles(prev => [...prev, { name: fileRes.fileName, path: fileRes.filePath }]);
          }
        }
        break;

      case 'openFolder':
        if (!isElectronAvailable()) break;
        const folderRes = await window.api.openFolderDialog();
        if (folderRes && !folderRes.canceled) {
          setFiles(folderRes.files);
          setLeftEditor(initialEditorState);
          setRightEditor(initialEditorState);
        }
        break;

      case 'openRecent':
        loadProject();
        break;

      case 'save':
        try {
          if (currentEditor.file) {
            if (isElectronAvailable()) {
              await window.api.saveFile({ filePath: currentEditor.file, content: currentEditor.code });
            }
            
            const userInfo = localStorage.getItem('user_info');
            if (userInfo) {
              const user = JSON.parse(userInfo);
              if (isElectronAvailable()) {
                await window.api.saveCodeToDatabase({ 
                  filePath: currentEditor.file, 
                  content: currentEditor.code,
                  userId: user._id || user.id
                });
              }
            }
          } else {
            handleMenuAction('saveAs');
          }
        } catch (error: any) {
          console.error('Save failed:', error);
        }
        break;

      case 'saveAs':
        try {
          if (!isElectronAvailable()) break;
          const saveRes = await window.api.saveFileAs(currentEditor.code);
          if (saveRes && !saveRes.canceled) {
            setCurrentEditor(prev => ({ ...prev, file: saveRes.filePath }));
            
            if (!files.find(f => f.path === saveRes.filePath)) {
              setFiles(prev => [...prev, { name: saveRes.fileName, path: saveRes.filePath }]);
            }
            
            const userInfo = localStorage.getItem('user_info');
            if (userInfo) {
              const user = JSON.parse(userInfo);
              await window.api.saveCodeToDatabase({ 
                filePath: saveRes.filePath, 
                content: currentEditor.code,
                userId: user._id || user.id
              });
            }
          }
        } catch (error: any) {
          console.error('Save As failed:', error);
        }
        break;

      case 'saveAll':
        try {
          const userInfo = localStorage.getItem('user_info');
          const user = userInfo ? JSON.parse(userInfo) : null;
          const userId = user?._id || user?.id;
          
          if (leftEditor.file) {
            await window.api.saveFile({ filePath: leftEditor.file, content: leftEditor.code });
            if (userId) {
              await window.api.saveCodeToDatabase({ 
                filePath: leftEditor.file, 
                content: leftEditor.code, 
                userId 
              });
            }
          }
          
          if (rightEditor.file) {
            await window.api.saveFile({ filePath: rightEditor.file, content: rightEditor.code });
            if (userId) {
              await window.api.saveCodeToDatabase({ 
                filePath: rightEditor.file, 
                content: rightEditor.code, 
                userId 
              });
            }
          }
        } catch (error: any) {
          console.error('Save All failed:', error);
        }
        break;

      case 'closeFile':
        setCurrentEditor(initialEditorState);
        break;

      case 'closeFolder':
        setFiles([]);
        setLeftEditor(initialEditorState);
        setRightEditor(initialEditorState);
        break;

      case 'exit':
        if (window.api && window.api.closeWindow) {
          window.api.closeWindow();
        }
        break;

      case 'toggleAutoSave':
        setAutoSave(!autoSave);
        break;

      case 'addFolderToWorkspace':
        const addFolderRes = await window.api.openFolderDialog();
        if (addFolderRes && !addFolderRes.canceled) {
          const newFiles = addFolderRes.files.filter((newFile: FileItem) => 
            !files.find(existingFile => existingFile.path === newFile.path)
          );
          setFiles(prev => [...prev, ...newFiles]);
        }
        break;

      case 'saveWorkspaceAs':
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

      case 'share':
        if (currentEditor.file && currentEditor.code) {
          try {
            await navigator.clipboard.writeText(currentEditor.code);
            alert('Code copied to clipboard for sharing!');
          } catch (err) {
            console.error('Failed to copy to clipboard:', err);
          }
        }
        break;

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
          showShortcutToast('Cut (Ctrl+X)');
        }
        break;

      case 'copy':
        const copyEditor = activePane === 'left' ? leftEditorRef.current : rightEditorRef.current;
        if (copyEditor) {
          copyEditor.focus();
          copyEditor.trigger('keyboard', 'editor.action.clipboardCopyAction', null);
          showShortcutToast('Copy (Ctrl+C)');
        }
        break;

      case 'paste':
        if (activeSidebar === 'Explorer' && clipboard) {
          handlePasteFile();
          return;
        }
        const pasteEditor = activePane === 'left' ? leftEditorRef.current : rightEditorRef.current;
        if (pasteEditor) {
          pasteEditor.focus();
          try {
            const text = await navigator.clipboard.readText();
            const selection = pasteEditor.getSelection();
            const op = { range: selection, text: text, forceMoveMarkers: true };
            pasteEditor.executeEdits("clipboard", [op]);
            showShortcutToast('Paste (Ctrl+V)');
          } catch (err) {
            console.warn('Clipboard read failed:', err);
            pasteEditor.trigger('keyboard', 'editor.action.clipboardPasteAction', null);
          }
        }
        break;
        
      case 'splitEditor': 
        setIsSplitView(!isSplitView); 
        setActivePane('right'); 
        break;
        
      case 'toggleTerminal': 
        setIsTerminalOpen(!isTerminalOpen); 
        break;

      default:
        console.warn('Unhandled menu action:', action);
        break;
    }
  };

  // Continue in next part...

  // --- FILE OPERATIONS (Context Menu) ---
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    
    try {
      if (!isElectronAvailable()) {
        const folderPath = creatingInFolder || '';
        const filePath = folderPath ? `${folderPath}/${newFileName}` : `/untitled/${newFileName}`;
        
        const newFile: FileItem = {
          name: newFileName,
          path: filePath,
          isInMemory: true,
          parentFolder: creatingInFolder
        };
        setFiles(prev => [...prev, newFile]);
        
        if (creatingInFolder) {
          setExpandedFolders(prev => new Set([...prev, creatingInFolder]));
        }
        
        const currentEditor = activePane === 'left' ? setLeftEditor : setRightEditor;
        currentEditor({ file: newFile.path, code: '', cursorLine: 1, cursorCol: 1 });
        
        setIsCreatingFile(false);
        setNewFileName('');
        setCreatingInFolder(null);
        return;
      }
      
      let fileNameToSend = newFileName;
      let parentPath = null;

      if (creatingInFolder) {
        const parentFolderObj = files.find(f => f.path === creatingInFolder);
        if (parentFolderObj) {
          fileNameToSend = `${parentFolderObj.name}/${newFileName}`;
          parentPath = creatingInFolder;
        }
      }

      const res = await window.api.createFile({ fileName: fileNameToSend, content: '' });
      
      if (res.success) { 
        const newFileObj: FileItem = {
          name: newFileName,
          path: res.path,
          parentFolder: parentPath,
          isFolder: false
        };

        setFiles(prev => [...prev, newFileObj]);

        if (parentPath) {
          setExpandedFolders(prev => new Set([...prev, parentPath]));
        }

        handleFileSelect(newFileObj); 
      }
    } catch(error) {
      console.error('Error creating file:', error);
    } finally { 
      setIsCreatingFile(false); 
      setNewFileName('');
      setCreatingInFolder(null);
    }
  };

  const handleCreateFolder = async (folderName?: string) => {
    let name = folderName;
    if (!name) {
      setActiveSidebar('Explorer');
      const tempName = prompt('Enter folder name:');
      if (!tempName) return;
      name = tempName;
    }
    if (!name?.trim()) return;
    
    if (!isElectronAvailable()) {
      const newFolder: FileItem = {
        name: name,
        path: `/untitled/${name}`,
        isFolder: true,
        isInMemory: true
      };
      setFiles(prev => [...prev, newFolder]);
      return;
    }
    
    try { 
      const res = await window.api.createFolder(name);
      if (res && res.success) {
        const newFolderObj: FileItem = {
          name: name,
          path: res.path,
          isFolder: true 
        };
        
        setFiles(prev => [...prev, newFolderObj]);
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
      if (!isElectronAvailable()) {
        console.log('Electron API not available');
        return;
      }
      try { await window.api.deleteFile(file.path); await loadProject(); } catch(e){}
    }
    setContextMenu(null);
  };

  const confirmRename = async () => {
    if (!renameFile || !newName.trim()) return;
    if (!isElectronAvailable()) {
      console.log('Electron API not available');
      return;
    }
    try { await window.api.renameFile(renameFile, newName); await loadProject(); } catch(e){}
    setRenameFile(null); setNewName('');
  };

  const handlePasteFile = async () => {
    if (!clipboard || !isElectronAvailable()) return;
    
    try {
      const content = await window.api.readFile(clipboard.file.path);
      const baseName = clipboard.action === 'cut' ? clipboard.file.name : `copy_${clipboard.file.name}`;
      
      let fileNameToSend = baseName;
      let parentPath = null;

      if (selectedFolder) {
        const folderObj = files.find(f => f.path === selectedFolder && f.isFolder);
        if (folderObj) {
          fileNameToSend = `${folderObj.name}/${baseName}`;
          parentPath = selectedFolder;
        }
      }

      const res = await window.api.createFile({ fileName: fileNameToSend, content });
      
      if (res.success) {
        if (clipboard.action === 'cut') {
          await window.api.deleteFile(clipboard.file.path);
        }
        
        await loadProject(); 
        setClipboard(null);
        
        if (parentPath) {
          setExpandedFolders(prev => new Set([...prev, parentPath]));
        }
      }
    } catch(e) {
      console.error("Paste error:", e);
      alert("Failed to paste file");
    }
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
    if (!isElectronAvailable()) {
      console.log('Electron API not available for git operations');
      return;
    }
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
    if (!isElectronAvailable()) {
      showShortcutToast('Electron API not available');
      return;
    }
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
    if (!isElectronAvailable()) {
      showShortcutToast('Electron API not available');
      return;
    }
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
    if (!isElectronAvailable()) {
      showShortcutToast('Electron API not available');
      return;
    }
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
    if (!isElectronAvailable()) {
      showShortcutToast('Electron API not available');
      return;
    }
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
    if (!isElectronAvailable()) {
      showShortcutToast('Electron API not available');
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
    if (!isElectronAvailable()) {
      showShortcutToast('Electron API not available');
      return;
    }
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
    if (!isElectronAvailable()) {
      showShortcutToast('Electron API not available');
      return;
    }
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
    if (!isElectronAvailable()) {
      showShortcutToast('Electron API not available');
      return;
    }
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
    if (!isElectronAvailable()) {
      showShortcutToast('Electron API not available');
      return;
    }
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

  const handleSetRemote = async () => {
    if (!remoteUrl.trim()) return;
    if (!isElectronAvailable()) {
      showShortcutToast('Electron API not available');
      return;
    }
    setGitLoading(true);
    const res = await window.api.gitRemote({ action: 'add', name: 'origin', url: remoteUrl });
    if (res.success) {
      showShortcutToast('Remote URL set successfully');
      setRemoteUrl('');
    } else {
      showShortcutToast('Error: ' + res.error);
    }
    setGitLoading(false);
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;

      if (isCtrl) {
        switch(e.key.toLowerCase()) {
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

          case 'k':
            e.preventDefault();
            const handleNextKey = (nextEvent: KeyboardEvent) => {
              if (nextEvent.ctrlKey || nextEvent.metaKey) {
                switch(nextEvent.key.toLowerCase()) {
                  case 's':
                    nextEvent.preventDefault();
                    handleMenuAction('saveAll');
                    break;
                  case 'f':
                    nextEvent.preventDefault();
                    handleMenuAction('closeFolder');
                    break;
                  case 'o':
                    nextEvent.preventDefault();
                    handleMenuAction('openFolder');
                    break;
                }
              }
              window.removeEventListener('keydown', handleNextKey);
            };
            window.addEventListener('keydown', handleNextKey);
            setTimeout(() => {
              window.removeEventListener('keydown', handleNextKey);
            }, 2000);
            break;

          case 'z':
            e.preventDefault();
            if (e.shiftKey) handleMenuAction('redo');
            else handleMenuAction('undo');
            break;

          case 'y':
            e.preventDefault();
            handleMenuAction('redo');
            break;

          case 'x':
            e.preventDefault();
            handleMenuAction('cut');
            break;

          case 'c':
            e.preventDefault();
            handleMenuAction('copy');
            break;

          case 'v':
            if (activeSidebar === 'Explorer' && clipboard) {
              e.preventDefault();
              handleMenuAction('paste');
            } 
            break;

          case 'i':
            if (e.shiftKey) {
              e.preventDefault();
              handleMenuAction('toggleDevTools');
              showShortcutToast('Toggle DevTools (Ctrl+Shift+I)');
            }
            break;

          case '\\':
            e.preventDefault();
            handleMenuAction('splitEditor');
            break;
            
          case '`':
            e.preventDefault();
            handleMenuAction('toggleTerminal');
            break;
        }
      }

      if (isAlt) {
        switch(e.key) {
          case 'F4':
            e.preventDefault();
            handleMenuAction('exit');
            break;
        }
      }

      if (isCtrl) {
        switch(e.key) {
          case 'F4':
            e.preventDefault();
            handleMenuAction('closeFile');
            break;
        }
      }

      if (isCtrl && e.altKey && e.key === 'n') {
        e.preventDefault();
        handleMenuAction('newFile');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [leftEditor, rightEditor, activePane, activeSidebar, clipboard]);

  // --- RENDER SIDEBAR CONTENT ---
  const renderSidebar = () => {
    if (activeSidebar === 'Github') {
      return (
        <GitSidebar
          gitBranch={gitBranch}
          gitChanges={gitChanges}
          gitCommitMessage={gitCommitMessage}
          gitBranches={gitBranches}
          gitCommits={gitCommits}
          showGitClone={showGitClone}
          gitCloneUrl={gitCloneUrl}
          showBranchCreate={showBranchCreate}
          newBranchName={newBranchName}
          gitLoading={gitLoading}
          remoteUrl={remoteUrl}
          setGitCommitMessage={setGitCommitMessage}
          setShowGitClone={setShowGitClone}
          setGitCloneUrl={setGitCloneUrl}
          setShowBranchCreate={setShowBranchCreate}
          setNewBranchName={setNewBranchName}
          setRemoteUrl={setRemoteUrl}
          onRefresh={refreshGitStatus}
          onInit={handleGitInit}
          onClone={handleGitClone}
          onStage={handleGitStage}
          onStageAll={handleGitStageAll}
          onCommit={handleGitCommit}
          onPush={handleGitPush}
          onPull={handleGitPull}
          onCheckout={handleGitCheckout}
          onCreateBranch={handleGitCreateBranch}
          onSetRemote={handleSetRemote}
        />
      );
    }
    
    if (activeSidebar === 'Search') {
      return (
        <SearchSidebar
          searchQuery={searchQuery}
          searchResults={searchResults}
          onSearch={handleSearch}
          onFileSelect={handleFileSelect}
        />
      );
    }
    
    // Default Explorer
    return (
      <FileExplorerSidebar
        files={files}
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
        handleFileSelect={handleFileSelect}
        handleCreateFile={handleCreateFile}
        handleCreateFolder={handleCreateFolder}
        handlePasteFile={handlePasteFile}
        confirmRename={confirmRename}
      />
    );
  };

  const activeState = activePane === 'left' ? leftEditor : rightEditor;
  const currentLang = getLanguageFromFile(activeState.file);

  // Update editor context for titlebar
  useEffect(() => {
    editorContext.setEditorState({
      onAnalyze: () => setShowAnalysis(!showAnalysis),
      onRun: handleRun,
      onSave: () => { 
        if(activePane === 'left' && leftEditor.file && window.api?.saveFile) {
          window.api.saveFile({filePath: leftEditor.file, content: leftEditor.code});
        } else if(activePane === 'right' && rightEditor.file && window.api?.saveFile) {
          window.api.saveFile({filePath: rightEditor.file, content: rightEditor.code});
        }
      },
      isAnalysisMode: showAnalysis,
      onMenuAction: handleMenuAction,
      autoSave: autoSave,
      isAutoSaving: isAutoSaving
    });
  }, [showAnalysis, autoSave, isAutoSaving, activePane, leftEditor.file, rightEditor.file, leftEditor.code, rightEditor.code]);

  return (
    <div className="ide-wrapper" ref={containerRef}>

      {/* CONTEXT MENU */}
      {contextMenu && contextMenu.file && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          onClose={() => setContextMenu(null)}
          onNewFileInFolder={() => {
            if (contextMenu.file) {
              setCreatingInFolder(contextMenu.file.path);
              setIsCreatingFile(true);
              setExpandedFolders(prev => new Set([...prev, contextMenu.file.path]));
            }
            setContextMenu(null);
          }}
          onRename={() => {
            setRenameFile(contextMenu.file.path);
            setNewName(contextMenu.file.name);
            setContextMenu(null);
          }}
          onCut={() => {
            setClipboard({ file: contextMenu.file, action: 'cut' });
            setContextMenu(null);
          }}
          onCopy={() => {
            setClipboard({ file: contextMenu.file, action: 'copy' });
            setContextMenu(null);
          }}
          onDelete={() => handleDeleteFile(contextMenu.file)}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="ide-main-content" style={{ display: 'flex', height: 'calc(100% - 40px)' }}>
        
        {/* ACTIVITY BAR */}
        <ActivityBar 
          activeSidebar={activeSidebar}
          onSidebarChange={setActiveSidebar}
          onNavigate={navigate}
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
                     onSave={() => { 
                       if(leftEditor.file && isElectronAvailable()) {
                         window.api.saveFile({filePath: leftEditor.file, content: leftEditor.code});
                       }
                     }}
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
                       onSave={() => { 
                         if(rightEditor.file && isElectronAvailable()) {
                           window.api.saveFile({filePath: rightEditor.file, content: rightEditor.code});
                         }
                       }}
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
                    onCommand={async (cmd: string) => {
                      if (isElectronAvailable()) {
                        return await window.api.executeCommand(cmd);
                      }
                      return "Command execution not available on web"; 
                    }}
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
      {shortcutToast && <ShortcutToast message={shortcutToast} />}
    </div>
  );
};


export default EditorScreen;
