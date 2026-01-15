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
let authWindow;
const projectDir = path.join(require('os').homedir(), 'LumoFlow_Projects');

// Store pending auth callbacks
let pendingAuthCallbacks = {};

// OAuth Handlers using IPC
async function handleGoogleOAuth(code) {
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

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
      devTools: false,
      enableRemoteModule: false,
      sandbox: true,
    },
    show: false,
  });

  // Disable Autofill and other DevTools features
  mainWindow.webContents.session.setDevToolsWebContents(null);
  
  // Disable Autofill protocol
  mainWindow.webContents.session.setSpellCheckerDictionaries([]);

  // Suppress all DevTools protocol warnings
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = function(...args) {
    const message = args[0]?.toString() || '';
    if (message.includes('Autofill') || message.includes("wasn't found")) {
      return;
    }
    originalWarn.apply(console, args);
  };
  
  console.error = function(...args) {
    const message = args[0]?.toString() || '';
    if (message.includes('Autofill') || message.includes("wasn't found")) {
      return;
    }
    originalError.apply(console, args);
  };

  // Suppress DevTools protocol warnings from console
  mainWindow.webContents.on('console-message', (level, message, line, sourceId) => {
    // Suppress Autofill protocol warnings
    if (message.includes('Autofill.enable') || 
        message.includes('Autofill.setAddresses') ||
        message.includes("wasn't found") ||
        message.includes('devtools://devtools')) {
      return; // Suppress these harmless warnings
    }
    // Only log actual errors and important messages
    if (level === 2) { // ERROR level
      console.log(`[ERROR] ${message}`);
    }
  });

  // Handle certificate errors gracefully
  mainWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
    callback(0); // 0 = verification success
  });

  const startUrl = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Handle any uncaught exceptions
  mainWindow.webContents.on('crashed', () => {
    console.error('Renderer process crashed');
    mainWindow.reload();
  });
};

app.on('ready', () => {
  // Disable Autofill at Chromium level
  app.commandLine.appendSwitch('disable-autofill-keyboard-accessory-view');
  app.commandLine.appendSwitch('disable-autofill');
  
  console.log('🚀 App ready - Registering IPC handlers...');
  
  // Suppress Chromium DevTools protocol warnings
  const originalError = console.error;
  console.error = function(...args) {
    const message = args[0]?.toString() || '';
    if (message.includes('Autofill.enable') || 
        message.includes('Autofill.setAddresses') ||
        message.includes("wasn't found")) {
      return; // Suppress these warnings
    }
    originalError.apply(console, args);
  };
  
  try {
    // Register IPC Handlers FIRST
    ipcMain.handle('auth:login', authController.login);
    console.log('✅ Registered: auth:login');
    
    ipcMain.handle('auth:signup', authController.signup);
    console.log('✅ Registered: auth:signup');
    
    ipcMain.handle('auth:logout', authController.logout);
    console.log('✅ Registered: auth:logout');
    
    ipcMain.handle('auth:forgotPassword', authController.forgotPassword);
    console.log('✅ Registered: auth:forgotPassword');
    
    ipcMain.handle('auth:resetPassword', authController.resetPassword);
    console.log('✅ Registered: auth:resetPassword');
    
    ipcMain.handle('auth:google-oauth', async (event, code) => handleGoogleOAuth(code));
    console.log('✅ Registered: auth:google-oauth');
    
    ipcMain.handle('auth:github-oauth', async (event, code) => handleGitHubOAuth(code));
    console.log('✅ Registered: auth:github-oauth');
    
    ipcMain.handle('user:getDashboardStats', userController.getDashboardData);
    console.log('✅ Registered: user:getDashboardStats');
    
    ipcMain.handle('user:updateProfile', userController.updateProfile);
    console.log('✅ Registered: user:updateProfile');

    // File System
    ipcMain.handle('files:readProject', async () => {
      if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });
      const files = fs.readdirSync(projectDir);
      return files.map(file => ({ name: file, path: path.join(projectDir, file) }));
    });
    console.log('✅ Registered: files:readProject');

    ipcMain.handle('files:createFile', async (event, { fileName, content }) => {
      try {
        const filePath = path.join(projectDir, fileName);
        if (fs.existsSync(filePath)) return { success: false, msg: 'File exists' };
        fs.writeFileSync(filePath, content || '', 'utf-8');
        return { success: true, path: filePath };
      } catch (err) {
        return { success: false, msg: err.message };
      }
    });
    console.log('✅ Registered: files:createFile');

    ipcMain.handle('files:readFile', async (event, filePath) => {
      return fs.readFileSync(filePath, 'utf-8');
    });
    console.log('✅ Registered: files:readFile');

    ipcMain.handle('files:saveFile', async (event, { filePath, content }) => {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    });
    console.log('✅ Registered: files:saveFile');

    ipcMain.handle('files:deleteFile', async (event, filePath) => {
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          if (stats.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
          return { success: true };
        }
        return { success: false, msg: 'File not found' };
      } catch (err) {
        return { success: false, msg: err.message };
      }
    });
    console.log('✅ Registered: files:deleteFile');

    ipcMain.handle('files:renameFile', async (event, oldPath, newName) => {
      try {
        const dir = path.dirname(oldPath);
        const newPath = path.join(dir, newName);
        fs.renameSync(oldPath, newPath);
        return { success: true, path: newPath };
      } catch (err) {
        return { success: false, msg: err.message };
      }
    });
    console.log('✅ Registered: files:renameFile');

    ipcMain.handle('files:createFolder', async (event, folderName) => {
      try {
        const folderPath = path.join(projectDir, folderName);
        if (fs.existsSync(folderPath)) return { success: false, msg: 'Folder exists' };
        fs.mkdirSync(folderPath, { recursive: true });
        return { success: true, path: folderPath };
      } catch (err) {
        return { success: false, msg: err.message };
      }
    });
    console.log('✅ Registered: files:createFolder');

    // Terminal Execution
    ipcMain.handle('terminal:runCode', async (event, { filePath, code }) => {
      return new Promise((resolve) => {
        fs.writeFileSync(filePath, code, 'utf-8');
        
        let cmd;
        if (filePath.endsWith('.js')) {
          cmd = `node "${filePath}"`;
        } else if (filePath.endsWith('.py')) {
          cmd = `python "${filePath}"`;
        } else {
          cmd = `node "${filePath}"`;
        }
        
        const stripAnsi = (str) => {
          return str.replace(/\x1B\[[0-9;]*m/g, '');
        };
        
        const timeout = 30000;
        const child = exec(cmd, { 
          timeout: timeout,
          maxBuffer: 10 * 1024 * 1024
        }, (error, stdout, stderr) => {
          let output = [];
          
          if (stdout) {
            const cleanStdout = stripAnsi(stdout);
            output.push(...cleanStdout.split('\n').filter(line => line.trim()));
          }
          
          if (stderr) {
            const cleanStderr = stripAnsi(stderr);
            output.push(`❌ ERROR: ${cleanStderr}`);
          }
          
          if (error) {
            if (error.killed) {
              output.push(`❌ TIMEOUT: Process exceeded ${timeout}ms`);
            } else if (!stderr) {
              output.push(`❌ SYSTEM ERROR: ${error.message}`);
            }
          }
          
          resolve(output.length ? output : ["Process finished with no output."]);
        });
        
        child.on('error', (err) => {
          resolve([`❌ EXECUTION ERROR: ${err.message}`]);
        });
      });
    });
    console.log('✅ Registered: terminal:runCode');

    ipcMain.handle('app:info', () => ({ appVersion: app.getVersion(), isDev }));
    console.log('✅ Registered: app:info');

    ipcMain.handle('shell:openExternal', async (event, url) => {
      try {
        await shell.openExternal(url);
        return { success: true };
      } catch (err) {
        console.error('Error opening external URL:', err);
        return { success: false, msg: err.message };
      }
    });
    console.log('✅ Registered: shell:openExternal');

    console.log('✅ All IPC handlers registered successfully!');
  } catch (err) {
    console.error('❌ Error registering IPC handlers:', err);
  }

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });

  // Start local server to handle OAuth callbacks
  const http = require('http');
  const url = require('url');
  
  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;
    
    // Handle Google callback
    if (pathname === '/auth/google/callback') {
      const code = query.code;
      const error = query.error;
      
      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Authentication Failed</h1><p>You can close this window.</p>');
        if (mainWindow) mainWindow.webContents.send('auth:google-error', { error });
      } else if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Authentication Successful</h1><p>You can close this window and return to the app.</p>');
        if (mainWindow) mainWindow.webContents.send('auth:google-code', { code });
      }
    }
    // Handle GitHub callback
    else if (pathname === '/auth/github/callback') {
      const code = query.code;
      const error = query.error;
      
      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Authentication Failed</h1><p>You can close this window.</p>');
        if (mainWindow) mainWindow.webContents.send('auth:github-error', { error });
      } else if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Authentication Successful</h1><p>You can close this window and return to the app.</p>');
        if (mainWindow) mainWindow.webContents.send('auth:github-code', { code });
      }
    }
    else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
  
  server.listen(3000, () => {
    console.log('OAuth callback server listening on http://localhost:3000');
  });
  
  createWindow();
});

app.on('before-quit', () => {
  // Cleanup if needed
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

// Init Project Folder
if (!fs.existsSync(projectDir)) {
  fs.mkdirSync(projectDir, { recursive: true });
  fs.writeFileSync(path.join(projectDir, 'main.py'), 'print("Hello LumoFlow")');
  fs.writeFileSync(path.join(projectDir, 'hello.js'), `console.log("Hello from LumoFlow!");
console.log("JavaScript execution is working!");
console.log("Try running this file to see the output.");`);
}

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

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