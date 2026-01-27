import React from 'react';
import { FileNode } from '../../types';
import { useFileStore } from '../../stores/fileStore';
import { useFileOperations } from '../../hooks/useFileOperations';
import { getFileIcon } from '../../../utils/utils';

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
}

export const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, depth }) => {
  const { expandedFolders, toggleFolder, selectedFolder } = useFileStore();
  const { openFile } = useFileOperations();
  
  const isExpanded = expandedFolders.has(node.path);
  const paddingLeft = depth * 12 + 10;
  
  const handleClick = () => {
    if (node.isFolder) {
      toggleFolder(node.path);
    } else {
      openFile(node.path);
    }
  };

  return (
    <div>
      <div
        className={`file-item ${selectedFolder === node.path ? 'selected' : ''}`}
        style={{
          paddingLeft: `${paddingLeft}px`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          height: '22px',
          userSelect: 'none',
        }}
        onClick={handleClick}
      >
        {node.isFolder && (
          <i
            className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`}
            style={{
              marginRight: '4px',
              width: '12px',
              fontSize: '10px',
              color: '#888',
            }}
          ></i>
        )}
        <i
          className={getFileIcon(node.name, node.isFolder)}
          style={{
            marginRight: '6px',
            width: '16px',
            fontSize: '14px',
          }}
        ></i>
        <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {node.name}
        </span>
      </div>
      {node.isFolder && isExpanded && node.children && (
        <div>
          {node.children.map(child => (
            <FileTreeItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
