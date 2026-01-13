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