# FORCE RESTART INSTRUCTIONS

## The Problem
Electron is running with a cached version of main.js. The handler IS in the file (verified at line 315), but Electron hasn't reloaded it.

## Solution - Follow These Steps EXACTLY:

### Step 1: Kill ALL Processes
Open Task Manager (Ctrl+Shift+Esc) and manually kill:
- All `node.exe` processes
- All `electron.exe` processes
- Close all command prompt/PowerShell windows running npm

### Step 2: Clear Electron Cache
Run this command:
```cmd
rmdir /s /q "%APPDATA%\Electron"
rmdir /s /q node_modules\.cache
```

### Step 3: Restart Fresh
```cmd
npm start
```

### Step 4: Verify Handler Registration
When the app starts, open Developer Tools (Ctrl+Shift+I) and check the console.
You MUST see this line:
```
✅ Registered: files:moveFile
```

If you don't see it, the handler is NOT being registered.

## Alternative: Use the Batch File
I created `restart.bat` - just double-click it to:
1. Kill all Node/Electron processes
2. Clear cache
3. Restart the app

## If It STILL Doesn't Work:

The handler might be outside the `app.on('ready')` block. Let me verify...
