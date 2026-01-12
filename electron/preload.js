const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // --- Authentication Channels ---
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  signup: (data) => ipcRenderer.invoke('auth:signup', data),
  logout: () => ipcRenderer.invoke('auth:logout'),
  
  // Added Google Login here properly
  googleLogin: (data) => ipcRenderer.invoke('auth:google-login', data),
 
  forgotPassword: (email) => ipcRenderer.invoke('auth:forgot-password', { email }),

  // --- Application Info ---
  getAppInfo: () => ipcRenderer.invoke('app:info'),
});