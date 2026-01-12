const { contextBridge, ipcMain } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      const validChannels = ['quit'];
      if (validChannels.includes(channel)) {
        ipcMain.emit(channel, data);
      }
    },
    invoke: (channel, data) => {
      const validChannels = ['backend:request'];
      if (validChannels.includes(channel)) {
        return ipcMain.invoke(channel, data);
      }
    },
  },
  api: {
    getData: () => ({ appVersion: '0.0.1', platform: process.platform }),
  },
});
