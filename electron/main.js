const { app, BrowserWindow, ipcMain, shell } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const url = require('url');
const { OAuth2Client } = require('google-auth-library');
const userController = require('./controllers/userController');

// Load .env from root
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authController = require('./controllers/authController');

let mainWindow;

// --- GOOGLE AUTH CONFIG ---
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:6060/callback';

// Function to handle the Browser Flow
async function startGoogleFlow() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        if (req.url.startsWith('/callback')) {
          const parsedUrl = url.parse(req.url, true);
          const code = parsedUrl.query.code;

          if (code) {
            res.end('<h1>Login Successful! You can close this tab and return to LumoFlow.</h1>');
            server.close();
            resolve(code);
          } else {
            res.end('<h1>Login Failed. No code returned.</h1>');
            server.close();
            reject(new Error('No code found'));
          }
        }
      } catch (e) {
        server.close();
        reject(e);
      }
    });

    server.listen(6060, () => {
      // Create OAuth Client
      const oAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
      
      // Generate the URL for Google
      const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email'
        ],
      });

      // Open System Browser (Chrome/Edge)
      shell.openExternal(authorizeUrl);
    });
  });
}

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/lumoflow';
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

// --- IPC HANDLERS ---
ipcMain.handle('auth:login', authController.login);
ipcMain.handle('auth:signup', authController.signup);
ipcMain.handle('auth:logout', authController.logout);
ipcMain.handle('auth:forgot-password', authController.forgotPassword);
ipcMain.handle('auth:reset-password', authController.resetPassword);
ipcMain.handle('user:get-dashboard', userController.getDashboardData);
// 🟢 NEW GOOGLE HANDLER
ipcMain.handle('auth:start-google-flow', async () => {
  try {
    const code = await startGoogleFlow();
    
    // Exchange code for tokens
    const oAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Get User Profile
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // Process logic in controller
    const result = await authController.googleLoginStep2(payload);

    // Bring app to front
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
    }

    return result;
  } catch (error) {
    console.error("Google Flow Failed:", error);
    return { success: false, msg: "Login cancelled or failed." };
  }
});

ipcMain.handle('app:info', () => ({
  appVersion: app.getVersion(),
  isDev
}));