import React, { useState } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { useGitStore } from '../../stores/gitStore';
import { useFileOperations } from '../../hooks/useFileOperations';
import { buildFolderTree, getFileIcon } from '../../../utils/utils';
import { FileTreeItem } from './FileTreeItem';
import '../../styles/Explorer.css';

export const FileExplorerSidebar = () => {
  const fileStore = useFileStore();
  const editorStore = useEditorStore();
  const gitStore = useGitStore(); // Assuming gitStore is available
  const { files, workspaceName, collapseAllFolders } = fileStore;
  const { refreshFiles } = useFileOperations();
  const [isSectionExpanded, setIsSectionExpanded] = useState(true);
  const [isOpenEditorsExpanded, setIsOpenEditorsExpanded] = useState(true);
  const [isOutlineExpanded, setIsOutlineExpanded] = useState(true);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);

  const activeTab = editorStore.tabs.find(t => t.id === editorStore.activeTabId);

  // --- PARSE OUTLINE ---
  const outlineData = React.useMemo(() => {
    if (!activeTab) return [];

    // Simple regex-based parsing
    const lines = activeTab.content.split('\n');
    const symbols: { name: string; kind: string; line: number; icon: string }[] = [];

    lines.forEach((text, i) => {
      const lineNum = i + 1;
      const t = text.trim();

      // Classes
      if (t.match(/^export\s+class\s+(\w+)/) || t.match(/^class\s+(\w+)/)) {
        symbols.push({ name: RegExp.$1, kind: 'class', line: lineNum, icon: 'fa-cube' });
      }
      // Interfaces
      else if (t.match(/^export\s+interface\s+(\w+)/) || t.match(/^interface\s+(\w+)/)) {
        symbols.push({ name: RegExp.$1, kind: 'interface', line: lineNum, icon: 'fa-plug' });
      }
      // Functions (function tag)
      else if (t.match(/^export\s+function\s+(\w+)/) || t.match(/^function\s+(\w+)/)) {
        symbols.push({ name: RegExp.$1, kind: 'function', line: lineNum, icon: 'fa-cube' });
      }
      // React Components / Arrow Functions (const X = ...)
      else if (t.match(/^export\s+const\s+(\w+)\s*:\s*React\.FC/) || t.match(/^const\s+(\w+)\s*:\s*React\.FC/)) {
        symbols.push({ name: RegExp.$1, kind: 'component', line: lineNum, icon: 'fa-brands fa-react' });
      }
      // Variables containing function definitions
      else if (t.match(/^const\s+(\w+)\s*=\s*(\(|async)/) || t.match(/^export\s+const\s+(\w+)\s*=\s*(\(|async)/)) {
        symbols.push({ name: RegExp.$1, kind: 'function', line: lineNum, icon: 'fa-cube' });
      }
      // CSS Rules (basic)
      else if (activeTab.fileName.endsWith('.css') && t.match(/^([.#][\w-]+)\s*\{/)) {
        symbols.push({ name: RegExp.$1, kind: 'class', line: lineNum, icon: 'fa-hashtag' });
      }
    });

    return symbols;
  }, [activeTab?.content, activeTab?.fileName]);

  const handleNavigate = (line: number) => {
    window.dispatchEvent(new CustomEvent('monaco-cmd', {
      detail: { action: 'revealLine', value: line }
    }));
  };

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

      {/* Workspace Section - Grows to push others down */}
      <div className="vs-explorer-section" style={{ borderTop: '1px solid #1e1e1e', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          className="vs-explorer-section-header"
          onClick={() => setIsSectionExpanded(!isSectionExpanded)}
        >
          <i className={`fa-solid ${isSectionExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
          <span style={{ textTransform: 'uppercase' }}>{workspaceName || 'NO FOLDER OPENED'}</span>
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
          <div className="vs-explorer-tree" style={{ padding: '4px 0', flex: 1, overflowY: 'auto' }}>
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

      {/* OUTLINE SECTION */}
      <div className="vs-explorer-section" style={{ borderTop: '1px solid #1e1e1e' }}>
        <div className="vs-explorer-section-header" onClick={() => setIsOutlineExpanded(!isOutlineExpanded)}>
          <i className={`fa-solid ${isOutlineExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
          <span>OUTLINE</span>
        </div>
        {isOutlineExpanded && (
          <div style={{ padding: '0', maxHeight: '200px', overflowY: 'auto' }}>
            {!activeTab ? (
              <div style={{ padding: '10px 20px', color: '#666', fontSize: '11px', fontStyle: 'italic' }}>
                No active editor
              </div>
            ) : outlineData.length === 0 ? (
              <div style={{ padding: '10px 20px', color: '#666', fontSize: '11px', fontStyle: 'italic' }}>
                No symbols found
              </div>
            ) : (
              <div className="outline-list">
                {outlineData.map((item, idx) => (
                  <div
                    key={idx}
                    className="file-item"
                    style={{ paddingLeft: '20px', fontSize: '12px' }}
                    onClick={() => handleNavigate(item.line)}
                  >
                    <i className={`fa-solid ${item.icon}`} style={{ fontSize: '10px', width: '16px', color: item.kind === 'class' ? '#4ec9b0' : '#dcdcaa' }}></i>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TIMELINE SECTION */}
      <div className="vs-explorer-section" style={{ borderTop: '1px solid #1e1e1e' }}>
        <div className="vs-explorer-section-header" onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}>
          <i className={`fa-solid ${isTimelineExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
          <span>TIMELINE</span>
        </div>
        {isTimelineExpanded && (
          <div style={{ padding: '10px 0', maxHeight: '200px', overflowY: 'auto' }}>
            {!activeTab ? (
              <div style={{ padding: '0 20px', color: '#888', fontSize: '11px' }}>No active file</div>
            ) : (
              <div className="timeline-list" style={{ paddingLeft: '10px' }}>
                {/* Current State */}
                <div className="timeline-item" style={{ display: 'flex', gap: '10px', marginBottom: '15px', position: 'relative' }}>
                  {/* Timeline Line */}
                  <div style={{ position: 'absolute', left: '7px', top: '16px', bottom: '-20px', width: '1px', background: '#333' }}></div>

                  <div className="timeline-dot" style={{
                    width: '14px', height: '14px', borderRadius: '50%',
                    background: activeTab.isDirty ? '#e2c08d' : '#73c991',
                    border: '2px solid #252526', zIndex: 1
                  }}></div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', color: '#fff', fontWeight: '500' }}>Current State</span>
                    <span style={{ fontSize: '11px', color: activeTab.isDirty ? '#e2c08d' : '#888' }}>
                      {activeTab.isDirty ? 'Unsaved changes' : 'Saved locally'}
                    </span>
                    <span style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>Just now</span>
                  </div>
                </div>

                {/* Git / History State */}
                {gitStore.isRepo && gitStore.changes.some(c => c.file.includes(activeTab.fileName)) ? (
                  <div className="timeline-item" style={{ display: 'flex', gap: '10px', marginBottom: '15px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '7px', top: '16px', bottom: '-20px', width: '1px', background: '#333' }}></div>
                    <div className="timeline-dot" style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ff0055', border: '2px solid #252526', zIndex: 1 }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12px', color: '#ccc' }}>Working Tree</span>
                      <span style={{ fontSize: '11px', color: '#888' }}>Modified</span>
                      <span style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>Pending Commit</span>
                    </div>
                  </div>
                ) : null}

                {/* Baseline */}
                <div className="timeline-item" style={{ display: 'flex', gap: '10px', position: 'relative' }}>
                  <div className="timeline-dot" style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#444', border: '2px solid #252526', zIndex: 1 }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>File Created</span>
                    <span style={{ fontSize: '11px', color: '#555' }}>Original Version</span>
                  </div>
                </div>
              </div>
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
