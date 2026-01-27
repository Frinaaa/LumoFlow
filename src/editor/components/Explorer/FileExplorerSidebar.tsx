import React from 'react';
import { FileNode } from '../../types';
import { useFileStore } from '../../stores/fileStore';
import { buildFolderTree } from '../../../utils/utils';
import { FileTreeItem } from './FileTreeItem';

export const FileExplorerSidebar = () => {
  const { files, workspaceName } = useFileStore();

  // Transform flat list to tree structure
  const tree = React.useMemo(() => {
    if (!files || files.length === 0) return [];
    return buildFolderTree(files as any);
  }, [files]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#252526',
        color: '#ccc',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 10px',
          fontSize: '11px',
          fontWeight: 'bold',
          color: '#888',
          textTransform: 'uppercase',
          borderBottom: '1px solid #1e1e1e',
        }}
      >
        EXPLORER
      </div>

      {/* File Tree */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '4px 0',
        }}
      >
        {tree.length === 0 ? (
          <div
            style={{
              padding: '20px 10px',
              textAlign: 'center',
              color: '#666',
              fontSize: '12px',
            }}
          >
            <i
              className="fa-solid fa-folder-open"
              style={{ display: 'block', marginBottom: '8px', fontSize: '24px' }}
            ></i>
            No workspace open
          </div>
        ) : (
          tree.map(node => (
            <FileTreeItem key={node.path} node={node} depth={0} />
          ))
        )}
      </div>
    </div>
  );
};
