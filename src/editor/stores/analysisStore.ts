import { create } from 'zustand';

// Define types of visuals we support
export type VisualType = 'NONE' | 'ARRAY_PUSH' | 'VARIABLE_BOX' | 'CSS_FLEX';

interface LiveVisualData {
  type: VisualType;
  params: any; // e.g., { arrayName: 'arr', value: '10' }
}

interface AnalysisState {
  isVisible: boolean;
  isAnalyzing: boolean;
  data: any | null;
  currentStep: number;
  
  // NEW: Live Visual State
  liveVisual: LiveVisualData;
  
  togglePanel: () => void;
  setAnalysisData: (data: any) => void;
  setStep: (step: number) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  
  // NEW: Action
  setLiveVisual: (data: LiveVisualData) => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  isVisible: false,
  isAnalyzing: false,
  data: null,
  currentStep: 0,
  
  // Default state
  liveVisual: { type: 'NONE', params: {} },

  togglePanel: () => set((state) => ({ isVisible: !state.isVisible })),
  setAnalysisData: (data) => set({ data, isVisible: true, currentStep: 0, liveVisual: { type: 'NONE', params: {} } }),
  setStep: (step) => set({ currentStep: step }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  
  // Update live visual
  setLiveVisual: (data) => set({ liveVisual: data, isVisible: true })
}));