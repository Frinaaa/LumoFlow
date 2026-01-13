const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  signup: (data) => ipcRenderer.invoke('auth:signup', data),
  logout: () => ipcRenderer.invoke('auth:logout'),
  forgotPassword: (email) => ipcRenderer.invoke('auth:forgot-password', { email }),
  resetPassword: (data) => ipcRenderer.invoke('auth:reset-password', data),
    getDashboardStats: (userId) => ipcRenderer.invoke('user:get-dashboard', userId),
  // 🟢 NEW METHOD
  startGoogleLogin: () => ipcRenderer.invoke('auth:start-google-flow'),

  getAppInfo: () => ipcRenderer.invoke('app:info'),
  
  // 🟢 DASHBOARD BRIDGE
  getDashboardStats: (userId) => ipcRenderer.invoke('user:get-dashboard', userId),

  getAppInfo: () => ipcRenderer.invoke('app:info'),
});
contextBridge.exposeInMainWorld('api', {
  // Existing Auth/Profile bridge...
  login: (creds) => ipcRenderer.invoke('auth:login', creds),
  getProfile: () => ipcRenderer.invoke('user:getProfile'),
  updateProfile: (data) => ipcRenderer.invoke('user:updateProfile'),

  // --- NEW IDE BRIDGE ---
  readProjectFiles: () => ipcRenderer.invoke('files:readProject'),
  readFile: (filePath) => ipcRenderer.invoke('files:readOne', filePath),
  saveFile: (filePath, content) => ipcRenderer.invoke('files:save', filePath, content),
  runCode: (code) => ipcRenderer.invoke('terminal:run', code),
});