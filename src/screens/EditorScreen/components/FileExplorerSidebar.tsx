import React from 'react';
import { FileItem, ClipboardState } from '../types';
import { isFolder } from '../utils';

interface FileExplorerSidebarProps {
  files: FileItem[];
  isCreatingFile: boolean;
  isCreatingFolder: boolean;
  newFileName: string;
  newFolderName: string;
  renameFile: string | null;
  newName: string;
  clipboard: ClipboardState | null;
  expandedFolders: Set<string>;
  selectedFolder: string | null;
  creatingInFolder: string | null;
  setIsCreatingFile: (value: boolean) => void;
  setIsCreatingFolder: (value: boolean) => void;
  setNewFileName: (value: string) => void;
  setNewFolderName: (value: string) => void;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedFolder: (value: string | null) => void;
  setCreatingInFolder: (value: string | null) => void;
  setContextMenu: (value: any) => void;
  setRenameFile: (value: string | null) => void;
  setNewName: (value: string) => void;
  handleFileSelect: (file: FileItem) => void;
  handleCreateFile: (e: React.FormEvent) => void;
  handleCreateFolder: (name?: string) => void;
  handlePasteFile: () => void;
  confirmRename: () => void;
}

export const FileExplorerSidebar: React.FC<FileExplorerSidebarProps> = ({
  files,
  isCreatingFile,
  isCreatingFolder,
  newFileName,
  newFolderName,
  renameFile,
  newName,
  clipboard,
  expandedFolders,
  selectedFolder,
  creatingInFolder,
  setIsCreatingFile,
  setIsCreatingFolder,
  setNewFileName,
  setNewFolderName,
  setExpandedFolders,
  setSelectedFolder,
  setCreatingInFolder,
  setContextMenu,
  setRenameFile,
  setNewName,
  handleFileSelect,
  handleCreateFile,
  handleCreateFolder,
  handlePasteFile,
  confirmRename
}) => {
  return (
    <div className="file-list" style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
      
      {isCreatingFile && !creatingInFolder && (
        <form onSubmit={handleCreateFile} className="new-file-form">
          <input 
            autoFocus 
            type="text" 
            className="new-file-input" 
            value={newFileName} 
            onChange={(e) => setNewFileName(e.target.value)} 
            onBlur={() => {
              if (!newFileName.trim()) {
                setIsCreatingFile(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsCreatingFile(false);
                setNewFileName('');
              }
            }}
            placeholder="filename.py"
            style={{
              width: '100%',
              padding: '6px 8px',
              margin: '8px 0',
              background: '#2d2d30',
              border: '1px solid #00f2ff',
              borderRadius: '3px',
              color: '#fff',
              fontSize: '12px',
              outline: 'none'
            }}
          />
        </form>
      )}

      {isCreatingFolder && (
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (newFolderName.trim()) {
            await handleCreateFolder(newFolderName);
            setIsCreatingFolder(false);
            setNewFolderName('');
          }
        }} className="new-folder-form">
          <input 
            autoFocus 
            type="text" 
            className="new-folder-input" 
            value={newFolderName} 
            onChange={(e) => setNewFolderName(e.target.value)} 
            onBlur={() => {
              if (newFolderName.trim()) {
                handleCreateFolder(newFolderName);
              }
              setIsCreatingFolder(false);
              setNewFolderName('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsCreatingFolder(false);
                setNewFolderName('');
              }
            }}
            placeholder="folder name"
            style={{
              width: '100%',
              padding: '6px 8px',
              margin: '8px 0',
              background: '#2d2d30',
              border: '1px solid #00f2ff',
              borderRadius: '3px',
              color: '#fff',
              fontSize: '12px'
            }}
          />
        </form>
      )}

      {files.length === 0 && !isCreatingFile && (
        <div style={{
          padding: '20px 8px',
          textAlign: 'center',
          color: '#666',
          fontSize: '12px'
        }}>
          <i className="fa-solid fa-folder-open" style={{ display: 'block', marginBottom: '8px', fontSize: '24px' }}></i>
          No files in workspace
        </div>
      )}

      {files
        .filter(file => !file.parentFolder)
        .map(file => {
          const isFolderItem = isFolder(file);
          const isExpanded = expandedFolders.has(file.path);
          const childFiles = files.filter(f => f.parentFolder === file.path);
          
          return (
            <div key={file.path}>
              {renameFile === file.path ? (
                <form onSubmit={(e) => { e.preventDefault(); confirmRename(); }} className="rename-form">
                  <input 
                    autoFocus 
                    className="rename-input" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    onBlur={confirmRename}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: '#2d2d30',
                      border: '1px solid #00f2ff',
                      borderRadius: '3px',
                      color: '#fff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </form>
              ) : (
                <>
                  <div 
                    className="file-item" 
                    onClick={() => {
                      if (isFolderItem) {
                        setExpandedFolders(prev => {
                          const next = new Set(prev);
                          if (next.has(file.path)) {
                            next.delete(file.path);
                          } else {
                            next.add(file.path);
                          }
                          return next;
                        });
                        setSelectedFolder(file.path);
                      } else {
                        setContextMenu(null);
                        handleFileSelect(file);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu({ x: e.clientX, y: e.clientY, file: { ...file, isFolder: isFolderItem } });
                    }}
                    style={{
                      padding: '6px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#ccc',
                      fontSize: '12px',
                      background: selectedFolder === file.path ? '#2d2d30' : 'transparent',
                      borderRadius: '3px',
                      marginBottom: '2px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#2d2d30'}
                    onMouseLeave={(e) => e.currentTarget.style.background = selectedFolder === file.path ? '#2d2d30' : 'transparent'}
                  >
                    {isFolderItem && (
                      <i className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'right'}`} style={{ fontSize: '10px', width: '12px' }}></i>
                    )}
                    {!isFolderItem && <span style={{ width: '12px' }}></span>}
                    <i className={`fa-${isFolderItem ? 'solid fa-folder' : 'regular fa-file-code'}`} style={{ color: isFolderItem ? '#dcb67a' : '#519aba' }}></i>
                    <span>{file.name}</span>
                    {file.isInMemory && <span style={{ fontSize: '9px', color: '#666', marginLeft: 'auto' }}>(memory)</span>}
                  </div>
                  
                  {isFolderItem && isExpanded && creatingInFolder === file.path && (
                    <div style={{ paddingLeft: '32px', marginTop: '4px' }}>
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCreateFile(e);
                        }} 
                        className="new-file-form"
                      >
                        <input 
                          autoFocus 
                          type="text" 
                          className="new-file-input" 
                          value={newFileName} 
                          onChange={(e) => setNewFileName(e.target.value)} 
                          onBlur={() => {
                            if (!newFileName.trim()) {
                              setIsCreatingFile(false);
                              setCreatingInFolder(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setIsCreatingFile(false);
                              setNewFileName('');
                              setCreatingInFolder(null);
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCreateFile(e);
                            }
                          }}
                          placeholder="filename.py"
                          style={{
                            width: 'calc(100% - 16px)',
                            padding: '6px 8px',
                            margin: '4px 0',
                            background: '#2d2d30',
                            border: '1px solid #00f2ff',
                            borderRadius: '3px',
                            color: '#fff',
                            fontSize: '12px',
                            outline: 'none'
                          }}
                        />
                      </form>
                    </div>
                  )}
                  
                  {isFolderItem && isExpanded && childFiles.map(childFile => (
                    <div 
                      key={childFile.path}
                      className="file-item" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileSelect(childFile);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({ x: e.clientX, y: e.clientY, file: { ...childFile, isFolder: false } });
                      }}
                      style={{
                        padding: '6px 8px',
                        paddingLeft: '32px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#ccc',
                        fontSize: '12px',
                        background: 'transparent',
                        borderRadius: '3px',
                        marginBottom: '2px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2d2d30'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <i className="fa-regular fa-file-code" style={{ color: '#519aba' }}></i>
                      <span>{childFile.name}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
    </div>
  );
};
