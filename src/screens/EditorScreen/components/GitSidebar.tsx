import React from 'react';
import { GitChange, GitBranch, GitCommit } from '../types';

interface GitSidebarProps {
  gitBranch: string;
  gitChanges: GitChange[];
  gitCommitMessage: string;
  gitBranches: GitBranch[];
  gitCommits: GitCommit[];
  showGitClone: boolean;
  gitCloneUrl: string;
  showBranchCreate: boolean;
  newBranchName: string;
  gitLoading: boolean;
  remoteUrl: string;
  setGitCommitMessage: (value: string) => void;
  setShowGitClone: (value: boolean) => void;
  setGitCloneUrl: (value: string) => void;
  setShowBranchCreate: (value: boolean) => void;
  setNewBranchName: (value: string) => void;
  setRemoteUrl: (value: string) => void;
  onRefresh: () => void;
  onInit: () => void;
  onClone: () => void;
  onStage: (file: string) => void;
  onStageAll: () => void;
  onCommit: () => void;
  onPush: () => void;
  onPull: () => void;
  onCheckout: (branch: string) => void;
  onCreateBranch: () => void;
  onSetRemote: () => void;
}

export const GitSidebar: React.FC<GitSidebarProps> = (props) => {
  return (
    <div className="github-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>SOURCE CONTROL</span>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button 
            className="add-file-btn" 
            onClick={props.onRefresh} 
            title="Refresh"
            disabled={props.gitLoading}
          >
            <i className={`fa-solid fa-rotate ${props.gitLoading ? 'fa-spin' : ''}`}></i>
          </button>
          <button 
            className="add-file-btn" 
            onClick={() => props.setShowGitClone(true)} 
            title="Clone Repository"
          >
            <i className="fa-solid fa-download"></i>
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
        {/* Current Branch */}
        <div className="git-section" style={{ marginBottom: '15px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '8px',
            background: '#2d2d30',
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-code-branch" style={{ color: '#00f2ff' }}></i>
              <span style={{ color: '#fff', fontSize: '13px' }}>{props.gitBranch}</span>
            </div>
            <button 
              className="add-file-btn" 
              onClick={() => props.setShowBranchCreate(true)}
              title="Create Branch"
              style={{ padding: '2px 6px' }}
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
          
          {/* Branch List */}
          {props.gitBranches.length > 0 && (
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '5px' }}>
              {props.gitBranches.slice(0, 5).map((branch, idx) => (
                <div 
                  key={idx}
                  onClick={() => !branch.current && props.onCheckout(branch.name)}
                  style={{ 
                    padding: '4px 8px',
                    cursor: branch.current ? 'default' : 'pointer',
                    background: branch.current ? '#1e1e1e' : 'transparent',
                    borderRadius: '3px',
                    marginBottom: '2px'
                  }}
                >
                  {branch.current && '* '}{branch.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Changes Section */}
        <div className="git-section" style={{ marginBottom: '15px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>
              Changes ({props.gitChanges.length})
            </span>
            {props.gitChanges.length > 0 && (
              <button 
                className="add-file-btn" 
                onClick={props.onStageAll}
                title="Stage All Changes"
                style={{ padding: '2px 6px', fontSize: '10px' }}
              >
                <i className="fa-solid fa-plus"></i> All
              </button>
            )}
          </div>
          
          {props.gitChanges.length === 0 ? (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#666',
              fontSize: '12px'
            }}>
              <i className="fa-solid fa-check-circle" style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}></i>
              No changes
            </div>
          ) : (
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {props.gitChanges.map((change, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 8px',
                    background: '#1e1e1e',
                    borderRadius: '3px',
                    marginBottom: '4px',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <span style={{ 
                      color: change.status.includes('M') ? '#ffa500' : 
                             change.status.includes('A') ? '#00ff00' : 
                             change.status.includes('D') ? '#ff0000' : '#fff',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {change.status}
                    </span>
                    <span style={{ color: '#ccc', fontSize: '11px' }}>{change.file}</span>
                  </div>
                  <button 
                    className="add-file-btn" 
                    onClick={() => props.onStage(change.file)}
                    title="Stage File"
                    style={{ padding: '2px 4px', fontSize: '9px' }}
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commit Section */}
        <div className="git-section" style={{ marginBottom: '15px' }}>
          <textarea
            placeholder="Commit message..."
            value={props.gitCommitMessage}
            onChange={(e) => props.setGitCommitMessage(e.target.value)}
            style={{
              width: '100%',
              minHeight: '60px',
              background: '#1e1e1e',
              border: '1px solid #333',
              borderRadius: '4px',
              color: '#fff',
              padding: '8px',
              fontSize: '12px',
              resize: 'vertical',
              marginBottom: '8px'
            }}
          />
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={props.onCommit}
              disabled={!props.gitCommitMessage.trim() || props.gitLoading}
              style={{
                flex: 1,
                background: '#238636',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                color: 'white',
                fontSize: '11px',
                cursor: props.gitCommitMessage.trim() ? 'pointer' : 'not-allowed',
                opacity: props.gitCommitMessage.trim() ? 1 : 0.5
              }}
            >
              <i className="fa-solid fa-check"></i> Commit
            </button>
          </div>
        </div>

        {/* Remote Settings Section */}
        <div className="git-section" style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '5px' }}>
            Remote Origin URL
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input 
              type="text" 
              placeholder="https://token@github.com/user/repo.git" 
              value={props.remoteUrl}
              onChange={(e) => props.setRemoteUrl(e.target.value)}
              style={{ 
                flex: 1, 
                background: '#1e1e1e', 
                border: '1px solid #333', 
                color: 'white', 
                fontSize: '11px', 
                padding: '4px 6px',
                borderRadius: '3px',
                outline: 'none'
              }} 
            />
            <button 
              onClick={props.onSetRemote}
              disabled={props.gitLoading}
              title="Set Remote"
              style={{ 
                background: '#333', 
                border: '1px solid #444', 
                color: 'white', 
                borderRadius: '3px', 
                cursor: 'pointer',
                width: '24px'
              }}
            >
              <i className="fa-solid fa-link"></i>
            </button>
          </div>
          <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
            <i>Tip: Use HTTPS with token for auth</i>
          </div>
        </div>

        {/* Sync Section (Push/Pull) */}
        <div className="git-section" style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button 
              onClick={props.onPull} 
              disabled={props.gitLoading} 
              style={{ 
                flex: 1, 
                background: '#0969da', 
                border: 'none', 
                borderRadius: '4px', 
                padding: '6px 12px', 
                color: 'white', 
                fontSize: '11px', 
                cursor: 'pointer' 
              }}
            >
              <i className="fa-solid fa-download"></i> Pull
            </button>
            <button 
              onClick={props.onPush} 
              disabled={props.gitLoading} 
              style={{ 
                flex: 1, 
                background: '#bc13fe', 
                border: 'none', 
                borderRadius: '4px', 
                padding: '6px 12px', 
                color: 'white', 
                fontSize: '11px', 
                cursor: 'pointer' 
              }}
            >
              <i className="fa-solid fa-upload"></i> Push
            </button>
          </div>
        </div>
        
        {/* Recent Commits */}
        {props.gitCommits.length > 0 && (
          <div className="git-section">
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>
              Recent Commits
            </div>
            {props.gitCommits.map((commit, idx) => (
              <div 
                key={idx}
                style={{ 
                  padding: '6px 8px',
                  background: '#1e1e1e',
                  borderRadius: '3px',
                  marginBottom: '4px',
                  fontSize: '11px'
                }}
              >
                <div style={{ color: '#00f2ff', marginBottom: '2px' }}>{commit.hash}</div>
                <div style={{ color: '#ccc' }}>{commit.message}</div>
              </div>
            ))}
          </div>
        )}

        {/* Initialize Git Button */}
        {props.gitChanges.length === 0 && props.gitCommits.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={props.onInit}
              disabled={props.gitLoading}
              style={{
                background: '#238636',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-code-branch"></i> Initialize Repository
            </button>
          </div>
        )}
      </div>

      {/* Clone Modal */}
      {props.showGitClone && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#2d2d30',
            padding: '20px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '14px' }}>Clone Repository</h3>
            <input
              type="text"
              placeholder="https://github.com/user/repo.git"
              value={props.gitCloneUrl}
              onChange={(e) => props.setGitCloneUrl(e.target.value)}
              style={{
                width: '100%',
                background: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#fff',
                padding: '8px',
                fontSize: '12px',
                marginBottom: '15px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { props.setShowGitClone(false); props.setGitCloneUrl(''); }}
                style={{
                  background: '#555',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  color: 'white',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={props.onClone}
                disabled={!props.gitCloneUrl.trim() || props.gitLoading}
                style={{
                  background: '#238636',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  color: 'white',
                  fontSize: '11px',
                  cursor: props.gitCloneUrl.trim() ? 'pointer' : 'not-allowed',
                  opacity: props.gitCloneUrl.trim() ? 1 : 0.5
                }}
              >
                Clone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Branch Modal */}
      {props.showBranchCreate && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#2d2d30',
            padding: '20px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '14px' }}>Create Branch</h3>
            <input
              type="text"
              placeholder="feature/new-feature"
              value={props.newBranchName}
              onChange={(e) => props.setNewBranchName(e.target.value)}
              style={{
                width: '100%',
                background: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#fff',
                padding: '8px',
                fontSize: '12px',
                marginBottom: '15px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { props.setShowBranchCreate(false); props.setNewBranchName(''); }}
                style={{
                  background: '#555',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  color: 'white',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={props.onCreateBranch}
                disabled={!props.newBranchName.trim() || props.gitLoading}
                style={{
                  background: '#238636',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  color: 'white',
                  fontSize: '11px',
                  cursor: props.newBranchName.trim() ? 'pointer' : 'not-allowed',
                  opacity: props.newBranchName.trim() ? 1 : 0.5
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};