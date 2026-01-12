const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const url = require('url');

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : url.format({
        pathname: path.join(__dirname, '../../build/index.html'),
        protocol: 'file:',
        slashes: true,
      });

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
};

const createMenu = () => {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Toggle DevTools', accelerator: 'CmdOrCtrl+Shift+I', role: 'toggleDevTools' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for backend communication
ipcMain.handle('backend:request', async (event, { method, url, data }) => {
  try {
    const axios = require('axios');
    const response = await axios({
      method,
      url: `http://localhost:5000${url}`,
      data,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.msg || error.message);
  }
});

// Handle app termination
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
