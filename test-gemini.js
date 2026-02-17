const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const testCode = `
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}
const result = bubbleSort([5, 2, 8, 1]);
console.log(result);
`;

const prompt = `Analyze this code and generate a JSON array of execution frames. Each frame should have: id, action, desc, memory, comparing, swapping, focusLine.

Code:
${testCode}

Output ONLY a JSON array, no markdown, no explanation.`;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function runTest() {
    console.log('🧪 Testing Gemini API with new @google/genai SDK...');
    console.log('API Key:', process.env.GEMINI_API_KEY ? '✓ Found' : '✗ Missing');
    console.log('Model: gemini-2.5-flash-lite');
    console.log('');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                temperature: 0.1,
                maxOutputTokens: 2048,
                responseMimeType: "application/json"
            }
        });

        const text = response.text;
        if (text) {
            console.log('✅ SUCCESS! Gemini is working!');
            console.log('Response length:', text.length, 'characters');
            console.log('First 200 chars:', text.substring(0, 200));
            process.exit(0);
        } else {
            console.log('❌ Empty Response');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.status) console.log('Status Code:', error.status);
        process.exit(1);
    }
}

runTest();
