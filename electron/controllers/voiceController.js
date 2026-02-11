const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const FormData = require('form-data');

// 🚀 Using Groq for instant speed
const API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

const LOG_PATH = path.join(process.cwd(), 'ai_debug.log');

function log(msg) {
    const timestamp = new Date().toISOString();
    console.log(`[VOICE] ${msg}`);
    try { fs.appendFileSync(LOG_PATH, `[${timestamp}] ${msg}\n`); } catch (e) { }
}

async function transcribeAudio(base64Audio) {
    log(`🎤 Audio data received (${base64Audio.length} chars)`);

    // 1. Check for Key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        log("❌ ERROR: GROQ_API_KEY is missing in .env file");
        return '__TRANSCRIPTION_FAILED__';
    }

    // 2. Create Temp File
    const audioBuffer = Buffer.from(base64Audio, 'base64');
    const tempFile = path.join(os.tmpdir(), `voice_${Date.now()}.m4a`); // Groq likes m4a/mp3
    fs.writeFileSync(tempFile, audioBuffer);

    try {
        // 3. Prepare Form Data
        const form = new FormData();
        form.append('file', fs.createReadStream(tempFile));
        form.append('model', 'whisper-large-v3-turbo'); // Groq's fast model
        form.append('response_format', 'json');

        log("📡 Sending to Groq Cloud...");

        // 4. Send Request
        const response = await axios.post(API_URL, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${apiKey.trim()}`
            },
            timeout: 10000 // 10 seconds timeout
        });

        // 5. Success
        const text = response.data.text;
        if (text) {
            log(`✅ Transcribed: "${text}"`);
            return text;
        }

    } catch (error) {
        log(`❌ API Error: ${error.response?.data?.error?.message || error.message}`);
    } finally {
        // 6. Cleanup
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }

    return '__TRANSCRIPTION_FAILED__';
}

module.exports = { transcribeAudio };