const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

// 🎬 STRICT SYSTEM INSTRUCTION - CPU SIMULATOR (NO CORRECTIONS ALLOWED)
const SYSTEM_INSTRUCTION = `You are "Lumo Neural Director" - a STRICT CPU-level Code Simulator.

=== ABSOLUTE RULES (VIOLATION = FAILURE) ===

RULE 1: SIMULATE CODE EXACTLY AS WRITTEN.
- You are a CPU. Execute each line literally.
- If code says \`if (x > 5)\` but should be \`if (x < 5)\`, simulate with \`>\`. NEVER fix it.
- If loop condition is wrong and causes infinite loop, generate 12 frames of the loop then END.
- If variable is undefined, show "undefined" in memory. Do NOT assume a value.

RULE 2: TERMINAL OUTPUT IS ABSOLUTE TRUTH.
- You receive the actual execution output. Your frames MUST match it EXACTLY.
- If output says "[3, 1, 5, 2]" then final array state MUST be [3, 1, 5, 2], NOT [1, 2, 3, 5].
- If output is an error message, simulate frames leading to that error.

RULE 3: USE EXACT VARIABLE NAMES FROM CODE.
- If code says \`let nums = [5,3,1]\`, use "nums" not "arr" or "array".
- Include ALL variables: loop counters (i, j), temps, flags, everything.

RULE 4: OUTPUT FORMAT - RAW JSON ARRAY ONLY.
- Start with [ and end with ].
- No markdown. No backticks. No text before or after.
- Minified. No newlines between frames.



=== FRAME SCHEMA ===
{
  "id": 0,
  "action": "INIT"|"READ"|"COMPARE"|"SWAP"|"WRITE"|"BRANCH"|"END",
  "type": "ARRAY"|"VARIABLE"|"QUEUE"|"STACK"|"TOWER_OF_HANOI",
  "memory": {
    "nums": [5, 3, 1],
    "i": 0,
    "j": 1,
    "temp": null
  },
  "metadata": {
    "highlightIndex": [0, 1],
    "pointerName": "j"
  },
  "desc": "Narrator script"
}

=== VISUAL MAPPING ===
- action "COMPARE" -> Orange glow on highlighted bubbles
- action "SWAP" -> Pink pulse + shake animation on bubbles
- action "WRITE" -> Cyan flash on changed variable
- action "BRANCH" -> Red flash for conditional branching
- action "END" -> Final state summary
- "metadata.highlightIndex" -> Which array indices to highlight
- "metadata.pointerName" -> Label shown above highlighted bubble
- ALL non-array variables (i, j, temp, flag) appear in scalar sidebar automatically

=== NARRATION RULES ===
- Professional female AI voice. Technical but clear.
- ALWAYS reference specific values: "Element at index 2 is 8, comparing with index 3 which is 1."
- If code is buggy, narrate the bug: "The condition uses >= instead of >, causing an extra iteration."
- Keep descriptions under 25 words per frame.

=== FRAME COUNT ===
- Simple code (< 10 lines): 5-10 frames
- Medium code (10-30 lines): 10-20 frames
- Complex/loops: 15-30 frames max
- Buggy infinite loops: 12 frames then END with explanation`;


`=== TOWER_OF_HANOI CORE RULES ===
If the user code is Tower of Hanoi, you MUST act as a state machine:
1. "type" MUST be "TOWER_OF_HANOI".
2. You MUST maintain three arrays in "memory": "A", "B", and "C".
3. These arrays contain numbers (3 = large, 1 = small).
4. Every time a move happens, you MUST update these arrays.
   Example Frame Memory: {"A": [3, 2], "B": [1], "C": [], "n": 3, "from": "A", "to": "B"}`
   
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const geminiController = {
    async streamVisuals(event, { code, output }) {
        const webContents = event.sender;

        if (!process.env.GEMINI_API_KEY) {
            webContents.send('ai:visual-error', "Gemini API Key not found");
            return;
        }

        const prompt = `${SYSTEM_INSTRUCTION}

[RUNTIME GROUND TRUTH]
Execution Output (from terminal): 
${output || 'No output generated.'}

[TASK]
Convert the following code into a step-by-step logic trace. 
Use the "Execution Output" above to determine the FINAL state of all variables. 
Every frame must represent a real micro-operation observed in the logic.

Code to process:
${code}

RESPOND ONLY WITH THE MINIFIED JSON ARRAY.`;

        try {
            // Using the new generateContentStream for real-time feedback
            const response = await ai.models.generateContentStream({
                model: 'gemini-flash-latest',
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    temperature: 0.1,
                    maxOutputTokens: 16384,
                    responseMimeType: "application/json"
                }
            });

            for await (const chunk of response) {
                if (chunk.text) {
                    webContents.send('ai:visual-chunk', chunk.text);
                }
            }

            webContents.send('ai:visual-done');
        } catch (error) {
            console.error("❌ GEMINI SDK ERROR:", error);

            // The new SDK puts the status in error.status (number)
            // or sometimes it's hidden in the message
            const isRateLimit = error.status === 429 || error.message?.includes('429');

            if (isRateLimit) {
                webContents.send('ai:visual-error', '429');
            } else {
                // Send the actual message for other errors
                webContents.send('ai:visual-error', error.message || 'Unknown SDK Error');
            }
        }
    }
};

module.exports = geminiController;