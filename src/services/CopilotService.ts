/**
 * 🤖 Copilot AI Service - Powered by GitHub Copilot SDK
 * 
 * A smart AI coding assistant with tools for code execution, analysis, and debugging.
 * Now powered by GitHub Copilot SDK with intelligent local fallback.
 */

import { CopilotSDKService, getCopilotSDKService } from './CopilotSDKService';

// ============================================
// 🛠️ TOOL INTERFACES
// ============================================

export interface ToolParameter {
    type: string;
    description: string;
    enum?: string[];
}

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, ToolParameter>;
        required?: string[];
    };
    handler: (args: Record<string, any>, context?: CopilotContext) => Promise<any>;
}

export interface ToolCall {
    tool: string;
    args: Record<string, any>;
}

export interface CopilotContext {
    currentCode?: string;
    currentFile?: string;
    problems?: Array<{ line: number; message: string }>;
    analysisData?: any;
    executeCode?: () => void;
    clearOutput?: () => void;
}

// ============================================
// ▶️ RUN CODE TOOL
// ============================================

const runCodeTool: ToolDefinition = {
    name: 'run_code',
    description: 'Execute the current code in the editor',
    parameters: {
        type: 'object',
        properties: {}
    },
    handler: async (_, context) => {
        if (context?.executeCode) {
            setTimeout(() => {
                context.executeCode?.();
            }, 500);
            return { success: true, message: '▶️ Running code...' };
        }
        return { success: false, message: 'Code execution not available' };
    }
};

// ============================================
// 🗑️ CLEAR OUTPUT TOOL
// ============================================

const clearOutputTool: ToolDefinition = {
    name: 'clear_output',
    description: 'Clear the output and debug console',
    parameters: {
        type: 'object',
        properties: {}
    },
    handler: async (_, context) => {
        if (context?.clearOutput) {
            context.clearOutput();
            return { success: true, message: '🗑️ Output cleared!' };
        }
        return { success: false, message: 'Clear function not available' };
    }
};

// ============================================
// 🔍 CODE ANALYSIS TOOL
// ============================================

const analyzeCodeTool: ToolDefinition = {
    name: 'analyze_code',
    description: 'Analyze the current code structure and provide insights',
    parameters: {
        type: 'object',
        properties: {}
    },
    handler: async (_, context) => {
        const code = context?.currentCode || '';
        if (!code) {
            return { error: 'No code to analyze' };
        }

        const lines = code.split('\n');
        const analysis = {
            totalLines: lines.length,
            codeLines: lines.filter(l => l.trim() && !l.trim().startsWith('//')).length,
            commentLines: lines.filter(l => l.trim().startsWith('//')).length,
            emptyLines: lines.filter(l => !l.trim()).length,
            hasVariables: /(?:let|const|var)\s+\w+/.test(code),
            hasFunctions: /function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{/.test(code),
            hasLoops: /for\s*\(|while\s*\(|\.forEach|\.map|\.filter/.test(code),
            hasConditions: /if\s*\(|else|switch/.test(code),
            hasClasses: /class\s+\w+/.test(code),
            hasAsyncCode: /async|await|Promise|\.then/.test(code),
            hasImports: /import\s+|require\(/.test(code),
            hasExports: /export\s+/.test(code),
        };

        return analysis;
    }
};

// ============================================
// 📚 CODING TOOLS REGISTRY
// ============================================

export const COPILOT_TOOLS: Record<string, ToolDefinition> = {
    run_code: runCodeTool,
    clear_output: clearOutputTool,
    analyze_code: analyzeCodeTool,
};

// ============================================
// 🤖 MAIN COPILOT SERVICE CLASS
// ============================================

export class CopilotService {
    private tools: Record<string, ToolDefinition>;
    private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    private context: CopilotContext = {};
    private sdkService: CopilotSDKService | null = null;
    private sdkInitPromise: Promise<void> | null = null;
    private useSDK: boolean = true;

    constructor(tools: Record<string, ToolDefinition> = COPILOT_TOOLS) {
        this.tools = tools;
        this.initializeSDK();
    }

    /**
     * Initialize the GitHub Copilot SDK
     */
    private async initializeSDK(): Promise<void> {
        if (this.sdkInitPromise) return this.sdkInitPromise;

        this.sdkInitPromise = (async () => {
            try {
                // Get token from localStorage (browser) or environment
                const token = this.getGitHubToken();

                if (token) {
                    this.sdkService = await getCopilotSDKService(token);
                    await this.sdkService.initialize();
                    console.log('✅ GitHub Copilot SDK initialized');
                    this.useSDK = true;
                } else {
                    console.log('⚠️ No GitHub token found, using local AI');
                    this.useSDK = false;
                }
            } catch (error) {
                console.error('❌ Failed to initialize Copilot SDK:', error);
                this.useSDK = false;
            }
        })();

        return this.sdkInitPromise;
    }

    /**
     * Get GitHub token from available sources
     */
    private getGitHubToken(): string | null {
        // Try localStorage first (browser environment)
        if (typeof localStorage !== 'undefined') {
            const token = localStorage.getItem('github_token') ||
                localStorage.getItem('GITHUB_TOKEN') ||
                localStorage.getItem('github_copilot_token');
            if (token) return token;
        }

        // Try process.env (Node.js environment)
        if (typeof process !== 'undefined' && process.env) {
            return process.env.GITHUB_TOKEN || null;
        }

        return null;
    }

    /**
     * Set the execution context (current code, file, problems, etc.)
     */
    setContext(context: CopilotContext) {
        this.context = context;

        // Also update SDK context if available
        if (this.sdkService) {
            this.sdkService.setContext(context);
        }
    }

    /**
     * Process a user message and return a response
     */
    async chat(message: string): Promise<string> {
        this.conversationHistory.push({ role: 'user', content: message });

        let response: string;

        // Check if we need to call a tool first (for instant actions)
        const toolCall = this.detectToolCall(message);

        if (toolCall) {
            // Execute the tool and format response
            const toolResult = await this.executeTool(toolCall);
            response = this.formatToolResponse(toolCall, toolResult, message);
        } else {
            // Try GitHub Copilot SDK first
            if (this.useSDK && this.sdkService) {
                try {
                    // Wait for SDK init if still in progress
                    await this.sdkInitPromise;

                    if (this.sdkService.isReady()) {
                        response = await this.sdkService.chat(message);
                    } else {
                        // SDK not ready, use local
                        response = this.generateCodingResponse(message);
                    }
                } catch (error) {
                    console.error('SDK chat error, falling back to local:', error);
                    response = this.generateCodingResponse(message);
                }
            } else {
                // Use intelligent local coding response
                response = this.generateCodingResponse(message);
            }
        }

        this.conversationHistory.push({ role: 'assistant', content: response });
        return response;
    }

    /**
     * Detect which tool to call based on message content
     */
    detectToolCall(message: string): ToolCall | null {
        const lower = message.toLowerCase();

        // Run code
        if (lower.match(/run.*code|execute.*code|test.*code|run this|run it|execute|start.*program/)) {
            return { tool: 'run_code', args: {} };
        }

        // Clear output
        if (lower.match(/clear.*output|clear.*console|clean.*output|reset.*output/)) {
            return { tool: 'clear_output', args: {} };
        }

        // Analyze code
        if (lower.match(/analyze.*code|code.*analysis|what does.*code.*do|examine.*code|review.*code/)) {
            return { tool: 'analyze_code', args: {} };
        }

        return null;
    }

    /**
     * Execute a tool and return its result
     */
    private async executeTool(toolCall: ToolCall): Promise<any> {
        const tool = this.tools[toolCall.tool];
        if (!tool) {
            return { error: `Tool "${toolCall.tool}" not found` };
        }

        try {
            return await tool.handler(toolCall.args, this.context);
        } catch (error: any) {
            return { error: error.message };
        }
    }

    /**
     * Format tool result into a human-readable response
     */
    private formatToolResponse(toolCall: ToolCall, result: any, _originalMessage: string): string {
        if (result.error) {
            return `❌ ${result.error}. Please open a file with code first.`;
        }

        switch (toolCall.tool) {
            case 'run_code':
                return result.success
                    ? `${result.message}\n\nCheck the **Output** tab to see the results!`
                    : `⚠️ ${result.message}`;

            case 'clear_output':
                return result.success
                    ? `${result.message}`
                    : `⚠️ ${result.message}`;

            case 'analyze_code':
                return `📊 **Code Analysis**\n\n` +
                    `**Lines:** ${result.totalLines} total (${result.codeLines} code, ${result.commentLines} comments, ${result.emptyLines} empty)\n\n` +
                    `**Features detected:**\n` +
                    (result.hasVariables ? '✓ Variables\n' : '') +
                    (result.hasFunctions ? '✓ Functions\n' : '') +
                    (result.hasLoops ? '✓ Loops\n' : '') +
                    (result.hasConditions ? '✓ Conditionals\n' : '') +
                    (result.hasClasses ? '✓ Classes\n' : '') +
                    (result.hasAsyncCode ? '✓ Async/Await\n' : '') +
                    (result.hasImports ? '✓ Imports\n' : '') +
                    (result.hasExports ? '✓ Exports\n' : '') +
                    `\nWould you like me to explain any part of the code?`;

            default:
                return `Tool result:\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
        }
    }

    /**
     * Generate intelligent coding response
     */
    private generateCodingResponse(message: string): string {
        const q = message.toLowerCase();
        const code = this.context.currentCode || '';
        const problems = this.context.problems || [];
        const fileName = this.context.currentFile || 'untitled';

        // Greeting
        if (q.match(/^(hi|hello|hey|greetings)/)) {
            return `👋 Hello! I'm your **AI Coding Assistant**!\n\n` +
                `I can help you with:\n\n` +
                `▶️ **"Run this code"** - Execute your code\n` +
                `📊 **"Analyze my code"** - Get code insights\n` +
                `🗑️ **"Clear output"** - Clear the console\n` +
                `🐛 **"Fix this error"** - Debug help\n` +
                `💡 **"Explain this code"** - Code explanations\n` +
                `📝 **"How do I..."** - Programming questions\n\n` +
                `What can I help you with?`;
        }

        // Help
        if (q.includes('help') || q.includes('what can you do')) {
            return `🤖 **AI Coding Assistant**\n\n` +
                `**Available Commands:**\n` +
                `▶️ "Run code" / "Execute" - Run your code\n` +
                `📊 "Analyze code" - Get code structure insights\n` +
                `🗑️ "Clear output" - Clear the console\n\n` +
                `**I can also help with:**\n` +
                `• Explaining code and concepts\n` +
                `• Debugging errors\n` +
                `• Writing code examples\n` +
                `• Answering programming questions\n` +
                `• Best practices and patterns\n\n` +
                `Just ask me anything about coding!`;
        }

        // Error/Debug help
        if (q.match(/error|bug|fix|debug|wrong|issue|problem|doesn't work|not working/)) {
            if (problems.length > 0) {
                let response = `🐛 I found **${problems.length} issue(s)** in your code:\n\n`;
                problems.slice(0, 5).forEach((p, i) => {
                    response += `**${i + 1}. Line ${p.line}:** ${p.message.split('\n')[0]}\n`;
                });
                response += `\n**Suggestions:**\n`;
                response += `• Check for typos and syntax errors\n`;
                response += `• Ensure all variables are declared\n`;
                response += `• Verify function calls and parameters\n`;
                response += `• Check for missing brackets or semicolons`;
                return response;
            } else {
                return `🔍 I don't see any syntax errors in your code!\n\n` +
                    `If you're having issues:\n` +
                    `1. Try running the code to see runtime errors\n` +
                    `2. Check the Output tab for error messages\n` +
                    `3. Describe the specific problem you're facing\n\n` +
                    `What exactly isn't working?`;
            }
        }

        // Explain code
        if (q.match(/explain|what does|how does|tell me about|understand/)) {
            if (!code) {
                return `📝 Please open a file with code first, and I'll explain what it does!`;
            }

            const lines = code.split('\n').length;
            let response = `📝 **Code Explanation** (${fileName})\n\n`;
            response += `Your code has **${lines} lines**.\n\n`;

            // Detect what's in the code
            if (/function\s+\w+|const\s+\w+\s*=\s*\(/.test(code)) {
                response += `**Functions detected** - Code is organized into reusable functions.\n`;
            }
            if (/for\s*\(|while\s*\(|\.forEach|\.map/.test(code)) {
                response += `**Loops detected** - Code iterates over data.\n`;
            }
            if (/if\s*\(|else|switch/.test(code)) {
                response += `**Conditionals detected** - Code makes decisions.\n`;
            }
            if (/class\s+\w+/.test(code)) {
                response += `**Classes detected** - Object-oriented structure.\n`;
            }
            if (/async|await|Promise/.test(code)) {
                response += `**Async code detected** - Handles asynchronous operations.\n`;
            }

            response += `\n💡 Would you like me to explain a specific part?`;
            return response;
        }

        // How to questions
        if (q.match(/how (do|can|to|should)|what is|what's the/)) {
            return this.generateHowToResponse(q);
        }

        // Write code
        if (q.match(/write|create|make|generate|code for|implement/)) {
            return this.generateCodeExample(q);
        }

        // Optimize
        if (q.match(/optimize|improve|better|faster|performance|refactor/)) {
            if (!code) {
                return `⚡ Please open a file with code first, and I'll suggest optimizations!`;
            }
            return `⚡ **Optimization Tips:**\n\n` +
                `1. **Use const/let** instead of var\n` +
                `2. **Avoid nested loops** when possible\n` +
                `3. **Cache array lengths** in loops\n` +
                `4. **Use modern methods** like map, filter, reduce\n` +
                `5. **Destructure objects** for cleaner code\n` +
                `6. **Use async/await** instead of callbacks\n\n` +
                `Would you like specific suggestions for your code?`;
        }

        // Default response
        return `💬 I'm here to help with coding!\n\n` +
            `Try asking me to:\n` +
            `• **"Run this code"** - Execute your program\n` +
            `• **"Analyze my code"** - Get insights\n` +
            `• **"Explain this"** - Understand code\n` +
            `• **"How do I..."** - Learn concepts\n` +
            `• **"Fix this error"** - Debug help\n\n` +
            `What would you like help with?`;
    }

    /**
     * Generate responses for "how to" questions
     */
    private generateHowToResponse(question: string): string {
        const q = question.toLowerCase();

        if (q.includes('loop') || q.includes('iterate')) {
            return `🔄 **Loops in JavaScript:**\n\n` +
                `\`\`\`javascript\n` +
                `// For loop\n` +
                `for (let i = 0; i < 5; i++) {\n` +
                `  console.log(i);\n` +
                `}\n\n` +
                `// For...of (arrays)\n` +
                `const arr = [1, 2, 3];\n` +
                `for (const item of arr) {\n` +
                `  console.log(item);\n` +
                `}\n\n` +
                `// forEach\n` +
                `arr.forEach(item => console.log(item));\n` +
                `\`\`\``;
        }

        if (q.includes('function')) {
            return `📦 **Functions in JavaScript:**\n\n` +
                `\`\`\`javascript\n` +
                `// Function declaration\n` +
                `function greet(name) {\n` +
                `  return "Hello, " + name;\n` +
                `}\n\n` +
                `// Arrow function\n` +
                `const greet = (name) => "Hello, " + name;\n\n` +
                `// Async function\n` +
                `async function fetchData() {\n` +
                `  const response = await fetch(url);\n` +
                `  return response.json();\n` +
                `}\n` +
                `\`\`\``;
        }

        if (q.includes('array')) {
            return `📋 **Arrays in JavaScript:**\n\n` +
                `\`\`\`javascript\n` +
                `const arr = [1, 2, 3, 4, 5];\n\n` +
                `// Add elements\n` +
                `arr.push(6);        // Add to end\n` +
                `arr.unshift(0);     // Add to start\n\n` +
                `// Transform\n` +
                `const doubled = arr.map(x => x * 2);\n` +
                `const evens = arr.filter(x => x % 2 === 0);\n` +
                `const sum = arr.reduce((a, b) => a + b, 0);\n\n` +
                `// Find\n` +
                `const found = arr.find(x => x > 3);\n` +
                `const index = arr.indexOf(3);\n` +
                `\`\`\``;
        }

        if (q.includes('async') || q.includes('await') || q.includes('promise')) {
            return `⏳ **Async/Await in JavaScript:**\n\n` +
                `\`\`\`javascript\n` +
                `// Async function\n` +
                `async function fetchUser(id) {\n` +
                `  try {\n` +
                `    const response = await fetch(\`/api/users/\${id}\`);\n` +
                `    const user = await response.json();\n` +
                `    return user;\n` +
                `  } catch (error) {\n` +
                `    console.error('Error:', error);\n` +
                `  }\n` +
                `}\n\n` +
                `// Call it\n` +
                `const user = await fetchUser(1);\n` +
                `\`\`\``;
        }

        if (q.includes('class') || q.includes('object')) {
            return `🏗️ **Classes in JavaScript:**\n\n` +
                `\`\`\`javascript\n` +
                `class Person {\n` +
                `  constructor(name, age) {\n` +
                `    this.name = name;\n` +
                `    this.age = age;\n` +
                `  }\n\n` +
                `  greet() {\n` +
                `    return \`Hello, I'm \${this.name}\`;\n` +
                `  }\n` +
                `}\n\n` +
                `const person = new Person('Alice', 25);\n` +
                `console.log(person.greet());\n` +
                `\`\`\``;
        }

        return `💡 I can help with that!\n\n` +
            `Could you be more specific? For example:\n` +
            `• "How do I create a loop?"\n` +
            `• "How do I write a function?"\n` +
            `• "How do I work with arrays?"\n` +
            `• "How do I use async/await?"\n` +
            `• "How do I create a class?"`;
    }

    /**
     * Generate code examples based on request
     */
    private generateCodeExample(question: string): string {
        const q = question.toLowerCase();

        if (q.includes('sort')) {
            return `📊 **Sorting Example:**\n\n` +
                `\`\`\`javascript\n` +
                `const numbers = [64, 34, 25, 12, 22, 11, 90];\n\n` +
                `// Simple sort (ascending)\n` +
                `const sorted = [...numbers].sort((a, b) => a - b);\n` +
                `console.log(sorted); // [11, 12, 22, 25, 34, 64, 90]\n\n` +
                `// Descending\n` +
                `const desc = [...numbers].sort((a, b) => b - a);\n` +
                `console.log(desc); // [90, 64, 34, 25, 22, 12, 11]\n` +
                `\`\`\``;
        }

        if (q.includes('fetch') || q.includes('api') || q.includes('request')) {
            return `🌐 **API Request Example:**\n\n` +
                `\`\`\`javascript\n` +
                `async function fetchData() {\n` +
                `  try {\n` +
                `    const response = await fetch('https://api.example.com/data');\n` +
                `    \n` +
                `    if (!response.ok) {\n` +
                `      throw new Error('Network response was not ok');\n` +
                `    }\n` +
                `    \n` +
                `    const data = await response.json();\n` +
                `    console.log(data);\n` +
                `    return data;\n` +
                `  } catch (error) {\n` +
                `    console.error('Fetch error:', error);\n` +
                `  }\n` +
                `}\n\n` +
                `fetchData();\n` +
                `\`\`\``;
        }

        if (q.includes('timer') || q.includes('interval') || q.includes('timeout')) {
            return `⏱️ **Timer Examples:**\n\n` +
                `\`\`\`javascript\n` +
                `// Run once after delay\n` +
                `setTimeout(() => {\n` +
                `  console.log('Runs after 2 seconds');\n` +
                `}, 2000);\n\n` +
                `// Run repeatedly\n` +
                `const intervalId = setInterval(() => {\n` +
                `  console.log('Runs every second');\n` +
                `}, 1000);\n\n` +
                `// Stop interval after 5 seconds\n` +
                `setTimeout(() => {\n` +
                `  clearInterval(intervalId);\n` +
                `  console.log('Interval stopped');\n` +
                `}, 5000);\n` +
                `\`\`\``;
        }

        return `📝 I can write code for many things!\n\n` +
            `Try asking:\n` +
            `• "Write a sorting algorithm"\n` +
            `• "Create an API request"\n` +
            `• "Make a timer function"\n` +
            `• "Generate a class example"\n\n` +
            `What would you like me to write?`;
    }
}

// ============================================
// 📤 EXPORT SINGLETON INSTANCE
// ============================================

export const copilotService = new CopilotService();
