import { create } from 'zustand';

interface AnalysisState {
  // UI State
  isVisible: boolean;
  isAnalyzing: boolean;
  activeTabId: string;
  panelWidth: number;

  // Data
  data: any | null;
  lastError: string | null;

  // Actions
  togglePanel: () => void;
  showPanel: (val?: boolean) => void;
  setAnalyzing: (val: boolean) => void;
  setAnalysisData: (data: any) => void;
  setPanelWidth: (width: number) => void;
  openTab: (tabId: string) => void;
  clearAnalysis: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  isVisible: false,
  isAnalyzing: false,
  activeTabId: 'explanation', // Default to explanation now that visuals are separate
  panelWidth: 400,
  data: null,
  lastError: null,

  togglePanel: () => set((state) => ({ isVisible: !state.isVisible })),
  showPanel: (val = true) => set({ isVisible: val }),
  setAnalyzing: (val) => set({ isAnalyzing: val }),
  setAnalysisData: (data) => set({ data }),
  setPanelWidth: (width) => set({ panelWidth: width }),
  openTab: (tabId) => set({ activeTabId: tabId, isVisible: true }),
  clearAnalysis: () => set({ data: null, lastError: null }),
}));