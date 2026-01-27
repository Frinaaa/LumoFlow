/**
 * Unified File Types Configuration
 * Single source of truth for all file extension mappings
 * 
 * This eliminates duplicate switch statements across:
 * - src/utils/utils.ts
 * - src/editor/hooks/useFileOperations.ts
 * - src/editor/components/Monaco/CodeEditor.tsx
 * - src/editor/components/Workspace/TabBar.tsx
 */

export interface FileTypeInfo {
  lang: string;
  icon: string;
  color: string;
  displayName: string;
}

/**
 * Master mapping of file extensions to their properties
 */
export const FILE_TYPES: Record<string, FileTypeInfo> = {
  // JavaScript/TypeScript
  js: { 
    lang: 'javascript', 
    icon: 'fa-brands fa-js', 
    color: '#f7df1e',
    displayName: 'JavaScript'
  },
  jsx: { 
    lang: 'javascript', 
    icon: 'fa-brands fa-react', 
    color: '#61dafb',
    displayName: 'React JSX'
  },
  ts: { 
    lang: 'typescript', 
    icon: 'fa-brands fa-js', 
    color: '#3178c6',
    displayName: 'TypeScript'
  },
  tsx: { 
    lang: 'typescript', 
    icon: 'fa-brands fa-react', 
    color: '#3178c6',
    displayName: 'React TSX'
  },
  mjs: { 
    lang: 'javascript', 
    icon: 'fa-brands fa-js', 
    color: '#f7df1e',
    displayName: 'ES Module'
  },
  cjs: { 
    lang: 'javascript', 
    icon: 'fa-brands fa-js', 
    color: '#f7df1e',
    displayName: 'CommonJS'
  },

  // Python
  py: { 
    lang: 'python', 
    icon: 'fa-brands fa-python', 
    color: '#3776ab',
    displayName: 'Python'
  },
  pyw: { 
    lang: 'python', 
    icon: 'fa-brands fa-python', 
    color: '#3776ab',
    displayName: 'Python'
  },
  pyx: { 
    lang: 'python', 
    icon: 'fa-brands fa-python', 
    color: '#3776ab',
    displayName: 'Cython'
  },

  // Web
  html: { 
    lang: 'html', 
    icon: 'fa-brands fa-html5', 
    color: '#e34c26',
    displayName: 'HTML'
  },
  htm: { 
    lang: 'html', 
    icon: 'fa-brands fa-html5', 
    color: '#e34c26',
    displayName: 'HTML'
  },
  css: { 
    lang: 'css', 
    icon: 'fa-brands fa-css3', 
    color: '#264de4',
    displayName: 'CSS'
  },
  scss: { 
    lang: 'scss', 
    icon: 'fa-brands fa-sass', 
    color: '#cc6699',
    displayName: 'SCSS'
  },
  sass: { 
    lang: 'scss', 
    icon: 'fa-brands fa-sass', 
    color: '#cc6699',
    displayName: 'Sass'
  },
  less: { 
    lang: 'less', 
    icon: 'fa-brands fa-less', 
    color: '#1d365d',
    displayName: 'Less'
  },

  // Data
  json: { 
    lang: 'json', 
    icon: 'fa-solid fa-brackets-curly', 
    color: '#cbcb41',
    displayName: 'JSON'
  },
  xml: { 
    lang: 'xml', 
    icon: 'fa-solid fa-code', 
    color: '#e37933',
    displayName: 'XML'
  },
  yaml: { 
    lang: 'yaml', 
    icon: 'fa-solid fa-file-code', 
    color: '#cb171e',
    displayName: 'YAML'
  },
  yml: { 
    lang: 'yaml', 
    icon: 'fa-solid fa-file-code', 
    color: '#cb171e',
    displayName: 'YAML'
  },
  toml: { 
    lang: 'toml', 
    icon: 'fa-solid fa-file-code', 
    color: '#9c4121',
    displayName: 'TOML'
  },

  // Documentation
  md: { 
    lang: 'markdown', 
    icon: 'fa-brands fa-markdown', 
    color: '#ffffff',
    displayName: 'Markdown'
  },
  mdx: { 
    lang: 'markdown', 
    icon: 'fa-brands fa-markdown', 
    color: '#fcb32c',
    displayName: 'MDX'
  },
  txt: { 
    lang: 'plaintext', 
    icon: 'fa-regular fa-file-lines', 
    color: '#89e051',
    displayName: 'Plain Text'
  },

  // Config files
  env: { 
    lang: 'plaintext', 
    icon: 'fa-solid fa-gear', 
    color: '#ecd53f',
    displayName: 'Environment'
  },
  gitignore: { 
    lang: 'plaintext', 
    icon: 'fa-brands fa-git-alt', 
    color: '#f14e32',
    displayName: 'Git Ignore'
  },
  npmrc: { 
    lang: 'plaintext', 
    icon: 'fa-brands fa-npm', 
    color: '#cb3837',
    displayName: 'NPM Config'
  },
  eslintrc: { 
    lang: 'json', 
    icon: 'fa-solid fa-circle-check', 
    color: '#4b32c3',
    displayName: 'ESLint Config'
  },
  prettierrc: { 
    lang: 'json', 
    icon: 'fa-solid fa-wand-magic-sparkles', 
    color: '#f7b93e',
    displayName: 'Prettier Config'
  },

  // Other languages
  java: { 
    lang: 'java', 
    icon: 'fa-brands fa-java', 
    color: '#b07219',
    displayName: 'Java'
  },
  c: { 
    lang: 'c', 
    icon: 'fa-solid fa-c', 
    color: '#555555',
    displayName: 'C'
  },
  cpp: { 
    lang: 'cpp', 
    icon: 'fa-solid fa-c', 
    color: '#f34b7d',
    displayName: 'C++'
  },
  h: { 
    lang: 'c', 
    icon: 'fa-solid fa-h', 
    color: '#555555',
    displayName: 'C Header'
  },
  hpp: { 
    lang: 'cpp', 
    icon: 'fa-solid fa-h', 
    color: '#f34b7d',
    displayName: 'C++ Header'
  },
  cs: { 
    lang: 'csharp', 
    icon: 'fa-solid fa-hashtag', 
    color: '#178600',
    displayName: 'C#'
  },
  go: { 
    lang: 'go', 
    icon: 'fa-brands fa-golang', 
    color: '#00add8',
    displayName: 'Go'
  },
  rs: { 
    lang: 'rust', 
    icon: 'fa-brands fa-rust', 
    color: '#dea584',
    displayName: 'Rust'
  },
  rb: { 
    lang: 'ruby', 
    icon: 'fa-regular fa-gem', 
    color: '#701516',
    displayName: 'Ruby'
  },
  php: { 
    lang: 'php', 
    icon: 'fa-brands fa-php', 
    color: '#4f5d95',
    displayName: 'PHP'
  },
  swift: { 
    lang: 'swift', 
    icon: 'fa-brands fa-swift', 
    color: '#f05138',
    displayName: 'Swift'
  },
  kt: { 
    lang: 'kotlin', 
    icon: 'fa-solid fa-k', 
    color: '#a97bff',
    displayName: 'Kotlin'
  },
  sql: { 
    lang: 'sql', 
    icon: 'fa-solid fa-database', 
    color: '#e38c00',
    displayName: 'SQL'
  },
  sh: { 
    lang: 'shell', 
    icon: 'fa-solid fa-terminal', 
    color: '#89e051',
    displayName: 'Shell'
  },
  bash: { 
    lang: 'shell', 
    icon: 'fa-solid fa-terminal', 
    color: '#89e051',
    displayName: 'Bash'
  },
  ps1: { 
    lang: 'powershell', 
    icon: 'fa-solid fa-terminal', 
    color: '#012456',
    displayName: 'PowerShell'
  },
  bat: { 
    lang: 'bat', 
    icon: 'fa-solid fa-terminal', 
    color: '#c1f12e',
    displayName: 'Batch'
  },
};

/**
 * Default file type info for unknown extensions
 */
const DEFAULT_FILE_TYPE: FileTypeInfo = {
  lang: 'plaintext',
  icon: 'fa-regular fa-file-code',
  color: '#519aba',
  displayName: 'File'
};

/**
 * Folder icon configuration
 */
export const FOLDER_INFO = {
  icon: 'fa-solid fa-folder',
  iconOpen: 'fa-solid fa-folder-open',
  color: '#dcb67a'
};

/**
 * Get comprehensive file type information from a file name or path
 * @param fileName - File name or path
 * @returns FileTypeInfo object with lang, icon, color, and displayName
 */
export const getFileTypeInfo = (fileName: string): FileTypeInfo => {
  if (!fileName) return DEFAULT_FILE_TYPE;
  
  // Handle dotfiles (e.g., .gitignore, .env)
  const name = fileName.split(/[\\/]/).pop() || fileName;
  
  // Check for dotfiles first
  if (name.startsWith('.')) {
    const dotfileName = name.slice(1).toLowerCase();
    if (FILE_TYPES[dotfileName]) {
      return FILE_TYPES[dotfileName];
    }
  }
  
  // Get extension
  const ext = name.split('.').pop()?.toLowerCase() || '';
  
  return FILE_TYPES[ext] || DEFAULT_FILE_TYPE;
};

/**
 * Get just the language from a file name (for Monaco editor)
 * @param fileName - File name or path
 * @returns Monaco-compatible language string
 */
export const getLanguageFromFile = (fileName: string | null): string => {
  if (!fileName) return 'plaintext';
  return getFileTypeInfo(fileName).lang;
};

/**
 * Get just the icon class from a file name
 * @param fileName - File name or path
 * @param isFolder - Whether this is a folder
 * @returns Font Awesome icon class
 */
export const getFileIcon = (fileName: string, isFolder: boolean = false): string => {
  if (isFolder) return FOLDER_INFO.icon;
  return getFileTypeInfo(fileName).icon;
};

/**
 * Get icon color from a file name
 * @param fileName - File name or path
 * @param isFolder - Whether this is a folder
 * @returns Hex color string
 */
export const getFileIconColor = (fileName: string, isFolder: boolean = false): string => {
  if (isFolder) return FOLDER_INFO.color;
  return getFileTypeInfo(fileName).color;
};

/**
 * Get display name for the file type
 * @param fileName - File name or path
 * @returns Human-readable file type name
 */
export const getFileTypeName = (fileName: string): string => {
  return getFileTypeInfo(fileName).displayName;
};
