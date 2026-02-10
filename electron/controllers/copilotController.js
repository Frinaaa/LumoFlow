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
let client = null;
let session = null;
let currentToken = null;

async function loadSDK() {
    if (CopilotClient) return;
    try {
        const sdk = await import('@github/copilot-sdk');
        CopilotClient = sdk.CopilotClient;
    } catch (error) {
        throw new Error("SDK_LOAD_FAILED");
    }
}

const copilotController = {
    async ensureInitialized(token, webContents) {
        const activeToken = token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        if (!activeToken) throw new Error("MISSING_TOKEN");

        try {
            await loadSDK();
            if (client && currentToken !== activeToken) {
                try { await client.stop(); } catch (e) { }
                client = null;
            }

            if (!client) {
                client = new CopilotClient({ githubToken: activeToken, logLevel: 'debug' });
                await client.start();
                currentToken = activeToken;
            }

            // FRESH SESSION PER MESSAGE
            const model = 'claude-haiku-4.5';
            logToConsole(`🧪 Creating Agent Session: ${model}`);

            session = await client.createSession({
                model: model,
                systemMessage: {
                    content: `You are LumoFlow AI, an elite coding agent with direct control over the user's editor.

DIRECTIVES:
1. When asked to modify, refactor, or write code for the current file, ALWAYS use the 'write_file' tool.
2. In your verbal response, briefly explain what you changed.
3. If the user asks for a general explanation, just provide text.
4. Do NOT ask for permission before using 'write_file' if the user's intent is clear.

AGENT TOOLS:
- write_file(code: string): Use this to overwrite the current active file in the user's editor with the 'code' provided.

[CONTEXT] provides the current file state. [TASK] is the user's request.`
                },
                tools: [
                    {
                        name: "write_file",
                        description: "Updates the current active file in the Monaco editor with new content. Use this whenever the user wants to apply changes to their code.",
                        parameters: {
                            type: "object",
                            properties: {
                                code: { type: "string", description: "The complete new content for the file" }
                            },
                            required: ["code"]
                        },
                        handler: async ({ code }) => {
                            logToConsole("🛠️ AI AGENT ACTION: write_file triggered");
                            if (webContents) {
                                webContents.send('editor:update-content', code);
                            }
                            return "The editor has been updated with requested code.";
                        }
                    }
                ]
            });
            return true;
        } catch (error) {
            logToConsole(`🔥 Init Failed: ${error.message}`);
            if (!session) {
                session = await client.createSession({ model: 'gpt-4o' });
            }
            return true;
        }
    },

    async streamChat(event, { message, token, context }) {
        const webContents = event.sender;
        try {
            await this.ensureInitialized(token, webContents);
            logToConsole(`💭 USER_QUERY: "${message}"`);

            const promptContent = `[CONTEXT]\nFile: ${context.currentFile}\nCode:\n${context.currentCode}\n\n[TASK]\n${message}`;

            let deltasReceived = false;
            const unsubscribeDelta = session.on('assistant.message_delta', (delta) => {
                deltasReceived = true;
                const chunk = delta?.deltaContent || delta?.content || delta?.data?.deltaContent ||
                    (delta?.choices && delta.choices[0]?.delta?.content);
                if (chunk) webContents.send('copilot:chunk', chunk);
            });

            const unsubscribeMsg = session.on('assistant.message', (msg) => {
                const content = msg?.data?.content || msg?.content;
                logToConsole(`📦 REPLY: ${content?.substring(0, 50).replace(/\n/g, ' ')}...`);
                if (content && !deltasReceived) webContents.send('copilot:chunk', content);
            });

            session.on('assistant.tool_call', (call) => {
                logToConsole(`🔧 AGENT TOOL CALL: ${call.data.toolName}`);
            });

            // Set mode 'immediate' for faster agentic response
            await session.send({
                prompt: promptContent,
                mode: 'immediate'
            });

            await new Promise(r => session.on('session.idle', r));

            if (unsubscribeDelta) unsubscribeDelta();
            if (unsubscribeMsg) unsubscribeMsg();

            webContents.send('copilot:done');
            logToConsole("🏁 CYCLE_COMPLETE");

        } catch (error) {
            logToConsole(`🔥 FATAL: ${error.message}`);
            webContents.send('copilot:error', error.message);
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