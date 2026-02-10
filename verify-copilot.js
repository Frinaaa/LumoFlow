const path = require('path');
require('dotenv').config();

async function testConnection() {
    console.log("🔍 Starting Copilot SDK Verification...");

    // 1. Check Token
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (!token) {
        console.error("❌ FAILURE: No GITHUB_TOKEN found in .env file.");
        console.log("   👉 Create a .env file with GITHUB_TOKEN=ghp_your_token_here");
        return;
    }
    console.log(`✅ Token found (Length: ${token.length})`);

    // 2. Load SDK
    let CopilotClient;
    try {
        const sdk = await import('@github/copilot-sdk');
        CopilotClient = sdk.CopilotClient;
        console.log("✅ SDK Loaded Successfully");
    } catch (e) {
        console.error("❌ FAILURE: Could not load '@github/copilot-sdk'.");
        console.error("   👉 Run: npm install @github/copilot-sdk");
        console.error("   Error:", e.message);
        return;
    }

    // 3. Connect
    try {
        const client = new CopilotClient({
            githubToken: token,
            logLevel: 'debug'
        });

        console.log("⏳ Connecting to GitHub...");
        await client.start();
        console.log("✅ Client Started");

        // 4. Create Session (Testing user's model)
        console.log("⏳ Creating Session (claude-haiku-4.5)...");
        const session = await client.createSession({
            model: 'claude-haiku-4.5',
            systemMessage: { content: "Test." }
        });
        console.log("✅ Session Created!");

        // 5. Send Message
        const testPrompt = "Tell me a joke. Start with the word BANANA.";
        console.log(`⏳ Sending Test Message: '${testPrompt}'`);

        // Setup listener
        session.on('assistant.message', (msg) => {
            console.log("\n🎉 MESSAGE RECEIVED!");
            console.log("------------------------------------------------");
            console.log(msg.data.content);
            console.log("------------------------------------------------");
        });

        await session.send({ prompt: testPrompt });

        // Wait for a bit to ensure message is received
        await new Promise(r => setTimeout(r, 5000));

        await client.stop();
        process.exit(0);

    } catch (e) {
        console.error("\n❌ CONNECTION FAILED");
        console.error("Reason:", e.message);
        if (e.message.includes("401")) console.error("   👉 Your Token is invalid or expired.");
        if (e.message.includes("404")) console.error("   👉 You might not have access to Copilot API.");
        process.exit(1);
    }
}

testConnection();