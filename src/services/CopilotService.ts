export class CopilotService {
    private context: any = {};

    setContext(context: any) { this.context = context; }

    async streamChat(message: string, onChunk: (c: string) => void, onComplete: () => void, onError?: (err: string) => void): Promise<void> {
        if (!(window as any).api) return;
        const api = (window as any).api;

        return new Promise((resolve) => {
            let hasFinished = false;

            const cleanup = () => {
                if (hasFinished) return;
                hasFinished = true;
                api.removeCopilotListeners();
                onComplete();
                resolve();
            };

            // 1. Setup Listeners FIRST
            api.removeCopilotListeners();
            api.onCopilotChunk((chunk: string) => {
                console.log("📥 [Service] Received chunk:", chunk);
                onChunk(chunk);
            });

            api.onCopilotDone(() => {
                console.log("📥 [Service] Stream Done");
                cleanup();
            });

            api.onCopilotError((err: string) => {
                console.error("📥 [Service] Stream Error:", err);
                if (onError) {
                    onError(err);
                } else {
                    onChunk(`\n\n⚠️ Error: ${err}`);
                }
                cleanup();
            });

            // 2. Sanitize and Trigger
            const sanitized = { ...this.context };
            delete sanitized.executeCode;
            delete sanitized.clearOutput;

            api.copilotStreamChat({
                message,
                token: localStorage.getItem('github_token'),
                context: sanitized
            }).catch((e: any) => {
                if (onError) {
                    onError(e.message || "Bridge Failure");
                } else {
                    onChunk(`\n\n⚠️ Bridge Failure`);
                }
                cleanup();
            });

            // 3. Safety Timeout (15 seconds)
            setTimeout(() => {
                if (!hasFinished) {
                    console.warn("AI Stream timed out");
                    if (onError) onError("Request timed out");
                    cleanup();
                }
            }, 15000);
        });
    }
}

export const copilotService = new CopilotService();