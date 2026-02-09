/**
 * 🚀 GitHub Copilot SDK Service
 * 
 * A powerful AI coding assistant powered by GitHub Copilot SDK.
 * Provides real AI responses through the official Copilot SDK with custom tools.
 */

import { z } from 'zod';

// ============================================
// 📦 TYPE DEFINITIONS
// ============================================

export interface CopilotContext {
    currentCode?: string;
    currentFile?: string;
    problems?: Array<{ line: number; message: string }>;
    analysisData?: any;
    executeCode?: () => void;
    clearOutput?: () => void;
}

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: z.ZodObject<any>;
    handler: (args: Record<string, any>, context?: CopilotContext) => Promise<any>;
}

interface CopilotSDKConfig {
    githubToken: string;
    model?: string;
    streaming?: boolean;
    reasoningEffort?: 'low' | 'medium' | 'high';
}

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// ============================================
// 🛠️ CUSTOM TOOLS FOR COPILOT
// ============================================

const createTools = (context: CopilotContext) => {
    // We'll define tools that match the defineTool pattern from the SDK
    return [
        {
            name: 'run_code',
            description: 'Execute the current code in the editor. Use this when the user asks to run, execute, or test their code.',
            parameters: z.object({}),
            handler: async () => {
                if (context?.executeCode) {
                    setTimeout(() => {
                        context.executeCode?.();
                    }, 500);
                    return { success: true, message: '▶️ Running code... Check the Output tab!' };
                }
                return { success: false, message: 'Code execution not available' };
            }
        },
        {
            name: 'clear_output',
            description: 'Clear the output and debug console. Use when the user asks to clear or reset the output.',
            parameters: z.object({}),
            handler: async () => {
                if (context?.clearOutput) {
                    context.clearOutput();
                    return { success: true, message: '🗑️ Output cleared!' };
                }
                return { success: false, message: 'Clear function not available' };
            }
        },
        {
            name: 'analyze_code',
            description: 'Analyze the current code structure and provide insights about the code.',
            parameters: z.object({}),
            handler: async () => {
                const code = context?.currentCode || '';
                if (!code) {
                    return { error: 'No code to analyze' };
                }

                const lines = code.split('\n');
                return {
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
                };
            }
        },
        {
            name: 'get_code_context',
            description: 'Get information about the current code file and any errors present.',
            parameters: z.object({}),
            handler: async () => {
                return {
                    fileName: context?.currentFile || 'untitled',
                    codeLength: context?.currentCode?.length || 0,
                    lineCount: context?.currentCode?.split('\n').length || 0,
                    problems: context?.problems || [],
                    hasErrors: (context?.problems?.length || 0) > 0
                };
            }
        }
    ];
};

// ============================================
// 🤖 COPILOT SDK SERVICE CLASS
// ============================================

export class CopilotSDKService {
    private client: any = null;
    private session: any = null;
    private config: CopilotSDKConfig;
    private context: CopilotContext = {};
    private conversationHistory: Message[] = [];
    private isInitialized: boolean = false;
    private initializationPromise: Promise<void> | null = null;

    constructor(config: CopilotSDKConfig) {
        this.config = {
            model: 'gpt-4o',
            streaming: true,
            reasoningEffort: 'medium',
            ...config
        };
    }

    /**
     * Get the current GitHub token
     */
    getToken(): string {
        return this.config.githubToken;
    }

    /**
     * Update the GitHub token and reset initialization state
     */
    updateToken(newToken: string): void {
        if (this.config.githubToken === newToken) return;
        this.config.githubToken = newToken;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.session = null;
        this.client = null;
        console.log('🔄 Copilot token updated, service reset and ready for re-initialization');
    }

    /**
     * Initialize the Copilot SDK client
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;
        if (this.initializationPromise) return this.initializationPromise;

        this.initializationPromise = this._doInitialize();
        return this.initializationPromise;
    }

    private async _doInitialize(): Promise<void> {
        // If in Electron, we rely on the main process for the heavy lifting
        if (typeof window !== 'undefined' && (window as any).api?.copilotChat) {
            console.log('🌐 Electron environment detected, using IPC bridge for Copilot');
            this.isInitialized = true;
            return;
        }

        try {
            console.log('📦 Initializing Copilot SDK locally...');
            // Dynamic import to avoid issues in browser environments
            const { CopilotClient, defineTool } = await import('@github/copilot-sdk');

            this.client = new CopilotClient({
                githubToken: this.config.githubToken,
                autoStart: true,
                autoRestart: true,
                logLevel: 'info'
            });

            // Set a timeout for initialization
            const startPromise = this.client.start();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Copilot CLI startup timeout')), 15000)
            );

            await Promise.race([startPromise, timeoutPromise]);

            // Create session with tools
            const tools = createTools(this.context);
            const sdkTools = tools.map(tool =>
                defineTool(tool.name, {
                    description: tool.description,
                    parameters: tool.parameters,
                    handler: async () => tool.handler()
                })
            );

            this.session = await this.client.createSession({
                model: this.config.model,
                streaming: this.config.streaming,
                tools: sdkTools,
                systemMessage: {
                    content: `You are an expert AI coding assistant integrated into LumoFlow, a visual code learning platform.

Your role is to help students learn programming by:
- Explaining code clearly and simply with educational context
- Helping debug errors with detailed, beginner-friendly explanations
- Providing code examples with helpful comments
- Answering programming questions at any level
- Being encouraging and supportive

You have access to these tools:
- run_code: Execute the user's code
- clear_output: Clear the console output
- analyze_code: Analyze code structure
- get_code_context: Get current file and error information

Always be helpful, educational, and encouraging. When showing code, explain what each part does.
Use markdown formatting for better readability.`
                }
            });

            this.isInitialized = true;
            console.log('✅ Copilot SDK initialized successfully');
        } catch (error: any) {
            console.error('❌ Failed to initialize Copilot SDK:', error.message);

            // Check for common issues
            if (error.message.includes('timeout')) {
                console.log('💡 The Copilot CLI may not be installed or is taking too long to start.');
                console.log('   The SDK requires GitHub Copilot CLI to be installed.');
            }
            if (error.message.includes('ENOENT') || error.message.includes('spawn')) {
                console.log('💡 GitHub Copilot CLI not found. Install it with:');
                console.log('   npm install -g @github/copilot-cli');
            }

            // Don't throw - allow fallback to work
            this.isInitialized = false;
        }
    }

    /**
     * Set the execution context
     */
    setContext(context: CopilotContext): void {
        this.context = context;
    }

    /**
     * Send a message and get a response
     */
    async chat(message: string): Promise<string> {
        // If in Electron, use the IPC bridge to the main process
        if (typeof window !== 'undefined' && (window as any).api?.copilotChat) {
            try {
                const result = await (window as any).api.copilotChat({
                    message,
                    token: this.config.githubToken,
                    context: this.context
                });

                if (result.success) {
                    this.conversationHistory.push({ role: 'user', content: message });
                    this.conversationHistory.push({ role: 'assistant', content: result.content });
                    return result.content;
                }
                throw new Error(result.error || 'IPC chat failed');
            } catch (error) {
                console.error('IPC Copilot chat error:', error);
                return this.generateFallbackResponse(message);
            }
        }

        try {
            // Initialize if not already
            await this.initialize();

            if (!this.session) {
                throw new Error('Session not initialized');
            }

            // Add to conversation history
            this.conversationHistory.push({ role: 'user', content: message });

            // Build context message
            const contextInfo = this.buildContextInfo();
            const fullPrompt = contextInfo ? `${contextInfo}\n\nUser: ${message}` : message;

            // Send and wait for response
            const response = await this.session.sendAndWait({
                prompt: fullPrompt
            });

            let assistantContent = '';

            if (response?.data?.content) {
                assistantContent = response.data.content;
            } else {
                assistantContent = 'I received your message but could not generate a response.';
            }

            // Add to history
            this.conversationHistory.push({ role: 'assistant', content: assistantContent });

            return assistantContent;
        } catch (error: any) {
            console.error('Copilot SDK chat error:', error);

            // Check for rate limit errors
            if (error.message?.includes('429') ||
                error.message?.includes('rate') ||
                error.message?.includes('limit') ||
                error.message?.includes('quota')) {
                return this.generateRateLimitResponse();
            }

            // Fallback to intelligent local response if SDK fails
            return this.generateFallbackResponse(message);
        }
    }

    /**
     * Generate response when rate limit is hit
     */
    private generateRateLimitResponse(): string {
        const now = new Date();
        const resetTime = new Date(now.getTime() + 60 * 60 * 1000); // Estimate 1 hour reset

        return `⏳ **Rate Limit Reached**

The GitHub Copilot API rate limit has been reached. This is temporary and will reset soon.

**What you can do now:**
• Use basic commands: **"run code"**, **"clear output"**, **"analyze code"**
• Wait a few minutes and try again
• The local AI assistant can still help with basic coding questions

**Estimated reset time:** ~${resetTime.toLocaleTimeString()}

💡 *Tip: Rate limits reset periodically. Complex AI responses will be available again shortly!*`;
    }

    /**
     * Stream a message and call callbacks on chunks
     */
    async streamChat(
        message: string,
        onChunk: (chunk: string) => void,
        onComplete: (fullResponse: string) => void
    ): Promise<void> {
        // If in Electron, use the IPC bridge to the main process
        if (typeof window !== 'undefined' && (window as any).api?.copilotStreamChat) {
            try {
                const api = (window as any).api;
                let fullResponse = '';

                // Clean up any existing listeners
                api.removeCopilotListeners();

                // Set up listeners for this stream
                api.onCopilotChunk((chunk: string) => {
                    fullResponse += chunk;
                    onChunk(chunk);
                });

                api.onCopilotDone(() => {
                    api.removeCopilotListeners();
                    this.conversationHistory.push({ role: 'user', content: message });
                    this.conversationHistory.push({ role: 'assistant', content: fullResponse });
                    onComplete(fullResponse);
                });

                api.onCopilotError((err: string) => {
                    api.removeCopilotListeners();
                    console.error('IPC Copilot stream error:', err);
                    const fallback = this.generateFallbackResponse(message);
                    onComplete(fallback);
                });

                // Start streaming
                await api.copilotStreamChat({
                    message,
                    token: this.config.githubToken,
                    context: this.context
                });
                return;
            } catch (error) {
                console.error('IPC Copilot stream setup error:', error);
                const fallback = this.generateFallbackResponse(message);
                onComplete(fallback);
                return;
            }
        }

        try {
            await this.initialize();

            if (!this.session) {
                throw new Error('Session not initialized');
            }

            const contextInfo = this.buildContextInfo();
            const fullPrompt = contextInfo ? `${contextInfo}\n\nUser: ${message}` : message;

            let fullResponse = '';

            // Set up event handlers
            const unsubscribeDelta = this.session.on('assistant.message_delta', (event: any) => {
                const chunk = event.data?.deltaContent || '';
                fullResponse += chunk;
                onChunk(chunk);
            });

            const done = new Promise<void>((resolve) => {
                const unsubscribeIdle = this.session.on('session.idle', () => {
                    unsubscribeIdle();
                    resolve();
                });
            });

            // Send message
            await this.session.send({ prompt: fullPrompt });
            await done;

            unsubscribeDelta();
            onComplete(fullResponse);

            this.conversationHistory.push({ role: 'user', content: message });
            this.conversationHistory.push({ role: 'assistant', content: fullResponse });
        } catch (error: any) {
            console.error('Copilot SDK stream error:', error);
            const fallback = this.generateFallbackResponse(message);
            onComplete(fallback);
        }
    }

    /**
     * Build context information string
     */
    private buildContextInfo(): string {
        const parts: string[] = [];

        if (this.context.currentFile) {
            parts.push(`Current file: ${this.context.currentFile}`);
        }

        if (this.context.currentCode) {
            const lines = this.context.currentCode.split('\n').length;
            parts.push(`Code length: ${lines} lines`);

            // Include a snippet if not too long
            if (this.context.currentCode.length < 2000) {
                parts.push(`\nCurrent code:\n\`\`\`\n${this.context.currentCode}\n\`\`\``);
            } else {
                parts.push(`\nCode preview:\n\`\`\`\n${this.context.currentCode.substring(0, 1500)}...\n\`\`\``);
            }
        }

        if (this.context.problems && this.context.problems.length > 0) {
            parts.push(`\nErrors found (${this.context.problems.length}):`);
            this.context.problems.slice(0, 5).forEach((p, i) => {
                parts.push(`${i + 1}. Line ${p.line}: ${p.message.split('\n')[0]}`);
            });
        }

        return parts.join('\n');
    }

    /**
     * Generate fallback response when SDK fails
     */
    private generateFallbackResponse(message: string): string {
        const q = message.toLowerCase();

        // Handle common tool-related requests
        if (q.match(/run.*code|execute.*code|test.*code|run this|run it/)) {
            if (this.context.executeCode) {
                setTimeout(() => this.context.executeCode?.(), 500);
                return '▶️ Running your code...\n\nCheck the **Output** tab to see the results!';
            }
            return '⚠️ Please open a code file first before running.';
        }

        if (q.match(/clear.*output|clear.*console/)) {
            if (this.context.clearOutput) {
                this.context.clearOutput();
                return '🗑️ Output cleared!';
            }
            return '⚠️ Clear function not available.';
        }

        if (q.match(/analyze.*code|code.*analysis/)) {
            if (!this.context.currentCode) {
                return '📝 Please open a file with code first, and I\'ll analyze it!';
            }
            const lines = this.context.currentCode.split('\n');
            return `📊 **Code Analysis**\n\n` +
                `**Lines:** ${lines.length} total\n\n` +
                `**Features detected:**\n` +
                ((/function\s+\w+/.test(this.context.currentCode)) ? '✓ Functions\n' : '') +
                ((/(?:let|const|var)\s+\w+/.test(this.context.currentCode)) ? '✓ Variables\n' : '') +
                ((/for\s*\(|while\s*\(/.test(this.context.currentCode)) ? '✓ Loops\n' : '') +
                ((/if\s*\(|else/.test(this.context.currentCode)) ? '✓ Conditionals\n' : '');
        }

        // Default response
        return `💬 I understand you're asking about: "${message}"\n\n` +
            `I'm currently falling back to local mode. You can still:\n` +
            `• **"Run this code"** - Execute your program\n` +
            `• **"Analyze my code"** - Get code insights\n` +
            `• **"Clear output"** - Clear the console\n\n` +
            `For full AI capabilities, please ensure your GitHub token is valid.`;
    }

    /**
     * Get available models
     */
    async listModels(): Promise<string[]> {
        // Default models supported by Copilot
        return ['gpt-4.1'];
    }

    /**
     * Clear conversation history
     */
    clearHistory(): void {
        this.conversationHistory = [];
    }

    /**
     * Get conversation history
     */
    getHistory(): Message[] {
        return [...this.conversationHistory];
    }

    /**
     * Cleanup resources
     */
    async destroy(): Promise<void> {
        try {
            if (this.session) {
                await this.session.destroy();
                this.session = null;
            }
            if (this.client) {
                await this.client.stop();
                this.client = null;
            }
            this.isInitialized = false;
            this.initializationPromise = null;
            console.log('🧹 Copilot SDK service cleaned up');
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }

    /**
     * Check if service is ready
     */
    isReady(): boolean {
        // If in Electron, we are ready if the bridge exists
        if (typeof window !== 'undefined' && (window as any).api?.copilotChat) {
            return this.isInitialized;
        }
        return this.isInitialized && this.session !== null;
    }

    /**
     * Ping to check connectivity
     */
    async ping(): Promise<boolean> {
        try {
            if (!this.client) return false;
            const result = await this.client.ping();
            return !!result;
        } catch {
            return false;
        }
    }
}

// ============================================
// 🏭 FACTORY FUNCTION
// ============================================

let serviceInstance: CopilotSDKService | null = null;

export async function getCopilotSDKService(token?: string): Promise<CopilotSDKService> {
    // Get token from parameter or environment
    const githubToken = token ||
        (typeof process !== 'undefined' ? process.env?.GITHUB_TOKEN : undefined) ||
        (typeof localStorage !== 'undefined' ? localStorage.getItem('github_token') : undefined);

    // Token is optional at creation time in Electron
    if (!githubToken && !(typeof window !== 'undefined' && (window as any).api)) {
        throw new Error('GitHub token is required. Set GITHUB_TOKEN in .env or pass it as parameter.');
    }

    if (!serviceInstance) {
        serviceInstance = new CopilotSDKService({ githubToken: githubToken || '' });
    } else if (githubToken && githubToken !== serviceInstance.getToken()) {
        // If token has changed, update it or recreate instance
        serviceInstance.updateToken(githubToken as string);
    }

    return serviceInstance;
}

export function destroyCopilotSDKService(): void {
    if (serviceInstance) {
        serviceInstance.destroy();
        serviceInstance = null;
    }
}
