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
  
  // Actions
  togglePanel: () => void;
  setAnalyzing: (val: boolean) => void;     // 🟢 Fixes: "setAnalyzing does not exist"
  setAnalysisData: (data: any) => void;     // 🟢 Fixes: "setAnalysisData does not exist"
  
  // 🟢 Fixes: "Expected 1 arguments, but got 2" error
  setTraceFrames: (frames: TraceFrame[], mode?: VisualMode) => void; 
  
  setFrameIndex: (index: number | ((prev: number) => number)) => void;
  togglePlay: () => void;
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

  togglePanel: () => set((state) => ({ isVisible: !state.isVisible })),
  setAnalyzing: (val) => set({ isAnalyzing: val }),
  setAnalysisData: (data) => set({ data }),

  setTraceFrames: (frames, mode = 'UNIVERSAL') => set({ 
    traceFrames: frames, 
    currentFrameIndex: 0, 
    visualMode: mode,
    isVisible: true 
  }),

  setFrameIndex: (input) => set((state) => ({
    currentFrameIndex: typeof input === 'function' ? input(state.currentFrameIndex) : input
  })),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
}));