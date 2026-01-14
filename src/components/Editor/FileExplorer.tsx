import React, { useState } from 'react';

interface FileExplorerProps {
  files: any[];
  selectedFile: string | null;
  onFileSelect: (file: any) => void;
  onCreateFile: (name: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, selectedFile, onFileSelect, onCreateFile 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onCreateFile(newFileName);
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const getIcon = (name: string) => {
    if (name.endsWith('.py')) return 'fa-brands fa-python';
    if (name.endsWith('.js')) return 'fa-brands fa-js';
    return 'fa-solid fa-file-code';
  }

  return (
    <aside className="ide-sidebar">
      {/* Search & Actions */}
      <div className="explorer-header">
        <span className="project-label">PROJECT</span>
        <div style={{display:'flex', gap:'10px'}}>
             <button className="new-file-btn" onClick={() => setIsCreating(true)} title="New File">
                <i className="fa-solid fa-plus"></i>
             </button>
             <button className="new-file-btn" title="Refresh">
                <i className="fa-solid fa-rotate-right"></i>
             </button>
        </div>
      </div>

      <input 
        type="text" 
        className="search-box" 
        placeholder="Search files..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* File List */}
      <div className="file-list">
        {isCreating && (
          <form onSubmit={handleCreateSubmit} className="file-input-wrapper">
            <input 
              autoFocus
              type="text" 
              className="new-file-input"
              placeholder="filename.py"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => setIsCreating(false)}
            />
          </form>
        )}

        {filteredFiles.map(file => (
          <div 
            key={file.path} 
            className={`file-item ${selectedFile === file.path ? 'active' : ''}`}
            onClick={() => onFileSelect(file)}
          >
            <i className={getIcon(file.name)}></i>
            <span className="file-name">{file.name}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default FileExplorer;