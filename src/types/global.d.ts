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
    runCode: (payload: { filePath: string; code: string }) => Promise<string[]>;
    
    // --- System ---
    getAppInfo: () => Promise<any>;
  };
}