const { contextBridge, ipcRenderer } = require('electron');

// Store auth listeners
const authListeners = {};

// Global error handler for IPC
ipcRenderer.on('error', (event, error) => {
  console.error('IPC Error:', error);
});

contextBridge.exposeInMainWorld('api', {
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials).catch(err => ({ success: false, msg: err.message })),
  signup: (data) => ipcRenderer.invoke('auth:signup', data).catch(err => ({ success: false, msg: err.message })),
  logout: () => ipcRenderer.invoke('auth:logout').catch(err => ({ success: false, msg: err.message })),
  forgotPassword: (email) => ipcRenderer.invoke('auth:forgotPassword', email).catch(err => ({ success: false, msg: err.message })),
  resetPassword: (data) => ipcRenderer.invoke('auth:resetPassword', data).catch(err => ({ success: false, msg: err.message })),
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
  runCode: (payload) => ipcRenderer.invoke('terminal:runCode', payload).catch(err => [err.message]),
  
  getAppInfo: () => ipcRenderer.invoke('app:info').catch(err => ({ appVersion: 'unknown', isDev: false })),
  
  // OAuth Browser Flow
  openExternalURL: (url) => ipcRenderer.invoke('shell:openExternal', url).catch(err => ({ success: false, msg: err.message })),
  
  // OAuth handlers
  googleOAuth: (code) => ipcRenderer.invoke('auth:google-oauth', code).catch(err => ({ success: false, msg: err.message })),
  githubOAuth: (code) => ipcRenderer.invoke('auth:github-oauth', code).catch(err => ({ success: false, msg: err.message })),
  
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
