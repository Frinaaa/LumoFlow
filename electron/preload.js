const { contextBridge, ipcRenderer } = require('electron');

// Store auth listeners
const authListeners = {};

contextBridge.exposeInMainWorld('api', {
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  signup: (data) => ipcRenderer.invoke('auth:signup', data),
  logout: () => ipcRenderer.invoke('auth:logout'),
  googleOAuth: (code) => ipcRenderer.invoke('auth:google-oauth', code),
  githubOAuth: (code) => ipcRenderer.invoke('auth:github-oauth', code),
  getDashboardStats: (userId) => ipcRenderer.invoke('user:getDashboardStats', userId),
  updateProfile: (data) => ipcRenderer.invoke('user:updateProfile', data),
  // File System
  readProjectFiles: () => ipcRenderer.invoke('files:readProject'),
  readFile: (filePath) => ipcRenderer.invoke('files:readFile', filePath),
  saveFile: (payload) => ipcRenderer.invoke('files:saveFile', payload), 
  createFile: (payload) => ipcRenderer.invoke('files:createFile', payload), // NEW
  runCode: (payload) => ipcRenderer.invoke('terminal:runCode', payload),
  
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  
  // OAuth Browser Flow
  openExternalURL: (url) => ipcRenderer.invoke('shell:openExternal', url),
  
  // Send auth code from callback page
  sendAuthCode: (provider, code) => ipcRenderer.send('auth:code-received', { provider, code }),
  sendAuthError: (provider, error) => ipcRenderer.send('auth:error-received', { provider, error }),
  
  // Auth callback listeners
  onAuthCallback: (provider, callback) => {
    authListeners[provider] = callback;
    ipcRenderer.on(`auth:${provider}-callback`, (event, data) => {
      callback(data);
    });
  },
  
  removeAuthListener: (provider) => {
    if (authListeners[provider]) {
      ipcRenderer.removeAllListeners(`auth:${provider}-callback`);
      delete authListeners[provider];
    }
  }
});