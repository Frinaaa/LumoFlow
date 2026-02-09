const copilotController = require('./electron/controllers/copilotController');
console.log('Keys in copilotController:', Object.keys(copilotController));
if (typeof copilotController.ping === 'function') {
    console.log('✅ ping is a function');
} else {
    console.log('❌ ping is NOT a function. Type:', typeof copilotController.ping);
}
