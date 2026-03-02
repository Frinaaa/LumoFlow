const { GoogleGenAI } = require('@google/genai');

// 🎬 STRICT SYSTEM INSTRUCTION - CPU SIMULATOR (NO CORRECTIONS ALLOWED)
const SYSTEM_INSTRUCTION = `You are "Lumo Neural Director" - a STRICT CPU-level Code Simulator.

=== ABSOLUTE RULES (VIOLATION = FAILURE) ===

RULE 1: SIMULATE CODE EXACTLY AS WRITTEN.
- You are a CPU. Execute each line literally.
- If code says \`if (x > 5)\` but should be \`if (x < 5)\`, simulate with \`>\`. NEVER fix it.
- If loop condition is wrong and causes infinite loop, generate 20 frames of the loop then END.
- If variable is undefined, show "undefined" in memory. Do NOT assume a value.

RULE 2: TERMINAL OUTPUT IS ABSOLUTE TRUTH.
- You receive the actual execution output. Your frames MUST match it EXACTLY.
- If output says "[3, 1, 5, 2]" then final array state MUST be [3, 1, 5, 2].

RULE 3: USE EXACT VARIABLE NAMES FROM CODE.

RULE 4: OUTPUT FORMAT - RAW JSON ARRAY ONLY.
- Start with [ and end with ]. No markdown. No text before or after.
- Minified. No newlines.

RULE 5: TOTAL TRACE - NO SAMPLING, NO CONDENSING, NO EARLY STOPPING.
- You MUST simulate EVERY SINGLE operation. 
- DO NOT say "repeating process..." or skip iterations.
- For sorting algorithms (Bubble, Selection, etc.):
  * You MUST show EVERY comparison (action: COMPARE).
  * You MUST show EVERY swap (action: SWAP) or assignment (action: WRITE).
  * You MUST show EVERY pass of the outer loop.
  * If an array of 8 elements is sorted, this will require 100+ frames. GENERATE ALL OF THEM.
- For loops: If a loop runs 50 times, you MUST generate frames for all 50 iterations.
- If you reach the token limit, continue as much as possible until a valid JSON closure.
- The LAST frame MUST be action "END" representing the final state.

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

=== FRAME COMPLETION ===
- CRITICAL: Do NOT summarize. Do NOT skip steps even if they seem repetitive.
- The user wants to see the FULL process until the terminal output state is reached.
- There is NO maximum frame count limit. Generate 200+ frames if the algorithm requires it.`;


`=== TOWER_OF_HANOI CORE RULES ===
If the user code is Tower of Hanoi, you MUST act as a state machine:
1. "type" MUST be "TOWER_OF_HANOI".
2. You MUST maintain three arrays in "memory": "A", "B", and "C".
3. These arrays contain numbers (3 = large, 1 = small).
4. Every time a move happens, you MUST update these arrays.
   Example Frame Memory: {"A": [3, 2], "B": [1], "C": [], "n": 3, "from": "A", "to": "B"}`

let ai = null;
function getAI() {
    if (!ai) {
        if (!process.env.GEMINI_API_KEY) return null;
        ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
    }
    return ai;
}

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
Convert the following code into a complete, step-by-step logic trace from start to FINAL output state.
Use the "Execution Output" above to determine the FINAL state of all variables.
Every frame must represent a real micro-operation observed in the logic.
IMPORTANT: Do NOT stop early. Trace EVERY iteration of every loop, EVERY comparison and EVERY swap.
The LAST frame must be action "END" with memory matching the terminal output exactly.
Generate as many frames as the algorithm actually requires — there is no frame limit.

Code to process:
${code}

RESPOND ONLY WITH THE MINIFIED JSON ARRAY.`;

        const aiClient = getAI();
        if (!aiClient) {
            webContents.send('ai:visual-error', "Gemini API Client could not be initialized. Check your API Key.");
            return;
        }

        try {
            const response = await aiClient.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    temperature: 0.1,
                    maxOutputTokens: 131072,
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