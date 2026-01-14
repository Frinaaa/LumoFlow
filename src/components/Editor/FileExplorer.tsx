import React from 'react';

interface FileExplorerProps {
  files: any[];
  selectedFile: string | null;
  onFileSelect: (file: any) => void;
  isLoading?: boolean;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, 
  selectedFile, 
  onFileSelect,
  isLoading = false
}) => {
  const getFileIcon = (fileName: string): string => {
    if (fileName.endsWith('.py')) return 'fa-brands fa-python';
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return 'fa-brands fa-js';
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return 'fa-brands fa-js';
    if (fileName.endsWith('.json')) return 'fa-code';
    if (fileName.endsWith('.md')) return 'fa-file-lines';
    return 'fa-file';
  };

  return (
    <aside className="ide-sidebar">
      <div className="sidebar-tabs">
        <div className="tab active">
          <i className="fa-regular fa-copy"></i> Explorer
        </div>
        <div className="tab">
          <i className="fa-solid fa-magnifying-glass"></i>
        </div>
        <div className="tab">
          <i className="fa-brands fa-github"></i>
        </div>
      </div>
      <div className="file-list">
        <p className="project-label">PROJECT</p>
        {isLoading ? (
          <div className="loading-indicator">
            <i className="fa-solid fa-spinner fa-spin"></i> Loading...
          </div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <p>No files found</p>
            <small>Create a new file to get started</small>
          </div>
        ) : (
          files.map(file => (
            <div 
              key={file.path} 
              className={`file-item ${selectedFile === file.path ? 'active' : ''}`}
              onClick={() => onFileSelect(file)}
              title={file.name}
            >
              <i className={`${getFileIcon(file.name)}`}></i>
              <span className="file-name">{file.name}</span>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default FileExplorer;
