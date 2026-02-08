import React, { useState, useEffect, useRef } from 'react';
import { useFileStore } from '../stores/fileStore';
import { useFileOperations } from '../hooks/useFileOperations';

interface QuickOpenProps {
  visible: boolean;
  onClose: () => void;
}

export const QuickOpen: React.FC<QuickOpenProps> = ({ visible, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fileStore = useFileStore();
  const fileOps = useFileOperations();

  // Filter files based on query
  const filteredFiles = fileStore.files
    .filter(f => !f.isFolder)
    .filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 20); // Limit to 20 results

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [visible]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredFiles.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredFiles.length) % filteredFiles.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredFiles[selectedIndex]) {
        fileOps.openFile(filteredFiles[selectedIndex].path);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        zIndex: 9998,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '100px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '600px',
          background: '#252526',
          borderRadius: '6px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '500px',
          border: '1px solid #3c3c3c',
        }}
      >
        {/* Input */}
        <div style={{ padding: '12px 15px', borderBottom: '1px solid #3c3c3c' }}>
          <input
            ref={inputRef}
            placeholder="Open file (Ctrl+P)..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              background: '#3c3c3c',
              border: 'none',
              padding: '8px 10px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              borderRadius: '3px',
            }}
          />
        </div>

        {/* Results */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            maxHeight: '400px',
          }}
        >
          {filteredFiles.length === 0 ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: '#888',
                fontSize: '13px',
              }}
            >
              {query ? 'No files found' : 'Start typing to search files'}
            </div>
          ) : (
            filteredFiles.map((file, idx) => (
              <div
                key={file.path}
                onClick={() => {
                  fileOps.openFile(file.path);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  padding: '10px 15px',
                  color: idx === selectedIndex ? '#fff' : '#ccc',
                  background: idx === selectedIndex ? '#7c328eff' : 'transparent',
                  cursor: 'pointer',
                  borderBottom: '1px solid #3c3c3c',
                  transition: 'background 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <i
                  className="fa-regular fa-file"
                  style={{
                    fontSize: '12px',
                    color: '#888',
                    width: '16px',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px' }}>{file.name}</div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#888',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.path}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
