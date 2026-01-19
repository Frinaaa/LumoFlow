import React, { useState } from 'react';

interface FileExplorerProps {
  files: any[];
  selectedFile: string | null;
  onFileSelect: (file: any) => void;
  onCreateFile: (name: string) => void;
  onCreateFolder: (name: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, selectedFile, onFileSelect, onCreateFile, onCreateFolder 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newName, setNewName] = useState('');
  const [creationType, setCreationType] = useState<'file' | 'folder'>('file');

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      if (creationType === 'file') {
        onCreateFile(newName);
        setIsCreatingFile(false);
      } else {
        onCreateFolder(newName);
        setIsCreatingFolder(false);
      }
      setNewName('');
    }
  };

  const handleInputBlur = () => {
    if (newName.trim()) {
      handleCreateSubmit({ preventDefault: () => {} } as React.FormEvent);
    } else {
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      setNewName('');
    }
  };

  const getIcon = (name: string) => {
    if (name.endsWith('.py')) return 'fa-brands fa-python';
    if (name.endsWith('.js')) return 'fa-brands fa-js';
    if (name.endsWith('.ts')) return 'fa-brands fa-js';
    if (name.endsWith('.tsx')) return 'fa-brands fa-react';
    if (name.endsWith('.jsx')) return 'fa-brands fa-react';
    return 'fa-solid fa-file-code';
  }

  return (
    <aside className="ide-sidebar">
      {/* Search & Actions */}
      <div className="explorer-header">
        <span className="project-label">PROJECT</span>
        <div style={{display:'flex', gap:'5px'}}>
             <button 
               className="new-file-btn" 
               onClick={() => {
                 setCreationType('file');
                 setIsCreatingFile(true);
               }} 
               title="New File"
               style={{
                 padding: '4px 8px',
                 background: 'transparent',
                 border: '1px solid #333',
                 borderRadius: '3px',
                 color: '#888',
                 cursor: 'pointer',
                 fontSize: '11px'
               }}
             >
                <i className="fa-solid fa-file-plus"></i>
             </button>
             <button 
               className="new-folder-btn" 
               onClick={() => {
                 setCreationType('folder');
                 setIsCreatingFolder(true);
               }} 
               title="New Folder"
               style={{
                 padding: '4px 8px',
                 background: 'transparent',
                 border: '1px solid #333',
                 borderRadius: '3px',
                 color: '#888',
                 cursor: 'pointer',
                 fontSize: '11px'
               }}
             >
                <i className="fa-solid fa-folder-plus"></i>
             </button>
             <button 
               className="refresh-btn" 
               title="Refresh"
               style={{
                 padding: '4px 8px',
                 background: 'transparent',
                 border: '1px solid #333',
                 borderRadius: '3px',
                 color: '#888',
                 cursor: 'pointer',
                 fontSize: '11px'
               }}
             >
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
        style={{
          width: '100%',
          padding: '6px 8px',
          margin: '8px 0',
          background: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '4px',
          color: '#ccc',
          fontSize: '12px'
        }}
      />

      {/* File List */}
      <div className="file-list" style={{ flex: 1, overflow: 'auto' }}>
        {(isCreatingFile || isCreatingFolder) && (
          <form onSubmit={handleCreateSubmit} className="file-input-wrapper" style={{ padding: '8px' }}>
            <input 
              autoFocus
              type="text" 
              className="new-file-input"
              placeholder={creationType === 'file' ? 'filename.py' : 'folder name'}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateSubmit(e as any);
                } else if (e.key === 'Escape') {
                  setIsCreatingFile(false);
                  setIsCreatingFolder(false);
                  setNewName('');
                }
              }}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: '#2d2d30',
                border: '1px solid #00f2ff',
                borderRadius: '3px',
                color: '#fff',
                fontSize: '12px'
              }}
            />
          </form>
        )}

        {filteredFiles.length === 0 && !isCreatingFile && !isCreatingFolder && (
          <div style={{
            padding: '20px 8px',
            textAlign: 'center',
            color: '#666',
            fontSize: '12px'
          }}>
            <i className="fa-solid fa-folder-open" style={{ display: 'block', marginBottom: '8px', fontSize: '24px' }}></i>
            No files found
          </div>
        )}

        {filteredFiles.map(file => (
          <div 
            key={file.path} 
            className={`file-item`}
            onClick={() => onFileSelect(file)}
            style={{
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              background: selectedFile === file.path ? '#2d2d30' : 'transparent',
              borderLeft: selectedFile === file.path ? '3px solid #00f2ff' : '3px solid transparent',
              color: selectedFile === file.path ? '#fff' : '#ccc',
              fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (selectedFile !== file.path) {
                e.currentTarget.style.background = '#1e1e1e';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedFile !== file.path) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <i className={getIcon(file.name)} style={{ fontSize: '12px' }}></i>
            <span className="file-name">{file.name}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default FileExplorer;