import React from 'react';
import { useGitStore } from '../../stores/gitStore';
import { useEditorStore } from '../../stores/editorStore';

export const StatusBar = () => {
  const { branch, isRepo } = useGitStore();
  const { activeTabId, tabs } = useEditorStore();
  
  const activeTab = tabs.find(t => t.id === activeTabId);
  const cursorPosition = activeTab?.cursorPosition || { line: 1, column: 1 };

  return (
    <div
      style={{
        height: '22px',
        background: '#007acc',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        fontSize: '12px',
        justifyContent: 'space-between',
        borderTop: '1px solid #333',
      }}
    >
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        {isRepo && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-code-branch"></i> {branch}
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <i className="fa-regular fa-circle-xmark"></i> 0 Errors
        </span>
      </div>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
        <span>UTF-8</span>
        <span>{activeTab?.language.toUpperCase() || 'TEXT'}</span>
      </div>
    </div>
  );
};
