import React, { createContext, useContext } from 'react';
import { useEditorStore } from '../editor/stores/editorStore';
import { useFileStore } from '../editor/stores/fileStore';
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
  const fileStore = useFileStore();
  const fileOps = useFileOperations();

  const handleMenuAction = async (action: string) => {
    switch (action) {
      case 'newTextFile':
        // Prompt user for filename
        const fileName = prompt('Enter file name (with extension):', 'untitled.js');
        if (fileName && fileName.trim()) {
          await fileOps.createFile(fileName.trim());
        }
        break;
      case 'newFolder':
        // Ensure sidebar is visible
        if (editorStore.activeSidebar !== 'Explorer') editorStore.setActiveSidebar('Explorer');
        if (!editorStore.sidebarVisible) editorStore.toggleSidebar();
        fileStore.setCreatingInFolder(null); // Create at root
        fileStore.setIsCreatingFolder(true);
        break;
      case 'openFile':
        const fileResult = await fileOps.openFileDialog();
        break;
      case 'openFolder':
        await fileOps.openFolder();
        break;
      case 'save':
        if (editorStore.activeTabId) {
          await fileOps.saveFile(editorStore.activeTabId);
        }
        break;
      case 'saveAs':
        if (editorStore.activeTabId) {
          const activeTab = editorStore.tabs.find(t => t.id === editorStore.activeTabId);
          if (activeTab) {
            await fileOps.saveFileAs(activeTab.id);
          }
        }
        break;
      case 'saveAll':
        await fileOps.saveAll();
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
      case 'newWindow':
        if ((window as any).api?.newWindow) {
          (window as any).api.newWindow();
        }
        break;
      case 'closeWindow':
        if ((window as any).api?.closeWindow) {
          (window as any).api.closeWindow();
        }
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
