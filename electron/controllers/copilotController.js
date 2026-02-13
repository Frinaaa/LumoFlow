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
                    content: `You are LumoFlow AI, an elite coding agent with two distinct modes of operation.

--- MODE 1: INTERACTIVE ASSISTANT (Default) ---
Used when the user chats or asks for code changes.
1. When asked to modify, refactor, or write code, ALWAYS use the 'write_file' tool.
2. The 'write_file' tool stages changes for a Diff View (Red/Green) review.
3. In your verbal response, briefly explain what you changed.
4. Do NOT ask for permission before using 'write_file' if the user's intent is clear.

--- MODE 2: VISUALIZATION ENGINE (Trigger: "[GENERATE_VISUALS]") ---
Used ONLY when the user prompt starts with "[GENERATE_VISUALS]".
1. Do NOT use tools. Do NOT chat.
2. Analyze the provided code and generate a JSON array of "TraceFrames".
3. VISUAL RULES:
   - Logic/Math -> 'circle' shape, Neon colors.
   - String/Text -> 'card' shape, Warm colors.
   - Arrays/Sorting -> 'bar' or 'circle' shapes. Highlight comparison/swaps.
   - Errors -> 'square' shape, Red color.
4. OUTPUT: Return strictly the JSON array.

--- FRAME SCHEMA FOR MODE 2 ---
{
  "id": number,
  "layout": "flex-row" | "flex-col" | "grid",
  "action": "READ" | "WRITE" | "EXECUTE",
  "desc": "Short explanation",
  "elements": [
    { "id": "x", "value": "val", "color": "hex", "shape": "circle"|"square"|"card", "highlight": boolean, "label": "varName" }
  ]
}

AGENT TOOLS:
- write_file(code: string): Stages code for review (Mode 1 only).`
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
                            logToConsole("🛠️ AI AGENT ACTION: Staging code for review");
                            if (webContents) {
                                // Send to Diff View for user review (Accept/Discard)
                                webContents.send('editor:preview-diff', code);
                            }
                            return "✅ Changes staged for review. Please check the Diff View in your editor and Accept or Discard.";
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
            logToConsole(`💭 USER_QUERY: "${message.substring(0, 50)}..."`);

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