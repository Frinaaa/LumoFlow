import React, { useState, useEffect } from 'react';
import { FileNode } from '../../types';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { useFileOperations } from '../../hooks/useFileOperations';
import { getFileIcon } from '../../../utils/utils';

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
}

export const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, depth }) => {
  const fileStore = useFileStore();
  const editorStore = useEditorStore();
  const { expandedFolders, toggleFolder, renamingFile, newName, setNewName, setRenamingFile } = fileStore;
  const { openFile, deleteFile, renameFile } = useFileOperations();

  const isExpanded = expandedFolders.has(node.path);
  const isActive = editorStore.activeTabId === node.path;
  const isRenaming = renamingFile === node.path;

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  const paddingLeft = depth * 12 + 10;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.isFolder) {
      toggleFolder(node.path);
      fileStore.setSelectedFolder(node.path); 
    } else {
      openFile(node.path);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleRenameSubmit = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newName.trim()) {
      await renameFile(node.path, newName);
      setRenamingFile(null);
      setNewName('');
    } else if (e.key === 'Escape') {
      setRenamingFile(null);
      setNewName('');
    }
  };

  const handleCreateFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) toggleFolder(node.path);
    fileStore.setCreatingInFolder(node.path);
    fileStore.setIsCreatingFile(true);
  };

  const handleCreateFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) toggleFolder(node.path);
    fileStore.setCreatingInFolder(node.path);
    fileStore.setIsCreatingFolder(true);
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  return (
    <div style={{ position: 'relative' }}>
      <div
        className={`file-item ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {node.isFolder && (
          <i className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ marginRight: '4px', width: '12px', fontSize: '10px', color: '#888' }}></i>
        )}

        <i className={getFileIcon(node.name, node.isFolder)} style={{ marginRight: '6px', width: '16px', fontSize: '14px', color: node.isFolder ? '#dcb67a' : undefined }}></i>

        {isRenaming ? (
          <input
            autoFocus
            className="file-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleRenameSubmit}
            onBlur={() => setRenamingFile(null)}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span>{node.name}</span>
        )}

        {node.isFolder && !isRenaming && (
          <div className="vs-explorer-toolbar" style={{ marginLeft: 'auto' }}>
            <div className="explorer-tool-btn" onClick={handleCreateFile} title="New File"><i className="fa-solid fa-file-circle-plus"></i></div>
            <div className="explorer-tool-btn" onClick={handleCreateFolder} title="New Folder"><i className="fa-solid fa-folder-plus"></i></div>
          </div>
        )}
      </div>

      {node.isFolder && isExpanded && (
        <div className="vs-explorer-tree">
          {/* Sub-item creation */}
          {fileStore.isCreatingFile && fileStore.creatingInFolder === node.path && (
            <NewItemInput type="file" depth={depth + 1} parentPath={node.path} />
          )}
          {fileStore.isCreatingFolder && fileStore.creatingInFolder === node.path && (
            <NewItemInput type="folder" depth={depth + 1} parentPath={node.path} />
          )}

          {node.children && node.children.map(child => (
            <FileTreeItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div className="vs-context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          {node.isFolder && (
            <>
              <div className="context-menu-item" onClick={handleCreateFile}>
                <i className="fa-solid fa-file-circle-plus" style={{ marginRight: '8px', fontSize: '12px' }}></i>
                <span>New File</span>
              </div>
              <div className="context-menu-item" onClick={handleCreateFolder}>
                <i className="fa-solid fa-folder-plus" style={{ marginRight: '8px', fontSize: '12px' }}></i>
                <span>New Folder</span>
              </div>
              <div className="context-menu-divider"></div>
            </>
          )}
          <div className="context-menu-item" onClick={() => { setRenamingFile(node.path); setNewName(node.name); }}>
            <span>Rename</span>
            <span className="shortcut">F2</span>
          </div>
          <div className="context-menu-item" onClick={() => deleteFile(node.path)} style={{ color: '#f14c4c' }}>
            <span>Delete</span>
            <span className="shortcut">Del</span>
          </div>
          <div className="context-menu-divider"></div>
          <div className="context-menu-item" onClick={() => { navigator.clipboard.writeText(node.path); }}>
            <span>Copy Path</span>
            <span className="shortcut">Shift+Alt+C</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal NewItemInput for folders
const NewItemInput = ({ type, depth, parentPath }: { type: 'file' | 'folder', depth: number, parentPath: string }) => {
  const fileStore = useFileStore();
  const { createFile, createFolder } = useFileOperations();
  const [name, setName] = useState('');

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      if (type === 'file') {
        await createFile(name, parentPath);
      } else {
        await createFolder(name, parentPath);
      }
      cleanup();
    } else if (e.key === 'Escape') {
      cleanup();
    }
  };

  const cleanup = () => {
    fileStore.setIsCreatingFile(false);
    fileStore.setIsCreatingFolder(false);
    fileStore.setCreatingInFolder(null);
  };

  return (
    <div style={{ paddingLeft: `${depth * 12 + 10}px`, paddingRight: '10px', height: '22px', display: 'flex', alignItems: 'center' }}>
      <i className={`fa-solid ${type === 'file' ? 'fa-file' : 'fa-folder'}`} style={{ marginRight: '6px', fontSize: '14px', color: type === 'folder' ? '#dcb67a' : undefined }}></i>
      <input
        autoFocus
        className="file-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={cleanup}
      />
    </div>
  );
};
