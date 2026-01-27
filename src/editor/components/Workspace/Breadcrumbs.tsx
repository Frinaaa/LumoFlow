import React from 'react';
import { useEditorStore } from '../../stores/editorStore';

interface BreadcrumbsProps {
  filePath: string | null;
  onNavigate?: (path: string) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ filePath, onNavigate }) => {
  if (!filePath) return null;

  // Split path into segments
  const segments = filePath.replace(/\\/g, '/').split('/').filter(Boolean);
  
  // Get file extension for icon
  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      js: 'fa-brands fa-js',
      jsx: 'fa-brands fa-react',
      ts: 'fa-brands fa-js',
      tsx: 'fa-brands fa-react',
      py: 'fa-brands fa-python',
      java: 'fa-brands fa-java',
      html: 'fa-brands fa-html5',
      css: 'fa-brands fa-css3-alt',
      json: 'fa-solid fa-brackets-curly',
      md: 'fa-brands fa-markdown',
      txt: 'fa-solid fa-file-lines',
    };
    return iconMap[ext || ''] || 'fa-solid fa-file-code';
  };

  const fileName = segments[segments.length - 1];
  const folders = segments.slice(0, -1);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: '#2d2d30',
        borderBottom: '1px solid #3c3c3c',
        fontSize: '12px',
        color: '#cccccc',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Workspace Icon */}
      <i className="fa-solid fa-folder" style={{ color: '#888', fontSize: '11px' }}></i>

      {/* Folder Breadcrumbs */}
      {folders.map((folder, index) => {
        const path = segments.slice(0, index + 1).join('/');
        return (
          <React.Fragment key={index}>
            <span
              style={{
                cursor: onNavigate ? 'pointer' : 'default',
                color: '#888',
                transition: 'color 0.2s',
              }}
              onClick={() => onNavigate?.(path)}
              onMouseEnter={(e) => {
                if (onNavigate) e.currentTarget.style.color = '#cccccc';
              }}
              onMouseLeave={(e) => {
                if (onNavigate) e.currentTarget.style.color = '#888';
              }}
            >
              {folder}
            </span>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '9px', color: '#555' }}></i>
          </React.Fragment>
        );
      })}

      {/* File Name with Icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>
        <i className={getFileIcon(fileName)} style={{ fontSize: '11px', color: '#519aba' }}></i>
        <span style={{ fontWeight: 500 }}>{fileName}</span>
      </div>
    </div>
  );
};

export default Breadcrumbs;
