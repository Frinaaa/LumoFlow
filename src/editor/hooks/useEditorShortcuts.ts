import { useEffect } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { useFileOperations } from './useFileOperations';
import { useCodeExecution } from './useCodeExecution';

/**
 * Editor Keyboard Shortcuts Hook
 * Centralizes all keyboard shortcuts
 */

export const useEditorShortcuts = () => {
  const editorStore = useEditorStore();
  const fileOps = useFileOperations();
  const codeExec = useCodeExecution();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      const activeTab = editorStore.tabs.find(t => t.id === editorStore.activeTabId);

      // Save (Ctrl+S)
      if (isMod && e.key === 's') {
        e.preventDefault();
        if (activeTab) fileOps.saveFile(activeTab.id);
      }
      // Run (Ctrl+Enter)
      else if (isMod && e.key === 'Enter') {
        e.preventDefault();
        if (activeTab) codeExec.runCode(activeTab.id);
      }
      // Close Tab (Ctrl+W)
      else if (isMod && e.key === 'w') {
        e.preventDefault();
        if (activeTab) editorStore.removeTab(activeTab.id);
      }
      // Toggle Terminal (Ctrl+`)
      else if (isMod && e.key === '`') {
        e.preventDefault();
        editorStore.toggleTerminal();
      }
      // Toggle Sidebar (Ctrl+B)
      else if (isMod && e.key === 'b') {
        e.preventDefault();
        editorStore.toggleSidebar();
      }
      // Open File (Ctrl+O)
      else if (isMod && e.key === 'o') {
        e.preventDefault();
        // Trigger file dialog
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorStore.tabs, editorStore.activeTabId]);
};
