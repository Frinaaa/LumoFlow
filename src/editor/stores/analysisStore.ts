import { create } from 'zustand';

interface AnalysisState {
  isVisible: boolean;
  isAnalyzing: boolean;
  data: any | null;
  currentStep: number;
  togglePanel: () => void;
  setAnalysisData: (data: any) => void;
  setStep: (step: number) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  isVisible: false,
  isAnalyzing: false,
  data: null,
  currentStep: 0,
  togglePanel: () => set((state) => ({ isVisible: !state.isVisible })),
  setAnalysisData: (data) => set({ data, isVisible: true, currentStep: 0 }),
  setStep: (step) => set({ currentStep: step }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
}));
