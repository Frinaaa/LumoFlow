// Import from centralized editor types and re-alias for backwards compatibility
import { FileNode } from '../editor/types';

// FileItem is an alias for FileNode with additional fields for tree building
export interface FileItem extends FileNode {
  parentFolder?: string;
}

// Re-export from centralized config for backwards compatibility
export {
  getLanguageFromFile,
  getFileIcon,
  getFileIconColor,
  getFileTypeInfo,
  FILE_TYPES,
  FOLDER_INFO
} from '../config/fileTypes';

interface Problem {
  message: string;
  line: number;
  source: string;
  type: 'error' | 'warning';
}

// Strip ANSI escape sequences
export const stripAnsiCodes = (str: string): string => {
  return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
};

// Parse errors from stderr into problems
export const parseErrors = (stderr: string, fileName: string, filePath?: string): Problem[] => {
  if (!stderr) return [];

  const cleanStderr = stripAnsiCodes(stderr);
  const problems: Problem[] = [];
  const lines = cleanStderr.split('\n');

  for (const line of lines) {
    // Python error patterns
    if (line.includes('File "') && line.includes('line ')) {
      const lineMatch = line.match(/line (\d+)/);
      const lineNum = lineMatch ? parseInt(lineMatch[1]) : 1;

      const errorIndex = lines.indexOf(line);
      let message = 'Syntax Error';

      if (errorIndex < lines.length - 1) {
        const nextLine = lines[errorIndex + 1];
        if (nextLine && nextLine.trim()) {
          message = nextLine.trim();
        }
      }

      problems.push({
        message,
        line: lineNum,
        source: fileName,
        type: 'error'
      });
    }

    // JavaScript error patterns
    else if (line.includes('SyntaxError') || line.includes('ReferenceError') || line.includes('TypeError')) {
      const lineMatch = line.match(/:(\d+):/);
      const lineNum = lineMatch ? parseInt(lineMatch[1]) : 1;

      problems.push({
        message: line.trim(),
        line: lineNum,
        source: fileName,
        type: 'error'
      });
    }

    // Generic error patterns
    else if (line.includes('Error:') || line.includes('Exception:')) {
      problems.push({
        message: line.trim(),
        line: 1,
        source: fileName,
        type: 'error'
      });
    }
  }

  return problems;
};

// Check if Electron API is available
export const isElectronAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).api;
};

// Check if file is a folder
export const isFolder = (file: any): boolean => {
  return file.isFolder ||
    file.path?.endsWith('/') ||
    file.path?.endsWith('\\') ||
    !file.name.includes('.');
};

// Build folder tree structure from flat file list
export const buildFolderTree = (files: FileItem[]): FileItem[] => {
  const fileMap = new Map<string, FileItem>();
  const rootFiles: FileItem[] = [];

  // First pass: create all file objects
  files.forEach(file => {
    fileMap.set(file.path, { ...file, children: [] });
  });

  // Second pass: build tree structure
  files.forEach(file => {
    const fileObj = fileMap.get(file.path);
    if (!fileObj) return;

    if (file.parentFolder) {
      const parent = fileMap.get(file.parentFolder);
      if (parent && parent.children) {
        parent.children.push(fileObj);
      }
    } else {
      rootFiles.push(fileObj);
    }
  });

  // Sort: folders first, then files, alphabetically
  const sortFiles = (a: FileItem, b: FileItem) => {
    const aIsFolder = isFolder(a);
    const bIsFolder = isFolder(b);

    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    return a.name.localeCompare(b.name);
  };

  const sortTree = (items: FileItem[]): FileItem[] => {
    return items.sort(sortFiles).map(item => ({
      ...item,
      children: item.children ? sortTree(item.children) : []
    }));
  };

  return sortTree(rootFiles);
};

