import React, { createContext, useContext, useEffect } from 'react';
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
    console.log('📋 Menu action triggered:', action);
    switch (action) {
      case 'newTextFile':
        try {
          const fileName = prompt('Enter file name (e.g., script.js):', 'untitled.js');
          if (!fileName) return;

          // 🧠 INTELLIGENT PATH DETECTION
          // If a folder is selected in the file tree, use it. Otherwise use root.
          const parentFolder = fileStore.selectedFolder || null;
          
          console.log(`Creating file '${fileName}' in: ${parentFolder || 'ROOT'}`);
          
          // Call createFile with the determined parent
          await fileOps.createFile(fileName.trim(), parentFolder);
          
        } catch (error) {
          console.error('Error creating file:', error);
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
  useEffect(() => {
    const handleGlobalShortcut = (e: any) => {
      handleMenuAction(e.detail);
    };
    window.addEventListener('trigger-menu-action', handleGlobalShortcut);
    return () => window.removeEventListener('trigger-menu-action', handleGlobalShortcut);
  }, [editorStore.activeTabId]); // Re-bind when active tab changes



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
