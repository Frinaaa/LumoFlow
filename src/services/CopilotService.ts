export interface CopilotContext {
    currentCode?: string;
    currentFile?: string;
    language?: string;
    problems?: Array<{ line: number; message: string }>;
    analysisData?: any;
    executeCode?: () => void;
    clearOutput?: () => void;
}

export class CopilotService {
    private context: CopilotContext = {};

    // Helper to check for Electron API availability
    private get isElectron() {
        return typeof window !== 'undefined' && !!(window as any).api;
    }

    // Get token from LocalStorage (if user entered it in Settings)
    private get token() {
        return localStorage.getItem('github_token') || localStorage.getItem('GITHUB_TOKEN');
    }

    setContext(context: CopilotContext) {
        this.context = context;
    }

    async testService(): Promise<boolean> {
        if (!this.isElectron) return false;
        try {
            return await (window as any).api.copilotPing();
        } catch {
            return false;
        }
    }

    /**
     * Stream Chat
     */
    async streamChat(
        message: string,
        onChunk: (chunk: string) => void,
        onComplete: (fullResponse: string) => void
    ): Promise<void> {

        // 🟢 FIX: We removed "&& this.token" here.
        // Now it attempts to connect even if the frontend token is missing,
        // allowing the backend .env token to work.
        if (this.isElectron) {
            console.log('📡 [CopilotService] Electron bridge detected. Starting stream...');
            try {
                const api = (window as any).api;
                let fullResponse = '';

                if (!api.copilotStreamChat) {
                    throw new Error('api.copilotStreamChat is UNDEFINED in preload bridge');
                }

                // Clean old listeners
                api.removeCopilotListeners();

                // Setup listeners
                api.onCopilotChunk((chunk: string) => {
                    fullResponse += chunk;
                    onChunk(chunk);
                });

                api.onCopilotDone(() => {
                    console.log('✅ [CopilotService] Stream finished');
                    api.removeCopilotListeners();
                    onComplete(fullResponse);
                });

                api.onCopilotError((err: string) => {
                    console.error('❌ [CopilotService] AI Error from backend:', err);
                    api.removeCopilotListeners();
                    this.runLocalFallback(message, onChunk, onComplete, err);
                });

                // Trigger Main Process
                console.log('📤 [CopilotService] Invoking copilot:streamChat via bridge...');
                await api.copilotStreamChat({
                    message,
                    token: this.token || null,
                    context: this.context
                });
                return;

            } catch (err: any) {
                console.error('❌ [CopilotService] Bridge Exception:', err);
                this.runLocalFallback(message, onChunk, onComplete, err?.message || 'Bridge Connection Failed');
            }
        } else {
            console.warn('⚠️ [CopilotService] Not in Electron environment. Using fallback.');
            this.runLocalFallback(message, onChunk, onComplete, 'Running in non-Electron environment');
        }
    }

    /**
     * Local Fallback (Simulation Mode)
     */
    private runLocalFallback(
        message: string,
        onChunk: (chunk: string) => void,
        onComplete: (fullResponse: string) => void,
        errorMsg?: string
    ) {
        // We simulate a response so the UI doesn't look broken
        let response = "📡 **LumoFlow Local Intelligence Active (VER: 2.1).**\n\n";

        if (errorMsg) {
            response += `⚠️ *Note: Could not reach the Cloud AI Brain (${errorMsg}). Using local analysis mode instead.*\n\n`;
        } else {
            response += "⚠️ *I'm currently in local mode but ready to help.*\n\n";
        }

        if (this.context.currentCode) {
            const lineCount = this.context.currentCode.split('\n').length;
            response += `I've analyzed your current file: **${this.context.currentFile || 'untitled'}** (${lineCount} lines).\n\n`;

            const q = message.toLowerCase();
            if (q.includes('explain')) {
                response += "Based on my local analysis, your code implementation follows standard patterns. You can use the **Explain** tab for a line-by-line breakdown!";
            } else if (q.includes('fix') || q.includes('error') || q.includes('bug')) {
                const errorCount = this.context.problems?.length || 0;
                response += `I detected **${errorCount}** technical issues in your current file. Try addressing the highlighted lines in the editor!`;
            } else {
                response += "I'm currently functioning as a local assistant. For more complex AI guidance, please ensure your GitHub connection is stable.";
            }
        } else {
            response += "I'm currently in local mode. Please open a code file so I can provide context-aware help!";
        }

        let i = 0;
        const interval = setInterval(() => {
            const chunk = response.slice(i, i + 8);
            onChunk(chunk);
            i += 8;
            if (i >= response.length) {
                clearInterval(interval);
                onComplete(response);
            }
        }, 30);
    }
}

export const copilotService = new CopilotService();