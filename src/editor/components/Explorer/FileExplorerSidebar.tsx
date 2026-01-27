import React, { useState } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { useFileOperations } from '../../hooks/useFileOperations';
import { buildFolderTree, getFileIcon } from '../../../utils/utils';
import { FileTreeItem } from './FileTreeItem';
import '../../styles/Explorer.css';

export const FileExplorerSidebar = () => {
  const fileStore = useFileStore();
  const editorStore = useEditorStore();
  const { files, workspaceName, collapseAllFolders } = fileStore;
  const { refreshFiles } = useFileOperations();
  const [isSectionExpanded, setIsSectionExpanded] = useState(true);
  const [isOpenEditorsExpanded, setIsOpenEditorsExpanded] = useState(true);

  // Transform flat list to tree structure
  const tree = React.useMemo(() => {
    if (!files || files.length === 0) return [];
    return buildFolderTree(files as any);
  }, [files]);

  const handleCreateFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileStore.setCreatingInFolder(null); // Create at root
    fileStore.setIsCreatingFile(true);
  };

  const handleCreateFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileStore.setCreatingInFolder(null); // Create at root
    fileStore.setIsCreatingFolder(true);
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    refreshFiles();
  };

  const handleCollapseAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    collapseAllFolders();
  };

  return (
    <div className="vs-explorer-container">
      {/* Header */}
      <div className="vs-explorer-header">
        <span className="vs-explorer-title">EXPLORER</span>
        <div className="vs-explorer-toolbar">
          <div className="explorer-tool-btn" onClick={handleRefresh} title="Refresh Explorer">
            <i className="fa-solid fa-rotate-right"></i>
          </div>
          <div className="explorer-tool-btn" onClick={handleCollapseAll} title="Collapse All Folders">
            <i className="fa-solid fa-layer-group"></i>
          </div>
        </div>
      </div>

      {/* Open Editors Section */}
      <div className="vs-explorer-section">
        <div
          className="vs-explorer-section-header"
          onClick={() => setIsOpenEditorsExpanded(!isOpenEditorsExpanded)}
        >
          <i className={`fa-solid ${isOpenEditorsExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
          <span>OPEN EDITORS</span>
          <div className="vs-explorer-toolbar" style={{ marginLeft: 'auto', opacity: 1 }}>
            <div className="explorer-tool-btn" onClick={(e) => { e.stopPropagation(); editorStore.tabs.forEach(t => editorStore.removeTab(t.id)); }} title="Close All Editors">
              <i className="fa-solid fa-clone" style={{ transform: 'rotate(90deg)' }}></i>
            </div>
          </div>
        </div>

        {isOpenEditorsExpanded && (
          <div style={{ padding: '2px 0' }}>
            {editorStore.tabs.map(tab => (
              <div
                key={tab.id}
                className={`file-item ${editorStore.activeTabId === tab.id ? 'active' : ''}`}
                style={{ paddingLeft: '20px' }}
                onClick={() => editorStore.setActiveTab(tab.id)}
              >
                <i className={getFileIcon(tab.fileName, false)} style={{ marginRight: '6px', fontSize: '14px' }}></i>
                <span>{tab.fileName}</span>
                <div className="vs-explorer-toolbar" style={{ marginLeft: 'auto' }}>
                  <div className="explorer-tool-btn" onClick={(e) => { e.stopPropagation(); editorStore.removeTab(tab.id); }}>
                    <i className="fa-solid fa-xmark"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workspace Section */}
      <div className="vs-explorer-section" style={{ borderTop: '1px solid #1e1e1e' }}>
        <div
          className="vs-explorer-section-header"
          onClick={() => setIsSectionExpanded(!isSectionExpanded)}
        >
          <i className={`fa-solid ${isSectionExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
          <span style={{ textTransform: 'uppercase' }}>{workspaceName || (editorStore.workspaceStatus === 'Folder Opened' ? 'WORKSPACE' : 'NO FOLDER OPENED')}</span>
          <div className="vs-explorer-toolbar" style={{ marginLeft: 'auto', opacity: 1 }}>
            <div className="explorer-tool-btn" onClick={handleCreateFile} title="New File">
              <i className="fa-solid fa-file-circle-plus"></i>
            </div>
            <div className="explorer-tool-btn" onClick={handleCreateFolder} title="New Folder">
              <i className="fa-solid fa-folder-plus"></i>
            </div>
          </div>
        </div>

        {isSectionExpanded && (
          <div className="vs-explorer-tree" style={{ padding: '4px 0' }}>
            {/* In-place creation at root */}
            {fileStore.isCreatingFile && !fileStore.creatingInFolder && (
              <NewItemInput type="file" depth={1} />
            )}
            {fileStore.isCreatingFolder && !fileStore.creatingInFolder && (
              <NewItemInput type="folder" depth={1} />
            )}

            {tree.length === 0 && !fileStore.isCreatingFile && !fileStore.isCreatingFolder ? (
              <div style={{ padding: '20px 10px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
                <i className="fa-solid fa-folder-open" style={{ display: 'block', marginBottom: '8px', fontSize: '24px' }}></i>
                {workspaceName ? 'This folder is empty' : 'No folder opened'}
              </div>
            ) : (
              tree.map(node => (
                <FileTreeItem key={node.path} node={node} depth={1} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Internal component for creating new items
const NewItemInput = ({ type, depth }: { type: 'file' | 'folder', depth: number }) => {
  const fileStore = useFileStore();
  const { createFile, createFolder } = useFileOperations();
  const [name, setName] = useState('');

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      if (type === 'file') {
        await createFile(name, fileStore.creatingInFolder || '');
      } else {
        await createFolder(name, fileStore.creatingInFolder || '');
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
      <i className={`fa-solid ${type === 'file' ? 'fa-file' : 'fa-folder'}`} style={{ marginRight: '6px', fontSize: '14px' }}></i>
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

export default FileExplorerSidebar;
