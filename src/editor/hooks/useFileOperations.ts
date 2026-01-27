import { useEditorStore } from '../stores/editorStore';
import { useFileStore } from '../stores/fileStore';
import { fileSystemApi, terminalApi } from '../api';
import { getLanguageFromFile } from '../../config/fileTypes';

/**
 * File Operations Hook
 * Handles all file-related operations with proper error handling
 */

export const useFileOperations = () => {
  const editorStore = useEditorStore();
  const fileStore = useFileStore();

  const openFile = async (filePath: string): Promise<boolean> => {
    try {
      const content = await fileSystemApi.readFile(filePath);
      const fileName = filePath.split(/[\\/]/).pop() || 'untitled';
      const language = getLanguageFromFile(fileName);

      editorStore.addTab(filePath, fileName, content, language);
      editorStore.appendOutputData(`✅ Opened: ${fileName}\n`);
      return true;
    } catch (error: any) {
      editorStore.appendOutputData(`❌ Error opening file: ${error.message}\n`);
      return false;
    }
  };

  const saveFile = async (tabId: string): Promise<boolean> => {
    const tab = editorStore.tabs.find(t => t.id === tabId);
    if (!tab) return false;

    try {
      // Get user ID for atomic save
      const userString = localStorage.getItem('user_info');
      const user = userString ? JSON.parse(userString) : null;
      const userId = user?._id || user?.id || '';

      await fileSystemApi.saveAtomic(tab.filePath, tab.content, userId);
      editorStore.markTabDirty(tabId, false);
      editorStore.appendOutputData(`✅ Saved & Synced: ${tab.fileName}\n`);
      return true;
    } catch (error: any) {
      editorStore.appendOutputData(`❌ Error saving: ${error.message}\n`);
      return false;
    }
  };

  const createFile = async (fileName: string, folderPath?: string): Promise<boolean> => {
    try {
      let fullPath = fileName;

      if (folderPath) {
        const folderName = folderPath.split(/[\\/]/).pop();
        fullPath = `${folderName}/${fileName}`;
      }

      if (!fullPath.includes('.')) {
        fullPath += '.txt';
      }

      const newFilePath = await fileSystemApi.createFile(fullPath, '');
      await refreshFiles();
      await openFile(newFilePath);
      editorStore.appendOutputData(`✅ Created: ${fileName}\n`);
      return true;
    } catch (error: any) {
      editorStore.appendOutputData(`❌ Error: ${error.message}\n`);
      return false;
    }
  };

  const createFolder = async (folderName: string): Promise<boolean> => {
    try {
      await fileSystemApi.createFolder(folderName);
      await refreshFiles();
      editorStore.appendOutputData(`✅ Created folder: ${folderName}\n`);
      return true;
    } catch (error: any) {
      editorStore.appendOutputData(`❌ Error: ${error.message}\n`);
      return false;
    }
  };

  const deleteFile = async (filePath: string): Promise<boolean> => {
    if (!confirm('Delete this file?')) return false;

    try {
      await fileSystemApi.deleteFile(filePath);
      await refreshFiles();

      // Close tab if open
      const tab = editorStore.tabs.find(t => t.filePath === filePath);
      if (tab) {
        editorStore.removeTab(tab.id);
      }

      const fileName = filePath.split(/[\\/]/).pop();
      editorStore.appendOutputData(`✅ Deleted: ${fileName}\n`);
      return true;
    } catch (error: any) {
      editorStore.appendOutputData(`❌ Error: ${error.message}\n`);
      return false;
    }
  };

  const renameFile = async (oldPath: string, newName: string): Promise<boolean> => {
    try {
      await fileSystemApi.renameFile(oldPath, newName);
      await refreshFiles();
      editorStore.appendOutputData(`✅ Renamed to: ${newName}\n`);
      return true;
    } catch (error: any) {
      editorStore.appendOutputData(`❌ Error: ${error.message}\n`);
      return false;
    }
  };

  const refreshFiles = async (): Promise<boolean> => {
    try {
      const files = await fileSystemApi.readProjectFiles();
      fileStore.setFiles(files);
      return true;
    } catch (error) {
      console.error('Error refreshing files:', error);
      return false;
    }
  };

  const openFolder = async (): Promise<boolean> => {
    try {
      const result = await fileSystemApi.openFolderDialog();
      if (result && !result.canceled && result.folderPath) {
        const folderName = result.folderPath.split(/[\\/]/).pop() || 'Workspace';
        fileStore.setWorkspace(result.folderPath, folderName);
        await refreshFiles();
        editorStore.appendOutputData(`✅ Opened: ${folderName}\n`);
        return true;
      }
      return false;
    } catch (error: any) {
      editorStore.appendOutputData(`❌ Error: ${error.message}\n`);
      return false;
    }
  };

  const runCode = async (tabId: string): Promise<boolean> => {
    const tab = editorStore.tabs.find(t => t.id === tabId);
    if (!tab) return false;

    try {
      editorStore.clearOutputData();
      editorStore.setActiveBottomTab('Output');
      editorStore.appendOutputData(`▶ Running ${tab.fileName}...\n\n`);

      const result = await terminalApi.runCode(tab.filePath, tab.content);

      if (result.stdout) {
        editorStore.appendOutputData(result.stdout + '\n');
      }

      if (result.stderr) {
        editorStore.appendDebugData(`[${tab.fileName}]\n${result.stderr}\n\n`);
        editorStore.appendOutputData('\n❌ Errors occurred. Check Debug Console.\n');
      } else {
        editorStore.appendOutputData('\n✅ Completed successfully.\n');
      }

      return true;
    } catch (error: any) {
      editorStore.appendOutputData(`\n❌ Error: ${error.message}\n`);
      return false;
    }
  };

  return {
    openFile,
    saveFile,
    createFile,
    createFolder,
    deleteFile,
    renameFile,
    refreshFiles,
    openFolder,
    runCode,
  };
};
