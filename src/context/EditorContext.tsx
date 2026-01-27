import React, { createContext, useContext } from 'react';
import { useEditorStore } from '../editor/stores/editorStore';
import { useFileOperations } from '../editor/hooks/useFileOperations';

interface EditorContextType {
  onMenuAction?: (action: string) => void;
  onSave?: () => void;
  onRun?: () => void;
  autoSave: boolean;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const editorStore = useEditorStore();
  const fileOps = useFileOperations();

  const handleMenuAction = async (action: string) => {
    switch (action) {
      case 'newTextFile':
        await fileOps.createFile('untitled.js');
        break;
      case 'openFile':
        // This will be handled by the file dialog in EditorLayout
        break;
      case 'openFolder':
        // This will be handled by the folder dialog in EditorLayout
        break;
      case 'saveAs':
        if (editorStore.activeTabId) {
          await fileOps.saveFile(editorStore.activeTabId);
        }
        break;
      case 'toggleAutoSave':
        editorStore.toggleAutoSave();
        break;
      case 'closeEditor':
        if (editorStore.activeTabId) {
          editorStore.removeTab(editorStore.activeTabId);
        }
        break;
      case 'closeFolder':
        editorStore.closeAllTabs();
        break;
      default:
        break;
    }
  };

  const handleSave = () => {
    if (editorStore.activeTabId) {
      fileOps.saveFile(editorStore.activeTabId);
    }
  };

  const handleRun = async () => {
    if (editorStore.activeTabId) {
      await fileOps.runCode(editorStore.activeTabId);
    }
  };

  const value: EditorContextType = {
    onMenuAction: handleMenuAction,
    onSave: handleSave,
    onRun: handleRun,
    autoSave: editorStore.autoSave,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
};
