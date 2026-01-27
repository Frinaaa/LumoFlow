import { create } from 'zustand';
import { FileNode, ClipboardState } from '../types';

/**
 * File System State Store
 * Manages file tree, workspace, and file operations state
 */

interface FileState {
  // Files
  files: FileNode[];
  expandedFolders: Set<string>;
  selectedFolder: string | null;
  
  // Workspace
  workspacePath: string;
  workspaceName: string;
  
  // File Operations
  clipboard: ClipboardState | null;
  isCreatingFile: boolean;
  isCreatingFolder: boolean;
  newFileName: string;
  newFolderName: string;
  creatingInFolder: string | null;
  renamingFile: string | null;
  newName: string;
  
  // Actions - Files
  setFiles: (files: FileNode[]) => void;
  toggleFolder: (path: string) => void;
  setSelectedFolder: (path: string | null) => void;
  collapseAllFolders: () => void;
  
  // Actions - Workspace
  setWorkspace: (path: string, name: string) => void;
  clearWorkspace: () => void;
  
  // Actions - File Operations
  setClipboard: (clipboard: ClipboardState | null) => void;
  setIsCreatingFile: (value: boolean) => void;
  setIsCreatingFolder: (value: boolean) => void;
  setNewFileName: (name: string) => void;
  setNewFolderName: (name: string) => void;
  setCreatingInFolder: (path: string | null) => void;
  setRenamingFile: (path: string | null) => void;
  setNewName: (name: string) => void;
}

export const useFileStore = create<FileState>((set) => ({
  // Initial State
  files: [],
  expandedFolders: new Set(),
  selectedFolder: null,
  workspacePath: '',
  workspaceName: '',
  clipboard: null,
  isCreatingFile: false,
  isCreatingFolder: false,
  newFileName: '',
  newFolderName: '',
  creatingInFolder: null,
  renamingFile: null,
  newName: '',
  
  // File Actions
  setFiles: (files) => set({ files }),
  
  toggleFolder: (path) => {
    set(state => {
      const newExpanded = new Set(state.expandedFolders);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedFolders: newExpanded };
    });
  },
  
  setSelectedFolder: (path) => set({ selectedFolder: path }),
  
  collapseAllFolders: () => set({ expandedFolders: new Set() }),
  
  // Workspace Actions
  setWorkspace: (path, name) => set({ workspacePath: path, workspaceName: name }),
  
  clearWorkspace: () => set({
    files: [],
    workspacePath: '',
    workspaceName: '',
    expandedFolders: new Set(),
    selectedFolder: null,
  }),
  
  // File Operations Actions
  setClipboard: (clipboard) => set({ clipboard }),
  setIsCreatingFile: (value) => set({ isCreatingFile: value }),
  setIsCreatingFolder: (value) => set({ isCreatingFolder: value }),
  setNewFileName: (name) => set({ newFileName: name }),
  setNewFolderName: (name) => set({ newFolderName: name }),
  setCreatingInFolder: (path) => set({ creatingInFolder: path }),
  setRenamingFile: (path) => set({ renamingFile: path }),
  setNewName: (name) => set({ newName: name }),
}));
