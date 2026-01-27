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
        await fileOps.createFile('untitled.txt');
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
    const activeTab = editorStore.tabs.find(t => t.id === editorStore.activeTabId);
    if (!activeTab) return;

    try {
      if ((window as any).api?.executeCode) {
        const result = await (window as any).api.executeCode({
          code: activeTab.content,
          language: activeTab.language,
        });
        
        if (result.success) {
          editorStore.appendOutputData(result.output || '');
        } else {
          editorStore.appendOutputData(`Error: ${result.error}\n`);
        }
      }
    } catch (error: any) {
      editorStore.appendOutputData(`Execution error: ${error.message}\n`);
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
