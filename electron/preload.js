const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // --- Authentication ---
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  signup: (data) => ipcRenderer.invoke('auth:signup', data),
  logout: () => ipcRenderer.invoke('auth:logout'),
  
  // --- Google Login ---
  googleLogin: (data) => ipcRenderer.invoke('auth:google-login', data),
 
  // --- Password Recovery ---
  forgotPassword: (email) => ipcRenderer.invoke('auth:forgot-password', { email }),
  resetPassword: (data) => ipcRenderer.invoke('auth:reset-password', data),

  // --- Application Info ---
  getAppInfo: () => ipcRenderer.invoke('app:info'),
});