import { useEffect, useState } from 'react';
import { EditorState } from '../types';
import { isElectronAvailable } from '../utils';

interface UseAutoSaveProps {
  autoSave: boolean;
  leftEditor: EditorState;
  rightEditor: EditorState;
  activePane: 'left' | 'right';
}

export const useAutoSave = ({ autoSave, leftEditor, rightEditor, activePane }: UseAutoSaveProps) => {
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  useEffect(() => {
    if (!autoSave || !isElectronAvailable()) return;
    
    const autoSaveInterval = setInterval(async () => {
      const currentEditor = activePane === 'left' ? leftEditor : rightEditor;
      if (currentEditor.file && currentEditor.code) {
        try {
          setIsAutoSaving(true);
          
          await window.api.saveFile({ 
            filePath: currentEditor.file, 
            content: currentEditor.code 
          });
          
          const userInfo = localStorage.getItem('user_info');
          if (userInfo) {
            const user = JSON.parse(userInfo);
            await window.api.saveCodeToDatabase({ 
              filePath: currentEditor.file, 
              content: currentEditor.code,
              userId: user._id || user.id
            });
          }
          
          console.log('Auto-saved:', currentEditor.file);
        } catch (error: any) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsAutoSaving(false);
        }
      }
    }, 30000);
    
    return () => clearInterval(autoSaveInterval);
  }, [autoSave, leftEditor, rightEditor, activePane]);

  return { isAutoSaving };
};
