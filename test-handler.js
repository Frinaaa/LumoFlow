// Quick test to verify files:moveFile handler exists in main.js
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking electron/main.js for files:moveFile handler...\n');

const mainJsPath = path.join(__dirname, 'electron', 'main.js');
const content = fs.readFileSync(mainJsPath, 'utf-8');

// Check if handler exists
if (content.includes("ipcMain.handle('files:moveFile'")) {
  console.log('✅ Handler FOUND in main.js!');
  
  // Find the line number
  const lines = content.split('\n');
  const lineNumber = lines.findIndex(line => line.includes("ipcMain.handle('files:moveFile'")) + 1;
  console.log(`   Location: Line ${lineNumber}`);
  
  // Check if it's inside app.on('ready')
  const readyIndex = content.indexOf("app.on('ready'");
  const handlerIndex = content.indexOf("ipcMain.handle('files:moveFile'");
  
  if (readyIndex !== -1 && handlerIndex > readyIndex) {
    console.log('✅ Handler is INSIDE app.on(\'ready\') block');
  } else {
    console.log('❌ Handler might be OUTSIDE app.on(\'ready\') block');
  }
  
  // Check if console.log for registration exists
  if (content.includes("console.log('✅ Registered: files:moveFile')")) {
    console.log('✅ Registration log statement found');
  }
  
  console.log('\n📝 The handler exists in the code!');
  console.log('   If you\'re still getting errors, you need to:');
  console.log('   1. Kill all node.exe and electron.exe processes');
  console.log('   2. Restart the app with: npm start');
  console.log('   3. Check console for "✅ Registered: files:moveFile"');
  
} else {
  console.log('❌ Handler NOT FOUND in main.js!');
  console.log('   This is unexpected. The file might not have been saved.');
}

console.log('\n✅ File check complete!');
