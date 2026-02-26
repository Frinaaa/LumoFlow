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
  updateStats: (data) => ipcRenderer.invoke('user:updateStats', data).catch(err => ({ success: false, msg: err.message })),
  addActivity: (data) => ipcRenderer.invoke('user:addActivity', data).catch(err => ({ success: false, msg: err.message })),
  saveGameProgress: (data) => ipcRenderer.invoke('user:saveGameProgress', data).catch(err => ({ success: false, msg: err.message })),

  // Visualizations
  saveVisualization: (data) => ipcRenderer.invoke('viz:save', data).catch(err => ({ success: false, msg: err.message })),
  getAllVisualizations: (userId) => ipcRenderer.invoke('viz:getAll', userId).catch(err => ({ success: false, visualizations: [] })),
  getVisualization: (data) => ipcRenderer.invoke('viz:get', data).catch(err => ({ success: false, msg: err.message })),
  deleteVisualization: (data) => ipcRenderer.invoke('viz:delete', data).catch(err => ({ success: false, msg: err.message })),


  // File System
  readProjectFiles: () => ipcRenderer.invoke('files:readProject').catch(err => []),
  readFile: (filePath) => ipcRenderer.invoke('files:readFile', filePath).catch(err => ''),
  saveFile: (payload) => ipcRenderer.invoke('files:saveFile', payload).catch(err => ({ success: false, msg: err.message })),
  saveAtomic: (payload) => ipcRenderer.invoke('files:saveAtomic', payload).catch(err => ({ success: false, msg: err.message })),
  createFile: (payload) => ipcRenderer.invoke('files:createFile', payload).catch(err => ({ success: false, msg: err.message })),
  createFolder: (folderName) => ipcRenderer.invoke('files:createFolder', folderName).catch(err => ({ success: false, msg: err.message })),
  deleteFile: (filePath) => ipcRenderer.invoke('files:deleteFile', filePath).catch(err => ({ success: false, msg: err.message })),
  renameFile: (oldPath, newName) => ipcRenderer.invoke('files:renameFile', oldPath, newName).catch(err => ({ success: false, msg: err.message })),
  moveFile: (oldPath, newPath) => ipcRenderer.invoke('files:moveFile', oldPath, newPath).catch(err => ({ success: false, msg: err.message })),
  searchFiles: (payload) => ipcRenderer.invoke('files:search', payload).catch(err => []),
  getWorkspace: () => ipcRenderer.invoke('files:getWorkspace').catch(err => ({ path: '', name: '' })),
  setWorkspace: (workspacePath) => ipcRenderer.invoke('files:setWorkspace', workspacePath).catch(err => ({ success: false, error: err.message })),

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
  gitConfig: (data) => ipcRenderer.invoke('git:config', data).catch(err => ({ success: false, error: err.message })),
  gitAheadBehind: (data) => ipcRenderer.invoke('git:ahead-behind', data).catch(err => ({ success: true, ahead: 0, behind: 0 })),
  gitStageFile: (data) => ipcRenderer.invoke('git:stageFile', data).catch(err => ({ success: false, error: err.message })),
  gitUnstageFile: (data) => ipcRenderer.invoke('git:unstageFile', data).catch(err => ({ success: false, error: err.message })),
  gitDiscardFile: (data) => ipcRenderer.invoke('git:discardFile', data).catch(err => ({ success: false, error: err.message })),

  // Copilot AI
  copilotChat: (data) => ipcRenderer.invoke('copilot:chat', data),
  copilotStreamChat: (data) => ipcRenderer.invoke('copilot:streamChat', data),
  copilotPing: () => ipcRenderer.invoke('copilot:ping'),
  transcribeAudio: (base64Audio) => ipcRenderer.invoke('voice:transcribe', base64Audio),
  onCopilotChunk: (callback) => ipcRenderer.on('copilot:chunk', (event, chunk) => callback(chunk)),
  onCopilotDone: (callback) => ipcRenderer.on('copilot:done', (event) => callback()),
  onCopilotError: (callback) => ipcRenderer.on('copilot:error', (event, err) => callback(err)),
  onEditorUpdate: (callback) => ipcRenderer.on('editor:update-content', (event, code) => callback(code)),
  onPreviewDiff: (callback) => ipcRenderer.on('editor:preview-diff', (event, code) => callback(code)),

  // Gemini Visuals
  geminiGetVisuals: (data) => ipcRenderer.invoke('gemini:getVisuals', data),
  onVisualChunk: (cb) => ipcRenderer.on('ai:visual-chunk', (event, chunk) => cb(chunk)),
  onVisualDone: (cb) => ipcRenderer.on('ai:visual-done', (event) => cb()),
  onVisualError: (cb) => ipcRenderer.on('ai:visual-error', (event, err) => cb(err)),
  removeVisualListeners: () => {
    ipcRenderer.removeAllListeners('ai:visual-chunk');
    ipcRenderer.removeAllListeners('ai:visual-done');
    ipcRenderer.removeAllListeners('ai:visual-error');
  },
  removeCopilotListeners: () => {
    // Only remove stream-related listeners (used between chat messages)
    // Do NOT remove editor:preview-diff - it must persist across chats!
    ipcRenderer.removeAllListeners('copilot:chunk');
    ipcRenderer.removeAllListeners('copilot:done');
    ipcRenderer.removeAllListeners('copilot:error');
    ipcRenderer.removeAllListeners('editor:update-content');
  },

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
