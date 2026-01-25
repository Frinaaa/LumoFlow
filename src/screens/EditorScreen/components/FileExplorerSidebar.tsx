import React from 'react';
import { FileItem, ClipboardState } from '../types';
import { isFolder } from '../utils';

interface FileExplorerSidebarProps {
  files: FileItem[];
  workspaceFolderName?: string;
  workspaceFolderPath?: string;
  onCloseWorkspace?: () => void;
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
  onFileDrop?: (draggedFile: FileItem, targetFolder: FileItem | null) => void;
}

export const FileExplorerSidebar: React.FC<FileExplorerSidebarProps> = ({
  files,
  workspaceFolderName,
  workspaceFolderPath,
  onCloseWorkspace,
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
  confirmRename,
  onFileDrop
}) => {
  const [draggedFile, setDraggedFile] = React.useState<FileItem | null>(null);
  const [dropTarget, setDropTarget] = React.useState<string | null>(null);
  const [workspaceContextMenu, setWorkspaceContextMenu] = React.useState<{ x: number; y: number } | null>(null);
  const [workspaceExpanded, setWorkspaceExpanded] = React.useState(true);

  // Helper function to get file icon based on extension
  const getFileIcon = (fileName: string, isFolder: boolean) => {
    if (isFolder) {
      return { icon: 'fa-solid fa-folder', color: '#dcb67a' };
    }
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: { icon: string; color: string } } = {
      'js': { icon: 'fa-brands fa-js', color: '#f7df1e' },
      'jsx': { icon: 'fa-brands fa-react', color: '#61dafb' },
      'ts': { icon: 'fa-brands fa-js', color: '#3178c6' },
      'tsx': { icon: 'fa-brands fa-react', color: '#61dafb' },
      'py': { icon: 'fa-brands fa-python', color: '#3776ab' },
      'java': { icon: 'fa-brands fa-java', color: '#007396' },
      'html': { icon: 'fa-brands fa-html5', color: '#e34c26' },
      'css': { icon: 'fa-brands fa-css3-alt', color: '#1572b6' },
      'json': { icon: 'fa-solid fa-brackets-curly', color: '#f7df1e' },
      'md': { icon: 'fa-brands fa-markdown', color: '#519aba' },
      'txt': { icon: 'fa-regular fa-file-lines', color: '#858585' },
      'pdf': { icon: 'fa-regular fa-file-pdf', color: '#e51400' },
      'png': { icon: 'fa-regular fa-file-image', color: '#4ec9b0' },
      'jpg': { icon: 'fa-regular fa-file-image', color: '#4ec9b0' },
      'gif': { icon: 'fa-regular fa-file-image', color: '#4ec9b0' },
      'svg': { icon: 'fa-regular fa-file-image', color: '#4ec9b0' },
      'zip': { icon: 'fa-regular fa-file-zipper', color: '#858585' },
      'xml': { icon: 'fa-regular fa-file-code', color: '#519aba' },
      'yml': { icon: 'fa-regular fa-file-code', color: '#519aba' },
      'yaml': { icon: 'fa-regular fa-file-code', color: '#519aba' },
    };
    
    return iconMap[ext || ''] || { icon: 'fa-regular fa-file', color: '#858585' };
  };

  const handleDragStart = (e: React.DragEvent, file: FileItem) => {
    setDraggedFile(file);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.path);
    
    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      padding: 8px 12px;
      background: var(--accent-primary);
      color: white;
      border-radius: 4px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    dragImage.textContent = `📄 ${file.name}`;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: React.DragEvent, file: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFolder(file) && draggedFile && draggedFile.path !== file.path) {
      e.dataTransfer.dropEffect = 'move';
      setDropTarget(file.path);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetFile: FileItem | null) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedFile && onFileDrop) {
      onFileDrop(draggedFile, targetFile);
    }
    
    setDraggedFile(null);
    setDropTarget(null);
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileItem, isFolderItem: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate position to ensure menu stays within viewport
    const menuWidth = 180;
    const menuHeight = 250; // Approximate height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = e.clientX;
    let y = e.clientY;
    
    // Adjust X position if menu would go off right edge
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }
    
    // Adjust Y position if menu would go off bottom edge
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }
    
    setContextMenu({ x, y, file: { ...file, isFolder: isFolderItem } });
  };
  
  return (
    <div 
      className="file-list" 
      style={{ flex: 1, overflow: 'auto', padding: '8px' }}
      onDragOver={(e) => {
        e.preventDefault();
        if (draggedFile) {
          e.dataTransfer.dropEffect = 'move';
          setDropTarget('root');
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) {
          setDropTarget(null);
        }
      }}
      onDrop={(e) => handleDrop(e, null)}
      onClick={() => setWorkspaceContextMenu(null)}
    >
      
      {/* Workspace Folder Header */}
      {workspaceFolderName && (
        <div
          onClick={() => setWorkspaceExpanded(!workspaceExpanded)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const menuWidth = 200;
            const menuHeight = 100;
            let x = e.clientX;
            let y = e.clientY;
            
            if (x + menuWidth > window.innerWidth) {
              x = window.innerWidth - menuWidth - 10;
            }
            if (y + menuHeight > window.innerHeight) {
              y = window.innerHeight - menuHeight - 10;
            }
            
            setWorkspaceContextMenu({ x, y });
          }}
          style={{
            padding: '8px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 600,
            background: 'transparent',
            borderRadius: '4px',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'background 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          title={workspaceFolderPath}
        >
          <i 
            className={`fa-solid fa-chevron-${workspaceExpanded ? 'down' : 'right'}`} 
            style={{ 
              fontSize: '10px', 
              width: '12px', 
              color: 'var(--text-muted)',
              transition: 'transform 0.2s'
            }}
          ></i>
          <i className="fa-solid fa-folder-open" style={{ color: '#dcb67a', fontSize: '16px' }}></i>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {workspaceFolderName.toUpperCase()}
          </span>
        </div>
      )}
      
      {/* Workspace Context Menu */}
      {workspaceContextMenu && (
        <div
          style={{
            position: 'fixed',
            left: workspaceContextMenu.x,
            top: workspaceContextMenu.y,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
            minWidth: '200px',
            padding: '4px 0',
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '13px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={() => {
              setExpandedFolders(new Set());
              setWorkspaceContextMenu(null);
            }}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--text-secondary)',
              transition: 'background 0.1s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <i className="fa-solid fa-compress" style={{ width: '16px', fontSize: '14px', color: 'var(--text-muted)' }}></i>
            <span>Collapse All</span>
          </div>

          <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }}></div>
          
          <div
            onClick={() => {
              onCloseWorkspace();
              setWorkspaceContextMenu(null);
            }}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--text-secondary)',
              transition: 'background 0.1s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <i className="fa-solid fa-folder-minus" style={{ width: '16px', fontSize: '14px', color: 'var(--text-muted)' }}></i>
            <span>Close Folder</span>
          </div>
          
          <div
            onClick={() => {
              // Copy path to clipboard
              navigator.clipboard.writeText(workspaceFolderPath);
              setWorkspaceContextMenu(null);
            }}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--text-secondary)',
              transition: 'background 0.1s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <i className="fa-solid fa-copy" style={{ width: '16px', fontSize: '14px', color: 'var(--text-muted)' }}></i>
            <span>Copy Path</span>
          </div>
        </div>
      )}
      
      {isCreatingFile && !creatingInFolder && workspaceExpanded && (
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
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--accent-primary)',
              borderRadius: '3px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none'
            }}
          />
        </form>
      )}

      {isCreatingFolder && workspaceExpanded && (
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

      {files.length === 0 && !isCreatingFile && workspaceExpanded && (
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

      {workspaceExpanded && files
        .filter(file => !file.parentFolder)
        .map(file => {
          const isFolderItem = isFolder(file);
          const isExpanded = expandedFolders.has(file.path);
          const childFiles = files.filter(f => f.parentFolder === file.path);
          const fileIcon = getFileIcon(file.name, isFolderItem);
          
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
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--accent-primary)',
                      borderRadius: '3px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </form>
              ) : (
                <>
                  <div 
                    className="file-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, file)}
                    onDragOver={(e) => isFolderItem && handleDragOver(e, file)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => isFolderItem && handleDrop(e, file)}
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
                    onContextMenu={(e) => handleContextMenu(e, file, isFolderItem)}
                    style={{
                      padding: '4px 8px',
                      cursor: isFolderItem ? 'pointer' : (draggedFile ? 'grabbing' : 'grab'),
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      background: dropTarget === file.path ? 'rgba(0, 242, 255, 0.1)' : (selectedFolder === file.path ? 'var(--bg-hover)' : 'transparent'),
                      borderRadius: '3px',
                      marginBottom: '1px',
                      opacity: draggedFile?.path === file.path ? 0.5 : 1,
                      border: dropTarget === file.path ? '1px dashed var(--accent-primary)' : '1px solid transparent',
                      transition: 'all 0.15s',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!draggedFile) {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!draggedFile) {
                        e.currentTarget.style.background = selectedFolder === file.path ? 'var(--bg-hover)' : 'transparent';
                      }
                    }}
                  >
                    {isFolderItem ? (
                      <i 
                        className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'right'}`} 
                        style={{ 
                          fontSize: '10px', 
                          width: '12px', 
                          color: 'var(--text-muted)',
                          transition: 'transform 0.2s'
                        }}
                      ></i>
                    ) : (
                      <span style={{ width: '12px' }}></span>
                    )}
                    <i className={fileIcon.icon} style={{ color: fileIcon.color, fontSize: '14px', width: '16px', textAlign: 'center' }}></i>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                    {file.isInMemory && <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: 'auto' }}>(memory)</span>}
                  </div>
                  
                  {isFolderItem && isExpanded && creatingInFolder === file.path && (
                    <div style={{ paddingLeft: '28px', marginTop: '2px', marginBottom: '2px' }}>
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
                            width: 'calc(100% - 8px)',
                            padding: '4px 8px',
                            margin: '2px 0',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--accent-primary)',
                            borderRadius: '3px',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                      </form>
                    </div>
                  )}
                  
                  {isFolderItem && isExpanded && childFiles.map(childFile => {
                    const childIcon = getFileIcon(childFile.name, false);
                    return (
                      <div 
                        key={childFile.path}
                        className="file-item"
                        draggable
                        onDragStart={(e) => handleDragStart(e, childFile)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileSelect(childFile);
                        }}
                        onContextMenu={(e) => handleContextMenu(e, childFile, false)}
                        style={{
                          padding: '4px 8px',
                          paddingLeft: '28px',
                          cursor: draggedFile ? 'grabbing' : 'grab',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--text-secondary)',
                          fontSize: '13px',
                          background: 'transparent',
                          borderRadius: '3px',
                          marginBottom: '1px',
                          opacity: draggedFile?.path === childFile.path ? 0.5 : 1,
                          transition: 'all 0.15s',
                          userSelect: 'none'
                        }}
                        onMouseEnter={(e) => !draggedFile && (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={(e) => !draggedFile && (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ width: '12px' }}></span>
                        <i className={childIcon.icon} style={{ color: childIcon.color, fontSize: '14px', width: '16px', textAlign: 'center' }}></i>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{childFile.name}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
    </div>
  );
};
