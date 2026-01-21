import React from 'react';
import { FileItem } from '../types';

interface SearchSidebarProps {
  searchQuery: string;
  searchResults: FileItem[];
  onSearch: (query: string) => void;
  onFileSelect: (file: FileItem) => void;
}

export const SearchSidebar: React.FC<SearchSidebarProps> = ({
  searchQuery,
  searchResults,
  onSearch,
  onFileSelect
}) => {
  return (
    <div className="search-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sidebar-header">SEARCH</div>
      <input 
        className="search-input" 
        placeholder="Search files..." 
        value={searchQuery} 
        onChange={(e) => onSearch(e.target.value)} 
        autoFocus
        style={{
          padding: '8px 12px',
          margin: '10px',
          background: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '4px',
          color: '#fff',
          fontSize: '13px'
        }}
      />
      <div className="search-results" style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
        {searchResults.length === 0 && searchQuery && (
          <div style={{ color: '#666', fontSize: '12px', padding: '20px', textAlign: 'center' }}>
            No files found
          </div>
        )}
        {searchResults.map(f => (
          <div 
            key={f.path} 
            className="search-result-item" 
            onClick={() => onFileSelect(f)}
            style={{
              padding: '8px 12px',
              background: '#1e1e1e',
              borderRadius: '4px',
              marginBottom: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ccc',
              fontSize: '12px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2d2d30'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#1e1e1e'}
          >
            <i className="fa-regular fa-file-code"></i> {f.name}
          </div>
        ))}
      </div>
    </div>
  );
};
