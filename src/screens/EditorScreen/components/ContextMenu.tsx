import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  file: any;
  onClose: () => void;
  onNewFileInFolder?: () => void;
  onRename: () => void;
  onCut: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  file,
  onClose,
  onNewFileInFolder,
  onRename,
  onCut,
  onCopy,
  onDelete
}) => {
  const isFolder = file?.isFolder || file?.path?.endsWith('/') || file?.path?.endsWith('\\');

  return (
    <div 
      className="context-menu" 
      style={{ top: y, left: x }} 
      onMouseLeave={onClose}
    >
      {isFolder && onNewFileInFolder && (
        <>
          <div className="context-item" onClick={onNewFileInFolder}>
            <i className="fa-solid fa-file-plus"></i> New File in Folder
          </div>
          <div className="context-divider"></div>
        </>
      )}
      <div className="context-item" onClick={onRename}>
        <i className="fa-solid fa-pen"></i> Rename
      </div>
      <div className="context-item" onClick={onCut}>
        <i className="fa-solid fa-scissors"></i> Cut
      </div>
      <div className="context-item" onClick={onCopy}>
        <i className="fa-solid fa-copy"></i> Copy
      </div>
      <div className="context-divider"></div>
      <div className="context-item delete" onClick={onDelete}>
        <i className="fa-solid fa-trash"></i> Delete
      </div>
    </div>
  );
};
