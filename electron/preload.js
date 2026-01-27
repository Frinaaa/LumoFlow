const { contextBridge, ipcRenderer } = require('electron');

// Store auth listeners
const authListeners = {};

// Global error handler for IPC
ipcRenderer.on('error', (event, error) => {
  console.error('IPC Error:', error);
});

contextBridge.exposeInMainWorld('api', {
  // Authentication
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials).catch(err => ({ success: false, msg: err.message })),
  signup: (data) => ipcRenderer.invoke('auth:signup', data).catch(err => ({ success: false, msg: err.message })),
  logout: () => ipcRenderer.invoke('auth:logout').catch(err => ({ success: false, msg: err.message })),
  forgotPassword: (email) => ipcRenderer.invoke('auth:forgotPassword', email).catch(err => ({ success: false, msg: err.message })),
  resetPassword: (data) => ipcRenderer.invoke('auth:resetPassword', data).catch(err => ({ success: false, msg: err.message })),
  
  // OAuth
  googleOAuth: (code) => ipcRenderer.invoke('auth:google-oauth', code).catch(err => ({ success: false, msg: err.message })),
  githubOAuth: (code) => ipcRenderer.invoke('auth:github-oauth', code).catch(err => ({ success: false, msg: err.message })),
  openExternalURL: (url) => ipcRenderer.invoke('shell:openExternal', url).catch(err => ({ success: false, msg: err.message })),
  
  // User Management
  getDashboardStats: (userId) => ipcRenderer.invoke('user:getDashboardStats', userId).catch(err => ({ success: false, msg: err.message })),
  updateProfile: (data) => ipcRenderer.invoke('user:updateProfile', data).catch(err => ({ success: false, msg: err.message })),
  
  // File System
  readProjectFiles: () => ipcRenderer.invoke('files:readProject').catch(err => []),
  readFile: (filePath) => ipcRenderer.invoke('files:readFile', filePath).catch(err => ''),
  saveFile: (payload) => ipcRenderer.invoke('files:saveFile', payload).catch(err => ({ success: false, msg: err.message })),
  createFile: (payload) => ipcRenderer.invoke('files:createFile', payload).catch(err => ({ success: false, msg: err.message })),
  createFolder: (folderName) => ipcRenderer.invoke('files:createFolder', folderName).catch(err => ({ success: false, msg: err.message })),
  deleteFile: (filePath) => ipcRenderer.invoke('files:deleteFile', filePath).catch(err => ({ success: false, msg: err.message })),
  renameFile: (oldPath, newName) => ipcRenderer.invoke('files:renameFile', oldPath, newName).catch(err => ({ success: false, msg: err.message })),
  moveFile: (oldPath, newPath) => ipcRenderer.invoke('files:moveFile', oldPath, newPath).catch(err => ({ success: false, msg: err.message })),
  searchFiles: (payload) => ipcRenderer.invoke('files:search', payload).catch(err => []),
  
  // Terminal
  runCode: (payload) => ipcRenderer.invoke('terminal:runCode', payload).catch(err => ({ stdout: "", stderr: err.message })),
  executeCommand: (cmd) => ipcRenderer.invoke('terminal:executeCommand', cmd).catch(err => err.message),
  
  // Dialogs
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
  saveFileAs: (content) => ipcRenderer.invoke('dialog:saveAs', content),
  
  // Window controls
  newWindow: () => ipcRenderer.invoke('window:new'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  toggleDevTools: () => ipcRenderer.invoke('window:toggleDevTools'),
  
  // Code Management (Database)
  saveCodeToDatabase: (data) => ipcRenderer.invoke('code:saveToDatabase', data).catch(err => ({ success: false, msg: err.message })),
  loadUserProjects: (userId) => ipcRenderer.invoke('code:loadUserProjects', userId).catch(err => ({ success: false, msg: err.message })),
  loadFileFromDatabase: (fileId) => ipcRenderer.invoke('code:loadFileFromDatabase', fileId).catch(err => ({ success: false, msg: err.message })),
  deleteFileFromDatabase: (fileId) => ipcRenderer.invoke('code:deleteFileFromDatabase', fileId).catch(err => ({ success: false, msg: err.message })),
  createProject: (data) => ipcRenderer.invoke('code:createProject', data).catch(err => ({ success: false, msg: err.message })),
  
  // Code Analysis
  analyzeCode: (data) => ipcRenderer.invoke('analysis:analyzeCode', data).catch(err => ({ success: false, msg: err.message })),
  getAnalysisHistory: (userId) => ipcRenderer.invoke('analysis:getHistory', userId).catch(err => ({ success: false, msg: err.message })),
  
  // Git/GitHub Operations
  gitStatus: (repoPath) => ipcRenderer.invoke('git:status', repoPath).catch(err => ({ success: false, error: err.message })),
  gitBranch: (repoPath) => ipcRenderer.invoke('git:branch', repoPath).catch(err => ({ success: false, error: err.message })),
  gitBranches: (repoPath) => ipcRenderer.invoke('git:branches', repoPath).catch(err => ({ success: false, error: err.message })),
  gitInit: (repoPath) => ipcRenderer.invoke('git:init', repoPath).catch(err => ({ success: false, error: err.message })),
  gitClone: (data) => ipcRenderer.invoke('git:clone', data).catch(err => ({ success: false, error: err.message })),
  gitAdd: (data) => ipcRenderer.invoke('git:add', data).catch(err => ({ success: false, error: err.message })),
  gitCommit: (data) => ipcRenderer.invoke('git:commit', data).catch(err => ({ success: false, error: err.message })),
  gitPush: (data) => ipcRenderer.invoke('git:push', data).catch(err => ({ success: false, error: err.message })),
  gitPull: (data) => ipcRenderer.invoke('git:pull', data).catch(err => ({ success: false, error: err.message })),
  gitCheckout: (data) => ipcRenderer.invoke('git:checkout', data).catch(err => ({ success: false, error: err.message })),
  gitCreateBranch: (data) => ipcRenderer.invoke('git:createBranch', data).catch(err => ({ success: false, error: err.message })),
  gitLog: (data) => ipcRenderer.invoke('git:log', data).catch(err => ({ success: false, error: err.message })),
  gitDiff: (data) => ipcRenderer.invoke('git:diff', data).catch(err => ({ success: false, error: err.message })),
  gitRemote: (data) => ipcRenderer.invoke('git:remote', data).catch(err => ({ success: false, error: err.message })),
  
  // System
  getAppInfo: () => ipcRenderer.invoke('app:info').catch(err => ({ appVersion: 'unknown', isDev: false })),
  getUserDirectories: () => ipcRenderer.invoke('system:getUserDirectories').catch(err => ({ home: '', documents: '', desktop: '' })),
  
  // Auth callback listeners
  onAuthCallback: (provider, callback) => {
    authListeners[provider] = callback;
    ipcRenderer.on(`auth:${provider}-code`, (event, data) => {
      callback(data);
    });
    ipcRenderer.on(`auth:${provider}-error`, (event, data) => {
      callback({ error: data.error });
    });
  },
  
  removeAuthListener: (provider) => {
    if (authListeners[provider]) {
      ipcRenderer.removeAllListeners(`auth:${provider}-code`);
      ipcRenderer.removeAllListeners(`auth:${provider}-error`);
      delete authListeners[provider];
    }
  }
});
