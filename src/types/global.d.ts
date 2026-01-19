// src/types/global.d.ts

interface Window {
  api: {
    // --- Authentication ---
    login: (credentials: any) => Promise<any>;
    signup: (data: any) => Promise<any>;
    logout: () => Promise<any>;
    forgotPassword: (email: string) => Promise<{ success: boolean; msg: string }>;
    resetPassword: (data: any) => Promise<any>;
    
    // --- OAuth ---
    googleOAuth: (code: string) => Promise<any>;
    githubOAuth: (code: string) => Promise<any>;
    openExternalURL: (url: string) => Promise<any>;
    sendAuthCode: (provider: string, code: string) => void;
    sendAuthError: (provider: string, error: string) => void;
    onAuthCallback: (provider: string, callback: (data: any) => void) => void;
    removeAuthListener: (provider: string) => void;

    // --- User Data ---
    getDashboardStats: (userId: string) => Promise<any>;
    updateProfile: (data: any) => Promise<any>;
    
    // --- File System & Terminal ---
    readProjectFiles: () => Promise<Array<{ name: string; path: string }>>;
    readFile: (filePath: string) => Promise<string>;
    saveFile: (payload: { filePath: string; content: string }) => Promise<any>;
    createFile: (payload: { fileName: string; content: string }) => Promise<any>;
    createFolder: (folderName: string) => Promise<any>;
    deleteFile: (filePath: string) => Promise<any>;
    renameFile: (oldPath: string, newName: string) => Promise<any>;
    runCode: (payload: { filePath: string; code: string }) => Promise<{ stdout: string; stderr: string }>;
    executeCommand: (command: string) => Promise<string>;
    
    // --- Dialogs ---
    openFileDialog: () => Promise<{ canceled: boolean; filePath: string; fileName: string; content: string }>;
    openFolderDialog: () => Promise<{ canceled: boolean; folderPath: string; files: any[] }>;
    saveFileAs: (content: string) => Promise<{ canceled: boolean; filePath: string; fileName: string }>;
    
    // --- Window Controls ---
    newWindow: () => Promise<void>;
    minimizeWindow: () => Promise<void>;
    maximizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;
    
    // --- Code Management (Database) ---
    saveCodeToDatabase: (data: { filePath: string; content: string; userId?: string }) => Promise<any>;
    loadUserProjects: (userId: string) => Promise<any>;
    loadFileFromDatabase: (fileId: string) => Promise<any>;
    deleteFileFromDatabase: (fileId: string) => Promise<any>;
    createProject: (data: { userId: string; projectName: string; language?: string }) => Promise<any>;
    
    // --- Code Analysis ---
    analyzeCode: (data: { code: string; language: string; userId?: string; fileId?: string }) => Promise<any>;
    getAnalysisHistory: (userId: string) => Promise<any>;
    
    // --- Git/GitHub Operations ---
    gitStatus: (repoPath?: string) => Promise<{ success: boolean; changes?: Array<{ status: string; file: string }>; error?: string }>;
    gitBranch: (repoPath?: string) => Promise<{ success: boolean; branch?: string; error?: string }>;
    gitBranches: (repoPath?: string) => Promise<{ success: boolean; branches?: Array<{ name: string; current: boolean }>; error?: string }>;
    gitInit: (repoPath?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    gitClone: (data: { url: string; targetPath?: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
    gitAdd: (data: { files: string[]; repoPath?: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
    gitCommit: (data: { message: string; repoPath?: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
    gitPush: (data: { remote?: string; branch?: string; repoPath?: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
    gitPull: (data: { remote?: string; branch?: string; repoPath?: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
    gitCheckout: (data: { branch: string; repoPath?: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
    gitCreateBranch: (data: { branch: string; repoPath?: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
    gitLog: (data: { limit?: number; repoPath?: string }) => Promise<{ success: boolean; commits?: Array<{ hash: string; message: string }>; error?: string }>;
    gitDiff: (data: { file?: string; repoPath?: string }) => Promise<{ success: boolean; diff?: string; error?: string }>;
    gitRemote: (data: { action: 'add' | 'remove' | 'list'; name?: string; url?: string; repoPath?: string }) => Promise<{ success: boolean; remotes?: Array<{ name: string; url: string }>; message?: string; error?: string }>;
    
    // --- System ---
    getAppInfo: () => Promise<any>;
    getUserDirectories: () => Promise<{ home: string; documents: string; desktop: string; downloads: string; pictures: string; music: string; videos: string }>;
  };
}