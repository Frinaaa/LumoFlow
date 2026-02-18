import { useEditorStore } from '../stores/editorStore';
import { useFileStore } from '../stores/fileStore';
import { fileSystemApi, terminalApi } from '../api';
import { getLanguageFromFile } from '../../config/fileTypes';
import { copilotService } from '../../services/CopilotService';

// ─── Semantic hint prompt ─────────────────────────────────────────────────────
function buildSemanticPrompt(code: string, fileName: string, output: string): string {
  return `You are a coding tutor. A student ran this code and got the output below.
Look for semantic or logic errors — things that ran without crashing but may be WRONG:
- Incorrect calculations or results
- Off-by-one errors
- Wrong variable used
- Logic that doesn't match the intended purpose
- Misleading output
- Potential edge cases that would break it

File: ${fileName}

Code:
\`\`\`
${code}
\`\`\`

Actual output:
${output}

Respond ONLY as a JSON array (no markdown fences, no extra text):
[
  { "line": <number>, "issue": "<short description>", "hint": "<1 sentence student-friendly fix hint>" }
]
If there are NO semantic/logic issues, respond with exactly: []
Be concise. Max 5 issues.`;
}

/**
 * File Operations Hook
 * Handles all file-related operations with proper error handling
 */

export const useFileOperations = () => {
  const editorStore = useEditorStore();
  const fileStore = useFileStore();

  // Helper to refresh Git status automatically
  const refreshGitStatus = async () => {
    try {
      const { useGitOperations } = await import('./useGitOperations');
      const { checkStatus } = useGitOperations();
      await checkStatus();
    } catch (e) {
      // Quietly skip if Git is not initialized or useGitOperations fails
      console.log('Git auto-refresh skipped (normal for non-git workspaces)');
    }
  };

  const openFile = async (filePath: string): Promise<boolean> => {
    try {
      console.log('Reading file:', filePath);
      const content = await fileSystemApi.readFile(filePath);
      console.log('File content read, length:', content.length);

      const fileName = filePath.split(/[\\/]/).pop() || 'untitled';
      const language = getLanguageFromFile(fileName);

      console.log('Adding tab:', fileName, 'language:', language);
      editorStore.addTab(filePath, fileName, content, language);
      editorStore.appendOutputData(`✅ Opened: ${fileName}\n`);
      return true;
    } catch (error: any) {
      console.error('Open file error:', error);
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

      // Auto-refresh Git status after save
      await refreshGitStatus();

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
        fullPath = `${parentPath}/${fileName}`;
      }

      if (!fullPath.includes('.')) {
        fullPath += '.js';
      }

      console.log('Creating file:', fullPath);

      const newFilePath = await fileSystemApi.createFile(fullPath, '');
      console.log('File created at:', newFilePath);

      await refreshFiles();
      await openFile(newFilePath);
      editorStore.appendOutputData(`✅ Created: ${fileName}\n`);

      // Auto-refresh Git status to show the new file in Source Control
      await refreshGitStatus();

      return true;
    } catch (error: any) {
      console.error('Create file error:', error);
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

      // Auto-refresh Git status for folders
      await refreshGitStatus();

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

      // Auto-refresh Git status after deletion
      await refreshGitStatus();

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
      console.log('Refreshing files...');
      const files = await fileSystemApi.readProjectFiles();
      console.log('Files loaded:', files.length, 'files');
      fileStore.setFiles(files);
      console.log('File store updated');
      return true;
    } catch (error) {
      console.error('Error refreshing files:', error);
      return false;
    }
  };

  const openFolder = async (): Promise<boolean> => {
    try {
      console.log('Opening folder dialog...');
      const result = await fileSystemApi.openFolderDialog();
      console.log('Folder dialog result:', result);

      if (result && !result.canceled && result.folderPath) {
        console.log('Setting workspace to:', result.folderPath);
        const folderName = result.folderPath.split(/[\\\/]/).pop() || 'Workspace';
        fileStore.setWorkspace(result.folderPath, folderName);

        // Save to localStorage for persistence
        localStorage.setItem('lumoflow_workspace', JSON.stringify({
          path: result.folderPath,
          name: folderName
        }));
        console.log('💾 Workspace saved to localStorage:', result.folderPath);

        // Sync with backend - update projectDir in main process
        if ((window as any).api?.setWorkspace) {
          try {
            const syncResult = await (window as any).api.setWorkspace(result.folderPath);
            if (syncResult.success) {
              console.log('✅ Backend workspace synced:', syncResult.path);
            } else {
              console.warn('⚠️ Failed to sync backend workspace:', syncResult.error);
            }
          } catch (e) {
            console.error('Error syncing workspace with backend:', e);
          }
        }

        console.log('Refreshing files...');
        const filesRefreshed = await refreshFiles();
        console.log('Files refreshed:', filesRefreshed);

        editorStore.setWorkspaceStatus('Folder Opened');
        editorStore.appendOutputData(`✅ Opened: ${folderName}\n`);

        // Ensure sidebar is visible to show the files
        if (!editorStore.sidebarVisible) {
          editorStore.toggleSidebar();
        }
        editorStore.setActiveSidebar('Explorer');

        console.log('Folder opened successfully');
        return true;
      } else {
        console.log('Folder dialog canceled or no folder selected');
        editorStore.appendOutputData(`ℹ️ Folder selection canceled.\n`);
      }
      return false;
    } catch (error: any) {
      console.error('Folder dialog error:', error);
      editorStore.appendOutputData(`❌ Error: ${error.message}\n`);
      return false;
    }
  };

  const runCode = async (tabId: string): Promise<boolean> => {
    // 1. Get the freshest state directly (ignores React render cycles)
    const currentStore = useEditorStore.getState();
    const tab = currentStore.tabs.find(t => t.id === tabId);
    if (!tab) return false;

    // 2. Capture the EXACT code being sent to the terminal
    const exactCodeToRun = tab.content;
    const exactFilePath = tab.filePath;
    const exactFileName = tab.fileName;

    const visualStoreImport = await import('../stores/visualStore');
    const visualStore = visualStoreImport.useVisualStore.getState();

    // 3. IMMEDIATELY Reset Visuals so the old bubbles die
    visualStore.clearVisuals();

    // 4. PREPARE Terminal UI
    editorStore.clearOutputData();
    editorStore.setActiveBottomTab('Output');
    if (!editorStore.terminalVisible) editorStore.toggleTerminal();

    try {
      // 5. Run the code in the terminal
      const result = await terminalApi.runCode(tab.filePath, exactCodeToRun);

      // 6. NOW trigger the AI with the EXACT code AND the result
      if (result.stdout || result.stderr === "") {
        editorStore.appendOutputData(result.stdout + '\n');
        // Send BOTH code and output in ONE call to ensure they match
        visualStore.fetchAiSimulation(exactCodeToRun, exactFilePath, result.stdout);

        // 7. Background semantic/logic analysis — appends hints below output
        runSemanticAnalysis(exactCodeToRun, exactFileName, result.stdout);
      } else {
        editorStore.appendOutputData(result.stderr);
      }
      return true;
    } catch (error: any) {
      editorStore.appendOutputData(`\n❌ Error: ${error.message}\n`);
      return false;
    }
  };

  // ─── Semantic analysis (fire-and-forget) ─────────────────────────────────────
  const runSemanticAnalysis = (code: string, fileName: string, output: string) => {
    if (!output.trim() || !(window as any).api) return;

    let raw = '';
    copilotService.streamChat(
      buildSemanticPrompt(code, fileName, output),
      (chunk: string) => { raw += chunk; },
      () => {
        try {
          // Strip any accidental markdown fences
          const cleaned = raw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
          const issues: Array<{ line: number; issue: string; hint: string }> = JSON.parse(cleaned);
          if (!Array.isArray(issues) || issues.length === 0) return;

          // Build the inline hint block
          const lines = [
            '',
            '─────────────────────────────────────────',
            `⚠  Semantic/Logic hints for ${fileName}`,
            '─────────────────────────────────────────',
            ...issues.map(i =>
              `  Line ${i.line}: ${i.issue}\n          ↳ ${i.hint}`
            ),
            '─────────────────────────────────────────',
            '',
          ];
          useEditorStore.getState().appendOutputData(lines.join('\n'));
        } catch {
          // Silently ignore parse failures — don't disrupt the output
        }
      },
      () => { /* silently ignore AI errors for this background call */ }
    );
  };

  const openFileDialog = async (): Promise<boolean> => {
    try {
      console.log('Opening file dialog...');
      const result = await fileSystemApi.openFileDialog();
      console.log('File dialog result:', result);

      if (result && !result.canceled && result.filePath) {
        console.log('Opening file:', result.filePath);
        return await openFile(result.filePath);
      } else {
        console.log('File dialog canceled or no file selected');
      }
      return false;
    } catch (error: any) {
      console.error('File dialog error:', error);
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