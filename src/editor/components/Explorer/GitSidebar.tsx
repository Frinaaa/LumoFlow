import React, { useEffect, useState } from 'react';
import { useGitStore } from '../../stores/gitStore';

interface GitChange {
  file: string;
  status: string; // 'M', 'A', 'D', '??', etc.
}

export const GitSidebar: React.FC = () => {
  const { branch, changes, isRepo, loading, setGitStatus, setLoading } = useGitStore();
  const [commitMsg, setCommitMsg] = useState('');
  const [stagedFiles, setStagedFiles] = useState<Set<string>>(new Set());

  const fetchStatus = async () => {
    try {
      if (!(window as any).api?.gitStatus) return;
      const res = await (window as any).api.gitStatus();
      if (res.success && res.changes) {
        setGitStatus({
          branch: res.branch || branch,
          changes: res.changes,
          isRepo: true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch git status:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStageFile = async (file: string) => {
    try {
      if (!(window as any).api?.gitAdd) return;
      setLoading(true);
      const res = await (window as any).api.gitAdd({ files: [file] });
      if (res.success) {
        setStagedFiles(prev => new Set([...prev, file]));
        await fetchStatus();
      }
    } catch (error) {
      console.error('Failed to stage file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstageFile = async (file: string) => {
    try {
      if (!(window as any).api?.executeCommand) return;
      setLoading(true);
      await (window as any).api.executeCommand(`git reset HEAD ${file}`);
      setStagedFiles(prev => {
        const next = new Set(prev);
        next.delete(file);
        return next;
      });
      await fetchStatus();
    } catch (error) {
      console.error('Failed to unstage file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMsg.trim()) return;
    try {
      if (!(window as any).api?.gitCommit) return;
      setLoading(true);
      const res = await (window as any).api.gitCommit({ message: commitMsg });
      if (res.success) {
        setCommitMsg('');
        setStagedFiles(new Set());
        await fetchStatus();
      }
    } catch (error) {
      console.error('Failed to commit:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'M':
        return { icon: '●', color: '#f0ad4e', label: 'Modified' };
      case 'A':
        return { icon: '●', color: '#5cb85c', label: 'Added' };
      case 'D':
        return { icon: '●', color: '#d9534f', label: 'Deleted' };
      case '??':
        return { icon: '●', color: '#5bc0de', label: 'Untracked' };
      default:
        return { icon: '●', color: '#999', label: status };
    }
  };

  return (
    <div
      className="git-sidebar"
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
        SOURCE CONTROL
      </div>

      {/* Branch Info */}
      {isRepo && (
        <div
          style={{
            padding: '8px 12px',
            background: '#252526',
            borderBottom: '1px solid #3c3c3c',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <i className="fa-solid fa-code-branch" style={{ fontSize: '12px', color: '#00f2ff' }} />
          <span>{branch}</span>
        </div>
      )}

      {/* Commit Section */}
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #3c3c3c',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <textarea
          value={commitMsg}
          onChange={e => setCommitMsg(e.target.value)}
          placeholder="Message (Ctrl+Enter to commit)"
          style={{
            width: '100%',
            padding: '8px',
            background: '#3c3c3c',
            border: '1px solid #555',
            borderRadius: '3px',
            color: '#ccc',
            fontSize: '12px',
            fontFamily: 'monospace',
            resize: 'vertical',
            minHeight: '60px',
            outline: 'none',
          }}
          onKeyDown={e => {
            if (e.ctrlKey && e.key === 'Enter') {
              handleCommit();
            }
          }}
        />
        <button
          onClick={handleCommit}
          disabled={loading || !commitMsg.trim() || stagedFiles.size === 0}
          style={{
            padding: '6px 12px',
            background: stagedFiles.size > 0 ? '#0e639c' : '#555',
            border: 'none',
            borderRadius: '3px',
            color: '#fff',
            cursor: stagedFiles.size > 0 ? 'pointer' : 'not-allowed',
            fontSize: '12px',
            fontWeight: 500,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Committing...' : `Commit (${stagedFiles.size})`}
        </button>
      </div>

      {/* Changes List */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 0',
        }}
      >
        {changes.length === 0 ? (
          <div
            style={{
              padding: '20px 12px',
              textAlign: 'center',
              color: '#666',
              fontSize: '12px',
            }}
          >
            <i className="fa-solid fa-check" style={{ display: 'block', marginBottom: '8px', fontSize: '24px' }} />
            No changes
          </div>
        ) : (
          <>
            <div
              style={{
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#888',
                borderBottom: '1px solid #3c3c3c',
              }}
            >
              Changes ({changes.length})
            </div>
            {changes.map((change, idx) => {
              const statusInfo = getStatusIcon(change.status);
              const isStaged = stagedFiles.has(change.file);
              return (
                <div
                  key={idx}
                  style={{
                    padding: '6px 12px',
                    borderBottom: '1px solid #3c3c3c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    background: isStaged ? 'rgba(0, 242, 255, 0.05)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isStaged
                      ? 'rgba(0, 242, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isStaged
                      ? 'rgba(0, 242, 255, 0.05)'
                      : 'transparent';
                  }}
                >
                  <span style={{ color: statusInfo.color, fontSize: '10px', width: '12px' }}>
                    {statusInfo.icon}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {change.file}
                  </span>
                  <span style={{ fontSize: '10px', color: '#888', marginRight: '4px' }}>
                    {statusInfo.label}
                  </span>
                  <button
                    onClick={() => (isStaged ? handleUnstageFile(change.file) : handleStageFile(change.file))}
                    disabled={loading}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#00f2ff',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '2px 4px',
                      opacity: loading ? 0.5 : 1,
                    }}
                    title={isStaged ? 'Unstage' : 'Stage'}
                  >
                    <i className={`fa-solid fa-${isStaged ? 'minus' : 'plus'}`} />
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
