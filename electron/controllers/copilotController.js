const zod = require('zod');
const fs = require('fs');
const path = require('path');

function logToFile(msg) {
    try {
        const logPath = 'c:\\Users\\X390 Yoga\\OneDrive\\Desktop\\main project\\LumoFlow\\ai_debug.log';
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) { }
}

let CopilotClient = null;
let client = null;
let session = null;
let currentToken = null;

async function loadSDK() {
    // This dynamic import is the ONLY way to load an ESM package in CommonJS
    if (CopilotClient) return;
    try {
        const sdk = await import('@github/copilot-sdk');
        CopilotClient = sdk.CopilotClient;
        console.log("📦 Copilot SDK imported successfully");
    } catch (error) {
        console.error('❌ Failed to import Copilot SDK. Ensure it is installed via npm.');
    }
}

const copilotController = {
    async ensureInitialized(token) {
        const envToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        const activeToken = token || envToken;
        logToFile(`🔑 ensureInitialized activeToken length: ${activeToken ? activeToken.length : 0}`);

        if (client && session && currentToken === activeToken) {
            logToFile("♻️ Reusing existing session");
            return true;
        }

        try {
            await loadSDK();
            if (!CopilotClient) {
                logToFile("❌ CopilotClient not loaded");
                return false;
            }

            if (client) {
                logToFile("⏹️ Stopping old client");
                try { await client.stop(); } catch (e) { }
            }

            logToFile("🚀 Creating new client...");
            client = new CopilotClient({
                githubToken: activeToken,
                logLevel: 'info'
            });

            await client.start();
            currentToken = activeToken;

            // Robust model selection
            const models = ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo', 'gpt-4.1'];
            for (const m of models) {
                try {
                    logToFile(`🧪 Trying model: ${m}`);
                    session = await client.createSession({
                        model: m,
                        systemMessage: { content: "You are LumoFlow AI." }
                    });
                    logToFile(`✅ AI Session established with model: ${m}`);
                    return true;
                } catch (e) {
                    logToFile(`⚠️ Model ${m} failed: ${e.message}`);
                }
            }
            throw new Error("No models available");
        } catch (error) {
            logToFile(`❌ AI Initialization failed: ${error.message}`);
            return false;
        }
    },

    async streamChat(event, { message, token, context }) {
        const webContents = event.sender;
        logToFile(`📡 streamChat called. Message: ${message}`);
        try {
            const ok = await this.ensureInitialized(token);
            logToFile(`🔑 ensureInitialized returned: ${ok}`);
            if (!ok || !session) {
                logToFile("❌ AI Service initialization failed");
                throw new Error("AI Service Unavailable. Check token permissions.");
            }

            session.on('error', (err) => {
                logToFile(`❌ Session ERROR event: ${err.message}`);
                webContents.send('copilot:error', err.message);
            });

            session.on('assistant.message_error', (err) => {
                logToFile(`❌ Assistant Message ERROR: ${err.message}`);
                webContents.send('copilot:error', err.message);
            });

            const unsubscribe = session.on('assistant.message_delta', (delta) => {
                logToFile(`💧 Delta received: ${JSON.stringify(delta)}`);
                const chunk = delta.content || (delta.data && delta.data.deltaContent) || delta.deltaContent;
                if (chunk) {
                    webContents.send('copilot:chunk', chunk);
                }
            });

            const donePromise = new Promise(r => session.on('session.idle', () => {
                logToFile("🏁 Session IDLE received");
                r();
            }));

            logToFile("📤 Sending message to session...");
            // Correct format for @github/copilot-sdk send
            await session.send(message);
            logToFile("✅ Message sent, waiting for stream completion...");
            await donePromise;

            logToFile("🧹 Cleaning up listeners...");
            if (typeof unsubscribe === 'function') unsubscribe();
            webContents.send('copilot:done');
            logToFile("✨ streamChat finished successfully");
        } catch (error) {
            logToFile(`❌ AI Stream Error: ${error.message}\nStack: ${error.stack}`);
            webContents.send('copilot:error', error.message);
        }
    },

    async chat(event, { message, token }) {
        logToFile(`📡 chat called. Message: ${message}`);
        try {
            const ok = await this.ensureInitialized(token);
            if (!ok || !session) return { success: false, msg: "AI Service Unavailable" };

            // In some versions of the SDK, send returns the completion
            // If it doesn't, we'd need to use listeners like streamChat does
            const response = await session.send(message);
            return {
                success: true,
                content: typeof response === 'string' ? response : (response.content || "Message processed")
            };
        } catch (error) {
            logToFile(`❌ Chat Error: ${error.message}`);
            return { success: false, msg: error.message };
        }
    },

    async ping() {
        logToFile("📡 ping called");
        try {
            await loadSDK();
            if (!CopilotClient) return false;

            // If already initialized, we are good
            if (session) return true;

            // Attempt to initialize (will check env tokens)
            return await this.ensureInitialized();
        } catch (e) {
            logToFile(`❌ Ping failure: ${e.message}`);
            return false;
        }
    }
};

module.exports = copilotController;