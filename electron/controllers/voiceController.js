/**
 * Voice Transcription Controller
 * 
 * Receives base64-encoded audio from the frontend MediaRecorder,
 * and transcribes it using multiple fallback services.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const FormData = require('form-data');
const axios = require('axios');

const LOG_PATH = path.join(process.cwd(), 'ai_debug.log');

function log(msg) {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}][VOICE] ${msg}`;
    console.log(logMsg);
    try { fs.appendFileSync(LOG_PATH, logMsg + '\n'); } catch (e) { }
}

/**
 * Main entry point - tries multiple transcription backends
 */
async function transcribeAudio(base64Audio) {
    log(`🎤 Received audio data (${base64Audio.length} chars base64)`);

    const audioBuffer = Buffer.from(base64Audio, 'base64');
    log(`🎤 Audio buffer size: ${audioBuffer.length} bytes`);

    if (audioBuffer.length < 1000) {
        log("🎤 Audio too short, ignoring");
        return '';
    }

    // Save temp file
    const tempDir = require('os').tmpdir();
    const tempFile = path.join(tempDir, `lumo_voice_${Date.now()}.webm`);
    fs.writeFileSync(tempFile, audioBuffer);
    log(`🎤 Saved temp file: ${tempFile}`);

    try {
        // Try GitHub Models Whisper API first
        const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        if (!token) log("🎤 ⚠️ No GITHUB_TOKEN found in process.env");
        if (token) {
            log("🎤 Attempting GitHub Models Whisper...");
            try {
                const result = await githubModelsWhisper(tempFile, token);
                if (result && result.trim()) {
                    log(`🎤 ✅ GitHub Models transcription: "${result}"`);
                    return result;
                }
            } catch (e) {
                const errMsg = e.response?.data ? JSON.stringify(e.response.data) : e.message;
                log(`🎤 GitHub Models failed: ${errMsg}`);
            }
        }

        // Fallback: Hugging Face free inference API
        log("🎤 Attempting Hugging Face Whisper...");
        try {
            const result = await huggingFaceWhisper(tempFile);
            if (result && result.trim()) {
                log(`🎤 ✅ Hugging Face transcription: "${result}"`);
                return result;
            }
        } catch (e) {
            const errMsg = e.response?.data ? JSON.stringify(e.response.data) : e.message;
            log(`🎤 Hugging Face failed: ${errMsg}`);
        }

        log("🎤 ❌ All transcription services failed");
        return '__TRANSCRIPTION_FAILED__';
    } finally {
        try { fs.unlinkSync(tempFile); } catch (e) { }
    }
}

/**
 * GitHub Models Whisper API using axios/form-data
 */
async function githubModelsWhisper(filePath, token) {
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');

    // We try 'whisper-1' first (standard), then 'openai/whisper-large-v3-turbo' if that fails
    const tryModel = async (modelName) => {
        const payload = {
            file: base64,
            model: modelName,
            response_format: 'text'
        };

        log(`🎤 Sending JSON Base64 to GitHub Models [${modelName}] (${base64.length} chars)...`);
        return await axios.post('https://models.inference.ai.azure.com/audio/transcriptions',
            JSON.stringify(payload), // Explicit stringify
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 45000
            }
        );
    };

    try {
        const response = await tryModel('whisper-1');
        log(`🎤 GitHub Models [whisper-1] status: ${response.status}`);
        return response.data.text || (typeof response.data === 'string' ? response.data : '');
    } catch (e) {
        const isModelError = e.response?.data?.error?.code === 'unknown_model' || e.message.includes('404');
        if (isModelError) {
            log("🎤 Model 'whisper-1' not found, trying fallback 'openai/whisper-large-v3-turbo'...");
            const response = await tryModel('openai/whisper-large-v3-turbo');
            return response.data.text || (typeof response.data === 'string' ? response.data : '');
        }
        throw e; // Re-throw if it's a different error
    }
}

/**
 * Hugging Face using axios
 */
async function huggingFaceWhisper(filePath) {
    const fileData = fs.readFileSync(filePath);

    log(`🎤 Sending to Hugging Face (${fileData.length} bytes)...`);
    const response = await axios.post(
        'https://router.huggingface.co/models/openai/whisper-large-v3',
        fileData,
        {
            headers: { 'Content-Type': 'audio/webm' },
            timeout: 45000
        }
    );

    log(`🎤 HuggingFace status: ${response.status}`);
    return response.data.text || '';
}

module.exports = { transcribeAudio };
