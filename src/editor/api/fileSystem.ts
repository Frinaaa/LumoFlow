import { ApiResponse } from '../types';

/**
 * File System API - Type-safe wrappers for Electron IPC calls
 * Centralizes all file operations and error handling
 */

// Helper to check if we're in Electron environment
const isElectron = () => typeof window !== 'undefined' && window.api;

export const fileSystemApi = {
  /**
   * Read file content from disk
   */
  async readFile(path: string): Promise<string> {
    if (!isElectron()) {
      console.warn('readFile: Not in Electron environment');
      return '';
    }
    
    const res = await window.api.readFile(path);

    if (typeof res === 'string') {
      return res;
    }

    if ((res as any).success === false) {
      throw new Error((res as any).msg || 'Failed to read file');
    }

    return (res as any).content || '';
  },

  /**
   * Save file content to disk and database (atomic)
   */
  async saveAtomic(filePath: string, content: string, userId: string): Promise<boolean> {
    if (!isElectron()) {
      console.warn('saveAtomic: Not in Electron environment');
      return false;
    }
    
    const result = await (window.api as any).saveAtomic({ filePath, content, userId });

    if (!result.success) {
      throw new Error(result.msg || 'Failed to save file');
    }

    return true;
  },

  /**
   * Save file content to disk (legacy/fallback)
   */
  async saveFile(filePath: string, content: string): Promise<boolean> {
    if (!isElectron()) {
      console.warn('saveFile: Not in Electron environment');
      return false;
    }
    
    const result = await window.api.saveFile({ filePath, content });

    if (!result.success) {
      throw new Error(result.msg || 'Failed to save file');
    }

    return true;
  },

  /**
   * Create a new file
   */
  async createFile(fileName: string, content: string = ''): Promise<string> {
    if (!isElectron()) {
      console.warn('createFile: Not in Electron environment');
      return '';
    }
    
    const result = await window.api.createFile({ fileName, content });

    if (!result.success) {
      throw new Error(result.msg || 'Failed to create file');
    }

    return result.path || fileName;
  },

  /**
   * Create a new folder
   */
  async createFolder(folderName: string): Promise<boolean> {
    if (!isElectron()) {
      console.warn('createFolder: Not in Electron environment');
      return false;
    }
    
    const result = await window.api.createFolder(folderName);

    if (!result.success) {
      throw new Error(result.msg || 'Failed to create folder');
    }

    return true;
  },

  /**
   * Delete a file or folder
   */
  async deleteFile(filePath: string): Promise<boolean> {
    if (!isElectron()) {
      console.warn('deleteFile: Not in Electron environment');
      return false;
    }
    
    const result = await window.api.deleteFile(filePath);

    if (!result.success) {
      throw new Error(result.msg || 'Failed to delete file');
    }

    return true;
  },

  /**
   * Rename a file or folder
   */
  async renameFile(oldPath: string, newName: string): Promise<string> {
    if (!isElectron()) {
      console.warn('renameFile: Not in Electron environment');
      return '';
    }
    
    const result = await window.api.renameFile(oldPath, newName);

    if (!result.success) {
      throw new Error(result.msg || 'Failed to rename file');
    }

    return result.newPath || newName;
  },

  /**
   * Move a file or folder
   */
  async moveFile(sourcePath: string, targetPath: string): Promise<string> {
    if (!isElectron() || !(window.api as any).moveFile) {
      console.warn('moveFile: Not supported in current environment');
      throw new Error('Move operation not supported');
    }

    const result = await (window.api as any).moveFile(sourcePath, targetPath);

    if (!result.success) {
      throw new Error(result.msg || 'Failed to move file');
    }

    return result.newPath || targetPath;
  },

  /**
   * Read project files (file tree)
   */
  async readProjectFiles(): Promise<any[]> {
    if (!isElectron() || !window.api.readProjectFiles) {
      console.warn('readProjectFiles: Not in Electron environment');
      return [];
    }
    try {
      const files = await window.api.readProjectFiles();
      return files || [];
    } catch (error) {
      console.error('Error reading project files:', error);
      return [];
    }
  },

  /**
   * Open file dialog
   */
  async openFileDialog(): Promise<{ filePath: string; canceled: boolean } | null> {
    if (!isElectron() || !window.api.openFileDialog) {
      console.warn('openFileDialog: Not in Electron environment');
      return null;
    }
    try {
      const result = await window.api.openFileDialog();
      return result;
    } catch (error) {
      console.error('Error opening file dialog:', error);
      return null;
    }
  },

  /**
   * Open folder dialog
   */
  async openFolderDialog(): Promise<{ folderPath: string; canceled: boolean } | null> {
    if (!isElectron() || !window.api.openFolderDialog) {
      console.warn('openFolderDialog: Not in Electron environment');
      return null;
    }
    try {
      const result = await window.api.openFolderDialog();
      return result;
    } catch (error) {
      console.error('Error opening folder dialog:', error);
      return null;
    }
  },

  /**
   * Save file as dialog
   */
  async saveFileAs(content: string): Promise<{ filePath: string; canceled: boolean } | null> {
    if (!isElectron()) {
      console.warn('saveFileAs: Not in Electron environment');
      return null;
    }
    
    const result = await window.api.saveFileAs(content);
    return result;
  },
};
