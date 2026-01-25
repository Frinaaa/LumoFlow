# How to Restart the Electron App

The error you're seeing ("No handler registered for 'files:moveFile'") means the Electron app needs to be completely restarted to load the updated handlers.

## Steps to Fix:

### 1. Stop All Running Processes
- Close the Electron app window completely
- In your terminal/command prompt, press `Ctrl+C` to stop any running processes
- Make sure no `electron` or `node` processes are still running

### 2. Clear Any Cached Data (Optional but Recommended)
```bash
# Delete node_modules/.cache if it exists
rmdir /s /q node_modules\.cache

# Or on Unix/Mac:
rm -rf node_modules/.cache
```

### 3. Restart the Application
```bash
# If using npm:
npm start

# Or if using electron directly:
npm run electron
```

### 4. Verify the Handler is Registered
When the app starts, check the console output. You should see:
```
🚀 App ready - Registering IPC handlers...
✅ Registered: files:moveFile
```

### 5. Test the Drag and Drop
- Open a file in the editor
- Try dragging a file to a folder in the file explorer
- The file should move successfully

## What Was Fixed:

1. **Enhanced Error Handling** - Added better logging and error messages to the `files:moveFile` handler
2. **Validation** - Added checks for:
   - Source file exists
   - Target directory creation
   - Target file doesn't already exist
3. **Better Logging** - Console logs now show exactly what's happening during file moves

## If It Still Doesn't Work:

1. Check the Electron console (View → Toggle Developer Tools)
2. Look for the "✅ Registered: files:moveFile" message
3. Try moving a file and check for the "📦 Move file request" log
4. If you see any errors, they will now be more descriptive

The handler is definitely in the code and properly registered - it just needs a fresh app restart to take effect!
