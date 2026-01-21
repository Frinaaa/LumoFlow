// Editor State Types
export interface EditorState {
  file: string | null;
  code: string;
  cursorLine: number;
  cursorCol: number;
}

export const initialEditorState: EditorState = { 
  file: null, 
  code: "", 
  cursorLine: 1, 
  cursorCol: 1 
};

// File System Types
export interface FileItem {
  name: string;
  path: string;
  isFolder?: boolean;
  isInMemory?: boolean;
  parentFolder?: string | null;
  children?: FileItem[];
}

export interface ContextMenuState {
  x: number;
  y: number;
  file: FileItem;
}

export interface ClipboardState {
  file: FileItem;
  action: 'cut' | 'copy';
}

// Problem Types
export interface Problem {
  message: string;
  line: number;
  source: string;
  type: 'error' | 'warning' | 'info';
  filePath?: string;
}

export interface FileProblems {
  [filePath: string]: Problem[];
}

// Git Types
export interface GitChange {
  status: string;
  file: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
}

export interface GitCommit {
  hash: string;
  message: string;
}

// Drag Types
export type DragType = 'sidebar' | 'terminal' | 'analysis' | null;

// Tab Types
export interface EditorTab {
  id: string;
  file: string;
  name: string;
  isDirty: boolean;
  isActive: boolean;
}
