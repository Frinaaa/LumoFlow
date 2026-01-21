import React from 'react';
import { DragType } from '../types';

interface ResizeHandleProps {
  type: 'sidebar' | 'terminal' | 'analysis';
  onMouseDown: (type: DragType) => void;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({ type, onMouseDown }) => {
  const isHorizontal = type === 'terminal';
  
  return (
    <div
      className={`resize-handle resize-handle-${type}`}
      onMouseDown={() => onMouseDown(type)}
      style={{
        position: 'absolute',
        backgroundColor: 'transparent',
        zIndex: 100,
        cursor: isHorizontal ? 'ns-resize' : 'ew-resize',
        ...(isHorizontal ? {
          left: 0,
          right: 0,
          height: '4px',
          top: '-2px',
        } : {
          top: 0,
          bottom: 0,
          width: '4px',
          right: type === 'sidebar' ? '-2px' : 'auto',
          left: type === 'analysis' ? '-2px' : 'auto',
        })
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#007acc';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    />
  );
};
