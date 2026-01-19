import React, { createContext, useContext, useState } from 'react';

interface EditorContextType {
  onAnalyze: () => void;
  onRun: () => void;
  onSave: () => void;
  isAnalysisMode: boolean;
  onMenuAction: (action: string) => void;
  autoSave: boolean;
  isAutoSaving: boolean;
  setEditorState: (state: Partial<EditorContextType>) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<EditorContextType>({
    onAnalyze: () => {},
    onRun: () => {},
    onSave: () => {},
    isAnalysisMode: false,
    onMenuAction: () => {},
    autoSave: false,
    isAutoSaving: false,
    setEditorState: (newState) => {
      setState(prev => ({ ...prev, ...newState }));
    }
  });

  return (
    <EditorContext.Provider value={state}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
};
