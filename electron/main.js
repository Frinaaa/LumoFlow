const { app, BrowserWindow, ipcMain, shell, protocol, dialog } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const userController = require('./controllers/userController');
const authController = require('./controllers/authController');
const codeController = require('./controllers/codeController');
const analysisController = require('./controllers/analysisController');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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

  // Check if finalPath is within projectDir
  const relative = path.relative(projectDir, finalPath);

  // if relative starts with '..' or is absolute (meaning it's on a different drive or outside root)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    console.error(`🛑 Access denied for path: ${finalPath}`);
    throw new Error('Access Denied: Path is outside the sandboxed workspace.');
  }

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

    return result;
  } catch (err) {
    console.error("GitHub OAuth error:", err.message);
    return { success: false, msg: "GitHub authentication failed: " + err.message };
  }
}

const createWindow = async () => {
  const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/lumoflow';
  await mongoose.connect(dbURI);

  const newWindow = new BrowserWindow({
    width: 1200, height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: false,
      enableRemoteModule: false,
      sandbox: true,
    },
    titleBarStyle: 'hidden',
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

  const startUrl = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`;
  newWindow.loadURL(startUrl);
  newWindow.once('ready-to-show', () => newWindow.show());

  // Handle any uncaught exceptions
  newWindow.webContents.on('crashed', () => {
    console.error('Renderer process crashed');
    newWindow.reload();
  });

  return newWindow;
};

app.on('ready', () => {
  // Disable Autofill at Chromium level
  app.commandLine.appendSwitch('disable-autofill-keyboard-accessory-view');
  app.commandLine.appendSwitch('disable-autofill');

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

      scanDir(resolveSafePath(''));
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

    // VERIFICATION: Test if handler is accessible
    console.log('🔍 Verifying files:moveFile handler...');
    const handlers = ipcMain._events || {};
    if (handlers['files:moveFile']) {
      console.log('✅ files:moveFile handler is accessible!');
    } else {
      console.error('❌ files:moveFile handler NOT accessible!');
    }

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

      function searchDir(dir) {
        try {
          if (!fs.existsSync(dir)) return;
          const items = fs.readdirSync(dir);

          for (const item of items) {
            if (ignoreDirs.has(item)) continue;

            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
              searchDir(fullPath);
            } else {
              try {
                const content = fs.readFileSync(fullPath, 'utf-8');
                const lines = content.split('\n');

                lines.forEach((line, index) => {
                  if (line.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                      filePath: fullPath,
                      line: index + 1,
                      preview: line.trim().substring(0, 100)
                    });
                  }
                });
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

      return results;
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

    ipcMain.handle('git:push', async (event, { remote, branch, repoPath }) => {
      return new Promise((resolve) => {
        try {
          const safePath = resolveSafePath(repoPath);
          // FIX: Added -u to set upstream tracking, otherwise subsequent pulls fail
          const targetRemote = remote || 'origin';
          const targetBranch = branch || 'main';
          const cmd = `git push -u ${targetRemote} ${targetBranch}`;

          console.log(`Executing: ${cmd}`);

          exec(cmd, { cwd: safePath }, (error, stdout, stderr) => {
            if (error) {
              // Send back stderr because git often puts status info there
              resolve({ success: false, error: stderr || error.message });
            } else {
              resolve({ success: true, message: 'Changes pushed to remote' });
            }
          });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });

    ipcMain.handle('git:pull', async (event, { remote, branch, repoPath }) => {
      return new Promise((resolve) => {
        try {
          const safePath = resolveSafePath(repoPath);
          const targetRemote = remote || 'origin';
          const targetBranch = branch || 'main';
          const cmd = `git pull ${targetRemote} ${targetBranch}`;

          console.log(`Executing: ${cmd}`);

          exec(cmd, { cwd: safePath }, (error, stdout, stderr) => {
            if (error) {
              resolve({ success: false, error: stderr || error.message });
            } else {
              resolve({ success: true, message: 'Changes pulled from remote' });
            }
          });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });

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

    // Dialog Handlers
    ipcMain.handle('window:new', () => {
      createWindow(); // Calls your existing function to spawn a new window
      return { success: true };
    });
    console.log('✅ Registered: window:new');

    ipcMain.handle('dialog:openFile', async () => {
      try {
        // Ensure dialog is available
        if (!dialog) {
          console.error('Dialog module not available');
          return { canceled: true, error: 'Dialog module not available' };
        }

        const { canceled, filePaths } = await dialog.showOpenDialog({
          properties: ['openFile'],
          defaultPath: require('os').homedir(), // Start from user's home directory
          filters: [
            { name: 'Code Files', extensions: ['js', 'py', 'txt', 'json', 'md'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        if (canceled) return { canceled: true };

        const content = fs.readFileSync(filePaths[0], 'utf-8');
        const fileName = path.basename(filePaths[0]);
        return { canceled: false, filePath: filePaths[0], fileName, content };
      } catch (error) {
        console.error('Open file dialog error:', error);
        return { canceled: true, error: error.message };
      }
    });
    console.log('✅ Registered: dialog:openFile');

    ipcMain.handle('dialog:openFolder', async () => {
      try {
        // Ensure dialog is available
        if (!dialog) {
          console.error('Dialog module not available');
          return { canceled: true, error: 'Dialog module not available' };
        }

        const { canceled, filePaths } = await dialog.showOpenDialog({
          properties: ['openDirectory'],
          defaultPath: require('os').homedir() // Start from user's home directory
        });
        if (canceled) return { canceled: true };

        const selectedPath = filePaths[0];

        // Update the project directory
        projectDir = resolveSafePath(selectedPath);
        console.log('📁 Project directory updated to (restricted):', projectDir);

        // Read the folder structure recursively
        const results = [];
        function scanDir(dir) {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            results.push({
              name: item,
              path: fullPath,
              isFolder: stat.isDirectory()
            });
            if (stat.isDirectory()) {
              scanDir(fullPath);
            }
          }
        }
        scanDir(selectedPath);

        return { canceled: false, folderPath: selectedPath, files: results };
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