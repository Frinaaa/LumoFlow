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

  const createFile = async (fileName: string, parentPath?: string): Promise<boolean> => {
    try {
      let fullPath = fileName;

      if (parentPath) {
        // If parentPath is provided, we should join it with the filename.
        // The electron side handles resolving absolute paths within the sandbox.
        // We'll use a simple separator here, electron handles normalization.
        fullPath = `${parentPath}/${fileName}`;
      }

      if (!fullPath.includes('.') && !fileName.includes('.')) {
        fullPath += '.js';
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

  const createFolder = async (folderName: string, parentPath?: string): Promise<boolean> => {
    try {
      let fullPath = folderName;
      if (parentPath) {
        fullPath = `${parentPath}/${folderName}`;
      }
      await fileSystemApi.createFolder(fullPath);
      await refreshFiles();
      editorStore.appendOutputData(`✅ Created folder: ${folderName}\n`);
      editorStore.setWorkspaceStatus('Folder Opened');
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
        editorStore.setWorkspaceStatus('Folder Opened');
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
      // 1. Check for immediate editor-detected errors
      const currentFileProblems = editorStore.problems.filter(p => p.source === tab.fileName && p.type === 'error');
      if (currentFileProblems.length > 0) {
        editorStore.setActiveBottomTab('Problems');
        editorStore.appendOutputData(`❌ Cannot run: ${currentFileProblems.length} errors detected in ${tab.fileName}. Fix them first!\n`);
        if (!editorStore.terminalVisible) editorStore.toggleTerminal();
        return false;
      }

      // 2. Clear old outputs and prepare UI
      editorStore.clearOutputData();
      editorStore.clearDebugData();
      editorStore.clearRuntimeProblems();
      editorStore.setActiveBottomTab('Output');
      if (!editorStore.terminalVisible) editorStore.toggleTerminal();
      editorStore.appendOutputData(`▶ Running ${tab.fileName}...\n\n`);

      // 3. Execute code via Electron API
      const result = await terminalApi.runCode(tab.filePath, tab.content);

      // 4. Handle results
      if (result.stdout) {
        editorStore.appendOutputData(result.stdout + '\n');
      }

      if (result.stderr) {
        // Switch to Problems tab if we have runtime errors
        editorStore.setActiveBottomTab('Problems');

        // Parse runtime errors into problems store so they show up in the Problems view
        const { parseErrors } = await import('../../utils/utils');
        const runtimeProblems = parseErrors(result.stderr, tab.fileName, tab.filePath);

        // Store as runtime problems
        if (runtimeProblems.length === 0) {
          // Fallback if parser couldn't find specific lines but stderr exists
          runtimeProblems.push({
            message: result.stderr.split('\n')[0] || 'Unknown Runtime Error',
            line: 1,
            source: tab.fileName,
            type: 'error'
          } as any);
        }
        editorStore.setRuntimeProblems(runtimeProblems as any);

        editorStore.appendDebugData(`[Runtime Error in ${tab.fileName}]\n${result.stderr}\n\n`);
        editorStore.appendOutputData('\n❌ Execution failed. Check Problems tab for details.\n');
      } else {
        editorStore.appendOutputData('\n✅ Completed successfully.\n');

        // 5. Success! Trigger Lumo AI Analysis automatically
        try {
          const { analysisApi } = await import('../api/analysis');
          const analysisStore = (await import('../stores/analysisStore')).useAnalysisStore.getState();

          analysisStore.setAnalyzing(true);
          const analysisRes = await analysisApi.analyzeCode({
            code: tab.content,
            language: tab.language,
            fileName: tab.fileName
          });

          if (analysisRes.success) {
            analysisStore.setAnalysisData(analysisRes.analysis);
            editorStore.appendOutputData(`✨ Lumo AI: Code analysis completed. Check the Analysis panel.\n`);
          }
          analysisStore.setAnalyzing(false);
        } catch (aiErr) {
          console.error('AI Analysis trigger failed:', aiErr);
        }
      }

      return true;
    } catch (error: any) {
      editorStore.appendOutputData(`\n❌ Error: ${error.message}\n`);
      return false;
    }
  };

  const openFileDialog = async (): Promise<boolean> => {
    try {
      const result = await fileSystemApi.openFileDialog();
      if (result && !result.canceled && result.filePath) {
        return await openFile(result.filePath);
      }
      return false;
    } catch (error: any) {
      editorStore.appendOutputData(`❌ Error: ${error.message}\n`);
      return false;
    }
  };

  const saveFileAs = async (tabId: string): Promise<boolean> => {
    const tab = editorStore.tabs.find(t => t.id === tabId);
    if (!tab) return false;

    try {
      const result = await fileSystemApi.saveFileAs(tab.content);
      if (result && !result.canceled && result.filePath) {
        editorStore.appendOutputData(`✅ Saved As: ${result.filePath}\n`);
        return true;
      }
      return false;
    } catch (error: any) {
      editorStore.appendOutputData(`❌ Error saving as: ${error.message}\n`);
      return false;
    }
  };

  const saveAll = async (): Promise<void> => {
    const dirtyTabs = editorStore.tabs.filter(t => t.isDirty);
    if (dirtyTabs.length === 0) {
      editorStore.appendOutputData(`ℹ️ No unsaved changes.\n`);
      return;
    }

    editorStore.appendOutputData(`💾 Saving all files (${dirtyTabs.length})...\n`);
    for (const tab of dirtyTabs) {
      await saveFile(tab.id);
    }
    editorStore.appendOutputData(`✅ All files saved.\n`);
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
    openFileDialog,
    saveFileAs,
    saveAll,
  };
};
