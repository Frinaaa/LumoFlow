const { app } = require('electron');
const fs = require('fs');
const path = require('path');

// Log path: Project root
const LOG_PATH = path.join(process.cwd(), 'ai_debug.log');
const BRIDGE_SESSION_ID = Math.random().toString(36).substring(7);

function logToConsole(msg) {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}][SESS:${BRIDGE_SESSION_ID}] ${msg}`;
    console.log(logMsg);
    try {
        fs.appendFileSync(LOG_PATH, logMsg + '\n');
    } catch (e) { }
}

let CopilotClient = null;
let approveAll = null;
let client = null;
let session = null;
let currentToken = null;
let isInitializing = false;
let activeWebContents = null;

async function loadSDK() {
    if (CopilotClient && approveAll) return { CopilotClient, approveAll };
    try {
        let sdk;
        try {
            sdk = require('@github/copilot-sdk');
        } catch (requireErr) {
            sdk = (await import('@github/copilot-sdk'))?.default || (await import('@github/copilot-sdk'));
        }

        CopilotClient = sdk?.CopilotClient || sdk?.default?.CopilotClient;
        approveAll = sdk?.approveAll || sdk?.default?.approveAll;

        if (!CopilotClient) {
            throw new Error('CopilotClient export not found in @github/copilot-sdk');
        }
        return { CopilotClient, approveAll };
    } catch (error) {
        const msg = error?.message || String(error);
        logToConsole(`🔥 SDK LOAD ERROR: ${msg}`);
        logToConsole(error?.stack || '');
        throw new Error(`SDK_LOAD_FAILED: ${msg}`);
    }
}

const copilotController = {
    async ensureInitialized(token, webContents) {
        // Extreme priority: if session exists, return immediately.
        if (session) return true;
        if (isInitializing) return false;

        const activeToken = token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        if (!activeToken) throw new Error("MISSING_TOKEN");

        isInitializing = true;
        try {
            const { CopilotClient, approveAll } = await loadSDK();
            if (client && currentToken !== activeToken) {
                try { await client.stop(); } catch (e) { }
                client = null;
            }

            if (!client) {                // Resolve the Copilot CLI path manually.
                // In packaged Electron builds, node_modules are inside app.asar BUT
                // @github packages are unpacked to app.asar.unpacked/ (via asarUnpack).
                // We must point directly to the unpacked path so Node can spawn it.
                let cliPath;
                try {
                    // In production: __dirname is inside app.asar, so we replace
                    // 'app.asar' with 'app.asar.unpacked' to reach the unpacked files.
                    const appRoot = app.getAppPath();
                    const unpackedRoot = appRoot.replace('app.asar', 'app.asar.unpacked');
                    const prodCliPath = path.join(unpackedRoot, 'node_modules', '@github', 'copilot', 'index.js');
                    const devCliPath = path.join(appRoot, 'node_modules', '@github', 'copilot', 'index.js');

                    if (fs.existsSync(prodCliPath)) {
                        cliPath = prodCliPath;
                        logToConsole(`📦 Using unpacked CLI path: ${cliPath}`);
                    } else if (fs.existsSync(devCliPath)) {
                        cliPath = devCliPath;
                        logToConsole(`🔧 Using dev CLI path: ${cliPath}`);
                    } else {
                        logToConsole(`⚠️ CLI path not found, letting SDK auto-detect`);
                    }
                } catch (pathErr) {
                    logToConsole(`⚠️ CLI path resolution error: ${pathErr.message}`);
                }

                const clientOptions = {
                    githubToken: activeToken,
                    logLevel: 'debug'
                };
                if (cliPath) clientOptions.cliPath = cliPath;

                client = new CopilotClient(clientOptions);
                await client.start();
                currentToken = activeToken;
            }

            // 🚀 ULTRA-SPEED: Reuse session to save 1.5s creation time
            if (session) return true;

            const model = 'gpt-4.1';
            logToConsole(`🧪 Creating Persistent Agent Session: ${model}`);
            const permissionHandler = approveAll || (() => {
                logToConsole('⚠️ Warning: Using fallback permission handler');
                return { kind: 'approved' };
            });

            session = await client.createSession({
                model: model,
                onPermissionRequest: permissionHandler,
                systemMessage: {
                    content: `You are LumoFlow AI, a coding assistant integrated into an IDE.

IMPORTANT: When the user asks you to fix, edit, modify, change, or write code:
1. ALWAYS use the 'write_file' tool to stage the code for review.
2. Put the COMPLETE file content in the 'code' parameter - not just a snippet.
3. The user will see a diff preview and can accept or discard your changes.
4. After calling write_file, briefly explain what you changed.

For questions, explanations, or non-code tasks, respond normally in markdown.
Use markdown code blocks (\`\`\`) only for illustrative snippets in explanations, NOT for actual file edits.`
                },
                tools: [
                    {
                        name: "write_file",
                        description: "Write or edit the user's current file. Use this ALWAYS when the user asks to fix, edit, modify, or change code. Pass the COMPLETE updated file content.",
                        parameters: {
                            type: "object",
                            properties: { code: { type: "string", description: "The complete updated file content" } },
                            required: ["code"]
                        },
                        handler: async ({ code }) => {
                            logToConsole(`🔧 write_file tool called! Code length: ${code?.length || 0}`);
                            // 🔑 Use the mutable activeWebContents reference (updated every streamChat call)
                            if (activeWebContents && !activeWebContents.isDestroyed()) {
                                activeWebContents.send('editor:preview-diff', code);
                                logToConsole('✅ Sent editor:preview-diff to active webContents');
                            } else {
                                logToConsole('⚠️ No active webContents for preview-diff!');
                            }
                            return "✅ Code staged for user review. The user will see a diff preview.";
                        }
                    }
                ]
            });
            return true;
        } catch (error) {
            logToConsole(`🔥 Init Failed: ${error.message}`);
            return false;
        } finally {
            isInitializing = false;
        }
    },

    async streamChat(event, { message, token, context }) {
        const webContents = event.sender;
        // 🔑 Update the mutable reference so write_file tool always uses latest webContents
        activeWebContents = webContents;
        try {
            const initialized = await this.ensureInitialized(token, webContents);
            if (!initialized || !session) {
                throw new Error('Copilot SDK initialization failed; see logs for details.');
            }
            logToConsole(`💭 USER_QUERY: "${message.substring(0, 50)}..."`);

            const promptContent = `[CONTEXT]\nFile: ${context.currentFile}\nCode: \n${context.currentCode}\n\n[TASK]\n${message}`;

            let deltasReceived = false;

            const onDelta = (delta) => {
                deltasReceived = true;
                // Exhaustive chunk extraction for varying SDK versions
                let chunk = delta?.deltaContent ||
                    delta?.content ||
                    delta?.data?.deltaContent ||
                    delta?.choices?.[0]?.delta?.content ||
                    delta?.message?.content?.parts?.[0];

                if (!chunk && delta?.data) {
                    chunk = delta.data.deltaContent || delta.data.content;
                }

                if (chunk && !webContents.isDestroyed()) {
                    webContents.send('copilot:chunk', chunk);
                }
            };

            const onMsg = (msg) => {
                const content = msg?.data?.content || msg?.content || msg?.message?.content?.parts?.[0];
                if (content) {
                    logToConsole(`📦 REPLY: ${content.substring(0, 50).replace(/\n/g, ' ')}...`);
                    if (!deltasReceived && !webContents.isDestroyed()) {
                        webContents.send('copilot:chunk', content);
                    }
                }
            };

            const onTool = (call) => {
                logToConsole(`🔧 AGENT TOOL CALL: ${call?.data?.toolName || call?.toolName || 'unknown'}`);
            };

            const uDelta = session.on('assistant.message_delta', onDelta);
            const uMsg = session.on('assistant.message', onMsg);
            const uTool = session.on('assistant.tool_call', onTool);

            // Also listen for non-prefixed events just in case
            const uDelta2 = session.on('message_delta', onDelta);
            const uMsg2 = session.on('message', onMsg);

            // 🔄 SESSION VALIDATION: Try to send, recreate if stale
            try {
                await session.send({
                    prompt: promptContent,
                    mode: 'immediate'
                });
            } catch (sendError) {
                if (sendError.message.includes('Session not found')) {
                    logToConsole('🔄 Stale session detected. Recreating...');
                    session = null; // Clear stale session
                    await this.ensureInitialized(token, webContents); // Force recreation

                    // Retry with fresh session
                    await session.send({
                        prompt: promptContent,
                        mode: 'immediate'
                    });
                } else {
                    throw sendError; // Re-throw if it's a different error
                }
            }

            await new Promise(r => {
                const timer = setTimeout(() => {
                    logToConsole("⚠️ Safety timeout reached");
                    r();
                }, 15000); // 15s safety 

                session.on('session.idle', () => {
                    logToConsole("💤 Session IDLE");
                    clearTimeout(timer);
                    r();
                });
            });

            if (uDelta) uDelta();
            if (uMsg) uMsg();
            if (uTool) uTool();
            if (uDelta2) uDelta2();
            if (uMsg2) uMsg2();

            webContents.send('copilot:done');
            logToConsole("🏁 CYCLE_COMPLETE");

        } catch (error) {
            logToConsole(`🔥 AI ERROR: ${error.message}`);
            // Just send the raw error. The frontend will now just stop the spinner.
            webContents.send('copilot:error', error.message);
            webContents.send('copilot:done');
        }
    },

    async ping() {
        try {
            await loadSDK();
            return !!client;
        } catch (e) { return false; }
    }
};

module.exports = copilotController;