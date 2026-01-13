const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const mongoose = require('mongoose');

// Fix: .env is in the root, so we go up one level from 'electron/'
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authController = require('./controllers/authController');

let mainWindow;

const connectDB = async () => {
  try {
    // Fix: Added fallback string and corrected syntax
    const dbURI = process.env.MONGO_URI ;
    await mongoose.connect(dbURI);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('🔴 MongoDB Error:', err);
  }
};

const createWindow = async () => {
  await connectDB();

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  // Fix: Correct logic for Vite (Port 5173) vs Production Build (dist/index.html)
  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) mainWindow.webContents.openDevTools();
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC Handlers
ipcMain.handle('auth:login', authController.login);
ipcMain.handle('auth:signup', authController.signup);
ipcMain.handle('auth:logout', authController.logout);
ipcMain.handle('auth:forgot-password', authController.forgotPassword); // This must stay here
ipcMain.handle('auth:reset-password', authController.resetPassword);
ipcMain.handle('auth:google-login', authController.googleLogin);
ipcMain.handle('app:info', () => ({
  appVersion: app.getVersion(),
  isDev
}));