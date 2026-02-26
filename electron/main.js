const { app, BrowserWindow, ipcMain, shell, protocol, dialog } = require('electron');
const url = require('url');
const isDev = require('electron-is-dev');
const isProd = process.env.NODE_ENV === 'production' || app.isPackaged;
const actualIsDev = isDev && !isProd && !app.isPackaged;
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const userController = require('./controllers/userController');
const authController = require('./controllers/authController');
const codeController = require('./controllers/codeController');
const analysisController = require('./controllers/analysisController');
const visualizationController = require('./controllers/visualizationController');
const copilotController = require('./controllers/copilotController');
const voiceController = require('./controllers/voiceController');
const geminiController = require('./controllers/geminiController');
const logPath = path.join(require('os').homedir(), 'lumoflow-debug.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(logPath, line);
  } catch (e) {
    // Fallback to original write sync if possible
    process.stderr.write('Logging failed: ' + e.message + '\n');
  }
}
fs.writeFileSync(logPath, '--- APP STARTUP ---\n');

// 🟢 OVERRIDE CONSOLE GLOBALLY
const originalLog = console.log;
const originalError = console.error;

console.log = function (...args) {
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  log(msg);
  originalLog.apply(console, args);
};

console.error = function (...args) {
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  log('❌ ERROR: ' + msg);
  originalError.apply(console, args);
};

// Load environment variables
const envPath = app.isPackaged
  ? path.join(path.dirname(process.execPath), '.env')
  : path.join(__dirname, '../.env');

require('dotenv').config({ path: envPath });
console.log(`📂 Loading .env from: ${envPath}`);
if (!fs.existsSync(envPath)) {
  console.log(`⚠️ .env file NOT FOUND at ${envPath}`);
}

console.log("--- STARTUP CHECK ---");
console.log("Check: Token exists? " + !!process.env.GITHUB_TOKEN);
console.log("---------------------");

let mainWindow;
let authWindow;
let projectDir = path.join(require('os').homedir(), 'LumoFlow_Projects');
const windowWorkspaces = new Map();

// Scoped Storage: Helper to resolve and validate paths within projectDir
function resolveSafePath(providedPath) {
  if (!providedPath) return projectDir;

  // Normalize provided path
  const normalizedProvided = path.normalize(providedPath);

  // Resolve to absolute
  const absolutePath = path.isAbsolute(normalizedProvided)
    ? normalizedProvided
    : path.join(projectDir, normalizedProvided);

  const finalPath = path.normalize(absolutePath);

  // DISABLED: Allow access to any path (not just sandboxed workspace)
  // This allows users to open any folder on their system
  return finalPath;
}

// Ensure sandbox exists
if (!fs.existsSync(projectDir)) {
  fs.mkdirSync(projectDir, { recursive: true });
}

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

    // Return both the app result and the GitHub token
    return {
      ...result,
      githubAccessToken: accessToken
    };
  } catch (err) {
    console.error("GitHub OAuth error:", err.message);
    return { success: false, msg: "GitHub authentication failed: " + err.message };
  }
}

const createWindow = async () => {
  const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/lumoflow';
  console.log('🔌 Connecting to MongoDB...');
  mongoose.connect(dbURI).then(() => {
    console.log('✅ Connected to MongoDB at ' + dbURI.split('@').pop());
  }).catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
  });

  const newWindow = new BrowserWindow({
    width: 1200, height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: true, // Temporarily enabled for debugging production blank screen
      enableRemoteModule: false,
      sandbox: false,
      webSecurity: false // Temporarily disabled for better debugging
    },
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false,
  });

  // Initialize workspace for this window (default to LumoFlow_Projects)
  windowWorkspaces.set(newWindow.id, projectDir);

  // Clean up workspace when window is closed
  newWindow.on('closed', () => {
    windowWorkspaces.delete(newWindow.id);
  });

  // Set as mainWindow if it's the first window
  if (!mainWindow) {
    mainWindow = newWindow;
  }

  // Suppress all DevTools protocol warnings
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = function (...args) {
    const message = args[0]?.toString() || '';
    if (message.includes('Autofill') || message.includes("wasn't found")) {
      return;
    }
    originalWarn.apply(console, args);
  };

  console.error = function (...args) {
    const message = args[0]?.toString() || '';
    if (message.includes('Autofill') || message.includes("wasn't found")) {
      return;
    }
    originalError.apply(console, args);
  };

  // Suppress DevTools protocol warnings from console
  // Removed problematic console-message handler - it was causing crashes in newer Electron versions

  // Handle certificate errors gracefully
  newWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
    callback(0); // 0 = verification success
  });

  // LOG LOAD FAILURES
  newWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    log(`❌ LOAD FAILED: ${errorDescription} (${errorCode})`);
    log(`Target URL: ${validatedURL}`);
  });

  if (actualIsDev) {
    log('🌐 Loading development URL: http://localhost:5173');
    newWindow.loadURL('http://localhost:5173');
  } else {
    // Standard Electron production path resolution
    const appPath = app.getAppPath();
    log('📦 App Path Contents: ' + fs.readdirSync(appPath).join(', '));
    try {
      if (fs.existsSync(path.join(appPath, 'dist'))) {
        log('📦 Dist Folder Contents: ' + fs.readdirSync(path.join(appPath, 'dist')).join(', '));
      }
    } catch (e) { }

    const indexPath = path.join(appPath, 'dist', 'index.html');

    log('📦 App Path: ' + appPath);
    log('📄 Target Path: ' + indexPath);

    if (fs.existsSync(indexPath)) {
      const formattedUrl = url.format({
        pathname: indexPath,
        protocol: 'file:',
        slashes: true
      });
      log('🚀 Loading URL: ' + formattedUrl);
      newWindow.loadURL(formattedUrl);
    } else {
      log('❌ index.html NOT FOUND at: ' + indexPath);
      // Fallback check
      const fallback = path.join(__dirname, '..', 'dist', 'index.html');
      if (fs.existsSync(fallback)) {
        log('🔄 Fallback found: ' + fallback);
        newWindow.loadFile(fallback);
      } else {
        const errorHtml = `<html><body style="background:#1e1e1e;color:white;padding:20px;"><h1>Fatal Error</h1><p>index.html not found.<br>Checked: ${indexPath}<br>Checked: ${fallback}</p></body></html>`;
        newWindow.loadURL(`data:text/html,${errorHtml}`);
      }
    }
  }

  newWindow.once('ready-to-show', () => {
    console.log('✨ Window ready to show');
    newWindow.show();
  });

  // Handle any uncaught exceptions
  newWindow.webContents.on('crashed', () => {
    console.error('Renderer process crashed');
    newWindow.reload();
  });

  return newWindow;
};

app.on('ready', () => {
  // Grant microphone permissions automatically
  // Inside app.on('ready', ...)
  const { session } = require('electron');
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'audioCapture', 'notifications'];
    if (allowedPermissions.includes(permission)) {
      callback(true); // Automatically approve microphone
    } else {
      callback(false);
    }
  });

  // Disable Autofill at Chromium level
  app.commandLine.appendSwitch('disable-autofill-keyboard-accessory-view');
  app.commandLine.appendSwitch('disable-autofill');
  // Recognition requires certain flags sometimes
  app.commandLine.appendSwitch('enable-speech-input');

  console.log('🚀 App ready - Registering IPC handlers...');

  // Re-import dialog to ensure it's available in this scope
  const { dialog: electronDialog } = require('electron');

  // Suppress Chromium DevTools protocol warnings
  const originalError = console.error;
  console.error = function (...args) {
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

    ipcMain.handle('voice:transcribe', async (event, base64Audio) => {
      try {
        return await voiceController.transcribeAudio(base64Audio);
      } catch (err) {
        console.error('❌ Voice transcription failed:', err.message);
        return '';
      }
    });
    console.log('✅ Registered: voice:transcribe');

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

    ipcMain.handle('user:updateStats', userController.updateStats);
    console.log('✅ Registered: user:updateStats');

    ipcMain.handle('user:addActivity', userController.addActivity);
    console.log('✅ Registered: user:addActivity');

    ipcMain.handle('user:saveGameProgress', userController.saveGameProgress);
    console.log('✅ Registered: user:saveGameProgress');

    // Visualizations
    ipcMain.handle('viz:save', visualizationController.saveVisualization);
    console.log('✅ Registered: viz:save');

    ipcMain.handle('viz:getAll', visualizationController.getUserVisualizations);
    console.log('✅ Registered: viz:getAll');

    ipcMain.handle('viz:get', visualizationController.getVisualization);
    console.log('✅ Registered: viz:get');

    ipcMain.handle('viz:delete', visualizationController.deleteVisualization);
    console.log('✅ Registered: viz:delete');



    // File System
    ipcMain.handle('files:readProject', async () => {
      const results = [];

      // Helper function to scan folders deep
      function scanDir(currentPath, parentFolder = null) {
        if (!fs.existsSync(currentPath)) return;
        const items = fs.readdirSync(currentPath);

        items.forEach(name => {
          const fullPath = path.join(currentPath, name);
          const isFolder = fs.statSync(fullPath).isDirectory();

          results.push({
            name,
            path: fullPath,
            isFolder,
            parentFolder // This links children to their folders
          });

          if (isFolder) {
            scanDir(fullPath, fullPath);
          }
        });
      }

      scanDir(projectDir);
      return results;
    });

    ipcMain.handle('files:createFile', async (event, { fileName, content }) => {
      try {
        // Normalize the file path to handle both forward and back slashes
        const normalizedFileName = fileName.replace(/\\/g, '/');
        const filePath = resolveSafePath(normalizedFileName);

        // Create parent directory if it doesn't exist
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        if (fs.existsSync(filePath)) return { success: false, msg: 'File exists' };
        fs.writeFileSync(filePath, content || '', 'utf-8');
        return { success: true, path: filePath };
      } catch (err) {
        return { success: false, msg: err.message };
      }
    });
    console.log('✅ Registered: files:createFile');

    ipcMain.handle('files:readFile', async (event, filePath) => {
      try {
        const safePath = resolveSafePath(filePath);
        const stats = fs.statSync(safePath);
        if (stats.isDirectory()) {
          return { success: false, msg: 'Path is a directory, not a file' };
        }
        const content = fs.readFileSync(safePath, 'utf-8');
        return { success: true, content };
      } catch (err) {
        return { success: false, msg: err.message };
      }
    });
    console.log('✅ Registered: files:readFile');

    ipcMain.handle('files:saveFile', async (event, { filePath, content }) => {
      try {
        const safePath = resolveSafePath(filePath);
        fs.writeFileSync(safePath, content, 'utf-8');
        return { success: true };
      } catch (err) {
        console.error('Error saving file:', err);
        return { success: false, msg: err.message };
      }
    });
    console.log('✅ Registered: files:saveFile');

    ipcMain.handle('files:saveAtomic', async (event, { filePath, content, userId }) => {
      try {
        const safePath = resolveSafePath(filePath);
        // 1. Save to Disk
        fs.writeFileSync(safePath, content, 'utf-8');

        // 2. Save to Database (if userId provided)
        let dbResult = { success: true, msg: 'No userId, skipped DB save' };
        if (userId) {
          dbResult = await codeController.saveCodeToDatabase(event, { filePath, content, userId });
        }

        return {
          success: true,
          disk: true,
          database: dbResult.success,
          dbMsg: dbResult.msg
        };
      } catch (err) {
        console.error('Atomic save error:', err);
        return { success: false, msg: err.message };
      }
    });
    console.log('✅ Registered: files:saveAtomic');

    ipcMain.handle('files:deleteFile', async (event, filePath) => {
      try {
        const safePath = resolveSafePath(filePath);
        if (fs.existsSync(safePath)) {
          const stats = fs.statSync(safePath);
          if (stats.isDirectory()) {
            fs.rmSync(safePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(safePath);
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
        const safeOldPath = resolveSafePath(oldPath);
        const dir = path.dirname(safeOldPath);
        const safeNewPath = resolveSafePath(path.join(dir, newName));

        fs.renameSync(safeOldPath, safeNewPath);
        return { success: true, newPath: safeNewPath };
      } catch (err) {
        return { success: false, msg: err.message };
      }
    });
    console.log('✅ Registered: files:renameFile');

    ipcMain.handle('files:moveFile', async (event, oldPath, newPath) => {
      console.log(`📦 Move file request: ${oldPath} → ${newPath}`);
      try {
        const safeOldPath = resolveSafePath(oldPath);
        const safeNewPath = resolveSafePath(newPath);

        // Check if source file exists
        if (!fs.existsSync(safeOldPath)) {
          console.error(`❌ Source file not found: ${safeOldPath}`);
          return { success: false, msg: 'Source file not found' };
        }

        // Ensure the target directory exists
        const targetDir = path.dirname(safeNewPath);
        if (!fs.existsSync(targetDir)) {
          console.log(`📁 Creating target directory: ${targetDir}`);
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // Check if target file already exists
        if (fs.existsSync(safeNewPath)) {
          console.error(`❌ Target file already exists: ${safeNewPath}`);
          return { success: false, msg: 'Target file already exists' };
        }

        // Move the file
        fs.renameSync(safeOldPath, safeNewPath);
        console.log(`✅ Moved file successfully: ${safeOldPath} → ${safeNewPath}`);
        return { success: true, newPath: safeNewPath };
      } catch (err) {
        console.error('❌ Move file error:', err);
        return { success: false, msg: err.message };
      }
    });
    console.log('✅ Registered: files:moveFile');


    ipcMain.handle('files:createFolder', async (event, folderName) => {
      try {
        const folderPath = resolveSafePath(folderName);
        if (fs.existsSync(folderPath)) return { success: false, msg: 'Folder exists' };
        fs.mkdirSync(folderPath, { recursive: true });
        return { success: true, path: folderPath };
      } catch (err) {
        return { success: false, msg: err.message };
      }
    });
    console.log('✅ Registered: files:createFolder');

    // Global Search Handler
    ipcMain.handle('files:search', async (event, { query, rootPath }) => {
      const results = [];
      const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.venv', '__pycache__']);
      const lowerQuery = query.toLowerCase();

      function searchDir(dir) {
        try {
          if (!fs.existsSync(dir)) return;
          const items = fs.readdirSync(dir);

          for (const item of items) {
            if (ignoreDirs.has(item)) continue;

            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            const isFolder = stat.isDirectory();

            // 1. Check if the name matches (File or Folder)
            if (item.toLowerCase().includes(lowerQuery)) {
              results.push({
                filePath: fullPath,
                line: 0, // Special line for name match
                preview: isFolder ? `📁 Folder: ${item}` : `📄 File: ${item}`,
                isNameMatch: true
              });
            }

            if (isFolder) {
              searchDir(fullPath);
            } else {
              // 2. Search inside file content
              try {
                // Only search content if query is at least 2 chars to avoid massive results
                if (lowerQuery.length >= 2) {
                  const content = fs.readFileSync(fullPath, 'utf-8');
                  const lines = content.split('\n');

                  lines.forEach((line, index) => {
                    if (line.toLowerCase().includes(lowerQuery)) {
                      results.push({
                        filePath: fullPath,
                        line: index + 1,
                        preview: line.trim().substring(0, 100),
                        isNameMatch: false
                      });
                    }
                  });
                }
              } catch (e) {
                // Skip binary files
              }
            }
          }
        } catch (err) {
          console.error('Search error:', err);
        }
      }

      if (query && rootPath) {
        try {
          const safeRoot = resolveSafePath(rootPath);
          searchDir(safeRoot);
        } catch (e) {
          console.error('Search aborted:', e.message);
        }
      }

      // Sort: Name matches first, then content matches
      return results.sort((a, b) => {
        if (a.isNameMatch && !b.isNameMatch) return -1;
        if (!a.isNameMatch && b.isNameMatch) return 1;
        return 0;
      });
    });
    console.log('✅ Registered: files:search');

    // Terminal Execution
    // --- REPLACE YOUR EXISTING terminal:runCode WITH THIS BLOCK ---

    ipcMain.handle('terminal:runCode', async (event, { filePath, code }) => {
      return new Promise((resolve) => {
        // Save file
        const safePath = resolveSafePath(filePath);

        // Save file first
        try {
          fs.writeFileSync(safePath, code, 'utf-8');
        } catch (e) {
          return resolve({ stdout: "", stderr: `Save Error: ${e.message}` });
        }

        let cmd;
        if (safePath.endsWith('.js') || safePath.endsWith('.mjs') || safePath.endsWith('.cjs')) {
          cmd = `node "${safePath}"`;
        } else if (safePath.endsWith('.ts') || safePath.endsWith('.tsx')) {
          // Attempt to run with ts-node if available, otherwise fallback to node
          cmd = `npx ts-node "${safePath}" || node "${safePath}"`;
        } else if (safePath.endsWith('.py')) {
          cmd = `python "${safePath}"`;
        } else {
          return resolve({ stdout: "", stderr: "❌ Unsupported file type. LumoFlow supports .js, .mjs, .cjs, .ts, and .py" });
        }

        const child = exec(cmd, {
          timeout: 10000,
          maxBuffer: 5 * 1024 * 1024
        }, (error, stdout, stderr) => {

          // Function to strip ANSI escape sequences (comprehensive pattern)
          const stripAnsi = (str) => {
            return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
          };

          // Clean stdout - remove ANSI codes and system messages
          let cleanStdout = stdout || "";
          if (cleanStdout) {
            cleanStdout = stripAnsi(cleanStdout).trim();
          }

          // Clean stderr - remove ANSI codes but keep error messages for problem parsing
          let cleanStderr = stderr || "";
          if (cleanStderr) {
            cleanStderr = stripAnsi(cleanStderr);
          }
          if (error && !stderr) {
            cleanStderr = stripAnsi(error.message);
          }

          resolve({
            stdout: cleanStdout,
            stderr: cleanStderr
          });
        });
      });
    });
    // 2. Interactive Terminal: Handles commands like 'ls', 'mkdir', 'git'
    ipcMain.handle('terminal:executeCommand', async (event, command) => {
      return new Promise((resolve) => {
        // Execute command in the Project Directory
        exec(command, { cwd: projectDir }, (error, stdout, stderr) => {
          // Function to strip ANSI escape sequences (comprehensive pattern)
          const stripAnsi = (str) => {
            return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
          };

          // Combine outputs for the interactive terminal view
          let output = stdout ? stripAnsi(stdout) : '';
          if (stderr) output += `\n${stripAnsi(stderr)}`;
          if (error) output += `\nError: ${stripAnsi(error.message)}`;
          resolve(output || "");
        });
      });
    });
    ipcMain.handle('files:getWorkspace', () => {
      return {
        path: projectDir,
        name: path.basename(projectDir)
      };
    });
    console.log('✅ Registered: files:getWorkspace');

    // Set workspace directory (for persistence)
    ipcMain.handle('files:setWorkspace', (event, workspacePath) => {
      try {
        if (fs.existsSync(workspacePath)) {
          projectDir = workspacePath;
          console.log('📁 Workspace updated to:', projectDir);
          return { success: true, path: projectDir };
        }
        return { success: false, error: 'Path does not exist' };
      } catch (err) {
        return { success: false, error: err.message };
      }
    });
    console.log('✅ Registered: files:setWorkspace');

    // Window Controls - Use BrowserWindow.getFocusedWindow() to get current window
    ipcMain.handle('window:minimize', (event) => {
      console.log('🔵 window:minimize handler called');
      try {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) {
          console.log('🔵 Attempting to minimize window...');
          win.minimize();
          console.log('✅ Window minimized successfully');
          return { success: true };
        } else {
          console.log('❌ Window is null or destroyed');
          return { success: false, error: 'Window not found' };
        }
      } catch (error) {
        console.error('❌ Window minimize error:', error);
        return { success: false, error: error.message };
      }
    });
    console.log('✅ Registered: window:minimize');

    ipcMain.handle('window:maximize', (event) => {
      try {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) {
          if (win.isMaximized()) {
            win.unmaximize();
          } else {
            win.maximize();
          }
          return { success: true };
        } else {
          return { success: false, error: 'Window not found' };
        }
      } catch (error) {
        console.error('Window maximize error:', error);
        return { success: false, error: error.message };
      }
    });
    console.log('✅ Registered: window:maximize');

    ipcMain.handle('window:close', (event) => {
      try {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) {
          win.close();
          return { success: true };
        } else {
          return { success: false, error: 'Window not found' };
        }
      } catch (error) {
        console.error('Window close error:', error);
        return { success: false, error: error.message };
      }
    });
    console.log('✅ Registered: window:close');


    // Code Management Handlers
    ipcMain.handle('code:saveToDatabase', codeController.saveCodeToDatabase);
    console.log('✅ Registered: code:saveToDatabase');

    ipcMain.handle('code:loadUserProjects', codeController.loadUserProjects);
    console.log('✅ Registered: code:loadUserProjects');

    ipcMain.handle('code:loadFileFromDatabase', codeController.loadFileFromDatabase);
    console.log('✅ Registered: code:loadFileFromDatabase');

    ipcMain.handle('code:deleteFileFromDatabase', codeController.deleteFileFromDatabase);
    console.log('✅ Registered: code:deleteFileFromDatabase');

    ipcMain.handle('code:createProject', codeController.createProject);
    console.log('✅ Registered: code:createProject');

    // Analysis Handlers
    ipcMain.handle('analysis:analyzeCode', analysisController.analyzeCode);
    console.log('✅ Registered: analysis:analyzeCode');

    ipcMain.handle('analysis:getHistory', analysisController.getAnalysisHistory);
    console.log('✅ Registered: analysis:getHistory');

    // Git/GitHub Handlers
    ipcMain.handle('git:status', async (event, repoPath) => {
      return new Promise((resolve) => {
        try {
          const safePath = resolveSafePath(repoPath);
          exec('git status --porcelain', { cwd: safePath }, (error, stdout, stderr) => {
            if (error) {
              resolve({ success: false, error: stderr || error.message });
            } else {
              const changes = stdout.split('\n').filter(line => line.trim()).map(line => {
                const status = line.substring(0, 2).trim();
                const file = line.substring(3);
                return { status, file };
              });
              resolve({ success: true, changes });
            }
          });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });
    console.log('✅ Registered: git:status');

    ipcMain.handle('git:branch', async (event, repoPath) => {
      return new Promise((resolve) => {
        try {
          const safePath = resolveSafePath(repoPath);
          exec('git branch --show-current', { cwd: safePath }, (error, stdout, stderr) => {
            if (error) {
              resolve({ success: false, error: stderr || error.message, branch: 'main' });
            } else {
              resolve({ success: true, branch: stdout.trim() || 'main' });
            }
          });
        } catch (e) {
          resolve({ success: false, error: e.message, branch: 'main' });
        }
      });
    });
    console.log('✅ Registered: git:branch');

    ipcMain.handle('git:branches', async (event, repoPath) => {
      return new Promise((resolve) => {
        try {
          const safePath = resolveSafePath(repoPath);
          exec('git branch -a', { cwd: safePath }, (error, stdout, stderr) => {
            if (error) {
              resolve({ success: false, error: stderr || error.message, branches: [] });
            } else {
              const branches = stdout.split('\n')
                .filter(line => line.trim())
                .map(line => ({
                  name: line.replace('*', '').trim(),
                  current: line.startsWith('*')
                }));
              resolve({ success: true, branches });
            }
          });
        } catch (e) {
          resolve({ success: false, error: e.message, branches: [] });
        }
      });
    });
    console.log('✅ Registered: git:branches');

    ipcMain.handle('git:init', async (event, repoPath) => {
      return new Promise((resolve) => {
        try {
          const safePath = resolveSafePath(repoPath);
          exec('git init', { cwd: safePath }, (error, stdout, stderr) => {
            if (error) {
              resolve({ success: false, error: stderr || error.message });
            } else {
              resolve({ success: true, message: 'Repository initialized' });
            }
          });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });
    console.log('✅ Registered: git:init');

    ipcMain.handle('git:clone', async (event, { url, targetPath }) => {
      return new Promise((resolve) => {
        const clonePath = targetPath || projectDir;
        exec(`git clone ${url}`, { cwd: clonePath }, (error, stdout, stderr) => {
          if (error) {
            resolve({ success: false, error: stderr || error.message });
          } else {
            // Extract repo name from URL and update projectDir to the cloned folder
            const repoName = url.split('/').pop()?.replace('.git', '');
            if (repoName) {
              const newProjectDir = path.join(clonePath, repoName);
              projectDir = newProjectDir;
              console.log('📁 Updated projectDir after clone:', projectDir);
            }
            resolve({ success: true, message: 'Repository cloned successfully' });
          }
        });
      });
    });
    console.log('✅ Registered: git:clone');

    ipcMain.handle('git:add', async (event, { files, repoPath }) => {
      return new Promise((resolve) => {
        try {
          const safePath = resolveSafePath(repoPath);
          const fileList = files.join(' ');
          exec(`git add ${fileList}`, { cwd: safePath }, (error, stdout, stderr) => {
            if (error) {
              resolve({ success: false, error: stderr || error.message });
            } else {
              resolve({ success: true, message: 'Files staged' });
            }
          });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });
    console.log('✅ Registered: git:add');

    ipcMain.handle('git:commit', async (event, { message, repoPath }) => {
      return new Promise((resolve) => {
        try {
          const safePath = resolveSafePath(repoPath);
          exec(`git commit -m "${message}"`, { cwd: safePath }, (error, stdout, stderr) => {
            if (error) {
              resolve({ success: false, error: stderr || error.message });
            } else {
              resolve({ success: true, message: 'Changes committed' });
            }
          });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });
    console.log('✅ Registered: git:commit');

    ipcMain.handle('git:push', async (event, { remote, branch, repoPath, token }) => {
      return new Promise((resolve) => {
        try {
          const safePath = resolveSafePath(repoPath);
          const targetRemote = remote || 'origin';
          const targetBranch = branch || '';

          // First get the current branch if not specified
          const getBranch = targetBranch
            ? Promise.resolve(targetBranch)
            : new Promise((res) => {
              exec('git branch --show-current', { cwd: safePath }, (err, stdout) => {
                const detected = stdout?.trim();
                if (detected) {
                  res(detected);
                } else {
                  // Fallback: try symbolic-ref for detached HEAD or older git
                  exec('git rev-parse --abbrev-ref HEAD', { cwd: safePath }, (err2, stdout2) => {
                    res(stdout2?.trim() || 'HEAD');
                  });
                }
              });
            });

          getBranch.then((branchName) => {
            // If token provided, temporarily set credential helper to inject token
            const pushWithAuth = () => {
              if (token) {
                // Get remote URL and inject token
                exec(`git remote get-url ${targetRemote}`, { cwd: safePath }, (err, remoteUrl) => {
                  if (err) {
                    resolve({ success: false, error: 'Could not get remote URL: ' + (err.message || '') });
                    return;
                  }
                  const url = remoteUrl.trim();
                  let authUrl = url;
                  // Inject token into HTTPS URL
                  if (url.startsWith('https://')) {
                    // Strip any existing credentials from URL first
                    const cleanUrl = url.replace(/https:\/\/[^@]+@/, 'https://');
                    authUrl = cleanUrl.replace('https://', `https://${token}@`);
                  }

                  const cmd = `git push -u "${authUrl}" ${branchName}`;
                  console.log(`Executing git push with token auth to branch: ${branchName}`);

                  exec(cmd, { cwd: safePath, timeout: 60000 }, (error, stdout, stderr) => {
                    if (error) {
                      // Clean token from error messages
                      const cleanError = (stderr || error.message || '').replace(new RegExp(token, 'g'), '***');
                      resolve({ success: false, error: cleanError });
                    } else {
                      resolve({ success: true, message: 'Changes pushed to remote' });
                    }
                  });
                });
              } else {
                // No token - use system Git credential manager
                const cmd = `git push -u ${targetRemote} ${branchName}`;
                console.log(`Executing: ${cmd}`);

                exec(cmd, { cwd: safePath, timeout: 60000 }, (error, stdout, stderr) => {
                  if (error) {
                    resolve({ success: false, error: stderr || error.message });
                  } else {
                    resolve({ success: true, message: 'Changes pushed to remote' });
                  }
                });
              }
            };

            pushWithAuth();
          });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });

    ipcMain.handle('git:pull', async (event, { remote, branch, repoPath, token }) => {
      return new Promise((resolve) => {
        try {
          const safePath = resolveSafePath(repoPath);
          const targetRemote = remote || 'origin';
          const targetBranch = branch || '';

          // First get the current branch if not specified
          const getBranch = targetBranch
            ? Promise.resolve(targetBranch)
            : new Promise((res) => {
              exec('git branch --show-current', { cwd: safePath }, (err, stdout) => {
                const detected = stdout?.trim();
                if (detected) {
                  res(detected);
                } else {
                  exec('git rev-parse --abbrev-ref HEAD', { cwd: safePath }, (err2, stdout2) => {
                    res(stdout2?.trim() || 'HEAD');
                  });
                }
              });
            });

          getBranch.then((branchName) => {
            if (token) {
              // Get remote URL and inject token
              exec(`git remote get-url ${targetRemote}`, { cwd: safePath }, (err, remoteUrl) => {
                if (err) {
                  resolve({ success: false, error: 'Could not get remote URL: ' + (err.message || '') });
                  return;
                }
                const url = remoteUrl.trim();
                let authUrl = url;
                if (url.startsWith('https://')) {
                  const cleanUrl = url.replace(/https:\/\/[^@]+@/, 'https://');
                  authUrl = cleanUrl.replace('https://', `https://${token}@`);
                }

                const cmd = `git pull "${authUrl}" ${branchName}`;
                console.log(`Executing git pull with token auth from branch: ${branchName}`);

                exec(cmd, { cwd: safePath, timeout: 60000 }, (error, stdout, stderr) => {
                  if (error) {
                    const cleanError = (stderr || error.message || '').replace(new RegExp(token, 'g'), '***');
                    resolve({ success: false, error: cleanError });
                  } else {
                    resolve({ success: true, message: 'Changes pulled from remote' });
                  }
                });
              });
            } else {
              const cmd = `git pull ${targetRemote} ${branchName}`;
              console.log(`Executing: ${cmd}`);

              exec(cmd, { cwd: safePath, timeout: 60000 }, (error, stdout, stderr) => {
                if (error) {
                  resolve({ success: false, error: stderr || error.message });
                } else {
                  resolve({ success: true, message: 'Changes pulled from remote' });
                }
              });
            }
          });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });

    // Ahead/Behind tracking
    ipcMain.handle('git:ahead-behind', async (event, { repoPath }) => {
      return new Promise((resolve) => {
        try {
          const safePath = resolveSafePath(repoPath);
          // First fetch to update remote tracking refs (silent)
          exec('git fetch --quiet 2>&1 || true', { cwd: safePath, timeout: 15000 }, () => {
            // Then check ahead/behind
            exec('git rev-list --left-right --count HEAD...@{upstream} 2>&1', { cwd: safePath }, (error, stdout) => {
              if (error || !stdout.trim()) {
                // No upstream or error - just return 0s
                resolve({ success: true, ahead: 0, behind: 0 });
              } else {
                const parts = stdout.trim().split(/\s+/);
                resolve({
                  success: true,
                  ahead: parseInt(parts[0]) || 0,
                  behind: parseInt(parts[1]) || 0
                });
              }
            });
          });
        } catch (e) {
          resolve({ success: true, ahead: 0, behind: 0 });
        }
      });
    });
    console.log('✅ Registered: git:ahead-behind');

    // Stage individual file
    ipcMain.handle('git:stageFile', async (event, { file, repoPath }) => {
      return new Promise((resolve) => {
        try {
          const safePath = resolveSafePath(repoPath);
          exec(`git add -- "${file}"`, { cwd: safePath }, (error, stdout, stderr) => {
            if (error) {
              resolve({ success: false, error: stderr || error.message });
            } else {
              resolve({ success: true, message: 'File staged' });
            }
          });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });
    console.log('✅ Registered: git:stageFile');

    // Unstage individual file
    ipcMain.handle('git:unstageFile', async (event, { file, repoPath }) => {
      return new Promise((resolve) => {
        try {
          const safePath = resolveSafePath(repoPath);
          exec(`git reset HEAD -- "${file}"`, { cwd: safePath }, (error, stdout, stderr) => {
            if (error) {
              resolve({ success: false, error: stderr || error.message });
            } else {
              resolve({ success: true, message: 'File unstaged' });
            }
          });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });
    console.log('✅ Registered: git:unstageFile');

    // Discard changes to individual file
    ipcMain.handle('git:discardFile', async (event, { file, repoPath }) => {
      return new Promise((resolve) => {
        try {
          const safePath = resolveSafePath(repoPath);
          // For untracked files, remove them; for modified, checkout
          exec(`git checkout -- "${file}" 2>&1 || git clean -fd -- "${file}"`, { cwd: safePath }, (error, stdout, stderr) => {
            if (error) {
              resolve({ success: false, error: stderr || error.message });
            } else {
              resolve({ success: true, message: 'Changes discarded' });
            }
          });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });
    console.log('✅ Registered: git:discardFile');

    // ADD THIS NEW HANDLER: To allow setting the remote URL
    ipcMain.handle('git:addRemote', async (event, { url }) => {
      return new Promise((resolve) => {
        // Remove existing origin first to avoid "remote origin already exists" error
        exec('git remote remove origin', { cwd: projectDir }, () => {
          // Then add the new one
          exec(`git remote add origin ${url}`, { cwd: projectDir }, (error, stdout, stderr) => {
            if (error) {
              resolve({ success: false, error: stderr || error.message });
            } else {
              resolve({ success: true, message: 'Remote origin configured' });
            }
          });
        });
      });
    });

    ipcMain.handle('git:checkout', async (event, { branch, repoPath }) => {
      return new Promise((resolve) => {
        exec(`git checkout ${branch}`, { cwd: repoPath || projectDir }, (error, stdout, stderr) => {
          if (error) {
            resolve({ success: false, error: stderr || error.message });
          } else {
            resolve({ success: true, message: `Switched to branch ${branch}` });
          }
        });
      });
    });
    console.log('✅ Registered: git:checkout');

    ipcMain.handle('git:createBranch', async (event, { branch, repoPath }) => {
      return new Promise((resolve) => {
        exec(`git checkout -b ${branch}`, { cwd: repoPath || projectDir }, (error, stdout, stderr) => {
          if (error) {
            resolve({ success: false, error: stderr || error.message });
          } else {
            resolve({ success: true, message: `Created and switched to branch ${branch}` });
          }
        });
      });
    });
    console.log('✅ Registered: git:createBranch');

    ipcMain.handle('git:log', async (event, { limit, repoPath }) => {
      return new Promise((resolve) => {
        const cmd = `git log --oneline -${limit || 10}`;
        exec(cmd, { cwd: repoPath || projectDir }, (error, stdout, stderr) => {
          if (error) {
            resolve({ success: false, error: stderr || error.message, commits: [] });
          } else {
            const commits = stdout.split('\n')
              .filter(line => line.trim())
              .map(line => {
                const [hash, ...messageParts] = line.split(' ');
                return { hash, message: messageParts.join(' ') };
              });
            resolve({ success: true, commits });
          }
        });
      });
    });
    console.log('✅ Registered: git:log');

    ipcMain.handle('git:diff', async (event, { file, repoPath }) => {
      return new Promise((resolve) => {
        const cmd = file ? `git diff ${file}` : 'git diff';
        exec(cmd, { cwd: repoPath || projectDir }, (error, stdout, stderr) => {
          if (error) {
            resolve({ success: false, error: stderr || error.message, diff: '' });
          } else {
            resolve({ success: true, diff: stdout });
          }
        });
      });
    });
    console.log('✅ Registered: git:diff');

    ipcMain.handle('git:remote', async (event, { action, name, url, repoPath }) => {
      return new Promise((resolve) => {
        let cmd;
        if (action === 'add') {
          cmd = `git remote add ${name} ${url}`;
        } else if (action === 'remove') {
          cmd = `git remote remove ${name}`;
        } else if (action === 'list') {
          cmd = 'git remote -v';
        } else {
          resolve({ success: false, error: 'Invalid action' });
          return;
        }

        exec(cmd, { cwd: repoPath || projectDir }, (error, stdout, stderr) => {
          if (error) {
            resolve({ success: false, error: stderr || error.message });
          } else {
            if (action === 'list') {
              const remotes = stdout.split('\n')
                .filter(line => line.trim())
                .map(line => {
                  const [name, url] = line.split('\t');
                  return { name, url: url?.replace(/\(.*\)/, '').trim() };
                });
              resolve({ success: true, remotes });
            } else {
              resolve({ success: true, message: `Remote ${action}ed successfully` });
            }
          }
        });
      });
    });
    console.log('✅ Registered: git:remote');

    ipcMain.handle('git:config', async (event, { key, value, repoPath }) => {
      return new Promise((resolve) => {
        try {
          const safePath = resolveSafePath(repoPath);
          const cmd = `git config ${key} "${value}"`;
          exec(cmd, { cwd: safePath }, (error, stdout, stderr) => {
            if (error) {
              resolve({ success: false, error: stderr || error.message });
            } else {
              resolve({ success: true, message: `Config ${key} set successfully` });
            }
          });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });
    console.log('✅ Registered: git:config');

    // Dialog Handlers
    ipcMain.handle('window:new', () => {
      createWindow(); // Calls your existing function to spawn a new window
      return { success: true };
    });
    console.log('✅ Registered: window:new');

    ipcMain.handle('dialog:openFile', async (event) => {
      try {
        console.log('dialog:openFile handler called');

        // Get the window that triggered this
        const win = BrowserWindow.fromWebContents(event.sender);

        if (!dialog) {
          console.error('Dialog module not available');
          return { canceled: true };
        }

        console.log('Showing open file dialog...');
        const { canceled, filePaths } = await dialog.showOpenDialog(win, {
          properties: ['openFile'],
          defaultPath: require('os').homedir(),
          filters: [
            { name: 'Code Files', extensions: ['js', 'py', 'txt', 'json', 'md', 'ts', 'tsx', 'jsx', 'css', 'html'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });

        console.log('Dialog result - canceled:', canceled, 'filePaths:', filePaths);

        if (canceled || !filePaths || filePaths.length === 0) {
          console.log('File selection canceled or no path selected');
          return { canceled: true };
        }

        const filePath = filePaths[0];
        console.log('File selected:', filePath);

        return { canceled: false, filePath };
      } catch (error) {
        console.error('Open file dialog error:', error);
        return { canceled: true, error: error.message };
      }
    });
    console.log('✅ Registered: dialog:openFile');

    ipcMain.handle('dialog:openFolder', async (event) => {
      try {
        console.log('dialog:openFolder handler called');

        // Get the window that triggered this
        const win = BrowserWindow.fromWebContents(event.sender);

        if (!dialog) {
          console.error('Dialog module not available');
          return { canceled: true };
        }

        console.log('Showing open dialog...');
        const { canceled, filePaths } = await dialog.showOpenDialog(win, {
          properties: ['openDirectory'],
          defaultPath: require('os').homedir()
        });

        console.log('Dialog result - canceled:', canceled, 'filePaths:', filePaths);

        if (canceled || !filePaths || filePaths.length === 0) {
          console.log('Folder selection canceled or no path selected');
          return { canceled: true };
        }

        const selectedPath = filePaths[0];
        console.log('Folder selected:', selectedPath);

        // Update projectDir to the selected folder
        projectDir = selectedPath;
        console.log('Project directory updated to:', projectDir);

        return { canceled: false, folderPath: selectedPath };
      } catch (error) {
        console.error('Open folder dialog error:', error);
        return { canceled: true, error: error.message };
      }
    });
    console.log('✅ Registered: dialog:openFolder');

    ipcMain.handle('dialog:saveAs', async (event, content) => {
      try {
        // Ensure dialog is available
        if (!dialog) {
          console.error('Dialog module not available');
          return { canceled: true, error: 'Dialog module not available' };
        }

        const os = require('os');
        const documentsPath = path.join(os.homedir(), 'Documents');

        const { canceled, filePath } = await dialog.showSaveDialog({
          title: 'Save File',
          defaultPath: path.join(documentsPath, 'untitled.js'), // Save to Documents folder
          filters: [
            { name: 'JavaScript Files', extensions: ['js'] },
            { name: 'Python Files', extensions: ['py'] },
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        if (canceled) return { canceled: true };

        fs.writeFileSync(filePath, content || '', 'utf-8');
        const fileName = path.basename(filePath);
        return { canceled: false, filePath, fileName };
      } catch (error) {
        console.error('Save as dialog error:', error);
        return { canceled: true, error: error.message };
      }
    });
    console.log('✅ Registered: dialog:saveAs');

    // Get user directories
    ipcMain.handle('system:getUserDirectories', () => {
      const os = require('os');
      const homeDir = os.homedir();

      return {
        home: homeDir,
        documents: path.join(homeDir, 'Documents'),
        desktop: path.join(homeDir, 'Desktop'),
        downloads: path.join(homeDir, 'Downloads'),
        pictures: path.join(homeDir, 'Pictures'),
        music: path.join(homeDir, 'Music'),
        videos: path.join(homeDir, 'Videos')
      };
    });
    console.log('✅ Registered: system:getUserDirectories');

    // Shell Handler - Open External URLs
    ipcMain.handle('shell:openExternal', async (event, url) => {
      try {
        await shell.openExternal(url);
        return { success: true };
      } catch (error) {
        console.error('Error opening external URL:', error);
        return { success: false, error: error.message };
      }
    });
    console.log('✅ Registered: shell:openExternal');

    // GitHub Copilot Handlers
    ipcMain.handle('copilot:chat', async (event, data) => {
      return await copilotController.chat(event, data);
    });

    ipcMain.handle('copilot:streamChat', async (event, data) => {
      return await copilotController.streamChat(event, data);
    });
    ipcMain.handle('copilot:ping', async () => {
      return await copilotController.ping();
    });
    console.log('✅ Registered: copilot:chat, streamChat & ping');

    // Gemini Handlers
    ipcMain.handle('gemini:getVisuals', (e, data) => geminiController.streamVisuals(e, data));
    console.log('✅ Registered: gemini:getVisuals');

    // Eagerly initialize Copilot on startup
    copilotController.ensureInitialized().catch(err => {
      console.error('❌ Eager Copilot initialization failed:', err.message);
    });

    console.log('✅ Registered: dialog:saveAs');

    console.log('✅ All IPC handlers registered successfully!');

    // List all registered file handlers for verification
    console.log('\n📋 Registered File Handlers:');
    console.log('  - files:readProject');
    console.log('  - files:readFile');
    console.log('  - files:saveFile');
    console.log('  - files:createFile');
    console.log('  - files:deleteFile');
    console.log('  - files:renameFile');
    console.log('  - files:moveFile ← CHECK THIS ONE');
    console.log('  - files:createFolder\n');

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

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.warn('⚠️ OAuth callback server port 3000 is already in use. This might happen if another instance is running.');
    } else {
      console.error('❌ OAuth callback server error:', e);
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