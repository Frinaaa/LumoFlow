import { create } from 'zustand';

// 1. Define valid modes for the UI
export type VisualMode = 'SORTING' | 'LIST_PROCESS' | 'STRING_HUD' | 'MATH_LOGIC' | 'UNIVERSAL';

export interface VisualElement {
  id: string;
  val: string | number;
  color: string;
  shape: 'circle' | 'card' | 'pill' | 'square';
  anim?: 'pop' | 'shake' | 'slide';
}

export interface TraceFrame {
  id: number;
  memory: Record<string, any>;
  action?: 'READ' | 'WRITE' | 'EXECUTE';
  desc: string;
  layout?: 'horizontal' | 'vertical' | 'grid';
  elements?: VisualElement[];
}

// 3. The interface that the components see
interface AnalysisState {
  isVisible: boolean;
  isAnalyzing: boolean;
  isVisualizing: boolean; // 🟢 Decoupled visualization state
  data: any | null;      // Stores AI explanation data
  vizCache: Record<string, any[]>; // 🟢 CACHE: Store results by code hash
  currentVisualFilePath: string | null;
  clearVisuals: () => void;
  traceFrames: TraceFrame[];
  currentFrameIndex: number;
  isPlaying: boolean;
  visualMode: VisualMode;
  isReplaying: boolean;

  // Actions
  togglePanel: () => void;
  setAnalyzing: (val: boolean) => void;
  setVisualizing: (val: boolean) => void;   // 🟢 Separate flag for visuals
  setAnalysisData: (data: any) => void;     // 🟢 Fixes: "setAnalysisData does not exist"
  setReplaying: (val: boolean) => void;

  // 🟢 Fixes: "Expected 1 arguments, but got 2" error
  setTraceFrames: (frames: TraceFrame[], mode?: VisualMode) => void;

  setFrameIndex: (index: number | ((prev: number) => number)) => void;
  togglePlay: () => void;
  setLiveVisual: (result: any) => void;
  panelWidth: number;
  setPanelWidth: (width: number) => void;
  showPanel: (val?: boolean) => void;
  openTab: (tabId: 'visualize' | 'explain' | 'interact' | 'games' | 'debug') => void;
  activeTabId: string;
  fetchAiSimulation: (code: string, filePath: string, output?: string) => Promise<void>;
}

// 4. Implementation
export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  isVisible: false,
  isAnalyzing: false,
  isVisualizing: false,
  data: null,
  vizCache: {}, // Initialize cache
  currentVisualFilePath: null,

  // 2. Clear function to reset everything
  clearVisuals: () => set({
    traceFrames: [],
    currentFrameIndex: 0,
    visualMode: 'UNIVERSAL',
    data: null
  }),

  traceFrames: [],
  currentFrameIndex: 0,
  isPlaying: false,
  visualMode: 'UNIVERSAL',
  isReplaying: false,

  togglePanel: () => set((state) => ({ isVisible: !state.isVisible })),
  setAnalyzing: (val) => set({ isAnalyzing: val }),
  setVisualizing: (val) => set({ isVisualizing: val }),
  setAnalysisData: (data) => set({ data }),
  setReplaying: (val) => set({ isReplaying: val }),

  setTraceFrames: (frames, mode = 'UNIVERSAL') => {
    set({
      traceFrames: frames,
      currentFrameIndex: 0,
      visualMode: mode,
      isVisible: true
    });

    // Track concept visualization
    import('../../utils/statsTracker').then(({ trackStats, trackActivity }) => {
      trackStats({ conceptsVisualized: 1 });
      trackActivity({
        title: mode + " Visualization",
        type: "Algorithm Visualization",
        xp: 50,
        color: "#bc13fe",
        icon: "fa-eye"
      });
    });
  },

  setFrameIndex: (input) => set((state) => ({
    currentFrameIndex: typeof input === 'function' ? input(state.currentFrameIndex) : input
  })),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setLiveVisual: (result) => {
    set({
      traceFrames: result.frames || [],
      visualMode: result.type || 'UNIVERSAL',
      isVisible: true
    });

    // Track concept visualization
    import('../../utils/statsTracker').then(({ trackStats }) => {
      trackStats({ conceptsVisualized: 1 });
    });
  },
  panelWidth: 400,
  setPanelWidth: (width) => set({ panelWidth: width }),
  showPanel: (val = true) => set({ isVisible: val }),
  activeTabId: 'visualize',
  openTab: (tabId) => set({ activeTabId: tabId, isVisible: true }),

  fetchAiSimulation: async (code: string, filePath: string, output?: string) => {
    if (!code || code.trim().length < 5) return;

    // 🚀 CACHE CHECK: If code hasn't changed, load from cache instantly!
    const cacheKey = code.trim();
    const cached = get().vizCache[cacheKey];

    if (cached) {
      console.log("⚡ Visual Cache Hit! Loading instantly...");
      set({
        traceFrames: cached,
        isVisualizing: false,
        isVisible: true,
        activeTabId: 'visualize',
        visualMode: 'UNIVERSAL',
        currentFrameIndex: 0,
        currentVisualFilePath: filePath
      });
      return;
    }

    // 🟢 CRITICAL FIX: Only clear frames if we are starting FRESH
    if (!get().traceFrames.length || !output) {
      set({
        isVisualizing: true,
        isVisible: true,
        activeTabId: 'visualize',
        traceFrames: [],
        currentFrameIndex: 0,
        currentVisualFilePath: filePath
      });
    } else {
      set({ isVisualizing: true, currentVisualFilePath: filePath });
    }

    try {
      const { copilotService } = await import('../../services/CopilotService');
      let fullResponse = "";

      // 🟢 SPEED OPTIMIZATION: Tell AI to be concise (fewer frames = faster loading)
      // This keeps your "Standard" but stops the AI from generating 50+ useless frames.
      const prompt = `[GENERATE_VISUAL_JSON] 
        Focus: Key state changes only (Max 12 frames).
        Standard: High-tech female 'desc' narration.
        Include: 'comparing' and 'swapping' metadata for 3D effects.
        Program output: "${output || 'Running...'}"
        CODE:
        ${code}`;

      await copilotService.streamChat(
        prompt,
        (chunk) => {
          fullResponse += chunk;

          // 🟢 NEW: Try to show partial results immediately
          try {
            // If the AI has finished at least one object in the array
            if (fullResponse.includes('},')) {
              const lastValidIndex = fullResponse.lastIndexOf('}');
              const partialJson = fullResponse.substring(0, lastValidIndex + 1) + ']';
              const start = partialJson.indexOf('[');
              if (start !== -1) {
                const frames = JSON.parse(partialJson.substring(start));
                // Show the frames we have so far without stopping the loading spinner
                set({ traceFrames: frames });
              }
            }
          } catch (e) { /* Ignore partial parse errors */ }
        },
        () => {
          try {
            const start = fullResponse.indexOf('[');
            const end = fullResponse.lastIndexOf(']') + 1;
            if (start !== -1) {
              const frames = JSON.parse(fullResponse.substring(start, end));
              set((state) => ({
                vizCache: { ...state.vizCache, [code.trim()]: frames },
                traceFrames: frames,
                isVisualizing: false,
              }));
            }
          } catch (e) {
            set({ isVisualizing: false });
          }
        }
      );
    } catch (err) {
      set({ isVisualizing: false });
    }
  }
}));