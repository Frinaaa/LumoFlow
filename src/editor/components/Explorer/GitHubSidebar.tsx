import React, { useEffect, useState, useRef } from 'react';
import { useUserStore } from '../../../stores/userStore';
import { useGitOperations } from '../../hooks/useGitOperations';
import { useFileStore } from '../../stores/fileStore';
import { useGitStore } from '../../stores/gitStore';
import authService from '../../../services/authService';

export const GitHubSidebar: React.FC = () => {
    const { user } = useUserStore();
    const { workspacePath } = useFileStore();
    const {
        checkStatus,
        checkAheadBehind,
        cloneRepository,
        commitChanges,
        pushChanges,
        pullChanges,
        syncChanges,
        initRepo,
        publishToGitHub,
        hasRemoteOrigin,
        stageFile,
        unstageFile,
        discardFile,
        getHistory,
    } = useGitOperations();

    // Subscribe to gitStore
    const branch = useGitStore((state: any) => state.branch);
    const changes = useGitStore((state: any) => state.changes);
    const isRepo = useGitStore((state: any) => state.isRepo);
    const gitLoading = useGitStore((state: any) => state.loading);
    const pushing = useGitStore((state: any) => state.pushing);
    const pulling = useGitStore((state: any) => state.pulling);
    const ahead = useGitStore((state: any) => state.ahead);
    const behind = useGitStore((state: any) => state.behind);
    const lastSyncMessage = useGitStore((state: any) => state.lastSyncMessage);

    const [isConnected, setIsConnected] = useState(false);
    const [repositories, setRepositories] = useState<any[]>([]);
    const [loadingRepos, setLoadingRepos] = useState(false);

    const [gitRemotes, setGitRemotes] = useState<any[]>([]);
    const [loadingGitRemotes, setLoadingGitRemotes] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'source-control' | 'remotes'>('source-control');
    const [cloningRepo, setCloningRepo] = useState<string | null>(null);
    const [changesExpanded, setChangesExpanded] = useState(true);
    const [commitsExpanded, setCommitsExpanded] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const statusTimeout = useRef<any>(null);

    // Publish to GitHub modal state
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [publishRepoName, setPublishRepoName] = useState('');
    const [publishPrivate, setPublishPrivate] = useState(false);
    const [publishDescription, setPublishDescription] = useState('');
    const [publishing, setPublishing] = useState(false);
    const [hasRemote, setHasRemote] = useState(true); // optimistic default

    // Check GitHub connection
    useEffect(() => {
        const token = localStorage.getItem('github_token');
        if (token) {
            setIsConnected(true);
            fetchRepos(token);
        }

        if (isRepo) {
            fetchGitRemotes();
            checkAheadBehind();
            // Check if remote origin is configured
            hasRemoteOrigin().then(has => setHasRemote(has));
        }
    }, [user, isRepo]);

    // Auto-check when workspace opens
    useEffect(() => {
        if (workspacePath) {
            checkStatus();
        }
    }, [workspacePath]);

    // Fetch history when repo detected
    useEffect(() => {
        if (isRepo) {
            getHistory().then(commits => setHistory(commits || []));
        }
    }, [isRepo]);

    // Periodically check ahead/behind (every 60s, light fetch)
    useEffect(() => {
        if (!isRepo) return;
        const interval = setInterval(() => {
            checkAheadBehind();
        }, 60000);
        return () => clearInterval(interval);
    }, [isRepo]);

    // Show temporary status messages
    const showStatus = (msg: string, duration = 4000) => {
        setStatusMessage(msg);
        if (statusTimeout.current) clearTimeout(statusTimeout.current);
        statusTimeout.current = setTimeout(() => setStatusMessage(''), duration);
    };

    const fetchRepos = async (token: string) => {
        setLoadingRepos(true);
        try {
            const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=20', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const formatted = data.map((repo: any) => ({
                    id: repo.id,
                    name: repo.name,
                    description: repo.description,
                    stars: repo.stargazers_count,
                    url: repo.clone_url,
                    html_url: repo.html_url
                }));
                formatted.sort((a: any, b: any) => b.stars - a.stars);
                setRepositories(formatted);
            }
        } catch (error) {
            console.error('Failed to fetch repos:', error);
        } finally {
            setLoadingRepos(false);
        }
    };

    const fetchGitRemotes = async () => {
        if (!workspacePath || !(window as any).api?.gitRemote) return;

        setLoadingGitRemotes(true);
        try {
            const res = await (window as any).api.gitRemote({ action: 'list', repoPath: workspacePath });
            if (res.success) {
                const uniqueRemotes = Array.from(new Set(res.remotes.map((r: any) => r.name)))
                    .map(name => res.remotes.find((r: any) => r.name === name));
                setGitRemotes(uniqueRemotes);
            }
        } catch (error) {
            console.error('Failed to fetch git remotes:', error);
        } finally {
            setLoadingGitRemotes(false);
        }
    };

    const handleClone = async (repoUrl: string, repoId: string) => {
        setCloningRepo(repoId);
        const res = await cloneRepository(repoUrl);
        setCloningRepo(null);

        if (res.success) {
            showStatus('✅ Repository cloned successfully!');
        } else {
            alert('Clone failed: ' + res.error);
        }
    };

    const handleCommit = async () => {
        if (!commitMessage.trim()) {
            showStatus('⚠️ Please enter a commit message');
            return;
        }

        const res = await commitChanges(commitMessage);

        if (res.success) {
            setCommitMessage('');
            getHistory().then(commits => setHistory(commits || []));
            showStatus('✅ Changes committed locally!');
        } else {
            let errorMsg = (res as any).error || (res as any).message || 'Unknown error';
            if (errorMsg.includes('nothing to commit')) {
                showStatus('ℹ️ No changes to commit');
            } else if (errorMsg.includes('Author identity unknown') || errorMsg.includes('Please tell me who you are')) {
                showStatus('⚠️ Git identity not configured');
            } else {
                showStatus('❌ Commit failed: ' + errorMsg);
            }
        }
    };

    const handlePush = async () => {
        showStatus('⬆️ Pushing to remote...');
        const res = await pushChanges();

        if (res.success) {
            getHistory().then(commits => setHistory(commits || []));
            showStatus('✅ Pushed to remote successfully!');
            setHasRemote(true);
        } else if ((res as any).no_remote) {
            // No remote configured — prompt to publish
            showStatus('📦 No remote repository. Publish to GitHub to push your code.');
            // Auto-fill repo name from workspace folder name
            const folderName = workspacePath?.split(/[\\\/]/).pop() || 'my-repo';
            // Clean the name for GitHub (lowercase, no spaces, no special chars)
            const cleanName = folderName.replace(/[^a-zA-Z0-9-_.]/g, '-').replace(/--+/g, '-').toLowerCase();
            setPublishRepoName(cleanName);
            setPublishPrivate(false);
            setPublishDescription('');
            setShowPublishModal(true);
        } else {
            showStatus('❌ Push failed: ' + (res.error || ''));
        }
    };

    const handlePublish = async () => {
        if (!publishRepoName.trim()) {
            showStatus('⚠️ Please enter a repository name');
            return;
        }

        if (!isConnected) {
            showStatus('⚠️ Please sign in to GitHub first');
            setShowPublishModal(false);
            return;
        }

        setPublishing(true);
        showStatus('🚀 Publishing to GitHub...');

        const res = await publishToGitHub(publishRepoName.trim(), publishPrivate, publishDescription.trim());

        setPublishing(false);
        setShowPublishModal(false);

        if (res.success) {
            setHasRemote(true);
            getHistory().then(commits => setHistory(commits || []));
            fetchGitRemotes();
            showStatus('✅ Published to GitHub! 🎉');

            // Refresh repos list
            const token = localStorage.getItem('github_token');
            if (token) fetchRepos(token);
        } else {
            showStatus('❌ ' + (res.error || 'Failed to publish'));
        }
    };

    const handlePull = async () => {
        showStatus('⬇️ Pulling from remote...');
        const res = await pullChanges();

        if (res.success) {
            getHistory().then(commits => setHistory(commits || []));
            showStatus('✅ Pulled from remote successfully!');
        } else {
            showStatus('❌ Pull failed: ' + (res.error || ''));
        }
    };

    const handleSync = async () => {
        showStatus('🔄 Syncing changes...');
        const res = await syncChanges();

        if (res.success) {
            getHistory().then(commits => setHistory(commits || []));
            showStatus('✅ Synced successfully!');
        } else {
            showStatus('❌ Sync failed: ' + (res.error || ''));
        }
    };

    const handleInitRepo = async () => {
        const res = await initRepo();
        if (res.success) {
            showStatus('✅ Git repository initialized!');
        } else {
            showStatus('❌ Init failed: ' + (res.error || ''));
        }
    };

    const handleStageFile = async (file: string) => {
        await stageFile(file);
    };

    const handleDiscardFile = async (file: string) => {
        const confirmed = window.confirm(`Discard changes to "${file}"?\n\nThis cannot be undone.`);
        if (confirmed) {
            await discardFile(file);
            showStatus(`↩️ Discarded: ${file}`);
        }
    };

    const handleLogin = async () => {
        const clientId = 'Ov23liH24VR3ImiPJBlv';
        const redirectUri = 'http://localhost:3000/auth/github/callback';
        const scope = 'user,repo,gist';
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;

        try {
            // @ts-ignore
            await window.api.openExternalURL(authUrl);

            // @ts-ignore
            window.api.onAuthCallback('github', async (data: any) => {
                const { code, error } = data;
                // @ts-ignore
                window.api.removeAuthListener('github');

                if (error) {
                    console.error('GitHub login error:', error);
                    return;
                }

                if (code) {
                    try {
                        const res = await authService.githubOAuth(code);
                        if (res.success) {
                            setIsConnected(true);
                            const token = localStorage.getItem('github_token');
                            if (token) fetchRepos(token);
                            showStatus('✅ Connected to GitHub!');
                        }
                    } catch (e: any) {
                        console.error('Auth service error:', e);
                    }
                }
            });
        } catch (error) {
            console.error('Failed to open external URL:', error);
        }
    };

    const getStatusColor = (status: string) => {
        if (status.includes('M')) return '#e2c08d';
        if (status.includes('?') || status.includes('A')) return '#73c991';
        if (status.includes('D')) return '#c74e39';
        if (status.includes('R')) return '#4ec9b0';
        return '#cccccc';
    };

    const getStatusLetter = (status: string) => {
        if (status.includes('?')) return 'U';
        if (status.includes('A')) return 'A';
        if (status.includes('D')) return 'D';
        if (status.includes('R')) return 'R';
        return status.trim().charAt(0) || 'M';
    };

    const getStatusLabel = (status: string) => {
        if (status.includes('?')) return 'Untracked';
        if (status.includes('A')) return 'Added';
        if (status.includes('D')) return 'Deleted';
        if (status.includes('M')) return 'Modified';
        if (status.includes('R')) return 'Renamed';
        return 'Changed';
    };

    // State for the ellipsis menu
    const [showMenu, setShowMenu] = useState(false);

    // Close menu when clicking outside
    useEffect(() => {
        const closeMenu = () => setShowMenu(false);
        if (showMenu) {
            window.addEventListener('click', closeMenu);
        }
        return () => window.removeEventListener('click', closeMenu);
    }, [showMenu]);

    const handleRefresh = () => {
        checkStatus();
        if (isRepo) {
            getHistory().then(commits => setHistory(commits || []));
            fetchGitRemotes();
            checkAheadBehind();
            hasRemoteOrigin().then(has => setHasRemote(has));
        }
        const token = localStorage.getItem('github_token');
        if (token) fetchRepos(token);
        showStatus('🔄 Refreshed');
    };

    // Get sync button label
    const getSyncLabel = () => {
        if (ahead > 0 && behind > 0) return `${behind}↓ ${ahead}↑`;
        if (ahead > 0) return `${ahead}↑`;
        if (behind > 0) return `${behind}↓`;
        return '';
    };

    // VS Code Source Control View
    const renderSourceControl = () => (
        <div style={styles.container}>
            {/* STATUS MESSAGE BAR */}
            {statusMessage && (
                <div style={{
                    padding: '6px 16px',
                    fontSize: '11px',
                    color: statusMessage.includes('❌') ? '#f14c4c' :
                        statusMessage.includes('⚠️') ? '#cca700' :
                            statusMessage.includes('✅') ? '#73c991' : '#cccccc',
                    background: statusMessage.includes('❌') ? 'rgba(241,76,76,0.08)' :
                        statusMessage.includes('⚠️') ? 'rgba(204,167,0,0.08)' :
                            statusMessage.includes('✅') ? 'rgba(115,201,145,0.08)' : 'rgba(255,255,255,0.04)',
                    borderBottom: '1px solid #2b2b2b',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    {statusMessage}
                </div>
            )}

            {/* 1. SOURCE CONTROL HEADER */}
            <div style={{
                padding: '8px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#252526',
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#BBBBBB',
                letterSpacing: '0.5px',
                position: 'relative'
            }}>
                <span>SOURCE CONTROL</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title={`On branch: ${branch}`}>
                        <i className="fa-solid fa-code-branch" style={{ fontSize: '10px' }}></i>
                        <span>{branch}</span>
                    </div>

                    {/* Ahead/Behind Indicator */}
                    {(ahead > 0 || behind > 0) && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '10px',
                            color: '#888',
                            background: '#333',
                            padding: '1px 6px',
                            borderRadius: '8px'
                        }} title={`${ahead} ahead, ${behind} behind`}>
                            {behind > 0 && <span style={{ color: '#4fc1ff' }}>{behind}↓</span>}
                            {ahead > 0 && <span style={{ color: '#73c991' }}>{ahead}↑</span>}
                        </div>
                    )}

                    <div
                        style={{ marginLeft: '4px', cursor: 'pointer', padding: '2px 4px' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                    >
                        <i className="fa-solid fa-ellipsis"></i>
                    </div>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <div style={{
                            position: 'absolute',
                            top: '28px',
                            right: '8px',
                            background: '#1f1f1f',
                            border: '1px solid #454545',
                            borderRadius: '4px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                            zIndex: 100,
                            minWidth: '180px',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '4px 0'
                        }}>
                            <div style={styles.menuItem} onClick={handleRefresh}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <i className="fa-solid fa-arrows-rotate" style={{ width: '16px', textAlign: 'center' }}></i> Refresh
                            </div>
                            <div style={{ height: '1px', background: '#333', margin: '4px 0' }} />
                            <div style={styles.menuItem} onClick={handlePull}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <i className="fa-solid fa-arrow-down" style={{ width: '16px', textAlign: 'center', color: '#4fc1ff' }}></i>
                                Pull
                                {behind > 0 && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#4fc1ff' }}>{behind}</span>}
                            </div>
                            <div style={styles.menuItem} onClick={handlePush}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <i className="fa-solid fa-arrow-up" style={{ width: '16px', textAlign: 'center', color: '#73c991' }}></i>
                                Push
                                {ahead > 0 && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#73c991' }}>{ahead}</span>}
                            </div>
                            <div style={styles.menuItem} onClick={handleSync}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <i className="fa-solid fa-arrows-rotate" style={{ width: '16px', textAlign: 'center', color: '#bc13fe' }}></i> Sync Changes
                                {getSyncLabel() && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#888' }}>{getSyncLabel()}</span>}
                            </div>
                            <div style={{ height: '1px', background: '#333', margin: '4px 0' }} />
                            <div style={styles.menuItem} onClick={() => {
                                setShowMenu(false);
                                setCommitsExpanded(!commitsExpanded);
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <i className="fa-solid fa-clock-rotate-left" style={{ width: '16px', textAlign: 'center' }}></i> Show History
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. COMMIT INPUT AREA */}
            <div style={{ padding: '0 16px 12px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder={`Message (Ctrl+Enter to commit on "${branch}")`}
                        style={{
                            background: '#3c3c3c',
                            border: '1px solid #3c3c3c',
                            color: '#cccccc',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            padding: '8px',
                            resize: 'vertical',
                            borderRadius: '2px',
                            outline: '1px solid transparent',
                            minHeight: '68px'
                        }}
                        onFocus={(e) => e.target.style.outline = '1px solid #bc13fe'}
                        onBlur={(e) => e.target.style.outline = '1px solid transparent'}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                handleCommit();
                            }
                        }}
                    />

                    {/* Commit Button */}
                    <button
                        onClick={handleCommit}
                        disabled={gitLoading || changes.length === 0 || !commitMessage.trim()}
                        title={
                            changes.length === 0
                                ? 'No changes to commit'
                                : !commitMessage.trim()
                                    ? 'Enter a commit message'
                                    : 'Commit changes (Ctrl+Enter)'
                        }
                        style={{
                            background: (changes.length === 0 || !commitMessage.trim()) ? '#3c3c3c' : '#bc13fe',
                            color: (changes.length === 0 || !commitMessage.trim()) ? '#888888' : '#ffffff',
                            border: 'none',
                            padding: '8px 12px',
                            fontSize: '12px',
                            cursor: (changes.length === 0 || !commitMessage.trim()) ? 'not-allowed' : 'pointer',
                            borderRadius: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontWeight: 600,
                            width: '100%',
                            transition: 'background 0.2s, color 0.2s'
                        }}
                    >
                        {gitLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-check"></i>}
                        Commit
                    </button>

                    {/* Push / Pull / Sync Buttons Row */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {/* Pull Button */}
                        <button
                            onClick={handlePull}
                            disabled={pulling || pushing || gitLoading}
                            title={behind > 0 ? `Pull ${behind} commit(s) from remote` : 'Pull from remote'}
                            style={{
                                flex: 1,
                                background: pulling ? '#1a3a4a' : behind > 0 ? '#1a3a4a' : 'transparent',
                                border: '1px solid #3c3c3c',
                                borderRadius: '2px',
                                color: pulling ? '#4fc1ff' : behind > 0 ? '#4fc1ff' : '#cccccc',
                                padding: '6px 8px',
                                fontSize: '11px',
                                cursor: (pulling || pushing || gitLoading) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.2s',
                                fontWeight: behind > 0 ? 600 : 400,
                                opacity: (pushing || gitLoading) ? 0.5 : 1
                            }}
                        >
                            <i className={`fa-solid fa-arrow-down ${pulling ? 'fa-fade' : ''}`} style={{ fontSize: '10px' }}></i>
                            Pull
                            {behind > 0 && <span style={{
                                background: '#4fc1ff',
                                color: '#000',
                                fontSize: '9px',
                                padding: '0px 4px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                minWidth: '14px',
                                textAlign: 'center'
                            }}>{behind}</span>}
                        </button>

                        {/* Push / Publish Button */}
                        <button
                            onClick={handlePush}
                            disabled={pushing || pulling || gitLoading}
                            title={!hasRemote ? 'Publish to GitHub' : ahead > 0 ? `Push ${ahead} commit(s) to remote` : 'Push to remote'}
                            style={{
                                flex: 1,
                                background: pushing ? '#1a3a2a' : !hasRemote ? '#1a2a3a' : ahead > 0 ? '#1a3a2a' : 'transparent',
                                border: !hasRemote ? '1px solid #2d6da8' : '1px solid #3c3c3c',
                                borderRadius: '2px',
                                color: pushing ? '#73c991' : !hasRemote ? '#58a6ff' : ahead > 0 ? '#73c991' : '#cccccc',
                                padding: '6px 8px',
                                fontSize: '11px',
                                cursor: (pushing || pulling || gitLoading) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.2s',
                                fontWeight: (!hasRemote || ahead > 0) ? 600 : 400,
                                opacity: (pulling || gitLoading) ? 0.5 : 1
                            }}
                        >
                            {!hasRemote ? (
                                <>
                                    <i className={`fa-solid fa-cloud-arrow-up ${pushing ? 'fa-fade' : ''}`} style={{ fontSize: '10px' }}></i>
                                    Publish
                                </>
                            ) : (
                                <>
                                    <i className={`fa-solid fa-arrow-up ${pushing ? 'fa-fade' : ''}`} style={{ fontSize: '10px' }}></i>
                                    Push
                                    {ahead > 0 && <span style={{
                                        background: '#73c991',
                                        color: '#000',
                                        fontSize: '9px',
                                        padding: '0px 4px',
                                        borderRadius: '8px',
                                        fontWeight: 700,
                                        minWidth: '14px',
                                        textAlign: 'center'
                                    }}>{ahead}</span>}
                                </>
                            )}
                        </button>

                        {/* Sync Button */}
                        <button
                            onClick={handleSync}
                            disabled={pushing || pulling || gitLoading}
                            title="Sync Changes (Pull then Push)"
                            style={{
                                background: 'transparent',
                                border: '1px solid #3c3c3c',
                                borderRadius: '2px',
                                color: '#cccccc',
                                padding: '6px 8px',
                                fontSize: '11px',
                                cursor: (pushing || pulling || gitLoading) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.2s',
                                opacity: (pushing || pulling || gitLoading) ? 0.5 : 1
                            }}
                        >
                            <i className={`fa-solid fa-arrows-rotate ${(pushing || pulling) ? 'fa-spin' : ''}`} style={{ fontSize: '10px' }}></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. CHANGES LIST */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* Changes Collapsible Header */}
                <div style={{
                    padding: '4px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: changesExpanded ? 'rgba(255,255,255,0.04)' : 'transparent'
                }} onClick={() => setChangesExpanded(!changesExpanded)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', color: '#BBBBBB' }}>
                        <i className={`fa-solid fa-chevron-${changesExpanded ? 'down' : 'right'}`} style={{ fontSize: '10px' }}></i>
                        CHANGES
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {changes.length > 0 && (
                            <i className="fa-solid fa-plus"
                                title="Stage All Changes"
                                style={{ fontSize: '11px', color: '#888', cursor: 'pointer', padding: '2px' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Stage all by commit flow
                                    showStatus('💡 Use Commit to stage & commit all changes');
                                }}
                            ></i>
                        )}
                        <span style={{
                            background: changes.length > 0 ? '#bc13fe' : '#444444',
                            color: '#ffffff',
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '8px',
                            minWidth: '18px',
                            textAlign: 'center'
                        }}>{changes.length}</span>
                    </div>
                </div>

                {changesExpanded && (
                    <div style={{ marginTop: '0px' }}>
                        {changes.length === 0 ? (
                            <div style={{ padding: '8px 24px', fontSize: '12px', color: '#777', fontStyle: 'italic' }}>
                                No changes detected.
                            </div>
                        ) : (
                            changes.map((change: any, i: number) => (
                                <div
                                    key={i}
                                    className="git-change-item"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '3px 16px 3px 24px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        color: '#cccccc',
                                        transition: 'background 0.1s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#2a2d2e';
                                        const actions = e.currentTarget.querySelector('.file-actions') as HTMLElement;
                                        if (actions) actions.style.display = 'flex';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        const actions = e.currentTarget.querySelector('.file-actions') as HTMLElement;
                                        if (actions) actions.style.display = 'none';
                                    }}
                                >
                                    <span style={{
                                        color: getStatusColor(change.status),
                                        fontWeight: 'bold',
                                        fontSize: '11px',
                                        width: '14px',
                                        textAlign: 'center',
                                        flexShrink: 0
                                    }} title={getStatusLabel(change.status)}>
                                        {getStatusLetter(change.status)}
                                    </span>
                                    <span style={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        flex: 1,
                                        fontSize: '12px'
                                    }} title={change.file}>
                                        {change.file.split('/').pop() || change.file}
                                        <span style={{ color: '#888', marginLeft: '6px', fontSize: '11px' }}>
                                            {change.file.includes('/') ? change.file.substring(0, change.file.lastIndexOf('/')) : ''}
                                        </span>
                                    </span>
                                    <div className="file-actions" style={{ display: 'none', gap: '4px', flexShrink: 0 }}>
                                        <i className="fa-solid fa-arrow-rotate-left"
                                            title="Discard Changes"
                                            style={{ fontSize: '11px', color: '#ccc', cursor: 'pointer', padding: '2px' }}
                                            onClick={(e) => { e.stopPropagation(); handleDiscardFile(change.file); }}
                                        ></i>
                                        <i className="fa-solid fa-plus"
                                            title="Stage File"
                                            style={{ fontSize: '11px', color: '#ccc', cursor: 'pointer', padding: '2px' }}
                                            onClick={(e) => { e.stopPropagation(); handleStageFile(change.file); }}
                                        ></i>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* 5. COMMITS HISTORY SECTION */}
                <div style={{ marginTop: '4px' }}>
                    <div style={{
                        padding: '4px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#BBBBBB',
                        cursor: 'pointer',
                        background: commitsExpanded ? 'rgba(255,255,255,0.04)' : 'transparent'
                    }} onClick={() => setCommitsExpanded(!commitsExpanded)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <i className={`fa-solid fa-chevron-${commitsExpanded ? 'down' : 'right'}`} style={{ fontSize: '10px' }}></i>
                            COMMITS
                        </div>
                        <span style={{
                            background: '#444444',
                            color: '#ffffff',
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '8px',
                            minWidth: '18px',
                            textAlign: 'center'
                        }}>{history.length}</span>
                    </div>

                    {commitsExpanded && (
                        <div style={{ marginTop: '0px', paddingLeft: '0px' }}>
                            {history.length === 0 ? (
                                <div style={{ padding: '8px 24px', fontSize: '12px', color: '#777', fontStyle: 'italic' }}>
                                    No commits yet.
                                </div>
                            ) : (
                                history.map((commit: any, i) => (
                                    <div key={i} style={{
                                        padding: '6px 16px 6px 24px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '2px',
                                        borderLeft: '3px solid transparent',
                                        cursor: 'default'
                                    }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2d2e'; e.currentTarget.style.borderLeftColor = '#bc13fe'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent'; }}
                                    >
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#e0e0e0',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            fontWeight: 500
                                        }}>
                                            {commit.message}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontFamily: 'monospace', color: '#666' }}>{commit.hash.substring(0, 7)}</span>
                                            {i === 0 && <span style={{
                                                background: '#bc13fe33',
                                                color: '#bc13fe',
                                                padding: '0 4px',
                                                borderRadius: '3px',
                                                fontSize: '9px',
                                                fontWeight: 600
                                            }}>HEAD</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Remote Repositories View
    const renderRemotes = () => (
        <div style={styles.container}>
            {/* 1. GIT REMOTES SECTION */}
            {isRepo && (
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #333' }}>
                    <div style={{ ...styles.sectionTitle, marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>GIT REMOTES (LOCAL CONFIG)</span>
                        <i
                            className={`fa-solid fa-arrows-rotate ${loadingGitRemotes ? 'fa-spin' : ''}`}
                            style={{ cursor: 'pointer', color: '#888' }}
                            onClick={fetchGitRemotes}
                        ></i>
                    </div>

                    {loadingGitRemotes ? (
                        <div style={{ padding: '10px 0', textAlign: 'center', color: '#858585' }}>
                            <i className="fa-solid fa-spinner fa-spin"></i> Loading...
                        </div>
                    ) : gitRemotes.length === 0 ? (
                        <div style={{ padding: '10px 0', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                            No Git remotes configured.
                        </div>
                    ) : (
                        <div style={styles.repoList}>
                            {gitRemotes.map((remote: any) => (
                                <div key={remote.name} style={{ ...styles.repoItem, background: 'rgba(0, 242, 255, 0.05)' }}>
                                    <div style={styles.repoHeader}>
                                        <div style={styles.repoName}>
                                            <i className="fa-solid fa-code-branch" style={{ marginRight: '8px', color: '#00f2ff' }}></i>
                                            {remote.name}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#888', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {remote.url}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}


            {/* 3. GITHUB REPOSITORIES SECTION */}
            <div style={{ padding: '12px 20px' }}>
                <div style={{ ...styles.sectionTitle, marginBottom: '12px' }}>
                    GITHUB REPOSITORIES
                </div>

                {!isConnected ? (
                    <div style={styles.connectPrompt}>
                        <p style={{ marginBottom: '16px', color: '#858585' }}>
                            Connect your GitHub account to clone repositories
                        </p>
                        <button onClick={handleLogin} style={styles.primaryButton}>
                            <i className="fa-brands fa-github" style={{ marginRight: '8px' }}></i>
                            Sign in with GitHub
                        </button>
                    </div>
                ) : loadingRepos ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#858585' }}>
                        <i className="fa-solid fa-spinner fa-spin"></i> Loading repositories...
                    </div>
                ) : (
                    <div style={styles.repoList}>
                        {repositories.map((repo: any) => (
                            <div
                                key={repo.id}
                                style={styles.repoItem}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={styles.repoHeader}>
                                    <div style={styles.repoName}>
                                        <i className="fa-brands fa-github" style={{ marginRight: '8px', width: '16px', textAlign: 'center' }}></i>
                                        {repo.name}
                                    </div>
                                    <button
                                        onClick={() => handleClone(repo.url, repo.id)}
                                        disabled={cloningRepo !== null}
                                        style={{
                                            ...styles.cloneButton,
                                            opacity: cloningRepo && cloningRepo !== repo.id ? 0.5 : 1
                                        }}
                                    >
                                        {cloningRepo === repo.id ? (
                                            <i className="fa-solid fa-spinner fa-spin"></i>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-download" style={{ marginRight: '4px' }}></i>
                                                Clone
                                            </>
                                        )}
                                    </button>
                                </div>
                                {repo.description && (
                                    <div style={styles.repoDescription}>{repo.description}</div>
                                )}
                                <div style={styles.repoMeta}>
                                    <span>
                                        <i className="fa-solid fa-star" style={{ color: '#fbbf24', marginRight: '4px' }}></i>
                                        {repo.stars}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // No workspace open view
    const renderNoWorkspace = () => (
        <div style={{
            ...styles.container,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center'
        }}>
            <i className="fa-solid fa-folder-open" style={{ fontSize: '32px', color: '#555', marginBottom: '16px' }}></i>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>No folder open</p>
            <p style={{ color: '#666', fontSize: '12px' }}>Open a folder to use source control</p>
        </div>
    );

    // Not a git repo view
    const renderNotRepo = () => (
        <div style={{
            ...styles.container,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center'
        }}>
            <i className="fa-solid fa-code-branch" style={{ fontSize: '32px', color: '#555', marginBottom: '16px' }}></i>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '12px' }}>
                This folder is not a Git repository
            </p>
            <button
                onClick={handleInitRepo}
                disabled={gitLoading}
                style={{
                    background: '#bc13fe',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 20px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
            >
                {gitLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-plus"></i>}
                Initialize Repository
            </button>
            <p style={{ color: '#555', fontSize: '11px', marginTop: '16px' }}>
                Or clone a repository from the Remotes tab
            </p>
        </div>
    );

    return (
        <div style={styles.wrapper}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerTitle}>SOURCE CONTROL</div>
                <div style={styles.headerActions}>
                    {isRepo && (
                        <>
                            <i className="fa-solid fa-code-branch" style={{ marginRight: '6px', fontSize: '11px' }}></i>
                            <span style={{ fontSize: '11px' }}>{branch}</span>
                            {/* Sync indicator in header */}
                            {(ahead > 0 || behind > 0) && (
                                <span style={{
                                    fontSize: '10px',
                                    marginLeft: '6px',
                                    color: '#888',
                                    background: '#333',
                                    padding: '1px 5px',
                                    borderRadius: '6px'
                                }}>
                                    {behind > 0 && <span style={{ color: '#4fc1ff' }}>{behind}↓</span>}
                                    {ahead > 0 && behind > 0 && ' '}
                                    {ahead > 0 && <span style={{ color: '#73c991' }}>{ahead}↑</span>}
                                </span>
                            )}
                            {(pushing || pulling) && (
                                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '10px', marginLeft: '6px', color: '#bc13fe' }}></i>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Tabs (only show if repo is open) */}
            {(isRepo || workspacePath) && (
                <div style={styles.tabs}>
                    <div
                        onClick={() => setViewMode('source-control')}
                        style={{
                            ...styles.tab,
                            ...(viewMode === 'source-control' ? styles.tabActive : {})
                        }}
                    >
                        SOURCE CONTROL
                    </div>
                    <div
                        onClick={() => setViewMode('remotes')}
                        style={{
                            ...styles.tab,
                            ...(viewMode === 'remotes' ? styles.tabActive : {})
                        }}
                    >
                        REMOTES
                    </div>
                </div>
            )}

            {/* Content */}
            {!workspacePath
                ? renderNoWorkspace()
                : viewMode === 'remotes'
                    ? renderRemotes()
                    : isRepo
                        ? renderSourceControl()
                        : renderNotRepo()
            }

            {/* PUBLISH TO GITHUB MODAL */}
            {showPublishModal && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }} onClick={() => !publishing && setShowPublishModal(false)}>
                    <div style={{
                        background: '#1f1f1f',
                        border: '1px solid #454545',
                        borderRadius: '8px',
                        padding: '24px',
                        width: '100%',
                        maxWidth: '360px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <i className="fa-brands fa-github" style={{ fontSize: '20px', color: '#58a6ff' }}></i>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#e0e0e0' }}>Publish to GitHub</div>
                                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Create a new repository and push your code</div>
                            </div>
                        </div>

                        {/* Repo Name */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '6px' }}>Repository Name</label>
                            <input
                                type="text"
                                value={publishRepoName}
                                onChange={(e) => setPublishRepoName(e.target.value)}
                                placeholder="my-awesome-project"
                                autoFocus
                                style={{
                                    width: '100%',
                                    background: '#2d2d2d',
                                    border: '1px solid #3c3c3c',
                                    borderRadius: '4px',
                                    color: '#e0e0e0',
                                    fontSize: '13px',
                                    padding: '8px 10px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#58a6ff'}
                                onBlur={(e) => e.target.style.borderColor = '#3c3c3c'}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !publishing) handlePublish();
                                    if (e.key === 'Escape') setShowPublishModal(false);
                                }}
                            />
                        </div>

                        {/* Visibility Toggle */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '8px' }}>Visibility</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setPublishPrivate(false)}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        background: !publishPrivate ? '#1a3a2a' : '#2d2d2d',
                                        border: !publishPrivate ? '1px solid #73c991' : '1px solid #3c3c3c',
                                        borderRadius: '4px',
                                        color: !publishPrivate ? '#73c991' : '#aaa',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        fontWeight: !publishPrivate ? 600 : 400,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <i className="fa-solid fa-globe" style={{ fontSize: '11px' }}></i>
                                    Public
                                </button>
                                <button
                                    onClick={() => setPublishPrivate(true)}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        background: publishPrivate ? '#2a2a3a' : '#2d2d2d',
                                        border: publishPrivate ? '1px solid #bc13fe' : '1px solid #3c3c3c',
                                        borderRadius: '4px',
                                        color: publishPrivate ? '#bc13fe' : '#aaa',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        fontWeight: publishPrivate ? 600 : 400,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <i className="fa-solid fa-lock" style={{ fontSize: '11px' }}></i>
                                    Private
                                </button>
                            </div>
                        </div>

                        {/* Description (optional) */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '6px' }}>Description <span style={{ color: '#666' }}>(optional)</span></label>
                            <input
                                type="text"
                                value={publishDescription}
                                onChange={(e) => setPublishDescription(e.target.value)}
                                placeholder="A short description of your project"
                                style={{
                                    width: '100%',
                                    background: '#2d2d2d',
                                    border: '1px solid #3c3c3c',
                                    borderRadius: '4px',
                                    color: '#e0e0e0',
                                    fontSize: '12px',
                                    padding: '8px 10px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#58a6ff'}
                                onBlur={(e) => e.target.style.borderColor = '#3c3c3c'}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setShowPublishModal(false)}
                                disabled={publishing}
                                style={{
                                    flex: 1,
                                    padding: '8px 16px',
                                    background: 'transparent',
                                    border: '1px solid #3c3c3c',
                                    borderRadius: '4px',
                                    color: '#aaa',
                                    fontSize: '12px',
                                    cursor: publishing ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePublish}
                                disabled={publishing || !publishRepoName.trim()}
                                style={{
                                    flex: 1,
                                    padding: '8px 16px',
                                    background: publishing ? '#333' : '#58a6ff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: publishing ? '#888' : '#000',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: (publishing || !publishRepoName.trim()) ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                {publishing ? (
                                    <><i className="fa-solid fa-circle-notch fa-spin"></i> Publishing...</>
                                ) : (
                                    <><i className="fa-solid fa-cloud-arrow-up"></i> Publish</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// VS Code Styled Component Styles
const styles: { [key: string]: React.CSSProperties } = {
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#252526',
        color: '#cccccc',
        fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: '13px',
        position: 'relative'
    },
    header: {
        padding: '8px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #2b2b2b'
    },
    headerTitle: {
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.5px',
        color: '#bbbbbb',
        textTransform: 'uppercase'
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        color: '#cccccc'
    },
    tabs: {
        display: 'flex',
        borderBottom: '1px solid #2b2b2b',
        background: '#252526'
    },
    tab: {
        padding: '10px 20px',
        fontSize: '11px',
        cursor: 'pointer',
        color: '#858585',
        borderBottom: '2px solid transparent',
        transition: 'all 0.2s'
    },
    tabActive: {
        color: '#ffffff',
        borderBottomColor: '#bc13fe'
    },
    container: {
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden'
    },
    commitSection: {
        padding: '12px 20px',
        borderBottom: '1px solid #2b2b2b'
    },
    commitInput: {
        width: '100%',
        background: '#3c3c3c',
        border: '1px solid #3c3c3c',
        borderRadius: '2px',
        color: '#cccccc',
        fontSize: '13px',
        padding: '8px',
        marginBottom: '8px',
        outline: 'none',
        fontFamily: 'inherit',
        boxSizing: 'border-box'
    },
    commitActions: {
        display: 'flex',
        gap: '4px'
    },
    commitButton: {
        flex: 1,
        background: '#bc13fe',
        border: 'none',
        borderRadius: '2px',
        color: '#ffffff',
        padding: '6px 12px',
        fontSize: '13px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    syncButton: {
        background: '#3c3c3c',
        border: '1px solid #3c3c3c',
        borderRadius: '2px',
        color: '#cccccc',
        padding: '6px 12px',
        cursor: 'pointer'
    },
    moreButton: {
        background: '#3c3c3c',
        border: '1px solid #3c3c3c',
        borderRadius: '2px',
        color: '#cccccc',
        padding: '6px 12px',
        cursor: 'pointer'
    },
    section: {
        marginTop: '1px'
    },
    sectionHeader: {
        padding: '6px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none'
    },
    sectionTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.5px',
        color: '#bbbbbb',
        textTransform: 'uppercase' as const
    },
    primaryButton: {
        background: '#bc13fe',
        border: 'none',
        borderRadius: '4px',
        color: '#ffffff',
        padding: '8px 16px',
        fontSize: '13px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600
    },
    connectPrompt: {
        padding: '20px',
        textAlign: 'center' as const
    },
    repoList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2px'
    },
    repoItem: {
        padding: '10px 12px',
        borderRadius: '4px',
        transition: 'background 0.1s',
        cursor: 'pointer'
    },
    repoHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%'
    },
    repoName: {
        fontSize: '13px',
        fontWeight: 500,
        color: '#cccccc',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flex: 1
    },
    repoDescription: {
        fontSize: '11px',
        color: '#888',
        marginTop: '4px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const
    },
    repoMeta: {
        fontSize: '11px',
        color: '#888',
        marginTop: '6px',
        display: 'flex',
        gap: '12px'
    },
    cloneButton: {
        background: '#bc13fe',
        border: 'none',
        borderRadius: '3px',
        color: '#fff',
        padding: '4px 10px',
        fontSize: '11px',
        cursor: 'pointer',
        fontWeight: 600,
        flexShrink: 0,
        marginLeft: '8px'
    },
    menuItem: {
        padding: '6px 16px',
        fontSize: '13px',
        color: '#cccccc',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background 0.1s'
    },
    secondaryButton: {
        background: 'transparent',
        border: '1px solid #3c3c3c',
        borderRadius: '2px',
        color: '#cccccc',
        padding: '6px 12px',
        fontSize: '11px',
        cursor: 'pointer',
        marginTop: '8px'
    }
};
