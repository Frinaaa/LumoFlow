import { useState, useEffect, useCallback } from 'react';
import { DragType } from '../types';

export const useResizing = () => {
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [analysisWidth, setAnalysisWidth] = useState(400);
  const [isDragging, setIsDragging] = useState<DragType>(null);

  const startDragging = useCallback((type: DragType) => {
    setIsDragging(type);
    document.body.style.cursor = type === 'terminal' ? 'ns-resize' : 'ew-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopDragging = useCallback(() => {
    setIsDragging(null);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      if (isDragging === 'sidebar') {
        const newWidth = Math.max(200, Math.min(600, e.clientX - 50));
        setSidebarWidth(newWidth);
      } else if (isDragging === 'terminal') {
        const newHeight = Math.max(100, Math.min(window.innerHeight - 200, window.innerHeight - e.clientY));
        setTerminalHeight(newHeight);
      } else if (isDragging === 'analysis') {
        const newWidth = Math.max(300, Math.min(800, window.innerWidth - e.clientX));
        setAnalysisWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      stopDragging();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, stopDragging]);

  return {
    sidebarWidth,
    terminalHeight,
    analysisWidth,
    isDragging,
    startDragging,
    stopDragging
  };
};
