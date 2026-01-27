import { FileItem } from './hooks/EditorScreen/types';

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

// Get language from file extension
export const getLanguageFromFile = (filePath: string | null): string => {
  if (!filePath) return 'javascript';
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'py': return 'python';
    case 'js': return 'javascript';
    case 'ts': return 'typescript';
    case 'jsx': return 'javascript';
    case 'tsx': return 'typescript';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'json': return 'json';
    default: return 'javascript';
  }
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

// Get file icon based on extension
export const getFileIcon = (fileName: string, isFolder: boolean): string => {
  if (isFolder) return 'fa-solid fa-folder';
  
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'fa-brands fa-js';
    case 'ts':
    case 'tsx':
      return 'fa-brands fa-react';
    case 'py':
      return 'fa-brands fa-python';
    case 'html':
      return 'fa-brands fa-html5';
    case 'css':
      return 'fa-brands fa-css3';
    case 'json':
      return 'fa-solid fa-brackets-curly';
    case 'md':
      return 'fa-brands fa-markdown';
    case 'git':
    case 'gitignore':
      return 'fa-brands fa-git-alt';
    default:
      return 'fa-regular fa-file-code';
  }
};

// Get file icon color
export const getFileIconColor = (fileName: string, isFolder: boolean): string => {
  if (isFolder) return '#dcb67a';
  
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return '#f7df1e';
    case 'ts':
    case 'tsx':
      return '#3178c6';
    case 'py':
      return '#3776ab';
    case 'html':
      return '#e34c26';
    case 'css':
      return '#264de4';
    case 'json':
      return '#5a5a5a';
    case 'md':
      return '#ffffff';
    default:
      return '#519aba';
  }
};
