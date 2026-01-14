const { app, BrowserWindow, ipcMain, shell, protocol } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const userController = require('./controllers/userController');
const authController = require('./controllers/authController');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let mainWindow;
const projectDir = path.join(require('os').homedir(), 'LumoFlow_Projects');

// OAuth Handlers using IPC
async function handleGoogleOAuth(code) {
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = 'http://localhost:5173/auth/google/callback';

    console.log('Exchanging Google code for token...');

    // Exchange code for token
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const accessToken = tokenRes.data.access_token;

    // Get user info
    const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('Google user info received:', userRes.data.email);

    // Create/update user in DB
    const result = await authController.googleLoginStep2({
      email: userRes.data.email,
      name: userRes.data.name,
      sub: userRes.data.id.toString(),
      picture: userRes.data.picture
    });

    return result;
  } catch (err) {
    console.error("Google OAuth error:", err.message);
    return { success: false, msg: "Google authentication failed: " + err.message };
  }
}

async function handleGitHubOAuth(code) {
  try {
    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    console.log('Exchanging GitHub code for token...');

    // Exchange code for token
    const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code: code
    }, { headers: { Accept: 'application/json' } });

    const accessToken = tokenRes.data.access_token;

    // Get user info
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });

    console.log('GitHub user info received:', userRes.data.login);

    // Create/update user in DB
    const result = await authController.googleLoginStep2({
      email: userRes.data.email || `${userRes.data.login}@github.com`,
      name: userRes.data.name || userRes.data.login,
      sub: userRes.data.id.toString(),
      picture: userRes.data.avatar_url
    });

    return result;
  } catch (err) {
    console.error("GitHub OAuth error:", err.message);
    return { success: false, msg: "GitHub authentication failed: " + err.message };
  }
}

const createWindow = async () => {
  const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/lumoflow';
  await mongoose.connect(dbURI);

  mainWindow = new BrowserWindow({
    width: 1200, height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  const startUrl = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);
  mainWindow.once('ready-to-show', () => mainWindow.show());
};

app.on('ready', createWindow);

app.on('before-quit', () => {
  // Cleanup if needed
});

// IPC Handlers
ipcMain.handle('auth:login', authController.login);
ipcMain.handle('auth:signup', authController.signup);
ipcMain.handle('auth:logout', authController.logout);
ipcMain.handle('auth:google-oauth', async (event, code) => handleGoogleOAuth(code));
ipcMain.handle('auth:github-oauth', async (event, code) => handleGitHubOAuth(code));
ipcMain.handle('user:getDashboardStats', userController.getDashboardData);
ipcMain.handle('user:updateProfile', userController.updateProfile);

// File System
ipcMain.handle('files:readProject', async () => {
  if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });
  const files = fs.readdirSync(projectDir);
  return files.map(file => ({ name: file, path: path.join(projectDir, file) }));
});

ipcMain.handle('files:readFile', async (event, filePath) => {
  return fs.readFileSync(filePath, 'utf-8');
});

ipcMain.handle('files:saveFile', async (event, { filePath, content }) => {
  fs.writeFileSync(filePath, content, 'utf-8');
  return { success: true };
});

// Terminal Execution
ipcMain.handle('terminal:runCode', async (event, { filePath, code }) => {
  return new Promise((resolve) => {
    fs.writeFileSync(filePath, code, 'utf-8');
    const cmd = filePath.endsWith('.py') ? `python "${filePath}"` : `node "${filePath}"`;
    exec(cmd, (error, stdout, stderr) => {
      let output = [];
      if (stdout) output.push(stdout);
      if (stderr) output.push(`❌ ERROR: ${stderr}`);
      if (error && !stderr) output.push(`❌ SYSTEM ERROR: ${error.message}`);
      resolve(output.length ? output : ["Process finished with no output."]);
    });
  });
});

ipcMain.handle('app:info', () => ({ appVersion: app.getVersion(), isDev }));

// Shell - Open External URL
ipcMain.handle('shell:openExternal', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (err) {
    console.error('Error opening external URL:', err);
    return { success: false, msg: err.message };
  }
});

// Auth Code Received from Callback Page
ipcMain.on('auth:code-received', (event, { provider, code }) => {
  console.log(`Auth code received for ${provider}`);
  // Send to main window
  if (mainWindow) {
    mainWindow.webContents.send(`auth:${provider}-callback`, { type: `${provider.toUpperCase()}_AUTH_CODE`, code });
  }
});

// Auth Error Received from Callback Page
ipcMain.on('auth:error-received', (event, { provider, error }) => {
  console.log(`Auth error received for ${provider}:`, error);
  // Send to main window
  if (mainWindow) {
    mainWindow.webContents.send(`auth:${provider}-callback`, { type: 'AUTH_ERROR', error });
  }
});
ipcMain.handle('files:createFile', async (event, { fileName, content }) => {
  const filePath = path.join(projectDir, fileName);
  if (fs.existsSync(filePath)) {
    return { success: false, msg: 'File already exists' };
  }
  fs.writeFileSync(filePath, content || '', 'utf-8');
  return { success: true, path: filePath };
});
// Init Project Folder
if (!fs.existsSync(projectDir)) {
  fs.mkdirSync(projectDir, { recursive: true });
  fs.writeFileSync(path.join(projectDir, 'main.py'), 'print("Hello LumoFlow")');
}