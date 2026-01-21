import { useEffect } from 'react';
import { EditorState } from '../types';

interface UseKeyboardShortcutsProps {
  handleMenuAction: (action: string) => void;
  showShortcutToast: (message: string) => void;
  leftEditor: EditorState;
  rightEditor: EditorState;
  activePane: 'left' | 'right';
  activeSidebar: string;
  clipboard: any;
}

export const useKeyboardShortcuts = ({
  handleMenuAction,
  showShortcutToast,
  leftEditor,
  rightEditor,
  activePane,
  activeSidebar,
  clipboard
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;

      if (isCtrl) {
        switch(e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            if (e.shiftKey) {
              handleMenuAction('saveAs');
              showShortcutToast('Save As... (Ctrl+Shift+S)');
            } else {
              handleMenuAction('save');
              showShortcutToast('Save (Ctrl+S)');
            }
            break;
          
          case 'n':
            e.preventDefault();
            if (e.shiftKey) {
              handleMenuAction('newWindow');
              showShortcutToast('New Window (Ctrl+Shift+N)');
            } else {
              handleMenuAction('newTextFile');
              showShortcutToast('New Text File (Ctrl+N)');
            }
            break;
            
          case 'o':
            e.preventDefault();
            if (e.shiftKey) {
              handleMenuAction('openFolder');
              showShortcutToast('Open Folder (Ctrl+Shift+O)');
            } else {
              handleMenuAction('openFile');
              showShortcutToast('Open File (Ctrl+O)');
            }
            break;

          case 'k':
            e.preventDefault();
            const handleNextKey = (nextEvent: KeyboardEvent) => {
              if (nextEvent.ctrlKey || nextEvent.metaKey) {
                switch(nextEvent.key.toLowerCase()) {
                  case 's':
                    nextEvent.preventDefault();
                    handleMenuAction('saveAll');
                    break;
                  case 'f':
                    nextEvent.preventDefault();
                    handleMenuAction('closeFolder');
                    break;
                  case 'o':
                    nextEvent.preventDefault();
                    handleMenuAction('openFolder');
                    break;
                }
              }
              window.removeEventListener('keydown', handleNextKey);
            };
            window.addEventListener('keydown', handleNextKey);
            setTimeout(() => {
              window.removeEventListener('keydown', handleNextKey);
            }, 2000);
            break;

          case 'z':
            e.preventDefault();
            if (e.shiftKey) handleMenuAction('redo');
            else handleMenuAction('undo');
            break;

          case 'y':
            e.preventDefault();
            handleMenuAction('redo');
            break;

          case 'x':
            e.preventDefault();
            handleMenuAction('cut');
            break;

          case 'c':
            e.preventDefault();
            handleMenuAction('copy');
            break;

          case 'v':
            if (activeSidebar === 'Explorer' && clipboard) {
              e.preventDefault();
              handleMenuAction('paste');
            }
            break;

          case 'i':
            if (e.shiftKey) {
              e.preventDefault();
              handleMenuAction('toggleDevTools');
              showShortcutToast('Toggle DevTools (Ctrl+Shift+I)');
            }
            break;

          case '\\':
            e.preventDefault();
            handleMenuAction('splitEditor');
            break;
            
          case '`':
            e.preventDefault();
            handleMenuAction('toggleTerminal');
            break;
        }
      }

      if (isAlt) {
        switch(e.key) {
          case 'F4':
            e.preventDefault();
            handleMenuAction('exit');
            break;
        }
      }

      if (isCtrl) {
        switch(e.key) {
          case 'F4':
            e.preventDefault();
            handleMenuAction('closeFile');
            break;
        }
      }

      if (isCtrl && e.altKey && e.key === 'n') {
        e.preventDefault();
        handleMenuAction('newFile');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMenuAction, showShortcutToast, leftEditor, rightEditor, activePane, activeSidebar, clipboard]);
};
