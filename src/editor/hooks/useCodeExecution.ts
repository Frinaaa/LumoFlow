import { useEditorStore } from '../stores/editorStore';
import { terminalApi } from '../api';

/**
 * Code Execution Hook
 * Handles running code and displaying output
 */

export const useCodeExecution = () => {
  const editorStore = useEditorStore();

  const runCode = async (tabId: string): Promise<boolean> => {
    const tab = editorStore.tabs.find(t => t.id === tabId);
    if (!tab) {
      editorStore.appendOutputData('❌ No file selected to run\n');
      return false;
    }

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

  const executeCommand = async (command: string): Promise<string> => {
    editorStore.appendTerminalOutput(`$ ${command}\n`);
    
    try {
      const result = await terminalApi.executeCommand(command);
      editorStore.appendTerminalOutput(result + '\n');
      return result;
    } catch (error: any) {
      const errorMsg = `Error: ${error.message}\n`;
      editorStore.appendTerminalOutput(errorMsg);
      return errorMsg;
    }
  };

  return {
    runCode,
    executeCommand,
  };
};
