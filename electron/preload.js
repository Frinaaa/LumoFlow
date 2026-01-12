const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Authentication Channels
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  signup: (data) => ipcRenderer.invoke('auth:signup', data),
  logout: () => ipcRenderer.invoke('auth:logout'),

  // Application Info
  getAppInfo: () => ipcRenderer.invoke('app:info'),
});