/**
 * Terminal API - Type-safe wrappers for terminal/execution operations
 */

export const terminalApi = {
  /**
   * Execute code file
   */
  async runCode(filePath: string, code: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const result = await window.api.runCode({ filePath, code });
      return {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
      };
    } catch (error: any) {
      return {
        stdout: '',
        stderr: error.message || 'Execution failed',
      };
    }
  },

  /**
   * Execute shell command
   */
  async executeCommand(command: string): Promise<string> {
    try {
      if (window.api?.executeCommand) {
        const result = await window.api.executeCommand(command);
        return result || '';
      }
      return 'Command execution not available';
    } catch (error: any) {
      throw new Error(error.message || 'Command execution failed');
    }
  },
};
