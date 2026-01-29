import React, { useState } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { useFileOperations } from '../../hooks/useFileOperations';

interface SearchResult {
  filePath: string;
  line: number;
  preview: string;
  isNameMatch?: boolean;
}

export const SearchSidebar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const fileStore = useFileStore();
  const editorStore = useEditorStore();
  const fileOps = useFileOperations();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      if (!window.api?.searchFiles) {
        console.error('searchFiles API not available');
        setLoading(false);
        return;
      }
      const res = await window.api.searchFiles({ query, rootPath: fileStore.workspacePath });
      setResults(res || []);
      // Auto-expand all files that have matches
      const allFilePaths = (res || []).map((r: any) => r.filePath);
      setExpandedFiles(new Set(allFilePaths));
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFileExpanded = (filePath: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  };

  // Group results by file
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.filePath]) {
      acc[result.filePath] = [];
    }
    acc[result.filePath].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const fileCount = Object.keys(groupedResults).length;
  const matchCount = results.length;

  return (
    <div
      className="search-sidebar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#1e1e1e',
        color: '#ccc',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #3c3c3c',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          color: '#888',
        }}
      >
        SEARCH
      </div>

      {/* Search Input */}
      <form
        onSubmit={handleSearch}
        style={{
          padding: '12px',
          borderBottom: '1px solid #3c3c3c',
          display: 'flex',
          gap: '8px',
          minWidth: 0,
        }}
      >
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <input
            value={query}
            onChange={e => {
              const val = e.target.value;
              setQuery(val);
              if (val.trim()) {
                window.api.searchFiles({ query: val, rootPath: fileStore.workspacePath || '' })
                  .then((res: any) => {
                    setResults(res || []);
                    const allFilePaths = (res || []).map((r: any) => r.filePath);
                    setExpandedFiles(new Set(allFilePaths));
                  });
              } else {
                setResults([]);
              }
            }}
            placeholder="Search files..."
            style={{
              width: '100%',
              background: '#3c3c3c',
              border: '1px solid #555',
              borderRadius: '3px',
              color: '#ccc',
              padding: '6px 28px 6px 8px',
              fontSize: '12px',
              outline: 'none',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setExpandedFiles(new Set());
              }}
              style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
              }}
              title="Clear search"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#bc13fe',
            border: 'none',
            borderRadius: '3px',
            color: '#fff',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '12px',
            opacity: loading ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          <i className="fa-solid fa-magnifying-glass" />
        </button>
      </form>

      {/* Results */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 0',
        }}
      >
        {loading ? (
          <div
            style={{
              padding: '20px 12px',
              textAlign: 'center',
              color: '#666',
              fontSize: '12px',
            }}
          >
            <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }} />
            Searching...
          </div>
        ) : query && matchCount === 0 ? (
          <div
            style={{
              padding: '20px 12px',
              textAlign: 'center',
              color: '#666',
              fontSize: '12px',
            }}
          >
            <i className="fa-solid fa-magnifying-glass" style={{ display: 'block', marginBottom: '8px', fontSize: '24px' }} />
            No results found
          </div>
        ) : !query ? (
          <div
            style={{
              padding: '20px 12px',
              textAlign: 'center',
              color: '#666',
              fontSize: '12px',
            }}
          >
            <i className="fa-solid fa-magnifying-glass" style={{ display: 'block', marginBottom: '8px', fontSize: '24px' }} />
            Enter a search term
          </div>
        ) : (
          <>
            <div
              style={{
                padding: '8px 12px',
                fontSize: '11px',
                color: '#888',
                borderBottom: '1px solid #3c3c3c',
              }}
            >
              {matchCount} result{matchCount !== 1 ? 's' : ''} in {fileCount} file{fileCount !== 1 ? 's' : ''}
            </div>
            {Object.entries(groupedResults).map(([filePath, fileResults]) => {
              const isExpanded = expandedFiles.has(filePath);
              const fileName = filePath.split(/[\\/]/).pop() || filePath;
              return (
                <div key={filePath}>
                  <div
                    onClick={() => toggleFileExpanded(filePath)}
                    style={{
                      padding: '6px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      background: 'transparent',
                      borderBottom: '1px solid #3c3c3c',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <i
                      className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'right'}`}
                      style={{
                        fontSize: '10px',
                        width: '12px',
                        color: '#888',
                      }}
                    />
                    <i className="fa-regular fa-file" style={{ fontSize: '12px', color: '#888' }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fileName}
                    </span>
                    <span style={{ fontSize: '11px', color: '#888' }}>
                      {fileResults.length}
                    </span>
                  </div>
                  {isExpanded &&
                    fileResults.map((result, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (result.isNameMatch && result.preview.includes('Folder:')) {
                            // Folders are handled by revealing in explorer (not yet implemented fully, but we avoid error)
                            console.log('Folder match clicked:', result.filePath);
                            editorStore.setActiveSidebar('Explorer');
                          } else {
                            fileOps.openFile(result.filePath);
                          }
                        }}
                        style={{
                          padding: '6px 12px 6px 32px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          background: result.isNameMatch ? 'rgba(0, 242, 255, 0.05)' : 'transparent',
                          borderBottom: '1px solid #3c3c3c',
                          transition: 'background 0.1s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(0, 242, 255, 0.1)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = result.isNameMatch ? 'rgba(0, 242, 255, 0.05)' : 'transparent';
                        }}
                      >
                        <span style={{
                          color: result.isNameMatch ? '#00f2ff' : '#888',
                          fontWeight: result.isNameMatch ? '600' : 'normal'
                        }}>
                          {result.isNameMatch ? 'Exact Name Match' : `Line ${result.line}`}
                        </span>
                        <span
                          style={{
                            color: '#ccc',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontFamily: 'monospace',
                            fontSize: result.isNameMatch ? '12px' : '11px'
                          }}
                        >
                          {result.preview}
                        </span>
                      </div>
                    ))}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
