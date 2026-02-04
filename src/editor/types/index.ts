// Core Editor Types
export interface EditorTab {
  id: string;
  filePath: string;
  fileName: string;
  content: string;
  language: string;
  isDirty: boolean;
  cursorPosition: { line: number; column: number };
  lastSavedLineCount?: number;
}

export interface FileNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: FileNode[];
}

export interface Problem {
  message: string;
  line: number;
  column?: number;
  source: string;
  type: 'error' | 'warning' | 'info';
  code?: string;
}

export interface ContextMenuState {
  x: number;
  y: number;
  file: FileNode;
}

export interface ClipboardState {
  file: FileNode;
  operation: 'copy' | 'cut';
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  msg?: string;
  data?: T;
  path?: string;
  content?: string;
  newPath?: string;
}

// Settings Types
export type Theme = 'dark' | 'light';
export type WordWrap = 'on' | 'off';
export type SidebarView = 'Explorer' | 'Search' | 'GitHub' | 'NPM' | 'Extensions';
export type BottomPanelTab = 'Terminal' | 'Output' | 'Debug' | 'Problems';

export interface TerminalSession {
  id: string;
  name: string;
  type: 'powershell' | 'cmd' | 'node' | 'bash';
  content: string;
}
