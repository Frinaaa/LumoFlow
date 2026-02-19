import { create } from 'zustand';
import { useAnalysisStore } from './analysisStore';

export interface TraceFrame {
    id: number;
    action: 'INIT' | 'READ' | 'COMPARE' | 'SWAP' | 'WRITE' | 'BRANCH' | 'END' | 'CALL';
    desc: string;
    memory: Record<string, any>;
    comparing?: any[];
    swapping?: any[];
    focusLine?: number;
    // Metadata for better rendering
    type?: 'ARRAY' | 'TREE' | 'GRAPH' | 'VARIABLE' | 'OBJECT' | 'QUEUE' | 'STACK'| 'TOWER_OF_HANOI';
    metadata?: {
        highlightIndex?: number[];
        pointerName?: string;
        depth?: number;
        // 2. ADD THESE THREE PROPERTIES
        movingRing?: number; 
        from?: string;
        to?: string;
    };
}

interface VisualState {
    // UI State
    isVisible: boolean;
    isVisualizing: boolean;
    isPlaying: boolean;
    isReplaying: boolean;
    currentFrameIndex: number;
    currentVisualFilePath: string | null;
    lastError: string | null;
    cooldownUntil: number;

    // Data
    traceFrames: TraceFrame[];
    visualCache: Record<string, TraceFrame[]>;
    visualMode: string;

    // Actions
    showVisuals: (val?: boolean) => void;
    setFrameIndex: (index: number | ((prev: number) => number)) => void;
    setPlaying: (val: boolean) => void;
    setReplaying: (val: boolean) => void;
    setTraceFrames: (frames: TraceFrame[], mode?: string) => void;
    clearVisuals: () => void;
    setLiveVisual: (result: any) => void;

    // Logic Engine
    fetchAiSimulation: (code: string, filePath: string, output?: string, force?: boolean) => Promise<boolean>;
}

export const useVisualStore = create<VisualState>((set, get) => ({
    isVisible: false,
    isVisualizing: false,
    isPlaying: false,
    isReplaying: false,
    currentFrameIndex: 0,
    currentVisualFilePath: null,
    lastError: null,
    cooldownUntil: 0,
    traceFrames: [],
    visualCache: {},
    visualMode: 'UNIVERSAL',

    showVisuals: (val = true) => set({ isVisible: val }),
    setFrameIndex: (input) => set((state) => ({
        currentFrameIndex: typeof input === 'function' ? input(state.currentFrameIndex) : input
    })),
    setPlaying: (val) => set({ isPlaying: val }),
    setReplaying: (val) => set({ isReplaying: val }),
    setTraceFrames: (frames, mode = 'UNIVERSAL') => set({ traceFrames: frames, currentFrameIndex: 0, visualMode: mode, isVisible: true }),
    clearVisuals: () => set({ traceFrames: [], currentFrameIndex: 0, lastError: null, isReplaying: false }),

    setLiveVisual: (result) => {
        const state = get();
        if (!result || result.type === 'NONE') return;

        // 🛑 BOUNCER: Don't let live parser overwrite a deep AI simulation or active directing
        if (state.isVisualizing || state.isReplaying) return;

        // If we already have deep AI frames for this file, skip the shallow live parser
        if (state.traceFrames.length > 5 && state.currentVisualFilePath !== 'live-parser') return;

        // Translate live parser result into at least one TraceFrame
        const mockFrame: TraceFrame = {
            id: 0,
            action: 'WRITE',
            desc: `Live update: detected ${result.type}`,
            memory: {},
            type: 'VARIABLE'
        };

        if (result.type === 'ARRAY_PUSH') {
            const { arrayName, value, prevItems } = result.params;
            mockFrame.memory = { [arrayName]: [...prevItems, value] };
            mockFrame.type = 'ARRAY';
            mockFrame.metadata = { highlightIndex: [prevItems.length], pointerName: 'new' };
        } else if (result.type === 'VARIABLE_BOX') {
            mockFrame.memory = { [result.params.name]: result.params.value };
            mockFrame.type = 'VARIABLE';
        }

        set({
            traceFrames: [mockFrame],
            currentFrameIndex: 0,
            visualMode: result.type,
            currentVisualFilePath: 'live-parser'
        });
    },

    fetchAiSimulation: async (code: string, filePath: string, output?: string, force = false) => {
        const state = get();
        // Cache key = file path + trimmed code content (includes output for accuracy)
        const codeHash = code.trim();
        const cacheKey = `${filePath}::${codeHash}::${(output || '').trim()}`;

        // 🔹 CACHE HIT: Instantly load cached frames (unless force-regenerate)
        if (!force && state.visualCache[cacheKey]) {
            console.log("⚡ CACHE HIT: Loading cached visuals for", filePath);
            set({
                traceFrames: state.visualCache[cacheKey],
                isVisualizing: false,
                isVisible: true,
                lastError: null,
                currentVisualFilePath: filePath,
                currentFrameIndex: 0
            });
            useAnalysisStore.getState().showPanel(true);
            return true;
        }

        // 🔹 SAME CODE CHECK: If code hasn't changed for this file, skip (unless force)
        if (!force) {
            const existingKey = Object.keys(state.visualCache).find(k => k.startsWith(`${filePath}::${codeHash}::`));
            if (existingKey) {
                console.log("⚡ SAME CODE: Reusing existing cache for", filePath);
                set({
                    traceFrames: state.visualCache[existingKey],
                    isVisualizing: false,
                    isVisible: true,
                    lastError: null,
                    currentVisualFilePath: filePath,
                    currentFrameIndex: 0
                });
                useAnalysisStore.getState().showPanel(true);
                return true;
            }
        }

        if (state.isVisualizing) return false;

        set({
            isVisualizing: true,
            isVisible: true,
            traceFrames: [],
            currentFrameIndex: 0,
            lastError: null,
            currentVisualFilePath: filePath
        });
        useAnalysisStore.getState().showPanel(true);

        let fullResponse = "";
        const api = (window as any).api;

        try {
            if (api.removeVisualListeners) api.removeVisualListeners();

            api.onVisualChunk((chunk: string) => {
                fullResponse += chunk;
            });

            api.onVisualDone(() => {
                try {
                    const start = fullResponse.indexOf('[');
                    if (start === -1) throw new Error("No logic sequence detected.");

                    let rawJson = fullResponse.substring(start).trim();

                    const tryParse = (str: string) => {
                        try { return JSON.parse(str); } catch (e) {
                            try { return JSON.parse(str.replace(/,\s*\]$/, ']')); } catch (e2) { return null; }
                        }
                    };

                    let tempStr = rawJson;
                    if (!tempStr.endsWith(']')) {
                        const lastBrace = tempStr.lastIndexOf('}');
                        if (lastBrace !== -1) tempStr = tempStr.substring(0, lastBrace + 1) + ']';
                    }

                    let frames = tryParse(tempStr);

                    if (!frames) {
                        let backtrackCount = 0;
                        while (tempStr.length > 50 && !frames && backtrackCount < 20) {
                            const prevBrace = tempStr.lastIndexOf('}', tempStr.length - 2);
                            if (prevBrace === -1) break;
                            tempStr = tempStr.substring(0, prevBrace + 1) + ']';
                            frames = tryParse(tempStr);
                            backtrackCount++;
                        }
                    }

                    if (frames && Array.isArray(frames)) {
                        const currentCache = get().visualCache;
                        set({
                            traceFrames: frames,
                            isVisualizing: false,
                            lastError: null,
                            visualCache: { ...currentCache, [cacheKey]: frames }
                        });
                        console.log(`✅ CACHED: ${frames.length} frames for ${filePath}`);
                    } else {
                        throw new Error("AI output too fragmented.");
                    }
                } catch (e: any) {
                    set({ isVisualizing: false, lastError: e.message });
                }
            });

            api.onVisualError((err: string) => {
                const is429 = String(err).includes("429");
                set({
                    isVisualizing: false,
                    traceFrames: [],
                    lastError: is429 ? "RATE LIMIT: Wait 60s" : `Error: ${err}`,
                    cooldownUntil: is429 ? Date.now() + 60000 : 0
                });
            });

            await api.geminiGetVisuals({ code, output });
            return true;
        } catch (err) {
            set({ isVisualizing: false });
            return false;
        }
    },
}));
