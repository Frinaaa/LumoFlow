import { create } from 'zustand';

// 1. Define valid modes for the UI
export type VisualMode = 'SORTING' | 'LIST_PROCESS' | 'STRING_HUD' | 'MATH_LOGIC' | 'UNIVERSAL';

// 2. Define the "Video Frame" structure
export interface TraceFrame {
  id: number;
  memory: Record<string, any>;
  activeVariable: string | null;
  action: 'READ' | 'WRITE' | 'EXECUTE'; // <--- Ensure this matches
  desc: string;
}

// 3. The interface that the components see
interface AnalysisState {
  isVisible: boolean;
  isAnalyzing: boolean; // 🟢 Fixes: "isAnalyzing does not exist"
  data: any | null;      // Stores AI explanation data
  traceFrames: TraceFrame[];
  currentFrameIndex: number;
  isPlaying: boolean;
  visualMode: VisualMode;
  isReplaying: boolean;

  // Actions
  togglePanel: () => void;
  setAnalyzing: (val: boolean) => void;     // 🟢 Fixes: "setAnalyzing does not exist"
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
}

// 4. Implementation
export const useAnalysisStore = create<AnalysisState>((set) => ({
  isVisible: false,
  isAnalyzing: false,
  data: null,
  traceFrames: [],
  currentFrameIndex: 0,
  isPlaying: false,
  visualMode: 'UNIVERSAL',
  isReplaying: false,

  togglePanel: () => set((state) => ({ isVisible: !state.isVisible })),
  setAnalyzing: (val) => set({ isAnalyzing: val }),
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
}));